import React from "react";
import { NavLink } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { isInstructorRole, isStaffRole } from "./roles";
//import { UserProvider } from "../context/UserContext";

function Navigation(props) {
  let docRoot = props.documentRoot;
  let debugMode = props.debugMode;
  const {user, courseList, getCourse, getCourseSettings} = useUser();
  let course = getCourse();
  let settings = getCourseSettings();
  console.log("navigation: ", settings);

  return (
    <nav className="navbar navbar-expand-md navbar-dark bg-dark">
      <div className="container">
        <NavLink className="navbar-brand" to="/asci">
          ASCI
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
            { settings!=null && settings.llm_enabled=="t" && settings.archived!="t" ? (
            <li className="nav-item">
              <NavLink className="nav-link" to="/asci/chat">
                <i className="bi-chat-right-text"></i> BotChat
              </NavLink>
            </li>
            ) : null }
            { settings!=null && settings.show_quests=="t" && course.role === "student" ? (
              <li className="nav-item">
                <NavLink className="nav-link" to="/asci/points">
                  <i className="bi-trophy-fill"></i> Earn Points
                </NavLink>
              </li>
            ) : null }
            { isInstructorRole(course.role) ? (
                <li className="nav-item">
                  <NavLink className="nav-link" to="/asci/admin" end>
                    <i className="bi-gear-wide-connected"></i> Admin
                  </NavLink>
                </li>
              ) : null }
              { isInstructorRole(course.role) ? (
                <li className="nav-item">
                  <NavLink className="nav-link" to="/asci/courseRoster">
                    <i className="bi-people-fill"></i> Roster
                  </NavLink>
                </li>
              ) : null }
              { isInstructorRole(course.role) ? (
                <li className="nav-item">
                  <NavLink className="nav-link" to="/asci/externalTools">
                    <i className="bi-puzzle"></i> External Tools
                  </NavLink>
                </li>
              ) : null }
              { isInstructorRole(course.role) ? (
                <li className="nav-item">
                  <NavLink className="nav-link" to="/asci/stats">
                    <i className="bi-bar-chart-line"></i> Statistics
                  </NavLink>
                </li>
              ) : null }
              { isInstructorRole(course.role) ? (
                <li className="nav-item">
                  <NavLink className="nav-link" to="/asci/assessments">
                    <i className="bi-clipboard-check"></i> Assessments
                  </NavLink>
                </li>
              ) : null }
              { isStaffRole(course.role) ? (
                <li className="nav-item">
                  <NavLink className="nav-link" to="/asci/admin/PointsHome">
                    <i className="bi-clipboard-data"></i> Student Points
                  </NavLink>
                </li>
              ) : null }
          </ul>
          <ul className="navbar-nav ms-auto mb-2 mb-md-0">
            <li className="nav-item dropdown">
              <a href="#" className="nav-link dropdown-toggle" data-bs-toggle="dropdown" area-expanded="false">
                <i className="bi-mortarboard"></i> {course.mnemonic} {course.number} {course.name} ({course.semester}) 
              </a>
              <ul className="dropdown-menu">
              { isInstructorRole(course.role) ? (
                <li className="">
                  <NavLink className="dropdown-item" to="/asci/admin" end>
                    <i className="bi-gear-wide-connected"></i> Admin
                  </NavLink>
                </li>
              ) : null }
              { isInstructorRole(course.role) ? (
                <li className="">
                  <NavLink className="dropdown-item" to="/asci/courseRoster">
                    <i className="bi-people-fill"></i> Roster
                  </NavLink>
                </li>
              ) : null }
              { isInstructorRole(course.role) ? (
                <li className="">
                  <NavLink className="dropdown-item" to="/asci/externalTools">
                    <i className="bi-puzzle"></i> External Tools
                  </NavLink>
                </li>
              ) : null }
              { isInstructorRole(course.role) ? (
                <li className="">
                  <NavLink className="dropdown-item" to="/asci/stats">
                    <i className="bi-bar-chart-line"></i> Statistics
                  </NavLink>
                </li>
              ) : null }
              { isInstructorRole(course.role) ? (
                <li className="">
                  <NavLink className="dropdown-item" to="/asci/assessments">
                    <i className="bi-clipboard-check"></i> Assessments
                  </NavLink>
                </li>
              ) : null }
              { isStaffRole(course.role) ? (
                <li className="">
                  <NavLink className="dropdown-item" to="/asci/admin/PointsHome">
                    <i className="bi-clipboard-data"></i> Student Points
                  </NavLink>
                </li>
              ) : null }
              { isInstructorRole(course.role) ? (
                <li><hr className="dropdown-divider"/></li>
              ) : null }
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
