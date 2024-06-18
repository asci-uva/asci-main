import React from "react";
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import UploadRoster from "./UploadRoster";
import AddStudent from "./AddStudent";
import GradescopeSync from "./GradescopeSync";
import EditCourseInfo from "./EditCourseInfo";
import CreateNewCourse from "./CreateNewCourse";

function Home(props) {
  let url = props.url;
  let docRoot = props.documentRoot;
  const navigate = useNavigate();
  const {user, courseList, course} = useUser();
  const { courseId } = useParams();


  return (
    <>
      <div className="container p-4">
        <div className="row">
          <div className="col-md-4">
            <h1><i className="bi-gear-wide-connected big-icon"></i></h1>
            <h2>Admin</h2>
            <p>
              On this page, you can make adjustments to your course, manage your course, and synchronize your course with outside utilities.
            </p>
          </div>
          <div className="col-md-8">
            
            <h3 className="mb-3">Course: {courseList[course].mnemonic} {courseList[course].number} -  {courseList[course].name} ({courseList[course].semester})</h3>
            

            <ul class="nav nav-pills mb-3" id="pills-tab" role="tablist">
              <li class="nav-item" role="presentation">
                <button class="nav-link active" id="pills-general-tab" data-bs-toggle="pill" data-bs-target="#pills-general" type="button" role="tab" aria-controls="pills-home" aria-selected="true">General</button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" id="pills-settings-tab" data-bs-toggle="pill" data-bs-target="#pills-settings" type="button" role="tab" aria-controls="pills-profile" aria-selected="false">Settings</button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" id="pills-roster-tab" data-bs-toggle="pill" data-bs-target="#pills-roster" type="button" role="tab" aria-controls="pills-profile" aria-selected="false">Roster</button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" id="pills-sync-tab" data-bs-toggle="pill" data-bs-target="#pills-sync" type="button" role="tab" aria-controls="pills-contact" aria-selected="false">Synchronization</button>
              </li>
            </ul>
            
            <div class="tab-content" id="pills-tabContent">
              
              <div class="tab-pane fade show active" id="pills-general" role="tabpanel" aria-labelledby="pills-home-tab">               
                <div className="col-md-6 my-auto"> 
                  <EditCourseInfo course_id={courseId} {...props} />                              
                </div>
              </div>

              <div class="tab-pane fade" id="pills-roster" role="tabpanel" aria-labelledby="pills-profile-tab">
                <div className="col-md-6 my-auto mb-2">
                    <UploadRoster course_id={courseId} {...props} />                                
                </div>
                <div className="col-md-6 my-auto">
                    <AddStudent course_id={courseId} {...props} />                                
                </div>
              </div>

              <div class="tab-pane fade" id="pills-settings" role="tabpanel" aria-labelledby="pills-contact-tab">
                Settings coming soon...
              </div>
              
              <div class="tab-pane fade" id="pills-sync" role="tabpanel" aria-labelledby="pills-contact-tab">
                <div className="row">
                  <div className="col-md-6 my-auto">
                    <GradescopeSync course_id={courseId} {...props} />              
                  </div>
                </div>
              </div>
            
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
