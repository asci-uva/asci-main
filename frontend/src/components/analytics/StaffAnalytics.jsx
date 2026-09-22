import React from "react";
import TAWeek from "./TAWeek";
import TAList from "./TAList";
import TAStats from "./TAStats";

function StaffAnalytics(props) {
  const courseId = props.courseId;

  return (
    <div className="card">
      <div className="card-header">
        <ul className="nav nav-tabs card-header-tabs" id="staff-tab" role="tablist">
          <li className="nav-item" role="presentation">
            <button className="nav-link active" id="ta-week-tab" data-bs-toggle="pill" data-bs-target="#ta-week" type="button" role="tab" aria-controls="ta-week" aria-selected="true">TA Activity Calendar</button>
          </li>
          <li className="nav-item" role="presentation">
            <button className="nav-link" id="ta-list-tab" data-bs-toggle="pill" data-bs-target="#ta-list" type="button" role="tab" aria-controls="ta-list" aria-selected="false">TA Activity List</button>
          </li>
          <li className="nav-item" role="presentation">
            <button className="nav-link" id="ta-help-overall-tab" data-bs-toggle="pill" data-bs-target="#ta-help-overall" type="button" role="tab" aria-controls="ta-help-overall" aria-selected="false">TA Leaderboards</button>
          </li>
        </ul>
      </div>

      <div className="tab-content card-body" id="staff-tabContent">
        <div className="tab-pane fade show active" id="ta-week" role="tabpanel" aria-labelledby="ta-week-tab">
          <div className="col-md-12 my-auto">
            <TAWeek course_id={courseId} {...props} />
          </div>
        </div>
        <div className="tab-pane fade" id="ta-list" role="tabpanel" aria-labelledby="ta-list-tab">
          <div className="col-md-12 my-auto">
            <TAList course_id={courseId} {...props} />
          </div>
        </div>
        <div className="tab-pane fade" id="ta-help-overall" role="tabpanel" aria-labelledby="ta-help-overall-tab">
          <div className="col-md-12 my-auto">
            <TAStats course_id={courseId} {...props} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default StaffAnalytics;
