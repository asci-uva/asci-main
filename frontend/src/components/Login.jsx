import React from "react";
import {useState, useEffect} from "react";
import { useNavigate} from 'react-router-dom';


//https://www.youtube.com/watch?v=IkMND33x0qQ
function Login() {
  const [username, setUsername] = useState("user name");
  const navigate = useNavigate();
  
  useEffect(() => {

    console.log("Checking if user name already set");
    //If token is set, kick to home screen to check validity of session
    if (localStorage.getItem('asci-user') !== null) {
      console.log("it does, sending to home page");
      navigate("/selectCourse");
    }
  }, []);
  
  
  let userInfo = {
    user : username,
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
        console.log("Response from server");
        console.log(data);
        let success = data.success;
        if(success == "true"){

          console.log("LOGIN Successful");
          localStorage.setItem('asci-user', data.computing_id); 
          localStorage.setItem('asci-course', null);         
          navigate('/selectCourse');
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
          value = {username}
          onChange={(e)=>setUsername(e.target.value)}
        />
        <button>Submit</button>
      </form>
    </div>
  );
}

export default Login;
