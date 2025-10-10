import React from "react";
import {useEffect, useState} from "react";
import { useNavigate } from 'react-router-dom';
import { useUser } from "../context/UserContext";
import Chat from "../chat/Chat";

import ClearQueue from "./ClearQueue";

function HandleStudent(props) {

  let {user, getCourse, courseSettings} = useUser();
  let course = getCourse();

  //variables for managing polling the server
  let polling = false;
  let timeoutId = 0;
  let pollTime = 3000;
  //----------------------

  let url = props.url; 
  let docRoot = props.documentRoot;
  let origTitle = document.title;
  let chime = new Audio('/media/chime.mp3');
  let chimeWaiting = 0;

  const [assign, setAssign] = useState(true);
  const [numWaiting, setNumWaiting] = useState("Loading...");
  const [courseName, setCourseName] = useState("Loading...");
  const [waitingSessions, setWaitingSessions] = useState([]);
  const [activeTAs, setActiveTAs] = useState([]);
  const [numTAs, setNumTAs] = useState(1);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState("Loading...");

  const [settings, setSettings] = useState(null);

  const navigate = useNavigate();

  const openModal = () => setSummaryModalOpen(true);
  const closeModal = () => {
    setSummaryModalOpen(false);
    setAiSummary("Loading...");
  }

  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  };
  
  const modalStyle = {
    background: "#fff",
    padding: "20px",
    borderRadius: "8px",
    minWidth: "300px"
  };

  useEffect(() => {
    //Ping the server and make sure this person is actually a TA
    console.log("TA: Checking if token exists");

    getSettings();

    polling = true;
    pollNumWaiting();

    //called when this component unmounts
    return () => {
      console.log("HandleStudent: Stopping polling");
      clearTimeout(timeoutId);
      polling = false;
      document.title = origTitle;
    }


  }, []);

  function getSettings(){
    /* Also get course settings */
    let request2 = {};
    request2.command = "getCourseSettings";
    request2.user = user.userid;
    request2.courseId = course.course_id;
    fetchSettings(request2, url);
  }



  const fetchSettings = (json0, url0) =>{
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

          setSettings(data.settings);

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



  function pollNumWaiting(){
    //Get a student
    let request = {};
    request.command = "getWaitingSessions";
    request.user = user.userid;
    request.courseId = course.course_id;
    getWaitingSessions(request, url); 
  }

  //This gets a student
  const getWaitingSessions = (json0, url0) =>{
    fetch(url0, {
      method: 'POST', // or 'PUT'
      credentials: "include",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(json0),
    }).then(response => response.json())
      .then(data => {
        console.log("Waiting sessions is: ", data);

        //if request succeeded
        if(data.success === "true"){
          if (chimeWaiting < data.waiting) {
            console.log("playing a sound");
            console.log(numWaiting);
            console.log(data.waiting);
            chime.play();
          }
          setNumWaiting(data.waiting);
          setNumTAs(data.tas.length);
          setActiveTAs(data.tas);
          setWaitingSessions(data.sessions);
          chimeWaiting = data.waiting; 

          if (data.waiting > 0)
            document.title = "(" + String(data.waiting) + ") " + origTitle;
          else
            document.title = origTitle;

          if(polling == true){
            timeoutId = setTimeout(pollNumWaiting, pollTime);
          }
        }
        else{
          console.log("Getting number waiting failed");
          navigate(docRoot + "/error");
        }

      })
      .catch((error) => {
        console.log("HOME: There was an error:", error);
        navigate(docRoot + "/error");

      });

  }



  const handleAssign = (e) =>{
    e.preventDefault();

    //Get a student
    let request = {};
    request.command = "getStudentForTA";
    request.user = user.userid;
    request.courseId = course.course_id;
    getStudent(request, url); 
  }

  const handleTake = (e) =>{
    e.preventDefault();

    console.log("Handling specific student?");
    console.log("e is: " + e);
    console.log("value is: " + e.target.value);

    /* Need to send sessionId also... */

    //Get a student
    let request = {};
    request.command = "takeSpecificStudentForTA";
    request.user = user.userid;
    request.courseId = course.course_id;
    request.sessionId = waitingSessions[e.target.value].id;
    getStudent(request, url); 

  }

  const handleSummary = (e) =>{
    e.preventDefault();

    openModal();

    console.log("Handling specific student?");
    console.log("e is: " + e);
    console.log("value is: " + e.target.value);

    //Get a student
    let request = {};
    request.command = "getAISummary";
    request.user = user.userid;
    request.courseId = course.course_id;
    request.sessionId = waitingSessions[e.target.value].id;

    // AI summary should be stored in database if the bot is done running
    getSummary(request, url); 

  }

  //This gets a student
  const getStudent = (json0, url0) =>{
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

        //if request succeeded
        if(data.success === "true"){
          if(data.group_option === "true"){
            navigate(docRoot + "/handleGroup");
          }
          else{
            navigate(docRoot + "/meeting");
          }
        }
        else{
          console.log("TA: getting student failed for some reason");
          //TODO: Let the student know somehow??
        }

      })
      .catch((error) => {
        console.log("HOME: There was an error:", error);
        navigate(docRoot + "/error");

      });

  }

  const getSummary = (json0, url0) =>{
    fetch(url0, {
      method: 'POST',
      credentials: "include",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(json0),
    }).then(response => response.json())
    .then(data => {
      console.log("Data is", data);
      //if request succeeded
      if(data.success === "true"){
        console.log(data.summary);
        setAiSummary(data.summary);
      }
      else{
        console.log("Failed to retrieve AI Summary");
        setAiSummary("Failed to retrieve AI Summary");
      }
    })
    .catch((error) => {
      console.log("HOME: There was an error:", error);
      navigate(docRoot + "/error");
    });

  }

  const handleClearQueueCallback = () => {
    console.log("Received callback. Refreshing queue page");
    pollNumWaiting();
  }


  const WaitTableHeaderRow = () => {
    return <tr><th>No.</th><th className="waitTableIssue">Issue</th><th>Location</th><th>Options</th></tr>;
  }

  const formatDate = (datestr) => {
    let date = new Date(datestr);
    return date.toLocaleTimeString() + ' - ' + date.toLocaleDateString();
  }

  const WaitTableRow = ({data}) => {
    return Object.keys(data).map(k =>
      <tr key={k}>
        <td>{k}</td>
        <td><b>{data[k].issue_subject}</b><br/>{data[k].issue}<br/><small><i>Joined queue: {formatDate(data[k].entry_time)}</i></small></td>
        <td>{data[k].location}</td>
        <td><button value={k} onClick={handleTake} className="btn btn-sm btn-danger">Take</button></td>
        <td><button value={k} onClick={handleSummary} className="btn btn-sm btn-danger">AI Summary</button></td>
      </tr>
    );
  }

  const TARow = ({data}) => {
    return Object.keys(data).map(k =>
      <tr key={k}>
        <td>{data[k].pname} {data[k].lname} ({data[k].computing_id})</td>
      </tr>
    );
  }

  const WaitTable = ({data}) => {
    console.log("waittable: settings: " , courseSettings);
    if(data.length > 0 && courseSettings.show_queue_list == "t"){
      return (
        <div className="card my-3">
          <h5 className="card-header">Waiting List</h5>
          <div className="card-body">
            <table className="table table-striped">
              <thead>
                <WaitTableHeaderRow />
              </thead>
              <tbody>
                <WaitTableRow data={data} />
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    else return;
  }

  return (
    <div className="container p-4">
      <div className="row my-auto">
        <div className="col-md-4">
          <h1><i className="bi-list-ol big-icon"></i></h1>
          <h2>Handle Queue</h2>
          <p>You are now handling students for <b>{course.name}</b>.</p>

          <p>There are {numTAs} TAs active:</p>
            <table>
              <tbody>
                <TARow data={activeTAs} />
              </tbody>
            </table>

        </div>
        <div className="col-md-8 my-auto">
          <div className="row">
            <div className="col-md-6">
              <div className="card text-bg-primary mb-3">
                <div className="card-body text-center">
                  <p>There are <b>{numWaiting}</b> student(s) waiting.</p>

                  <button onClick={handleAssign} className="btn btn-info">Get Next Student</button>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card text-bg-danger mb-3">
                <div className="card-body text-center">
                  <ClearQueue callback={handleClearQueueCallback} url={url} documentRoot={docRoot} user={user.userid} courseId={course.course_id} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <WaitTable data={waitingSessions} />
          </div>

          <div className="my-4 card">
            <div className="card-body text-center">
              <p>Missed a survey from an older meeting? Click here to go back and fill it out!</p>
              <button onClick={() => navigate(docRoot + "/taSurvey")} className="btn btn-success">Complete Survey</button>
            </div>
          </div>

        </div>
      </div>
      {summaryModalOpen && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2>Summary from AI Bot</h2>
            <p>{aiSummary}</p>
            <button className="btn btn-danger btn-sm" onClick={closeModal}>Close</button>
          </div>
        </div>
        )}
    </div>
  );
}

export default HandleStudent;
