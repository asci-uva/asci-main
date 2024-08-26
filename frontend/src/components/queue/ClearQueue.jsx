import React from "react";
import {useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';
import { useUser } from "../context/UserContext";

function ClearQueue(props) {

  const [clearState, setClearState] = useState(0);

  const navigate = useNavigate();

  let {user, getCourse} = useUser();
  let course = getCourse();

  let url = props.url;
  let docRoot = props.documentRoot;
  let callback = props.callback;


  const handleClearClick = (e) =>{
    e.preventDefault();

    console.log("Clearing queue, user is: " + user);
    console.log("Clearing queue, courseId is: " + course);
    console.log("Clearing queue, docRoot is: " + docRoot);
    console.log("Clearing queue, url is: " + url);
    console.log("Clearing queue, callback is: " + callback);

    if(clearState == 0){
      setClearState(1);
    }
    else if(clearState == 1){
      console.log("Time to clear the queue");
      setClearState(2);

      //Call the clear queue method
      let request = {};
      request.command = "clearQueue";
      request.user = user.userid;
      request.courseId = course.course_id;
      clearQueue(request, url); 
    }

  }

  const cancelClearClick = (e) =>{
    e.preventDefault();

    setClearState(0);


  }

  const clearQueue = (json0, url0) =>{
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

          setClearState(0);

          /* TODO: Callback to the parent component */
          console.log("CALLBACK SHOULD BE HERE");
          callback();
        }
        else{
          console.log("Clearing queue failed");
          setClearState(4);
        }

      })
      .catch((error) => {
        console.log("HOME: There was an error:", error);
        navigate(docRoot + "/error");

      });

  }






  if(clearState == 0){

    return (
      <div>
        <p>Need to clear the queue?</p>
        <button onClick={handleClearClick} className="btn btn-warning">Clear Queue</button>
      </div>
    );
  }

  else if(clearState == 1){
    return (
      <div>
        <p>Are you SURE you want to clear the queue?</p>
        <button onClick={cancelClearClick} className="btn btn-success">No</button> &nbsp;
        <button onClick={handleClearClick} className="btn btn-warning">Yes, Clear Queue</button>
      </div>
    );
  }
  else if(clearState == 2){
    return (
      <div>
        <p>Clearing queue. Please wait...</p>
      </div>
    );
  }
  else if(clearState == 4){
    return (
      <div>
        <p>Clearing failed.</p>
        <button onClick={cancelClearClick} className="btn btn-success">Continue</button>
      </div>
    );
  }
}

export default ClearQueue;

