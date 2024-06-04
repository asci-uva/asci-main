import logo from "./logo.svg";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Footer } from "./components/utils";

import HomeController from "./components/HomeController";
import { UserProvider } from "./components/context/UserContext";
import { ToastContainer } from "react-toastify";


function App() {

//SOME GLOBAL CONSTANTS THAT ARE USED THROUGHOUT THE APP
const documentRoot = "/asci";
//const url = "https://kytos02.cs.virginia.edu/asci-server/index.php";
// const documentRoot = "/ohq/ohq";
const url = "http://localhost:8081/index.php";

const netbadgeEnabled = false; //if false, login page will have you type in a userId to use
const debugMode = true; //if true, login page will have you type in a userId to use
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
              debugMode={debugMode}
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
