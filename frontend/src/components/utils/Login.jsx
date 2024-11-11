import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

//https://www.youtube.com/watch?v=IkMND33x0qQ
function Login(props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const navigate = useNavigate();
  const { login } = useUser();

  let docRoot = props.documentRoot;

  let passwordAuth = props.passwordAuth;

  useEffect(() => {

    //If passwordAuth not enabled, then try to use Apache login credentials 
    if (!passwordAuth) {
      handleLogin();
    }
    else{
      //If passwordAuth enabled, then just wait for user to type something into the box
    }
    
  }, []);

  const handleLogin = () => {
    login({ user: username, password: password }, (success, message) => {
      if (success) {
        navigate(docRoot);
      } else {
        setErrorMessage(message);
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin();
  };

  const LoginError = () => {
    if (errorMessage) {
      return (
        <div className="alert alert-danger" role="alert">{errorMessage}</div>
      );
    }
  }


  //RENDERING
  if (passwordAuth) {
    return (
      <div className="container p-4">
        <div className="row my-auto">
          <div className="col-md-4">
            <h1><i className="bi-door-open big-icon"></i></h1>
            <h2>Login</h2>
            <p>Please log in with your user name and password</p>
          </div>
          <div className="col-md-8 my-auto">
            <form onSubmit={handleSubmit}>
              <LoginError/>
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  id="username"
                  className="form-control"
                  required
                  value={username}
                  placeholder="User Name"
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  id="password"
                  className="form-control"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
