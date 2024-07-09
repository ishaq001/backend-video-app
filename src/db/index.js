import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
	try {
		await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
		console.log("MONGO Connection SUCCESS -->");
	} catch (error) {
		console.log("MONGO Connection ERROR -->", error);
		process.exit(1);
	}
};

export default connectDB;
