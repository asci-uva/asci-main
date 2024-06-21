import React from "react";
import { Cards } from "./";
import { useUser } from "../context/UserContext";


//This page needs to:
//See if student is logged in and kick to login page if not
//If, logged in, reset student info and kick to dashboard

function Home(props) {
  const {user} = useUser();

  return (
    <div className="row">
      <div className="col-md-4">
        <h2>ASCI@UVA</h2>
        <p>Welcome back {user.pname} {user.lname}!  Navigate to different parts of the application from here.</p>
      </div>
      <div className="col-md-8">
        <Cards
          documentRoot={props.documentRoot}
          debugMode={props.debugMode}
        />
      </div>
    </div>
  );
}

export default Home;
