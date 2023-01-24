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
  Logout
} from "./components";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Router>
    <Navigation />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/question" element={<Question />} />
      <Route path="/ta" element={<Ta />} />
      <Route path="/studentWaitingRoom" element={<StudentWaitingRoom />} />
      <Route path="/handleStudent" element={<HandleStudent />} />
      <Route path="/meeting" element={<Meeting />} />
      <Route path="/TASurvey" element={<TASurvey />} />
      <Route path="/joinQueue" element={<JoinQueue />} />
      <Route path="/studentMeeting" element={<StudentMeeting />} />
      <Route path="/studentSurvey" element={<StudentSurvey />} />
      <Route path="/error" element={<Error />} />
      <Route path="/selectCourse" element={<SelectCourse />} />
      <Route path="/logout" element={<Logout />} />
    </Routes>
    <Footer/>
  </Router>,
);


