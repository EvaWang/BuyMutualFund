// deposit
// draw
const accountRouter = require('koa-router')();
const jsonwebtoken = require('jsonwebtoken');

const config = require('../../config/appConfig')
const db = require('../../models')

let AccountCtl = {
    deposit: async function (userId, money, currency) {
        /*
        sqlite does not support temporary variable. Also, this statement affect nothing. 
        Not sure it is because the sqlite version or anything else.
        createStatement = `BEGIN TRANSACTION;
        INSERT OR REPLACE INTO Accounts (UserId, Currency, UpdateTime) \
        VALUES (${userId}, ${currency}, ${Date.now()});\
        INSERT INTO AccountLogs (AccountId, Value) \
        VALUES ((SELECT id FROM Accounts WHERE UserId=${userId} AND Currency=${currency}), ${money}); \
        UPDATE Accounts SET Balance = Balance+${money} WHERE UserId=${userId} AND Currency=${currency};
        COMMIT;`
        */

        try {
            const result = await db.sequelize.transaction(async (t) => {
                const [account, created] = await db.Account.findOrCreate({
                    where: { UserId: userId, Currency: currency },
                    defaults: { UserId: userId, Currency: currency },
                    transaction: t
                });
                const accountLog = await db.AccountLog.create({
                    AccountId: account.id,
                    Value: money,
                }, { transaction: t });
                const updateAccount = await db.Account.update(
                    { Balance: account.Balance + money }, 
                    { where: { id: account.id }, transaction: t})
            });
            return result;
            // If the execution reaches this line, the transaction has been committed successfully
            // `result` is whatever was returned from the transaction callback (the `user`, in this case)

        } catch (error) {
            // If the execution reaches this line, an error occurred.
            // The transaction has already been rolled back automatically by Sequelize!
            throw error;
        }
    },
    draw: async function (userId, money, currency) {
        // check remain
        const account =  await db.Account.findOne({ where: { UserId: userId, Currency: currency } });
        if (!account || account.Balance<money){
            console.log('error')
            throw new Error("Insufficient Balance");
        }

        try {
            const result = await db.sequelize.transaction(async (t) => {
                const accountLog = await db.AccountLog.create({
                    AccountId: account.id,
                    Value: -money,
                }, { transaction: t });
                const updateAccount = await db.Account.update(
                    { Balance: account.Balance - money }, 
                    { where: { id: account.id }, transaction: t})
            });
            return result;
            // If the execution reaches this line, the transaction has been committed successfully
            // `result` is whatever was returned from the transaction callback (the `user`, in this case)

        } catch (error) {
            // If the execution reaches this line, an error occurred.
            // The transaction has already been rolled back automatically by Sequelize!
            throw error;
        }
    }
}

accountRouter
    .post('/account/deposit', async (ctx, next) => {
        // TODO: reuse function
        const tokenStr = ctx.header.authorization.split(' ')[1]
        const decoded = await jsonwebtoken.verify(tokenStr, config.secret);

        if (!ctx.request.body.money ||
            !ctx.request.body.currency) {
            ctx.status = 400;
            ctx.body = {
                error: 'expected an object with money and currency.'
            }
            return;
        }
        try {
            const res = await AccountCtl.deposit(decoded.data.userId, ctx.request.body.money, ctx.request.body.currency)
            ctx.status = 200;
            ctx.body = `${ctx.request.body.money} saved.`;
            // ctx.body = JSON.stringify(res);
        } catch (err) {
            ctx.status = 400;
            ctx.body = err
            // ctx.body = { error: err.originalError ? err.originalError.message : err.message }
            return;
        }
    })
    .post('/account/draw', async (ctx, next) => {
        // TODO: reuse function
        const tokenStr = ctx.header.authorization.split(' ')[1]
        const decoded = await jsonwebtoken.verify(tokenStr, config.secret);

        if (!ctx.request.body.money ||
            !ctx.request.body.currency) {
            ctx.status = 400;
            ctx.body = {
                error: 'expected an object with money and currency.'
            }
            return;
        }
        try {
            const res = await AccountCtl.draw(decoded.data.userId, ctx.request.body.money, ctx.request.body.currency)
            ctx.status = 200;
            ctx.body = `${ctx.request.body.money} drew.`;
        } catch (err) {
            ctx.status = 400;
            ctx.body = { error: err.originalError ? err.originalError.message : err.message }
            return;
        }
    });

module.exports = { accountRouter, AccountCtl };
