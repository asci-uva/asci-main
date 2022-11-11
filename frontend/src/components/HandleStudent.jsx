import React from "react";
import {useState} from "react";
import { useNavigate } from 'react-router-dom';

function HandleStudent() {
  const [title, setTitle] = useState("question overview");
  const [details, setDetails] = useState("question details");
  const [purpose, setPurpose] = useState("");
  const navigate = useNavigate();

  const handleLogout = (e) =>{
    e.preventDefault();
    navigate('/home');
  }

  const handleAssign = (e) =>{
    e.preventDefault();
    navigate('/meeting');
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