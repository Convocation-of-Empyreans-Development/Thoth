var argv = require('yargs').argv;
var schedule = require('node-schedule');
var runTask = require('./tasks/storeFacWarSystems.js');

if (argv.single) {
  runTask();
} else {
  schedule.scheduleJob('*/10 * * * *', runTask);
}