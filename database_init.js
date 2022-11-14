const db = require('./models');
const bcrypt = require("bcrypt");
const config = require('./config/appConfig.js');


(async () => {
    try {
        db.User.hasMany(db.Account, { sourceKey: 'id', foreignKey: 'UserId' });
        await db.sequelize.sync({ alter: true })
        const hashPwd = await bcrypt.hash("AdminSample", config.saltRounds)
        await db.User.findOrCreate({
            where: { UserName: 'Admin' },
            defaults: {UserName: "Admin", Password: hashPwd, IsSuperUser: 1}
        });
        await db.Agreement.findOrCreate({
            where: { Title: 'Default Agreement.' },
            defaults: {Title: 'Default Agreement.', Content: "A long long content."}
        });
        console.log('db created.')
    } catch (error) {
        console.log(error)
    }
})();

