const userRouter = require('koa-router')();
const bcrypt = require("bcrypt")
const jsonwebtoken = require('jsonwebtoken');

const config = require('../../config/appConfig')
const db = require('../../models')

let UserCtl = {
    createUser: async function (userData) {
        userData.salt = await bcrypt.genSalt(config.saltRounds);
        userData.password = await bcrypt.hashSync(userData.password, userData.salt);
        const newUser = await db.User.create({
            UserName: userData.username,
            Password: userData.password,
            IsSuperUser: userData.isSuperUser || 0
        });
        return newUser
    },
    getUserByName: async function (username) {
        const user = await db.User.findOne({ where: { UserName: username } });
        return user;
    },
    getUserById: async function (id) {
        const user = await db.User.findOne({ where: { id: id } });
        return user;
    },
    checkAgreementSigned: async function () {
        const [results, metadata] = await db.sequelize.query("Select * From Agreements ORDER BY CreateTime DESC LIMIT 1;");
        if (results.length === 0) {
            return null
        } else {
            return results[0]
        }
    },
};

/**
   * @swagger
   * /public/register:
   *   post:
   *     description: lgoin
   *     tags: [auth]
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: password
   *         description: password
   *         required: true
   *         type: string
   *       - name: username
   *         description: each username is unique.
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: login
   *       400:
   *         description: required params
   *       500:
   *         description: unexpected error
   */
userRouter
    .post('/public/register', async (ctx, next) => {
        userData = {
            "username": ctx.request.body.username,
            "password": ctx.request.body.password,
            "salt": ""
        }

        if (!userData.username ||
            !userData.password) {
            ctx.status = 400;
            ctx.body = {
                error: 'expected an object with username and password.'
            }
            return;
        }

        const existingUser = await UserCtl.getUserByName(userData.username);
        if (existingUser !== null) {
            ctx.status = 406;
            ctx.body = { error: "User exists" }
            return;
        }

        const newUser = await UserCtl.createUser(userData)
        ctx.status = 200;
        ctx.body = { message: "success. user:" + newUser.UserName + ", create time: " + new Date(newUser.UpdateTime) };
        next();
    })
/**
   * @swagger
   * /public/login:
   *   post:
   *     description: lgoin
   *     tags: [auth]
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: password
   *         description: password
   *         required: true
   *         type: string
   *       - name: username
   *         description: each username is unique.
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: login
   *       400:
   *         description: lack for required params
   *       500:
   *         description: unexpected error
   */
    .post('/public/login', async (ctx, next) => {

        let user = await UserCtl.getUserByName(ctx.request.body.username);
        if (user === null) {
            ctx.status = 401;
            ctx.body = { error: "user not found." }
            return;
        }

        const checkPwd = await bcrypt.compare(ctx.request.body.password, user.Password)
        if (!checkPwd) {
            ctx.status = 401;
            ctx.body = {
                error: "wrong password"
            }
            return;
        }

        ctx.body = {
            token: jsonwebtoken.sign(
                { data: { userId: user.id, username: user.UserName, isSuperUser: user.IsSuperUser } },
                config.secret,
                { expiresIn: '2h' })
        }
        next();
    })
/**
   * @swagger
   * /user/get:
   *   get:
   *     description: get user info
   *     tags: [user]
   *     produces:
   *       - application/json
   *     parameters:
   *
   *     responses:
   *       200:
   *         description: user info, accounts and bought funds.
   *       500:
   *         description: unexpected error
   */
    .get('/user/get', async (ctx, next) => {
        // TODO: show account balance
        const tokenStr = ctx.header.authorization.split(' ')[1]
        const decoded = await jsonwebtoken.verify(tokenStr, config.secret);

        try {
            const user = await UserCtl.getUserById(decoded.data.userId);
            if (!user) {
                throw new Error("Invalid usre.")
            }

            const accounts = await db.Account.findAll({
                where: { UserId: user.id }
            });

            qryBoughtFunds = " select funds.name, funds.currency, fundinvestments.TotalUnit, " +
                " nav.value,(nav.value*fundinvestments.TotalUnit) as currentVal from fundinvestments " +
                " left join funds on fundinvestments.fundid = funds.id " +
                " left join (select fundid, value , max(CreateTime) from fundnavs group by fundid) as nav on funds.id = nav.fundid " +
                ` where fundinvestments.userid = ${user.id} ;`
            const funds = await db.sequelize.query(qryBoughtFunds);

            ctx.status = 200;
            ctx.body = {
                User: { Name: user.UserName, AuthStatus: user.AuthStatus },
                Accounts: accounts,
                Funds: funds[0]
            }
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: err.originalError ? err.originalError.message : err.message }
            return;
        }

    })
/**
   * @swagger
   * /user/checkAgreement:
   *   get:
   *     description: is the latest agreemnt signed?
   *     tags: [user]
   *     produces:
   *       - application/json
   *     parameters:
   *
   *     responses:
   *       200:
   *         description: signed or not
   *       500:
   *         description: unexpected error
   */
    .get('/user/checkAgreement', async (ctx, next) => {
        const tokenStr = ctx.header.authorization.split(' ')[1]
        const decoded = await jsonwebtoken.verify(tokenStr, config.secret);
        let user = await UserCtl.getUserById(decoded.data.userId);

        const agreement = await UserCtl.checkAgreementSigned()

        if (agreement === null) {
            ctx.status = 500;
            ctx.body = "please contact customer service.";
            return;
        }

        let res = "You have not signed the latest agreement yet. Agreement Title: " + agreement.Title;
        if (user.AuthStatus === agreement.id) {
            res = "You signed the latest agreement. Agreement Title: " + agreement.Title;
        }

        ctx.status = 200;
        ctx.body = res;
    })
/**
   * @swagger
   * /user/signAgreement:
   *   post:
   *     description: sign the latest agreemnt.
   *     tags: [user]
   *     produces:
   *       - application/json
   *     parameters:
   *
   *     responses:
   *       200:
   *         description: signed.
   *       500:
   *         description: unexpected error
   * 
   */
    .post('/user/signAgreement', async (ctx, next) => {
        const tokenStr = ctx.header.authorization.split(' ')[1]
        const decoded = await jsonwebtoken.verify(tokenStr, config.secret);

        let user = await UserCtl.getUserById(decoded.data.userId);
        const agreement = await UserCtl.checkAgreementSigned()
        if (user.AuthStatus === agreement.id) {
            ctx.status = 200;
            ctx.body = "You already signed the latest agreement.";
            return;
        }

        try {
            updateStatement = " Update Users SET AuthStatus = " + agreement.id +
                " WHERE id= " + decoded.data.userId + ";"
            const [results, metadata] = await db.sequelize.query(updateStatement);
            ctx.status = 200;
            ctx.body = "You signed the latest agreement. Agreement Title: " + agreement.Title;
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: err.originalError ? err.originalError.message : err.message }
            return;
        }
    });


module.exports = { userRouter, UserCtl };
