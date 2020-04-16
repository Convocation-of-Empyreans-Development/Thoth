/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('eve_alliances', {
    alliance_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'eve_corporations',
        key: 'alliance_id'
      }
    },
    creator_corporation_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    creator_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    date_founded: {
      type: DataTypes.DATE,
      allowNull: false
    },
    executor_corporation_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    faction_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    ticker: {
      type: DataTypes.STRING(5),
      allowNull: false
    }
  }, {
    tableName: 'eve_alliances'
  });
};
