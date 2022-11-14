'use strict';

const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FundNAV extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  FundNAV.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    FundId: { type: DataTypes.INTEGER, allowNull: false, defaultValue: "" },
    Value: { type: DataTypes.DECIMAL, allowNull: false, defaultValue: 0 },
    CreateTime: { type: DataTypes.DATE, allowNull: false, defaultValue: Date.now() },
  }, {
    timestamps: false,
    sequelize,
    modelName: 'FundNAV',
    indexes: []
  });
  return FundNAV;
};