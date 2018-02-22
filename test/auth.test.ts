import * as request from "supertest";
import * as app from "../src/app";
import * as mongo from "connect-mongo";
import * as crypto from "crypto";


import { default as User, UserModel, AuthToken } from "../src/models/User";
import * as mongoose from "mongoose";

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

describe("Test the login route", () => {

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

	it("should return 206 and the no email provided message", (done) => {
		request(app).post("/auth/signin")
			.set("Accept", "application/json")
			.send({})
			.expect(206)
			.expect("Content-Type", /json/)
			.end(function (err, res) {
				if (err) {
					done(err);
					return;
				}
				chai.expect(res.body.message).to.equal("no email provided");
				done();
				return;
			});
	});

	it("should return 206 and the no not valid email message", (done) => {
		request(app).post("/auth/signin")
			.set("Accept", "application/json")
			.send({
				email: "notvalid"
			})
			.expect(206)
			.expect("Content-Type", /json/)
			.end(function (err, res) {
				if (err) {
					done(err);
					return;
				}
				chai.expect(res.body.message).to.equal("email not valid");
				done();
				return;
			});
	});

	it("should return 206 and the no password provided message", (done) => {
		request(app)
			.post("/auth/signin")
			.send({
				email: "beto@mail.com"
			})
			.expect(206)
			.expect("Content-Type", /json/)
			.end(function (err, res) {
				if (err) {
					done(err);
					return;
				}
				chai.expect(res.body.message).to.equal("no password provided");
				done();
				return;
			});
	});

	it("should get the email or password wrong error", (done) => {
		request(app).post("/auth/signin")
			.set("Accept", "application/json")
			.send({
				"email": "notfound@mail.local",
				"password": "123"
			})
			.expect(404)
			.expect("Content-Type", /json/)
			.end(function (err, res) {
				if (err) {
					done(err);
					return;
				}
				chai.expect(res.body.message).to.equal("email or password are wrong");
				done();
				return;
			});
	});

	it("should bet able to get success message on login", (done) => {
		createFakeUser((err: Error) => {
			request(app).post("/auth/signin")
			.set("Accept", "application/json")
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
				chai.expect(res.body.message).to.equal("login with success");
				done();
				return;
			});
		});
	});

});

describe("Test the logout route", () => {

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


	it("should bet able to login and logout right after", (done) => {
		const md5: string = crypto.createHash("md5").update("placeholder@mail.com").digest("hex");
		createFakeUser((err: Error) => {
			if (err) {
				done(err);
				return;
			}
			request(app).post("/auth/signin")
			.set("Accept", "application/json")
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
				chai.expect(res.body.message).to.equal("login with success");
				chai.expect(res.body.data).to.exist;
				chai.expect(res.body.data.email).to.equal("placeholder@mail.com");
				request(app).get("/auth/signout")
					.set("Accept", "application/json")
					.expect(200)
					.expect("Content-Type", /json/)
					.end(function (err, res) {
						if (err) {
							done(err);
							return;
						}
						chai.expect(res.body.message).to.equal("logout success");
						done();
						return;
					});
			});
		});
	});
});

describe("GET /auth/signup", () => {

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

	it("should return 403 and the no email provided message", (done) => {
		request(app).post("/auth/signup")
			.set("Accept", "application/json")
			.send({})
			.expect(403)
			.expect("Content-Type", /json/)
			.end(function (err, res) {
				if (err) {
					done(err);
					return;
				}
				chai.expect(res.body.message).to.equal("no email provided");
				done();
				return;
			});
	});

	it("should return 500 and the not valid email message", (done) => {
		request(app).post("/auth/signup")
			.set("Accept", "application/json")
			.send({
				"email": "noValid"
			})
			.expect(500)
			.expect("Content-Type", /json/)
			.end(function (err, res) {
				if (err) {
					done(err);
					return;
				}
				chai.expect(res.body.message).to.equal("email not valid");
				done();
				return;
			});
	});

	it("should return 403 if not password provided", (done) => {
		request(app).post("/auth/signup")
			.set("Accept", "application/json")
			.send({
				"email": "beto@mail.com",
				"passwordRepeat": "123"
			})
			.expect(403)
			.expect("Content-Type", /json/)
			.end(function (err, res) {
				if (err) {
					done(err);
					return;
				}
				chai.expect(res.body.message).to.equal("no password provided");
				done();
				return;
			});
	});

	it("should return 403 if not reapeated password provided provided", (done) => {
		request(app).post("/auth/signup")
			.set("Accept", "application/json")
			.send({
				"email": "beto@mail.com",
				"password": "123"
			})
			.expect(403)
			.expect("Content-Type", /json/)
			.end(function (err, res) {
				if (err) {
					done(err);
					return;
				}
				chai.expect(res.body.message).to.equal("no password provided");
				done();
				return;
			});
	});


	it("should return 500 if not password and repeated password don't match", (done) => {
		request(app).post("/auth/signup")
			.set("Accept", "application/json")
			.send({
				"email": "beto@mail.com",
				"password": "123",
				"passwordRepeated": "notequal"
			})
			.expect(500)
			.expect("Content-Type", /json/)
			.end(function (err, res) {
				if (err) {
					done(err);
					return;
				}
				chai.expect(res.body.message).to.equal("passwords don't match");
				done();
				return;
			});
	});

	it("should not be able to create an account for a user that already exists", (done) => {
		createFakeUser((err: Error) => {
			request(app).post("/auth/signup")
			.set("Accept", "application/json")
			.send({
				"email": "placeholder@mail.com",
				"password": "123",
				"passwordRepeated": "123"
			})
			.expect(302)
			.expect("Content-Type", /json/)
			.end(function (err, res) {
				if (err) {
					done(err);
					return;
				}
				chai.expect(res.body.message).to.equal("user already exist");
				done();
				return;
			});
		});
	});

	it("should be able to create the new user", (done) => {
		const md5: string = crypto.createHash("md5").update("placeholder@mail.com").digest("hex");
		request(app).post("/auth/signup")
			.set("Accept", "application/json")
			.send({
				"email": "placeholder@mail.com",
				"password": "123",
				"passwordRepeated": "123"
			})
			.expect(200)
			.expect("Content-Type", /json/)
			.end(function (err, res) {
				if (err) {
					done(err);
					return;
				}
				chai.expect(res.body.message).to.equal("account created");
				chai.expect(res.body.data).to.exist;
				chai.expect(res.body.data.email).to.equal("placeholder@mail.com");
				done();
				return;
			});
	});
});