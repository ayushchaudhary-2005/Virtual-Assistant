import { useContext } from "react";
import SignUp from "./pages/SignUp.jsx";
import SignIn from "./pages/SignIn.jsx";
import Home from "./pages/Home.jsx";
import Customize from "./pages/Customize.jsx";
import { Navigate, Route, Routes } from "react-router-dom";
import Customize2 from "./pages/Customize2.jsx";
import { userDataContext } from "./context/userDataContext.jsx";
function App() {
  const { userData, selectedImage, isAuthLoading } = useContext(userDataContext);

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08063a] text-white">
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          userData?.assistantImage && userData?.assistantName ? (
            <Home />
          ) : (
            <Navigate to="/customize" />
          )
        }
      />
      <Route
        path="/signin"
        element={!userData ? <SignIn /> : <Navigate to="/" />}
      />
      <Route
        path="/signup"
        element={!userData ? <SignUp /> : <Navigate to="/" />}
      />
      <Route
        path="/customize"
        element={userData ? <Customize /> : <Navigate to="/signup" />}
      />
      <Route
        path="/customize2"
        element={userData ? <Customize2 /> : <Navigate to="/signup" />}
      />
    </Routes>
  );
}

export default App;
