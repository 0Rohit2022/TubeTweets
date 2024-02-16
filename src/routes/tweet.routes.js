import { Router } from "express";
import {verfifyJWT} from "../middlewares/auth.middleware.js";
import { createTweet, updateTweet, deleteTweet ,getUserTweets} from "../controllers/tweet.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();


//This line is gonna apply to all the routes which are given below and so need to define this for each of them.
router.use(verfifyJWT, upload.none());


router.route("/createtweet").post(createTweet); 
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);
router.route("/user/:userId").get(getUserTweets);

 
export default router;
