import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import {
  Home,
  Question,
  Ta,
  StudentWaitingRoom,
  HandleStudent,
  Meeting,
  TASurvey,
  StudentMeeting,
  JoinQueue,
  StudentSurvey,
  HandleGroup,
} from "./queue";
import {
  Login,
  Error,
  Logout,
  Navigation,
} from "./utils";
import { useUser } from "./context/UserContext";

const QueueController = (props) => {
  const root = "/asci";
  const navigate = useNavigate();
  // If the user is not logged in, redirect to the login page
    
    const {user} = useUser();
    // NOTE TO SELF: Why isn't user being passed here after the router
    // hard Navigates us to this page?  It's a page reload, which may mean
    // that there's a better way to navigate between components, or I'm
    // missing something!
    return (
    <>
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
        <Route path="logout" element={<Logout {...props} />} />
        <Route path="handleGroup" element={<HandleGroup {...props} />} />
      </Routes>
    </>
  );
};

export default QueueController;
