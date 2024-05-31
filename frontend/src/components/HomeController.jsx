import React, { useState, useContext } from "react";
import { Routes, Route } from "react-router-dom";
import { Home, Login, Error, Navigation, Logout, Cards } from "./home";
import { UserProvider,UserContext,useUser } from "./context/UserContext";
const HomeController = (props) => {

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
      <div className="container">
      <Routes>
        <Route path="/" element={<Home {...props} />} />
        <Route path="login" element={<Login {...props} />} />
        <Route path="error" element={<Error {...props} />} />
        <Route path="logout" element={<Logout {...props} />} />
      </Routes>
            </div>
    </>
  );
};

export default HomeController;
