import React from "react";
import {useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';
import { useUser } from "../context/UserContext";


function JoinQueue(props) {

  const navigate = useNavigate();

  const [subject, setSubject] = useState("");
  const [location, setLocation] = useState("");
  const [details, setDetails] = useState("");
  const [code, setCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [groupOption, setGroupOption] = useState(true);

  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [settings, setSettings] = useState(null);

  const { user, getCourse, courseSettings } = useUser();

  let url = props.url;
  let docRoot = props.documentRoot; 

  let course = getCourse();
  //This function runs on page load!
  useEffect(() => {

    //setup json command
    let request = {};
    request.command = "sessionPing";
    request.user = user.userid;
    request.courseId = course.course_id; 
    checkSession(request, url); 

  }, []);


  

  //This function checks the users session
  const checkSession = (json0, url0) =>{
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
        let success = data.success;
        if(success === "true"){
          // nothing to do if session worked?
          // originally set the course (again)
        }
        else{
          console.log("HOME: Server returned error");
          navigate(docRoot + "/error");
        }
      })
      .catch((error) => {
        console.log("HOME: There was an error:", error);
        navigate(docRoot + "/error");

      });
  }

  const handleCheck = e => {
    setGroupOption(!groupOption)
  }

  const handleQuestion = async (e) =>{
    e.preventDefault();

    if(subject === ""){
      setIsError(true);
      setErrorMessage("Please enter an issue subject");
    }
    else if(details === ""){
      setIsError(true);
      setErrorMessage("Please enter an issue description");
    }
    else if(location === ""){
      setIsError(true);
      setErrorMessage("Please enter a location");
    }
    else{

      setIsError(false);
      setErrorMessage("");

      console.log("User: ", user);
      console.log("Course: ", course);
      console.log("Question: ", details);
      console.log("Code: ", code);
      console.log("Group option: ", groupOption);

      //JOIN THE QUEUE
      let request = {};
      request.command = "joinQueue";
      request.user = user.userid;
      request.courseId = course.course_id;
      request.subject = subject;
      request.question = details;
      request.location = location;
      request.code = code;
      request.groupOption = groupOption.toString();

      //alert(groupoption);
      /* Makes post and checks success */
      const joinResponse = await joinQueue(request, url);

      if (joinResponse.success) {
        navigate(docRoot + "/studentWaitingRoom");
       
        if (!groupOption) {
          request = {};
          request.command = "llmSummary";
          request.user = user.userid;
          request.course = course;
          request.subject = subject;
          request.question = details;
          request.location = location;
          request.code = code;
          request.session_id = joinResponse.session.id;

          callLLMSummary(request, url);
        }
      }
    }

  }

  //this makes the call to the llm to summarize student issue
  const callLLMSummary = async (json0, url0) =>{
    const response = await fetch(url0, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(json0),
    });
    const data = await response.json();
    
    
    if(data.success) {
      console.log("Summary generated successfully");
      console.log("Data is: ", data);
    }
    else {
      console.log("Failed to generate summary");
      console.log("Data is: ", data);
    }
  }


  //This function sends user to the queue
  /*
  const joinQueue = (json0, url0) =>{
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
        return data;
        
        //if request succeeded
        if(data.success === "true" && data.session != null){
          navigate(docRoot + "/studentWaitingRoom");
        }
        else{
          console.log("JQ: Error, joining the queue didn't succeed");
          navigate(docRoot + "/error");
        }
          

      })
      .catch((error) => {
        console.log("JQ: There was an error:", error);
        navigate(docRoot + "/error");

      });

  }
  */
  const joinQueue = async (json0, url0) => {
    try {
      const response = await fetch(url0, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(json0),
      });

      const data = await response.json();
      console.log("JoinQueue data:", data);
      return data; // ✅ this is key — return the JSON so caller gets it

    } catch (error) {
      console.error("JQ: There was an error:", error);
      return { success: "false", error: error.message };
    }
  };


  function GroupCheckBox(props){

    if(courseSettings.grouping_enabled == "t"){
      return (
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            checked={groupOption}
            onChange={handleCheck}
          />
          <label className="form-check-label">
            I would like to be placed in a group (this might decrease your wait time)

          </label>
        </div>
      );
    }
    else{
      setGroupOption(false);
      return "";
    }
  }



  return (
    <div className="container p-4">
      <div className="row my-auto">
        <div className="col-md-4">
          <h1><i className="bi-list-ol big-icon"></i></h1>
          <h2>Join Queue</h2>
          <p>Please enter the following information to join the queue.</p>
        </div>
        <div className="col-md-8 my-auto">
          {isError &&
          <div className="alert alert-danger">
            <b>Error:</b> { errorMessage }
          </div>
          }

          <form>
            <div className="mb-3">
              <label className="form-label">Subject</label>
              <input
                type = "text"
                placeholder="Enter subject here"
                className="form-control"
                required
                value = {subject}
                onChange={(e)=>setSubject(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea
                placeholder="Enter your issue here"
                required
                className="form-control"
                value = {details}
                onChange={(e)=>setDetails(e.target.value)}>
              </textarea>
              <p className="form-text">Please explain your issue in a few sentences before joining the queue.</p>
            </div>

            <div className="mb-3">
              <label className="form-label">Location</label>
              <input
                type = "text"
                placeholder="Enter location here"
                required
                className="form-control"
                value = {location}
                onChange={(e)=>setLocation(e.target.value)}
              />
              <p className="form-text">Where can the TA find you?</p>
            </div>

            <div className="mb-3">
              <label className="form-label">Code and Context</label>
              <input
                type = "text"
                placeholder="Paste code or relevant partial work here"
                required
                className="form-control"
                value = {code}
                onChange={(e)=>setCode(e.target.value)}
              />
              <p className="form-text">(Optional) Paste any code or relevant partial work related to your issue.</p>
            </div>

            <div className="mb-3">
              <GroupCheckBox />
            </div>
          </form>

          <div>
            <button type="button" className="btn btn-primary" onClick={handleQuestion}>Join queue</button>
          </div>

          <div className="my-4 card">
            <div className="card-body text-center">
              <p>Forgot to fill out the survey from last time? Click here to go back and fill it out!</p>
              <button onClick={() => navigate(docRoot + "/studentSurvey")} className="btn btn-success">Complete Survey</button>
            </div>
          </div>
        </div>
      </div> 
    </div> 
  );
}



export default JoinQueue;

