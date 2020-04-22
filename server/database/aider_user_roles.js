/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('aider_user_roles', {
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
    role_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'aider_roles',
        key: 'role_id'
      }
    }
  }, {
    tableName: 'aider_user_roles'
  });
};
