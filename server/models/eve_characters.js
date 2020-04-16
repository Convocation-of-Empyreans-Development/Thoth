/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('eve_characters', {
    character_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true
    },
    alliance_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    ancestry_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    birthday: {
      type: DataTypes.DATE,
      allowNull: false
    },
    bloodline_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    corporation_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    faction_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    gender: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    race_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    security_status: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'eve_characters'
  });
};
