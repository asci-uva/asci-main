import React from "react";
import {useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';

function StudentSurvey(props) {

  const navigate = useNavigate();

  /* This state lets us know what to show the user */
  // Value: "loading", "survey", "submitted", "none"
  const [uiState, setUIState] = useState("loading");

  /* Some data about the meeting that you are being surveyed about */
  const [taFirstName, setTAFirstName] = useState("...");
  const [taLastName, setTALastName] = useState("...");
  const [taId, setTAId] = useState("TA Id");
  const [sessionId, setSessionId] = useState(null);
  const [meetingDate, setMeetingDate] = useState("");

  /* Selected Likert Answers */
  const [q1Ans, setQ1Ans] = useState("3");
  const [q2Ans, setQ2Ans] = useState("3");
  const [q3Ans, setQ3Ans] = useState("3");
  const [q4Ans, setQ4Ans] = useState("3");
  const [feedback, setFeedback] = useState("");
  
  let url = props.url;
  let docRoot = props.documentRoot; 
  
    //This function runs on page load!
    useEffect(() => {
      
    if(localStorage['asci-user'] === null){
      navigate(docRoot + "/login");
    }
    else if(localStorage.getItem('asci-course') === null){
      navigate(docRoot + "/selectCourse");
    }
    else{

      /* Two ways to pull a session. */
      let request = {};
      
      /* First, if a session id is set, then use that id */
      if(localStorage.getItem('asci-session') !== null){
        //Fetch the survey info (really just meeting info) for this session id
        request.command = "GetSessionForSurvey";  
      }
      else{
        //Fetch the survey info (really just meeting info) for this session id
        request.command = "GetMostRecentSessionWithNoSurvey";
      }

      request.user = localStorage.getItem('asci-user');
      request.courseId = localStorage.getItem('asci-course');
      request.sessionId = localStorage.getItem('asci-session');
      getSessionInfo(request, url);
      
    }
      
    }, []);

    //This function grabs the meeting info (TA name, etc.)
    const getSessionInfo = (json0, url0) =>{
      fetch(url0, {
        method: 'POST', // or 'PUT'
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(json0),
      }).then(response => response.json())
      .then(data => {
          console.log("Data is: ", data);
          
          if(data.success === "true"){

            /* If this person is a TA somehow, throw an error */
            if(data.session.role === "ta"){
              navigate(docRoot + "/error");
            }

            console.log("Received Session Info");
            setUIState("survey");
            setTAFirstName(data.other.fname);
            setTALastName(data.other.lname);
            setTAId(data.other.computing_id);
            setSessionId(data.session.id);
            setMeetingDate(data.session.fulfillment_time);
            
          }
          else{
            setUIState("none");
          }
        })
        .catch((error) => {
          console.log("StudSurvey: There was an error:", error);
          navigate(docRoot + "/error");
          
        });
  }

  
  const submitSurvey = (e) =>{
    e.preventDefault();

    if(localStorage.getItem('asci-user') === null){
      navigate(docRoot + "/login");
    }
    else if(localStorage.getItem('asci-course') === null){
      navigate(docRoot + "/selectCourse");
    }
    else if(sessionId === null){
       navigate(docRoot + "/error");
    }
    else{

      let request = {};
      request.command = "SubmitSurvey";
      request.user = localStorage.getItem('asci-user');
      request.sessionId = sessionId;

      let surveyData = {};
      surveyData.q1_score = q1Ans;
      surveyData.q2_score = q2Ans;
      surveyData.q3_score = q3Ans;
      surveyData.q4_score = q4Ans;
      surveyData.q5_score = -1; //no q5 at the moment
      surveyData.feedback = feedback;

      console.log("Selected option q1: " + q1Ans);
      console.log("Selected option q2: " + q2Ans);
      console.log("Selected option q3: " + q3Ans);
      console.log("Selected option q4: " + q4Ans);
      console.log("Feedback: " + feedback);
      
      /*TODO: Setup the survey data array!!*/
      request.surveyData = surveyData;

      reqSubmitSurvey(request, url); 
    }

    }

    //This function attempts to submit the survey to server
    const reqSubmitSurvey = (json0, url0) =>{
      fetch(url0, {
        method: 'POST', // or 'PUT'
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(json0),
      }).then(response => response.json())
      .then(data => {
          console.log("Data is: ", data);
          
          if(data.success === "true"){
            console.log("Survey Submitted!");
            localStorage.removeItem("asci-session");
            setUIState("submitted");
          }
          else{
            console.log("Submitting survey failed");
            navigate(docRoot + "/error");
          }

        })
        .catch((error) => {
          navigate(docRoot + "/error");
          
        });
    }

    /* This logic figures out which html to show */
    if (uiState === "loading")
      return getLoadingHTML();
    else if (uiState === "none")
      return getNoSurveyHTML();
    else if (uiState === "submitted")
      return getSurveyDoneHTML();
    else if (uiState === "survey")
      return getSurveyHtml();    

    
    function getSurveyHtml(){
        return (
          <div className="survey">
            <div>
            <h1> Tell us about your meeting with {taFirstName} {taLastName} ({taId}) </h1>
            <h4>This meeting occured on {new Date(meetingDate).toLocaleString()}</h4>
            </div>

            
            <div>
            <h2> How long did {taFirstName} spend with you? </h2>
            </div>

            <div className="radio_btn_group">
            <label>
              <input type="radio" name="q1" value="1"
                checked={q1Ans === "1"}
                onChange={() => setQ1Ans("1")}
              />
              Less than 10 minutes
            </label>
            <label>
              <input type="radio" name="q1" value="2"
                checked={q1Ans === "2"}
                onChange={() => setQ1Ans("2")}
              />
              10-20 minutes
            </label>
            <label>
              <input type="radio" name="q1" value="3"
                checked={q1Ans === "3"}
                onChange={() => setQ1Ans("3")}
              />
              21-40 minutes
            </label>
            <label>
              <input type="radio" name="q1" value="4"
                checked={q1Ans === "4"}
                onChange={() => setQ1Ans("4")}
              />
              60-90 minutes
            </label>
            <label>
              <input type="radio" name="q1" value="5"
                checked={q1Ans === "5"}
                onChange={() => setQ1Ans("5")}
              />
              More than 90 minutes
            </label>
            </div>

            <div>
            <h2> How helpful was {taFirstName}? </h2>
            </div>

            <div className="radio_btn_group">
            <label>
              <input type="radio" name="q2" value="1"
                checked={q2Ans === "1"}
                onChange={() => setQ2Ans("1")}
              />
              1 (not helpful at all)
            </label>
            <label>
              <input type="radio" name="q2" value="2"
                checked={q2Ans === "2"}
                onChange={() => setQ2Ans("2")}
              />
              2 (somewhat unhelpful)
            </label>
            <label>
              <input type="radio" name="q2" value="3"
                checked={q2Ans === "3"}
                onChange={() => setQ2Ans("3")}
              />
              3 (neutral)
            </label>
            <label>
              <input type="radio" name="q2" value="4"
                checked={q2Ans === "4"}
                onChange={() => setQ2Ans("4")}
              />
              4 (helpful)
            </label>
            <label>
              <input type="radio" name="q2" value="5"
                checked={q2Ans === "5"}
                onChange={() => setQ2Ans("5")}
              />
              5 (very helpful)
            </label>
            </div>


            <div>
            <h2> Was {taFirstName} able to your questions / concerns? </h2>
            </div>

            <div className="radio_btn_group">
            <label>
              <input type="radio" name="q3" value="1"
                checked={q3Ans === "1"}
                onChange={() => setQ3Ans("1")}
              />
              No, I am much more concerned now
            </label>
            <label>
              <input type="radio" name="q3" value="2"
                checked={q3Ans === "2"}
                onChange={() => setQ3Ans("2")}
              />
              No, I am more concerned now
            </label>
            <label>
              <input type="radio" name="q3" value="3"
                checked={q3Ans === "3"}
                onChange={() => setQ3Ans("3")}
              />
              Neutral
            </label>
            <label>
              <input type="radio" name="q3" value="4"
                checked={q3Ans === "4"}
                onChange={() => setQ3Ans("4")}
              />
              Some of my concerns were addressed
            </label>
            <label>
              <input type="radio" name="q3" value="5"
                checked={q3Ans === "5"}
                onChange={() => setQ3Ans("5")}
              />
              All of my concerns were addressed
            </label>
            </div>

            

            <div>
            <h2> Overall, how satisfied are you with the meeting? </h2>
            </div>

            <div className="radio_btn_group">
            <label>
              <input type="radio" name="q4" value="1"
                checked={q4Ans === "1"}
                onChange={() => setQ4Ans("1")}
              />
              1 (very unsatisfied)
            </label>
            <label>
              <input type="radio" name="q4" value="2"
                checked={q4Ans === "2"}
                onChange={() => setQ4Ans("2")}
              />
              2 (unsatisfied)
            </label>
            <label>
              <input type="radio" name="q4" value="3"
                checked={q4Ans === "3"}
                onChange={() => setQ4Ans("3")}
              />
              3 (neutral)
            </label>
            <label>
              <input type="radio" name="q4" value="4"
                checked={q4Ans === "4"}
                onChange={() => setQ4Ans("4")}
              />
              4 (satisfied)
            </label>
            <label>
              <input type="radio" name="q4" value="5"
                checked={q4Ans === "5"}
                onChange={() => setQ4Ans("5")}
              />
              5 (very satisfied)
            </label>
            </div>

            <div>
            <h2>[Optional] Anything you would like us to know?</h2>
              <textarea
                placeholder="Tell us about your experience..."
                value = {feedback}
                onChange={(e)=>setFeedback(e.target.value)}>
              </textarea>
              </div>
        

            <div>
              <button onClick={submitSurvey}>Submit Survey!</button>
            </div>
            
          </div>
          );
    }


    function getSurveyDoneHTML(){
      return (
        <div className="question">
          <h2> Thank you for submitting the survey! </h2>

          <div>
          <button onClick={() => navigate(docRoot + "/")}>Go Back</button>
          </div>

        </div>
      );
    }

    function getNoSurveyHTML(){
      return (
        <div className="question">
          <h2> Oops! There is no survey for you to fill out right now! </h2>

          <div>
          <button onClick={() => navigate(docRoot + "/")}>Go Back</button>
          </div>

        </div>
      );
    }


    function getLoadingHTML(){
      return (
        <div className="question">
          <h2> Fetching survey, please wait... </h2>
        </div>
      );
    }
}
 

export default StudentSurvey;