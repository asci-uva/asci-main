import React from "react";
import "./index.css";
import ReactDOM from "react-dom/client";

import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Footer } from "./components/queue";

import QueueController from "./components/QueueController";
import AdminController from "./components/AdminController";
import HomeController from "./components/HomeController";
import { UserProvider } from "./components/context/UserContext";

//SOME GLOBAL CONSTANTS THAT ARE USED THROUGHOUT THE APP
//const documentRoot = "/asci";
//const url = "https://kytos02.cs.virginia.edu/asci-server/index.php";
const documentRoot = "/ohq/ohq";
const url = "http://localhost:8081/index.php";

const netbadgeEnabled = false; //if false, login page will have you type in a userId to use
const debugMode = true; //if true, login page will have you type in a userId to use

//Some other functions we can turn on and off
const groupingEnabled = true;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <UserProvider>
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
        {/* Use QueueController for all queue related routes */}
        <Route
          path={documentRoot + "/queue/*"}
          element={
            <QueueController
              documentRoot={documentRoot + "/queue"}
              url={url}
              debugMode={debugMode}
            />
          }
        />
        {/* Use AdminController for all admin related routes */}
        <Route
          path={documentRoot + "/admin/*"}
          element={
            <AdminController
              documentRoot={documentRoot + "/admin"}
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
