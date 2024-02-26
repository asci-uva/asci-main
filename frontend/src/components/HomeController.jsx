import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Home, Login, Error, Navigation, Logout, Cards } from "./home";

const HomeController = (props) => {
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
      <Cards
        documentRoot={props.documentRoot}
        debugMode={props.debugMode}
      />
    </>
  );
};

export default HomeController;
