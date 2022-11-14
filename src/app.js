'use strict';

const Koa = require('koa');
// const compose = require('koa-compose');
const router = require('koa-router')();
const { koaBody } = require('koa-body');
const jwt = require('koa-jwt');

const {userRouter} = require('./api/user')
const {agreementRouter} = require('./api/agreement')
const {accountRouter} = require('./api/account')
const {fundRouther} = require('./api/fund')
const config = require('../config/appConfig.js')

const app = new Koa();

app.use(koaBody());

// custom 401 error handling
app.use(function (ctx, next) {
    // console.log(ctx.header.authorization)

    return next().catch((err) => {
        if (401 == err.status) {
            ctx.status = 401;
            // ctx.body = 'Protected resource, use Authorization header to get access\n';
            ctx.body = {
                error: err.originalError ? err.originalError.message : err.message
              };
        } else {
            throw err;
        }
    });
});

// Unprotected middleware
app.use(function (ctx, next) {
    if (ctx.url === "/") {
        ctx.body = 'Buy Mutual Funds';
    } else {
        return next();
    }
});

// Middleware below this line is only reached if JWT token is valid
app.use(jwt({ secret: config.secret, debug: config.dev }).unless({ path: [/^\/public/, "/"] }));

// // Protected middleware
// app.use(function (ctx) {
//     if (ctx.url.match(/^\/api/)) {
//         ctx.body = 'protected\n';
//     }
// });

app.use(userRouter.routes());
app.use(userRouter.allowedMethods());
app.use(agreementRouter.routes());
app.use(agreementRouter.allowedMethods());
app.use(accountRouter.routes());
app.use(accountRouter.allowedMethods());
app.use(fundRouther.routes());
app.use(fundRouther.allowedMethods());
app.use(router.routes());
app.use(router.allowedMethods());

(async () => {
    try {
        await app.listen(config.port);
        console.log('app start.')
    } catch (error) {
        console.log({error: error.originalError ? error.originalError.message : error.message});
    }

})();