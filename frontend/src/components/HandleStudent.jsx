import React from "react";
import {useEffect, useState} from "react";
import { useNavigate } from 'react-router-dom';

function HandleStudent() {
  // const [title, setTitle] = useState("question overview");
  // const [details, setDetails] = useState("question details");
  // const [purpose, setPurpose] = useState("");
  const [assign, setAssign] = useState(true)
  const navigate = useNavigate();

  let assignStudent = {
    command: assign
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
        //retrieve the student assigned
        console.log(data);
        if(assign === true){
          navigate('/meeting');
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

  const handleAssign = (e) =>{
    e.preventDefault();
    setAssign(e.target.value)
    json0 = JSON.stringify(assignStudent);
    console.log(json0);
    sendJson(json0,url0);
  }

  return (
    <div className="question">
      <div>
        <h2>You are now handling students</h2>
        <button onClick={handleLogout}>logoff</button>
      </div>
      <div>
        <h2>Assign me a student</h2>
        <button onClick={handleAssign}>find student</button>
      </div>
    </div>
  );
}

export default HandleStudent;