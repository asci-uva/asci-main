import React from "react";
import {useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';

function JoinQueue(props) {
  
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  let courseId = null;

  const [subject, setSubject] = useState("");
  const [location, setLocation] = useState("");
  const [details, setDetails] = useState("");
  

  let url = props.url;
  let docRoot = props.documentRoot; 
  
    //This function runs on page load!
    useEffect(() => {

      //Need to redo this. Check if user id and course id set already.
      //If not, back out quick!
      if(localStorage.getItem('asci-user') == null){
        navigate(docRoot + "/login");
      }
      else if(localStorage.getItem('asci-course') == null){
        navigate(docRoot + "/selectCourse");
      }
      else{

        //Just assume they are not in a queue for now...
        //Server will catch once they hit "Join Queue" if they are in another state
        console.log("Setting user and course id");
        setUser(localStorage.getItem('asci-user'));
        courseId = localStorage.getItem('asci-course');
        console.log("User: " + localStorage.getItem('asci-user'));
        console.log("courseId: " + courseId);
      }
    
    }, []);


  const handleLogout = (e) =>{
    e.preventDefault();
    //TODO: Add logout functionality?
    localStorage.clear();
    navigate(docRoot + '/');
  }

  const handleQuestion = (e) =>{
    e.preventDefault();

    if(localStorage.getItem('asci-user') == null){
      navigate(docRoot + "/login");
    }
    else if(localStorage.getItem('asci-course') == null){
      navigate(docRoot + "/selectCourse");
    }
    else{
      setUser(localStorage.getItem('asci-user'));
      courseId = localStorage.getItem('asci-course');
    
      console.log("User: ", localStorage.getItem('asci-user'));
      console.log("CourseId: ", courseId)
      console.log("Question: ", details);

      //JOIN THE QUEUE
      let request = {};
      request.command = "joinQueue";
      request.user = localStorage.getItem('asci-user');
      request.courseId = courseId;
      request.subject = subject;
      request.question = details;
      request.location = location;
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
          navigate(docRoot + "/studentWaitingRoom");
        }
        else{
          console.log("JQ: Error, joining the queue didn't succeed");
          navigate(docRoot + "/error");
        }
        
      })
      .catch((error) => {
        console.log("JQ: There was an error:", error);
        navigate(docRoot + "/error");
        
      });

    }


  return (
    <div className="question">
      <div>
      <h2>Hello {user}</h2>
      </div>
      <br></br>
      <form>
        <label>Issue subject</label>
        <input
          type = "text"
          placeholder="Enter subject here"
          required
          value = {subject}
          onChange={(e)=>setSubject(e.target.value)}
        />

        <label>Please explain your issue in a few sentences before joining the queue.</label>
        <textarea
          placeholder="Enter your issue here"
          required
          value = {details}
          onChange={(e)=>setDetails(e.target.value)}>
        </textarea>

        <label>Where can the TA find you?</label>
        <input
          type = "text"
          placeholder="Enter location here"
          required
          value = {location}
          onChange={(e)=>setLocation(e.target.value)}
        />
      </form>
      <div>
        <button onClick={handleQuestion}>Join queue</button>
      </div>
    </div>
  );
}

export default JoinQueue;

