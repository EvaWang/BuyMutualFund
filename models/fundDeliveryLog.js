'use strict';

const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FundDeliveryLog extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  FundDeliveryLog.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    UserId: { type: DataTypes.INTEGER, allowNull: false, defaultValue: "" },
    FundId: { type: DataTypes.INTEGER, allowNull: false, defaultValue: "" },
    Unit: { type: DataTypes.DECIMAL, allowNull: false, defaultValue: 0 },
    // 1: to be fulfill, 2: fulfilled, 3: failed, 4: transaction done
    Status: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    Memo: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
    CreateTime: { type: DataTypes.DATE, allowNull: false, defaultValue: Date.now() },
  }, {
    timestamps: false,
    sequelize,
    modelName: 'FundDeliveryLog',
    indexes: []
  });
  return FundDeliveryLog;
};