
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

/*
	GET /subscription/list
	get the subscriptions of the user
*/
export const list = (req: Request, res: Response, next: NextFunction) => {
	console.log("req-->", req); // roberto
	console.log("session-->", req.session); // roberto
	console.log("user-->", req.user); // roberto
	/*
	TODO: get the list of user subscrition
	*/
	res.status(200).json({message: "success", error: undefined, data: undefined});
	return;
};


/*
	POST /subscription/new
	build a new user subscription
*/
export const newSub = (req: Request, res: Response, next: NextFunction) => {
	console.log("user-->", req.user); // roberto
	if (!req.body.plan) {
		res.status(400).json({message: "missing required params", error: undefined, data: undefined});
		return;
	}
	StripeSubscription.find({customer: req.user.stripeId, plan: req.body.plan}, (err: Error, subFind: Array<stripeSubscription>) => {
		if (err) {
			res.status(500).json({message: "failed", error: err.message, data: undefined});
			return;
		}

		// doesn't allow the user to subscribe twice to the same plan (repeated subscriptions)
		if (subFind.length > 0) {
			res.status(200).json({message: "user already subscribed to this plan", error: undefined, data: subFind});
			return;
		}

		stripe.subscriptions.create({
			customer: req.user.stripeId,
			items: [{plan: req.body.plan}],
		}, (err: Error, newSubscription: stripeSubscription) => {
			if (err) {
				/*
				TODO: need to build teh user payment plan
				*/
				res.status(500).json({message: "failed", error: err.message, data: undefined});
				return;
			}
			const newSubsData  = new StripeSubscription({
				id: newSubscription.id,
				object: newSubscription.object,
				billing: newSubscription.billing,
				billing_cycle_anchor: newSubscription.billing_cycle_anchor,
				cancel_at_period_end: newSubscription.cancel_at_period_end,
				canceled_at: newSubscription.canceled_at,
				created: newSubscription.created,
				customer: newSubscription.customer,
				planId: newSubscription.plan.id,
				start: newSubscription.start,
				status: newSubscription.status,
				trial_end: newSubscription.trial_end ? newSubscription.trial_end : undefined,
				trial_start: newSubscription.trial_start ? newSubscription.trial_start : undefined
			});
			newSubsData.save();
			res.status(200).json({message: "success", error: undefined, data: newSubscription});
			return;
		});
	});
};



/*
	GET /subscription/plan/list
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
	POST /subscription/newplan
	build a new  plan
	this works for admins only
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
