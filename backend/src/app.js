import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";

const PORT = process.env.PORT ?? 3000;

const app = express();

app.use(morgan("combined"));
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

import routes from "./routes/routes.js";
app.use("/", routes);

await mongoose.connect(process.env.DB_URL);
app.listen(PORT, () => console.log(`App server listening on port ${PORT}!`));