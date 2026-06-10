import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../context/UserContext";

function UploadRoster(props) {
  const [rosterFile, setRosterFile] = useState(null);
  const { user, getCourse, courseSettings, setCourseSettings, refreshCourseRoster, refreshCourseList } = useUser();
  const [disabled, setDisabled] = useState(false);
  const [showModal, setShowModal] = useState(false);

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
    setDisabled(false);

    const payload = {
      command: "uploadRoster",
      roster: rosterData,
      user: user.userid,
      course_id: course.course_id
    };

    console.log("Upload roster payload: ", payload);

    fetch(props.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
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

  const handleGetCanvasLmsCourseUsers = () => {
    setShowModal(true);
  };

  const confirmGetCanvasLmsCourseUsers = () => {
    setShowModal(false);
    setDisabled(true);

    const payload = {
      command: "getCanvasLmsCourseUsers",
      asciCourseId: course.course_id,
    };

    fetch(props.url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((response) => response.json())
      .then((data) => {
        setDisabled(false);
        console.log("Fetched Canvas LMS course users:", data);
        if (data.success) {
          const rosterData = parseCanvasLmsResponse(data.users);
          console.log(rosterData);
          sendRosterToBackend(rosterData);
        } else {
          console.log(data.error || "There was an error syncing Canvas LMS course users");
          toast.error(data.error || "There was an error syncing Canvas LMS course users");
        }
      })
      .catch((error) => {
        setDisabled(false);
        console.error("There was an error while fetching Canvas LMS course users:", error);
        toast.error("There was an error while fetching Canvas LMS course users");
      })
  };

  const parseCanvasLmsResponse = (users) => {
    const parsed_users = [];

    Object.entries(users).forEach(([role, userList]) => {
      if (role === "instructor")
        return;
      
      userList.forEach((user) => {
        let f_name = "";
        let l_name = "";

        const name_parts = user.sortable_name.split(",");
        l_name = name_parts[0]?.trim() || "";
        f_name = name_parts[1]?.trim() || "";

        parsed_users.push({
          fname: f_name,
          lname: l_name,
          pname: f_name,
          computing_id: user.sis_user_id,
          role: role,
        });
      });
    });

    return parsed_users;
  };

  function getSyncButton() {
    if (disabled)
        return (
        <button type="button" className="btn btn-primary" disabled>Fetching course roster (Please Wait)</button>
      );
    return (
      <button type="button" className="btn btn-primary" onClick={handleGetCanvasLmsCourseUsers}>Synchronize with Course Roster</button>
    );
  }

  return (

    <div className="card mb-4">
      {props.canvasLmsCourse !== null ? (
        <>
        <h4 className="card-header">Synchronize Roster from Canvas LMS</h4>
        <div className="card-body">
          <p>Course Name: {props.canvasLmsCourse.name}</p>
          {getSyncButton()}
        </div>
        {showModal && (
            <div className="modal show d-block" tabIndex="-1">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Confirm Canvas Roster Fetch</h5>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to fetch the roster from <strong>{props.canvasLmsCourse.name}</strong> on Canvas LMS?</p>
                            <p>WARNING: Syncing the roster will remove all manually added users except for Instructors</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => {setShowModal(false); setDisabled(false)}}>Cancel</button>
                            <button className="btn btn-primary" onClick={confirmGetCanvasLmsCourseUsers}>Confirm</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
      ) : (
        <>
        <h4 className="card-header">Upload Roster</h4>
        <form className="p-3">
          <div className="input-group">
          <input className="form-control" type="file" onChange={handleFileChange} accept=".csv" />
          <button type="button" className="btn btn-primary" onClick={uploadRoster}>Upload</button>
          </div>
        </form>
        </>
      )}
    </div>
  );
}

export default UploadRoster;
