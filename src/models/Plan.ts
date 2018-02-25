import * as mongoose from "mongoose";

export  type stripePlan = {
	_id: mongoose.Schema.Types.ObjectId,
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


/*Mongo Schemas*/
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

export const StripePlan = mongoose.model("StripePlan", stripePlanSchema);