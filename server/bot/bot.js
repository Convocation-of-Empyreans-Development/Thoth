var Discord = require("discord.js");
var fs = require('fs'); //filesystem
var bot = new Discord.Client;

var corporations = require('./corporations.js');

var http = require('http');
var request = require('request');
var _ = require('lodash');
var eveonlinejs = require('eveonlinejs');
var moment = require('moment');

var channels = require('./channels.js');
var joinableChannels = require('./joinableChannels.js');
var sendReport = require('./sendReport.js');
var schedule = require('node-schedule');
var welcomeMessage = require('./welcomeMessage.js');
var commands = require('./commands.js');

//load config data
var Config = {};
var roles = {};
var models = {};
var discord = {};


try {
  Config = require("./config.json");
} catch (e) { //no config file, use defaults
  console.log("No config file found, setting default config. " + e);
  Config.debug = false;
  Config.commandPrefix = '!';
  try {
    if (fs.lstatSync("./config.json").isFile()) {
      console.log("WARNING: config.json found but we couldn't read it!\n" + e.stack);
    }
  } catch (e2) {
    fs.writeFile("./config.json", JSON.stringify(Config, null, 2));
  }
}

if (!Config.hasOwnProperty("commandPrefix")) {
  Config.commandPrefix = '!';
}


// load permissions
var dangerousCommands = []//"eval","pullanddeploy","setUsername"];
var Permissions = {};
try {
  Permissions = require("./permissions.js");
} catch (e) {
  console.log("No Permissions file found, setting default permissions. " + e);
  Permissions.global = {};
  Permissions.users = {};
}
for (var i = 0; i < dangerousCommands.length; i++) {
  var cmd = dangerousCommands[i];
  if (!Permissions.global.hasOwnProperty(cmd)) {
    Permissions.global[cmd] = false;
  }
}
Permissions.checkPermission = function (user, permission) {
  /*try {
   var allowed = true;
   try{
   if(Permissions.global.hasOwnProperty(permission)){
   allowed = Permissions.global[permission] === true;
   }
   } catch(e){}
   try{
   if(Permissions.users[user.id].hasOwnProperty(permission)){
   allowed = Permissions.users[user.id][permission] === true;
   }
   } catch(e){}
   return allowed;
   } catch(e){}
   return false;*/
  return true;
}
//fs.writeFile("./permissions.json", JSON.stringify(Permissions, null, 2));

bot.on("ready", function () {
  //console.log(bot.channels.get(lobby));
  console.log("Logged in! Serving in " + bot.guilds.resolve(channels.server).name);
  bot.user.setStatus("online");
  //console.log(JSON.stringify(models.aider_roles));
  //models.aider_roles.find().then(function(roles){ JSON.stringify(roles)});

  schedule.scheduleJob({hour: 18, minute: 0}, () => {
    console.log('Running mass validate');
    massValidate(bot);
  });
});

bot.on("disconnected", function () {
  console.log("Disconnected!");
  process.exit(1); //exit node.js with an error
});

bot.on('guildMemberAdd', function (user) {
  user.send(require("./welcomemessage.js"));
});

bot.on('message', msg => {
  //console.log(msg);

  console.log(msg.channel && msg.channel.id ? msg.channel.id : "No Channel Id");
  console.log(msg.member && msg.member.user ? msg.member.user : "No User");

  if (msg.member) {
    // no member means the channel is a DM

  }
  if (msg.member && msg.member.user.id != 265177397161099276) {

    //msg.author.send(msg.member.user.id);

  }
  checkMessageForCommand(msg);
});

bot.sendMessage = function (channel, message) {
  console.log(message);
  bot.channels.get(bot_testing).send(message);
}

function checkMessageForCommand(msg, isEdit) {
	console.log(msg.content.length);
  //check if message is a command
  if (msg.author.id != bot.user.id && (msg.content.startsWith(Config.commandPrefix)) && msg.content.length > 1) {
    console.log("treating " + msg.content + " from " + msg.author + " as command");
    var cmdTxt = msg.content.split(" ")[0].substring(Config.commandPrefix.length);
    var suffix = msg.content.substring(cmdTxt.length + Config.commandPrefix.length + 1); //add one for the ! and one for the space

    /*if (msg.mentions.has(bot.user)) {
      try {
        cmdTxt = msg.content.split(" ")[1];
        suffix = msg.content.substring(bot.user.mention().length + cmdTxt.length + Config.commandPrefix.length + 1);
      } catch (e) { //no command
        msg.author.send("Yes?");
        return;
      }
    }*/
    var cmd = commands[cmdTxt];
    if (cmdTxt === "help") {
      //help is special since it iterates over the other commands
      if (suffix) {
        var cmds = suffix.split(" ").filter(function (cmd) {
          return commands[cmd]
        });
        var info = "";
        for (var i = 0; i < cmds.length; i++) {
          var cmd = cmds[i];
          info += "**" + Config.commandPrefix + cmd + "**";
          var usage = commands[cmd].usage;
          if (usage) {
            info += " " + usage;
          }
          var description = commands[cmd].description;
          if (description instanceof Function) {
            description = description();
          }
          if (description) {
            info += "\n\t" + description;
          }
          info += "\n"
        }
        msg.author.send(info);
      } else {
        msg.author.send("**Available Commands:**").then(function () {
          var batch = "";
          var sortedCommands = Object.keys(commands).sort();
          for (var i in sortedCommands) {
            var cmd = sortedCommands[i];
            var info = "**" + Config.commandPrefix + cmd + "**";
            var usage = commands[cmd].usage;
            if (usage) {
              info += " " + usage;
            }
            var description = commands[cmd].description;
            if (description instanceof Function) {
              description = description();
            }
            if (description) {
              info += "\n\t" + description;
            }
            var newBatch = batch + "\n" + info;
            if (newBatch.length > (1024 - 8)) { //limit message length
              msg.author.send(batch);
              batch = info;
            } else {
              batch = newBatch
            }
          }
          if (batch.length > 0) {
            msg.author.send(batch);
          }
        });
      }
    }
    else if (cmd) {
      if (Permissions.checkPermission(msg.author, cmdTxt)) {
        try {
          cmd.process(bot, msg, models, suffix, isEdit);
        } catch (e) {
          var msgTxt = "command " + cmdTxt + " failed :(";
          msgTxt += "\n" + e.stack;
          if (Config.debug) {

          }
          msg.author.send(msgTxt);
        }
      } else {
        msg.author.send("You are not allowed to run " + cmdTxt + "!");
      }
    } else {
      msg.author.send(cmdTxt + " not recognized as a command!").then((message => message.delete(5000)))
    }
  } else {

    //message isn't a command or is from us
    //drop our own messages to prevent feedback loops
    if (msg.author == bot.user) {
      return;
    }

    if (msg.author != bot.user && msg.mentions.has(bot.user)) {
      msg.author.send(msg.author.username + ", you called?");
    } else {

    }
  }
}





var refreshToken = function (user, callback, errCallback) {
  var headers = {
    "Content-Type": "application/json",
    'Authorization': 'Basic ZDkyYzcwOWVjOGFhNDM5YmIzMjdjZDIxMzEzY2M5ZjA6UndaZFNVRlgyRDB0ekE2M3VCck9NNnFEQnYxMTdZZXhtSjdYaEVhRg==',
    'Host': 'login.eveonline.com'
  }

  var options = {
    url: 'https://login.eveonline.com/oauth/token',
    method: 'POST',
    headers: headers,
    form: {
      'refresh_token': user.dataValues.refresh_token,
      'grant_type': 'refresh_token'
    }
  }
  request(options, function (error, response, body) {
    var body = JSON.parse(body);
    if (body.access_token) {
      var tokenData = {};

      tokenData.access_token = body.access_token;
      tokenData.refresh_token = body.refresh_token;
      //console.log(tokenData);
      callback(tokenData);
    }
    else {
      if (errCallback) {
        errCallback(body);
      } else {
        console.log(user.dataValues.name);
        console.log(body);
      }
    }
  });
}

function massValidate (bot) {
  var corpRolesMap = {
    "Aideron Robotics": "AIDER",
    "Mecha Enterprises Fleet": "XMETA",
    "Jerkasaurus Wrecks Inc.": "JREX",
    "Align to Valhalla": "ATV.",
    "Alwar Fleet": "ALWAR",
    "17th Squadron": "SQRON",
    "Federal Vanguard": "FEVAN"
  };

  var allianceRolesMap = {
    "Federation Uprising": "Member",
    "Pen Is Out": "WANGS"
  };

  var automaticallyAssignedRoles = ["Militia"].concat(_.values(corpRolesMap)).concat(_.values(allianceRolesMap));

  bot.guilds.first().fetchMembers().then(function (guild) {
    models.user.findAll().then(function (users) {
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
  });

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

var CBot = {}

var initialize = (db) => {
  console.log("Starting Discord Bot...");
  models = db;
  //console.log(models);
  models.aider_roles.findAll().then(roles =>
  {
      console.log("Syncing Roles - ");
      roles.forEach((item, i) => {
        console.log(item.role_name);
      });
      console.log("Syncing Roles complete");
  });

  // if being run in Github Actions, we pass the token in as an environment variable..
  if (process.env.GITHUB_ACTIONS) {
    bot.login(process.env.DISCORD_BOT_TOKEN);
  } else {
    var AuthDetails = require("../../secret/discordSecret.json");
    bot.login(AuthDetails.bot_token);
  }
}

module.exports.initialize = initialize;
