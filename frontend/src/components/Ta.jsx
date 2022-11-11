import React from "react";
import {useState} from "react";
import { useNavigate } from 'react-router-dom';

function Ta() {
  const [title, setTitle] = useState("question overview");
  const [details, setDetails] = useState("question details");
  const [purpose, setPurpose] = useState("");
  const navigate = useNavigate();

  const handleLogout = (e) =>{
    e.preventDefault();
    navigate('/home');
  }

  const handleWork = (e) =>{
    e.preventDefault();
    navigate('/handlestudent');
  }


  return (
    <div className="question">
      <div>
        <h2>You are now logged in as CSTA</h2>
        
        <button onClick={handleWork}>Start working</button>
      </div>
      <form>
        <label>My working hour starts at</label>
        <input
          type = "text"
          required
          value = {title}
          onChange={(e)=>setTitle(e.target.value)}
        />
        <label>My working hour ends at</label>
        <input
          type = "text"
          required
          value = {title}
          onChange={(e)=>setTitle(e.target.value)}
        />
        <label>Topics I am prepared to answer:</label>
        <textarea
          required
          value = {details}
          onChange={(e)=>setDetails(e.target.value)}>
        </textarea>
        <label>Types of question I answer:</label>
        <select 
          value={purpose}
          onChange={(e)=>setPurpose(e.target.value)}>
          <option value="Assignment">Assignment</option>
          <option value="Logistic">Logistic</option>
        </select>
      </form>
      <button onClick={handleLogout}>logoff</button>
    </div>
  );
}

export default Ta;