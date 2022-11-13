'use strict';

const config = {
    port: process.env.PORT || 3000,
    dev: (process.env.NODE_ENV || 'development') === 'development',
    saltRounds: 10,
    sqlPath: './FundTrading.sqlite'
}

module.exports = config