import express from "express";
import connectDB from "./db/index.js";
import dotenv from "dotenv";

dotenv.config({ path: "./env" });

// const app = express();

// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });

// app.listen(3000, () => {
//   console.log("Example app listening on port 3000!");
// });

connectDB();
