import { useContext } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

import Card from "../components/Card";
import { userDataContext } from "../context/userDataContext.jsx";

import authBg from "../assets/authBg.png";
import img1 from "../assets/image1.png";
import img2 from "../assets/image2.jpg";
import img3 from "../assets/image4.png";
import img4 from "../assets/image5.png";
import img5 from "../assets/image6.jpeg";
import img6 from "../assets/image7.jpeg";

function Customize() {
  const navigate = useNavigate();

  const {
    selectedImage,
    setSelectedImage,
    uploadedImage,
    setUploadedImage,
  } = useContext(userDataContext);

  const avatars = [authBg, img1, img2, img3, img4, img5, img6];

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      const imageUrl = reader.result;

      if (typeof imageUrl !== "string") return;

      setUploadedImage(imageUrl);
      setSelectedImage(imageUrl);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#08126B] via-[#06072A] to-black flex justify-center items-center px-4 py-8">
      
      {/* Back Arrow */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-50 rounded-full p-2 text-white transition-all duration-300 hover:bg-white/10 hover:scale-110"
      >
        <ArrowLeft size={30} />
      </button>

      <div className="w-full max-w-6xl flex flex-col items-center">
        <h1 className="text-white text-xl sm:text-2xl md:text-4xl font-semibold mb-8 text-center">
          Select your Assistant Image
        </h1>

        <div
          className="
            grid
            grid-cols-2
            sm:grid-cols-3
            md:grid-cols-5
            gap-4
            md:gap-6
            justify-items-center
          "
        >
          {avatars.map((img, index) => (
            <Card
              key={index}
              image={img}
              selected={selectedImage === img}
              onClick={() => setSelectedImage(img)}
            />
          ))}

          {uploadedImage && (
            <Card
              image={uploadedImage}
              selected={selectedImage === uploadedImage}
              onClick={() => setSelectedImage(uploadedImage)}
            />
          )}

          {/* Upload Card */}
          <label
            className="
              w-24 h-36
              sm:w-28 sm:h-40
              md:w-32 md:h-48
              lg:w-36 lg:h-52
              rounded-2xl
              border-[3px]
              border-white
              bg-[#080B38]
              flex
              items-center
              justify-center
              cursor-pointer
              hover:scale-105
              duration-300
              shadow-[0_0_20px_rgba(59,130,246,0.7)]
            "
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16V4m0 0l-4 4m4-4l4 4M5 20h14"
              />
            </svg>
          </label>
        </div>

        {selectedImage && (
          <button
            onClick={() => navigate("/customize2")}
            className="mt-10 px-8 sm:px-10 md:px-14 py-3 rounded-full bg-white text-black font-semibold text-base md:text-lg hover:scale-105 duration-300"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

export default Customize;
