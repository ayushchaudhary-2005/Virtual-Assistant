import jwtTokenGenerator from "../config/jwtTokenGenerator.js";
import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import validator from "validator";


export const signUp = async (req, res) => {
  try {
    const { name, password, email } = req.body || {};
    const trimmedName = name?.trim();
    const normalizedEmail = email?.trim().toLowerCase();

    if (!trimmedName || !normalizedEmail || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (trimmedName.length < 3 || trimmedName.length > 20) {
      return res
        .status(400)
        .json({ message: "Name must be between 3 and 20 characters" });
    }

    if (!validator.isEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email" });
    }

    if (!validator.isStrongPassword(password)) {
      return res.status(400).json({ message: "Password must be strong" });
    }

    const emailExists = await User.findOne({ email: normalizedEmail });
    if (emailExists) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hash = await bcrypt.hash(password, 10);
    await User.create({
      name: trimmedName,
      email: normalizedEmail,
      password: hash,
    });

    const token = await jwtTokenGenerator(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "None",
      secure: true,
    });
    return res.status(201).json(null);
  } catch (err) {
    return res.status(500).json({ message: `SignUp error : ${err.message}` });
  }
};


export const Login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isAllowed = await bcrypt.compare(password, user.password);
    if (!isAllowed) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = await jwtTokenGenerator(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "None",
      secure: true,
    });

    const safeUser = user.toObject();
    delete safeUser.password;

    return res.status(200).json(safeUser);
  } catch (error) {
    return res.status(500).json({ message: `Error occured : ${error.message}` });
  }
};


export const logout = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
    });
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    return res.status(500).json({ message: `Error occured : ${error}` });
  }
};
