import React, { useState, useContext } from "react";
import { Routes, Route } from "react-router-dom";
import QueueController from "./QueueController";
import ChatController from "./ChatController";
import AdminController from "./AdminController";
import PointsController from "./PointsController";
import StatsController from "./StatsController";
import ExternalToolsController from "./ExternalToolsController";
import SystemAdmin from "./SystemAdmin";
import { Home, Cards } from "./home";
import { Login, Error, Navigation, Logout, SelectCourseHome } from "./utils";
import { useUser } from "./context/UserContext";

const HomeController = (props) => {

  const { user, course } = useUser();
  if (!user.userid) {
    return (
      <Login {...props} />
    )
  }
  if (!course) {
    return (
      <SelectCourseHome {...props} />
    )
  }

  return (
    <>
      <Navigation
        documentRoot={props.documentRoot}
        debugMode={props.debugMode}
      />
      <div className="container-fluid">
        <Routes>
          <Route path="/" element={<Home {...props} />} />
          <Route path="changeCourse" element={<SelectCourseHome {...props} />} />
          <Route path="login" element={<Login {...props} />} />
          <Route path="error" element={<Error {...props} />} />
          <Route path="logout" element={<Logout {...props} />} />
          {/* Use QueueController for all queue related routes */}
          <Route
            path={"queue/*"}
            element={
              <QueueController
                documentRoot={props.documentRoot + "/queue"}
                url={props.url}
                debugMode={props.debugMode}
              />
            }
          />
          {/* Use ChatController for chat related routes */}
          <Route
            path={"chat/*"}
            element={
              <ChatController
                documentRoot={props.documentRoot + "/chat"}
                url={props.url}
                debugMode={props.debugMode}
              />
            }
          />
          {/* Use AdminController for all admin related routes */}
          <Route
            path={"admin/*"}
            element={
              <AdminController
                documentRoot={props.documentRoot + "/admin"}
                url={props.url}
                uploadurl={props.uploadurl}
                debugMode={props.debugMode}
              />
            }
          />
          {/* Use StatsController for all stats related routes */}
          <Route
            path={"stats/*"}
            element={
              <StatsController
                documentRoot={props.documentRoot + "/stats"}
                url={props.url}
                debugMode={props.debugMode}
              />
            }
          />
          {/* Use PointsController for all points related routes */}
          <Route
            path={"points/*"}
            element={
              <PointsController
                documentRoot={props.documentRoot + "/points"}
                url={props.url}
                debugMode={props.debugMode}
              />
            }
          />
          <Route
            path={"external-tools/*"}
            element={
              <ExternalToolsController
                documentRoot={props.documentRoot + "/external-tools"}
                url={props.url}
                debugMode={props.debugMode}
              />
            }
          />
        </Routes>
      </div>
    </>
  );
};

export default HomeController;
