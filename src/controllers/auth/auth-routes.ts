
import express = require("express");
import authCtrl = require("./auth");
import * as passport from "passport";

export namespace Routes {
	export function auth(): express.Router {
		const router = express.Router();
		router.route("/signin")
			.post(authCtrl.signin);

		router.route("/signout")
			.get(authCtrl.signout);

		router.route("/signup")
			.post(authCtrl.signup);

		return router;
	}
}
