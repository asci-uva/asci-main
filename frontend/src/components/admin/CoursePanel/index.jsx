import React from "react";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CoursePanel = (props) => {
  const { courseId } = useParams();

  const [assignments, setAssignments] = useState({
    0: "Select assignment...",
  });

  //This function runs on page load!
  useEffect(() => {
    const assignments = {
      command: "getAssignmentByCourse",
      course_id: courseId,
      user: localStorage.getItem("asci-user"),
    };

    fetch(props.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(assignments),
    })
      .then((response) => response.json())
      .then((data) => {
        let success = data.success;

        if (success === "true") {
          console.log("Successfully fetched assignments");
          let c = { 0: "Select assignment..." };
          for (var key in data.assignments) {
            let assignmentName =
              "title: " +
              data.assignments[key]["name"] +
              " description: " +
              data.assignments[key]["description"] +
              " type: " +
              data.assignments[key]["type"] +
              " max_score: " +
              data.assignments[key]["max_score"] +
              " due_date: " +
              data.assignments[key]["due_date"];
            let assignmentId = data.assignments[key]["id"];
            c[assignmentId] = assignmentName;
          }

          setAssignments(c);
        } else {
          toast.error("Error loading assignments");
        }
      })
      .catch((error) => {
        toast.error("Error loading assignments");
      });
  }, []);
  console.log(assignments);
  const handleSync = () => {};

  return (
    <div>
      <h1>Course Panel</h1>
      <button onClick={handleSync}>Sync</button>

      <div>
        <h2>Assignments</h2>
        {Object.keys(assignments).map((assignmentId) => {
          if (assignmentId !== "0") {
            return (
              <div
                key={assignmentId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <span style={{ marginLeft: "10px" }}>
                  {assignments[assignmentId]}
                </span>
              </div>
            );
          }
          return null;
        })}
      </div>

      <div>
        <h2>Inactive Students</h2>
        several criterions 1: low grades 2: didn't submit homeworks / late
        submission 3. never engage in piazza or office hours
      </div>

      <div>
        <h2>Follow Behind</h2>
        detect students who got grades much lower than the average
      </div>
    </div>
  );
};

export default CoursePanel;
