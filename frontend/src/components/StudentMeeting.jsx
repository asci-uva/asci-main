import React from "react";
import {useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';

function StudentMeeting() {
  
  const navigate = useNavigate();

  const [taName, setTAName] = useState("TA Name");
  const [taId, setTAId] = useState("TA Id");
  const [sessionId, setSessionId] = useState(null);
  
  
  let url = 'http://localhost:8081/index.php'; 
  
    //This function runs on page load!
    useEffect(() => {
      
    if(localStorage.getItem('asci-user') === null){
      navigate("/login");
    }
    else if(localStorage.getItem('asci-course') === null){
      navigate("/selectCourse");
    }
    else{

      //Get meeting details
      let request = {};
      request.command = "getMeetingDetails";
      request.user = localStorage.getItem('asci-user');
      request.courseId = localStorage.getItem('asci-course');;
      getMeetingInfo(request, url);  
      

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
            setTAName(data.ta.pname + " " + data.ta.lname);
            setTAId(data.ta.computing_id);
            setSessionId(data.session.id);
            
          }
          else{
            console.log("Meeting: request failed for some reason");
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

    if(localStorage.getItem('asci-user') === null){
      navigate("/login");
    }
    else if(localStorage.getItem('asci-course') === null){
      navigate("/selectCourse");
    }
    else if(sessionId === null){
      navigate("/error");
    }
    else{

      let request = {};
      request.command = "leaveMeeting";
      request.user = localStorage.getItem('asci-user');
      request.sessionId = sessionId;
      reqLeaveMeeting(request, url); 
    }

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
        <h4>You are in a meeting with { taName } ( { taId } )</h4>
      </div>
      <div>
        <button onClick={leaveMeeting}>Leave meeting</button>
      </div>
    </div>
  );
}

export default StudentMeeting;