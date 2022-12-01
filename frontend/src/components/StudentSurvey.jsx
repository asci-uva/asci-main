import React from "react";
import {useState} from "react";
import { useNavigate } from 'react-router-dom';

function StudentSurvey() {
  const [glitches, setTitle] = useState("");
  const [likeWeb, setDetails] = useState("");
  const [likeAi, setPurpose] = useState("");
  const navigate = useNavigate();

  const handleRating = (e) =>{
    e.preventDefault();
    navigate('/JoinQueue');
  }

  return (
    <div className="question">
      <div>
        <h1>How Was Your Experience?</h1>
      </div>
      <form>
        <label>Did you experience any glitches? Please let us know.</label>
        <input
          type = "text"
          maxlength = "200"
          value = {glitches}
          onChange={(e)=>setTitle(e.target.value)}
        />
        <label>How helpful was your TA?</label>
        <select 
          value={likeWeb}
          onChange={(e)=>setDetails(e.target.value)}>
          <option value="Very">Extremely Helpful</option>
          <option value="Somewhat">Somewhat Helpful</option>
          <option value="Not">Not Helpful at All</option>
        </select>
        <label>Was your question answered?</label>
        <select 
          value={likeWeb}
          onChange={(e)=>setDetails(e.target.value)}>
          <option value="Yes">Yes</option>
          <option value="Somewhat">Somewhat But Not Entirely</option>
          <option value="No">It Was Not, I am Reentering the Queue</option>
        </select>
        <label>What do you think of the webpage design:</label>
        <select 
          value={likeWeb}
          onChange={(e)=>setDetails(e.target.value)}>
          <option value="Perfect">Perfect</option>
          <option value="Decent">Decent</option>
          <option value="Kinda useful">Kinda Useful..</option>
          <option value="Needs improvement">Needs Improvement</option>
          <option value="Not satisfied">Not Satisfied</option>
        </select>
        <label>IS the AI queue performant?</label>
        <select 
          value={likeAi}
          onChange={(e)=>setPurpose(e.target.value)}>
          <option value="Perfect">Perfect</option>
          <option value="Decent">Decent</option>
          <option value="Kinda useful">Kinda Useful..</option>
          <option value="Needs improvement">Needs Improvement</option>
          <option value="Not satisfied">Not Satisfied</option>
        </select>
        <button onClick={handleRating}>Submit Response</button>
      </form>
    </div>
  );
}

export default StudentSurvey;