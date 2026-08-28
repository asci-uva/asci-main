import React from "react";
import {useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';
import { useUser } from "../context/UserContext";

function TASurvey(props) {

  const navigate = useNavigate();
  let {user, getCourse} = useUser();
  let course = getCourse();

  /* This state lets us know what to show the user */
  // Value: "loading", "survey", "submitted", "none"
  const [uiState, setUIState] = useState("loading");

  /* Some data about the meeting that you are being surveyed about */
  const [studFirstName, setStudFirstName] = useState("...");
  const [studLastName, setStudLastName] = useState("...");
  const [studId, setStudId] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [meetingDate, setMeetingDate] = useState("");

  /* Selected Likert Answers */
  const [q1Ans, setQ1Ans] = useState("3"); // I think we said we should get rid of this default value
  const [q2Ans, setQ2Ans] = useState("3");
  const [q3Ans, setQ3Ans] = useState("0");
  const [feedback, setFeedback] = useState("");
  
  let url = props.url;
  let docRoot = props.documentRoot; 
  
    //This function runs on page load!
    useEffect(() => {
      
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

      request.user = user.userid;
      request.courseId = course.course_id;
      request.sessionId = localStorage.getItem('asci-session');
      getSessionInfo(request, url);
      
      
    }, []);

    //This function grabs the meeting info (TA name, etc.)
    const getSessionInfo = (json0, url0) =>{
      fetch(url0, {
        method: 'POST', // or 'PUT'
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(json0),
      }).then(response => response.json())
      .then(data => {
          console.log("Data is: ", data);
          
          if(data.success === "true"){

            /* If this person is a student somehow, throw an error */
            if(data.session.role === "student"){
              navigate(docRoot + "/error");
            }

            console.log("Received Session Info");
            setUIState("survey");
            setStudFirstName(data.other.fname);
            setStudLastName(data.other.lname);
            setStudId(data.other.computing_id);
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

    if(sessionId === null){
       navigate(docRoot + "/error");
    }
    else{

      let request = {};
      request.command = "SubmitSurvey";
      request.user = user.userid; 
      request.sessionId = sessionId;

      let surveyData = {};
      surveyData.q1_score = q1Ans;
      surveyData.q2_score = q2Ans;
      surveyData.q3_score = q3Ans; //no q3 through q5 at the moment
      surveyData.q4_score = -1;
      surveyData.q5_score = -1;
      surveyData.feedback = feedback;

      console.log("Selected option q1: " + q1Ans);
      console.log("Selected option q2: " + q2Ans);
      console.log("Selected option q3: " + q3Ans);
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
        credentials: "include",
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
          <div className="row">

            <div className="text-center m-2">
              <button onClick={() => navigate(docRoot + "/")} className="btn btn-danger">Skip Survey</button>
            </div>

            <div className="card my-3 p-0">
            <h5 className="card-header">Quick Survey</h5>
            <div className="card-body">

            <p> Tell us about your meeting with {studFirstName} {studLastName} ({studId}).
            This meeting occured on {new Date(meetingDate).toLocaleString()}</p>

            <p className="form-label"> Were you able to address the questions/concerns of the student? </p>

            <div className="mb-3">
            <div className="form-check">
            <label className="form-check-label">
              <input type="radio" name="q1" value="1" className="form-check-input"
                checked={q1Ans === "1"}
                onChange={() => setQ1Ans("1")}
              />
              The student left more confused than when they arrived
            </label>
            </div>
            <div className="form-check">
            <label className="form-check-label">
              <input type="radio" name="q1" value="2" className="form-check-input"
                checked={q1Ans === "2"}
                onChange={() => setQ1Ans("2")}
              />
              I was able to address none of the questions/concerns
            </label>
            </div>
            <div className="form-check">
            <label className="form-check-label">
              <input type="radio" name="q1" value="3" className="form-check-input"
                checked={q1Ans === "3"}
                onChange={() => setQ1Ans("3")}
              />
              I was able to address some of the questions/concerns
            </label>
            </div>
            <div className="form-check">
            <label className="form-check-label">
              <input type="radio" name="q1" value="4" className="form-check-input"
                checked={q1Ans === "4"}
                onChange={() => setQ1Ans("4")}
              />
              I was able to address most of the questions/concerns
            </label>
            </div>
            <div className="form-check">
            <label className="form-check-label">
              <input type="radio" name="q1" value="5" className="form-check-input"
                checked={q1Ans === "5"}
                onChange={() => setQ1Ans("5")}
              />
              I was able to address all of the questions/concerns
            </label>
            </div>
            </div>

            <p className="form-label"> Overall, how satisfied were you with your office hours experience? </p>

            <div className="mb-3">
            <div className="form-check">
            <label className="form-check-label">
              <input type="radio" name="q2" value="1" className="form-check-input"
                checked={q2Ans === "1"}
                onChange={() => setQ2Ans("1")}
              />
              1 (very unsatisfied)
            </label>
            </div>
            <div className="form-check">
            <label className="form-check-label">
              <input type="radio" name="q2" value="2" className="form-check-input"
                checked={q2Ans === "2"}
                onChange={() => setQ2Ans("2")}
              />
              2 (somewhat unsatisfied)
            </label>
            </div>
            <div className="form-check">
            <label className="form-check-label">
              <input type="radio" name="q2" value="3" className="form-check-input"
                checked={q2Ans === "3"}
                onChange={() => setQ2Ans("3")}
              />
              3 (neither satisfied nor unsatisfied)
            </label>
            </div>
            <div className="form-check">
            <label className="form-check-label">
              <input type="radio" name="q2" value="4" className="form-check-input"
                checked={q2Ans === "4"}
                onChange={() => setQ2Ans("4")}
              />
              4 (somewhat satisfied)
            </label>
            </div>
            <div className="form-check">
            <label className="form-check-label">
              <input type="radio" name="q2" value="5" className="form-check-input"
                checked={q2Ans === "5"}
                onChange={() => setQ2Ans("5")}
              />
              5 (very satisfied)
            </label>
            </div>
            </div>

            <p className="form-label"> How helpful was the AI Summary? </p>

            <div className="mb-3">
            <div className="form-check">
            <label className="form-check-label">
              <input type="radio" name="q3" value="0" className="form-check-input"
                checked={q3Ans === "0"}
                onChange={() => setQ3Ans("0")}
              />
              I did not use the summary
            </label>
            </div>
            <div className="form-check">
            <label className="form-check-label">
              <input type="radio" name="q3" value="1" className="form-check-input"
                checked={q3Ans === "1"}
                onChange={() => setQ3Ans("1")}
              />
              1 (very unhelpful)
            </label>
            </div>
            <div className="form-check">
            <label className="form-check-label">
              <input type="radio" name="q3" value="2" className="form-check-input"
                checked={q3Ans === "2"}
                onChange={() => setQ3Ans("2")}
              />
              2 (somewhat unhelpful)
            </label>
            </div>
            <div className="form-check">
            <label className="form-check-label">
              <input type="radio" name="q3" value="3" className="form-check-input"
                checked={q3Ans === "3"}
                onChange={() => setQ3Ans("3")}
              />
              3 (neither helpful nor unhelpful)
            </label>
            </div>
            <div className="form-check">
            <label className="form-check-label">
              <input type="radio" name="q3" value="4" className="form-check-input"
                checked={q3Ans === "4"}
                onChange={() => setQ3Ans("4")}
              />
              4 (somewhat helpful)
            </label>
            </div>
            <div className="form-check">
            <label className="form-check-label">
              <input type="radio" name="q3" value="5" className="form-check-input"
                checked={q3Ans === "5"}
                onChange={() => setQ3Ans("5")}
              />
              5 (very helpful)
            </label>
            </div>
            </div>

            <div className="mb-3">
            <p className="form-label">Anything else you wish to add? (Optional)</p>
              <textarea className="form-control"
                placeholder="Tell us about your experience..."
                value = {feedback}
                onChange={(e)=>setFeedback(e.target.value)}>
              </textarea>
              </div>
        

            <div className="text-center mb-3">
              <button onClick={submitSurvey} className="btn btn-info">Submit Survey!</button>
            </div>
            </div>
            </div>
          </div>
          );
    }


    function getSurveyDoneHTML(){
      return (
        <div>
          <h2> Thank you for submitting the survey! </h2>

          <div className="text-center">
          <button onClick={() => navigate(docRoot + "/")} className="btn btn-info">Go Back</button>
          </div>

        </div>
      );
    }

    function getNoSurveyHTML(){
      return (
        <div>
          <h2> Oops! There is no survey for you to fill out right now! </h2>

          <div className="text-center">
          <button onClick={() => navigate(docRoot + "/")} className="btn btn-info">Go Back</button>
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
 

export default TASurvey;
