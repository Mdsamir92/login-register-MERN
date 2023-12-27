const mongoose = require("mongoose")

const MongoUrl = process.env.URL

const connectDb = async () =>{
    try{
        await mongoose.connect(MongoUrl);
        console.log("connect successful")
    } catch(error){
        console.log(error,"connect failed")
    }
}
module.exports = connectDb;

