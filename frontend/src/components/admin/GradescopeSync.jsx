import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function GradescopeSync(props) {
  const { courseId } = useParams();
  const [courseNumber, setCourseNumber] = useState("");
  const [username, setUsername] = useState("");
  const [passcode, setPasscode] = useState("");

  const navigate = useNavigate();

  const handleSynchronize = () => {
    // const pythonEndpoint = "http://127.0.0.1:5000/run-python-script";
    const payload = {
      email: username,
      password: passcode,
      courseNumber: courseNumber,
      course_id: courseId,
      command: "synchronizeGradescopeData",
      user: localStorage.getItem("asci-user"),
    };

    fetch(props.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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
          // fetch(props.url, {
          //   method: "POST",
          //   headers: {
          //     "Content-Type": "application/json",
          //   },
          //   body: JSON.stringify({
          //     command: "updateSubmissionByCourse",
          //     user: localStorage.getItem("asci-user"),
          //     course_id: courseNumber,
          //     // pass the path of the CSV file that stored locally
          //     csvFilePath:
          //       "/Users/zhaohanzhang/Desktop/research_docs/asci-main/gradescope/CS_3120_Fall_2023_grades.csv",
          //   }),
          // })
          //   .then((response) => response.json())
          //   .then((data) => {
          //     console.log("PHP backend function execution result:", data);
          //   })
          //   .catch((error) => {
          //     console.error("Error calling PHP backend:", error);
          //   });
        } else {
          console.log("Python script execution failed:", data.message);
        }
      })
      .catch((error) => {
        console.error("Error during synchronization:", error);
      });
  };

  return (
    <div className="question">
      <h2>Gradescope Synchronization</h2>

      <label>Gradescope Course Number:</label>
      <input
        type="text"
        value={courseNumber}
        onChange={(e) => setCourseNumber(e.target.value)}
        required
      />

      <label>Gradescope Account Username:</label>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />

      <label>Gradescope Account Passcode:</label>
      <input
        type="password"
        value={passcode}
        onChange={(e) => setPasscode(e.target.value)}
        required
      />

      <button onClick={handleSynchronize}>Synchronize the Data</button>
    </div>
  );
}

export default GradescopeSync;
