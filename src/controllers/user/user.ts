import * as async from "async";
import * as crypto from "crypto";
import * as passport from "passport";
import { default as User, UserModel, AuthToken } from "../../models/User";
import { Request, Response, NextFunction } from "express";
import { IVerifyOptions } from "passport-local";
import { WriteError } from "mongodb";
import { concat } from "async";
import { isEmail } from "validator";

const stripe = require("stripe")(process.env.STRIPE_SDK);


/**
 * GET /account
 * Profile page.
 */
export const getAccount = (req: Request, res: Response) => {
	res.status(200).json({message: "this should be only working if logged in", error: undefined, data: undefined});
	return;
};


/**
 * POST /payment/source
 * add the user payment method and associate to his account
 */
export const addSource = (req: Request, res: Response) => {
	if (!req.body.source) {
		res.status(400).json({message: "missing source", error: undefined, data: undefined});
		return;
	}
	console.log("user-->", req.user); // roberto
	stripe.customers.createSource(req.user.stripeId, {
		source: req.body.source
	}, (err: Error, result: any) => {
		if (err) {
			res.status(500).json({message: "failed", error: err.message, data: undefined});
			return;
		}
		// if no result id the source wasn't created
		if (!result.id) {
			res.status(500).json({message: "something whent wrong", error: undefined, data: result});
			return;
		}
		res.status(200).json({message: "payment method added", error: undefined, data: result});
		return;
	});
};