const userRouter = require('koa-router')();
const bcrypt = require("bcrypt")
const jsonwebtoken = require('jsonwebtoken');

const config = require('../../config/appConfig')
const db = require('../../models')


async function createUser(userData) {
    userData.salt = await bcrypt.genSalt(config.saltRounds);
    userData.password = await bcrypt.hashSync(userData.password, userData.salt);
    const newUser = await db.User.create({
        UserName: userData.username,
        Password: userData.password,
        // Salt: userData.salt,
    });
    return newUser
}

async function getUserByName(username) {
    const user = await db.User.findOne({ where: { UserName: username } });
    return user;
}

async function getUserById(id) {
    const user = await db.User.findOne({ where: { id: id } });
    return user;
}

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

        const existingUser = await getUserByName(userData.username);
        if (existingUser !== null) {
            ctx.status = 406;
            ctx.body = { error: "User exists" }
            return;
        }

        const newUser = await createUser(userData)
        ctx.status = 200;
        ctx.body = { message: "success. user:" + newUser.UserName + ", create time: " + newUser.UpdateTime };
        next();
    })
    .post('/public/login', async (ctx, next) => {
        
        let user = await getUserByName(ctx.request.body.username);
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
            token: jsonwebtoken.sign({
                data: {userId: user.id, username: user.UserName},
                //exp in seconds
                expiresIn: '2h'
            }, config.secret)
        }
        next();
    })
    .get('/user/getInfo', async (ctx, next) => {
        const tokenStr = ctx.header.authorization.split(' ')[1]
        const decoded = jsonwebtoken.verify(tokenStr, config.secret);

        let user = await getUserById(decoded.data.userId);
        user.Password = ""
        ctx.body = JSON.stringify(user)
        next();
    });


module.exports = userRouter;
