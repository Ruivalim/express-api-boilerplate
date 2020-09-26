'use strict';

// Dependencies
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const helmet = require("helmet");
const cors = require('cors');
const path = require('path');
const rfs = require('rotating-file-stream');
const cookieParser = require('cookie-parser');

const routes = require("./routes");

// Using .env file
require('dotenv').config();

// logger
const logger = require("./utils/Logger");

if( process.env.MONGO_URL !== null ){
    const mongoose = require("mongoose");

    mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
      .then(() => logger.log("MongoDB Connected"))
      .catch(err => logger.error(err));
}

// Allowed List
const allowlist = [];

// CORS OPTIONS
const corsOptionsDelegate = (req, callback) => {
	let corsOptions;
	if (allowlist.indexOf(req.header('Origin')) !== -1) {
		corsOptions = { origin: true };
	} else {
		corsOptions = { origin: false };
	}

	callback(null, corsOptions);
}

// HTTP LOGS FILE
const accessLogStream = rfs.createStream('access.log', {
	interval: '1d',
	path: path.join(__dirname, 'logs')
});

// Getting PORT and HOST from env
const PORT = process.env.APP_PORT || 3000;
const HOST = process.env.APP_HOST || '0.0.0.0';

// Express init
const app = express();

// Express Middlewares initialization
app.use(helmet());
// Body Parser init
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
// HTTP LOGGER
app.use(morgan('combined', {stream: accessLogStream}));
// Cookie Parser
app.use(cookieParser());

// If allowd list is empty, will use the default cors config
if( allowlist.length == 0 ){
	app.use(cors());
}else{
	app.use(cors(corsOptionsDelegate));
}

const staticPath = __dirname + '/public/';

// Static files
app.use(express.static(staticPath));

// Autorouting
Object.entries(routes).forEach(([key, value]) => {
	const routeFile = require('./routes/'+value);
	app.use(key, routeFile);
});

// App initialization
app.listen(PORT, HOST);
logger.log("App Started.");
