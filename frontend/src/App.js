import logo from "./logo.svg";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Footer } from "./components/utils";

import HomeController from "./components/HomeController";
import { UserProvider } from "./components/context/UserContext";
import { ToastContainer } from "react-toastify";


function App() {

//SOME GLOBAL CONSTANTS THAT ARE USED THROUGHOUT THE APP
const documentRoot = "/asci";
// REACT_APP_BACKEND_URL is set at build time (empty string on Heroku = same-origin).
// For local dev create a .env file with: REACT_APP_BACKEND_URL=http://localhost:8081
const backendBase = process.env.REACT_APP_BACKEND_URL || "http://localhost:8081";
const url = backendBase + "/index.php";
const uploadurl = backendBase + "/fileupload.php";

const netbadgeEnabled = false; //if false, login page will have you type in a userId to use
const debugMode = true; //if true, login page will have you type in a userId to use
const passwordAuth = true; //if true, will use password authentication 
  return (
  <UserProvider>
    <ToastContainer />
    <Router>
      <Routes>
        <Route
          path={documentRoot + "/*"}
          element={
            <HomeController
              documentRoot={documentRoot}
              url={url}
              uploadurl={uploadurl}
              debugMode={debugMode}
              passwordAuth={passwordAuth}
            />
          }
        />
      </Routes>
      <Footer />
    </Router>
  </UserProvider>
  );
}

export default App;
