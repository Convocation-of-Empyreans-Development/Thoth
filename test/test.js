var assert = require("assert");
var Discord = require("discord.js")
var bot = new Discord.Client();

const DISCORD_BOT_USERNAME = "Thoth#7445";

describe("Discord bot", function() {
    describe("#initialize", function() {
        it("should log in using the provided token", function() {
            let token;
            if (process.env.GITHUB_ACTIONS) {
                token = process.env.DISCORD_BOT_TOKEN;
            } else {
                var AuthDetails = require("../../secret/discordSecret.json");
                token = AuthDetails.bot_token;
            }
            bot.login(token)
                .then(() => {
                    assert.equal(bot.user.tag, DISCORD_BOT_USERNAME);
                    bot.destroy();
                })
        })
    })
})
