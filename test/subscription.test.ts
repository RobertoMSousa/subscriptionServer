import * as request from "supertest";
import * as app from "../src/app";
import * as mongo from "connect-mongo";
import * as crypto from "crypto";
import * as mongoose from "mongoose";

import { default as User, UserModel, AuthToken, Admin } from "../src/models/User";


import { StripePlan, stripePlan } from "../src/models/Plan";

const chai = require("chai");
const expect = chai.expect;


/*
	create a fake user
*/
function createFakeUser(callback: (err: Error) => void): void {
	request(app).post("/auth/signup")
	.set("Accept", "application/json")
	.send({
		email: "placeholder@mail.com",
		password: "123",
		passwordRepeated: "123"
	})
	.expect(200)
	.expect("Content-Type", /json/)
	.end(function (err, res) {
		if (err) {
			callback(err);
			return;
		}
		chai.expect(res.body.message).to.equal("account created");
		callback(undefined);
		return;
	});
}


/*
	create a fake admin
*/
function createFakeAdmin(callback: (err: Error) => void): void {
	request(app).post("/auth/signup")
	.set("Accept", "application/json")
	.send({
		email: "admin@mail.com",
		password: "123",
		passwordRepeated: "123"
	})
	.expect(200)
	.expect("Content-Type", /json/)
	.end(function (err, res) {
		if (err) {
			callback(err);
			return;
		}
		// make the user admin by writing on the DB
		const newAdmin = new Admin({"email": "admin@mail.com"});
		newAdmin.save();
		chai.expect(res.body.message).to.equal("account created");
		callback(undefined);
		return;
	});
}

/*
function that creates a new plan
*/
function createPlan(cookie: string, name: string, nickname: string, amount: number, currency: string, interval: string, callback: (err: Error, plan: stripePlan) => void): void {
	request(app).post("/plan/new")
	.set("Accept", "application/json")
	.set("Cookie", cookie)
	.set("Content-Type", "application/json")
	.send({
		"name": name,
		"nickname": nickname,
		"amount": amount,
		"currency": currency,
		"interval": interval
	})
	.expect(200)
	.end(function (err, res) {
		if (err) {
			callback(err, undefined);
			return;
		}
		chai.expect(res.body.message).to.equal("success");
		chai.expect(res.body.data).to.exist;
		chai.expect(res.body.error).to.not.exist;
		chai.expect(res.body.data).to.exist;
		chai.expect(res.body.data.id).to.exist;
		chai.expect(res.body.data._id).to.exist;
		chai.expect(res.body.data.created).to.exist;
		chai.expect(res.body.data.trial_period_days).to.equal(0);
		chai.expect(res.body.data.amount).to.equal(amount);
		chai.expect(res.body.data.name).to.equal(name);
		chai.expect(res.body.data.currency).to.equal(currency);
		chai.expect(res.body.data.nickname).to.equal(nickname);
		chai.expect(res.body.data.interval).to.equal(interval);
		callback(undefined, res.body.data);
		return;
	});
}

describe("create subscriptions", () => {
	/*
	clean up the test db before and after the
	test just to be sure that the tests are really
	independent from each others
	*/

	beforeEach(() => {
		if (mongoose.connection && mongoose.connection.db) {
			mongoose.connection.db.dropDatabase();
		}
	});
	afterAll(() => {
		if (mongoose.connection && mongoose.connection.db) {
			mongoose.connection.db.dropDatabase();
		}
	});
});