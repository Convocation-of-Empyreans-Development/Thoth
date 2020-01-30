var express = require('express');
var router = express.Router();
var models = require('../models');
var db = require('../database/database');
var bot = require('../bot/bot');

var lobby = "82165230402015232"
router.post('/', function(req, res){
	console.log("hit it");
	bot.sendMessage(lobby, req.body.msg);
	res.status(200).send("Message sent");
});

module.exports = router;