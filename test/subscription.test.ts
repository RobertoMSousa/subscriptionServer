import * as request from "supertest";
import * as app from "../src/app";
import * as mongo from "connect-mongo";
import * as crypto from "crypto";
import * as mongoose from "mongoose";

import { default as User, UserModel, AuthToken, Admin } from "../src/models/User";


import { StripePlan, stripePlan } from "../src/models/Subscription";

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
	request(app).post("/subscription/newplan")
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


describe("create plans", () => {

	/*
	clean up the test db before and after the
	test just to be sure that the tests are really
	independent from each others
	*/

	beforeEach(() => {
		jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
		if (mongoose.connection && mongoose.connection.db) {
			mongoose.connection.db.dropDatabase();
		}
	});
	afterAll(() => {
		if (mongoose.connection && mongoose.connection.db) {
			mongoose.connection.db.dropDatabase();
		}
	});

	it("should be redirected to login admin page", (done) => {
		createFakeUser((err: Error) => {
			request(app).post("/auth/signin")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json")
			.send({
				"email": "placeholder@mail.com",
				"password": "123"
			})
			.expect(200)
			.expect("Content-Type", /json/)
			.expect("set-cookie", /connect.sid/)
			.end(function (err, res) {
				if (err) {
					done(err);
					return;
				}

				chai.expect(res.body.message).to.equal("login with success");

				request(app).post("/subscription/newplan")
				.set("Accept", "application/json")
				.set("Cookie", res.header["set-cookie"])
				.set("Content-Type", "application/json")
				.send({})
				.expect(302)
				.end(function (err, res) {
					if (err) {
						done(err);
						return;
					}
					done();
					return;
				});
			});
		});
	});

	it("should be get the 400 error for missing params", (done) => {
		createFakeAdmin((err: Error) => {
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
					done(err);
					return;
				}

				chai.expect(res.body.message).to.equal("login with success");

				request(app).post("/subscription/newplan")
				.set("Accept", "application/json")
				.set("Cookie", res.header["set-cookie"])
				.set("Content-Type", "application/json")
				.send({})
				.expect(400)
				.expect("Content-Type", /json/)
				.end(function (err, res) {
					if (err) {
						done(err);
						return;
					}

					chai.expect(res.body.message).to.equal("missing required params");

					done();
					return;
				});
			});
		});
	});

	it("should get a not valid error if the amount isn't a number", (done) => {
		createFakeAdmin((err: Error) => {
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
					done(err);
					return;
				}

				chai.expect(res.body.message).to.equal("login with success");

				request(app).post("/subscription/newplan")
				.set("Accept", "application/json")
				.set("Cookie", res.header["set-cookie"])
				.set("Content-Type", "application/json")
				.send({
					"name": "name",
					"nickname": "nick",
					"amount": "value",
					"currency": "usd",
					"interval": "month"
				})
				.expect(406)
				.expect("Content-Type", /json/)
				.end(function (err, res) {
					if (err) {
						done(err);
						return;
					}

					chai.expect(res.body.message).to.equal("ammount must be an integer");

					done();
					return;
				});
			});
		});
	});

	it("should not be able to create a plan without a valid interval", (done) => {
		createFakeAdmin((err: Error) => {
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
					done(err);
					return;
				}

				chai.expect(res.body.message).to.equal("login with success");

				request(app).post("/subscription/newplan")
				.set("Accept", "application/json")
				.set("Cookie", res.header["set-cookie"])
				.set("Content-Type", "application/json")
				.send({
					"name": "name",
					"nickname": "nick",
					"amount": 10,
					"currency": "usd",
					"interval": "shjdshjdshjd"
				})
				.expect(500)
				.end(function (err, res) {
					if (err) {
						done(err);
						return;
					}
					chai.expect(res.body.data).to.not.exist;
					done();
					return;
				});
			});
		});
	});

	it("should not be able to create a plan without a valid currency", (done) => {
		createFakeAdmin((err: Error) => {
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
					done(err);
					return;
				}

				chai.expect(res.body.message).to.equal("login with success");

				request(app).post("/subscription/newplan")
				.set("Accept", "application/json")
				.set("Cookie", res.header["set-cookie"])
				.set("Content-Type", "application/json")
				.send({
					"name": "name",
					"nickname": "nick",
					"amount": 10,
					"currency": "asdasdf",
					"interval": "month"
				})
				.expect(500)
				.end(function (err, res) {
					if (err) {
						done(err);
						return;
					}
					chai.expect(res.body.data).to.not.exist;
					done();
					return;
				});
			});
		});
	});

	it("should create a new plan and get the value back", (done) => {

		const planName: string = "myplan";
		const planNick: string = "planMonth";
		const planAmount: number = 10;
		const planCurrency: string = "usd";
		const planInterval: string = "month";

		createFakeAdmin((err: Error) => {
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
					done(err);
					return;
				}

				chai.expect(res.body.message).to.equal("login with success");

				request(app).post("/subscription/newplan")
				.set("Accept", "application/json")
				.set("Cookie", res.header["set-cookie"])
				.set("Content-Type", "application/json")
				.send({
					"name": planName,
					"nickname": planNick,
					"amount": planAmount,
					"currency": planCurrency,
					"interval": planInterval
				})
				.expect(200)
				.end(function (err, res) {
					if (err) {
						done(err);
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
					chai.expect(res.body.data.amount).to.equal(planAmount);
					chai.expect(res.body.data.name).to.equal(planName);
					chai.expect(res.body.data.currency).to.equal(planCurrency);
					chai.expect(res.body.data.nickname).to.equal(planNick);
					chai.expect(res.body.data.interval).to.equal(planInterval);

					StripePlan.findById({_id: res.body.data._id}, (err: Error, planCheck: stripePlan) => {
						if (err) {
							done(err);
							return;
						}
						// compare the result with those on the DB
						chai.expect(planCheck.id).to.equal(res.body.data.id);
						chai.expect(planCheck.amount).to.equal(res.body.data.amount);
						chai.expect(planCheck.created).to.equal(res.body.data.created);
						chai.expect(planCheck.currency).to.equal(res.body.data.currency);
						chai.expect(planCheck.interval).to.equal(res.body.data.interval);
						chai.expect(planCheck.name).to.equal(res.body.data.name);
						chai.expect(planCheck.nickname).to.equal(res.body.data.nickname);
						chai.expect(planCheck.trial_period_days).to.equal(res.body.data.trial_period_days);
						done();
						return;
					});
				});
			});
		});
	});



	it("should create a new plan and get the value back", (done) => {

		const planName: string = "myplan";
		const planNick: string = "planMonth";
		const planAmount: number = 10;
		const planCurrency: string = "usd";
		const planInterval: string = "month";

		createFakeAdmin((err: Error) => {
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
					done(err);
					return;
				}

				chai.expect(res.body.message).to.equal("login with success");

				createPlan(res.header["set-cookie"], planName, planNick, planAmount, planCurrency, planInterval, (err: Error, newPlan: stripePlan) => {
					if (err) {
						done(err);
						return;
					}
					StripePlan.findById({_id: newPlan._id}, (err: Error, planCheck: stripePlan) => {
						if (err) {
							done(err);
							return;
						}
						// compare the result with those on the DB
						chai.expect(planCheck.id).to.equal(newPlan.id);
						chai.expect(planCheck.amount).to.equal(newPlan.amount);
						chai.expect(planCheck.created).to.equal(newPlan.created);
						chai.expect(planCheck.currency).to.equal(newPlan.currency);
						chai.expect(planCheck.interval).to.equal(newPlan.interval);
						chai.expect(planCheck.name).to.equal(newPlan.name);
						chai.expect(planCheck.nickname).to.equal(newPlan.nickname);
						chai.expect(planCheck.trial_period_days).to.equal(newPlan.trial_period_days);
						done();
						return;
					});
				});
			});
		});
	});


	it("create 3 plans and get them back using the request", (done) => {

		const planName: string = "myplan1";
		const planNick: string = "planMonth";
		const planAmount: number = 10;
		const planCurrency: string = "usd";
		const planInterval: string = "month";

		const planName2: string = "myplan2";
		const planNick2: string = "planYear";
		const planAmount2: number = 100;
		const planCurrency2: string = "usd";
		const planInterval2: string = "year";

		const planName3: string = "myplan3";
		const planNick3: string = "planDay";
		const planAmount3: number = 1;
		const planCurrency3: string = "usd";
		const planInterval3: string = "day";

		createFakeAdmin((err: Error) => {

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
					done(err);
					return;
				}

				chai.expect(res.body.message).to.equal("login with success");

				createPlan(res.header["set-cookie"], planName, planNick, planAmount, planCurrency, planInterval, (err: Error, newPlan1: stripePlan) => {
					if (err) {
						done(err);
						return;
					}

					// check the first plan data
					chai.expect(planAmount).to.equal(newPlan1.amount);
					chai.expect(planCurrency).to.equal(newPlan1.currency);
					chai.expect(planInterval).to.equal(newPlan1.interval);
					chai.expect(planName).to.equal(newPlan1.name);
					chai.expect(planNick).to.equal(newPlan1.nickname);
					chai.expect(0).to.equal(newPlan1.trial_period_days);

					createPlan(res.header["set-cookie"], planName2, planNick2, planAmount2, planCurrency2, planInterval2, (err: Error, newPlan2: stripePlan) => {
						if (err) {
							done(err);
							return;
						}

						// check the second plan data
						chai.expect(planAmount2).to.equal(newPlan2.amount);
						chai.expect(planCurrency2).to.equal(newPlan2.currency);
						chai.expect(planInterval2).to.equal(newPlan2.interval);
						chai.expect(planName2).to.equal(newPlan2.name);
						chai.expect(planNick2).to.equal(newPlan2.nickname);
						chai.expect(0).to.equal(newPlan2.trial_period_days);

						createPlan(res.header["set-cookie"], planName3, planNick3, planAmount3, planCurrency3, planInterval3, (err: Error, newPlan3: stripePlan) => {
							if (err) {
								done(err);
								return;
							}

							// check the last plan
							chai.expect(planAmount3).to.equal(newPlan3.amount);
							chai.expect(planCurrency3).to.equal(newPlan3.currency);
							chai.expect(planInterval3).to.equal(newPlan3.interval);
							chai.expect(planName3).to.equal(newPlan3.name);
							chai.expect(planNick3).to.equal(newPlan3.nickname);
							chai.expect(0).to.equal(newPlan3.trial_period_days);

							// sign out from the admin account
							request(app).get("/auth/signout")
							.set("Accept", "application/json")
							.set("Content-Type", "application/json")
							.set("Cookie", res.header["set-cookie"])
							.send()
							.expect(200)
							.expect("Content-Type", /json/)
							.end(function (err, res) {
								if (err) {
									done(err);
									return;
								}
								chai.expect(res.body.message).to.equal("logout success");
								// console.log("cookie-->", res.header["set-cookie"]); // roberto
								chai.expect(res.header["set-cookie"]).to.not.exist;

								// create the fake user acccount
								createFakeUser((err: Error) => {
									if (err) {
										done (err);
										return;
									}

									// login as normal user
									request(app).post("/auth/signin")
									.set("Accept", "application/json")
									.set("Content-Type", "application/json")
									.send({
										"email": "placeholder@mail.com",
										"password": "123"
									})
									.expect(200)
									.expect("Content-Type", /json/)
									.expect("set-cookie", /connect.sid/)
									.end(function (err, res) {
										if (err) {
											done(err);
											return;
										}
										chai.expect(res.body.message).to.equal("login with success");
										chai.expect(res.header["set-cookie"]).to.exist;
										request(app).get("/subscription/plan/list")
										.set("Accept", "application/json")
										.set("Content-Type", "application/json")
										.set("Cookie", res.header["set-cookie"])
										.send()
										.expect(200)
										.expect("Content-Type", /json/)
										.end(function (err, res) {
											if (err) {
												done (err);
												return;
											}
											chai.expect(res.body.message).to.equal("success");
											chai.expect(res.body.data).to.exist;
											chai.expect(res.body.data.length).to.equal(3);

											// check the first plan data
											chai.expect(res.body.data[0].amount).to.equal(newPlan1.amount);
											chai.expect(res.body.data[0].currency).to.equal(newPlan1.currency);
											chai.expect(res.body.data[0].interval).to.equal(newPlan1.interval);
											chai.expect(res.body.data[0].name).to.equal(newPlan1.name);
											chai.expect(res.body.data[0].nickname).to.equal(newPlan1.nickname);
											chai.expect(res.body.data[0].trial_period_days).to.equal(newPlan1.trial_period_days);

											// check the second plan data
											chai.expect(res.body.data[1].amount).to.equal(newPlan2.amount);
											chai.expect(res.body.data[1].currency).to.equal(newPlan2.currency);
											chai.expect(res.body.data[1].interval).to.equal(newPlan2.interval);
											chai.expect(res.body.data[1].name).to.equal(newPlan2.name);
											chai.expect(res.body.data[1].nickname).to.equal(newPlan2.nickname);
											chai.expect(res.body.data[1].trial_period_days).to.equal(newPlan2.trial_period_days);

											chai.expect(res.body.data[2].amount).to.equal(newPlan3.amount);
											chai.expect(res.body.data[2].currency).to.equal(newPlan3.currency);
											chai.expect(res.body.data[2].interval).to.equal(newPlan3.interval);
											chai.expect(res.body.data[2].name).to.equal(newPlan3.name);
											chai.expect(res.body.data[2].nickname).to.equal(newPlan3.nickname);
											chai.expect(res.body.data[2].trial_period_days).to.equal(newPlan3.trial_period_days);
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
		});
	});
});