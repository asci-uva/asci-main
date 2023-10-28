import React from "react";
import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import {
  Home,
  CreateNewCourse,
  Navigation,
  CourseManagement,
  UploadRoster,
  Error,
  EditCourse,
} from "./admin";

import { useUser } from "./context/UserContext";

const AdminController = (props) => {
  // const { user, login } = useUser();
  const root = "/ohq/ohq";
  const navigate = useNavigate();
  // If the user is not logged in, redirect to the login page

  useEffect(() => {
    //need to redo this. check user set and course set first
    if (localStorage.getItem("asci-user") === null) {
      console.log(
        "Try to access admin, But User is NOT set, navigating to home"
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
        <Route
          path="createNewCourse"
          element={<CreateNewCourse {...props} />}
        />
        {/* <Route
          path="courseManagement"
          element={<CourseManagement {...props} />}
        /> */}
        {/* <Route path="uploadRoster" element={<UploadRoster {...props} />} /> */}
        <Route path="error" element={<Error {...props} />} />
        <Route
          path="editCourse/:courseId"
          element={<EditCourse {...props} />}
        />
      </Routes>
    </>
  );
};

export default AdminController;
