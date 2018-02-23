import * as mongoose from "mongoose";


// stripe customer type
export type StripeCustomer = mongoose.Document & {
	id: string,
	account_balance: number,
	currency?: string,
	email: string
};

export  type stripeSubscription = {
	id: string,
	object: string,
	billing: string,
	billing_cycle_anchor: number,
	cancel_at_period_end: boolean,
	canceled_at: number,
	created: number,
	current_period_end: number,
	current_period_start: number,
	customer: string,
	discount: number,
	plan: stripePlan,
	start: number,
	status: string,
	trial_start?: number
	trial_end?: number
};

export  type stripePlan = {
	id: string,
	object: string,
	amount: number,
	created: number
	currency: string,
	interval: string,
	nickname: string,
	product: string,
	trial_period_days?: number,
	name: string
};


/*Mongo Schema*/
const stripePlanSchema = new mongoose.Schema({
	id: {
		type: String,
		required: true
	},
	amount: {
		type: Number,
		required: true
	},
	created: {
		type: Number
	},
	currency: {
		type: String,
		required: true
	},
	interval: {
		type: String,
		required: true
	},
	nickname: {
		type: String,
		require: true
	},
	trial_period_days: {
		type: Number
	},
	name: {
		type: String,
		require: true
	}
});



/*Mongo Schema*/
const stripeSubscription = new mongoose.Schema({
	id: {
		type: String,
		required: true
	},
	object: {
		type: String,
		required: true
	},
	billing: {
		type: String,
		required: true
	},
	billing_cycle_anchor: {
		type: Number,
		required: true
	},
	cancel_at_period_end: {
		type: Boolean,
		required: true,
		default: false
	},
	canceled_at: {
		type: Number,
		required: true
	},
	created: {
		type: Number,
		required: true
	},
	current_period_end: {
		type: Number,
		required: true
	},
	current_period_start: {
		type: Number,
		required: true
	},
	customer: {
		type: String,
		required: true
	},
	discount: {
		type: Number
	},
	planId: {
		type: String,
		required: true
	},
	start: {
		type: Number,
		required: true
	},
	status: {
		type: String,
		required: true
	},
	trial_start: {
		type: Number
	},
	trial_end: {
		type: Number
	}
});



export const StripePlan = mongoose.model("StripePlan", stripePlanSchema);

export const StripeSubscription = mongoose.model("StripeSubscription", stripeSubscription);