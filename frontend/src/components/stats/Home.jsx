import React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import TAStats from "./TAStats";
import TAWeek from "./TAWeek";
import TAList from "./TAList";
import StudentsBehind from "./StudentsBehind";
import DiscordActivity from "./DiscordActivity";

function Home(props) {
  let docRoot = props.documentRoot;
  const {user, courseList, course} = useUser();
  const [sidebarOpen, setSidebarOpen] = useState("sidebar-visible");
  const [sidebarCol, setSidebarCol] = useState("col-md-3");
  const [contentCol, setContentCol] = useState("page-container content col-md-9 my-auto");

  const handleCollapse = () => {
    if(sidebarOpen === "sidebar-visible")
    {
      setSidebarCol("col-md-1");
      setContentCol("page-container content col-md-11");
      setSidebarOpen("sidebar-hidden");
    }
    else
    {
      setSidebarCol("col-md-3");
      setContentCol("page-container content col-md-9 my-auto");
      setSidebarOpen("sidebar-visible");
    }
  }


  return (
    <>
      <div className="container-fluid page-width">
        <div className="row g-0">
          <div className={sidebarCol}>
            <div className="sidebar">
              <div className={sidebarOpen}>
                  <h1><i className="bi-bar-chart-line big-icon"></i></h1>
                  <h2>Stats</h2>
                  <p>
                    View information about how your course has been going, including how engaged the TAs and students have been with office hours.
                  </p>
                </div>
                <button type="button" className="sidebar-button" onClick={handleCollapse}><i className="bi-arrows-collapse-vertical"></i></button>
              </div>
            </div>
            <div className={contentCol}>

            <h3 className="mb-3">Course: {courseList[course].mnemonic} {courseList[course].number} -  {courseList[course].name} ({courseList[course].semester})</h3>

            <div className="card">

              
              <div className="card-header">
                <ul className="nav nav-tabs card-header-tabs" id="pills-tab" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button className="nav-link active" id="ta-week-tab" data-bs-toggle="pill" data-bs-target="#ta-week" type="button" role="tab" aria-controls="pills-home" aria-selected="true">TA Activity Calendar</button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button className="nav-link" id="ta-list-tab" data-bs-toggle="pill" data-bs-target="#ta-list" type="button" role="tab" aria-controls="pills-home" aria-selected="true">TA Activity List</button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button className="nav-link" id="ta-help-overall-tab" data-bs-toggle="pill" data-bs-target="#ta-help-overall" type="button" role="tab" aria-controls="pills-home" aria-selected="false">TA Leaderboards</button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button className="nav-link" id="student-tracker" data-bs-toggle="pill" data-bs-target="#student-tracker-panel" type="button" role="tab" aria-controls="pills-home" aria-selected="false">Stud. Tracker</button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button className="nav-link" id="discord-activity-tab" data-bs-toggle="pill" data-bs-target="#discord-activity-panel" type="button" role="tab" aria-controls="pills-home" aria-selected="false">Discord Activity</button>
                  </li>
                </ul>
              </div>

              <div className="tab-content card-body" id="pills-tabContent">
                <div className="tab-pane fade show active" id="ta-week" role="tabpanel" aria-labelledby="ta-week-tab"> 
                  <div className="col-md-12 my-auto">
                    <TAWeek course_id={courseList[course].course_id} {...props} /> 
                  </div>
                </div>
                <div className="tab-pane fade" id="ta-list" role="tabpanel" aria-labelledby="ta-help-overall-tab"> 
                  <div className="col-md-12 my-auto">
                    <TAList course_id={courseList[course].course_id} {...props} /> 
                  </div>
                </div>
                <div className="tab-pane fade" id="ta-help-overall" role="tabpanel" aria-labelledby="ta-help-overall-tab"> 
                  <div className="col-md-12 my-auto">
                    <TAStats course_id={courseList[course].course_id} {...props} /> 
                  </div>
                </div>

                <div className="tab-pane fade" id="student-tracker-panel" role="tabpanel" aria-labelledby="student-tracker"> 
                  <div className="col-md-12 my-auto">
                    <StudentsBehind course_id={courseList[course].course_id} {...props} /> 
                  </div>
                </div>
                <div className="tab-pane fade" id="discord-activity-panel" role="tabpanel" aria-labelledby="discord-activity-tab"> 
                  <div className="col-md-12 my-auto">
                    <DiscordActivity course_id={courseList[course].course_id} {...props} /> 
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
