
import express = require("express");
import adminCtrl = require("./admin");
import * as passport from "passport";

export namespace Routes {
	export function index(): express.Router {
		const router = express.Router();

		router.route("/")
			.get(adminCtrl.index);

		return router;
	}
}
