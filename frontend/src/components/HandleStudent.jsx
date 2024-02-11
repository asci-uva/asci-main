import React from "react";
import {useEffect, useState} from "react";
import { useNavigate } from 'react-router-dom';

import ClearQueue from "./ClearQueue";

function HandleStudent(props) {
  
  let [user, setUser] = useState(null);
  let [courseId, setCourseId] = useState(null);

  //variables for managing polling the server
  let polling = false;
  let timeoutId = 0;
  let pollTime = 3000;
  //----------------------

  let url = props.url; 
  let docRoot = props.documentRoot;

  const [assign, setAssign] = useState(true);
  const [numWaiting, setNumWaiting] = useState("Loading...");
  const [courseName, setCourseName] = useState("Loading...");
  const [waitingSessions, setWaitingSessions] = useState([]);

  const [settings, setSettings] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    //Ping the server and make sure this person is actually a TA
    console.log("TA: Checking if token exists");

    if(localStorage.getItem('asci-user') === null){
      navigate(docRoot + "/login");
    }

    else if(localStorage.getItem('asci-course') === null){
      navigate(docRoot + "/selectCourse");
    }

    else{
      setUser(localStorage.getItem('asci-user'));
      setCourseId(courseId = localStorage.getItem('asci-course'));

      getSettings();

      polling = true;
      pollNumWaiting();
    }

    //called when this component unmounts
    return () => {
      console.log("HandleStudent: Stopping polling");
      clearTimeout(timeoutId);
      polling = false;
    }
    
    
  }, []);

  function getSettings(){
    /* Also get course settings */
    let request2 = {};
    request2.command = "getCourseSettings";
    request2.user = localStorage.getItem('asci-user');
    request2.courseId = localStorage.getItem('asci-course');
    fetchSettings(request2, url);
  }
    

    
  const fetchSettings = (json0, url0) =>{
    fetch(url0, {
      method: 'POST', // or 'PUT'
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
    request.user = localStorage.getItem('asci-user');
    request.courseId = localStorage.getItem('asci-course');
    getWaitingSessions(request, url); 
  }

  //This gets a student
  const getWaitingSessions = (json0, url0) =>{
    fetch(url0, {
      method: 'POST', // or 'PUT'
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

          setWaitingSessions(data.sessions);

          setCourseName(data.usercourse.mnemonic +
                        data.usercourse.number + "(" +
                        data.usercourse.name + ")"
                        );

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




  const handleLogout = (e) =>{
    e.preventDefault();
    localStorage.clear();
    navigate(docRoot + '/');
  }

  const handleAssign = (e) =>{
    e.preventDefault();

    if(localStorage.getItem('asci-user') === null){
      navigate(docRoot + "/login");
    }

    else if(localStorage.getItem('asci-course') === null){
      navigate(docRoot + "/selectCourse");
    }
    else{
    
      //Get a student
      let request = {};
      request.command = "getStudentForTA";
      request.user = localStorage.getItem('asci-user');
      request.courseId = localStorage.getItem('asci-course');
      getStudent(request, url); 
    }
  }

  const handleTake = (e) =>{
    e.preventDefault();

    console.log("Handling specific student?");
    console.log("e is: " + e);
    console.log("value is: " + e.target.value);

    /* Need to send sessionId also... */

    if(localStorage.getItem('asci-user') === null){
      navigate(docRoot + "/login");
    }

    else if(localStorage.getItem('asci-course') === null){
      navigate(docRoot + "/selectCourse");
    }
    else{
    
      //Get a student
      let request = {};
      request.command = "takeSpecificStudentForTA";
      request.user = localStorage.getItem('asci-user');
      request.courseId = localStorage.getItem('asci-course');
      request.sessionId = waitingSessions[e.target.value].id;
      getStudent(request, url); 
    }

  }

  //This gets a student
  const getStudent = (json0, url0) =>{
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

    const handleClearQueueCallback = () => {
      console.log("Received callback. Refreshing queue page");
      pollNumWaiting();
    }


    const WaitTableHeaderRow = () => {
      return <tr><th>Pos</th><th>Subject</th><th>Issue</th><th>Location</th><th>Take</th></tr>;
    }


    const WaitTableRow = ({data}) => {
      return Object.keys(data).map(k =>
        <tr key={k}>
          <td>{k}</td><td>{data[k].issue_subject}</td><td>{data[k].issue}</td><td>{data[k].location}</td>
          <td><button value={k} onClick={handleTake}>Take</button></td>
        </tr>
      );
    }

    const WaitTable = ({data}) => {
      if(data.length > 0 && settings != null && settings.show_queue_list=="t"){
        return (
          <table>
            <WaitTableHeaderRow />
            <WaitTableRow data={data} />
          </table>
        );
      }
      else return;
    }

  return (
    <div className="question waitlist">
      <div>
        <h2>You are now handling students for <b>{courseName}</b></h2>
        <h5>There are <b>{numWaiting}</b> student(s) waiting.</h5>
      </div>
      <div>
        <button onClick={handleAssign}>get next student</button>
      </div>

      <div>
        <ClearQueue callback={handleClearQueueCallback} url={url} documentRoot={docRoot} user={user} courseId={courseId} />
      </div>

      <div>
        <WaitTable data={waitingSessions} />
      </div>

      <div>
        <h6>Missed a survey from an older meeting? Click here to go back and fill it out!</h6>
        <button onClick={() => navigate(docRoot + "/taSurvey")}>Go to survey</button>
      </div>
      
    </div>
  );
}

export default HandleStudent;