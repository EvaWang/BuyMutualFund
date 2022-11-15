'use strict';

const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  User.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    UserName: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
    Password: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
    // Salt: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
    // signed no agreement yet: -1, signed: agreement id
    AuthStatus: { type: DataTypes.INTEGER, allowNull: false, defaultValue: -1 },
    // valid user: 1, deleted user: 0
    IsValid: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    // common user: 0, super user: 1
    IsSuperUser: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0}, 
    CreateTime: { type: DataTypes.DATE, allowNull: false, defaultValue: Date.now() },
    UpdateTime: { type: DataTypes.DATE, allowNull: false, defaultValue: Date.now() },
  }, {
    timestamps: false,
    sequelize,
    modelName: 'User',
    indexes: [
      { unique: true, fields: ['UserName'], using: 'BTREE',},
    ]
  });
  return User;
};