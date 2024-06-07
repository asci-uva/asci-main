import React from "react";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../context/UserContext";

function Home(props) {
  let url = props.url;
  let docRoot = props.documentRoot;
  const navigate = useNavigate();
  const {user, courseList, course} = useUser();


  return (
    <>
      <div className="container p-4">
        <div className="row my-auto">
        <div className="col-md-4">
        <h1><i className="bi-gear-wide-connected big-icon"></i></h1>
        <h2>Admin</h2>
        <p>
          The courses you instruct are below. Click on the edit button to change
          the settings for that course
        </p>
        </div>
      <div className="col-md-8 my-auto">
      <h3 className="mb-3">Course: {courseList[course].mnemonic} {courseList[course].number} -  {courseList[course].name} ({courseList[course].semester})</h3>
    <div className="row">
      <div className="col-md-4">
        <div className="card p-3">
            <div className="card-img-top text-center">
            <i className="bi-info-circle home-icon"></i>
          </div>
          <div className="card-body">
            <p className="card-text text-center"><Link to={docRoot + "/coursePanel/"+courseList[course].course_id} className="btn btn-danger">Course Panel</Link></p>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card p-3">
            <div className="card-img-top text-center">
            <i className="bi-pencil-square home-icon"></i>
          </div>
          <div className="card-body">
            <p className="card-text text-center"><Link to={docRoot + "/editCourse/"+courseList[course].course_id} className="btn btn-danger">Edit Details</Link></p>
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
