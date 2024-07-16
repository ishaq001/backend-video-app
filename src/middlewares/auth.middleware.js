import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
	try {
		console.log("Inside jwtVerification middleware", req.cookies);
		const token =
			req.cookies.access_token ||
			req.headers("Authorization").replace("Bearer ", "");
		console.log({ token }, "FILEE");
		if (!token) throw new ApiError(401, "Unauthorized request");
		const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
		const user = await User.findById(decodedToken._id).select(
			"-password -refreshToken"
		);
		// TODO: discuss about frontend
		if (!user) throw new ApiError(401, "Invalid access token");
		req.user = user;
		next();
	} catch (error) {
		throw new ApiError(
			401,
			"error in jwtVerification -> auth.middleware.js"
		);
	}
});
