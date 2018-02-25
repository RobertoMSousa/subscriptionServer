

import * as async from "async";
import { Request, Response, NextFunction } from "express";

export const index = (req: Request, res: Response, next: NextFunction) => {
	/*
	TODO: need to implement the login as admin route
	*/
	res.status(200).json({message: "admin login page", error: undefined, data: undefined });
};