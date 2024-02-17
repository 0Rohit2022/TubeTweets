import mongoose, {isValidObjectId} from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subscription } from "../models/subscribtions.model.js";

const toggleSubscription = asyncHandler(async(req, res) => {

    //Get the data from the id 
    //Validation
    //Find the subscriber details from the database --->Like:- The userdetails and the channel details
    //Check if the channel is subscribed or not by the user
    //if not subscribed to that channel then subscribe him 

    const {channelId} = req.params;

    if(!isValidObjectId(channelId))
    {
        throw new ApiError(400, "Invalid channelId");
    }

    const isSubscribed = await Subscription.findOne({
        subscriber: req.user?._id,
        channel : channelId
    })

    if(isSubscribed)
    {
        await Subscription.findByIdAndDelete(isSubscribed?._id);

        return res
            .status(200)
            .json(new ApiResponse(200, {subscribed : false}, "Unsubscribed Successfully"));   
    }

    await Subscription.create({
        subscriber : req.user?._id,
        channel : channelId,
    })

    return res
        .status(200)
        .json(new ApiResponse(200, {subscribed: true}, "Subscribed Successfully"));

});


export {toggleSubscription};