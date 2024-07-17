import mongoose, { Schema } from "mongoose";

const sucbscriptionSchema = new Schema(
	{
		subscriber: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		channel: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
	},
	{ timestamps: true }
);

export const Subscription = mongoose.model("Subscription", sucbscriptionSchema);
