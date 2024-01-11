import React from "react";
import "./index.css";
import ReactDOM from "react-dom/client";

import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import {
  Navigation,
  Footer,
  Home,
  Question,
  Login,
  Ta,
  StudentWaitingRoom,
  HandleStudent,
  Meeting,
  TASurvey,
  StudentMeeting,
  JoinQueue,
  StudentSurvey,
  Error,
  SelectCourse,
  Logout,
  HandleGroup
} from "./components";

//SOME GLOBAL CONSTANTS THAT ARE USED THROUGHOUT THE APP
//const documentRoot = "/asci";
//const url = "https://kytos02.cs.virginia.edu/asci-server/index.php";
const documentRoot = "/ohq/ohq";
const url = "http://localhost:8081/index.php";

const netbadgeEnabled = false; //if false, login page will have you type in a userId to use
const debugMode = true; //if true, login page will have you type in a userId to use

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Router>
    <Navigation documentRoot={documentRoot} debugMode={debugMode} />
    <Routes>
      <Route path={documentRoot + "/"} element={<Home documentRoot={documentRoot} url={url} />} />
      <Route path={documentRoot + "/login"} element={<Login documentRoot={documentRoot} url={url} debugMode={debugMode} />} />
      <Route path={documentRoot + "/question"} element={<Question documentRoot={documentRoot} url={url} />} />
      <Route path={documentRoot + "/ta"} element={<Ta documentRoot={documentRoot} url={url} />} />
      <Route path={documentRoot + "/studentWaitingRoom"} element={<StudentWaitingRoom documentRoot={documentRoot} url={url} />} />
      <Route path={documentRoot + "/handleStudent"} element={<HandleStudent documentRoot={documentRoot} url={url} />} />
      <Route path={documentRoot + "/meeting"} element={<Meeting documentRoot={documentRoot} url={url} />} />
      <Route path={documentRoot + "/taSurvey"} element={<TASurvey documentRoot={documentRoot} url={url} />} />
      <Route path={documentRoot + "/joinQueue"} element={<JoinQueue documentRoot={documentRoot} url={url} groupingEnabled={groupingEnabled} />} />
      <Route path={documentRoot + "/studentMeeting"} element={<StudentMeeting documentRoot={documentRoot} url={url} />} />
      <Route path={documentRoot + "/studentSurvey"} element={<StudentSurvey documentRoot={documentRoot} url={url} />} />
      <Route path={documentRoot + "/error"} element={<Error documentRoot={documentRoot} url={url} />} />
      <Route path={documentRoot + "/selectCourse"} element={<SelectCourse documentRoot={documentRoot} url={url} />} />
      <Route path={documentRoot + "/logout"} element={<Logout documentRoot={documentRoot} url={url} />} />
      <Route path={documentRoot + "/handleGroup"} element={<HandleGroup documentRoot={documentRoot} url={url} />} />
    </Routes>
    <Footer/>
  </Router>,
);


