var joinableChannels = require('./joinableChannels.js');
var botUtils = require('./botutils.js');
const {convocationChannels} = require("./channels.js");
const {distanceToDowntime, getCurrentRoles} = require("./botutils");

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
      msg.channel.send(suffix);
    }
  },
  "welcome": {
    description: 'Sends you the Discord Welcome Message',
    process: function (bot, msg, models, suffix) {
      var welcomeMessage = require('./welcomeMessage.js');
      msg.author.send(welcomeMessage);
    }
  },
  "id": {
    description: 'Tells you your discord id',
    process: function (bot, msg, models, suffix) {
      msg.author.send("Your id is " + msg.author.id);
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
  "validate": {
    usage: "<User>",
    description: 'Registers your EVE account using your Discord Code',
    process: function (bot, msg, models, suffix) {
      var args = suffix.split(' ');
      var userToFind = args.shift();
      var message = args.join(' ');

      if (userToFind.startsWith('<@')) {
        userToFind = userToFind.replace('<', '').replace('>', '').replace('@', '').replace('!', '');
      } else {
        userToFind = msg.author.id
      }
      console.log(msg.guild.members.resolve(userToFind));
      botUtils.validate(msg, models, bot, msg.guild.members.resolve(userToFind));
      msg.channel.send("Validatation Complete");
    }
  },
  "testfoo": {
    description: 'testfoo',
    process: function (bot, msg, models, suffix) {
      msg.channel.send("https://cdn.discordapp.com/avatars/" + msg.author.id + "/" + msg.author.avatar + ".png")
      models.aider_users.findAll({include:[
        {model: models.eve_characters,
          foreignKey:'main_id',
          sourceKey: 'character_id'}]})
        .then(users =>{
          users.forEach((user, i) => {
            console.log(user.dataValues.eve_character.dataValues.name);
          });


        });


      //botUtils.massValidate(msg.guild, models, bot)
      /*models.aider_users.findOne({
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
*/
      //msg.author.send(JSON.stringify(msg.guild.roles.cache.find(role => role.name === "Member")));
    }
  },
  "announce": {
    usage: "<message>",
    description: "Send a message to the Announcements channel if the user has the Broadcaster role [DM only]",
    process: function (bot, msg, models, suffix) {
      // Get the user's GuildMember instance
      let guild = bot.guilds.get(convocationChannels.server);
      let guildMember = guild.members.get(msg.author.id);
      let memberRoles = getCurrentRoles(guildMember);
      // Verify if the message was sent via Direct Message to the bot
      if (msg.channel.type === "dm" && memberRoles.includes("Broadcaster")) {
        let announcementsChannel = guild.channels.get(convocationChannels.announcements);
        const embed = new Discord.MessageEmbed()
            .setAuthor(guildMember.nickname)
            .setDescription(msg.content.replace("/^(\!announce) /", ""));
        announcementsChannel.send(embed);
      } else {
        console.log(`Received !announce from ${guildMember.nickname} without role or not in DM; ignoring`);
      }
    }
  },
  "requestvoice": {
    description: "Request permission for voice activation usage in voice channels",
    process: function (bot, msg, models, suffix) {
      // TODO: extract this into a helper method
      const role = msg.guild.roles.cache.find(role => role.name === "Voice Active Allowed");
      const member = msg.mentions.members.first();
      member.roles.add(role);

      const embed = new Discord.MessageEmbed()
          .setAuthor(msg.author.username)
          .setTitle(`Voice activation request from ${msg.author.username}`)
          .setDescription("React with ❌ to revoke this permission.");

      // get bot admin channel
      let adminChannel = msg.guild.channels.cache.get(convocationChannels.bot_admin);
      // send embed to channel and react with ❌
      adminChannel.send(embed).then(sent => {
        sent.react("❌").then(() => {
          const filter = (reaction) => {
            return reaction.emoji.name === "❌";
          }
          sent.awaitReactions(filter, {max: 2, time: distanceToDowntime() * 1000, errors: ["time"]})
              .then(_ => {
                member.roles.remove(role);
                // Create a new embed to prevent cache invalidation
                // https://discordjs.guide/popular-topics/embeds.html#resending-a-received-embed
                const embed = new Discord.MessageEmbed()
                    .setAuthor("test")
                    .setTitle(`Voice activation request from ${member.displayName} revoked manually`);
                sent.edit(embed);
              })
              .catch(_ => {
                member.roles.remove(role);
                const embed = new Discord.MessageEmbed()
                    .setAuthor("test")
                    .setTitle(`Voice activation request from ${member.displayName} expired at downtime`);
                sent.edit(embed);
              });
        });
      })
    }
  }
  /*"corp": {
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
  }*/
};


module.exports = commands;
/*
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
*/
