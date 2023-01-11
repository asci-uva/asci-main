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

    console.log("Checking if token exists");
    //If token is set, kick to home screen to check validity of session
    if (localStorage.getItem('asci-token') !== null) {
      console.log("it does, sending to home page");
      navigate("/");
    }
  }, []);
  
  
  let userInfo = {
    user : username,
    password: password,
  }

   
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
          localStorage.setItem('asci-user', data.userid);
          localStorage.setItem('asci-token', data.token);
          localStorage.setItem('asci-role', data.role);
          navigate('/');
        }
        else{
          console.log("LOGIN Failed");
          navigate('/login');
        }

        //navigate('/Login');
      })
      .catch((error) => {
        console.log("There was an error:", error);
        navigate("/error");
        
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
          value = {"user"}
          onChange={(e)=>setUsername(e.target.value)}
        />
        <label>Password</label>
        <textarea
          required
          value = {"pass"}
          onChange={(e)=>setPassword(e.target.value)}>
        </textarea>
        <button>Submit</button>
      </form>
    </div>
  );
}

export default Login;
