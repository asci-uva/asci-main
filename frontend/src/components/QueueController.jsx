import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import {
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
  HandleGroup,
  Navigation,
} from "./queue";
import { useUser } from "./context/UserContext";

const QueueController = (props) => {
  const { user, login } = useUser();
  const root = "/ohq/ohq";
  const navigate = useNavigate();
  // If the user is not logged in, redirect to the login page

  useEffect(() => {
    //need to redo this. check user set and course set first
    if (localStorage.getItem("asci-user") === null) {
      console.log(
        "Try to access queue, But User is NOT set, navigating to home"
      );
      navigate(root + "/login");
    }
  }, []);
  return (
    <>
      <Navigation
        documentRoot={props.documentRoot}
        debugMode={props.debugMode}
      />
      <Routes>
        <Route path="/" element={<Home {...props} />} />
        <Route path="login" element={<Login {...props} />} />
        <Route path="question" element={<Question {...props} />} />
        <Route path="error" element={<Error {...props} />} />
        <Route path="ta" element={<Ta {...props} />} />
        <Route
          path="studentWaitingRoom"
          element={<StudentWaitingRoom {...props} />}
        />
        <Route path="handleStudent" element={<HandleStudent {...props} />} />
        <Route path="meeting" element={<Meeting {...props} />} />
        <Route path="taSurvey" element={<TASurvey {...props} />} />
        <Route path="studentMeeting" element={<StudentMeeting {...props} />} />
        <Route path="joinQueue" element={<JoinQueue {...props} />} />
        <Route path="studentSurvey" element={<StudentSurvey {...props} />} />
        <Route path="selectCourse" element={<SelectCourse {...props} />} />
        <Route path="logout" element={<Logout {...props} />} />
        <Route path="handleGroup" element={<HandleGroup {...props} />} />
      </Routes>
    </>
  );
};

export default QueueController;
