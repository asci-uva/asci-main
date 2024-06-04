import React from "react";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../context/UserContext";

function Home(props) {
  let url = props.url;
  let docRoot = props.documentRoot;
  const navigate = useNavigate();
  const {user, getCourse} = useUser();

  const [purpose, setPurpose] = useState(0);
  const [courses, setCourses] = useState({
    0: "Select course...",
  });

  let course = getCourse();

  //This function runs on page load!
  useEffect(() => {
    //setup json command
    let request = {};
    request.command = "getCoursesByRole";
    request.user = user.userid;
    request.role = "instructor";

    getCourses(request, url);
  }, []);

  //This function checks the users session
  const getCourses = (json0, url0) => {
    fetch(url0, {
      method: "POST", // or 'PUT'
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(json0),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Data is: ", data);
        let success = data.success;

        if (success === "true") {
          console.log("SelectCourse: Successfully fetched courses");
          let c = { 0: "Select course..." };
          for (var key in data.courses) {
            //Construct the course title from it's pieces
            let courseName =
              "" +
              data.courses[key]["mnemonic"] +
              data.courses[key]["number"] +
              " " +
              data.courses[key]["name"] +
              " - " +
              data.courses[key]["semester"] +
              " (" +
              data.courses[key]["role"] +
              ")";
            let courseId = data.courses[key]["course_id"];
            c[courseId] = courseName;
          }

          setCourses(c);
        } else {
          console.log("Select Course: Server returned error");
          navigate(docRoot + "/error");
        }
      })
      .catch((error) => {
        console.log("Select Course: There was an error:", error);
        navigate(docRoot + "/error");
      });
  };


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
      <h3 className="mb-3">Course: {course.mnemonic} {course.number} -  {course.name} ({course.semester})</h3>
    <div className="row">
      <div className="col-md-4">
        <div className="card p-3">
            <div className="card-img-top text-center">
            <i className="bi-info-circle home-icon"></i>
          </div>
          <div className="card-body">
            <p className="card-text text-center"><Link to={docRoot + "/coursePanel/"+course.course_id} className="btn btn-danger">Course Panel</Link></p>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card p-3">
            <div className="card-img-top text-center">
            <i className="bi-pencil-square home-icon"></i>
          </div>
          <div className="card-body">
            <p className="card-text text-center"><Link to={docRoot + "/editCourse/"+course.course_id} className="btn btn-danger">Edit Details</Link></p>
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
