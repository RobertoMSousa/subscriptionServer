
import * as async from "async";
import * as crypto from "crypto";
import * as passport from "passport";
import { Request, Response, NextFunction } from "express";
import { IVerifyOptions } from "passport-local";
import { WriteError } from "mongodb";
import { isEmail, isNumeric } from "validator";
import { each } from "async";
import { Error, Collection } from "mongoose";
import { userSalt } from "../../models/User";
import { StripePlan, stripePlan } from "../../models/Plan";

const stripe = require("stripe")(process.env.STRIPE_SDK);

/*
	GET /plan/list
	get the list of existing plans
*/
export const planList = (req: Request, res: Response, next: NextFunction) => {
	StripePlan.find({}, (err: Error, plansListRes: Array<stripePlan>) => {
		if (err) {
			res.status(500).json({message: "error", error: err.message, data: undefined});
			return;
		}
		res.status(200).json({message: "success", error: undefined, data: plansListRes});
		return;
	});
};


/*
	POST /plan/new
	build a new  plan
	this works for admins only
*/
export const newPlan = (req: Request, res: Response, next: NextFunction) => {

	if (!req.body.name || !req.body.nickname || !req.body.amount || !req.body.currency || !req.body.interval) {
		res.status(400).json({message: "missing required params", error: undefined, data: undefined});
		return;
	}

	if (!Number.isSafeInteger(req.body.amount)) {
		res.status(406).json({message: "ammount must be an integer", error: undefined, data: undefined});
		return;
	}

	const planMonth = stripe.plans.create({
		product: {name: req.body.name},
		currency: req.body.currency,
		interval: req.body.interval,
		nickname: req.body.nickname,
		amount: req.body.amount,
	}, (err: Error, planNew: stripePlan) => {
		if (err) {
			res.status(500).json({message: undefined, error: err.message, data: undefined});
			return;
		}
		// build the plan
		const plan = new StripePlan({
			id: planNew.id,
			object: planNew.object,
			amount: planNew.amount,
			created: planNew.created,
			currency: planNew.currency,
			interval: planNew.interval,
			nickname: planNew.nickname,
			product: planNew.product,
			trial_period_days: planNew.trial_period_days ? planNew.trial_period_days : 0,
			name: planNew.name
		});

		// save it on the db
		plan.save();
		res.status(200).json({message: "success", error: undefined, data: plan});
	});
};
