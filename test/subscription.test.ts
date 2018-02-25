import * as request from "supertest";
import * as app from "../src/app";
import * as mongo from "connect-mongo";
import * as crypto from "crypto";
import * as mongoose from "mongoose";

import { default as User, UserModel, AuthToken, Admin } from "../src/models/User";


import { StripePlan, stripePlan } from "../src/models/Plan";
import { StripeSubscription, stripeSubscription } from "../src/models/Subscription";

const chai = require("chai");
const expect = chai.expect;


/*
	create a fake user
*/
function createFakeUser(callback: (err: Error, user: UserModel) => void): void {

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
				callback(err, undefined);
				return;
			}
			chai.expect(res.body.message).to.equal("account created");
			callback(undefined, res.body.data);
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
function createPlan(name: string, nickname: string, amount: number, currency: string, interval: string, callback: (err: Error, plan: stripePlan) => void): void {

	// login as admin to be able to create a plan

	request(app).post("/auth/signin")
	.set("Accept", "application/json")
	.set("Content-Type", "application/json")
	.send({
		"email": "admin@mail.com",
		"password": "123"
	})
	.expect(200)
	.expect("Content-Type", /json/)
	.expect("set-cookie", /connect.sid/)
	.end(function (err, res) {
		if (err) {
			callback(err, undefined);
			return;
		}
		chai.expect(res.header["set-cookie"]).to.exist;
		request(app).post("/plan/new")
		.set("Accept", "application/json")
		.set("Cookie", res.header["set-cookie"])
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
	});
}

describe("create subscriptions", () => {
	/*
	clean up the test db before and after the
	test just to be sure that the tests are really
	independent from each others
	*/

	beforeEach(() => {
		jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;
		if (mongoose.connection && mongoose.connection.db) {
			mongoose.connection.db.dropDatabase();
		}
	});

	afterAll(() => {
		if (mongoose.connection && mongoose.connection.db) {
			mongoose.connection.db.dropDatabase();
		}
	});

	it("create a new subscription", (done) => {
		createFakeAdmin((err: Error) => {
			if (err) {
				throw new Error(err.message);
			}
			createFakeUser((err: Error, user: UserModel) => {
				if (err) {
					throw new Error(err.message);
				}
				const planName: string = "myplan";
				const planNick: string = "planMonth";
				const planAmount: number = 10;
				const planCurrency: string = "usd";
				const planInterval: string = "month";
				createPlan(planName, planNick, planAmount, planCurrency, planInterval, (err: Error, plan: stripePlan) => {
					if (err) {
						throw new Error(err.message);
					}
					chai.expect(plan).to.exist;
					chai.expect(plan.id).to.exist;
					chai.expect(plan.created).to.exist;
					chai.expect(plan.trial_period_days).to.equal(0);
					chai.expect(plan.amount).to.equal(planAmount);
					chai.expect(plan.name).to.equal(planName);
					chai.expect(plan.currency).to.equal(planCurrency);
					chai.expect(plan.nickname).to.equal(planNick);
					chai.expect(plan.interval).to.equal(planInterval);

					request(app).post("/auth/signin")
					.set("Accept", "application/json")
					.set("Content-Type", "application/json")
					.send({
						"email": "placeholder@mail.com",
						"password": "123"
					})
					.expect(200)
					.expect("Content-Type", /json/)
					.end(function (err, res) {
						if (err) {
							done(err);
							return;
						}

						chai.expect(res.header["set-cookie"]).to.exist;

						request(app).post("/subscription/new")
						.set("Accept", "application/json")
						.set("Content-Type", "application/json")
						.set("Cookie", res.header["set-cookie"])
						.send({
							"plan": plan.id
						})
						.expect(200)
						.expect("Content-Type", /json/)
						.end(function (err, res) {
							if (err) {
								done(err);
								return;
							}
							// get the current user info from the DB
							User.findOne({_id: user._id}, (err: Error, newUser: UserModel) => {
								if (err) {
									done(err);
									return;
								}
								if (!newUser) {
									done(new Error("user not found"));
									return;
								}
								chai.expect(res.body.data).to.exist;
								chai.expect(res.body.data.object).to.equal("subscription");
								chai.expect(res.body.data.planId).to.equal(plan.id);
								chai.expect(res.body.data.customer).to.equal(newUser.stripeId);
								/*
									get and confirm that the subscription is on the DB
								*/
								StripeSubscription.findOne({id: res.body.data.id}, (err: Error, sub: stripeSubscription) => {
									if (err) {
										done(err);
										return;
									}
									if (!sub) {
										done(new Error("subscription not found"));
										return;
									}
									chai.expect(sub.id).to.equal(res.body.data.id);
									chai.expect(sub.object).to.equal(res.body.data.object);
									chai.expect(sub.customer).to.equal(res.body.data.customer);
									done();
									return;
								});
							});
						});
					});
				});
			});
		});
	});


	it("should not be able to subscribe to the same plan twice", (done) => {
		createFakeAdmin((err: Error) => {
			if (err) {
				throw new Error(err.message);
			}
			createFakeUser((err: Error, user: UserModel) => {
				if (err) {
					throw new Error(err.message);
				}
				const planName: string = "myplan";
				const planNick: string = "planMonth";
				const planAmount: number = 10;
				const planCurrency: string = "usd";
				const planInterval: string = "month";
				createPlan(planName, planNick, planAmount, planCurrency, planInterval, (err: Error, plan: stripePlan) => {
					if (err) {
						throw new Error(err.message);
					}
					chai.expect(plan).to.exist;
					chai.expect(plan.id).to.exist;
					chai.expect(plan.created).to.exist;
					chai.expect(plan.trial_period_days).to.equal(0);
					chai.expect(plan.amount).to.equal(planAmount);
					chai.expect(plan.name).to.equal(planName);
					chai.expect(plan.currency).to.equal(planCurrency);
					chai.expect(plan.nickname).to.equal(planNick);
					chai.expect(plan.interval).to.equal(planInterval);

					request(app).post("/auth/signin")
					.set("Accept", "application/json")
					.set("Content-Type", "application/json")
					.send({
						"email": "placeholder@mail.com",
						"password": "123"
					})
					.expect(200)
					.expect("Content-Type", /json/)
					.end(function (err, res) {
						if (err) {
							done(err);
							return;
						}
						chai.expect(res.header["set-cookie"]).to.exist;
						const cookies: string = res.header["set-cookie"];

						request(app).post("/subscription/new")
						.set("Accept", "application/json")
						.set("Content-Type", "application/json")
						.set("Cookie", cookies)
						.send({
							"plan": plan.id
						})
						.expect(200)
						.expect("Content-Type", /json/)
						.end(function (err, res) {
							if (err) {
								done(err);
								return;
							}

							request(app).post("/subscription/new")
							.set("Accept", "application/json")
							.set("Content-Type", "application/json")
							.set("Cookie", cookies)
							.send({
								"plan": plan.id
							})
							.expect(200)
							.expect("Content-Type", /json/)
							.end(function (err, res) {
								if (err) {
									done(err);
									return;
								}
								chai.expect(res.body.message).to.equal("user already subscribed to this plan");
								done();
								return;
							});
						});
					});
				});
			});
		});
	});

	it("shouldn't be able to create a new subscription if the user don't provide the plan", (done) => {
		createFakeAdmin((err: Error) => {
			if (err) {
				throw new Error(err.message);
			}
			createFakeUser((err: Error, user: UserModel) => {
				if (err) {
					throw new Error(err.message);
				}
				const planName: string = "myplan";
				const planNick: string = "planMonth";
				const planAmount: number = 10;
				const planCurrency: string = "usd";
				const planInterval: string = "month";
				createPlan(planName, planNick, planAmount, planCurrency, planInterval, (err: Error, plan: stripePlan) => {
					if (err) {
						throw new Error(err.message);
					}
					chai.expect(plan).to.exist;
					chai.expect(plan.id).to.exist;
					chai.expect(plan.created).to.exist;
					chai.expect(plan.trial_period_days).to.equal(0);
					chai.expect(plan.amount).to.equal(planAmount);
					chai.expect(plan.name).to.equal(planName);
					chai.expect(plan.currency).to.equal(planCurrency);
					chai.expect(plan.nickname).to.equal(planNick);
					chai.expect(plan.interval).to.equal(planInterval);

					request(app).post("/auth/signin")
					.set("Accept", "application/json")
					.set("Content-Type", "application/json")
					.send({
						"email": "placeholder@mail.com",
						"password": "123"
					})
					.expect(200)
					.expect("Content-Type", /json/)
					.end(function (err, res) {
						if (err) {
							done(err);
							return;
						}

						chai.expect(res.header["set-cookie"]).to.exist;

						request(app).post("/subscription/new")
						.set("Accept", "application/json")
						.set("Content-Type", "application/json")
						.set("Cookie", res.header["set-cookie"])
						.send({})
						.expect(400)
						.expect("Content-Type", /json/)
						.end(function (err, res) {
							if (err) {
								done(err);
								return;
							}
							// get the current user info from the DB
							chai.expect(res.body.message).to.equal("missing required params");
							chai.expect(res.body.err).to.not.exist;
							done();
							return;
						});
					});
				});
			});
		});
	});

	it("shouldn't be able to create a new subscription if the user provide a non valid plan", (done) => {
		createFakeAdmin((err: Error) => {
			if (err) {
				throw new Error(err.message);
			}
			createFakeUser((err: Error, user: UserModel) => {
				if (err) {
					throw new Error(err.message);
				}
				const planName: string = "myplan";
				const planNick: string = "planMonth";
				const planAmount: number = 10;
				const planCurrency: string = "usd";
				const planInterval: string = "month";
				createPlan(planName, planNick, planAmount, planCurrency, planInterval, (err: Error, plan: stripePlan) => {
					if (err) {
						throw new Error(err.message);
					}
					chai.expect(plan).to.exist;
					chai.expect(plan.id).to.exist;
					chai.expect(plan.created).to.exist;
					chai.expect(plan.trial_period_days).to.equal(0);
					chai.expect(plan.amount).to.equal(planAmount);
					chai.expect(plan.name).to.equal(planName);
					chai.expect(plan.currency).to.equal(planCurrency);
					chai.expect(plan.nickname).to.equal(planNick);
					chai.expect(plan.interval).to.equal(planInterval);

					request(app).post("/auth/signin")
					.set("Accept", "application/json")
					.set("Content-Type", "application/json")
					.send({
						"email": "placeholder@mail.com",
						"password": "123"
					})
					.expect(200)
					.expect("Content-Type", /json/)
					.end(function (err, res) {
						if (err) {
							done(err);
							return;

						}

						chai.expect(res.header["set-cookie"]).to.exist;

						const cookie: string = res.header["set-cookie"];

						request(app).post("/subscription/new")
						.set("Accept", "application/json")
						.set("Content-Type", "application/json")
						.set("Cookie", cookie)
						.send({
							"plan": "notValid"
						})
						.expect(500)
						.expect("Content-Type", /json/)
						.end(function (err, res) {
							if (err) {
								done(err);
								return;
							}
							chai.expect(res.body.message).to.equal("failed");
							chai.expect(res.body.error).to.exist;
							done();
							return;
						});
					});
				});
			});
		});
	});
});