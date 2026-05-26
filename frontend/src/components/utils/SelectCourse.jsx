import React from "react";
import {useState} from "react";
import { useNavigate } from 'react-router-dom';
import { useUser } from "../context/UserContext";

function SelectCourse(props) {
  const navigate = useNavigate();

  const [activePurpose, setActivePurpose] = useState("0");
  const [archivedPurpose, setArchivedPurpose] = useState("0");
  
  let url = props.url;
  let docRoot = props.documentRoot; 
  const {user, courseList, setCourse, setCourseSettings, isAdmin} = useUser();
  let activeCourseList = {
    0: "Select a course",
  };

  let archivedCourseList = {
    0: "Select an archived course",
  };

  let hasInstructorRole = false;

  if (courseList != null) {
    for (var key in courseList) {
      let course = courseList[key];

      if (course["role"] === "instructor") {
        hasInstructorRole = true;
      }

      let courseName =
        "" +
        course["mnemonic"] +
        course["number"] +
        " " +
        course["name"] +
        " - " +
        course["semester"];
      if (isAdmin()) {
        courseName += " (admin)"
      } else {
        courseName += " (" + course["role"] +")";
      }
      if (course["archived"] === "t") {
        archivedCourseList[key] = courseName + " [Archived]";
      } else {
        activeCourseList[key] = courseName;
      }
    }
  }

  const selectCourse = (courseId, courseName) => {
      console.log("Course id: ", courseId);
      console.log("Course name: ", courseName);

      setCourse(courseId);

      let request = {};
      request.command = "getCourseSettings";
      request.user = user.userid;
      request.courseId = courseId;
      getCourseSettings(request, url);
  };

  const handleSelectCourse = (e) =>{
    e.preventDefault();

    if (activePurpose !== "0") {
      selectCourse(activePurpose, activeCourseList[activePurpose]);
    }
  };

  const handleSelectArchivedCourse = (e) => {
    e.preventDefault();

    if (archivedPurpose !== "0") {
      selectCourse(archivedPurpose, archivedCourseList[archivedPurpose]);
    }
  };

  const getCourseSettings = (json0, url0) =>{
    fetch(url0, {
      method: 'POST', // or 'PUT'
      credentials: "include",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(json0),
    }).then(response => response.json())
      .then(data => {
        console.log("Data is: ", data);

        //if request succeeded
        if(data.success === "true"){

          console.log("Course settings retrieved");
          setCourseSettings(data.settings);
          //navigate to the home page finally
          //if admin don't redirect
          if (!isAdmin()) {
            navigate(docRoot + "/");
          }          
        }
        else{
          console.log("FATAL ERROR: Failed to get course settings");
        }

      })
      .catch((error) => {
        console.log("HOME: There was an error:", error);
        navigate(docRoot + "/error");

      });

  }

    console.log("Courses", activeCourseList, archivedCourseList);
    return (
      <div className="container p-4">
        <div>
          <h1>ASCI</h1>
          <h5>AI-Smart Classroom Initiative</h5>
        </div>

        <form className="mb-3">
            <div className="mb-3">
              <label className="form-label">Please select your course below.</label>
              <select className="form-select" 
                value={activePurpose}
                onChange={(e)=>setActivePurpose(e.target.value)}>
                {Object.keys(activeCourseList).map(
                      k => (
                      <option key={k} value={k}>
                          {activeCourseList[k]}
                      </option>
                      )
                )}
              </select>
          </div>
            <button className="btn btn-primary" onClick={handleSelectCourse}>Select Course</button>
        </form>

        {hasInstructorRole && Object.keys(archivedCourseList).length > 1 ? (
          <form>
            <div className="mb-3">
              <label className="form-label">Archived courses (instructor only).</label>
              <select
                className="form-select"
                value={archivedPurpose}
                onChange={(e) => setArchivedPurpose(e.target.value)}
              >
                {Object.keys(archivedCourseList).map(
                  k => (
                    <option key={k} value={k}>
                      {archivedCourseList[k]}
                    </option>
                  )
                )}
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleSelectArchivedCourse}>Open Archived Course</button>
          </form>
        ) : null}
      
      </div>
    );
}

export default SelectCourse;