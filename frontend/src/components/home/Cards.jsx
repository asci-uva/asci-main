import React from "react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";

function Cards(props) {
  let docRoot = props.documentRoot;
  let debugMode = props.debugMode;
  let root = "/asci";
  const {getCourse} = useUser();
  let course = getCourse();
  return (
    <div className="row">
      <div className="col-md-4">
        <div className="card p-3">
          <div className="card-img-top text-center">
            <i className="bi-list-ol home-icon"></i>
          </div>
          <div className="card-body">
            <p className="card-text text-center"><Link to="queue" className="btn btn-primary">Join Queue</Link></p>
          </div>
        </div>
      </div>
      { course.role == "instructor" ? (
        <div className="col-md-4">
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
      <div className="col-md-4">
        <div className="card p-3">
          <div className="card-img-top text-center">
            <i className="bi-trophy home-icon"></i>
          </div>
          <div className="card-body">
            <p className="card-text text-center"><Link to="points" className="btn btn-primary">Earn Points</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cards;
