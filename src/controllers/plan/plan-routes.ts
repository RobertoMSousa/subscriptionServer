
import express = require("express");
import planCtrl = require("./plan");
import passportConfig = require("../../config/passport");


export namespace Routes {
	export function index(): express.Router {
		const router = express.Router();

		router.route("/new")
			.post(passportConfig.isAuthenticated, passportConfig.isAdmin, planCtrl.newPlan);

		router.route("/list")
			.get(passportConfig.isAuthenticated, planCtrl.planList);

		return router;
	}
}
