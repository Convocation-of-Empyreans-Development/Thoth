/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('eve_corporations', {
    corporation_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'eve_characters',
        key: 'corporation_id'
      }
    },
    alliance_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    ceo_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    creator_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    date_founded: {
      type: DataTypes.DATE,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    faction_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    home_station_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    member_count: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    shares: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    tax_rate: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    ticker: {
      type: DataTypes.STRING(5),
      allowNull: false
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    war_eligible: {
      type: DataTypes.INTEGER(1),
      allowNull: true
    }
  }, {
    tableName: 'eve_corporations'
  });
};
