/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('aider_permission', {
    permission_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    permission_name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    uses_param: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    }
  }, {
    tableName: 'aider_permission'
  });
};
