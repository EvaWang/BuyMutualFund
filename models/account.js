'use strict';

const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Account extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Account.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    UserId: { type: DataTypes.INTEGER, allowNull: false, defaultValue: "" },
    Balance: { type: DataTypes.DECIMAL, allowNull: false, defaultValue: 0 },
    // TWD: 1, USD: 2, EURO: 3, 
    Currency: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    CreateTime: { type: DataTypes.DATE, allowNull: false, defaultValue: Date.now() },
    UpdateTime: { type: DataTypes.DATE, allowNull: false, defaultValue: Date.now() },
  }, {
    timestamps: false,
    sequelize,
    modelName: 'Account',
    indexes: [
      // { unique: true, fields: ['UserId', 'Currency'] },
    ]
  });
  return Account;
};