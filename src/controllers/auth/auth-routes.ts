import express = require("express");
import AuthCtrl = require("./auth");

export namespace Routes {
	export function auth(): express.Router {
		const router = express.Router();

		router.route("/signin")
			.post(AuthCtrl.signin);

		router.route("/sigup")
			.post(AuthCtrl.signup);

		router.route("/signout")
			.get(AuthCtrl.signout);

		return router;
	}
}