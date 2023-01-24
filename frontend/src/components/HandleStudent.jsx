import React from "react";
import {useEffect, useState} from "react";
import { useNavigate } from 'react-router-dom';

function HandleStudent() {
  // const [title, setTitle] = useState("question overview");
  // const [details, setDetails] = useState("question details");
  // const [purpose, setPurpose] = useState("");
  let user = null;
  let courseId = null;

  let url = 'http://localhost:8081/';

  const [assign, setAssign] = useState(true);
  const [numWaiting, setNumWaiting] = useState("Loading...");
  const navigate = useNavigate();

  useEffect(() => {
    //Ping the server and make sure this person is actually a TA
    console.log("TA: Checking if token exists");

    if(localStorage.getItem('asci-user') === null){
      navigate("/login");
    }

    else if(localStorage.getItem('asci-course') === null){
      navigate("/selectCourse");
    }

    else{
      user = localStorage.getItem('asci-user');
      courseId = localStorage.getItem('asci-course');

      pollNumWaiting();
    }
    
    
  }, []);

  let assignStudent = {
    command: assign
  }



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
        }
        else{
          console.log("Getting number waiting failed");
          navigate("/error");
        }
        
      })
      .catch((error) => {
        console.log("HOME: There was an error:", error);
        navigate("/error");
        
      });

    }




  const handleLogout = (e) =>{
    e.preventDefault();
    localStorage.clear();
    navigate('/');
  }

  const handleAssign = (e) =>{
    e.preventDefault();
    
    //Get a student
    let request = {};
    request.command = "getStudentForTA";
    request.user = user;
    request.courseId = courseId;
    getStudent(request, url); 
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
          navigate("/meeting");
        }
        else{
          console.log("TA: getting student failed for some reason");
          //TODO: Let the student know somehow??
        }
        
      })
      .catch((error) => {
        console.log("HOME: There was an error:", error);
        navigate("/error");
        
      });

    }

  return (
    <div className="question">
      <div>
        <h2>You are now handling students. There are {numWaiting} student(s) waiting.</h2>
      </div>
      <div>
        <h2>Assign me a student</h2>
        <button onClick={handleAssign}>find student</button>
      </div>
      
    </div>
  );
}

export default HandleStudent;