/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('aideron_tokens', {
    TokenID: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    Token: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    RefreshToken: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    CharacterID: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    CharacterName: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    CorporationID: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    CorporationName: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    CharacterOwnerHash: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    ExpiresOn: {
      type: DataTypes.DATE,
      allowNull: false
    },
    IntellectualProperty: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    Scopes: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    TokenType: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isNew: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '1'
    }
  }, {
    tableName: 'aideron_tokens'
  });
};
