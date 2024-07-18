import jwt from "jsonwebtoken";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import {
	deleteFromCloudinary,
	uploadOnCloudinary,
} from "../utils/cloudinary.js";

const generateAccessAndRefreshTokens = async (userId) => {
	try {
		const user = await User.findById(userId);
		const accessToken = user?.generateAccessToken();
		const refreshToken = user?.generateRefreshToken();
		user.refreshToken = refreshToken;
		await user.save({ validateBeforeSave: false });
		return { accessToken, refreshToken };
	} catch (error) {
		throw new ApiError(
			500,
			"Something went wrong in access and refresh token generation"
		);
	}
};

// SIGNUP-USER
const registerUser = asyncHandler(async function (req, res) {
	// get user details from frontend
	// validation not empty
	// already registered?
	// check image / avatar
	// upload to cloudinary server
	// create user object- create entry in db
	// remove pass and refresh token field from response
	// check for user creation
	// return res

	const { email, username, fullName, password } = req.body;
	const checkForEmpty = [email, password, fullName, username].some(
		(field) => field?.trim() === ""
	);
	if (checkForEmpty) throw new ApiError(400, "All fields are required");
	const existedUser = await User.findOne({
		$or: [{ email }, { username }],
	});
	if (existedUser)
		throw new ApiError(409, "Email or username already exists");
	const avatarLocalPath = req.files?.avatar[0].path;

	let coverImageLocalPath;
	if (
		req.files &&
		Array.isArray(req.files.coverImage) &&
		req.files.coverImage.length > 0
	) {
		coverImageLocalPath = req.files.coverImage[0].path;
	}
	if (!avatarLocalPath) throw new ApiError(400, "Avatar is required");

	// upload to cloudinary server
	const avatar = await uploadOnCloudinary(avatarLocalPath);
	const coverImage = await uploadOnCloudinary(coverImageLocalPath);
	if (!avatar) throw new ApiError(400, "Avatar not uploaded on cloudinary");

	const user = await User.create({
		fullName,
		email,
		password,
		username: username.toLowerCase(),
		avatar: avatar.url,
		coverImage: coverImage?.url || "",
	});

	const createdUser = await User.findById(user._id).select(
		"-password -refreshToken"
	);
	if (!createdUser) throw new ApiError(500, "Something went wrong");

	return res
		.status(201)
		.json(
			new ApiResponse(200, createdUser, "User registered successfully")
		);
});

// LOGIN-USER
const loginUser = asyncHandler(async (req, res) => {
	const { email, username, password } = req.body;
	if (!email || !username)
		throw new ApiError(401, "username or email is required");

	const user = await User.findOne({
		$or: { email, username },
	});
	if (!user) throw new ApiError(404, "user not found. Please Sign up");

	const isPasswordValid = await user.isPasswordCorrect(password);
	if (!isPasswordValid) throw new ApiError(401, "password is not correct");

	const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
		user._id
	);

	// dont send back password and refresh token to
	const loggedInUser = await User.findById(user._id).select(
		"-password -refreshToken"
	);

	const cookiesOptions = {
		httpOnly: true,
		secure: true,
	};
	return res
		.status(200)
		.cookie("accessToken", accessToken, cookiesOptions)
		.cookie("refreshToken", refreshToken, cookiesOptions)
		.json(
			new ApiResponse(
				200,
				{
					user: loggedInUser,
					accessToken,
					refreshToken,
				},
				"User logged in successfully"
			)
		);
});

// LOGOUT-USER
const logoutUser = asyncHandler(async (req, res) => {
	const userId = req.user._id;
	await User.findByIdAndUpdate(userId, {
		$set: {
			refreshToken: undefined,
		},
	});
	const cookiesOptions = {
		httpOnly: true,
		secure: true,
	};
	return res
		.status(200)
		.clearCookie("accessTsoken", cookiesOptions)
		.clearCookie("refreshToken", cookiesOptions)
		.json(new ApiResponse(200, {}, "User logged out successfully"));
});

// REFRESH-TOKEN
const refreshAcessToken = asyncHandler(async (req, res) => {
	const incomingRefreshToken =
		req.cookies.refreshToken || req.body.refreshToken;
	if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized token");

	try {
		const decodedToken = jwt.verify(
			incomingRefreshToken,
			process.env.REFRESH_TOKEN_SECRET
		);

		const user = await User.findById(decodedToken?._id);
		if (!user) throw new ApiError(401, "Invalid refresh token");
		if (incomingRefreshToken !== user?.refreshToken)
			throw new ApiError(401, "Refresh token is expired or used");

		const { accessToken, refreshToken: newRefreshToken } =
			await generateAccessAndRefreshTokens(user._id);
		const cookieOptions = {
			httpOnly: true,
			secure: true,
		};

		return res
			.status(200)
			.cookie("accessToken", accessToken, cookieOptions)
			.cookie("refreshToken", newRefreshToken, cookieOptions)
			.json(
				new ApiResponse(
					200,
					{ accessToken, refreshToken: newRefreshToken },
					"accesToken refreshed successfully"
				)
			);
	} catch (error) {
		throw new ApiError(401, error?.message || "Invalid refresh token");
	}
});

// CHANGE-PASSWORD
const changeCurrentPassword = asyncHandler(async (req, res) => {
	const { password, newPassword, confirmPassword } = req.body;
	const user = await User.findById(req.user._id);
	if (!user) throw new ApiError(401, "Unauthorized request");

	const isPasswordCorrect = user.isPasswordCorrect(password);
	if (!isPasswordCorrect) throw new ApiError(400, "Invalid password");

	if (newPassword !== confirmPassword)
		throw new ApiError(400, "Passwords do not match");

	user.password = newPassword;
	await user.save({
		validateBeforeSave: false,
	});
	return res
		.status(200)
		.json(new ApiResponse(200, {}, "Password changed successfully"));
});

// GET-CURRENT-USER
const getCurrentUser = asyncHandler(async (req, res) => {
	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				req.user,
				"Current user retrieved successfully"
			)
		);
});

// UPDATE-ACCOUNT-DETAILS
const updateAccountDetails = asyncHandler(async (req, res) => {
	const { email, fullName } = req.body;
	if (!email || !fullName) throw new ApiError(400, "All fields are required");
	const user = await User.findByIdAndUpdate(
		req.user._id,
		{
			$set: {
				email,
				fullName,
			},
		},
		{ new: true }
	).select("-password");

	return res
		.status(200)
		.json(
			new ApiResponse(200, user, "Account details updated successfully")
		);
});

//UPDATE-USER-AVATAR
const updateUserAvatar = asyncHandler(async (req, res) => {
	const avatarLocalPath = req.file?.path;
	if (!avatarLocalPath) throw new ApiError(400, "Avatar is required");
	const avatar = await uploadOnCloudinary(avatarLocalPath);
	if (!avatar) throw new ApiError(400, "Avatar not updated on cloudinary");

	const user = await User.findByIdAndUpdate(
		req.user._id,
		{
			$set: {
				avatar: avatar.url,
			},
		},
		{ new: true }
	).select("-password");
	const deleteOldAvatar = await deleteFromCloudinary(avatar.public_id);
	console.log(deleteOldAvatar.result, "AVATAEEEE");
	return res
		.status(200)
		.json(new ApiResponse(200, user, "Avatar updated Successfully"));
});

// UPDATE-USER-COVER-IMAGE
const updateUserCoverImg = asyncHandler(async (req, res) => {
	const coverImageLocalPath = req.file?.path;
	if (!coverImageLocalPath)
		throw new ApiError(400, "Cover Image is required");
	const coverImage = await uploadOnCloudinary(avatarLocalPath);
	if (!avatar)
		throw new ApiError(400, "Cover Image not updated on cloudinary");

	const user = await User.findByIdAndUpdate(
		req.user._id,
		{
			$set: {
				coverImage: coverImage.url,
			},
		},
		{ new: true }
	).select("-password");
	return res
		.status(200)
		.json(new ApiResponse(200, user, "Cover Image updated Successfully"));
});

// GET-USER-CHANNEL-PROFILE
const getUserChannelProfile = asyncHandler(async (req, res) => {
	const { username } = req.params;
	if (!username?.trim()) throw new ApiError(400, "Username is missing!!!");
	const channel = await User.aggregate([
		{
			$match: { username: username.toLowerCase() },
		},
		{
			$lookup: {
				from: "subscriptions",
				localField: "_id",
				foreignField: "channel",
				as: "subscribers",
			},
		},
		{
			$lookup: {
				from: "subscriptions",
				localField: "_id",
				foreignField: "subscriber",
				as: "subscribedTo",
			},
		},
		{
			$addFields: {
				subscribersCount: {
					$size: "$subscribers",
				},
				channelsSubscribedToCount: {
					$size: "$subscribedTo",
				},
				isSubscribed: {
					$cond: {
						if: { $in: [req.user?._id, "$subscribers.subscriber"] },
						then: true,
						else: false,
					},
				},
			},
		},
		{
			$project: {
				username: 1,
				fullName: 1,
				email: 1,
				avatar: 1,
				coverImage: 1,
				subscribersCount: 1,
				channelsSubscribedToCount: 1,
				isSubscribed: 1,
			},
		},
	]);
	if (!channel.length) throw new ApiError(404, "channel not found");

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				channel[0],
				"User profile retrieved successfully"
			)
		);
});
// GET-WATCH-HISTORY
const getWatchHistory = asyncHandler(async (req, res) => {
	const user = await User.aggregate([
		{
			$match: {
				_id: new mongoose.Types.ObjectId(req.user._id),
			},
		},
		{
			$lookup: {
				from: "videos",
				localField: "watchHistory",
				foreignField: "_id",
				as: "watchHistory",
				pipeline: [
					{
						$lookup: {
							from: "users",
							localField: "owner",
							foreignField: "_id",
							as: "owner",
							pipeline: [
								{
									$project: {
										fullName: 1,
										username: 1,
										avatar: 1,
									},
								},
								{
									//pipeline usually return arrays and the data is present as the array[0]. so this pipeline
									// is used to overwrite the owner field and return owner as object
									$addFields: {
										owner: {
											$first: "$owner",
										},
									},
								},
							],
						},
					},
				],
			},
		},
	]);
	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				user[0].watchHistory,
				"Watch History fetched successfully"
			)
		);
});

export {
	registerUser,
	loginUser,
	logoutUser,
	refreshAcessToken,
	changeCurrentPassword,
	getCurrentUser,
	updateAccountDetails,
	updateUserAvatar,
	updateUserCoverImg,
	getUserChannelProfile,
	getWatchHistory,
};
