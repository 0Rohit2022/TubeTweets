import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));


app.use(express.json({limit : "16kb"}));    
app.use(express.urlencoded({extended: true, limit : "16kb"}))
app.use(express.static("public"));
app.use(cookieParser())



//Importing Routes
import userRouter from "./routes/user.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscriptions.routes.js";


//Routes Declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/tweets", tweetRouter); 
app.use("/api/v1/subscriptions", subscriptionRouter);

//http://localhost:8000/api/v1/users/register



export default app;  