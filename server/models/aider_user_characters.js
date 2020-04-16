/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('aider_user_characters', {
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
    character_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'eve_characters',
        key: 'character_id'
      },
      unique: true
    }
  }, {
    tableName: 'aider_user_characters'
  });
};
