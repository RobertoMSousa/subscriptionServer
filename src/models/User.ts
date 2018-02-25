import * as bcrypt from "bcrypt-nodejs";
import * as crypto from "crypto";
import * as mongoose from "mongoose";
import { debug } from "util";



/*
TYPES
*/
export type UserModel = mongoose.Document & {
	email: string,
	password: string,
	stripeId: string,
	comparePassword: (candidatePassword: string, cb: (err: any, isMatch: any) => {}) => void,
};

export type AuthToken = {
	accessToken: string,
	kind: string
};

export type saltedUser = {
	_id: mongoose.Types.ObjectId,
	email: string,
	isAuthenticated: boolean
};

/*Mongo Schema*/
const userSchema = new mongoose.Schema({
	email: { type: String, unique: true },
	password: {
		type: String,
		required: true
	},
	createdAt: {
		type: Date,
		default: Date.now
	},
	stripeId: {
		type: String,
		required : true
	}
});


/*Mongo Schema*/
const adminSchema = new mongoose.Schema({
	email: { type: String, unique: true }
});

/*
function that salt the user to avoid returning the sensive data
*/
export function userSalt(user: UserModel): saltedUser {
	return {_id: user._id, email: user.email, isAuthenticated: true};
}

/**
 * Password hash middleware.
 */
userSchema.pre("save", function save(next) {
	const user = this;
	if (!user.isModified("password")) { return next(); }
	bcrypt.genSalt(10, (err, salt) => {
		if (err) { return next(err); }
		bcrypt.hash(user.password, salt, undefined, (err: mongoose.Error, hash) => {
			if (err) { return next(err); }
			user.password = hash;
			next();
		});
	});
});

userSchema.methods.comparePassword = function (candidatePassword: string, cb: (err: any, isMatch: any) => {}) {
	bcrypt.compare(candidatePassword, this.password, (err: mongoose.Error, isMatch: boolean) => {
		cb(err, isMatch);
	});
};

const User = mongoose.model("User", userSchema);
export const Admin = mongoose.model("Admin", adminSchema);
export default User;