'use strict';

const config = {
    port: process.env.PORT || 3000,
    dev: (process.env.NODE_ENV || 'development') === 'development',
    secret: process.env.JWT_SECRET || 'jwt_secret',
    saltRounds: 10,
}

module.exports = config