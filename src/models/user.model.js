import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";

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
			type: string,
		},
	},
	{
		timestamps: true,
	}
);

userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next(); // if tha password is not modified, do nothing and next
	this.password = await bcrypt.hash(this.password, 10);
	next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
	return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
	return jwt.sign(
		{ _id: this._id, emaill: this.email },
		process.env.ACCESS_TOKEN,
		{
			expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
		}
	);
};

userSchema.methods.generateRefreshToken = function () {
	return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN, {
		expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
	});
};

export const User = model("User", userSchema);
