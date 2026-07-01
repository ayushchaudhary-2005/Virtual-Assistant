import { useContext, useState,useEffect ,useRef} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { userDataContext } from "../context/userDataContext.jsx";
import aiImg from "../assets/ai.gif";
import userImg from "../assets/user.gif";
function Home() {
  const navigate = useNavigate();
  const {
    serverUrl,
    userData,
    setUserData,
    selectedImage,
    setSelectedImage,
    setUploadedImage,
    getGeminiResponse
  } = useContext(userDataContext);
  const HISTORY_STORAGE_KEY = `assistant-history-${
    userData?._id || userData?.email || userData?.assistantName || "guest"
  }`;
  const [userText, setUserText] = useState("");
  const [aiText, setAiText] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [isAssistantTabReady, setIsAssistantTabReady] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);
  const [speechSupported, setSpeechSupported] = useState(true);
  const isSpeakingRef = useRef(false);
  const isProcessingCommandRef = useRef(false);
  const silenceTimeoutRef = useRef(null);
  const restartTimeoutRef = useRef(null);
  const lastProcessedTranscriptRef = useRef("");
  const transcriptBufferRef = useRef("");
  const getGeminiResponseRef = useRef(getGeminiResponse);
  const recognitionRef = useRef(null);
  const assistantTabRef = useRef(null);
  const menuRef = useRef(null);
  const historySyncKeyRef = useRef("");
  const synth=window.speechSynthesis;

  useEffect(() => {
    getGeminiResponseRef.current = getGeminiResponse;
  }, [getGeminiResponse]);

  const addHistoryEntry = (spokenText, assistantReply) => {
    if (!spokenText && !assistantReply) return;

    setCommandHistory((prevHistory) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        spokenText,
        assistantReply,
        createdAt: new Date().toISOString(),
      },
      ...prevHistory,
    ]);
  };

  const armAssistantTab = () => {
    if (assistantTabRef.current && !assistantTabRef.current.closed) {
      assistantTabRef.current.focus();
      setIsAssistantTabReady(true);
      return;
    }

    const assistantTab = window.open("", "_blank", "noopener,noreferrer");
    if (!assistantTab) {
      setIsAssistantTabReady(false);
      return;
    }

    assistantTab.document.title = "Assistant Tab";
    assistantTab.document.body.innerHTML =
      "<div style='font-family:sans-serif;padding:24px;line-height:1.5'>Assistant tab is ready. Your voice commands will open here.</div>";

    assistantTabRef.current = assistantTab;
    setIsAssistantTabReady(true);
    window.focus();
  };

  const openUrl = (url, target = "_blank") => {
    if (assistantTabRef.current && !assistantTabRef.current.closed) {
      assistantTabRef.current.location.href = url;
      assistantTabRef.current.focus();
      setIsAssistantTabReady(true);
      return;
    }

    const newWindow = window.open(url, target, "noopener,noreferrer");
    if (newWindow) {
      assistantTabRef.current = newWindow;
      setIsAssistantTabReady(true);
      return;
    }

    setIsAssistantTabReady(false);

    // Speech-recognition callbacks are not always treated as direct user actions,
    // so browsers may block popup tabs. Fall back to same-tab navigation.
    if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
      window.location.href = url;
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await axios.get(`${serverUrl}/api/auth/logout`, {
        withCredentials: true,
      });
      setUserData(null);
      setSelectedImage("");
      setUploadedImage("");
      localStorage.removeItem("selectedImage");
      localStorage.removeItem("uploadedImage");
      navigate("/signin");
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      historySyncKeyRef.current = HISTORY_STORAGE_KEY;
      setCommandHistory(savedHistory ? JSON.parse(savedHistory) : []);
    } catch (error) {
      console.error("Unable to read assistant history:", error);
      historySyncKeyRef.current = HISTORY_STORAGE_KEY;
      setCommandHistory([]);
    }
  }, [HISTORY_STORAGE_KEY]);

  useEffect(() => {
    if (historySyncKeyRef.current !== HISTORY_STORAGE_KEY) return;
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(commandHistory));
  }, [HISTORY_STORAGE_KEY, commandHistory]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCommand = (data) => {
      if (!data) return;

      const { type, userInput, response } = data;
      speak(response);

      if (type === "google-search") {
        const query = encodeURIComponent(userInput);
        openUrl(`https://www.google.com/search?q=${query}`, "_blank");
      }

      if (type === "calculator-open") {
        openUrl("https://www.google.com/search?q=calculator", "_blank");
      }
      if (type === "instagram-open") {
        openUrl("https://www.instagram.com/", "_blank");
      }

      if (type === "facebook-open") {
        openUrl("https://www.facebook.com/", "_blank");
      }

      if (type === "weather-show") {
        openUrl("https://www.google.com/search?q=weather", "_blank");
      }
      
      if (type === "youtube-search" || type === "youtube-play") {
        const query = encodeURIComponent(userInput);
        openUrl(`https://www.youtube.com/results?search_query=${query}`, "_blank");
      }
    };
    const startRecognition = () => {
    try {
      recognitionRef.current?.start();
      setListening(true);
    } 
    catch (error) {
      if (!error.message.includes("start")) {
        console.error("Recognition error:", error);
      }
  }
 };


  
  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    isSpeakingRef.current = true;
    

    utterance.onend = () => {
      setAiText("");
      isSpeakingRef.current = false;
      lastProcessedTranscriptRef.current = "";
      startRecognition();
    };
    synth.speak(utterance);
};


  useEffect(() => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    setSpeechSupported(false);
    setListening(false);
    return undefined;
  }

  setSpeechSupported(true);
  const recognition = new SpeechRecognition();


  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.lang = "en-US";
  recognitionRef.current=recognition;
  const isRecognizingRef={current:false}

  const safeRecognition = () => {
  if (!isSpeakingRef.current && !isRecognizingRef.current && !isProcessingCommandRef.current) {
    try {
      recognition.start();
      console.log("Recognition requested to start");
    } catch (err) {
      if (err.name !== "InvalidStateError") {
        console.error("Start error:", err);
      }
    }
  }
};

  const scheduleRecognitionRestart = (delay = 250) => {
    clearTimeout(restartTimeoutRef.current);

    restartTimeoutRef.current = setTimeout(() => {
      safeRecognition();
    }, delay);
  };

  const triggerAssistant = async (rawTranscript) => {
    const transcript = rawTranscript.trim();

    if (!transcript) return;
    if (isProcessingCommandRef.current) return;
    if (lastProcessedTranscriptRef.current === transcript) return;

    lastProcessedTranscriptRef.current = transcript;
    isProcessingCommandRef.current = true;
    clearTimeout(silenceTimeoutRef.current);
    setAiText("");
    setUserText(transcript);
    transcriptBufferRef.current = "";

    if (isRecognizingRef.current) {
      recognition.stop();
    }

    try {
      const data = await getGeminiResponseRef.current(transcript);
      console.log(data);
      addHistoryEntry(transcript, data?.response || "");
      handleCommand(data);
      setAiText(data?.response || "");
      setUserText("");
    } finally {
      isProcessingCommandRef.current = false;

      if (!isSpeakingRef.current) {
        scheduleRecognitionRestart();
      }
    }
  };


 recognition.onstart = () => {
    console.log("Recognition started");
    isRecognizingRef.current = true;
    setListening(true);
  };

  recognition.onend = () => {
    console.log("Recognition ended");
    isRecognizingRef.current = false;
    setListening(false);

    scheduleRecognitionRestart(300);
  };
  

  recognition.onerror = (event) => {
    console.warn("Recognition error:", event.error);
    isRecognizingRef.current = false;
    setListening(false);

    if (event.error !== "aborted" && !isSpeakingRef.current) {
      scheduleRecognitionRestart(600);
    }
  };

  recognition.onresult = async (e) => {
    const transcript = Array.from(e.results)
      .map((result) => result?.[0]?.transcript || "")
      .join(" ")
      .trim();

    if (!transcript) return;

    console.log("heard : " + transcript);
    transcriptBufferRef.current = transcript;
    setUserText(transcript);
    clearTimeout(silenceTimeoutRef.current);

    silenceTimeoutRef.current = setTimeout(() => {
      triggerAssistant(transcriptBufferRef.current);
    }, 3000);
  };

  safeRecognition();

  return () => {
    clearTimeout(silenceTimeoutRef.current);
    clearTimeout(restartTimeoutRef.current);
    recognition.stop();
    setListening(false);
    isRecognizingRef.current = false;
  };

}, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#110a7b] via-[#08063a] to-black px-4 py-6 sm:px-6">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col">
        <div className="flex justify-end">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="Open assistant menu"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg transition duration-300 hover:scale-105"
            >
              <span className="flex flex-col gap-1.5">
                <span className="block h-0.5 w-6 rounded-full bg-black" />
                <span className="block h-0.5 w-6 rounded-full bg-black" />
                <span className="block h-0.5 w-6 rounded-full bg-black" />
              </span>
            </button>

            <div
              className={`absolute right-0 top-16 z-20 w-[280px] max-w-[calc(100vw-2rem)] rounded-3xl border border-white/20 bg-white/95 p-4 shadow-2xl backdrop-blur transition-all duration-300 ${
                isMenuOpen
                  ? "pointer-events-auto translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-2 opacity-0"
              }`}
            >
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsHistoryOpen(true);
                  }}
                  className="rounded-full bg-[#110a7b] px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:scale-[1.02] sm:text-base"
                >
                  History
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                  disabled={loading}
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black ring-1 ring-black/10 transition duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 sm:text-base"
                >
                  {loading ? "Logging Out..." : "Log Out"}
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    armAssistantTab();
                  }}
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black ring-1 ring-black/10 transition duration-300 hover:scale-[1.02] sm:text-base"
                >
                  {isAssistantTabReady ? "Assistant Tab Ready" : "Enable New Tab Opening"}
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate("/customize");
                  }}
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black ring-1 ring-black/10 transition duration-300 hover:scale-[1.02] sm:text-base"
                >
                  Customize your Assistant
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="h-72 w-56 overflow-hidden rounded-sm bg-[#0d0d0d] shadow-[0_0_30px_rgba(0,0,0,0.35)] sm:h-80 sm:w-64 md:h-[420px] md:w-[300px]">
              <img
                src={selectedImage}
                alt={userData?.assistantName || "Assistant"}
                className="h-full w-full object-cover"
              />
            </div>

            <p className="mt-5 text-center text-xl font-medium text-white sm:text-2xl">
              I&apos;m {userData?.assistantName}
            </p>
            {!speechSupported && (
              <p className="mt-3 text-center text-sm text-red-200">
                Voice recognition is not supported in this browser.
              </p>
            )}
            {!aiText && (<img src={userImg} alt="" className="w-[200px]"/>)}
            {aiText && (<img src={aiImg} alt="" className="w-[200px]"/>)}
            <h1 className='text-white text-[18px] font-bold text-wrap'>{userText ? userText : aiText ? aiText : null}</h1>
          </div>
        </div>
      </div>

      {isHistoryOpen && (
        <div className="fixed inset-0 z-30 flex justify-end bg-black/50 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-md flex-col bg-[#050326] p-5 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <div>
                <h2 className="text-xl font-semibold">History</h2>
                <p className="text-sm text-white/70">
                  Aapke bole hue commands aur assistant replies
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition duration-300 hover:scale-105"
              >
                Close
              </button>
            </div>

            <div className="mt-5 flex-1 overflow-y-auto pr-1">
              {commandHistory.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 px-4 py-6 text-center text-sm text-white/75">
                  Abhi tak koi history save nahi hui hai.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {commandHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-3xl border border-white/10 bg-white/10 p-4 shadow-lg"
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                        {new Date(entry.createdAt).toLocaleString()}
                      </p>
                      <p className="mt-3 text-sm font-semibold text-white/75">
                        You said
                      </p>
                      <p className="mt-1 text-base text-white">
                        {entry.spokenText || "No command captured"}
                      </p>
                      <p className="mt-4 text-sm font-semibold text-white/75">
                        Assistant replied
                      </p>
                      <p className="mt-1 text-base text-white">
                        {entry.assistantReply || "No reply captured"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
