import React from "react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import TAStats from "./TAStats";

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
                    <button className="nav-link active" id="pills-general-tab" data-bs-toggle="pill" data-bs-target="#pills-general" type="button" role="tab" aria-controls="pills-home" aria-selected="true">Help Time</button>
                  </li>
                </ul>
              </div>

              <div className="tab-content card-body" id="pills-tabContent">
                <div className="tab-pane fade show active" id="pills-general" role="tabpanel" aria-labelledby="pills-home-tab"> 
                  <div className="col-md-12 my-auto">
                    <TAStats course_id={courseList[course].course_id} {...props} /> 
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
