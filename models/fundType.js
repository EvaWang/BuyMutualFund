'use strict';

const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FundType extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  FundType.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    // Friendly Name
    TypeName: { type: DataTypes.INTEGER, allowNull: false, defaultValue: "" },
    // unit: %
    Fee: { type: DataTypes.DECIMAL, allowNull: false, defaultValue: 1 },
    CreateTime: { type: DataTypes.DATE, allowNull: false, defaultValue: Date.now() },
  }, {
    timestamps: false,
    sequelize,
    modelName: 'FundType',
    indexes: []
  });
  return FundType;
};