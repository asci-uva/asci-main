import React from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

//https://www.youtube.com/watch?v=IkMND33x0qQ
function Logout(props) {
  const navigate = useNavigate();

  let docRoot = props.documentRoot;

  useEffect(() => {
    localStorage.clear();
    navigate(docRoot);
  }, []);

  return (
    <div className="question">
      <h2>Logging out...You should be redirected soon.</h2>
    </div>
  );
}

export default Logout;
