import * as async from "async";
import * as crypto from "crypto";
import * as passport from "passport";
import { default as User, UserModel, AuthToken } from "../../models/User";
import { Request, Response, NextFunction } from "express";
import { IVerifyOptions } from "passport-local";
import { WriteError } from "mongodb";
import { concat } from "async";
import { isEmail } from "validator";




/**
 * GET /account
 * Profile page.
 */
export const getAccount = (req: Request, res: Response) => {
	res.status(200).json({message: "this should be only workign if logged in", error: undefined, data: undefined});
	return;
};
