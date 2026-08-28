import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import QuestList from "./QuestList";
import { useUser } from "../context/UserContext";

//This page needs to:
//See if student is logged in and kick to login page if not
//If, logged in, reset student info and kick to dashboard

function Home(props) {
  const navigate = useNavigate();

  let docRoot = props.documentRoot;
  let url = props.url;
  const {user, course} = useUser();

  //This function runs on page load!
  useEffect(() => {
    console.log("ENTERING HOME");
    //need to redo this. check user set and course set first
    if (!user) {
      console.log("User is NOT set, navigating home");
      navigate(docRoot + "/../login");
    } 
  }, []);
  
  return (
    <div>
      <QuestList
        documentRoot={props.documentRoot}
        debugMode={props.debugMode}
        url={props.url}
      />
    </div>
  );
}

export default Home;
