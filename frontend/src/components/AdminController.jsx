import React from "react";
import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import {
  Home,
  CreateNewCourse,
  CourseManagement,
  UploadRoster,
  UpdateChat,
  EditCourse,
  SelectQuests,
} from "./admin";
import {
  Login,
  Error,
  Logout,
  Navigation,
} from "./utils";

import CoursePanel from "./admin/CoursePanel";

import { useUser } from "./context/UserContext";

const AdminController = (props) => {
  // const { user, login } = useUser();
  const root = "/asci";
  const navigate = useNavigate();

  return (
    <>
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
        <Route
          path="/coursePanel/:courseId"
          element={<CoursePanel {...props} />}
        />
        <Route
          path="selectQuests"
          element={<SelectQuests {...props} />}
        />
      </Routes>
    </>
  );
};

export default AdminController;
