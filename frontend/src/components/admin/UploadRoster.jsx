import React, { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../context/UserContext";

function UploadRoster(props) {
  const [rosterFile, setRosterFile] = useState(null);
  const { user, getCourse, courseSettings, setCourseSettings, refreshCourseRoster, refreshCourseList } = useUser();
  let course = getCourse();

  const handleFileChange = (event) => {
    setRosterFile(event.target.files[0]);
  };

  const parseCSV = (data) => {
    const rows = data.split("\n");
    const users = [];
    for (let i = 4; i < rows.length; i++) {
      const cells = rows[i].split(",");
      if (cells.length >= 6) {
        let role = cells[5].toLowerCase().trim();
        if (role === "teacher") {
          role = "ta";
        } else if (role === "student") {
          role = "student";
        }
        users.push({
          fname: cells[1].trim(),
          lname: cells[0].trim(),
          pname: cells[1].trim(),
          computing_id: cells[3].trim(),
          role: role,
        });
      }
    }
    return users;
  };

  const uploadRoster = () => {
    if (!rosterFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rosterData = parseCSV(event.target.result);
        console.log(rosterData);
        sendRosterToBackend(rosterData);
      } catch (error) {
        console.error("Error parsing the roster CSV:", error);
      }
    };
    reader.readAsText(rosterFile);
  };

  const sendRosterToBackend = (rosterData) => {
    const payload = {
      command: "uploadRoster",
      roster: rosterData,
      user: user.userid,
      course_id: course.course_id,
    };

    console.log("Upload roster payload: ", payload);

    fetch(props.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Upload roster respond: ", data);
        if (data.success) {
          console.log("Roster uploaded successfully!");
          toast.success("Roster uploaded successfully!");
          refreshCourseRoster();
        } else {
          console.error("Error uploading the roster");
          toast.error("Error uploading the roster");
        }
      })
      .catch((error) => {
        console.error("There was an error:", error);
        toast.error("There was an error uploading the roster");
      });
  };

  return (

    <div className="card mb-4">
        <h4 className="card-header">Upload Roster</h4>
          <form className="p-3">
      
            <div className="input-group">
            <input className="form-control" type="file" onChange={handleFileChange} accept=".csv" />
            <button type="button" className="btn btn-primary" onClick={uploadRoster}>Upload</button>
            </div>
          </form>

    </div>
  );
}

export default UploadRoster;
