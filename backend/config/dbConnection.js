import mongoose from "mongoose";

export const dbConnect = async() => {
  try {
    await mongoose.connect(process.env.DB_CONNECTION_STRING);
    console.log(`Connected`)
  } catch (error) {
    throw new Error(error.message);
  }
}
