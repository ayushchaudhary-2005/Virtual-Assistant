import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { userDataContext } from "../context/userDataContext.jsx";
import axios from "axios";

function Customize2() {
  const navigate = useNavigate();

  const {
    serverUrl,
    userData,
    setUserData,
    selectedImage,
    setSelectedImage,
    uploadedImage,
    setUploadedImage,
  } = useContext(userDataContext);

  const [assistantName, setAssistantName] = useState(
    userData?.assistantName || ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const showButton = assistantName.trim().length > 0;

  const handleCreateAssistant = async () => {
    const trimmedName = assistantName.trim();

    if (!trimmedName || !selectedImage) return;

    try {
      setLoading(true);
      setError("");

      const formData = new FormData();
      formData.append("assistantName", trimmedName);

      if (
        selectedImage === uploadedImage &&
        uploadedImage.startsWith("data:")
      ) {
        const imageBlob = await fetch(uploadedImage).then((response) =>
          response.blob()
        );

        formData.append(
          "assistantImage",
          imageBlob,
          "assistant-image.png"
        );
      } else {
        formData.append("imageUrl", selectedImage);
      }

      const result = await axios.post(
        `${serverUrl}/api/user/update`,
        formData,
        {
          withCredentials: true,
        }
      );

      console.log(result.data);

      setUserData(result.data);
      setSelectedImage(result.data.assistantImage || "");

      if (
        selectedImage === uploadedImage &&
        uploadedImage.startsWith("data:")
      ) {
        setUploadedImage(result.data.assistantImage || "");
      }

      navigate("/");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to create your assistant"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#110a7b] via-[#08063a] to-black px-4 py-8 sm:px-6">
      {/* Back Button */}
      <button
        onClick={() => navigate("/customize")}
        className="absolute left-4 top-4 z-50 rounded-full p-2 text-white transition-all duration-300 hover:bg-white/10 hover:scale-110 sm:left-6 sm:top-6"
      >
        <ArrowLeft size={30} />
      </button>

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <div className="flex w-full flex-col items-center">
          <h1 className="mb-6 text-center text-2xl font-medium text-white sm:text-3xl md:text-4xl">
            Enter Your Assistant Name
          </h1>

          <input
            type="text"
            value={assistantName}
            onChange={(e) => setAssistantName(e.target.value)}
            placeholder="Type here..."
            className="w-full max-w-[720px] rounded-full border border-white/70 bg-transparent px-5 py-3 text-sm text-white outline-none transition duration-300 placeholder:text-white/40 focus:border-white focus:shadow-[0_0_18px_rgba(255,255,255,0.15)] sm:px-6 sm:py-4 sm:text-base"
          />

          {error && (
            <p className="mt-4 text-center text-sm text-red-300">
              {error}
            </p>
          )}

          {showButton && (
            <button
              onClick={handleCreateAssistant}
              disabled={loading}
              className="mt-8 rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition duration-300 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70 sm:px-10 sm:text-base"
            >
              {loading
                ? "Creating..."
                : "Finally Create Your Assistant"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Customize2;
