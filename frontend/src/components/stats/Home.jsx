import React from "react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import TAStats from "./TAStats";
import TAWeek from "./TAWeek";
import TAList from "./TAList";
import StudentsBehind from "./StudentsBehind";

function Home(props) {
  let docRoot = props.documentRoot;
  const {user, courseList, course} = useUser();


  return (
    <>
      <div className="container p-4">
        <div className="row">
          <div className="col-md-4">
            <h1><i className="bi-bar-chart-line big-icon"></i></h1>
            <h2>Stats</h2>
            <p>
              View information about how your course has been going, including how engaged the TAs and students have been with office hours.
            </p>
          </div>
          <div className="col-md-8">

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
              </div>


              


              
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
