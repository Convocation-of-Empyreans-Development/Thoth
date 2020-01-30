"use strict";

module.exports = function(sequelize, DataTypes) {
	var Character = sequelize.define("character", {
		name:  	 		DataTypes.STRING,
		char_id:    	DataTypes.STRING,
		corporation_id: DataTypes.STRING,
		birthday:  		DataTypes.DATE,
		gender:  		DataTypes.DATE,
		race_id:        DataTypes.STRING,
		ancestry_id:  	DataTypes.STRING
	}, {
	})

	return Character;
}