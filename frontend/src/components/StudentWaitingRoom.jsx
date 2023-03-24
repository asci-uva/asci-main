import React from "react";
import {useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';

function StudentWaitingRoom(props) {

	const navigate = useNavigate();

	const [position, setPosition] = useState(-1);
	const [courseName, setCourseName] = useState("...");
  const [minsWaiting, setMinsWaiting] = useState("...");
	
	//variables for managing polling the server
	let polling = false;
	let timeoutId = 0;

	let user = null;
	let courseId = null;

	let url = props.url;
  let docRoot = props.documentRoot; 
  
    //This function runs on page load!
    useEffect(() => {

      //Make sure id and course are set
      if(localStorage.getItem('asci-user') === null){
        navigate(docRoot + "/login");
      }
      else if(localStorage.getItem('asci-course') === null){
        navigate(docRoot + "/selectCourse");
      }
      else{

        console.log("StudWait: Setting user and course id");
        user = localStorage.getItem('asci-user');
        courseId = localStorage.getItem('asci-course');
        console.log("StudWait: User: " + user);
        console.log("StudWait: Course: " + courseId);

      	console.log("waiting room mounted, start polling");
      	polling = true;
      	poll();
      }

    	//called when this component unmounts
    	return () => {
            console.log("Waiting room: Stopping polling");
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

     		console.log("waitingRoom...polling for queue position");

        user = localStorage.getItem('asci-user');
        courseId = localStorage.getItem('asci-course');
        
        //setup json command
        let request = {};
        request.command = "getQueueStatus";
        request.user = user;
        request.courseId = courseId;
        getStatus(request, url); 

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
          	console.log("Waiting room: Something went wrong");          	
            navigate(docRoot + "/error");
          }

          else if(data.session === null){
            console.log("Student doesn't have a session");
            navigate(docRoot + "/joinQueue");
          }

          else if(data.session.status === "in_progress"){
            console.log("Being helped now!");
            navigate(docRoot + "/studentMeeting");
          }

          else if(data.session.status === "waiting"){
            console.log("WR: Displaying new queue position");
            setCourseName(data.usercourse.name);
            setPosition(5);
            
            //Get the start date
            console.log("Date now is: " + Date.now());
            console.log("Date of entry time is: " + (new Date(data.session.entry_time).getTime()));
            let waitTime = parseInt((Date.now() - (new Date(data.session.entry_time).getTime())) / 1000 / 60, 10);
            setMinsWaiting(waitTime);
            

            if(polling == true){
            	console.log("WR: Setting timeout for next poll");
            	timeoutId = setTimeout(poll, 10000);
        	  }
          }

          else{
            console.log("StudentWaitingRoom: Something went wrong!");
            navigate(docRoot + "/error");
          }
          
        })
        .catch((error) => {
          console.log("Waiting room: There was an error:", error);
          navigate(docRoot + "/error");
          
        });
  	}

  	const leaveQueue = (e) =>{
	    e.preventDefault();
    
      if(localStorage.getItem('asci-user') === null){
        navigate(docRoot + "/login");
      }
      else if(localStorage.getItem('asci-course') === null){
        navigate(docRoot + "/selectCourse");
      }
      else{

        user = localStorage.getItem('asci-user');
        courseId = localStorage.getItem('asci-course');	    

  	    //JOIN THE QUEUE
  	    let request = {};
  	    request.command = "leaveQueue";
        
  	    request.user = user;
        request.courseId = courseId;
  	    reqLeaveQueue(request, url); 
      }

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
            navigate(docRoot + "/joinQueue");
          }
          else{
          	console.log("Leaving queue failed");
          	navigate(docRoot + "/error");
          }

          
        })
        .catch((error) => {
          console.log("Waiting room: There was an error leaving the queue:", error);
          navigate(docRoot + "/error");
          
        });
  	}

  
	return (
		<div className="question">
			<div>
	  		<h4>You are currently in the queue for { courseName }. A TA Will be with you shortly. </h4>
        <h6>You have been waiting for <b>{minsWaiting} minutes</b></h6>
	  	</div>
		  	<div>
        		<button onClick={leaveQueue}>Leave queue</button>
      	</div>
		</div>
	);
}

export default StudentWaitingRoom;