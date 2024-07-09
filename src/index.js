import connectDB from "./db/index.js";
import dotenv from "dotenv";

import { app } from "./app.js";

dotenv.config({ path: "./env" });

connectDB()
	.then(() => {
		// Listen for errors on the server
		app.on("error", (error) => {
			console.error("Error: " + error);
		});

		app.listen(process.env.PORT || 8000, () => {
			console.log(`Server listening on port ${process.env.PORT}`);
		});
	})
	.catch((error) => console.error("Error: " + error));
