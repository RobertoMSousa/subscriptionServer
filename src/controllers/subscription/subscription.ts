
import * as async from "async";
import * as crypto from "crypto";
import * as passport from "passport";
import { Request, Response, NextFunction } from "express";
import { IVerifyOptions } from "passport-local";
import { WriteError } from "mongodb";
import { isEmail } from "validator";
import { each } from "async";
import { Error, Collection } from "mongoose";
import { userSalt } from "../../models/User";
import { stripeSubscription, StripePlan, StripeSubscription, stripePlan } from "../../models/Subscription";


const stripe = require("stripe")(process.env.STRIPE_SDK);

const planMonth = stripe.plans.create({
	product: {name: "sample Product"},
	currency: "usd",
	interval: "month",
	nickname: "sample Monthly",
	amount: 10,
});

const planYear = stripe.plans.create({
	product: {name: "sample Product"},
	currency: "usd",
	interval: "year",
	nickname: "sample Year",
	amount: 100,
});

/*
	GET /subscription/list
	get the subscriptions of the user
*/
export const list = (req: Request, res: Response, next: NextFunction) => {
	console.log("req-->", req); // roberto
	console.log("session-->", req.session); // roberto
	console.log("user-->", req.user); // roberto
	res.status(200).json({message: "sample sample", error: undefined, data: undefined});
	return;
};


/*
	POST /subscription/new
	build a new user subscription
*/
export const newSub = (req: Request, res: Response, next: NextFunction) => {
	console.log("user-->", req.user); // roberto
	stripe.subscriptions.create({
		customer: req.user.stripeId,
		items: [{plan: "plan_CNFLj9SXobukeW"}],
	}, (err: Error, newSubscription: any) => {
		if (err) {
			console.log("err-->", err); // roberto
			res.status(500).json({message: undefined, error: err.message, data: undefined});
			return;
		}
		console.log("newSubscription-->", newSubscription); // roberto
		res.status(200).json({message: "sample sample", error: undefined, data: userSalt(req.user)});
		return;
	});
};


/*
	POST /subscription/newplan
	build a new user subscription
*/
export const newPlan = (req: Request, res: Response, next: NextFunction) => {

	if (!req.body.name || !req.body.nickname || !req.body.amount) {
		res.status(400).json({message: "missing required params", error: undefined, data: undefined});
		return;
	}
	const planMonth = stripe.plans.create({
		product: {name: req.body.name},
		currency: "usd",
		interval: "month",
		nickname: req.body.nickname,
		amount: req.body.amount,
	}, (err: Error, planNew: stripePlan) => {
		if (err) {
			console.log("err-->", err); // roberto
			res.status(500).json({message: undefined, error: err.message, data: undefined});
			return;
		}
		console.log("plan-->", planNew); // roberto
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
