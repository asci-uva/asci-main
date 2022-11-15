import React from "react";
import {useState} from "react";
import { useNavigate } from 'react-router-dom';

function Meeting() {
  // const [title, setTitle] = useState("");
  // const [details, setDetails] = useState("question details");
  // const [purpose, setPurpose] = useState("");
  const navigate = useNavigate();

  const handleLogout = (e) =>{
    e.preventDefault();
    navigate('/home');
  }

  const handleSurvey = (e) =>{
    let confirmaion = prompt("Please type CONFIRM to end meeting");
    if (confirmaion === "CONFIRM") {
      navigate('/TASurvey');
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