import React from "react";
import {useEffect, useState} from "react";
import { useNavigate } from 'react-router-dom';

function HandleStudent(props) {
  
  let user = null;
  let courseId = null;

  //variables for managing polling the server
  let polling = false;
  let timeoutId = 0;
  //----------------------

  let url = props.url; 
  let docRoot = props.documentRoot;

  const [assign, setAssign] = useState(true);
  const [numWaiting, setNumWaiting] = useState("Loading...");
  const [courseName, setCourseName] = useState("Loading...");
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
      user = localStorage.getItem('asci-user');
      courseId = localStorage.getItem('asci-course');

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



  function pollNumWaiting(){
    //Get a student
    let request = {};
    request.command = "getNumberWaiting";
    request.user = localStorage.getItem('asci-user');
    request.courseId = localStorage.getItem('asci-course');
    getNumWaiting(request, url); 
  }

  //This gets a student
  const getNumWaiting = (json0, url0) =>{
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
          setNumWaiting(data.waiting);

          setCourseName(data.usercourse.mnemonic +
                        data.usercourse.number + "(" +
                        data.usercourse.name + ")"
                        );

          if(polling == true){
              timeoutId = setTimeout(pollNumWaiting, 30000);
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
            navigate(docRoot + "/meeting");
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

  return (
    <div className="question">
      <div>
        <h2>You are now handling students for <b>{courseName}</b></h2>
        <h5>There are <b>{numWaiting}</b> student(s) waiting.</h5>
      </div>
      <div>
        <button onClick={handleAssign}>get next student</button>
      </div>

      <div>
        <h6>Missed a survey from an older meeting? Click here to go back and fill it out!</h6>
        <button onClick={() => navigate(docRoot + "/taSurvey")}>Go to survey</button>
      </div>
      
    </div>
  );
}

export default HandleStudent;