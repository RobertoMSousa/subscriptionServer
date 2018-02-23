
import express = require("express");
import subscription = require("./subscription");
import passportConfig = require("../../config/passport");


export namespace Routes {
	export function index(): express.Router {
		const router = express.Router();
		router.route("/list")
			.get(passportConfig.isAuthenticated, subscription.list);

		router.route("/new")
			.post(passportConfig.isAuthenticated, subscription.newSub);

		return router;
	}
}
