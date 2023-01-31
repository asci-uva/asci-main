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

function Home(props) {

	const navigate = useNavigate();

	let docRoot = props.documentRoot;
	let url = props.url; 
  
  	//This function runs on page load!
  	useEffect(() => {

  		console.log("ENTERING HOME");
    	
  		//need to redo this. check user set and course set first
  		if(localStorage.getItem('asci-user') === null){
  			console.log("User is NOT set, navigating home");
  			navigate(docRoot + "/login");
  		}
  		else if(localStorage.getItem('asci-course') === null){
  			console.log("Course is NOT set, navigating to selectCourse");
  			navigate(docRoot + "/selectCourse");
  		}
  		else{



  			//Ok, ping the session and send the user to the proper
  			//page based on their status
  			let user = localStorage.getItem('asci-user');
       	let courseId = localStorage.getItem('asci-course');

       	console.log("All is fine, pinging session");
       	console.log("user, " + user);
       	console.log("courseId, " + localStorage.getItem('asci-course'));

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
	          navigate(docRoot + "/error");
	        }
	      })
	      .catch((error) => {
	        console.log("HOME: There was an error:", error);
	        navigate(docRoot + "/error");
	        
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
          		navigate(docRoot + "/joinQueue");
          	}
          	else if(status === "waiting"){
          		navigate(docRoot + "/studentWaitingRoom");
          	}
          	else if(status === "in_progress"){
          		navigate(docRoot + "/studentMeeting");
          	}
          }
          else if(role === "ta"){
          	if(status === "none"){
          		navigate(docRoot + "/handleStudent");
          	}
          	else if(status === "in_progress"){
          		navigate(docRoot + "/meeting");
          	}
          }
          else{
          	//kick to login page
          	console.log("HOME: Something went wrong, role is not student or ta");
          	navigate(docRoot + "/error");
          }
	}


	  return (
	    <div className="question">
	          
	    </div>
	  );
	}

export default Home;