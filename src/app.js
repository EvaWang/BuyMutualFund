'use strict';

const Koa = require('koa');
// const compose = require('koa-compose');
const router = require('koa-router')();
const { koaBody } = require('koa-body');
const jwt = require('koa-jwt');

const { Sequelize } = require("sequelize");

const userRouter = require('./api/user')
const config = require('../config/appConfig.js')


const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: config.sqlPath,
    define: {
      freezeTableName: true // stop auto-pluralization 
    }
  });

const user = db.User;
const agreement = db.Agreement;
sequelize.sync()


const app = new Koa();

app.use(koaBody());

// custom 401 error handling
app.use(function (ctx, next) {
    return next().catch((err) => {
        if (401 == err.status) {
            ctx.status = 401;
            ctx.body = 'Protected resource, use Authorization header to get access\n';
        } else {
            throw err;
        }
    });
});

// Unprotected middleware
app.use(function (ctx, next) {
    if (ctx.url.match(/^\/public/) ||ctx.url === "/") {
        ctx.body = 'Buy Mutual Funds';
    } else {
        return next();
    }
});

// Middleware below this line is only reached if JWT token is valid
app.use(jwt({ secret: 'shared-secret' }).unless({ path: [/^\/public/, "/"] }));

// // Protected middleware
// app.use(function (ctx) {
//     if (ctx.url.match(/^\/api/)) {
//         ctx.body = 'protected\n';
//     }
// });

app.use(userRouter.routes());
app.use(userRouter.allowedMethods());
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(config.port);