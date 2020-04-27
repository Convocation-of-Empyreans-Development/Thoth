var findAiderRoleByID = function(guild, models, id, callback){
    models.aider_roles.findOne({where: {role_name: guild.roles.resolve(id).name}}).then(function(role) {
      callback(role);
    });
}

var findDiscordRoleByAiderRole = function(guild, aiderRole, callback){
    var found = false;
    //console.log("Searching for " + aiderRole.role_name + " checking " + guild.roles.cache.size + " guild roles for " + guild.name);
    for(var i = 0; i < guild.roles.cache.size; i++){
      //console.log("checking " + guild.roles.resolve(guild.roles.cache.keyArray()[i]).name.trim() + " " +  aiderRole.role_name.trim())
      if( guild.roles.resolve(guild.roles.cache.keyArray()[i]).name.trim() == aiderRole.role_name.trim()){
        //console.log("Found " + aiderRole.role_name.trim());
        found = true;
        callback(  guild.roles.resolve(guild.roles.cache.keyArray()[i]));
        break;
      }
    }
    if(!found){
      console.log(aiderRole.role_name.trim() + " not found");
      callback(null);
    }
}

module.exports.findAiderRoleByID = findAiderRoleByID;
module.exports.findDiscordRoleByAiderRole = findDiscordRoleByAiderRole;
