import { useEffect, useState } from "react";
import axios from "axios";
import { userDataContext } from "./userDataContext.jsx";

const UserContext = ({ children }) => {
  const serverUrl = "https://virtual-assistant-backend-nmp3.onrender.com";
  const [userData, setUserData] = useState(null);
  const [selectedImage, setSelectedImage] = useState(
    localStorage.getItem("selectedImage") || ""
  );
  const [uploadedImage, setUploadedImage] = useState(
    localStorage.getItem("uploadedImage") || ""
  );
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const getGeminiResponse = async (command) => {
        try {
            const result = await axios.post(`${serverUrl}/api/user/asktoassistant`,{command},
      { withCredentials: true, timeout: 15000 });
      return result.data;
        }
        catch (error) {
            console.log(error);
            return {
              type: "general",
              userInput: command,
              response: "I'm having trouble right now. Please try again.",
            };
        }
    };

  useEffect(() => {
    let isMounted = true;

    const fetchCurrentUser = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/user/current`, {
          withCredentials: true,
        });

        if (!isMounted) return;

        setUserData(result.data);

        if (result.data?.assistantImage) {
          setSelectedImage(result.data.assistantImage);
        }
      } catch (error) {
        if (isMounted) {
          setUserData(null);
        }
        console.log(error);
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    fetchCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [serverUrl]);

  useEffect(() => {
    localStorage.setItem("selectedImage", selectedImage);
  }, [selectedImage]);

  useEffect(() => {
    localStorage.setItem("uploadedImage", uploadedImage);
  }, [uploadedImage]);

  const value = {
    serverUrl,
    userData,
    setUserData,
    selectedImage,
    setSelectedImage,
    uploadedImage,
    setUploadedImage,
    isAuthLoading,
    getGeminiResponse
  };

  return (
    <userDataContext.Provider value={value}>
      {children}
    </userDataContext.Provider>
  );
};

export default UserContext;
