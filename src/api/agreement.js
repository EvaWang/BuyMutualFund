const agreementRouter = require('koa-router')();
const jsonwebtoken = require('jsonwebtoken');

const config = require('../../config/appConfig')
const db = require('../../models')

let AgreementCtl = {
    createAgreement: async function(title, content){
        const newAgreement = await db.Agreement.create({Title: title, Content: content});
        return newAgreement;
    },

}

agreementRouter
/**
   * @swagger
   * /agreement/add:
   *   post:
   *     description: (Admin Only) add a new agreement. 
   *     tags: [agreement]
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: title
   *         description: agreement title
   *         required: true
   *         type: string
   *       - name: content
   *         description: agreement content
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: drawed.
   *       400:
   *         description: lack for required params/ insufficient balance
   *       401:
   *         description: admin only. current usr is not a super user.
   *       500:
   *         description: unexpected error
   */   
    .post('/agreement/add', async (ctx, next) => {
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

        if (!ctx.request.body.title ||
            !ctx.request.body.content) {
            ctx.status = 400;
            ctx.body = {
                error: 'expected an object with username and password.'
            }
            return;
        }
        try{
            const newAgreement = await AgreementCtl.createAgreement(ctx.request.body.title, ctx.request.body.content)
            ctx.status = 200;
            ctx.body = JSON.stringify(newAgreement);
        }catch(err){
            ctx.status = 400;
            ctx.body = {error: err.originalError ? err.originalError.message : err.message}
        }
    });

module.exports = {agreementRouter, AgreementCtl};
