var joinableChannels = require('./joinableChannels.js');
var botUtils = require('./botutils.js');

var commands = {
  "ping": {
    description: "responds pong, useful for checking if bot is alive",
    process: function (bot, msg, models, suffix) {
      msg.author.send(msg.author + " pong!");
      if (suffix) {
        msg.author.send("note that !ping takes no arguments!");
      }
    }
  },
  "roleverification": {
    description: "verifies the servers roles vs managed roles",
    process: function (bot, msg, models, suffix){
      models.aider_roles.findAll().then(aiderRoles =>
      {
          bot.guilds.cache.forEach((guild, i) => {
            console.log("\nLogged in! Serving in " + bot.guilds.resolve(guild).name);
            console.log("Syncing Roles for " + bot.guilds.resolve(guild).name + "\n");

            aiderRoles.forEach((aiderRole, i) => {
              if(aiderRole.applies_to_discord){
                botUtils.findDiscordRoleByAiderRole(guild, aiderRole, result => {
                  if(result){
                    console.log("Found: " + result.name + " " + result.id);
                  } else {
                    console.log("Cannot find " + aiderRole.role_name + " among " + guild.name + "'s roles");
                  }
                });
              } else{
                console.log('not included ' + aiderRole.role_name);
              }
            });
            guild.roles.cache.forEach((item, i) => {
                botUtils.findAiderRoleByID(guild, models, item.id, result => {
                  if(result){
                    //console.log(result.role_name);
                  } else{
                    console.log(item.name + " not found " + guild.name);
                  }
                });
            });


            console.log("Syncing Roles complete " + bot.guilds.resolve(guild).name + "\n\n\n\n");
          });
      });
    }
  },
  "idle": {
    usage: "[status]",
    description: "sets bot status to idle",
    process: function (bot, msg, models, suffix) {
      bot.user.setStatus("idle");
      //bot.user.setGame(suffix);
    }
  },
  "online": {
    usage: "[status]",
    description: "sets bot status to online",
    process: function (bot, msg, models, suffix) {
      bot.user.setStatus("online");
      bot.user.setGame(suffix);
    }
  },
  "say": {
    usage: "<message>",
    description: "bot says message",
    process: function (bot, msg, models, suffix) {
      msg.author.send(suffix);
    }
  },
  "announce": {
    usage: "<message>",
    description: "bot says message with text to speech",
    process: function (bot, msg, models, suffix) {
      msg.author.send(suffix, {tts: true});
    }
  },
  "msg": {
    usage: "<user> <message to leave user>",
    description: "leaves a message for a user the next time they come online",
    process: function (bot, msg, models, suffix) {
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
      msg.author.send("message saved.")
    }
  },
  "eval": {
    usage: "<command>",
    description: 'Executes arbitrary javascript in the bot process. User must have "eval" permission',
    process: function (bot, msg, models, suffix) {
      if (Permissions.checkPermission(msg.author, "eval")) {
        msg.author.send(eval(suffix, bot));
      } else {
        msg.author.send(msg.author + " doesn't have permission to execute eval!");
      }
    }
  },
  "id": {
    description: 'Tells you your discord id',
    process: function (bot, msg, models, suffix) {
      if (Permissions.checkPermission(msg.author, "id")) {
        msg.author.send("Your id is " + msg.author.id);
      } else {
        msg.author.send(msg.author + " doesn't have permission to execute eval!");
      }
    }
  },
  "register": {
    usage: "<code>",
    description: 'Registers your EVE account using your Discord Code',
    process: function (bot, msg, models, suffix) {
      models.aider_users.findOne({
        where: {discord_id: suffix}
      }).then(function (user) {
        if (user && user.dataValues) {
          user.update({
            discord_id: msg.author.id
          }).then(function (user) {
            msg.author.send("Link Complete!");
          });
        }
        else {
          msg.author.send("Not Found!");
        }
        console.log(user);

      });
    }
  },
  "name": {
    description: 'Tells you your EVE characters name.',
    process: function (bot, msg, models, suffix) {
      models.aider_users.findOne({
        where: {discord_id: msg.author.id},
        include:[models.eve_characters]
      }).then(function (user) {
        if (user && user.dataValues) {
            msg.author.send(JSON.stringify(user.dataValues.eve_character.name));
        }
        else {
          msg.author.send("Not Found!");
        }
        console.log(user);
      }).catch(error => {console.log(error.message)});
    }
  },
  "reset": {
    description: 'Reset your registration for FEDUP Discord.',
    process: function (bot, msg, models, suffix) {
      models.user.findOne({
        where: {discord_id: msg.author.id}
      }).then(function (user) {
        if (user && user.dataValues) {
          // delete user
          user.destroy();
          msg.author.send("You are reset... Hopefully!");
        }
        else {
          msg.author.send("Not Found!");
        }
        //console.log(user);
      });
    }
  },
  "link": {
    description: 'Tells you your EVE characters name.',
    process: function (bot, msg, models, suffix) {
      msg.author.send("http://services.jerkasauruswrecks.com:3000");
    }
  },
  "testfoo": {
    description: 'testfoo',
    process: function (bot, msg, models, suffix) {
      models.aider_users.findOne({
        where: {discord_id: msg.author.id},
        include:[{
          model: models.aider_roles,
          throguh: {
            model: models.aider_user_roles,
            foreignKey: 'user_id',
            otherkey: 'role_id'
          }
        }]
      }).then(function (user) {
        if (user && user.dataValues) {
          user.dataValues.aider_roles.forEach((item, i) => {
            msg.author.send(JSON.stringify(item));
          });
        }
        else {
          msg.author.send("Not Found!");
        }
      }).catch(error => {console.log(error.message)});

      //msg.author.send(JSON.stringify(msg.guild.roles.cache.find(role => role.name === "Member")));
    }
  },
  "corp": {
    description: 'Displays your corporation',
    process: function (bot, msg, models, suffix) {
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
              msg.author.send("Your corporation is " + corporation.corporation_name);
            });
            //msg.author.send(body.corporation_id.toString());
          });
        } else {
          msg.author.send("No Character Found!");
        }
      });
    }
  },
  "see": {
    usage: "<User>",
    description: 'Displays the chosen users registration status and corp.',
    process: function (bot, msg, models, suffix) {
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
                msg.author.send(character.name + "'s corporation is " + corporation.corporation_name);

                console.log("@#@#@");
                console.log(msg.channel.guild.roles.find("name", "Member").id);
                console.log("@#@#@");
                console.log(msg.author);
              });
            });
          }
        });
      } else {
        msg.author.send("No ID Found!");
      }
    }
  },
  "validate": {
    usage: "<User>",
    description: 'Registers your EVE account using your Discord Code',
    process: function (bot, msg, models, suffix) {
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
                  msg.author.send(user.dataValues.name + " is not a member of Faction Warfare.");
                  console.log(msg.channel.guild.roles.find("name", "Militia"))
                  target.removeRole(msg.channel.guild.roles.find("name", "Militia")).then(function () {
                    console.log("DONE");
                  }).catch(function (err) {
                    console.log(err);
                  });
                } else {
                  console.log(result.factionName);
                  var messageEnd = result.factionName == "Gallente Federation" ? " adding them to the militia." : " enemy Milita";


                  msg.author.send(user.dataValues.name + " is a member of the " + result.factionName + "" + messageEnd);

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
                  msg.author.send(character.name + "'s corporation is " + corp.name + " " + corp.tag + " tag approved.");
                  target.addRole(msg.channel.guild.roles.find("name", corp.tag)).then(function () {

                    console.log("DONE");
                  }).catch(function (err) {
                    console.log(err);
                  });
                } else {
                  msg.author.send(character.name + "'s corporation is " + corporation.corporation_name + " FEDUP corp membership denied.");
                }

                console.log("ALLIANCE ID: " + corporation.alliance_id);

                options.url = 'https://esi.tech.ccp.is/latest/alliances/' + corporation.alliance_id + '/?datasource=tranquility'
                request(options, function (error, response, body) {

                  var alliance = JSON.parse(body);
                  //msg.author.send(character.name +"'s Alliance is " + alliance.alliance_name + " member tag approved");

                  if (alliance.alliance_name == 'Federation Uprising') {
                    msg.author.send(character.name + "'s Alliance is " + alliance.alliance_name + " member tag approved");
                    target.addRole(msg.channel.guild.roles.find("name", "Member")).then(function () {
                      console.log("DONE");
                    }).catch(function (err) {
                      console.log(err);
                    });
                  } else if (alliance.alliance_name == 'Pen Is Out') {
                    msg.author.send(character.name + "'s Alliance is " + alliance.alliance_name + " WANGS tag approved");
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

                    msg.author.send(character.name + "'s Alliance is " + alliance.alliance_name + " member tag denied.");
                    //msg.author.removeFrom(msg.channel.guild.roles.find("name", "Member"), null);
                  }
                });

              });
            });
          } else {
            msg.author.send("User is not registered yet. Visit http://services.jerkasauruswrecks.com:3000/ to register");
          }
        });
      } else {

        msg.author.send("No ID Found! Maybe you need to register. Visit http://services.jerkasauruswrecks.com:3000/ to register");
      }

    }
  },
  "channels": {
    description: "List available Discord channels",
    process: function (bot, msg, models, suffix) {
      msg.author.send("**Available Channels:** ").then(function () {
        var channelsMessage = joinableChannels.map(function (channel) {
          return "**" + channel.name + "** - " + channel.description;
        }).join('\n');
        msg.author.send(channelsMessage);
      });
    }
  },
  "join": {
    usage: "<channel name>",
    description: "Join a channel",
    process: function (bot, msg, models, suffix) {
      msg.channel
      if (msg.channel == bot.channels.get(access_request)) {


        var channelName = suffix;
        if (!channelName) {
          msg.author.send("Please provide a channel name to join");
          return;
        }
        channelName = channelName.replace('#', '').toLowerCase();
        var channel = joinableChannels.find(function (channel) {
          return channel.name === channelName;
        });
        if (!channel) {
          msg.author.send('Channel "' + channelName + '" not found');
          return;
        }
        var guild = bot.guilds.array()[0];
        var guildChannel = guild.channels.find("name", channelName);
        var memberChannel = guild.channels.find("name", "fluid-router");
        var currentPermissions = guildChannel.permissionsFor(msg.author);
        var memberPermissions = memberChannel.permissionsFor(msg.author)


        if (currentPermissions.hasPermissions(["READ_MESSAGES", "SEND_MESSAGES"])) {
          msg.author.send("You already have access to this channel");
          return;
        }
        var user = guild.members.get(msg.author.id);

        console.log(user.roles);


        if (channel.protected == 0) {
          channel.grantAccess(user, guild).then(function () {
            msg.author.send("Access granted!");
          }, function (err) {
            console.log(err);
            msg.author.send("Could not grant access to the channel. Reason: " + err);
          });
        } else if (channel.protected == 1 && memberPermissions.hasPermissions(["READ_MESSAGES", "SEND_MESSAGES"])) {
          channel.grantAccess(user, guild).then(function () {
            msg.author.send("Access granted!");
          }, function (err) {
            console.log(err);
            msg.author.send("Could not grant access to the channel. Reason: " + err);
          });
        } else {
          msg.author.send("You need to be at least a Member to enter that channel");
        }
      } else {
        msg.author.send("Please use " + bot.channels.get(access_request) + " channel for all join and leave commands.");
      }
    }
  },
  "leave": {
    usage: "<channel name>",
    description: "Leave a channel",
    process: function (bot, msg, models, suffix) {
      var channelName = suffix;
      if (msg.channel == bot.channels.get(access_request)) {
        if (!channelName) {
          msg.author.send("Please provide a channel name to leave");
          return;
        }
        channelName = channelName.replace('#', '').toLowerCase();
        var channel = joinableChannels.find(function (channel) {
          return channel.name === channelName;
        });
        if (!channel) {
          msg.author.send('Channel "' + channelName + '" not found');
          return;
        }
        var guild = bot.guilds.array()[0];
        var user = guild.members.get(msg.author.id);

        channel.revokeAccess(user, guild).then(function () {
          msg.author.send("You have left the channel!");
        }, function (err) {
          console.log(err);
          msg.author.send("Could not revoke access to the channel. Reason: " + err);
        });
      } else {
        msg.author.send("Please use #access_request channel for all join and leave commands.");
      }
    }
  },
  "fw": {
    description: "Get a report on the current FW situation",
    process: function (bot, msg, models, suffix) {
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
          msg.author.send("Faction warfare report not available");
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

        msg.author.send(message);

        message = bold("Amarr-Minmatar Warzone Report") + "\n\n" +
          displayTopContested("Minmatar Republic") + '\n' +
          displayTopContested("Amarr Empire") + '\n' +
          displayTopChanges(function (system) {
            return system.owner === "Amarr Empire" || system.owner === "Minmatar Republic";
          });

        msg.author.send(message);

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


module.exports = commands;
