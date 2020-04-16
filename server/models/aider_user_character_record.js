/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('aider_user_character_record', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'aider_users',
        key: 'user_id'
      }
    },
    action: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    action_data: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'aider_user_character_record'
  });
};
