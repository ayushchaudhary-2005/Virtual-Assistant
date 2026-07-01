import mongoose from "mongoose";
const Schema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true
    },
    assistantName:{
        type:String
    },
    assistantImage:{
        type:String
    },
    history:{
        type:[{type:String}],
        default:[]
    }

},{timestamps:true})
const User=mongoose.model("User",Schema);
export default User;
