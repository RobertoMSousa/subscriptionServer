import express = require("express");
import userCtrl = require("./user");

import passportConfig = require("../../config/passport");

export namespace Routes {
	export function index(): express.Router {
		const router = express.Router();
		router.route("/account")
			.get(passportConfig.isAuthenticated, userCtrl.getAccount);

		return router;
	}
}