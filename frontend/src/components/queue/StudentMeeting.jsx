import React from "react";
import {useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';
import { useUser } from "../context/UserContext";

function StudentMeeting(props) {

  const navigate = useNavigate();

  let {user, getCourse} = useUser();
  let course = getCourse();

  const [taName, setTAName] = useState("TA Name");
  const [taId, setTAId] = useState("TA Id");
  const [sessionId, setSessionId] = useState(null);

  const [isGroup, setIsGroup] = useState(false);
  const [groupSession, setGroupSession] = useState(null);


  let url = props.url;
  let docRoot = props.documentRoot; 

  //This function runs on page load!
  useEffect(() => {


    //Get meeting details
    let request = {};
    request.command = "getMeetingDetails";
    request.user = user.userid;
    request.courseId = course.course_id;
    getMeetingInfo(request, url);  

  }, []);

  //This function grabs the meeting info (TA name, etc.)
  const getMeetingInfo = (json0, url0) =>{
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

          console.log("Received TA info");
          setTAName(data.ta.fname + " " + data.ta.lname);
          setTAId(data.ta.computing_id);
          setSessionId(data.session.id);
          setIsGroup(data.is_group);
          setGroupSession(data.group_session);

        }
        else{
          console.log("Meeting: request failed for some reason");
          navigate(docRoot + "/error");
        }
      })
      .catch((error) => {
        console.log("JQ: There was an error:", error);
        navigate(docRoot + "/error");

      });
  }


  const leaveMeeting = (e) =>{
    e.preventDefault();

    if(sessionId === null){
      navigate(docRoot + "/error");
    }
    else{

      let request = {};
      request.command = "leaveMeeting";
      request.user = user.userid;
      request.sessionId = sessionId;
      reqLeaveMeeting(request, url); 
    }

  }

  //This function attempts to leave the queue
  const reqLeaveMeeting = (json0, url0) =>{
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
          localStorage.setItem("asci-session", sessionId); 
          navigate(docRoot + "/studentSurvey");
        }
        else{
          console.log("Leaving meeting failed");
          navigate(docRoot + "/error");
        }


      })
      .catch((error) => {
        navigate(docRoot + "/error");

      });
  }

  function GroupPanel(props) {
    /* If student is the main session for a group, just notify them */
    if(isGroup && groupSession == null){
      return (
        <div className="text-center">
          <h5>This is a <b>group meeting</b>. Other students should arrive to join you soon! </h5>
          <h6>Please be ready when the TA arrives to assist you.</h6>
        </div>  );
    }
    else if(isGroup && groupSession != null){
      return(
        <div className="text-center">
          <h6> You have been added to a group (<b>Location: {groupSession.location})</b>. Please proceed to the specified location to find your group!</h6>
        </div>
      );
    }
    else{
      return (
        <div className="text-center">
          <h6>Please be ready when the TA arrives to assist you.</h6>
        </div>  );
    }
  }


  return (
    <div className="container p-4">
      <div className="row my-auto">
        <div className="col-md-4">
          <h1><i className="bi-person big-icon"></i></h1>
          <h2>Meeting</h2>
          <p>Your current meeting information.</p>
        </div>
        <div className="col-md-8 my-auto">
          <h3>You are in a meeting with...</h3>
          <div className="card my-3">
            <h5 className="card-header"><b>{taName} ({taId})</b></h5>
            <div className="card-body">
              <GroupPanel />
            </div>
          </div>

          <div className="text-center">
            <button onClick={leaveMeeting} className="btn btn-primary">Leave Meeting</button>
          </div>
        </div>
      </div>
    </div>
  );
}



export default StudentMeeting;
