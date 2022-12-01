import React from "react";
import {useState} from "react";
import { useNavigate } from 'react-router-dom';

//https://www.youtube.com/watch?v=IkMND33x0qQ
//https://bobbyhadz.com/blog/react-redirect-after-form-submit
function Question() {
  const [title, setTitle] = useState("question overview");
  const [details, setDetails] = useState("question details");
  const [purpose, setPurpose] = useState("");
  const navigate = useNavigate();

  const handleSubmit = event => {
    event.preventDefault();
    navigate('/studentwaitingroom');
  };
  
  return ( 
    <div className="question">
      <h2>What is your question today?</h2>
      <form onSubmit={handleSubmit}>
        <label>Title:</label>
        <input
          type = "text"
          required
          value = {title}
          onChange={(e)=>setTitle(e.target.value)}
        />
        <label>Question details:</label>
        <textarea
          required
          value = {details}
          onChange={(e)=>setDetails(e.target.value)}>
        </textarea>
        <label>Purpose:</label>
        <select 
          value={purpose}
          onChange={(e)=>setPurpose(e.target.value)}>
          <option value="Assignment">Only Assignment Check Off</option>
          <option value="Logistic">Logistic questions</option>
        </select>
        <button>Submit</button>
      </form>
    </div>
  );
}

export default Question;
