import React from "react";
import {useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';

function Ta() {
  const [title, setTitle] = useState("question overview");
  const [details, setDetails] = useState("question details");
  const [purpose, setPurpose] = useState("");
  const [workingState, setWorkingState] = useState(true);
  const navigate = useNavigate();
  

  useEffect(() => {
    if (localStorage.getItem("authorizedTA") === null || localStorage.getItem('authorizedTA')==="false") {
      navigate('/login');
    } else if (localStorage.getItem("been2ta") === "true" ){
      navigate(-1);
    }
    else {
    }
  }, []);


  let taInfo = {
    command: workingState
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
        if(workingState === true){
          localStorage.setItem('been2ta', 'true');
          navigate('/handlestudent');
        }
      })
      .catch((error) => {
        console.error('Error:', error);
        
      });
  }

  const handleLogout = (e) =>{
    e.preventDefault();
    localStorage.clear();
    navigate('/login');
  }

  const handleWork = (e) =>{
    e.preventDefault();
    setWorkingState(e.target.value)
    json0 = JSON.stringify(taInfo);
    console.log(json0);
    sendJson(json0,url0);
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