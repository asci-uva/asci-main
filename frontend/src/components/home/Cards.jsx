import React from "react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { isInstructorRole, isStaffRole } from "../utils/roles";

function Cards(props) {
  const {getCourse, getCourseSettings} = useUser();
  let course = getCourse();
  let settings = getCourseSettings();


  return (
    <div className="row">
      <div className="col-lg-4 col-md-6 mb-4">
        <div className="card p-3">
          <div className="card-img-top text-center">
            <i className="bi-list-ol home-icon"></i>
          </div>
          <div className="card-body">
            <p className="card-text text-center"><Link to="queue" className="btn btn-primary">Join Queue</Link></p>
          </div>
        </div>
      </div>

      { settings!=null && settings.llm_enabled=="t" ? (
      <div className="col-lg-4 col-md-6 mb-4">
        <div className="card p-3">
          <div className="card-img-top text-center">
            <i className="bi-chat-right-text home-icon"></i>
          </div>
          <div className="card-body">
            <p className="card-text text-center"><Link to="chat" className="btn btn-primary">Bot Chat</Link></p>
          </div>
        </div>
      </div>
      ) : null }

      { isInstructorRole(course.role) ? (
        <div className="col-lg-4 col-md-6 mb-4">
          <div className="card p-3">
            <div className="card-img-top text-center">
              <i className="bi-gear-wide-connected home-icon"></i>
            </div>
            <div className="card-body">
              <p className="card-text text-center"><Link to="admin" className="btn btn-primary">Open Admin</Link></p>
            </div>
          </div>
        </div>
      ) : null }
      { isInstructorRole(course.role) ? (
        <div className="col-lg-4 col-md-6 mb-4">
          <div className="card p-3">
            <div className="card-img-top text-center">
              <i className="bi-bar-chart-line home-icon"></i>
            </div>
            <div className="card-body">
              <p className="card-text text-center"><Link to="stats" className="btn btn-primary">Statistics</Link></p>
            </div>
          </div>
        </div>
      ) : null }
      { settings!=null && settings.show_quests=="t" && course.role === "student" ? (
      <div className="col-lg-4 col-md-6 mb-4">
        <div className="card p-3">
          <div className="card-img-top text-center">
            <i className="bi-trophy home-icon"></i>
          </div>
          <div className="card-body">
            <p className="card-text text-center"><Link to="points" className="btn btn-primary">Earn Points</Link></p>
          </div>
        </div>
      </div>
      ) : null }
      { isInstructorRole(course.role) ? (
      <div className="col-lg-4 col-md-6 mb-4">
        <div className="card p-3">
          <div className="card-img-top text-center">
            <i className="bi-trophy home-icon"></i>
          </div>
          <div className="card-body">
            <p className="card-text text-center"><Link to="admin/SelectQuests" className="btn btn-primary">Quests</Link></p>
          </div>
        </div>
      </div>
      ) : null }
      { isStaffRole(course.role) ? (
      <div className="col-lg-4 col-md-6 mb-4">
        <div className="card p-3">
          <div className="card-img-top text-center">
            <i className="bi-clipboard-data home-icon"></i>
          </div>
          <div className="card-body">
            <p className="card-text text-center"><Link to="admin/PointsHome" className="btn btn-primary">Student Points</Link></p>
          </div>
        </div>
      </div>
      ) : null }
    </div>
  );
}

export default Cards;
