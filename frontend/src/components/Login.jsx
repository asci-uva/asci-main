import React from "react";
import {useState, useEffect} from "react";
import { useNavigate} from 'react-router-dom';


//https://www.youtube.com/watch?v=IkMND33x0qQ
function Login(props) {
  const [username, setUsername] = useState("user name");
  const navigate = useNavigate();

  let url0 = props.url; 
  let docRoot = props.documentRoot;

  let debugMode = props.debugMode;
  
  useEffect(() => {

    console.log("Checking if user name already set");
    
    //If username is set in browser, don't do anything and just route to selectPage
    if (localStorage.getItem('asci-user') !== null) {
      console.log("it does, sending to home page");
      navigate(docRoot + "/selectCourse");
    }
    else{

      //If debugMode enabled, ping the server to find out who this user is
      if(!debugMode){
        login();
      }
      //If netbadge not enabled, then just wait for user to type something into the box

    }
  }, []);
  
  
  let userInfo = {
    user : username,
  }

   
  
  //server address
  //data will be a json file
  const sendJson = (json0, url0) =>{
    fetch(url0, {
      method: 'POST', // or 'PUT'
      headers: {
        'Content-Type': 'application/json',
      },
      body: json0,
    }).then(response => response.json())
    .then(data => {
        console.log("Response from server");
        console.log(data);
        let success = data.success;
        if(success == "true"){

          console.log("LOGIN Successful");
          localStorage.setItem('asci-user', data.computing_id); 
          localStorage.setItem('asci-course', null);         
          navigate(docRoot + '/selectCourse');
        }
        else{
          console.log("LOGIN Failed");
          navigate(docRoot + '/error');
        }

      })
      .catch((error) => {
        console.log("There was an error:", error);
        navigate(docRoot + "/error");
        
      });
  }
  
  const handleSubmit = (e) =>{
    e.preventDefault();
    login();
  }

  function login(){
    let json = {};
    json.command = "login";
    json.user = userInfo.user;

    let jsonString = JSON.stringify(json);
    console.log(jsonString);
    sendJson(jsonString,url0);
  }


  //RENDERING
  if(debugMode){
    return (
      <div className="question">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <label>Username</label>
          <input
            type = "text"
            required
            value = {username}
            onChange={(e)=>setUsername(e.target.value)}
          />
          <button>Submit</button>
        </form>
      </div>
    );
  }
  else{
    return (
      <div className="question">
        <h2>Redirecting to netbadge login...</h2>
      </div>
    );
  }
}

export default Login;
