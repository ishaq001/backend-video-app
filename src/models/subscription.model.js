import mongoose, { Schema } from "mongoose";

const sucbscriptionSchema = new Schema(
	{
		subscriber: {
			type: Schema.Types.ObjectId, // one who is subscribing
			ref: "User",
			required: true,
		},
		channel: {
			type: Schema.Types.ObjectId, // one to whom "subscriber" is subscribing
			ref: "User",
			required: true,
		},
	},
	{ timestamps: true }
);

export const Subscription = mongoose.model("Subscription", sucbscriptionSchema);
