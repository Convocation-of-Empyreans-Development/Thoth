var moment = require('moment');
var models  = require('../models');
var eveonlinejs = require('eveonlinejs');
var _ = require('lodash');

var victoryPointsPerComplex = 20;

function run() {
  eveonlinejs.fetch('map:FacWarSystems', function (err, result) {
    if (err) {
      console.log(err);
      return;
    }

    var reportForComparison = null;

    models.fw_api_log.findOne({
      where: {
        cached_until: {
          $gt: moment(result.cached_until).subtract(3, 'h')
        }, report: {
          $ne: null
        }
      },
      order: [
        ['cached_until', 'ASC']
      ]
    }).then(function (oldEntryForComparison) {
      reportForComparison = oldEntryForComparison.report;
    }).finally(function () {
      report = generateReport(result.solarSystems, reportForComparison);

      models.fw_api_log.upsert({
        cached_until: moment.utc(result.cachedUntil),
        stored_at: new Date(),
        raw_data: result.solarSystems,
        report: report
      });
    });
  });
}

function generateReport(apiSystems, reportForComparison) {
  var report = {};

  _.each(_.values(apiSystems), function (system) {
    report[system.solarSystemName] = {
      id: system.solarSystemID,
      name: system.solarSystemName,
      victoryPoints: system.victoryPoints,
      victoryPointThreshold: system.victoryPointThreshold,
      owner: system.occupyingFactionName || system.owningFactionName,
      contested: system.contested
    }
  });

  _.each(report, function (system, systemName) {
    system.contestedPercentage = (system.victoryPoints / system.victoryPointThreshold * 100).toFixed(1);
    system.complexesToCapture = (system.victoryPointThreshold - system.victoryPoints) / victoryPointsPerComplex;

    if (reportForComparison) {
      system.contestedPercentage3HoursAgo = reportForComparison[systemName].contestedPercentage;
      system.contestedPercentage3HourDelta = (system.contestedPercentage - system.contestedPercentage3HoursAgo).toFixed(1);
    }
  });

  return report;
}

module.exports = run;