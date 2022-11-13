const userRouter = require('koa-router')();
const bcrypt = require("bcrypt")

const config = require('../../config/appConfig')


async function createUser(userData) {

    userData.password = await bcrypt.hash(userData.password, 5);
    let salt = bcrypt.genSaltSync(config.saltRounds);
    userData.salt = salt
    userData.password = bcrypt.hashSync(userData.password, salt);
    // const user = getUserByUsername(ctx.request.body.username, users);

}

async function checkUserExist(username) {
    return 0;
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
                error: 'expected an object with username, password, but got: ' + ctx.request.body
            }
            return;
        }

        const isUserExist = await checkUserExist(userData.username)
        if (isUserExist){
            ctx.status = 406;
            ctx.body = { error: "User exists" }
            return;
        }

        const newUser = await createUser(userData)
        users.push(ctx.request.body);
        ctx.status = 200;
        ctx.body = { message: "success" };
        next();
    })
    .get('/user/getInfo', async (ctx, next) =>{
        ctx.body = "/user/getInfo"
    });

    

module.exports = userRouter;
