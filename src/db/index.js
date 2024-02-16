import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';




const connectDB = async() => {
    try {
       const connectionInstance = await mongoose.connect(`mongodb://${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MongoDB connected !! DB HOST : ${connectionInstance.connection.host}`);

        //console.log("Connection Instance is : ", connectionInstance.connect);
    } catch (error) {
        console.log("MONGODB connection error:: ", error);
        process.exit(1);
    }
}



export default connectDB;