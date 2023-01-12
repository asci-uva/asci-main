import React from "react";
import {useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';

function StudentMeeting() {
  
  const navigate = useNavigate();

  const [taName, setTAName] = useState("TA Name");
  const [taId, setTAId] = useState("TA Id");

  let user = "";
  let token = "";
  
  let url = 'http://localhost:8081/index.php'; 
  
    //This function runs on page load!
    useEffect(() => {
      
      console.log("Getting meeting info");

      //If token is set, kick to home screen to check validity of session
      if (localStorage.getItem('asci-token') !== null) {
        //try to get the user's courses
        user = localStorage.getItem('asci-user');
        token = localStorage.getItem('asci-token');

        //setup json command
        let request = {};
        request.command = "meetingInfo";
        request.user = user;
        request.token = token;
        getMeetingInfo(request, url); 
      }
      else{
        navigate("/login");
      }
      
    }, []);

    //This function grabs the meeting info (TA name, etc.)
    const getMeetingInfo = (json0, url0) =>{
      fetch(url0, {
        method: 'POST', // or 'PUT'
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(json0),
      }).then(response => response.json())
      .then(data => {
          console.log("Data is: ", data);
          
          if(data.success === "true"){

            console.log("Received TA info");
            setTAName(data.taName);
            setTAId(data.taId);
            
          }
          else{
            console.log("Meeting: something went wrong");
            navigate("/error");
          }
        })
        .catch((error) => {
          console.log("JQ: There was an error:", error);
          navigate("/error");
          
        });
  }

  
  const leaveMeeting = (e) =>{
      e.preventDefault();
      //TODO: Add student question
      

      //JOIN THE QUEUE
      let request = {};
      request.command = "leaveMeeting";
      request.user = user;
      request.token = token;
      reqLeaveMeeting(request, url); 

    }

    //This function attempts to leave the queue
    const reqLeaveMeeting = (json0, url0) =>{
      fetch(url0, {
        method: 'POST', // or 'PUT'
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(json0),
      }).then(response => response.json())
      .then(data => {
          console.log("Data is: ", data);
          
          if(data.success === "true"){
            console.log("Left meeting");
            navigate("/joinQueue");
          }
          else{
            console.log("Leaving queue failed");
            navigate("/error");
          }

          
        })
        .catch((error) => {
          navigate("/error");
          
        });
    }

  return (
    <div className="question">
      <div>
        <h1>You are in a meeting with { taName } ( { taId } )</h1>
      </div>
      <div>
        <button onClick={leaveMeeting}>Leave meeting</button>
      </div>
    </div>
  );
}

export default StudentMeeting;