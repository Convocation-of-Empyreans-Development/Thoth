var Discord = require("discord.js");
var fs = require('fs'); //filesystem
var bot = new Discord.Client;
var AuthDetails = require("./auth.json");
var models = require('../models');

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

//load config data
var Config = {};

console.log("Starting Discord Bot...");

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

// load aliases
var aliases;
try {
  aliases = require("./alias.json");
} catch (e) {
  console.log("No Allias file found, setting default Allias. " + e);
  aliases = {};
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
  user.sendMessage(require("./welcomemessage.js"));
});

bot.on('message', msg => {
  //console.log(msg);

  console.log(msg.channel && msg.channel.id ? msg.channel.id : "No Channel Id");
  console.log(msg.member && msg.member.user ? msg.member.user : "No User");

  if (msg.member) {
    // no member means the channel is a DM

  }
  if (msg.member && msg.member.user.id != 265177397161099276) {

    //msg.author.sendMessage(msg.member.user.id);

  }
  checkMessageForCommand(msg);
});

bot.sendMessage = function (channel, message) {
  console.log(message);
  bot.channels.get(bot_testing).sendMessage(message);
}

function checkMessageForCommand(msg, isEdit) {
	console.log(msg.content.length);
  //check if message is a command
  if (msg.author.id != bot.user.id && (msg.content.startsWith(Config.commandPrefix)) && msg.content.length > 1) {
    console.log("treating " + msg.content + " from " + msg.author + " as command");
    var cmdTxt = msg.content.split(" ")[0].substring(Config.commandPrefix.length);
    var suffix = msg.content.substring(cmdTxt.length + Config.commandPrefix.length + 1);//add one for the ! and one for the space
    if (msg.isMentioned(bot.user)) {
      try {
        cmdTxt = msg.content.split(" ")[1];
        suffix = msg.content.substring(bot.user.mention().length + cmdTxt.length + Config.commandPrefix.length + 1);
      } catch (e) { //no command
        msg.author.sendMessage("Yes?");
        return;
      }
    }
    alias = aliases[cmdTxt];
    if (alias) {
      console.log(cmdTxt + " is an alias, constructed command is " + alias.join(" ") + " " + suffix);
      cmdTxt = alias[0];
      suffix = alias[1] + " " + suffix;
    }
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
        msg.author.sendMessage(info);
      } else {
        msg.author.sendMessage("**Available Commands:**").then(function () {
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
              msg.author.sendMessage(batch);
              batch = info;
            } else {
              batch = newBatch
            }
          }
          if (batch.length > 0) {
            msg.author.sendMessage(batch);
          }
        });
      }
    }
    else if (cmd) {
      if (Permissions.checkPermission(msg.author, cmdTxt)) {
        try {
          cmd.process(bot, msg, suffix, isEdit);
        } catch (e) {
          var msgTxt = "command " + cmdTxt + " failed :(";
          msgTxt += "\n" + e.stack;
          if (Config.debug) {

          }
          msg.author.sendMessage(msgTxt);
        }
      } else {
        msg.author.sendMessage("You are not allowed to run " + cmdTxt + "!");
      }
    } else {
      msg.author.sendMessage(cmdTxt + " not recognized as a command!").then((message => message.delete(5000)))
    }
  } else {

    //message isn't a command or is from us
    //drop our own messages to prevent feedback loops
    if (msg.author == bot.user) {
      return;
    }

    if (msg.author != bot.user && msg.mentions.has(bot.user)) {
      msg.author.send(require("./welcomemessage.js"));
        //msg.author.username + ", you called?");
    } else {

    }
  }
}

var commands = {
  "alias": {
    usage: "<name> <actual command>",
    description: "Creates command aliases. Useful for making simple commands on the fly",
    process: function (bot, msg, suffix) {
      var args = suffix.split(" ");
      var name = args.shift();
      if (!name) {
        msg.author.sendMessage(Config.commandPrefix + "alias " + this.usage + "\n" + this.description);
      } else if (commands[name] || name === "help") {
        msg.author.sendMessage("overwriting commands with aliases is not allowed!");
      } else {
        var command = args.shift();
        aliases[name] = [command, args.join(" ")];
        //now save the new alias
        require("fs").writeFile("./alias.json", JSON.stringify(aliases, null, 2), null);
        msg.author.sendMessage("created alias " + name);
      }
    }
  },
  "aliases": {
    description: "lists all recorded aliases",
    process: function (bot, msg, suffix) {
      var text = "current aliases:\n";
      for (var a in aliases) {
        if (typeof a === 'string')
          text += a + " ";
      }
      msg.author.sendMessage(text);
    }
  },
  "ping": {
    description: "responds pong, useful for checking if bot is alive",
    process: function (bot, msg, suffix) {
      msg.author.sendMessage(msg.author + " pong!");
      if (suffix) {
        msg.author.sendMessage("note that !ping takes no arguments!");
      }
    }
  },
  "idle": {
    usage: "[status]",
    description: "sets bot status to idle",
    process: function (bot, msg, suffix) {
      bot.user.setStatus("idle");
      bot.user.setGame(suffix);
    }
  },
  "online": {
    usage: "[status]",
    description: "sets bot status to online",
    process: function (bot, msg, suffix) {
      bot.user.setStatus("online");
      bot.user.setGame(suffix);
    }
  },
  "say": {
    usage: "<message>",
    description: "bot says message",
    process: function (bot, msg, suffix) {
      msg.author.sendMessage(suffix);
    }
  },
  "announce": {
    usage: "<message>",
    description: "bot says message with text to speech",
    process: function (bot, msg, suffix) {
      msg.author.sendMessage(suffix, {tts: true});
    }
  },
  "msg": {
    usage: "<user> <message to leave user>",
    description: "leaves a message for a user the next time they come online",
    process: function (bot, msg, suffix) {
      var args = suffix.split(' ');
      var user = args.shift();
      var message = args.join(' ');
      if (user.startsWith('<@')) {
        user = user.substr(2, user.length - 3);
      }
      var target = msg.channel.guild.members.find("id", user);
      if (!target) {
        target = msg.channel.guild.members.find("username", user);
      }
      messagebox[target.id] = {
        channel: msg.author.id,
        content: target + ", " + msg.author + " said: " + message
      };
      updateMessagebox();
      msg.author.sendMessage("message saved.")
    }
  },
  "eval": {
    usage: "<command>",
    description: 'Executes arbitrary javascript in the bot process. User must have "eval" permission',
    process: function (bot, msg, suffix) {
      if (Permissions.checkPermission(msg.author, "eval")) {
        msg.author.sendMessage(eval(suffix, bot));
      } else {
        msg.author.sendMessage(msg.author + " doesn't have permission to execute eval!");
      }
    }
  },
  "id": {
    description: 'Tells you your discord id',
    process: function (bot, msg, suffix) {
      if (Permissions.checkPermission(msg.author, "id")) {
        msg.author.sendMessage("Your id is " + msg.author.id);
      } else {
        msg.author.sendMessage(msg.author + " doesn't have permission to execute eval!");
      }
    }
  },
  "register": {
    usage: "<code>",
    description: 'Registers your EVE account using your Discord Code',
    process: function (bot, msg, suffix) {
      models.aider_users.findOne({
        where: {discord_id: suffix}
      }).then(function (user) {
        if (user && user.dataValues) {
          user.update({
            discord_id: msg.author.id
          }).then(function (user) {
            msg.author.sendMessage("Link Complete!");
          });
        }
        else {
          msg.author.sendMessage("Not Found!");
        }
        console.log(user);

      });
    }
  },
  "name": {
    description: 'Tells you your EVE characters name.',
    process: function (bot, msg, suffix) {
      models.aider_users.findOne({
        where: {discord_id: msg.author.id}
      }).then(function (user) {
        if (user && user.dataValues) {
          msg.author.send(JSON.stringify(user.dataValues.main_id));
        }
        else {
          msg.author.send("Not Found!");
        }
        console.log(user);
      });
    }
  },
  "reset": {
    description: 'Reset your registration for FEDUP Discord.',
    process: function (bot, msg, suffix) {
      models.user.findOne({
        where: {discord_id: msg.author.id}
      }).then(function (user) {
        if (user && user.dataValues) {
          // delete user
          user.destroy();
          msg.author.sendMessage("You are reset... Hopefully!");
        }
        else {
          msg.author.sendMessage("Not Found!");
        }
        //console.log(user);
      });
    }
  },
  "link": {
    description: 'Tells you your EVE characters name.',
    process: function (bot, msg, suffix) {
      msg.author.sendMessage("http://services.jerkasauruswrecks.com:3000");
    }

  },
  "testfoo": {
    description: 'testfoo',
    process: function (bot, msg, suffix) {
      models.eve_characters.findOne({
        where: {character_id: suffix}
      }).then(function(user){

        msg.author.send(JSON.stringify(user));
      })
    }
  },
  "corp": {
    description: 'Displays your corporation',
    process: function (bot, msg, suffix) {
      models.user.findOne({
        where: {discord_id: msg.author.id}
      }).then(function (user) {
        if (user && user.dataValues) {
          var headers = {
            "Content-Type": "application/json",
          }

          var options = {
            url: 'https://esi.tech.ccp.is/latest/characters/' + user.char_id + '/?datasource=tranquility',
            method: 'GET',
            headers: headers,
          }
          request(options, function (error, response, body) {
            var character = JSON.parse(body);
            console.log(error);
            //console.log("character found " + character.name + ", corp id: " + character.corporation_id)
            options.url = 'https://esi.tech.ccp.is/latest/corporations/' + character.corporation_id + '/?datasource=tranquility'
            request(options, function (error, response, body) {
              var corporation = JSON.parse(body);
              msg.author.sendMessage("Your corporation is " + corporation.corporation_name);
            });
            //msg.author.sendMessage(body.corporation_id.toString());
          });
        } else {
          msg.author.sendMessage("No Character Found!");
        }
      });
    }
  },
  "see": {
    usage: "<User>",
    description: 'Displays the chosen users registration status and corp.',
    process: function (bot, msg, suffix) {
      console.log("Starting looking");
      var args = suffix.split(' ');
      var userToFind = args.shift();
      var message = args.join(' ');
      //console.log(userToFind);
      if (userToFind.startsWith('<@')) {
        userToFind = userToFind.substr(2, userToFind.length - 3);
      }
      var target = msg.channel.guild.members.get(userToFind);
      if (!target) {
        target = msg.channel.guild.members.find("username", userToFind);
      }

      //console.log("Target id: " + target.id);
      if (target && target.id) {
        models.user.findOne({
          where: {discord_id: target.id}
        }).then(function (user) {
          console.log("HIT IT");
          if (user && user.dataValues) {
            //console.log(user.dataValues);
            var headers = {
              "Content-Type": "application/json",
            }

            var options = {
              url: 'https://esi.tech.ccp.is/latest/characters/' + user.char_id + '/?datasource=tranquility',
              method: 'GET',
              headers: headers,
            }
            request(options, function (error, response, body) {
              var character = JSON.parse(body);
              options.url = 'https://esi.tech.ccp.is/latest/corporations/' + character.corporation_id + '/?datasource=tranquility'
              request(options, function (error, response, body) {

                var corporation = JSON.parse(body);
                msg.author.sendMessage(character.name + "'s corporation is " + corporation.corporation_name);

                console.log("@#@#@");
                console.log(msg.channel.guild.roles.find("name", "Member").id);
                console.log("@#@#@");
                console.log(msg.author);
              });
            });
          }
        });
      } else {
        msg.author.sendMessage("No ID Found!");
      }
    }
  },
  "validate": {
    usage: "<User>",
    description: 'Registers your EVE account using your Discord Code',
    process: function (bot, msg, suffix) {
      console.log("Starting looking");
      var args = suffix.split(' ');
      var userToFind = args.shift();
      var message = args.join(' ');

      console.log("!@#$@#");
      console.log(userToFind);
      console.log("!@#$@#");
      if (userToFind.startsWith('<@')) {
        userToFind = userToFind.replace('<', '').replace('>', '').replace('@', '').replace('!', '');
      } else {
        userToFind = msg.author.id
      }

      console.log(userToFind);
      var target = msg.channel.guild.members.get(userToFind);
      if (!target) {
        target = msg.channel.guild.members.find("username", userToFind);
      }

      //console.log("Target id: " + target.id);
      if (target && target.id) {
        models.user.findOne({
          where: {discord_id: target.id}
        }).then(function (user) {
          //console.log("HIT IT " + user.dataValues.name);
          if (user && user.dataValues) {
            refreshToken(user, function (token) {
              console.log(token);
              eveonlinejs.setParams({
                accessToken: token.access_token,
                accessType: "Character"
              });
              eveonlinejs.fetch('char:FacWarStats', {characterID: user.char_id}, function (err, result) {
                if (err) console.log(err)
                if (err && err.response && err.response.statusCode == 400) {
                  msg.author.sendMessage(user.dataValues.name + " is not a member of Faction Warfare.");
                  console.log(msg.channel.guild.roles.find("name", "Militia"))
                  target.removeRole(msg.channel.guild.roles.find("name", "Militia")).then(function () {
                    console.log("DONE");
                  }).catch(function (err) {
                    console.log(err);
                  });
                } else {
                  console.log(result.factionName);
                  var messageEnd = result.factionName == "Gallente Federation" ? " adding them to the militia." : " enemy Milita";


                  msg.author.sendMessage(user.dataValues.name + " is a member of the " + result.factionName + "" + messageEnd);

                  if (result.factionName == "Gallente Federation") {
                    target.addRole(msg.channel.guild.roles.find("name", "Militia")).then(function () {
                      console.log("DONE militia");
                    }).catch(function (err) {
                      console.log(err);
                    });
                  }
                }

                console.log("FOO");
              });
            });

            //console.log(user.dataValues);
            var headers = {
              "Content-Type": "application/json",
            }

            var options = {
              url: 'https://esi.tech.ccp.is/latest/characters/' + user.char_id + '/?datasource=tranquility',
              method: 'GET',
              headers: headers,
            }
            request(options, function (error, response, body) {
              var character = JSON.parse(body);
              options.url = 'https://esi.tech.ccp.is/latest/corporations/' + character.corporation_id + '/?datasource=tranquility'
              request(options, function (error, response, body) {
                var corporation = JSON.parse(body);
                corp = corporations.searchByName(corporation.corporation_name);
                console.log(corp);
                if (corp) {
                  msg.author.sendMessage(character.name + "'s corporation is " + corp.name + " " + corp.tag + " tag approved.");
                  target.addRole(msg.channel.guild.roles.find("name", corp.tag)).then(function () {

                    console.log("DONE");
                  }).catch(function (err) {
                    console.log(err);
                  });
                } else {
                  msg.author.sendMessage(character.name + "'s corporation is " + corporation.corporation_name + " FEDUP corp membership denied.");
                }

                console.log("ALLIANCE ID: " + corporation.alliance_id);

                options.url = 'https://esi.tech.ccp.is/latest/alliances/' + corporation.alliance_id + '/?datasource=tranquility'
                request(options, function (error, response, body) {

                  var alliance = JSON.parse(body);
                  //msg.author.sendMessage(character.name +"'s Alliance is " + alliance.alliance_name + " member tag approved");

                  if (alliance.alliance_name == 'Federation Uprising') {
                    msg.author.sendMessage(character.name + "'s Alliance is " + alliance.alliance_name + " member tag approved");
                    target.addRole(msg.channel.guild.roles.find("name", "Member")).then(function () {
                      console.log("DONE");
                    }).catch(function (err) {
                      console.log(err);
                    });
                  } else if (alliance.alliance_name == 'Pen Is Out') {
                    msg.author.sendMessage(character.name + "'s Alliance is " + alliance.alliance_name + " WANGS tag approved");
                    target.addRole(msg.channel.guild.roles.find("name", "WANGS")).then(function () {
                      console.log("DONE");
                    }).catch(function (err) {
                      console.log(err);
                    });
                  } else {
                    target.removeRole(msg.channel.guild.roles.find("name", "Member")).then(function () {
                      console.log("DONE");
                    }).catch(function (err) {
                      console.log(err);
                    });

                    msg.author.sendMessage(character.name + "'s Alliance is " + alliance.alliance_name + " member tag denied.");
                    //msg.author.removeFrom(msg.channel.guild.roles.find("name", "Member"), null);
                  }
                });

              });
            });
          } else {
            msg.author.sendMessage("User is not registered yet. Visit http://services.jerkasauruswrecks.com:3000/ to register");
          }
        });
      } else {

        msg.author.sendMessage("No ID Found! Maybe you need to register. Visit http://services.jerkasauruswrecks.com:3000/ to register");
      }

    }
  },
  "channels": {
    description: "List available Discord channels",
    process: function (bot, msg, suffix) {
      msg.author.sendMessage("**Available Channels:** ").then(function () {
        var channelsMessage = joinableChannels.map(function (channel) {
          return "**" + channel.name + "** - " + channel.description;
        }).join('\n');
        msg.author.sendMessage(channelsMessage);
      });
    }
  },
  "join": {
    usage: "<channel name>",
    description: "Join a channel",
    process: function (bot, msg, suffix) {
      msg.channel
      if (msg.channel == bot.channels.get(access_request)) {


        var channelName = suffix;
        if (!channelName) {
          msg.author.sendMessage("Please provide a channel name to join");
          return;
        }
        channelName = channelName.replace('#', '').toLowerCase();
        var channel = joinableChannels.find(function (channel) {
          return channel.name === channelName;
        });
        if (!channel) {
          msg.author.sendMessage('Channel "' + channelName + '" not found');
          return;
        }
        var guild = bot.guilds.array()[0];
        var guildChannel = guild.channels.find("name", channelName);
        var memberChannel = guild.channels.find("name", "fluid-router");
        var currentPermissions = guildChannel.permissionsFor(msg.author);
        var memberPermissions = memberChannel.permissionsFor(msg.author)


        if (currentPermissions.hasPermissions(["READ_MESSAGES", "SEND_MESSAGES"])) {
          msg.author.sendMessage("You already have access to this channel");
          return;
        }
        var user = guild.members.get(msg.author.id);

        console.log(user.roles);


        if (channel.protected == 0) {
          channel.grantAccess(user, guild).then(function () {
            msg.author.sendMessage("Access granted!");
          }, function (err) {
            console.log(err);
            msg.author.sendMessage("Could not grant access to the channel. Reason: " + err);
          });
        } else if (channel.protected == 1 && memberPermissions.hasPermissions(["READ_MESSAGES", "SEND_MESSAGES"])) {
          channel.grantAccess(user, guild).then(function () {
            msg.author.sendMessage("Access granted!");
          }, function (err) {
            console.log(err);
            msg.author.sendMessage("Could not grant access to the channel. Reason: " + err);
          });
        } else {
          msg.author.sendMessage("You need to be at least a Member to enter that channel");
        }
      } else {
        msg.author.sendMessage("Please use " + bot.channels.get(access_request) + " channel for all join and leave commands.");
      }
    }
  },
  "leave": {
    usage: "<channel name>",
    description: "Leave a channel",
    process: function (bot, msg, suffix) {
      var channelName = suffix;
      if (msg.channel == bot.channels.get(access_request)) {
        if (!channelName) {
          msg.author.sendMessage("Please provide a channel name to leave");
          return;
        }
        channelName = channelName.replace('#', '').toLowerCase();
        var channel = joinableChannels.find(function (channel) {
          return channel.name === channelName;
        });
        if (!channel) {
          msg.author.sendMessage('Channel "' + channelName + '" not found');
          return;
        }
        var guild = bot.guilds.array()[0];
        var user = guild.members.get(msg.author.id);

        channel.revokeAccess(user, guild).then(function () {
          msg.author.sendMessage("You have left the channel!");
        }, function (err) {
          console.log(err);
          msg.author.sendMessage("Could not revoke access to the channel. Reason: " + err);
        });
      } else {
        msg.author.sendMessage("Please use #access_request channel for all join and leave commands.");
      }
    }
  },
  "fw": {
    description: "Get a report on the current FW situation",
    process: function (bot, msg, suffix) {
      models.fw_api_log.findOne({
        where: {
          report: {
            $ne: null
          }
        },
        order: [
          ['cached_until', 'DESC']
        ]
      }).then(function (logEntry) {
        if (!logEntry) {
          msg.author.sendMessage("Faction warfare report not available");
          return;
        }

        var reportAge = moment(logEntry.cached_until).subtract(1, 'h').fromNow();
        var message = bold("Gallente-Caldari Warzone Report - Updated Hourly") + "\n" +
          "Last updated approximately " + reportAge + "\n\n" +
          displayTopContested("Gallente Federation") + '\n' +
          displayTopContested("Caldari State") + '\n' +
          displayTopChanges(function (system) {
            return system.owner === "Caldari State" || system.owner === "Gallente Federation";
          });

        msg.author.sendMessage(message);

        message = bold("Amarr-Minmatar Warzone Report") + "\n\n" +
          displayTopContested("Minmatar Republic") + '\n' +
          displayTopContested("Amarr Empire") + '\n' +
          displayTopChanges(function (system) {
            return system.owner === "Amarr Empire" || system.owner === "Minmatar Republic";
          });

        msg.author.sendMessage(message);

        function displayTopContested(faction) {
          var systems = _(logEntry.report)
            .filter({owner: faction})
            .sortBy('complexesToCapture')
            .take(5)
            .map(displaySystem)
            .value();

          var message = bold(faction + " - Most Contested Systems") + "\n" + systems.join('\n') + '\n';
          return message;
        }

        function displaySystem(system) {
          var message = bold(system.name) + " - " + system.contestedPercentage + "%";
          if (system.complexesToCapture <= 20) {
            message += " (vulnerable after " + bold(system.complexesToCapture.toString()) + " more complexes)";
          }
          return message;
        }

        function displayTopChanges(systemFilter) {
          var systems = _(logEntry.report)
            .filter(function (system) {
              return systemFilter(system) && Math.abs(system.contestedPercentage3HourDelta) > 0;
            })
            .sortBy(function (system) {
              return -Math.abs(system.contestedPercentage3HourDelta);
            });

          if (systems.size() === 0) {
            return "";
          }

          var attackedSystems = systems
            .filter(function (system) {
              return system.contestedPercentage3HourDelta > 0;
            })
            .map(displaySystemChange)
            .take(5)
            .value();

          var defendedSystems = systems
            .filter(function (system) {
              return system.contestedPercentage3HourDelta < 0;
            })
            .map(displaySystemChange)
            .take(5)
            .value();

          var message = bold("Last 3 hours - Most Attacked:") + '\n' +
            attackedSystems.join('\n') + '\n\n' +
            bold("Last 3 hours - Most Defended: ") + '\n' +
            defendedSystems.join('\n') + '\n';

          return message;
        }

        function displaySystemChange(system) {
          var message = bold(system.name) + " (" + system.owner + ") " +
            bold((system.contestedPercentage3HourDelta > 0 ? '+' : '') + system.contestedPercentage3HourDelta.toString() + "%") +
            " (" + system.contestedPercentage3HoursAgo.toString() + "% -> " + system.contestedPercentage.toString() + "%)";

          return message;
        }

        function bold(string) {
          return "**" + string + "**";
        }
      });
    }
  }
};

bot.login(AuthDetails.bot_token);

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

module.exports = bot;
