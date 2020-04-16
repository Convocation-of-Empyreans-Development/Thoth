"use strict";

module.exports = function(sequelize, DataTypes) {
	var Character = sequelize.define("eve_characters", {
		character_id:    	{type: DataTypes.INTEGER(11), primaryKey: true},
		alliance_id:			DataTypes.INTEGER(11),
		ancestry_id:  		DataTypes.INTEGER(11),
		birthday:  					DataTypes.DATE,
		bloodline_id: 		DataTypes.INTEGER(11),
		corporation_id: 	DataTypes.INTEGER(11),
		description: 			DataTypes.TEXT,
		faction_id:				DataTypes.INTEGER(11),
		gender:  						DataTypes.TEXT('tiny'),
		race_id:	        DataTypes.INTEGER(11),
		security_status:	 DataTypes.FLOAT,
		title:						DataTypes.TEXT('tiny')

	}, {
	})
	return Character;
}

/*
CREATE TABLE `eve_characters` (
  `character_id` int(11) NOT NULL,
  `alliance_id` int(11) DEFAULT NULL,
  `ancestry_id` int(11) DEFAULT NULL,
  `birthday` datetime NOT NULL,
  `bloodline_id` int(11) NOT NULL,
  `corporation_id` int(11) NOT NULL,
  `description` text,
  `faction_id` int(11) DEFAULT NULL,
  `gender` tinytext NOT NULL,
  `name` tinytext NOT NULL,
  `race_id` int(11) NOT NULL,
  `security_status` float DEFAULT NULL,
  `title` tinytext,
  PRIMARY KEY (`character_id`),
  UNIQUE KEY `character_id` (`character_id`),
  KEY `character_id_2` (`character_id`),
  KEY `corporation_id` (`corporation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
*/
