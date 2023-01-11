import React from "react";
import {useState, useEffect} from "react";
import { useNavigate} from 'react-router-dom';


//https://www.youtube.com/watch?v=IkMND33x0qQ
function Login() {
  const [username, setUsername] = useState("user name");
  const [password, setPassword] = useState("password");
  const [command, setCommand] = useState("unknown");
  const navigate = useNavigate();
  
  useEffect(() => {
    if (localStorage.getItem('loggedin')==="true") {
      //right now redirect to the previous page
      //TODO: should it be redirecting to Ta/Student page
      //navigate(-1);
    } else {
    }
  }, []);
  
  
  let userInfo = {
    user : username,
    password: password,
  }

  // we assume a success response aka 'data' value will look like this
  // {"username":"aa0123", "login":"yes"}
  // note: not tested yet
  
  // #TODO: add a server address?
  let url0 = 'http://localhost:8081/index.php'; 
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
        console.log(data);
        let success = data.success;
        if(success == "true"){
          console.log("LOGIN Successful");
          localStorage.setItem('loggedin', 'true');
          navigate('/joinQueue');
        }
        else{
          console.log("LOGIN Failed");
          navigate('/login');
        }
        //localStorage.setItem('authorizedTA', 'true');
        //localStorage.setItem('loggedin', 'true');
        //navigate('/Login');
      })
      .catch((error) => {
        console.log("There was an error:", error);
        
      });
  }
  
  const handleSubmit = (e) =>{
    e.preventDefault();
    let json = {};
    json.command = "login";
    json.userInfo = userInfo;

    let jsonString = JSON.stringify(json);
    console.log(jsonString);
    sendJson(jsonString,url0);
  }

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
        <label>Password</label>
        <textarea
          required
          value = {password}
          onChange={(e)=>setPassword(e.target.value)}>
        </textarea>
        <label>New to the queue?</label>
        <select 
          value={command}
          onChange={(e)=>setCommand(e.target.value)}>
          <option value="Assignment">Register</option>
          <option value="Login">Login</option>
        </select>
        <button>Submit</button>
      </form>
    </div>
  );
}

export default Login;
