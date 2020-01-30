var Sequelize = require('sequelize');
var sequelize = new Sequelize('postgres://nrdzzamxmolwbv:6255fb3b7b56f81f58e05be9e61b8b9785d3c44e7664e374fa9709130e9eaca9@ec2-54-163-234-4.compute-1.amazonaws.com:5432/d1qr3a5n418cjl', {
	dialect: 'postgress',
	dialectOptions: {
		ssl: {
			require: true
		}
	}
});

module.exports = sequelize;