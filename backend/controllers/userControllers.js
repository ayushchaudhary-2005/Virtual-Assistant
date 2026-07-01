import User from "../models/userModel.js";
import uploadOnCloudinary from "../config/cloudinary.js";
import moment from "moment";
import geminiResponse from "../gemini.js";

const getInstantAssistantResult = (command, assistantName) => {
  const cleanedInput = command
    .replace(new RegExp(assistantName, "ig"), "")
    .trim();
  const normalizedInput = cleanedInput.toLowerCase();

  if (normalizedInput.includes("time")) {
    return { type: "get-time", userInput: cleanedInput || command };
  }

  if (normalizedInput.includes("date")) {
    return { type: "get-date", userInput: cleanedInput || command };
  }

  if (normalizedInput.includes("day")) {
    return { type: "get-day", userInput: cleanedInput || command };
  }

  if (normalizedInput.includes("month")) {
    return { type: "get-month", userInput: cleanedInput || command };
  }

  if (normalizedInput.includes("weather")) {
    return {
      type: "weather-show",
      userInput: cleanedInput || "weather",
      response: "Opening the weather for you.",
    };
  }

  if (normalizedInput.includes("instagram")) {
    return {
      type: "instagram-open",
      userInput: cleanedInput || "instagram",
      response: "Opening Instagram.",
    };
  }

  if (normalizedInput.includes("facebook")) {
    return {
      type: "facebook-open",
      userInput: cleanedInput || "facebook",
      response: "Opening Facebook.",
    };
  }

  if (normalizedInput.includes("calculator")) {
    return {
      type: "calculator-open",
      userInput: cleanedInput || "calculator",
      response: "Opening calculator.",
    };
  }

  if (normalizedInput.includes("youtube")) {
    return {
      type: normalizedInput.includes("play") ? "youtube-play" : "youtube-search",
      userInput: cleanedInput.replace(/youtube/gi, "").trim() || "youtube",
      response: normalizedInput.includes("play")
        ? "Playing it on YouTube."
        : "Searching on YouTube.",
    };
  }

  if (normalizedInput.includes("google") || normalizedInput.includes("search")) {
    return {
      type: "google-search",
      userInput: cleanedInput.replace(/google|search/gi, "").trim() || cleanedInput || command,
      response: "Searching that on Google.",
    };
  }

  if (normalizedInput.includes("how are you")) {
    return {
      type: "general",
      userInput: cleanedInput || command,
      response: "I'm doing well. How can I help you?",
    };
  }

  return null;
};

const getFallbackAssistantResult = (command, assistantName) => {
  const instantResult = getInstantAssistantResult(command, assistantName);
  if (instantResult) {
    return instantResult;
  }

  const cleanedInput = command
    .replace(new RegExp(assistantName, "ig"), "")
    .trim();

  return {
    type: "general",
    userInput: cleanedInput || command,
    response: "I heard you. How can I help you?",
  };
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: `Error occured : ${error}` });
  }
};

export default getCurrentUser;


export const updateAssistant = async (req, res) => {
  try {
    const assistantName = req.body?.assistantName?.trim();
    const imageUrl = req.body?.imageUrl?.trim();

    if (!assistantName) {
      return res.status(400).json({ message: "assistantName is required" });
    }

    let assistantImage;

    if (req.file) {
      assistantImage = await uploadOnCloudinary(req.file.path);
    } else if (imageUrl) {
      assistantImage = imageUrl;
    } else {
      return res.status(400).json({ message: "assistantImage is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { assistantName, assistantImage },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res
      .status(400)
      .json({ message: "updateAssistant Error", error: error.message });
  }
};


export const askToAssistant = async (req, res) => {
  try {
    const command = req.body?.command?.trim();
    if (!command) {
      return res.status(400).json({ response: "Command is required" });
    }

    const user = await User.findById(req.userId).select("name assistantName");
    if (!user) {
      return res.status(404).json({ response: "User not found" });
    }

    const userName = user.name;
    const assistantName = user.assistantName || "Assistant";
    const instantResult = getInstantAssistantResult(command, assistantName);

    void User.findByIdAndUpdate(req.userId, {
      $push: {
        history: {
          $each: [command],
          $slice: -50,
        },
      },
    }).catch((error) => {
      console.error("History save failed:", error.message);
    });

    if (instantResult) {
      const type = instantResult.type;
      const userInput = instantResult.userInput || command;
      const response = instantResult.response || "Sorry, I can't understand";

      switch (type) {
        case "get-date":
          return res.json({
            type,
            userInput,
            response: `current date is ${moment().format("YYYY-MM-DD")}`,
          });

        case "get-time":
          return res.json({
            type,
            userInput,
            response: `current time is ${moment().format("hh:mm A")}`,
          });

        case "get-day":
          return res.json({
            type,
            userInput,
            response: `today is ${moment().format("dddd")}`,
          });

        case "get-month":
          return res.json({
            type,
            userInput,
            response: `today is ${moment().format("MMMM")}`,
          });

        default:
          return res.json({
            type,
            userInput,
            response,
          });
      }
    }

    let gemResult;

    try {
      const result = await geminiResponse(command, assistantName, userName);
      const jsonMatch = result.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        gemResult = getFallbackAssistantResult(command, assistantName);
      } else {
        gemResult = JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      gemResult = getFallbackAssistantResult(command, assistantName);
    }

    const type = gemResult.type;
    const userInput = gemResult.userInput || gemResult.userinput || command;
    const response = gemResult.response || "Sorry, I can't understand";

    switch (type) {
      case "get-date":
        return res.json({
          type,
          userInput,
          response: `current date is ${moment().format("YYYY-MM-DD")}`,
        });

      case "get-time":
        return res.json({
          type,
          userInput,
          response: `current time is ${moment().format("hh:mm A")}`,
        });

      case "get-day":
        return res.json({
          type,
          userInput,
          response: `today is ${moment().format("dddd")}`,
        });

      case "get-month":
        return res.json({
          type,
          userInput,
          response: `today is ${moment().format("MMMM")}`,
        });

      case "google-search":
      case "youtube-search":
      case "youtube-play":
      case "general":
      case "calculator-open":
      case "instagram-open":
      case "facebook-open":
      case "weather-show":
        return res.json({
          type,
          userInput,
          response,
        });

      default:
        return res.status(200).json({
          type: "general",
          userInput,
          response,
        });
    }
  } catch (error) {
    return res.status(500).json({
      response: "ask assistant error",
    });
  }
};
