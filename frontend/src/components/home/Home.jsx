import React from "react";
//import {useState, useEffect} from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Cards from "./Cards";

//This page needs to:
//See if student is logged in and kick to login page if not
//If, logged in, reset student info and kick to dashboard

function Home(props) {
  const navigate = useNavigate();

  let docRoot = props.documentRoot;
  let url = props.url;
  const [user, setUser] = useState(null);

  //This function runs on page load!
  useEffect(() => {
    console.log("ENTERING HOME");
    //need to redo this. check user set and course set first
    if (localStorage.getItem("asci-user") === null) {
      console.log("User is NOT set, navigating home");
      navigate(docRoot + "/login");
    } else {
      setUser(localStorage.getItem("asci-user"));
    }
  }, []);

  return (
    <div className="question">
      <div>
        <h2>Welcome {user}</h2>
      </div>
      <br></br>
      <Cards
        documentRoot={props.documentRoot}
        debugMode={props.debugMode}
      />
    </div>
  );
}

export default Home;
