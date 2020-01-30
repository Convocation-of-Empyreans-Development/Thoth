var express = require('express');
var router = express.Router();
var http = require('http');
var request = require('request');
var models = require('../models');

router.get('/latest', function(req, res){
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
		res.json({data: logEntry});    		
    });
})

router.get('/report', function(req, res){
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
		res.json({data: logEntry.report});    		
    });
})

router.get('/reports/:limit', function(req, res){
	models.fw_api_log.findAll({
        where: {
          report: {
            $ne: null
          }
        },
        order: [
        	['cached_until', 'DESC']
    	],
    	limit: req.params.limit
    }).then(function (logEntry) {
    	var data;
		res.json({data: logEntry});    		
    });
})

module.exports = router;