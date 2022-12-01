import React from "react";
import {useState} from "react";
import { useNavigate } from 'react-router-dom';

function JoinQueue() {
  // const [title, setTitle] = useState("question overview");
  // const [details, setDetails] = useState("question details");
  // const [purpose, setPurpose] = useState("");
  const navigate = useNavigate();
  
  const [purpose, setPurpose] = useState("");
  const [details, setDetails] = useState("question details");

  const handleLogout = (e) =>{
    e.preventDefault();
    navigate('/');
  }

  const handleQuestion = (e) =>{
    e.preventDefault();
    navigate('/studentwaitingroom');
  }
  return (
    <div className="question">
      <div>
      <h2>Hello Student</h2>
        <button onClick={handleLogout}>logoff</button>
      </div>
      <br></br>
      <form>
      <label>Which Class Are You Here For?</label>
        <select 
          value={purpose}
          onChange={(e)=>setPurpose(e.target.value)}>
          <option value="Fall22">CS2301 Fall22</option>
          <option value="Spring23">CS3710 Spring23</option>
        </select>
        <label>What is your question?</label>
        <textarea
          required
          value = {details}
          onChange={(e)=>setDetails(e.target.value)}>
        </textarea>
      </form>
      <div>
        <h2>Join the queue</h2>
        <button onClick={handleQuestion}>Join queue</button>
      </div>
    </div>
  );
}

export default JoinQueue;

