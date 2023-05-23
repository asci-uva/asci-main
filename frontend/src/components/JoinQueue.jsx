import React from "react";
import {useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';


function JoinQueue(props) {
  
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [courseId, setCourseId] = useState(null);

  const [subject, setSubject] = useState("");
  const [location, setLocation] = useState("");
  const [details, setDetails] = useState("");
  const [courseName, setCourseName] = useState("");
  const [groupOption, setGroupOption] = useState(true);

  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  

  let url = props.url;
  let docRoot = props.documentRoot; 
  
    //This function runs on page load!
    useEffect(() => {

      //Need to redo this. Check if user id and course id set already.
      //If not, back out quick!
      if(localStorage.getItem('asci-user') === null){
        navigate(docRoot + "/login");
      }
      else if(localStorage.getItem('asci-course') === null){
        navigate(docRoot + "/selectCourse");
      }
      else{

        setUser(localStorage.getItem('asci-user'));
        setCourseId(localStorage.getItem('asci-course'));
        
        //setup json command
        let request = {};
        request.command = "sessionPing";
        request.user = localStorage.getItem('asci-user');
        request.courseId = localStorage.getItem('asci-course');
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

          setCourseName(data.usercourse.mnemonic +
                        data.usercourse.number + "(" +
                        data.usercourse.name + ")"
                        );
          
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

  const handleCheck = e => {
    setGroupOption(!groupOption)
  }

  const handleQuestion = (e) =>{
    e.preventDefault();

    if(localStorage.getItem('asci-user') === null){
      navigate(docRoot + "/login");
    }
    else if(localStorage.getItem('asci-course') === null){
      navigate(docRoot + "/selectCourse");
    }
    else if(subject === ""){
      setIsError(true);
      setErrorMessage("Please enter an issue subject above");
    }
    else if(details === ""){
      setIsError(true);
      setErrorMessage("Please enter an issue explanation");
    }
    else if(location === ""){
      setIsError(true);
      setErrorMessage("Please enter a location above");
    }
    else{

      setIsError(false);
      setErrorMessage("");
    
      console.log("User: ", localStorage.getItem('asci-user'));
      console.log("CourseId: ", localStorage.getItem('asci-course'))
      console.log("Question: ", details);

      //JOIN THE QUEUE
      let request = {};
      request.command = "joinQueue";
      request.user = localStorage.getItem('asci-user');
      request.courseId = localStorage.getItem('asci-course');
      request.subject = subject;
      request.question = details;
      request.location = location;
      request.groupOption = groupOption.toString();

      
      //alert(groupoption);
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
      <h6>You have selected <b>{courseName}</b>. Enter your info below to join the queue.</h6>
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

        <div>
          <label>
            I would like to be placed in a group (this might decrease your wait time)
            <input
              type="checkbox"
              checked={groupOption}
              onChange={handleCheck}
            />
          </label>
        </div>
      </form>
      
      {isError &&
        <div className="error">
        <label><b>Error:</b> { errorMessage }</label>
        </div>
      }

      <div>
        <button onClick={handleQuestion}>Join queue</button>
      </div>

      <div>
        <h6>Forgot to fill out the survey from last time? Click here to go back and fill it out!</h6>
        <button onClick={() => navigate(docRoot + "/studentSurvey")}>Complete Survey</button>
      </div>
    </div>
    
  );
}



export default JoinQueue;

