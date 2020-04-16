var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var db = require('./server/database/database');
var models = require("./server/models");

process.env.SECRET = "The darkness shall swallow the land, and in its wake there will follow a storm"
var port = process.env.PORT || 3010;

//Setup bodyparser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(function (req, res, next) {

	var allowedOrigins = ['https://shadowcodex.github.io',
			      'http://eve-map-shadowcodex1.c9users.io',
			      'http://map.cryrs.org',
			      'http://map.jerkasauruswrecks.com',
			      'http://jerkasauruswrecks.com',
			      'http://federationuprising.com',
			      'http://eve-map-shadowcodex1.c9users.io',
			      'https://map.cryrs.org',
			      'https://map.jerkasauruswrecks.com',
			      'https://jerkasauruswrecks.com',
			      'https://federationuprising.com',
			      'https://fedupwebsite-traugdor.c9users.io/',
			      'https://cryrs-site-shadowcodex1.c9users.io:8081'];
  	var origin = req.headers.origin;
  	if(allowedOrigins.indexOf(origin) > -1){
  	     res.setHeader('Access-Control-Allow-Origin', origin);
  	}

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});



app.use('/client', express.static(__dirname + '/client'));

//Controllers
var tokenController = require('./server/controllers/token-controller');

//Routers
var guildRouter = require('./server/routes/guild');
var userRouter = require('./server/routes/user');
var fwRouter = require('./server/routes/fw');

app.use('/guild', guildRouter);
app.use('/user', userRouter);
app.use('/fw', fwRouter);

//Routes
app.get('/', function(req, res){
	var path = __dirname + '/client/index.html';
	console.log(path);
	res.sendFile(path);
});

app.get('/api/token/get-token', tokenController.validateToken);
app.get('/api/token/refresh-token', tokenController.refreshToken);

models.sequelize.authenticate().then(function(){
	Object.keys(models).forEach(function(modelName) {
		if ('initialize' in models[modelName]) {
		  console.log('initilizing ' + modelName);
		  models[modelName].initialize(models);
		}
	});
	app.listen(port, function(){
		console.log("It works!");

		//console.log(models);
		//models.query("SELECT * FROM aider_permission").success(function(myTableRows) {

//})
	})
});
