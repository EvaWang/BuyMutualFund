'use strict';

const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Fund extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Fund.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    Name: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
    // different type with different trading fee.
    FundTypeId: { type: DataTypes.INTEGER, allowNull: false, defaultValue: "" },
    // TWD: 1, USD: 2, EURO: 3, 
    Currency: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    Prospectus: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
    CreateTime: { type: DataTypes.DATE, allowNull: false, defaultValue: Date.now() },
    UpdateTime: { type: DataTypes.DATE, allowNull: false, defaultValue: Date.now() },
  }, {
    timestamps: false,
    sequelize,
    modelName: 'Fund',
    indexes: [
      { unique: true, fields: ['Name'] },
    ]
  });
  return Fund;
};