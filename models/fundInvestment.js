'use strict';

const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FundInvestment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  FundInvestment.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    UserId: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    FundId: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    TotalUnit: { type: DataTypes.DECIMAL, allowNull: false, defaultValue: 0 },
    CreateTime: { type: DataTypes.DATE, allowNull: false, defaultValue: Date.now() },
    UpdateTime: { type: DataTypes.DATE, allowNull: false, defaultValue: Date.now() },
  }, {
    timestamps: false,
    sequelize,
    modelName: 'FundInvestment',
    indexes: [
      // { unique: true, fields: ['UserId', 'FundId'] },
    ]
  });
  return FundInvestment;
};