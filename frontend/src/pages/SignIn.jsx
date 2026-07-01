import { useContext, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import authBg from "../assets/authBg.png";
import { useNavigate } from "react-router-dom";
import { userDataContext } from "../context/userDataContext.jsx";
import axios from "axios";

const SignIn = () => {
  const navigate = useNavigate();
  const {serverUrl,setUserData,setSelectedImage,setUploadedImage}=useContext(userDataContext);

  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading,setLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();

    setError("");

    try {
      setLoading(true);
      const result = await axios.post(`${serverUrl}/api/auth/login`,{ email, password },
      {withCredentials: true });
      setUserData(result.data);
      setSelectedImage(result.data.assistantImage || "");
      setUploadedImage("");

      navigate(result.data?.assistantImage && result.data?.assistantName? "/": "/customize");
      setLoading(false);
      setEmail("");
      setPassword("");
    } catch (err) {
      setLoading(false);
      setUserData(null);
      setError(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    }
  };

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center flex items-center justify-center px-4 py-8"
      style={{
        backgroundImage: `url(${authBg})`,
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

      {/* Card */}
      <div className="relative w-full max-w-md rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl px-8 py-10">

        <h1 className="text-center text-3xl font-bold text-white">
          Register to{" "}
          <span className="text-cyan-400">Virtual Assistant</span>
        </h1>

        {/* Error Message */}

        {error && (
          <div className="mt-6 rounded-lg border border-red-500 bg-red-500/20 px-4 py-3 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSignIn}>

          {/* Email */}

          <input
            type="email"
            placeholder="Enter your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-full border border-white/50 bg-transparent px-6 py-3 text-white placeholder-gray-300 outline-none transition duration-300 focus:border-cyan-400"
          />

          {/* Password */}

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-full border border-white/50 bg-transparent px-6 py-3 pr-14 text-white placeholder-gray-300 outline-none transition duration-300 focus:border-cyan-400"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-white"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Button */}

          <button
            type="submit"
            className="w-full rounded-full bg-white py-3 font-semibold text-black transition duration-300 hover:bg-cyan-400 hover:text-white" disabled={loading}
          >
            {loading?"Loading...":"Sign In"}
          </button>
        </form>

        {/* Footer */}

        <p className="mt-8 text-center text-gray-200">
          Want to Sign Up?{" "}
          <span
            onClick={() => navigate("/signup")}
            className="cursor-pointer font-semibold text-cyan-400 hover:underline"
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
