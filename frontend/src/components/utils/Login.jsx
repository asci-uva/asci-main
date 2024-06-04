import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

//https://www.youtube.com/watch?v=IkMND33x0qQ
function Login(props) {
  const [username, setUsername] = useState("user name");
  const navigate = useNavigate();
  const { login } = useUser();

  let url0 = props.url;
  let docRoot = props.documentRoot;

  let debugMode = props.debugMode;

  useEffect(() => {
    console.log("Checking if user name already set");

    //If username is set in browser, don't do anything and just route back to the homepage
    if (localStorage.getItem("asci-user") !== null) {
      console.log("it does, sending to home page");
      navigate(docRoot);
    } else {
      //If debugMode enabled, ping the server to find out who this user is
      if (!debugMode) {
        handleLogin();
      }
      //If netbadge not enabled, then just wait for user to type something into the box
    }
  }, []);

  const handleLogin = () => {
    login({ user: username }, (success) => {
      if (success) {
        navigate(docRoot);
      } else {
        navigate(docRoot + "/error");
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin();
  };

  //RENDERING
  if (debugMode) {
    return (
      <div className="container p-4">
        <div className="row my-auto">
        <div className="col-md-4">
        <h1><i className="bi-door-open big-icon"></i></h1>
        <h2>Login</h2>
        <p>Please log in with your computing ID</p>
        </div>
      <div className="col-md-8 my-auto">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
          <label className="form-label">Username</label>
          <input
            type="text"
            id="username"
            className="form-control"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
      </div>
          <button className="btn btn-primary">Submit</button>
        </form>
      </div>
        </div>
        </div>
    );
  } else {
    return (
      <div className="container">
        <h2>Redirecting to netbadge login...</h2>
      </div>
    );
  }
}

export default Login;
