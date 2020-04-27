var Sequelize = require('sequelize');
var sequelize = new Sequelize('mysql://ashterothi:dOqRGX5ISu9FvWoi@aideron.org:3306/aider_auth', {
	dialect: 'mysql',
	logging: false,
	/*dialectOptions: {
		ssl: {
			require: true
		}
	}*/
define: {
        timestamps: false
    }});



module.exports = sequelize;
