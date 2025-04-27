import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";
// import listEndpoints from "express-list-endpoints";

dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() => console.log("DB connection successful!"));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
  // console.log(listEndpoints(app));
});
