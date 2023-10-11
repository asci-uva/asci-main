import React from "react";
import {useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';

function ClearQueue(props) {
  
  const [clearState, setClearState] = useState(0);

  const navigate = useNavigate();


  let user = props.user;
  let courseId = props.courseId;
  let url = props.url;
  let docRoot = props.documentRoot;
  let callback = props.callback;
  

  const handleClearClick = (e) =>{
    e.preventDefault();

    console.log("Clearing queue, user is: " + user);
    console.log("Clearing queue, courseId is: " + courseId);
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
      request.user = localStorage.getItem('asci-user');
      request.courseId = localStorage.getItem('asci-course');
      clearQueue(request, url); 
    }


  }

  const cancelClearClick = (e) =>{
    e.preventDefault();

    setClearState(0);


  }

  


  //This gets a student
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
          
        }
        
      })
      .catch((error) => {
        console.log("HOME: There was an error:", error);
        navigate(docRoot + "/error");
        
      });

    }






  if(clearState == 0){

  return (
    <div className="question">
      <div>
      <h4>Need to clear the queue?</h4>
      </div>
      <div>
        <button onClick={handleClearClick}>Clear Queue</button>
      </div>
    </div>
    );
  }

  else if(clearState == 1){
    return (
    <div className="question">
      <div>
      <h3>Are you SURE you want to clear the queue?</h3>
      </div>
      <div>
        <button onClick={cancelClearClick}>No</button>
        <button onClick={handleClearClick}>Yes, Clear Queue</button>
      </div>
    </div>
    );
  }
  else if(clearState == 2){
    return (
    <div className="question">
      <div>
      <h3>Clearing queue. Please wait...</h3>
      </div>
    </div>
    );
  }
}

export default ClearQueue;

