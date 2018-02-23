import * as request from "supertest";
import * as app from "../src/app";
import * as mongo from "connect-mongo";
import * as crypto from "crypto";
import * as mongoose from "mongoose";

import { default as User, UserModel, AuthToken } from "../src/models/User";

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

describe("test the routes that required authentication", () => {

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

	it("should be able to see the page that is only available when loged in", (done) => {
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
				request(app).get("/user/account")
				.set("Accept", "application/json")
				.set("Cookie", res.header["set-cookie"])
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
					chai.expect(res.body.message).to.equal("this should be only working if logged in");
					done();
					return;
				});
			});
		});
	});

	it("shouldn't be able to see the user page without login", (done) => {
		createFakeUser((err: Error) => {
			request(app).get("/user/account")
				.set("Accept", "application/json")
				.send({
					"email": "placeholder@mail.com",
					"password": "123"
				})
				.expect(403)
				.expect("Content-Type", /json/)
				.end(function (err, res) {
					chai.expect(res.body.message).to.equal("login required");
					done();
					return;
				});
		});
	});

});



describe("add a new payment method to the user", () => {

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

	it("should be able to successfully add a new payment method to the user", (done) => {
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
				request(app).post("/user/payment/source")
				.set("Accept", "application/json")
				.set("Cookie", res.header["set-cookie"])
				.set("Content-Type", "application/json")
				.send({
					"source": "tok_mastercard"
				})
				.expect(200)
				.expect("Content-Type", /json/)
				.end(function (err, res) {
					if (err) {
						done(err);
						return;
					}
					chai.expect(res.body.message).to.equal("payment method added");
					chai.expect(res.body.data).to.exist;
					chai.expect(res.body.data.id).to.exist;
					done();
					return;
				});
			});
		});
	});

	it("should get the 400 error if no source provided", (done) => {
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
				request(app).post("/user/payment/source")
				.set("Accept", "application/json")
				.set("Cookie", res.header["set-cookie"])
				.set("Content-Type", "application/json")
				.send({
				})
				.expect(400)
				.expect("Content-Type", /json/)
				.end(function (err, res) {
					if (err) {
						done(err);
						return;
					}
					chai.expect(res.body.message).to.equal("missing source");
					chai.expect(res.body.data).to.not.exist;
					done();
					return;
				});
			});
		});
	});

	it("should get the 500 error if the source provided is not valid", (done) => {
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
				request(app).post("/user/payment/source")
				.set("Accept", "application/json")
				.set("Cookie", res.header["set-cookie"])
				.set("Content-Type", "application/json")
				.send({
					"source": "noValid"
				})
				.expect(500)
				.expect("Content-Type", /json/)
				.end(function (err, res) {
					if (err) {
						done(err);
						return;
					}
					chai.expect(res.body.message).to.equal("failed");
					chai.expect(res.body.data).to.not.exist;
					done();
					return;
				});
			});
		});
	});
});