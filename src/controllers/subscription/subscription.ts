
import * as async from "async";
import * as crypto from "crypto";
import * as passport from "passport";
import { Request, Response, NextFunction } from "express";
import { IVerifyOptions } from "passport-local";
import { WriteError } from "mongodb";
import { isEmail } from "validator";
import { each } from "async";
import { Error, Collection } from "mongoose";


const stripe = require("stripe")(process.env.STRIPE_SDK);

const planMOnth = stripe.plans.create({
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
	res.status(200).json({message: "sample sample", error: undefined, data: undefined});
	return;
};