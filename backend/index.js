import express from "express";
import dotenv from "dotenv";
dotenv.config();
import {dbConnect} from "./config/dbConnection.js"
import User from "./models/userModel.js"
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js"
import cookieParser from "cookie-parser";
import cors from "cors";
import geminiResponse from "./gemini.js";
const app=express();
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}))
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth",authRouter);
app.use("/api/user",userRouter)
app.get("/", async (req, res) => {
  try {
    const prompt = req.query.prompt;

    if (!prompt) {
      return res.status(400).json({ message: "prompt is required" });
    }

    const data = await geminiResponse(prompt);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      message: "Gemini request failed",
      error: error.response?.data || error.message,
    });
  }
});
const PORT=process.env.PORT

const startServer = async () => {
    try {
        await dbConnect();
        app.listen(PORT, () => {
            console.log(`Server is listening at port number ${PORT}`)
        });
    } catch (error) {
        console.log(`error : ${error.message}`);
        process.exit(1);
    }
};

startServer();
