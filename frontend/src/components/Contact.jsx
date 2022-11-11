import React from "react";
import {useState} from "react";
import { useNavigate } from 'react-router-dom';


//https://www.youtube.com/watch?v=IkMND33x0qQ
function Contact() {
  const [username, setUsername] = useState("user name");
  const [passwd, setPasswd] = useState("password");
  const [purpose, setPurpose] = useState("unknown");
  const navigate = useNavigate();
  let userInfo = {
    command : username,
    // password: passwd,
    // category : purpose
  }
  let json0;

  // we assume a success response aka 'data' value will look like this
  // {"username":"aa0123", "login":"yes"}
  // note: not tested yet
  
  // #TODO: add a server address?
  let url0 = 'http://localhost:8081/'; 
  //server address
  //data will be a json file
  const sendJson = (json0, url0) =>{
    fetch(url0, {
      method: 'POST', // or 'PUT'
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: json0,
    }).then((response) => response.json())
      .then((data) => {
        console.log(data);
        // if (data.login==="yes") {
        //   navigate('/question');
        // } else {
        //   console.log('Failure or error');
        // }
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }
  
  const handleSubmit = (e) =>{
    e.preventDefault();
    json0 = JSON.stringify(userInfo);
    console.log(json0);
    sendJson(json0,url0);
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
          value = {passwd}
          onChange={(e)=>setPasswd(e.target.value)}>
        </textarea>
        <label>New to the queue?</label>
        <select 
          value={purpose}
          onChange={(e)=>setPurpose(e.target.value)}>
          <option value="Assignment">Register</option>
          <option value="Logistic">Login</option>
        </select>
        <button>Submit</button>
      </form>
    </div>
  );
}

export default Contact;
