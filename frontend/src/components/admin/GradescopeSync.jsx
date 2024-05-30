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
    const payload = {
      email: username,
      password: passcode,
      // this is the course number on GradeScope
      courseNumber: courseNumber,
      // this is the course id in database
      course_id: courseId,
      command: "downloadGradescopeData",
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
        return response.json(); // Parse the JSON of the response
      })
      .then((data) => {
        if (data.success === "true") {
          toast.success(data.message);
          console.log(data.message);
          console.log(data.filename);
          // After the Python script has successfully downloaded the CSV, trigger the PHP function to parse the download csv and store the data to the db
          fetch(props.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              command: "updateGradescopeDataByCourse",
              user: localStorage.getItem("asci-user"),
              course_id: courseId,
              download_file_name: data.filename,
            }),
          })
            .then((response) => {
              if (!response.ok) {
                // If the HTTP status code is not 200-299, throw an error
                throw new Error("Network response was not ok");
              }
              return response.json(); // Parse the JSON of the response
            })
            .then((data) => {
              if (data.success === "true") {
                toast.success(data.message);
                console.log(data.message);
                console.log(
                  "Here are the computing_ids for students whose data failed to be inserted into the database. Please check out the roster in the database to make sure they are included.",
                  data.missingStudents
                );
              } else {
                console.log(data.message);
                toast.error(
                  data.message ||
                    "Failed to insert GradeScope downloaded data into the database."
                );
              }
            })
            .catch((error) => {
              console.error("Error calling PHP backend:", error);
            });
        } else {
          console.log(data.message);
          toast.error(data.message || "Failed to download Gradescope data.");
        }
      })
      .catch((error) => {
        console.error("Error during synchronization:", error);
        toast.error("Error during synchronization.");
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
