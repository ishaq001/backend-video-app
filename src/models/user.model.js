import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";

/**
 * User schema for MongoDB.
 * @typedef {Object} User
 * @property {string} username - The username of the user.
 * @property {string} email - The email of the user.
 * @property {string} fullName - The full name of the user.
 * @property {string} avatar - The URL of the user's avatar image.
 * @property {string} coverImage - The URL of the user's cover image.
 * @property {ObjectId} [watchHistory] - The ID of the video the user is watching.
 * @property {string} password - The hashed password of the user.
 * @property {string} [refreshToken] - The refresh token of the user.
 * @property {Date} [createdAt] - The timestamp when the user was created.
 * @property {Date} [updatedAt] - The timestamp when the user was last updated.
 */

const userSchema = new Schema(
	{
		username: {
			type: String,
			required: true,
			unique: true,
			index: true,
			lowercase: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		fullName: {
			type: String,
			required: true,
			index: true,
			trim: true,
		},
		avatar: {
			type: String, // cloudinary url
			required: true,
		},
		coverImage: {
			type: String, // cloudinary url
		},
		watchHistory: {
			type: Schema.Types.ObjectId,
			ref: "Video",
		},
		password: {
			type: String,
			required: [true, "Password is required!"],
		},
		refreshToken: {
			type: String,
		},
	},
	{
		timestamps: true,
	}
);

/**
 * Pre-save hook to hash the password before saving the user.
 * @param {User} next - The next middleware function in the chain.
 */
userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next(); // if tha password is not modified, do nothing and next
	this.password = await bcrypt.hash(this.password, 10);
	next();
});

/**
 * Method to check if the provided password is correct.
 * @param {string} password - The password to be checked.
 * @returns {Promise<boolean>} - A promise that resolves to true if the password is correct, false otherwise.
 */
userSchema.methods.isPasswordCorrect = async function (password) {
	return await bcrypt.compare(password, this.password);
};

/**
 * Method to generate an access token for the user.
 * @returns {string} - The access token.
 */
userSchema.methods.generateAccessToken = function () {
	return jwt.sign(
		{ _id: this._id, emaill: this.email },
		process.env.ACCESS_TOKEN,
		{
			expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
		}
	);
};

/**
 * Method to generate a refresh token for the user.
 * @returns {string} - The refresh token.
 */
userSchema.methods.generateRefreshToken = function () {
	return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN, {
		expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
	});
};

export const User = model("User", userSchema);
