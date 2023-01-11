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

    	console.log("Checking if token exists");
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
          let result = checkSession(request, url);
          if(result === true){
          	//send to proper page
          	console.log("Session updated. Sending to question page");
          	navigate("/question")
          }
          else{
          	//kick to login page
          	console.log("Session not active, kicking to login page");
          	//navigate("/login");
          }
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
	        console.log(data);
	        let success = data.success;
	        if(success == "true"){

	          console.log("Session is active");
	          localStorage.setItem('asci-user', data.userid);
	          localStorage.setItem('asci-token', data.token);
	          localStorage.setItem('asci-role', data.role);
	          return true;
	        }
	        else{
	          console.log("Session not active");
	          return false;
	        }
	      })
	      .catch((error) => {
	        console.log("There was an error:", error);
	        navigate("/error");
	        
	      });
	}


	  return (
	    <div className="question">
	          <h1 className="font-weight-light">Welcome to the ASCI-Queue</h1>
	          <p>This page should redirect you soon...</p>    
	    </div>
	  );
	}

export default Home;