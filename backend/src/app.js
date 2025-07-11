import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";

const app = express();

app.use(morgan("combined"));
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

import routes from "./routes/routes.js";
app.use("/", routes);

export default app;
