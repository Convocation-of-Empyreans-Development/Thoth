/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('aider_users', {
    user_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    main_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      unique: true
    },
    discord_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      unique: true
    }
  }, {
    tableName: 'aider_users'
  },{
    timestamps: false
});
};
