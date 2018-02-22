import * as express from "express";
import * as compression from "compression";  // compresses requests
import * as session from "express-session";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as dotenv from "dotenv";
import * as mongo from "connect-mongo";
import * as path from "path";
import * as mongoose from "mongoose";
import * as passport from "passport";
import * as bluebird from "bluebird";


const MongoStore = mongo(session);

// Load environment variables from .env file, where API keys and passwords are configured
dotenv.config({ path: ".env" });



// Create Express server
const app = express();


app.use(cookieParser());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
let mongoUrl: string = "";
if (process.env.NODE_ENV === "test") {
	mongoUrl = process.env.MONGODB_TEST_URL;
}
else {
	mongoUrl = process.env.MONGOLAB_URI;
}

(<any>mongoose).Promise = bluebird;
mongoose.connect(mongoUrl, {useMongoClient: true}).then(
	() => { /** ready to use. The `mongoose.connect()` promise resolves to undefined. */ },
).catch(err => {
	console.error("MongoDB connection error. Please make sure MongoDB is running. " + err);
	if (process.env.NODE_ENV !== "test") {
		process.exit();
	}
});

// Express configuration
app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "pug");

app.use(compression());

app.use(session({
	resave: true,
	saveUninitialized: true,
	secret: process.env.SESSION_SECRET,
	store: new MongoStore({
		url: mongoUrl,
		autoReconnect: true
	})
}));

app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
	res.locals.user = req.user;
	next();
});

app.use((req, res, next) => {
	// After successful login, redirect back to the intended page
	if (!req.user &&
		req.path !== "/auth/login" &&
		req.path !== "/auth/signup" &&
		!req.path.match(/^\/auth/) &&
		!req.path.match(/\./)) {
		req.session.returnTo = req.path;
	} else if (req.user &&
		req.path == "/user/account") {
		req.session.returnTo = req.path;
	}
	next();
});

app.use(express.static(path.join(__dirname, "public"), { maxAge: 31557600000 }));

/**
 * Primary app routes.
 */
import homeRoutes = require("./controllers/home/home-routes");
import authRoutes = require("./controllers/auth/auth-routes");
import userRoutes = require("./controllers/user/user-routes");
import { read } from "fs";


// add your routes
app.use("/", homeRoutes.Routes.home());
app.use("/auth", authRoutes.Routes.auth());
app.use("/user", userRoutes.Routes.index());

module.exports = app;