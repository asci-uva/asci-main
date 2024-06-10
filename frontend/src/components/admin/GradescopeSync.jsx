import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../context/UserContext";


function GradescopeSync(props) {
  const [courseNumber, setCourseNumber] = useState("");
  const [username, setUsername] = useState("");
  const [passcode, setPasscode] = useState("");
  const [disabled, setDisabled] = useState(false);

  let {user, getCourse} = useUser();
  let course = getCourse();

  const navigate = useNavigate();

  const handleSynchronize = () => {
    setDisabled(true);
    const payload = {
      email: username,
      password: passcode,
      // this is the course number on GradeScope
      courseNumber: courseNumber,
      // this is the course id in database
      course_id: course.course_id,
      command: "downloadGradescopeData",
      user: user.userid,
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
          setDisabled(false);
          throw new Error("Network response was not ok");
        }
        return response.json(); // Parse the JSON of the response
      })
      .then((data) => {
        console.log("data is: ", data);
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
              user: user.userid,
              course_id: course.course_id,
              download_file_name: data.filename,
            }),
          })
            .then((response) => {
              if (!response.ok) {
                // If the HTTP status code is not 200-299, throw an error
                setDisabled(false);
                throw new Error("Network response was not ok");
              }
              return response.json(); // Parse the JSON of the response
            })
            .then((data) => {
              console.log("data is: ", data);
              setDisabled(false);
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
              setDisabled(false);
              console.error("Error calling PHP backend:", error);
            });
        } else {
          console.log(data.message);
          setDisabled(false);
          toast.error(data.message || "Failed to download Gradescope data.");
        }
      })
      .catch((error) => {
        console.error("Error during synchronization:", error);
        setDisabled(false);
        toast.error("Error during synchronization.");
      });
  };

  function getButton(){
    if(disabled)
      return (
          <button type="button" className="btn btn-primary" onClick={handleSynchronize} disabled>Synchronizing (Please Wait)</button>
        );
    else
      return (
          <button type="button" className="btn btn-primary" onClick={handleSynchronize}>Synchronize the Data</button>
        );
  }

  return (

    <div className="card">
        <h5 className="card-header">Gradescope Synchronization</h5>
          <div className="card-body">

            <form className="p-2">


              <label>Gradescope Course Number:</label>
              <input className="form-control mb-2"
                type="text"
                value={courseNumber}
                onChange={(e) => setCourseNumber(e.target.value)}
                required
              />

              <label>Gradescope Account Username:</label>
              <input className="form-control mb-2"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />

              <label>Gradescope Account Passcode:</label>
              <input className="form-control mb-2"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                required
              />

              
              {getButton()}
              
            </form>
          </div>
    </div>
  );
}

export default GradescopeSync;
