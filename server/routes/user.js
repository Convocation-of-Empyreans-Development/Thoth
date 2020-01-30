var express = require('express');
var router = express.Router();
var http = require('http');
var request = require('request');

router.get('/', function(req, res){
	console.log("Hit it");
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
			'code': req.query.code, 
			'grant_type': 'authorization_code'
		}
	}

	request(options, function(error, response, body){
		console.log(response.body.access_token);
		res.status(200).send(response);
	});
})

module.exports = router;