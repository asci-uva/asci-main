import React from "react";
import {useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';

function Meeting() {

  let user = "";
  let token = "";

  let url = 'http://localhost:8081/';
  
  const [studentName, setStudentName] = useState("LOADING");
  const [studentId, setStudentId] = useState("LOADING");

  const navigate = useNavigate();

  useEffect(() => {

    //Ping the server and make sure this person is actually a TA
    console.log("TA: Checking if token exists");
    
    //If token is set, kick to home screen to check validity of session
    if (localStorage.getItem('asci-token') !== null) {
      //try to get the user's courses
      user = localStorage.getItem('asci-user');
      token = localStorage.getItem('asci-token');

      //Get meeting details
      let request = {};
      request.command = "getTAMeetingDetails";
      request.user = user;
      request.token = token;
      getMeetingDetails(request, url);  
    }
    else{
      navigate("/login");
    }
    
    
  }, []);

  //This gets the meeting details and displays them
  const getMeetingDetails = (json0, url0) =>{
    fetch(url0, {
      method: 'POST', // or 'PUT'
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(json0),
    }).then(response => response.json())
    .then(data => {
        console.log("Data is: ", data);

        /* If user is somehow not logged in, kick to home page */
        if(data.loggedIn !== "true"){
          navigate("/");
        }
        else{

          //if request succeeded
          if(data.success === "true"){
            setStudentName(data.student.name);
            setStudentId(data.student.userid);
          }
          else{
            console.log("Meeting details failed for some reason");
            navigate("/");
          }
        }
      })
      .catch((error) => {
        console.log("HOME: There was an error:", error);
        navigate("/error");
        
      });

    }

  
  const handleLogout = (e) =>{
    e.preventDefault();
    localStorage.clear();
    navigate('/');
  }

  const handleEndMeeting = (e) =>{
    //End the meeting
    let request = {};
    request.command = "TAEndMeeting";
    request.user = user;
    request.token = token;
    endMeeting(request, url);
  }

  //ends meeting
  const endMeeting = (json0, url0) =>{
    fetch(url0, {
      method: 'POST', // or 'PUT'
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(json0),
    }).then(response => response.json())
    .then(data => {
        console.log("Data is: ", data);

        /* If user is somehow not logged in, kick to home page */
        if(data.loggedIn !== "true"){
          navigate("/");
        }
        else{

          //if request succeeded
          if(data.success === "true"){
            navigate("/handleStudent");
          }
          else{
            console.log("Ending meeting failed");
            navigate("/");
          }
        }
      })
      .catch((error) => {
        console.log("HOME: There was an error:", error);
        navigate("/error");
        
      });

    }

  return (
    <div className="question">
      <div>
        <h2>You are in a meeting with a student</h2>
        <button onClick={handleLogout}>logoff</button>
      </div>
      <div>
        <h5>You are currently helping {studentName} ({studentId})</h5>
      </div>
      <div>
        <h2>Ready to end the meeting?</h2>
        <button onClick={handleEndMeeting}>End meeting</button>
        <p style={{   
          fontSize: '15px',
          padding: '20px',
          color: 'red',
        }} id="warning"></p>
      </div>
    </div>
  );
}

export default Meeting;