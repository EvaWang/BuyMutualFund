const fundRouter = require('koa-router')();
const jsonwebtoken = require('jsonwebtoken');
var moment = require('moment');

const config = require('../../config/appConfig')
const db = require('../../models')
const { UserCtl } = require('./user')

function checkWorkingHour() {
    // trading hour 9~14
    let dayStart = moment().startOf('day').set('hour', 9);
    let dayEnd = moment().startOf('day').set('hour', 14);
    let currentTime = moment()
    console.log(dayStart)
    console.log(dayEnd)
    console.log(currentTime)
    return currentTime.diff(dayStart) > 0 && currentTime.diff(dayEnd) < 0
}

const TradingStatus = {
    Pending: 1,
    Fulfilled: 2,
    Failed: 3,
    TransactionDone: 4,
}

let FundCtl = {
    updateNAV: async function () {
        const funds = await db.Fund.findAll();
        updateList = []
        for (let i = 0; i < funds.length; i++) {
            const fund = funds[i];
            const newVal = Math.random() * 10
            updateList.push({ FundId: fund.id, Value: newVal })
        }
        await db.FundNAV.bulkCreate(updateList);
    },
    buyFund: async function (userId, fundId, unit, status = null) {
        // 1: to be fulfill, 2: fulfilled, 3: failed
        status = status ? status : (checkWorkingHour() ? TradingStatus.Fulfilled : TradingStatus.Pending);

        const funds = await FundCtl.getFundById(fundId);
        const fund = funds[0][0];

        // TODO: duplicate code
        const account = await db.Account.findOne({ where: { UserId: userId, Currency: fund.Currency } });
        const cost = fund.Value * unit * (1 + fund.Fee / 100.)
        if (!account || account.Balance < cost) {
            await db.FundDeliveryLog.create({
                UserId: userId,
                FundId: fundId,
                Unit: unit,
                Status: TradingStatus.Failed
            });

            throw new Error(
                `Insufficient Balance. ${fund.Value}*${unit}*${(1 + fund.Fee / 100.)}=${cost}.\n` +
                `Current account balance ${account ? account.Balance : 0} (currency: ${fund.Currency})`);
        }

        // TODO: actually, it can be simplify when creating a user, fund investment account and deposit account should also be created.
        //       however, the db schema have to be re-desiged, too.
        console.log(`userId: ${userId},fundId:${fundId}`)
        const [investmentInit, created] = await db.FundInvestment.findOrCreate({
            where: { UserId: userId, FundId: fundId },
            defaults: {
                UserId: userId,
                FundId: fundId,
            }
        });

        await db.sequelize.transaction(async (t) => {
            await db.FundDeliveryLog.create({
                UserId: userId,
                FundId: fundId,
                Unit: unit,
                Status: status
            }, { transaction: t });

            if (status === 2) {
                // duplicate code
                await db.FundInvestment.update(
                    { TotalUnit: investmentInit.TotalUnit + unit },
                    { where: { id: investmentInit.id }, transaction: t })
                await db.AccountLog.create({
                    AccountId: account.id,
                    Value: -cost,
                }, { transaction: t });
                await db.Account.update(
                    { Balance: account.Balance - cost },
                    { where: { id: account.id }, transaction: t })
            }
        });
        return status;
    },
    sellFund: async function (userId, fundId, unit, status = null) {
        const fundInvestment = await db.FundInvestment.findOne({ where: { UserId: userId, FundId: fundId } })
        status = status ? status : (checkWorkingHour() ? TradingStatus.Fulfilled : TradingStatus.Pending);

        const funds = await FundCtl.getFundById(fundId);
        const fund = funds[0][0];
        const earn = fund.Value * unit * (1 - fund.Fee / 100.)

        if (!fundInvestment || fundInvestment.TotalUnit<unit){
            await db.FundDeliveryLog.create({ 
                    UserId: userId,
                    FundId: fundId,
                    Unit: -unit,
                    Status: TradingStatus.Failed, 
                    Memo: "Selling more than you have." 
                })
            throw new Error("Selling more than you have.")
        }

        const account = await db.Account.findOne({ where: { UserId: userId, Currency: fund.Currency } });
        await db.sequelize.transaction(async (t) => {
            await db.FundDeliveryLog.create({
                UserId: userId,
                FundId: fundId,
                Unit: -unit,
                Status: status
            }, { transaction: t });
    
            if (status === 2){
                // duplicate code
                await db.FundInvestment.update(
                    { TotalUnit: fundInvestment.TotalUnit - unit },
                    { where: { id: fundInvestment.id }, transaction: t })
                await db.AccountLog.create({
                    AccountId: account.id,
                    Value: earn,
                }, { transaction: t });
                await db.Account.update(
                    { Balance: account.Balance + earn },
                    { where: { id: account.id }, transaction: t })
            }
        });

        return (status === TradingStatus.Fulfilled)?{Balance: (account.Balance + earn), Currency: account.Currency}:{Status: "Pending"}
    },
    getFundById: async function (id = null) {
        whereStr = ""
        if (id !== null) {
            whereStr = ` WHERE F.id = ${id} `
        }
        sqlStatement = " SELECT F.Name, F.Currency, FundId, value, F.Fee, max(CreateTime) " +
            " from FundNAVs left join " +
            " (select Funds.id, Name, Currency, Fee from Funds " +
            " left join FundTypes on FundTypes.id = Funds.FundTypeId) as F on  F.id = FundNAVs.FundId " +
            ` ${whereStr} group by FundId;`

        const funds = await db.sequelize.query(sqlStatement);
        return funds;
    },
    fulfillBatch: async function () {
        sqlStatement =
            " select funddeliverylogs.*, accounts.id as AccountId, accounts.balance, fundtypes.Fee, accounts.currency, nav.value as nav from funddeliverylogs " +
            " left join funds on funds.id = funddeliverylogs.fundid " +
            " left join accounts on accounts.userid = funddeliverylogs.userid and funds.currency = accounts.currency " +
            " left join (select fundid, value , max(CreateTime) from fundnavs group by fundid) as nav on funds.id = nav.fundid " +
            " left join fundtypes on fundtypes.id = funds.fundtypeid "+
            " where funddeliverylogs.status = 1; ";

        let toBeFulfilled = await db.sequelize.query(sqlStatement);
        toBeFulfilled = toBeFulfilled[0]
        for (let i = 0; i < toBeFulfilled.length; i++) {
            let item = toBeFulfilled[i];
            await FundCtl.fulfill(item)
        }
    },
    fulfill: async function (item) {
        const result = await db.sequelize.transaction(async (t) => {
            const fundInvestment = await db.FundInvestment.findOne({ where: { UserId: item.UserId, FundId: item.FundId } })

            cost = item.nav * item.Unit * (1-item.Fee/100)
            
            if (cost > item.Balance) {
                await db.FundDeliveryLog.update(
                    { Status: TradingStatus.Failed, Memo: "Account balance lower than cost." },
                    { where: { id: item.id }, transaction: t })
                return;
            }

            if (cost<0 && fundInvestment.TotalUnit<item.Unit){
                await db.FundDeliveryLog.update(
                    { Status: TradingStatus.Failed, Memo: "Selling more than you have." },
                    { where: { id: item.id }, transaction: t })
                return;
            }

            await db.FundDeliveryLog.update(
                { Status: TradingStatus.TransactionDone },
                { where: { id: item.id }, transaction: t })

            await db.FundDeliveryLog.create({
                UserId: item.UserId,
                FundId: item.FundId,
                Unit: item.Unit,
                Status: TradingStatus.Fulfilled
            }, { transaction: t });

            // duplicate code
            await db.FundInvestment.update(
                { TotalUnit: fundInvestment.TotalUnit + item.Unit },
                { where: { id: fundInvestment.id }, transaction: t })
            await db.AccountLog.create({
                AccountId: item.AccountId,
                Value: -cost,
            }, { transaction: t });
            await db.Account.update(
                { Balance: item.Balance - cost },
                { where: { id: item.AccountId }, transaction: t })
        });
        return result;
    }
};

fundRouter
/**
   * @swagger
   * /fund/updateNAV:
   *   post:
   *     description: (Admin Only) update NAV. 
   *     tags: [fund]
   *     produces:
   *       - application/json
   *     parameters:

   *     responses:
   *       200:
   *         description: updated.
   *       500:
   *         description: unexpected error
   */   
    .post('/fund/updateNAV', async (ctx, next) => {
        // TODO: reuse function
        const tokenStr = ctx.header.authorization.split(' ')[1]
        const decoded = await jsonwebtoken.verify(tokenStr, config.secret);

        if (decoded.data.isSuperUser !== 1) {
            ctx.status = 401;
            ctx.body = {
                error: 'Admin Only.'
            }
            return;
        }

        try {
            await FundCtl.updateNAV()
            ctx.status = 200;
            ctx.body = { message: "updated" };
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: err.originalError ? err.originalError.message : err.message }
        }
    })
/**
   * @swagger
   * /fund/getList:
   *   get:
   *     description: get fund list.
   *     tags: [fund]
   *     produces:
   *       - application/json
   *     parameters:

   *     responses:
   *       200:
   *         description: return fund list.
   *       500:
   *         description: unexpected error
   */   
    .get('/fund/getList', async (ctx, next) => {
        try {
            const funds = await FundCtl.getFundById();
            ctx.status = 200;
            ctx.body = JSON.stringify(funds[0]);
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: err.originalError ? err.originalError.message : err.message }
        }
    })
/**
   * @swagger
   * /fund/buy:
   *   post:
   *     description: buy funds.
   *     tags: [fund]
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: fundId
   *         description: which fund
   *         required: true
   *         type: integer
   *       - name: unit
   *         description: quantity
   *         required: true
   *         type: integer
   *     responses:
   *       200:
   *         description: (in working hours)bought / (order enqueue)pending
   *       400:
   *         description: lack for required params / balance insufficient 
   *       500:
   *         description: unexpected error
   */   
    .post('/fund/buy', async (ctx, next) => {
        // TODO: reuse function
        const tokenStr = ctx.header.authorization.split(' ')[1]
        const decoded = await jsonwebtoken.verify(tokenStr, config.secret);

        try {
            // duplicate code
            let user = await UserCtl.getUserById(decoded.data.userId);
            const agreement = await UserCtl.checkAgreementSigned()
            if (user.AuthStatus !== agreement.id) {
                throw new Error("You have not signed the latest agreement yet. Agreement Title: " + agreement.Title);
            }

            const status = await FundCtl.buyFund(decoded.data.userId, ctx.request.body.fundId, ctx.request.body.unit)
            ctx.status = 200;
            ctx.body = `done. status: ${status} (1: pending, 2: fulfilled).`
        } catch (err) {
            // throw new Error(err)
            ctx.status = 400;
            ctx.body = { error: err.originalError ? err.originalError.message : err.message }
        }
    })
/**
   * @swagger
   * /fund/sell:
   *   post:
   *     description: sell funds.
   *     tags: [fund]
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: fundId
   *         description: which fund
   *         required: true
   *         type: integer
   *       - name: unit
   *         description: quantity
   *         required: true
   *         type: integer
   *     responses:
   *       200:
   *         description: (in working hours)sold / (order enqueue)pending
   *       400:
   *         description: lack for required params / sell more than inventory
   *       500:
   *         description: unexpected error
   */       
    .post('/fund/sell', async (ctx, next) => {
        // TODO: reuse function
        const tokenStr = ctx.header.authorization.split(' ')[1]
        const decoded = await jsonwebtoken.verify(tokenStr, config.secret);

        try {
            const res = await FundCtl.sellFund(decoded.data.userId, ctx.request.body.fundId, ctx.request.body.unit)
            ctx.status = 200;
            ctx.body = res
        } catch (err) {
            // throw new Error(err)
            ctx.status = 400;
            ctx.body = { error: err.originalError ? err.originalError.message : err.message }
        }
    })
/**
   * @swagger
   * /fund/fulfill:
   *   post:
   *     description: (Admin Only) deal with pending orders
   *     tags: [fund]
   *     produces:
   *       - application/json
   *     parameters:
   *
   *     responses:
   *       200:
   *         description: all done.
   *       500:
   *         description: unexpected error
   */       
    .post('/fund/fulfill', async (ctx, next) => {
        // TODO: reuse function
        const tokenStr = ctx.header.authorization.split(' ')[1]
        const decoded = await jsonwebtoken.verify(tokenStr, config.secret);

        if (decoded.data.isSuperUser !== 1) {
            ctx.status = 401;
            ctx.body = {
                error: 'Admin Only.'
            }
            return;
        }

        try {
            await FundCtl.fulfillBatch()
            ctx.status = 200;
            ctx.body = 'done.'
        } catch (err) {
            // throw new Error(err)
            ctx.status = 500;
            ctx.body = { error: err.originalError ? err.originalError.message : err.message }
        }

    });

module.exports = { fundRouter, FundCtl };
