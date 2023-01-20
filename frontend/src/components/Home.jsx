import React from "react";
//import {useState, useEffect} from "react";
import {useEffect} from "react";
import { useNavigate} from 'react-router-dom';

//This page needs to:
	//See if student is logged in and kick to login page if not
	//If, logged in, reset student info and kick to appropriate state page
		//join queue if not on queue
		//waiting if waiting on queue
		//with TA if being helped
		//

function Home() {

	const navigate = useNavigate();
	let url = 'http://localhost:8081/index.php'; 
  
  	//This function runs on page load!
  	useEffect(() => {

    	
  		//need to redo this. check user set and course set first
  		if(localStorage.getItem('asci-user') === null){
  			navigate("/login");
  		}
  		else if(localStorage.getItem('asci-course') === null){
  			navigate("/selectCourse");
  		}
  		else{

  			//Ok, ping the session and send the user to the proper
  			//page based on their status
  			let user = localStorage.getItem('asci-user');
         	let courseId = localStorage.getItem('asci-course');

         	//setup json command
			let request = {};
			request.command = "sessionPing";
			request.user = user;
			request.courseId = courseId;
			checkSession(request, url); 
  		}

  	}, []);

  	//This function checks the users session
  	const checkSession = (json0, url0) =>{
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

	          console.log("HOME: Received session, routing to correct page");
	          
	          routeToCorrectPage(data);
	        }
	        else{
	          console.log("HOME: Server returned error");
	          navigate("/error");
	        }
	      })
	      .catch((error) => {
	        console.log("HOME: There was an error:", error);
	        navigate("/error");
	        
	      });
	}

	//This function routes them to correct page
  	function routeToCorrectPage(data){
  		let role = data.usercourse.role;
  		let status = "none";
  		if(data.session !== null){
  			status = data.session.status;
  		}

  		console.log("HOME: role is: " + role);
  		console.log("HOME: status is: " + status);

	    if(role === "student"){
          	
          	//based on queuestate, send to correct page
          	if(status === "none"){
          		console.log("Navigating to join queue");
          		navigate("/joinQueue");
          	}
          	else if(status === "waiting"){
          		navigate("/studentWaitingRoom");
          	}
          	else if(status === "in_progress"){
          		navigate("/studentMeeting");
          	}
          }
          else if(role === "ta"){
          	if(status === "none"){
          		navigate("/ta");
          	}
          	else if(status === "in_progress"){
          		navigate("/meeting");
          	}
          }
          else{
          	//kick to login page
          	console.log("HOME: Something went wrong, role is not student or ta");
          	navigate("/error");
          }
	}


	  return (
	    <div className="question">
	          <h1 className="font-weight-light">Welcome to the ASCI-Queue</h1>
	          <p>This page should redirect you soon...</p>    
	    </div>
	  );
	}

export default Home;