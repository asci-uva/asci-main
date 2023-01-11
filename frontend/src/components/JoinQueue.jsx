import React from "react";
import {useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';

function JoinQueue() {
  // const [title, setTitle] = useState("question overview");
  // const [details, setDetails] = useState("question details");
  // const [purpose, setPurpose] = useState("");
  const navigate = useNavigate();
  
  let user = "";
  let token = "";
  const [purpose, setPurpose] = useState(0);
  const [details, setDetails] = useState("question details");
  const [courses, setCourses] = useState({
      0: "Select course..."
    });

  let url = 'http://localhost:8081/index.php'; 
  
    //This function runs on page load!
    useEffect(() => {

      console.log("JoinQueue: Checking if token exists");
      console.log("Courses is:", courses);
      //If token is set, kick to home screen to check validity of session
      if (localStorage.getItem('asci-token') !== null) {
        //try to get the user's courses
        user = localStorage.getItem('asci-user');
        token = localStorage.getItem('asci-token');

        //setup json command
        let request = {};
        request.command = "getCourses";
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

            console.log("JQ: Successfully fetched courses");
            let c = {0: "Select course..."}
            for(var key in data.courses){
              c[key] = data.courses[key];
            }

            setCourses(c);
            
          }
          else{
            console.log("JQ: Session not active");
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
    //TODO: Add logout functionality?
    localStorage.clear();
    navigate('/');
  }

  const handleQuestion = (e) =>{
    e.preventDefault();
    //TODO: Add student question
    console.log("Course id: ", purpose);
    console.log("Course name: ", courses[purpose])
    console.log("Question: ", details);

    //JOIN THE QUEUE
    let request = {};
    request.command = "joinQueue";
    request.user = user;
    request.token = token;
    request.courseId = purpose;
    request.question = details;
    joinQueue(request, url); 

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

        /* If user is somehow not logged in, kick to home page */
        if(data.loggedIn !== "true"){
          navigate("/");
        }
        else{

          //if request succeeded
          if(data.success === "true"){
            navigate("/studentWaitingRoom");
          }
          else{
            console.log("JQ: Error, joining the queue didn't succeed");
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
      <h2>Hello Student</h2>
        <button onClick={handleLogout}>logoff</button>
      </div>
      <br></br>
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

