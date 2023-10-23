import React from "react";
import {useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';

function Meeting(props) {

  let url = props.url;
  let docRoot = props.documentRoot;

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

  useEffect(() => {
    poll();

    return () => {
        console.log("Meeting room: Stopping polling");
        clearTimeout(timeoutId);
        polling = false;
    }
    
  }, []);

  function poll(){

    if(localStorage.getItem('asci-user') === null){
        navigate(docRoot + "/login");
    }
    else if(localStorage.getItem('asci-course') === null){
        navigate(docRoot + "/selectCourse");
    }
    else{

      //Get meeting details
      let request = {};
      request.command = "getTAMeetingDetails";
      request.user = localStorage.getItem('asci-user');
      request.courseId = localStorage.getItem('asci-course');
      getMeetingDetails(request, url);  

    }
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
        if(data.success === "true"){
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
            timeoutId = setTimeout(poll, 10000);
          }

          /* Special cases: If group but no group members, just end meeting */
          if(data.is_group && data.group_sessions.length == 0){
            endMeeting(); //supposed to be a group but no group members here
          }
          else if(!data.is_group && data.student == null){
            endMeeting(); //no student to meet with somehow...
          }

        }
        else{
          console.log("Fetching meeting details failed for some reason");
          navigate(docRoot + "/error");
        }
        
      })
      .catch((error) => {
        console.log("HOME: There was an error:", error);
        navigate(docRoot + "/error");
        
      });

    }

  
  const handleLogout = (e) =>{
    e.preventDefault();
    localStorage.clear();
    navigate(docRoot + '/');
  }

  const handleEndMeeting = (e) =>{
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
      //End the meeting
      let request = {};
      request.command = "PutStudentBackOnQueue";
      request.user = localStorage.getItem('asci-user');
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


    function SinglePanel(props){
      return(
        <div className="question">
          <div>
            <h5>You are currently helping <b>{student.fname} {student.lname}</b> (<b>{student.computing_id}</b>)</h5>
            <h5><b>Subject:</b> {session.issue_subject}</h5>
            <h5><b>Description:</b> {session.issue}</h5>
            <h5><b>Location:</b> {session.location}</h5>
          </div>
      
          <div>
            <button onClick={handlePutBack}>Put student(s) back in queue!</button>
            <button onClick={handleEndMeeting}>End Meeting!</button>
            <p style={{   
              fontSize: '15px',
              padding: '20px',
              color: 'red',
            }} id="warning"></p>
          </div>
        </div>
      );
    }

    function GroupPanel(props) {
      /* If student is the main session for a group, just notify them */
      
      if(groupSessions != null){
        return(
          <div className="question">
            <h3>You are in a group meeting!</h3>
            <h4>Location: {session.location}</h4>
            <div>
              <h2>Group Members:</h2>
                  {Object.keys(groupSessions).map(k => { 
                          if(groupMembers[k] != null){
                          return (
                            <div key={'div_' + k}>
                            <h5 key={'memberInfo_' + k}><b>{groupMembers[k].fname} {groupMembers[k].lname}</b>: {groupSessions[k].issue}</h5>                            
                            <h5 key={'location_' + k}>(<b>Location</b>: {groupSessions[k].location})</h5>
                            </div>
                          );
                          } 
                        })
                  }
            </div>

            <div>
            <button onClick={handleEndMeeting}>End Meeting for all!</button>
            </div>
          </div>
        );
      }
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