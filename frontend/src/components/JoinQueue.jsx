import React from "react";
import {useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';

function JoinQueue() {
  
  const navigate = useNavigate();
  
  let user = null;
  let courseId = null;
  
  const [details, setDetails] = useState("question details");
  

  let url = 'http://localhost:8081/index.php'; 
  
    //This function runs on page load!
    useEffect(() => {

      //Need to redo this. Check if user id and course id set already.
      //If not, back out quick!
      if(localStorage.getItem('asci-user') == null){
        navigate("/login");
      }
      else if(localStorage.getItem('asci-course') == null){
        navigate("/selectCourse");
      }
      else{

        //Just assume they are not in a queue for now...
        //Server will catch once they hit "Join Queue" if they are in another state
        console.log("Setting user and course id");
        user = localStorage.getItem('asci-user');
        courseId = localStorage.getItem('asci-course');
        console.log("User: " + user);
        console.log("courseId: " + courseId);
      }
    
    }, []);


  const handleLogout = (e) =>{
    e.preventDefault();
    //TODO: Add logout functionality?
    localStorage.clear();
    navigate('/');
  }

  const handleQuestion = (e) =>{
    e.preventDefault();

    if(localStorage.getItem('asci-user') == null){
      navigate("/login");
    }
    else if(localStorage.getItem('asci-course') == null){
      navigate("/selectCourse");
    }
    else{
      user = localStorage.getItem('asci-user');
      courseId = localStorage.getItem('asci-course');
    
      console.log("User: ", user);
      console.log("CourseId: ", courseId)
      console.log("Question: ", details);

      //JOIN THE QUEUE
      let request = {};
      request.command = "joinQueue";
      request.user = user;
      request.courseId = courseId;
      request.question = details;
      joinQueue(request, url); 
    }

  }

  //This function sends user to the queue
  const joinQueue = (json0, url0) =>{
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
        if(data.success === "true" && data.session != null){
          navigate("/studentWaitingRoom");
        }
        else{
          console.log("JQ: Error, joining the queue didn't succeed");
          navigate("/error");
        }
        
      })
      .catch((error) => {
        console.log("JQ: There was an error:", error);
        navigate("/error");
        
      });

    }


  return (
    <div className="question">
      <div>
      <h2>Hello Student</h2>
        <button onClick={handleLogout}>logoff</button>
      </div>
      <br></br>
      <form>
        <label>What is your question?</label>
        <textarea
          required
          value = {details}
          onChange={(e)=>setDetails(e.target.value)}>
        </textarea>
      </form>
      <div>
        <h2>Join the queue</h2>
        <button onClick={handleQuestion}>Join queue</button>
      </div>
    </div>
  );
}

export default JoinQueue;

