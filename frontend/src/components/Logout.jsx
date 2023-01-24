import React from "react";
import {useEffect} from "react";
import {useNavigate} from 'react-router-dom';


//https://www.youtube.com/watch?v=IkMND33x0qQ
function Logout() {
  
  const navigate = useNavigate();
  
  useEffect(() => {

    localStorage.clear();
    navigate("/login");
  }, []);
  

  return (
    <div className="question">
      <h2>Logging out...You should be redirected soon.</h2>
    </div>
  );
}

export default Logout;
