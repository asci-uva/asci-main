import React from "react";
import {useState} from "react";

//https://www.youtube.com/watch?v=IkMND33x0qQ
function Contact() {
  const [username, setUsername] = useState("user name");
  const [passwd, setPasswd] = useState("password");
  const [purpose, setPurpose] = useState("unknown");
  let userInfo = {
    name : username,
    password: passwd,
    category : purpose
  }
  let json0;

  const handleSubmit = (e) =>{
    e.preventDefault();
    json0 = JSON.stringify(userInfo);
    console.log(json0);
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
