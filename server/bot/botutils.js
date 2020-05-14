var roles = require('./roles.js');

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

function getName(member){
  return member.nickname?member.nickname:member.user.username;
}

function validate(guild, models, bot, member) {
  console.log("Validating... " + getName(member));
  console.log(member.user);
  

  // Step 1: pull user on server w/ rolls
  models.aider_users.findOne({where:{discord_id: member.id}, include:[{
    model: models.aider_roles,
    throguh: {
      model: models.aider_user_roles,
      foreignKey: 'user_id',
      otherkey: 'role_id'
    }
  }]}).then( function(user){
    if(user){
      //Validate that all server roles are correctly applied
      console.log(getName(member));
      console.log("User ID " + user.user_id);

      var aider_roles = {};

      // Step 2: Add any roles that are not
      user.aider_roles.forEach((item, i) => {
        aider_roles[item.role_name] = item;
        console.log(item.role_name);
        findDiscordRoleByAiderRole(guild, item, discordRole => {
          if(discordRole){
            member.roles.add(discordRole);
            //console.log(discordRole);
          }
        });
      });

      // Step 3: Go over roles to validate still good
      //console.log(user.aider_roles);
      member.roles.cache.forEach((discordRole, i) => {
        findAiderRoleByID(guild, models, discordRole.id, aider_role => {
          if(!aider_role || aider_roles[aider_role.role_name]){
            return;
          }
          console.log(discordRole.name + " not assigned! Removing...");
          member.roles.remove(discordRole);
          console.log(discordRole.name + " removed");


          /*if(aider_role){
            console.log(aider_role.role_name);
          } else if(roles.includes(item.name)) {
            console.log("Override: " + item.name);
          }
          else {
            console.log("Not found " + item.name);
          }*/


          /*if(aider_role){
            console.log(aider_role.role_name + " " + item.id);
          } else {
            console.log(item.name);
          }*/
        });
      });

    } else {
      console.log(getName(member) + ' not found');
    }
  }).catch(error => {console.log(error.message)});
}

function massValidate (guild, models, bot) {

  /*console.log("Mass Validate for " + guild.name);
  guild.members.cache.forEach((member, i) => {
    console.log('Validating... ' + getName(member));
    validate(guild, models, bot, member);
  });*/


  //guild.fetchMembers().then(function (guild) {
    //console.log(guild);
    /*models.aider_users.findAll({include:[{
      model: models.aider_roles,
      throguh: {
        model: models.aider_user_roles,
        foreignKey: 'user_id',
        otherkey: 'role_id'
      }
    }]}).then( function(users){
      console.log("Foo");
    }).catch(error => {console.log(error.message)});*/
  //}).catch(error => {console.log(error.message)});



    /*models.user.findAll().then(function (users) {
      users = _.filter(users, user => {
        return user.discord_id != null && user.discord_id.substr(0, 4) !== "Dis:";
      });

      var i = 0;

      var promises = [];

      var interval = setInterval(() => {
        if (!users[i]) {
          clearInterval(interval);
          Promise.all(promises).then(function (results) {
            var nonEmptyResults = _.filter(results, result => typeof result === "string");
            text = nonEmptyResults.length > 0 ? nonEmptyResults.join('\n') : "Nothing to report";
            text += ("\n\n Timestamp: " + new Date().toUTCString());
            sendReport(text);
          });
          return;
        }
        promises[i] = roleChange(users[i]);
        console.log((i+1).toString() + "/" + users.length.toString());
        i++;
      }, 500);
    });

    function getGuildMember(user) {
      var member = guild.members.get(user.discord_id);
      return member;
    }

    function roleChange(user) {
      return new Promise((resolve, reject) => {
        var guildMember = getGuildMember(user);
        if (!guildMember) {
          return resolve();
        }

        var currentRoles = getCurrentRoles(guildMember);
        var currentAutomaticRoles = getCurrentAutomaticRoles(guildMember);
        getNewAutomaticRoles(user).then(function (newAutomaticRoles) {
          var roleNamesToAdd = _.difference(newAutomaticRoles, currentAutomaticRoles);
          var roleNamesToRemove = _.difference(currentAutomaticRoles, newAutomaticRoles);
          if (roleNamesToAdd.length === 0 && roleNamesToRemove.length === 0) {
            return resolve();
          }

          var roleNamesToSet = _(currentRoles).difference(automaticallyAssignedRoles).concat(newAutomaticRoles).value();
          var rolesToSet =  _.map(roleNamesToSet, function (roleName) {
            return guild.roles.find("name", roleName);
          });

          console.log("Trying to set roles for: " + user.name);
          guildMember.setRoles(rolesToSet).then(function (gm) {
            resolve(user.name + "\nRoles added: " + JSON.stringify(roleNamesToAdd) + "\nRoles removed: " + JSON.stringify(roleNamesToRemove) + '\n');
            console.log("Successfully set roles for: " + user.name);
          }, function (error) {
            resolve(user.name + '\nRole update failed. Reason:\n' + JSON.stringify(error) + "\nRoles to be added: " + JSON.stringify(roleNamesToAdd) + "\nRoles to be removed: " + JSON.stringify(roleNamesToRemove) + '\n');
            console.log("Error when setting roles for: " + user.name);
            console.log(error);
          });
        }, function (reason) {
          var errorMessage = reason instanceof Error ? reason.toString() : JSON.stringify(reason);
          resolve(user.name + '\n' + "Could not determine roles, reason:\n" + errorMessage + '\n');
        });
      });
    }
  });*/

  function getCurrentRoles(guildMember) {
    var roles = guildMember.roles;
    return roles.array().map(role => role.name);
  }

  function getCurrentAutomaticRoles(guildMember) {
    var roles = guildMember.roles;
    return _.intersection(roles.array().map(role => role.name), automaticallyAssignedRoles);
  }

  function getNewAutomaticRoles(user) {
    return new Promise(function (resolve, reject) {
      refreshToken(user, function (token) {
        eveonlinejs.setParams({
          accessToken: token.access_token,
          accessType: "Character"
        });
        eveonlinejs.fetch('char:FacWarStats', {characterID: user.char_id}, function (err, result) {
          if (err) {

            if (err.response && err.response.statusCode == 400) {
              resolve([]);
            } else {
              reject(err);
            }

            return;
          }

          if (result.factionName !== "Gallente Federation") {
            return resolve([]);
          }

          var roles = ["Militia"];

          var headers = {
            "Content-Type": "application/json",
          }

          var options = {
            url: 'https://esi.tech.ccp.is/latest/characters/' + user.char_id + '/?datasource=tranquility',
            method: 'GET',
            headers: headers,
          }
          request(options, function (error, response, body) {
            if (error) {
              return reject(error);
            }

            var character = JSON.parse(body);
            options.url = 'https://esi.tech.ccp.is/latest/corporations/' + character.corporation_id + '/?datasource=tranquility'
            request(options, function (error, response, body) {
              if (error) {
                return reject(error);
              }
              var corporation = JSON.parse(body);

              if (!corporation || !corporation.corporation_name) {
                return reject(corporation);
              }

              if (corpRolesMap[corporation.corporation_name]) {
                roles.push(corpRolesMap[corporation.corporation_name]);
              }

              if (!corporation.alliance_id) {
                return resolve(roles);
              }

              options.url = 'https://esi.tech.ccp.is/latest/alliances/' + corporation.alliance_id + '/?datasource=tranquility'
              request(options, function (error, response, body) {
                if (error) {
                  return reject(error);
                }

                var alliance = JSON.parse(body);
                if (!alliance || !alliance.alliance_name) {
                  return reject(alliance);
                }

                if (allianceRolesMap[alliance.alliance_name]) {
                  roles.push(allianceRolesMap[alliance.alliance_name]);
                }

                return resolve(roles);
              });
            });
          });
        });
      }, function (error) {
        return reject(error);
      });
    });
  }
}


module.exports.findAiderRoleByID = findAiderRoleByID;
module.exports.findDiscordRoleByAiderRole = findDiscordRoleByAiderRole;
module.exports.massValidate = massValidate;
module.exports.validate = validate;
