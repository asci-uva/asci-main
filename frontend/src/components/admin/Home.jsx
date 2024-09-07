import React from "react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import UploadRoster from "./UploadRoster";
import AddStudent from "./AddStudent";
import GradescopeSync from "./GradescopeSync";
import EditCourseInfo from "./EditCourseInfo";
import EditCourseSettings from "./EditCourseSettings";
import CreateNewCourse from "./CreateNewCourse";
import ViewRoster from "./ViewRoster";
import UpdateChat from "./UpdateChat";
import SelectQuests from "./SelectQuests";

function Home(props) {
  let docRoot = props.documentRoot;
  const {user, courseList, course} = useUser();


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
            
            <div className="card">
              <div className="card-header">
            <ul className="nav nav-tabs card-header-tabs" id="pills-tab" role="tablist">
              <li className="nav-item" role="presentation">
                <button className="nav-link active" id="pills-general-tab" data-bs-toggle="pill" data-bs-target="#pills-general" type="button" role="tab" aria-controls="pills-home" aria-selected="true">General</button>
              </li>
              <li className="nav-item" role="presentation">
                <button className="nav-link" id="pills-view-roster-tab" data-bs-toggle="pill" data-bs-target="#pills-view-roster" type="button" role="tab" aria-controls="pills-profile" aria-selected="false">View Roster</button>
              </li>
              <li className="nav-item" role="presentation">
                <button className="nav-link" id="pills-roster-tab" data-bs-toggle="pill" data-bs-target="#pills-roster" type="button" role="tab" aria-controls="pills-profile" aria-selected="false">Update Roster</button>
              </li>
              <li className="nav-item" role="presentation">
                <button className="nav-link" id="pills-sync-tab" data-bs-toggle="pill" data-bs-target="#pills-sync" type="button" role="tab" aria-controls="pills-contact" aria-selected="false">Synchronization</button>
              </li>
              <li className="nav-item" role="presentation">
                <button className="nav-link" id="pills-quests-tab" data-bs-toggle="pill" data-bs-target="#pills-quests" type="button" role="tab" aria-controls="pills-contact" aria-selected="false">Select Quests</button>
              </li>
            </ul>
              </div>
            
            <div className="tab-content card-body" id="pills-tabContent">
              
              <div className="tab-pane fade show active" id="pills-general" role="tabpanel" aria-labelledby="pills-home-tab">               
                <div className="col-md-12 my-auto">
                    <EditCourseSettings course_id={courseList[course].course_id} {...props} />                                
                </div>
                <div className="col-md-12 my-auto"> 
                  <EditCourseInfo course_id={courseList[course].course_id} {...props} />
                </div>
                <div className="col-md-12 my-auto"> 
                  <UpdateChat course_id={courseList[course].course_id} {...props} /> 
                </div>
              </div>

              <div className="tab-pane fade" id="pills-roster" role="tabpanel" aria-labelledby="pills-profile-tab">
                <div className="col-md-12 my-auto mb-2">
                    <UploadRoster course_id={courseList[course].course_id} {...props} />                                
                </div>
                <div className="col-md-12 my-auto">
                    <AddStudent course_id={courseList[course].course_id} {...props} />                                
                </div>
              </div>

              <div className="tab-pane fade" id="pills-view-roster" role="tabpanel" aria-labelledby="pills-profile-tab">
                <div className="col-md-12 my-auto mb-2">
                    <ViewRoster course_id={courseList[course].course_id} {...props} />                                
                </div>                
              </div>

              <div className="tab-pane fade" id="pills-sync" role="tabpanel" aria-labelledby="pills-contact-tab">
                <div className="row">
                  <div className="col-md-12 my-auto">
                    <GradescopeSync course_id={courseList[course].course_id} {...props} />              
                  </div>
                </div>
              </div>

              <div className="tab-pane fade" id="pills-quests" role="tabpanel" aria-labelledby="pills-select-quests-tab">
                <div className="row">
                  <div className="col-md-12 my-auto">
                    <SelectQuests course_id={courseList[course].course_id} {...props} />              
                  </div>
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
