import React from "react";
import {useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';
import { useUser } from "../context/UserContext";

function Meeting(props) {

  let url = props.url;
  let docRoot = props.documentRoot;
  let {user, getCourse} = useUser();
  let course = getCourse();

  const [student, setStudent] = useState(null);
  const [session, setSession] = useState(null);
  const [sessionId, setSessionId] = useState(null);


  /* Info regarding group (if applicable) */
  const [isGroup, setIsGroup] = useState(false);
  const [groupSessions, setGroupSessions] = useState(null);
  const [groupMembers, setGroupMembers] = useState(null);

  const navigate = useNavigate();

  //variables for managing polling the server
  let polling = false;
  let timeoutId = 0;
  let pollTime = 3000;

  useEffect(() => {
    poll();

    return () => {
        console.log("Meeting room: Stopping polling");
        clearTimeout(timeoutId);
        polling = false;
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


  const handleEndMeeting = (e) =>{
    if(sessionId === null){
      console.log("Session id is null");
      navigate(docRoot + "/error");
    }
    else{
      //End the meeting
      let request = {};
      request.command = "TAEndMeeting";
      request.user = localStorage.getItem('asci-user');
      request.sessionId = sessionId;
      
      endMeeting(request, url);
    }
  }

  //ends meeting
  const endMeeting = (json0, url0) =>{
    fetch(url0, {
      method: 'POST', // or 'PUT'
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
            <h3>You are currently helping...</h3>
            <div className="card my-3">
             <h5 className="card-header"><b>{student.fname} {student.lname}</b> (<b>{student.computing_id}</b>)</h5>
            <div className="card-body">
            <dl><dt>Subject</dt> <dd>{session.issue_subject}</dd>
            <dt>Description</dt> <dd>{session.issue}</dd>
            <dt>Location</dt> <dd>{session.location}</dd>
            </dl>
            </div>
            </div>
            
            <div className="text-center">
            <button onClick={handlePutBack} className="btn btn-danger">Put student(s) back in queue</button> &nbsp;
            <button onClick={handleEndMeeting} className="btn btn-primary">End Meeting</button>
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
            <h3>You are currently helping a group...</h3>
            <div className="card my-3">
             <h5 className="card-header">Location: {session.location}</h5>
            <ul className="list-group list-group-flush">
                  {Object.keys(groupSessions).map(k => { 
                          if(groupMembers[k] != null){
                          return (
                            <li key={'div_' + k}>
                            <h6 key={'memberInfo_' + k}><b>{groupMembers[k].fname} {groupMembers[k].lname}</b></h6>
                            <p><b>Issue</b>: {groupSessions[k].issue}</p>
                            <p key={'location_' + k}>(<b>Location</b>: {groupSessions[k].location})</p>
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
