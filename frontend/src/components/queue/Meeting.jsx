import React from "react";
import {useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';
import { useUser } from "../context/UserContext";
import Markdown from "react-markdown";

function Meeting(props) {

  let url = props.url;
  let docRoot = props.documentRoot;
  let {user, getCourse} = useUser();
  let course = getCourse();

  const [student, setStudent] = useState(null);
  const [session, setSession] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [elapsedMin, setElapsedMin] = useState("00");
  const [elapsedSec, setElapsedSec] = useState("00");
  let mins = 0;
  let secs = 0;
  let origTitle = document.title;
  let timeInterval = null;
  
  const [numWaiting, setNumWaiting] = useState("Loading...");
  const [numTAs, setNumTAs] = useState(1);

  /* Info regarding group (if applicable) */
  const [isGroup, setIsGroup] = useState(false);
  const [groupSessions, setGroupSessions] = useState(null);
  const [groupMembers, setGroupMembers] = useState(null);

  const navigate = useNavigate();

  //variables for managing polling the server
  let polling = false;
  let timeoutId = 0;
  let pollTime = 3000;

  // variables for polling queue info from the server
  let queueInterval = 0;
  let queuePollTime = 15000; // 15 seconds
  let queuePolling = true;

  useEffect(() => {
    poll();
    pollNumWaiting();

    timeInterval = setInterval(() => {
      if (secs == 59) {
        setElapsedSec("00");
        secs = 0;
        mins = mins + 1;
        setElapsedMin(String(mins).padStart(2, "0"));
      } else {
        secs = secs + 1;
        setElapsedSec(String(secs).padStart(2, "0"));
      }
      document.title = "(" + String(mins).padStart(2, "0") + ":" + String(secs).padStart(2,"0") + ") -- " + origTitle;
    }, 1000);

    return () => {
      console.log("Meeting room: Stopping polling");
      clearTimeout(timeoutId);
      clearTimeout(queueInterval);
      clearInterval(timeInterval);
      polling = false;
      queuePolling = false;
      document.title = origTitle;
    }

  }, []);

  function poll(){

    //Get meeting details
    let request = {};
    request.command = "getTAMeetingDetails";
    request.user = user.userid;
    request.courseId = course.course_id;
    getMeetingDetails(request, url);  

  }

  //This gets the meeting details and displays them
  const getMeetingDetails = (json0, url0) =>{
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
        console.log("Checking if successful");
        if(data.success === "true"){
          console.log("Success is true");
          setStudent(data.student);
          setSession(data.session);
          setSessionId(data.session.id);

          /* Set group info (could be null) */
          setIsGroup(data.is_group);
          setGroupSessions(data.group_sessions);
          setGroupMembers(data.group_members);

          if(data.is_group && data.group_sessions.length > 1){
            polling = true;
            console.log("TA Meeting: Setting timeout for next group poll");
            timeoutId = setTimeout(poll, pollTime);
          }


        }
        else{
          console.log("Fetching meeting details failed for some reason");
          navigate(docRoot + "/error");
        }

      })
      .catch((error) => {
        console.log("Meeting: There was an error:", error);
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
          setNumWaiting(data.waiting);
          setNumTAs(data.tas.length);

          if(queuePolling == true){
            queueInterval = setTimeout(pollNumWaiting, queuePollTime);
          }
        }
        else{
          console.log("Getting number waiting failed");
        }

      })
      .catch((error) => {
        console.log("HOME: There was an error:", error);
      });

  }

  const handleEndMeeting = (e) =>{
    if(sessionId === null){
      console.log("Session id is null");
      navigate(docRoot + "/error");
    }
    else{
      //End the meeting
      let request = {};
      request.command = "TAEndMeeting";
      request.user = user.userid;
      request.sessionId = sessionId;

      endMeeting(request, url);
    }
  }

  //ends meeting
  const endMeeting = (json0, url0) =>{
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
          localStorage.setItem("asci-session", sessionId); 
          navigate(docRoot + "/taSurvey");
        }
        else{
          console.log("Ending meeting failed");
          navigate(docRoot + "/error");
        }

      })
      .catch((error) => {
        console.log("HOME: There was an error:", error);
        navigate(docRoot + "/error");

      });

  }

  const handlePutGroupMemberBack = (e) =>{
    console.log(e);
  }


  const handlePutBack = (e) =>{
    if(sessionId === null){
      navigate(docRoot + "/error");
    }
    else{
      //End the meeting
      let request = {};
      request.command = "PutStudentBackOnQueue";
      request.user = user.userid;
      request.studentId = student.computing_id;
      request.sessionId = sessionId;

      putBack(request, url);
    }
  }

  //ends meeting
  const putBack = (json0, url0) =>{
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
          localStorage.setItem("asci-session", sessionId); 
          navigate(docRoot + "/taSurvey");
        }
        else{
          console.log("Ending meeting failed");
          navigate(docRoot + "/error");
        }

      })
      .catch((error) => {
        console.log("HOME: There was an error:", error);
        navigate(docRoot + "/error");

      });

  }

  function EmptyMeetingPanel(props){
    return(
      <div className="question">
        <div>
          <h5>Woops, this meeting looks empty. Click below to end the meeting.</h5>            
        </div>

        <div>
          <button onClick={handleEndMeeting}>End Meeting!</button>
        </div>
      </div>
    );
  }


  function SinglePanel(props){
    return(
      <div className="container p-4">
        <div className="row my-auto">
          <div className="col-md-4">
            <h1><i className="bi-person big-icon"></i></h1>
            <h2>Individual Meeting</h2>
            <p>Your current meeting information.</p>
          </div>
          <div className="col-md-8 my-auto">
            <QueueInfo />
            <h3>You are currently helping...</h3>
            <div className="card my-3">
              <div className="card-header d-flex flex-row justify-content-between align-items-center">
                <h5 className="m-0"><b>{student.fname} {student.lname}</b> (<b>{student.computing_id}</b>)</h5>
                <div className="text-center">
                  <button onClick={handlePutBack} className="btn btn-danger">Put student(s) back in queue</button> &nbsp;
                  <button onClick={handleEndMeeting} className="btn btn-primary">End Meeting</button>
                </div>
              </div>
              
              <div className="card-body" style={{display:"flex"}}>
                <dl style={{ minWidth:"150px" }}><dt>Subject</dt> <dd>{session.issue_subject}</dd>
                  <dt>Description</dt> <dd>{session.issue}</dd>
                  <dt>Location</dt> <dd>{session.location}</dd>
                </dl>
                {session.llm_summary && (
                  <dl style={{ marginLeft: "15px" }}><dt>Summary</dt> <dd><div className="text-wrap"><Markdown>{session.llm_summary}</Markdown></div></dd></dl>
                )}
                </div>
            </div>

            
          </div>
        </div>
      </div>
    );
  }


  const QueueInfo = () => {
    return (
      <div className="row my-auto">
        <div className="col-md-4 my-auto">
          <div className="card text-bg-warning mb-3">
            <div className="card-header text-center"><i className="bi-clock"></i> Meeting Time</div>
            <div className="card-body text-center">
              <h2>{elapsedMin}:{elapsedSec}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4 my-auto">
          <div className="card text-bg-secondary mb-3">
            <div className="card-header text-center"><i className="bi-list-ol"></i> Queue Length</div>
            <div className="card-body text-center">
              <h2>{numWaiting}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4 my-auto">
          <div className="card text-bg-secondary mb-3">
            <div className="card-header text-center"><i className="bi-person-lines-fill"></i> Active TA(s)</div>
            <div className="card-body text-center">
              <h2>{numTAs}</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function GroupPanel(props) {
    /* If student is the main session for a group, just notify them */

    if(groupSessions != null){
      return(
        <div className="container p-4">
          <div className="row my-auto">
            <div className="col-md-4">
              <h1><i className="bi-people big-icon"></i></h1>
              <h2>Group Meeting</h2>
              <p>Your current meeting information.</p>
            </div>
            <div className="col-md-8 my-auto">
              <QueueInfo />
              <h3>You are currently helping a group...</h3>
              <div className="card my-3">
                <h5 className="card-header">Location: {session.location}</h5>
                <ul className="list-group list-group-flush">
                  {Object.keys(groupSessions).map(k => { 
                    if(groupMembers[k] != null){
                      return (
                        <li className="list-group-item" key={'div_' + k}>
                          <h6 key={'memberInfo_' + k}><b>{groupMembers[k].fname} {groupMembers[k].lname}</b></h6>
                          <p className="mb-1"><b>Issue</b>: {groupSessions[k].issue}</p>
                          <p className="text-secondary mb-1" key={'location_' + k}><b>Original Location</b>: {groupSessions[k].location}</p>
                        </li>
                      );
                    } 
                  })
                  }
                </ul>
              </div>

              <div className="text-center">
                <button onClick={handleEndMeeting} className="btn btn-primary">End Meeting for All</button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }


  if(student == null && isGroup == false){
    return (
      <EmptyMeetingPanel />
    );
  }
  if(student != null)
    return (
      <SinglePanel />
    );
  else
    return (
      <GroupPanel />
    );

}

export default Meeting;
