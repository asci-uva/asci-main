import React from "react";
import {useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';

function Ta() {
  
  const navigate = useNavigate();
  
  let user = "";
  let token = "";
  
  const [purpose, setPurpose] = useState(0);
  const [courses, setCourses] = useState({
      0: "Select course..."
    });

  let url = 'http://localhost:8081/index.php'; 
  

  useEffect(() => {
    //Ping the server and make sure this person is actually a TA
    console.log("TA: Checking if token exists");
    
    //If token is set, kick to home screen to check validity of session
    if (localStorage.getItem('asci-token') !== null) {
      //try to get the user's courses
      user = localStorage.getItem('asci-user');
      token = localStorage.getItem('asci-token');

      //setup json command
      let request = {};
      request.command = "getTACourses";
      request.user = user;
      request.token = token;
      getCourses(request, url); 
    }
    else{
      navigate("/login");
    }
    
  }, []);


  //This function checks the users session
  const getCourses = (json0, url0) =>{
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

          console.log("TA: Successfully fetched courses");
          let c = {0: "Select course..."}
          for(var key in data.courses){
            c[key] = data.courses[key];
          }

          setCourses(c);
          
        }
        else{
          console.log("TA: Session not active or some other problem detected by server");
          navigate("/");
        }
      })
      .catch((error) => {
        console.log("JQ: There was an error:", error);
        navigate("/error");
        
      });
  }

  const handleLogout = (e) =>{
    e.preventDefault();
    localStorage.clear();
    navigate('/login');
  }

  const handleWork = (e) =>{
    e.preventDefault();
    console.log("Course id: ", purpose);
    console.log("Course name: ", courses[purpose])

    //Start Working
    let request = {};
    request.command = "startTAWorking";
    request.user = user;
    request.token = token;
    request.courseId = purpose;
    startWork(request, url); 
  }

  //This function starts TA working
  const startWork = (json0, url0) =>{
    fetch(url0, {
      method: 'POST', // or 'PUT'
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(json0),
    }).then(response => response.json())
    .then(data => {
        console.log("Data is: ", data);

        /* If user is somehow not logged in, kick to home page */
        if(data.loggedIn !== "true"){
          navigate("/");
        }
        else{

          //if request succeeded
          if(data.success === "true"){
            navigate("/handleStudent");
          }
          else{
            console.log("TA: Starting work did not succeed");
            navigate("/");
          }
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
        <h2>You are now logged in as CSTA</h2>
        <button onClick={handleLogout}>logoff</button>
        
      </div>

      <form>
      <label>Which Class Are You Here For?</label>
        <select 
          value={purpose}
          onChange={(e)=>setPurpose(e.target.value)}>
          {Object.keys(courses).map(
                k => (
                <option key={k} value={k}>
                    {courses[k]}
                </option>
                )
          )}
        </select>
        <button onClick={handleWork}>Start working</button>
      </form>
      
    </div>
  );
}

export default Ta;