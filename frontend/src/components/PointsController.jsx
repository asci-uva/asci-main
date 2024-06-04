import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Home, QuestCard, QuestList } from "./points";
import {
  Login,
  Error,
  Logout,
  Navigation,
} from "./utils";
import { useUser } from "./context/UserContext";

const PointsController = (props) => {
    const {user} = useUser();
    if (!user.userid) {
        return (
      <Login {...props} />
        )
    }
  return (
    <>
      <Navigation
        documentRoot={props.documentRoot}
        debugMode={props.debugMode}
      />
      <Routes>
        <Route path="/" element={<Home {...props} />} />
        <Route path="login" element={<Login {...props} />} />
        <Route path="error" element={<Error {...props} />} />
        <Route path="logout" element={<Logout {...props} />} />
      </Routes>
    </>
  );
};

export default PointsController;
