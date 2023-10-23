import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

function Home(props) {
  let url = props.url;
  let docRoot = props.documentRoot;
  const navigate = useNavigate();
  const user = localStorage.getItem("asci-user");

  const [purpose, setPurpose] = useState(0);
  const [courses, setCourses] = useState({
    0: "Select course...",
  });

  //This function runs on page load!
  useEffect(() => {
    console.log("Courses is:", courses);
    //setup json command
    let request = {};
    request.command = "getCoursesByRole";
    request.user = user;
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

  const handleEditCourse = (courseId) => {
    console.log(courseId);
    navigate(docRoot + `/editCourse/${courseId}`);
  };

  return (
    <>
      <div>
        <h2>Welcome {user}</h2>
        {Object.keys(courses).map((courseId) => {
          // Skip the "Select course..." placeholder
          if (courseId !== "0") {
            return (
              <div key={courseId}>
                <span style={{ flex: 1, marginRight: "10px" }}>
                  {courses[courseId]}
                </span>
                <button onClick={() => handleEditCourse(courseId)}>Edit</button>
              </div>
            );
          }
          return null;
        })}
      </div>
    </>
  );
}

export default Home;
