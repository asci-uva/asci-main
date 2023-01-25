import React from "react";
import {useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';

function Meeting(props) {

  let url = props.url;
  let docRoot = props.documentRoot;

  const [studentName, setStudentName] = useState("LOADING");
  const [studentId, setStudentId] = useState("LOADING");
  const [sessionId, setSessionId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {

    if(localStorage.getItem('asci-user') === null){
      navigate(docRoot + "/login");
    }
    else if(localStorage.getItem('asci-course') === null){
      navigate(docRoot + "/selectCourse");
    }
    else{
      
      //Get meeting details
      let request = {};
      request.command = "getTAMeetingDetails";
      request.user = localStorage.getItem('asci-user');
      request.courseId = localStorage.getItem('asci-course');
      getMeetingDetails(request, url);  
      

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

        //if request succeeded
        if(data.success === "true"){
          setStudentName(data.student.pname + " " + data.student.lname);
          setStudentId(data.student.computing_id);
          setSessionId(data.session.id);
        }
        else{
          console.log("Fetching meeting details failed for some reason");
          navigate(docRoot + "/error");
        }
        
      })
      .catch((error) => {
        console.log("HOME: There was an error:", error);
        navigate(docRoot + "/error");
        
      });

    }

  
  const handleLogout = (e) =>{
    e.preventDefault();
    localStorage.clear();
    navigate(docRoot + '/');
  }

  const handleEndMeeting = (e) =>{
    if(localStorage.getItem('asci-user') === null){
      navigate(docRoot + "/login");
    }
    else if(localStorage.getItem('asci-course') === null){
      navigate(docRoot + "/selectCourse");
    }
    else if(sessionId === null){
      navigate(docRoot + "/error");
    }
    else{
      //End the meeting
      let request = {};
      request.command = "TAEndMeeting";
      request.user = localStorage.getItem('asci-user');
      request.sessionId = sessionId;
      
      endMeeting(request, url);
    }
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

        //if request succeeded
        if(data.success === "true"){
          navigate(docRoot + "/handleStudent");
        }
        else{
          console.log("Ending meeting failed");
          navigate(docRoot + "/error");
        }
        
      })
      .catch((error) => {
        console.log("HOME: There was an error:", error);
        navigate(docRoot + "/error");
        
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