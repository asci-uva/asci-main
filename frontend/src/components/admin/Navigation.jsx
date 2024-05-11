import React from "react";
import { NavLink } from "react-router-dom";

function Navigation(props) {
  let docRoot = props.documentRoot;
  let debugMode = props.debugMode;
  let root = "/asci";

  if (debugMode) {
    return (
      <div className="navigation">
        <nav className="navbar navbar-expand navbar-dark bg-dark">
          <div className="container">
            <NavLink className="navbar-brand" to={docRoot + "/"}>
              ADMIN
            </NavLink>
            <div>
              <ul className="navbar-nav ml-auto">
                <li className="nav-item">
                  <NavLink className="nav-link" to={root + "/"}>
                    BACK TO HOME
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    className="nav-link"
                    to={docRoot + "/createNewCourse"}
                  >
                    Create New Course
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to={docRoot}>
                    Course Management
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    className="nav-link"
                    to={docRoot + "/SelectQuests"}
                  >
                    Select Quests
                  </NavLink>
                </li>
                {/* <li className="nav-item">
                  <NavLink className="nav-link" to={docRoot + "/uploadRoster"}>
                    Upload Roster
                  </NavLink>
                </li> */}
                <li className="nav-item">
                  <NavLink className="nav-link" to={root + "/logout"}>
                    Logout
                  </NavLink>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </div>
    );
  } else {
    return (
      <div className="navigation">
        <nav className="navbar navbar-expand navbar-dark bg-dark">
          <div className="container">
            <NavLink className="navbar-brand" to={docRoot + "/"}>
              ADMIN
            </NavLink>
            <div>
              <ul className="navbar-nav ml-auto">
                <li className="nav-item">
                  <NavLink className="nav-link" to={docRoot + "/"}>
                    Turn DebugMode to TRUE
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
