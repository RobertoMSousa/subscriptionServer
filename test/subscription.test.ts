import * as request from "supertest";
import * as app from "../src/app";
import * as mongo from "connect-mongo";
import * as crypto from "crypto";
import * as mongoose from "mongoose";

import { default as User, UserModel, AuthToken, Admin } from "../src/models/User";


import { StripePlan, stripePlan } from "../src/models/Subscription";

const chai = require("chai");
const expect = chai.expect;


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



describe("create plans", () => {

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
});