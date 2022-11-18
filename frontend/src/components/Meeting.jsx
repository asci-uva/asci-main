import React from "react";
import {useState} from "react";
import { useNavigate } from 'react-router-dom';

function Meeting() {
  // const [title, setTitle] = useState("");
  // const [details, setDetails] = useState("question details");
  // const [purpose, setPurpose] = useState("");
  const [meetingState, setMeetingState] = useState(false);
  const navigate = useNavigate();

  let endMeeting = {
    command: meetingState
  }

  let json0;
  let url0 = 'http://localhost:8081/';

  const sendJson = (json0, url0) =>{
    fetch(url0, {
      method: 'POST', // or 'PUT'
      headers: {
        'Content-Type': 'application/json',
      },
      body: json0,
    }).then((response) => response.json())
      .then((data) => {
        console.log(data);
        if(meetingState === false){
          navigate('/TAsurvey');
        }
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }
  

  const handleLogout = (e) =>{
    e.preventDefault();
    navigate('/home');
  }

  const handleSurvey = (e) =>{
    let confirmaion = prompt("Please type CONFIRM to end meeting");
    if (confirmaion === "CONFIRM") {
      //navigate('/TASurvey');
      setMeetingState(e.target.value)
      json0 = JSON.stringify(endMeeting);
      console.log(json0);
      sendJson(json0,url0);
    } else {
      document.getElementById("warning").innerHTML ="To end meeting you have to type CONFIRM";
    }
  }

  return (
    <div className="question">
      <div>
        <h2>Emergency meeting</h2>
        <button onClick={handleLogout}>logoff</button>
      </div>
      <div>
        <h5>This is a place holder for student information for the TAs</h5>
      </div>
      <div>
        <h2>End meeting</h2>
        <button onClick={handleSurvey}>End meeting</button>
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