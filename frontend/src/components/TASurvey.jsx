import React from "react";
import {useState,useEffect} from "react";
import { useNavigate } from 'react-router-dom';

function TASurvey(props) {
  const [glitches, setTitle] = useState("");
  const [likeWeb, setDetails] = useState("");
  const [likeAi, setPurpose] = useState("");
  const [surveyState, setSurveyState] = useState(true)
  const navigate = useNavigate();

  let url = props.url;
  let docRoot = props.documentRoot;

  useEffect(() => {
    if (localStorage.getItem("authorizedTA") === null || localStorage.getItem('authorizedTA')==="false") {
      navigate(docRoot + '/login');
    } else if (localStorage.getItem("been2meeting") === "true"){
    } else{
      //TODO??
    }
  }, []);

  let surveyInfo = {
    command: surveyState
  }

  let json0;
  

  const sendJson = (json0, url) =>{
    fetch(url, {
      method: 'POST', // or 'PUT'
      headers: {
        'Content-Type': 'application/json',
      },
      body: json0,
    }).then((response) => response.json())
      .then((data) => {
        //retrieve the student assigned
        console.log(data);
        if(surveyState === true){
          localStorage.removeItem("been2meeting");
          localStorage.removeItem("been2handle");
          navigate(docRoot + '/handlestudent');
        }
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }
  const handleRating = (e) =>{
    e.preventDefault();
    setSurveyState(e.target.value)
    json0 = JSON.stringify(surveyInfo);
    console.log(json0);
    sendJson(json0,url);
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