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

  //This function runs on page load to load all assignments to the corresponding course
  useEffect(() => {
    const assignments = {
      command: "getAssignmentByCourse",
      course_id: courseId,
      user: localStorage.getItem("asci-user"),
    };

    fetch(props.url, {
      method: "POST",
      credentials: "include",
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
              data.assignments[key]["max_score"];
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
  // const handleSync = () => {
  //   let request = {};
  //   request.command = "updateSubmissionByCourse";
  //   request.user = localStorage.getItem("asci-user");
  //   request.course_id = courseId;

  //   fetch(props.url, {
  //     method: "POST", // or 'PUT'
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify(request),
  //   })
  //     .then((response) => response.json())
  //     .then((data) => {
  //       console.log("Data is: ", data);
  //       let success = data.success;

  //       if (success === "true") {
  //         console.log("data sychronization success");
  //       } else {
  //         console.log("data sychronization failed");
  //       }
  //     })
  //     .catch((error) => {
  //       console.log("Sychronization: There was an error:", error);
  //     });
  // };

  const handleSync = () => {
    const pythonEndpoint = "http://127.0.0.1:5000/run-python-script";

    fetch(pythonEndpoint, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          // If the HTTP status code is not 200-299, throw an error
          throw new Error("Network response was not ok");
        }
        console.log(response);
        return response.json(); // Parse JSON response body
      })
      .then((data) => {
        if (data.success) {
          console.log("Python script execution success");

          // After the Python script has successfully downloaded the CSV, trigger the PHP function to parse the download csv and store the data to the db
          fetch(props.url, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              command: "updateSubmissionByCourse",
              user: localStorage.getItem("asci-user"),
              course_id: courseId,
              // pass the path of the CSV file that stored locally
              csvFilePath:
                "/Users/zhaohanzhang/Desktop/research_docs/asci-main/gradescope/CS_3120_Fall_2023_grades.csv",
            }),
          })
            .then((response) => response.json())
            .then((data) => {
              console.log("PHP backend function execution result:", data);
            })
            .catch((error) => {
              console.error("Error calling PHP backend:", error);
            });
        } else {
          console.log("Python script execution failed:", data.message);
        }
      })
      .catch((error) => {
        console.error("Error during synchronization:", error);
      });
  };

  return (
    <div>
      <h1>Course Panel</h1>
      {/* <button onClick={handleSync}>Sync</button> */}
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
