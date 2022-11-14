const fundRouther = require('koa-router')();
const bcrypt = require("bcrypt")
const jsonwebtoken = require('jsonwebtoken');

const config = require('../../config/appConfig')
const db = require('../../models')

let FundCtl = {
    updateNAV: async function () {
        const funds = await db.Fund.findAll();
        updateList = []
        for (var i = 0; i < funds.length; i++) {
            const fund = funds[i];
            const newVal = Math.random() * 10
            updateList.push({FundId:fund.id, Value: newVal})
        }
        await db.FundNAV.bulkCreate(updateList);
    },
    buyFund: async function(userId, fundId, unit){
        const funds = await FundCtl.getFundById(fundId);
        const fund = funds[0][0];
        
        // TODO: duplicate code
        const account =  await db.Account.findOne({ where: { UserId: userId, Currency: fund.Currency} });
        const cost = fund.Value*unit*(1+fund.Fee/100.)
        if (!account || account.Balance < cost){
            throw new Error(
                `Insufficient Balance. ${fund.Value}*${unit}*${(1+fund.Fee/100.)}=${cost}.\n`+
                `Current account balance ${account? account.Balance:0} (currency: ${fund.Currency})`);
        }

        const fundInvestment = await db.FundInvestment.findOrCreate({ 
            where: { UserId: userId, FundId: fundId },
            defaults: {
                UserId: userId,
                FundId: fundId,
            }});
        
        const result = await db.sequelize.transaction(async (t) => {
            const fundDeliveryLog = await db.FundDeliveryLog.create({
                UserId: userId,
                FundId: fundId,
                Price: cost,
                Status: 
            }, { transaction: t });
            const updateAccount = await db.Account.update(
                { Balance: account.Balance - money }, 
                { where: { id: account.id }, transaction: t})
        });
    },
    getFundById: async function(id=null){
        whereStr = ""
        if (id!==null){
            whereStr = ` WHERE F.id = ${id} `
        }
        sqlStatement = " SELECT F.Name, F.Currency, FundId, value, F.Fee, max(CreateTime) "+
        " from FundNAVs left join "+
        " (select Funds.id, Name, Currency, Fee from Funds "+
        " left join FundTypes on FundTypes.id = Funds.FundTypeId) as F on  F.id = FundNAVs.FundId "+
        ` ${whereStr} group by FundId;`
        
        const funds = await db.sequelize.query(sqlStatement);
        return funds;
    }
};

fundRouther
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

        try{
            const updateNAV = await FundCtl.updateNAV()
            ctx.status = 200;
            ctx.body = { message: "updated" };
        }catch(err){
            ctx.status = 500;
            ctx.body = { error: err.originalError ? err.originalError.message : err.message }
        }
    })
    .get('/fund/getList', async (ctx, next) => {
        try{
            const funds = await FundCtl.getFundById();
            ctx.status = 200;
            ctx.body = JSON.stringify(funds);
        }catch(err){
            ctx.status = 500;
            ctx.body = { error: err.originalError ? err.originalError.message : err.message }
        }
    })
    .post('/fund/buy', async (ctx, next) => {
        // TODO: reuse function
        const tokenStr = ctx.header.authorization.split(' ')[1]
        const decoded = await jsonwebtoken.verify(tokenStr, config.secret);
        
        await FundCtl.buyFund(decoded.data.userId, ctx.request.body.fundId, ctx.request.body.unit)
        ctx.status = 200;
        ctx.body = 'done.'
        // ctx.request.body.fundId
        // try{
        //     const updateNAV = await FundCtl.updateNAV()
        //     ctx.status = 200;
        //     ctx.body = { message: "updated" };
        // }catch(err){
        //     ctx.status = 500;
        //     ctx.body = { error: err.originalError ? err.originalError.message : err.message }
        // }
    });


module.exports = { fundRouther, FundCtl };
