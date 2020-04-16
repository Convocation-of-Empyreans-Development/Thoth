/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return aider_roles_permission = sequelize.define('aider_roles_permission', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    role_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'aider_roles',
        key: 'role_id'
      }
    },
    permission_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'aider_permission',
        key: 'permission_id'
      }
    },
    parameter: {
      type: DataTypes.BIGINT,
      allowNull: true
    }
  }, {
    tableName: 'aider_roles_permission'
  });
};
