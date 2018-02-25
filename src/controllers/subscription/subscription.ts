
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
import { stripeSubscription, StripeSubscription } from "../../models/Subscription";


const stripe = require("stripe")(process.env.STRIPE_SDK);

/*
	GET /subscription/list
	get the subscriptions of the user
*/
export const list = (req: Request, res: Response, next: NextFunction) => {
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
	if (!req.body.plan) {
		res.status(400).json({message: "missing required params", error: undefined, data: undefined});
		return;
	}
	StripeSubscription.find({customer: req.user.stripeId, planId: req.body.plan}, (err: Error, subFind: Array<stripeSubscription>) => {
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
				current_period_start: newSubscription.current_period_start,
				current_period_end: newSubscription.current_period_end,
				cancel_at_period_end: newSubscription.cancel_at_period_end,
				canceled_at: newSubscription.canceled_at ? newSubscription.canceled_at : undefined,
				created: newSubscription.created,
				customer: newSubscription.customer,
				planId: req.body.plan,
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