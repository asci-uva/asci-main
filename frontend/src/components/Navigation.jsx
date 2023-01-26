import React from "react";
import { NavLink } from "react-router-dom";

function Navigation(props) {

  let docRoot = props.documentRoot;
  let debugMode = props.debugMode;

  if(debugMode){
    return (
      <div className="navigation">
        <nav className="navbar navbar-expand navbar-dark bg-dark">
          <div className="container">
            <NavLink className="navbar-brand" to={docRoot + "/"}>
              OH QUEUE BY ASCI-UVA
            </NavLink>
            <div>
              <ul className="navbar-nav ml-auto">
                <li className="nav-item">
                  <NavLink className="nav-link" to={docRoot + "/selectCourse"}>
                    Select Course
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to={docRoot + "/logout"}>
                    Logout
                  </NavLink>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </div>
    );
  }
  else{
    return (
      <div className="navigation">
        <nav className="navbar navbar-expand navbar-dark bg-dark">
          <div className="container">
            <NavLink className="navbar-brand" to={docRoot + "/"}>
              OH QUEUE BY ASCI-UVA
            </NavLink>
            <div>
              <ul className="navbar-nav ml-auto">
                <li className="nav-item">
                  <NavLink className="nav-link" to={docRoot + "/selectCourse"}>
                    Select Course
                  </NavLink>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </div>
    );
  }
}

export default Navigation;