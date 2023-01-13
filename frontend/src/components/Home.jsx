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

    	console.log("HOME: Checking if token exists");
	    //If token is set, kick to home screen to check validity of session
	    if (localStorage.getItem('asci-token') !== null) {
	      //user seems to be logged in. Let's check if session is valid
	      //first grab the items from localstorage
	      let user = localStorage.getItem('asci-user');
          let token = localStorage.getItem('asci-token');

          //setup json command
          let request = {};
          request.command = "sessionPing";
          request.user = user;
          request.token = token;
          checkSession(request, url); 
	    }
	    else{
	    	navigate("/login");
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

	          console.log("HOME: Session is active");
	          localStorage.setItem('asci-user', data.userid);
	          localStorage.setItem('asci-token', data.token);
	          routeToCorrectPage(true, data);
	        }
	        else{
	          console.log("HOME: Session not active");
	          routeToCorrectPage(false);
	        }
	      })
	      .catch((error) => {
	        console.log("HOME: There was an error:", error);
	        navigate("/error");
	        
	      });
	}

	//This function routes them to correct page
  	function routeToCorrectPage(result, data){
	    if(result === true && data.role === "student"){
          	//send to proper page
          	console.log("HOME: Session updated. Sending to correct next page");
          	console.log("HOME: State is ", data.state);
          	//based on queuestate, send to correct page
          	if(data.state === "none"){
          		navigate("/joinQueue");
          	}
          	else if(data.state === "onQueue"){
          		navigate("/studentWaitingRoom");
          	}
          	else if(data.state === "beingHelped"){
          		navigate("/studentMeeting");
          	}
          }
          else if(result === true && data.role === "ta"){
          	if(data.state === "none"){
          		navigate("/ta");
          	}
          	else if(data.state === "working"){
          		navigate("/handleStudent");
          	}
          	else if(data.state === "helping"){
          		navigate("/meeting");
          	}
          }
          else{
          	//kick to login page
          	console.log("HOME: Session not active, kicking to login page");
          	navigate("/login");
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