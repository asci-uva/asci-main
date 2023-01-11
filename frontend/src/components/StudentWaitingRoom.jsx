import React from "react";
import {useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';

function StudentWaitingRoom() {

	const navigate = useNavigate();

	const [position, setPosition] = useState(-1);
	const [courseName, setCourseName] = useState("...");

	let user = "";
	let token = "";
	let polling = false;
	let url = 'http://localhost:8081/index.php'; 
  
    //This function runs on page load!
    useEffect(() => {
    	polling = true;
    	poll();
      
    }, []);

    

 	function poll(){

 		console.log("waitingRoom...polling for queue position");

	      //Make sure token is set, otherwise kick to login
	      if (localStorage.getItem('asci-token') !== null) {
	        
	        //try to get the users info first
	        user = localStorage.getItem('asci-user');
	        token = localStorage.getItem('asci-token');

	        //setup json command
	        let request = {};
	        request.command = "getQueueStatus";
	        request.user = user;
	        request.token = token;
	        getStatus(request, url); 
	      }
	      else{
	      	polling = false;
	        navigate("/login");
	      }
 	}

    //This function checks the users queue status and updates things
    const getStatus = (json0, url0) =>{
      fetch(url0, {
        method: 'POST', // or 'PUT'
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(json0),
      }).then(response => response.json())
      .then(data => {
          console.log("Data is: ", data);
          
          if(data.success !== "true"){
          	console.log("Waiting room: Session not active");
          	polling = false;
            navigate("/");
          }

          if(data.onQueue !== "true"){
          	console.log("Waiting room: Student not on a queue");
          	polling = false;
          	navigate("/");
          }

          if(data.loggedIn !== "true"){
          	console.log("Student isn't logged in!");
          	polling = false;
          	navigate("/");
          }

          if(data.beingHelped === "true"){
          	console.log("Waiting room: Student is being helped now!");
          	polling = false;
          	navigate("/studentMeeting");
          }

          //whew, made it. Display the course name and queue position
          setCourseName(data.courseName);
          setPosition(data.queuePosition);

          if(polling === true){
          	setTimeout(poll, 7000);
      	  }
          
        })
        .catch((error) => {
          console.log("Waiting room: There was an error:", error);
          polling = false;
          navigate("/error");
          
        });
  	}

  	const leaveQueue = (e) =>{
	    e.preventDefault();
	    //TODO: Add student question
	    

	    //JOIN THE QUEUE
	    let request = {};
	    request.command = "leaveQueue";
	    request.user = user;
	    request.token = token;
	    reqLeaveQueue(request, url); 

  	}

  	//This function attempts to leave the queue
    const reqLeaveQueue = (json0, url0) =>{
      fetch(url0, {
        method: 'POST', // or 'PUT'
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(json0),
      }).then(response => response.json())
      .then(data => {
          console.log("Data is: ", data);
          
          if(data.success === "true"){
          	console.log("Left queue");
          	polling = false;
            navigate("/");
          }
          else{
          	console.log("Leaving queue failed");
          	polling = false;
          	navigate("/error");
          }

          
        })
        .catch((error) => {
          console.log("Waiting room: There was an error leaving the queue:", error);
          polling = false;
          navigate("/error");
          
        });
  	}

  
	return (
		<div className="waitingRoom">
			<div>
	  		<h2>Please wait for your TA. You are in position { position } for { courseName } </h2>
	  		</div>
		  	<div>
        		<h2>Click here to leave the queue</h2>
        		<button onClick={leaveQueue}>Leave queue</button>
      		</div>
		</div>
	);
}

export default StudentWaitingRoom;