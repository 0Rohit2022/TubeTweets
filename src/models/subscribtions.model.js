import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    subscriber : 
    {
        type: mongoose.Schema.Types.ObjectId,//One who is subscribed to the channel like user
        ref: "User"
    },
    channel : 
    {
        type: mongoose.Schema.Types.ObjectId,//one to whom subscribing
        ref : "User"
    }
}, {timestamps: true});


export const Subscription = mongoose.model("Subscription", subscriptionSchema);