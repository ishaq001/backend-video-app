import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshTokens = async (userId) => {
	try {
		console.log("Generating access credentials");
		const user = await User.findById(userId);
		console.log(
			user.generateAccessToken(),
			"HEYYYE",
			user.generateRefreshToken()
		);
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
	if (!avatar) throw new ApiError(400, "Avatar is required");

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
	// req body > data
	const { email, username, password } = req.body;

	// username or email
	if (!email || !username)
		throw new ApiError(401, "username or email is required");

	// find the user
	const user = await User.findOne({
		$or: { email, username },
	});

	if (!user) throw new ApiError(404, "user not found. Please Sign up");

	// password check
	const isPasswordValid = await user.isPasswordCorrect(password);
	if (!isPasswordValid) throw new ApiError(401, "password is not valid");

	console.log("USERID:", user._id);

	// access and refresh token
	const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
		user._id
	);

	// dont send back password and refresh token to
	const loggedInUser = await User.findById(user._id).select(
		"-password -refreshToken"
	);

	// send cookies
	const cookiesOptions = {
		httpOnly: true,
		secure: true,
	};
	return res
		.status(200)
		.cookie("access_token", accessToken, cookiesOptions)
		.cookie("refresh_token", refreshToken, cookiesOptions)
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
		.clearCookie("access_token", cookiesOptions)
		.clearCookie("refresh_token", cookiesOptions)
		.json(new ApiResponse(200, {}, "User logged out successfully"));
});

export { registerUser, loginUser, logoutUser };
