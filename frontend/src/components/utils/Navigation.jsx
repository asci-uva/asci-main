import React from "react";
import { NavLink } from "react-router-dom";
import { useUser } from "../context/UserContext";
//import { UserProvider } from "../context/UserContext";

function Navigation(props) {
  let docRoot = props.documentRoot;
  let debugMode = props.debugMode;
  const {user, courseList, getCourse} = useUser();
  let course = getCourse();

  return (
    <nav className="navbar navbar-expand-md navbar-dark bg-dark mb-4">
      <div className="container">
          <NavLink className="navbar-brand" to="/asci">
          ASCI@UVA
          </NavLink>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#ascinav" aria-controls="navbarsExample04" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="ascinav"> 
            <ul className="navbar-nav me-auto mb-2 mb-md-0">
              <li className="nav-item">
                <NavLink className="nav-link" to="/asci/queue">
                  <i className="bi-list-ol"></i> Queue
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/asci/chat">
                  <i className="bi-chat-right-text"></i> BotChat
                </NavLink>
              </li>
            { course.role == "instructor" ? (
              <li className="nav-item">
                <NavLink className="nav-link" to="/asci/admin">
                  <i className="bi-gear-wide-connected"></i> Admin
                </NavLink>
              </li>
            ) : null }
              <li className="nav-item">
                <NavLink className="nav-link" to="/asci/points">
                  <i className="bi-trophy-fill"></i> Earn Points
                </NavLink>
              </li>
      </ul>
            <ul className="navbar-nav ms-auto mb-2 mb-md-0">
            <li className="nav-item dropdown">
              <a href="#" className="nav-link dropdown-toggle" data-bs-toggle="dropdown" area-expanded="false">
      <i className="bi-mortarboard"></i> {course.mnemonic} {course.number} {course.name} ({course.semester}) 
              </a>
               <ul className="dropdown-menu">
              <li>
                <NavLink className="dropdown-item" to={docRoot + "/changeCourse"}>
                  Change Course
                </NavLink>
              </li>
               </ul>
          </li>

            <li className="nav-item dropdown">
              <a href="#" className="nav-link dropdown-toggle" data-bs-toggle="dropdown" area-expanded="false">
      <i className="bi-person-badge-fill"></i> {user.pname} {user.lname} ({user.userid}) 
              </a>
               <ul className="dropdown-menu">
              <li>
                <NavLink className="dropdown-item" to={docRoot + "/logout"}>
                  Logout
                </NavLink>
              </li>
               </ul>
          </li>
      </ul>
      </div>
      </div>
      </nav>
  );
}

export default Navigation;
