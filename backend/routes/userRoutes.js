import express from "express";
import isAuth from "../middlewares/isAuth.js";

import getCurrentUser, { askToAssistant } from "../controllers/userControllers.js";
import upload from "../middlewares/multer.js";
import { updateAssistant } from "../controllers/userControllers.js";

const userRouter=express.Router();

userRouter.get("/current",isAuth,getCurrentUser);
userRouter.post("/update",isAuth,upload.single("assistantImage"),updateAssistant);
userRouter.post("/asktoassistant",isAuth,askToAssistant);
 export default userRouter;