"use strict";

module.exports = function(sequelize, DataTypes) {
  var FwApiLog = sequelize.define("fw_api_log", {
    cached_until:  {
      type: DataTypes.DATE,
      primaryKey: true
    },
    raw_data: DataTypes.JSONB,
    report:  		DataTypes.JSONB
  });

  return FwApiLog;
};