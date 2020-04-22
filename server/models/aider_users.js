/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  var aider_users = sequelize.define('aider_users', {
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
  },
  {
    tableName: 'aider_users'
  },
  {
    timestamps: false
  },
  {
    classMethods: {
      associate: function(models) {
        aider_users.belongsTo(models.eve_characters);
      }
    }
  });

  aider_users.associate = function(models){
    aider_users.belongsTo(models.eve_characters, {foreignKey:'main_id', sourceKey: 'character_id'});
    aider_users.belongsToMany(models.aider_roles, {through: 'aider_user_roles', foreignKey:'user_id', otherkey: 'role_id'});
  }
  return aider_users;
};
