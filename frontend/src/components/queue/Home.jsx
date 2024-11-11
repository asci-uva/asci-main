import React from "react";
//import {useState, useEffect} from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

//This page needs to:
//See if student is logged in and kick to login page if not
//If, logged in, reset student info and kick to appropriate state page
//join queue if not on queue
//waiting if waiting on queue
//with TA if being helped
//

function Home(props) {
  const navigate = useNavigate();
  const { user, course } = useUser();

  let docRoot = props.documentRoot;
  let url = props.url;

  //This function runs on page load!
  useEffect(() => {
    console.log("ENTERING HOME");

    //Ok, ping the session and send the user to the proper
    //page based on their status

    console.log("All is fine, pinging session");
    console.log("user, " + user.userid);
    console.log("courseId, " + course);

    //setup json command
    let request = {};
    request.command = "sessionPing";
    request.user = user.userid;
    request.courseId = course;
    checkSession(request, url);
  }, []);

  //This function checks the users session
  const checkSession = (json0, url0) => {
    fetch(url0, {
      method: "POST", // or 'PUT'
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(json0),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Data is: ", data);
        let success = data.success;
        if (success === "true") {
          console.log("HOME: Received session, routing to correct page");

          routeToCorrectPage(data);
        } else {
          console.log("HOME: Server returned error");
          navigate(docRoot + "/error");
        }
      })
      .catch((error) => {
        console.log("HOME: There was an error:", error);
        navigate(docRoot + "/error");
      });
  };

  //This function routes them to correct page
  function routeToCorrectPage(data) {
    let role = data.usercourse.role;
    let status = "none";
    if (data.session !== null) {
      status = data.session.status;
    }

    console.log("HOME: role is: " + role);
    console.log("HOME: status is: " + status);

    if (role === "student") {
      //based on queuestate, send to correct page
      if (status === "none") {
        console.log("Navigating to join queue");
        navigate(docRoot + "/joinQueue");
      } else if (status === "waiting" || status === "grouping") {
        navigate(docRoot + "/studentWaitingRoom");
      } else if (status === "in_progress") {
        navigate(docRoot + "/studentMeeting");
      }
    } else if (role === "ta" || role === "instructor") {
      if (status === "none") {
        navigate(docRoot + "/handleStudent");
      } else if (status === "in_progress") {
        navigate(docRoot + "/meeting");
      } else if (status === "grouping") {
        navigate(docRoot + "/handleGroup");
      }
    } else {
      //kick to login page
      console.log(
        "HOME: Something went wrong, role is not student or ta or a instructor"
      );
      navigate(docRoot + "/error");
    }
  }

  return <div className="question"></div>;
}

export default Home;
