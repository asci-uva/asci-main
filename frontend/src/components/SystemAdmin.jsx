import React from "react";
import { useNavigate, NavLink } from "react-router-dom";
import {
  UploadRoster,
  ViewRoster,
  AddStudent
} from "./courseRoster";
import {
  CreateNewUser,
  SelectCourse,
  CreateNewCourse,
} from "./utils";
import { useUser } from "./context/UserContext";

function SystemAdmin(props) {
  const navigate = useNavigate();
  const { course, courseListString, isAdmin, logout } = useUser();
  let url = props.url;
  let docRoot = props.documentRoot; 
  let courseList = courseListString();
  courseList[0] = "Select a course";
  
  if(!isAdmin()){
    return;
  } else {
    return (
      <div>
        <nav className="navbar navbar-expand-md navbar-dark bg-dark">
          <div className="container">
            <NavLink className="navbar-brand" to="/asci">
              ASCI
            </NavLink>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#ascinav" aria-controls="navbarsExample04" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="ascinav"> 
              <ul className="navbar-nav ms-auto mb-2 mb-md-0">
                <li className="nav-item dropdown">
                  <a href="#" className="nav-link dropdown-toggle" data-bs-toggle="dropdown" area-expanded="false">
                    <i className="bi-person-badge-fill"></i> System Admin 
                  </a>
                  <ul className="dropdown-menu">
                    <li>
                      <NavLink className="dropdown-item" to="#"
                      onClick={
                        (e) => {
                          e.preventDefault();
                          logout();
                          navigate(docRoot + "/");
                        }
                      }>
                        Logout
                      </NavLink>
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        <div className="container p-4">
          <div className="row my-auto">
            <div className="col-md-4">
              <h1><i className="bi-mortarboard big-icon"></i></h1>
              <h2>Select Course</h2>
              <p>Please select the course you would like to manage.</p>
            </div>
              
            <div className="col-md-6">
              <SelectCourse {...props} />  

              <CreateNewCourse {...props} />
            </div>

            { course && course != 0 ? (
              <div>
                <div className="col-md-12">
                  <h1><i className="bi-people big-icon"></i></h1>
                  <h2>Manage Roster for {courseList[course]}</h2>
                  <p>Please use one of the following options to manage the course roster.</p>
                </div>

                <div className="col-md-12 my-auto mb-2">
                  <UploadRoster course_id={courseList[course].course_id} {...props} />                                
                </div>

                <div className="col-md-12 my-auto mb-2">
                  <ViewRoster course_id={courseList[course].course_id} {...props} />                                
                </div>

                <div className="col-md-12 my-auto">
                  <AddStudent course_id={courseList[course].course_id} {...props} />                                
                </div>
              </div>
            ) : null }

            <div className="col-md-4">
              <h1><i className="bi-person-add big-icon"></i></h1>
              <h2>Create User</h2>
              <p>Please use the form to create a new user if necessary.</p>
            </div>
            
            <div className="col-md-6">
              <CreateNewUser {...props} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default SystemAdmin;