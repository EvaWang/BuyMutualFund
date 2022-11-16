/**
 * from
 * https://www.twblogs.net/a/5eeb6c684b16c91a2848f689 
 * */

const swaggerRouter = require('koa-router')() //引入路由函數
const swaggerJSDoc = require('swagger-jsdoc')
const path = require('path');

const swaggerDefinition = {
    info: {
        title: 'Buy Mutual Fund',
        version: '1.0.0',
        description: 'API',
    },
    host: 'localhost:3000',
    basePath: '/' // Base path (optional)
};
const options = {
    swaggerDefinition,
    apis: [path.join(__dirname,'../api/*.js')], // 寫有註解的router的存放地址, 最好path.join()
};
const swaggerSpec = swaggerJSDoc(options)
// 通過路由獲取生成的註解文件
swaggerRouter.get('/public/swagger.json', async function (ctx) {
    ctx.set('Content-Type', 'application/json');
    ctx.body = swaggerSpec;
})
module.exports = swaggerRouter