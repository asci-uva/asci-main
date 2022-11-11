import React from "react";
import {useState} from "react";
import { useNavigate } from 'react-router-dom';

function TASurvey() {
  const [glitches, setTitle] = useState("");
  const [likeWeb, setDetails] = useState("");
  const [likeAi, setPurpose] = useState("");
  const navigate = useNavigate();

  const handleRating = (e) =>{
    e.preventDefault();
    navigate('/handlestudent');
  }

  return (
    <div className="question">
      <div>
        <h2>Grade the ASCI queue</h2>
        
      </div>
      <form>
        <label>Do you experience any glitches? Please let us know.</label>
        <input
          type = "text"
          maxlength = "200"
          value = {glitches}
          onChange={(e)=>setTitle(e.target.value)}
        />
        <label>What do you think of the webpage design:</label>
        <select 
          value={likeWeb}
          onChange={(e)=>setDetails(e.target.value)}>
          <option value="Perfect">Perfect</option>
          <option value="Decent">Decent</option>
          <option value="Kinda useful">Kinda useful..</option>
          <option value="Needs improvement">Needs improvement</option>
          <option value="Not satisfied">Not satisfied</option>
        </select>
        <label>IS the AI queue performant?</label>
        <select 
          value={likeAi}
          onChange={(e)=>setPurpose(e.target.value)}>
          <option value="Perfect">Perfect</option>
          <option value="Decent">Decent</option>
          <option value="Kinda useful">Kinda useful..</option>
          <option value="Needs improvement">Needs improvement</option>
          <option value="Not satisfied">Not satisfied</option>
        </select>
        <button onClick={handleRating}>Sumbit Response</button>
      </form>
    </div>
  );
}

export default TASurvey;