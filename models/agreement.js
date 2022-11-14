'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Agreement extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Agreement.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    Title: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
    // actually contnet should be longer (default 255)
    Content: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
    // signed: 1, not signed yet: 0
    // IsSigned: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    CreateTime: { type: DataTypes.DATE, allowNull: false, defaultValue: Date.now() },
  }, {
    timestamps: false,
    sequelize,
    modelName: 'Agreement',
    indexes: [
      { unique: true, fields: ['Title'] },
    ]
  });
  return Agreement;
};