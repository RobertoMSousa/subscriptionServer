import express = require("express");
import HomeCtrl = require("./home");

export namespace Routes {
	export function home(): express.Router {
		const router = express.Router();
		router.route("/")
			.get(HomeCtrl.index);

		return router;
	}
}