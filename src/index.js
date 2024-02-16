import dotenv from "dotenv"
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({
    path: './env'
})
  

connectDB()
.then(() => {
  app.on("error", (error) => {
    console.log("ERRR:: ", error);
    throw error;
  })
  app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running at port : ${process.env.PORT}`)
  })
})
.catch((error) => {
  console.log("MongoDB connection failed!!! :: Error", error);
})





















































/*
      Another approach
import { Express } from "express";
const app = Express();

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("Error", () => {
      console.log("Error :: Express:: ", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`App is listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.log("Error :: Database Error:: ", error);
    throw error;
  }
})();
*/
