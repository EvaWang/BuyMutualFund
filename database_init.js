const db = require('./models');
const bcrypt = require("bcrypt");
const config = require('./config/appConfig.js');

// console.log(process.env.GenInitData==="1")

(async () => {
    try {
        // db.User.hasMany(db.Account, { sourceKey: 'id', foreignKey: 'UserId' });
        await db.sequelize.sync({ alter: true })

        if (process.env.GenInitData!=="1"){
            return;
        }

        const hashPwd = await bcrypt.hash("AdminSample", config.saltRounds)
        await db.User.create({
            UserName: "Admin",
            Password: hashPwd,
            IsSuperUser: 1
        });
        await db.Agreement.create({
            Title: 'Default Agreement.', 
            Content: "A long long content."
        });
        await db.FundType.bulkCreate([
            {TypeName: "type 1", Fee: 2},
            {TypeName: "type 2", Fee: 0.5},
            {TypeName: "type 3", Fee: 1.2},
            {TypeName: "type 4", Fee: 0.75},
        ])
        await db.Fund.bulkCreate([
            {Name: "FundA TWD", FundTypeId: 1, Currency: 1, Prospectus:"Long long content 1."},
            {Name: "FundA EU", FundTypeId: 1, Currency: 2, Prospectus:"Long long content 2."},
            {Name: "FundA US", FundTypeId: 1, Currency: 3, Prospectus:"Long long content 3."},
            {Name: "FundB US", FundTypeId: 2, Currency: 3, Prospectus:"Long long content 4."},
            {Name: "FundB TWD", FundTypeId: 3, Currency: 1, Prospectus:"Long long content 5."},
            {Name: "FundB EU", FundTypeId: 4, Currency: 2, Prospectus:"Long long content 6."},
        ]);
        console.log('db created.')
    } catch (error) {
        console.log(error)
    }
})();

