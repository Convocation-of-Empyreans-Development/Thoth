var http = require('http');
var request = require('request');
var jwt = require('jsonwebtoken');
var models  = require('../models');

var db = require('../database/database.js');


var verifyToken = function(tokenData, res) {
//console.log(req.query);
	var headers = {
	    "Content-Type": "application/json",
	    'Authorization': 'Bearer ' + tokenData.access_token,
	    'Host': 'login.eveonline.com'
	}

	var options = {
		url: 'https://login.eveonline.com/oauth/verify',
		method: 'GET',
		headers: headers,
	}
	request(options, function(error, response, body){
		var body = JSON.parse(body.replace('\\', ''));
		var user = {};
		var query = "SELECT * FROM users WHERE char_id='" + body.CharacterID + "'";
		db.query(query).spread(function(result,metadata){
			if(result.length == 0){
				user.char_id = body.CharacterID;
				user.name = body.CharacterName;
				user.access_token = tokenData.access_token;
				user.refresh_token = tokenData.refresh_token
				console.log(tokenData.refresh_token);
                user.discord_id = "Dis:" + guid();
                user = models.user.build(user);


				user.save().then(function(){
					res.status(200).send("One more step. Please message Aura-Bot with !register " + user.discord_id);
				});
			}
			else{
				console.log(result[0]);
				user = result[0]
				if(user){
					var query = "UPDATE Users SET access_token='" + tokenData.access_token + "', refresh_token='" + tokenData.refresh_token + "' WHERE discord_id='" + user.discord_id + "'";
					db.query(query).spread(function(result, metadata){
						if(user.discord_id.startsWith("Dis:")){
							res.status(200).send("One more step. Please message Aura-Bot with !register " + user.discord_id);
						} else {
							res.status(200).send("You're good to go! " + tokenData.access_token);
						}
					}).catch(function(err) {
						res.status(400).send(err)
					});
				}
				
			}
		});
		return tokenData;
	});
}

module.exports.validateToken = function(req, res) {
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
			'code': req.query.code, 
			'grant_type': 'authorization_code'
		}
	}
	request(options, function(error, response, body){
		console.log("SDFJSDF");
		var body = JSON.parse(body);
		if(body.access_token) {
			var tokenData = {};

			tokenData.access_token = body.access_token;
			tokenData.refresh_token = body.refresh_token;
			console.log(tokenData);
			var expiresIn = 60 * body.expires_in.valueOf();

			tokenData.signedToken = jwt.sign(tokenData, process.env.SECRET, {
				expiresIn: expiresIn
			});
			tokenData.signedToken = 
			verifyToken(tokenData, res);
		}
		else{
			res.status(500).json(body);
		}
	});
}

module.exports.refreshToken = function(req, res){
	//console.log(req.query);
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
			'refresh_token': req.query.token, 
			'grant_type': 'refresh_token'
		}
	}
	request(options, function(error, response, body){
		res.status(200).send(response);
		console.log(response.body.access_token);
		return response;
	});
}

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

