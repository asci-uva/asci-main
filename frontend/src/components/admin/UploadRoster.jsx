import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../context/UserContext";
import { postCommand } from "../utils/postCommand";
import ConfirmModal from "../utils/ConfirmModal";

function UploadRoster(props) {
  const [rosterFile, setRosterFile] = useState(null);
  const { user, getCourse, courseSettings, setCourseSettings, refreshCourseRoster, refreshCourseList } = useUser();
  const [disabled, setDisabled] = useState(false);
  const [showSyncRosterModal, setShowSyncRosterModal] = useState(false);
  const [syncRosterButtonDisabled, setSyncRosterButtonDisabled] = useState(false);
  const [showSyncRosterResults, setShowSyncRosterResults] = useState(false);
  const [syncRosterResults, setSyncRosterResults] = useState({});

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

    postCommand(props.url, payload)
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

  const syncRoster = () => {
    setShowSyncRosterModal(true);
  };

  const confirmSyncCanvasLmsRoster = () => {
    setShowSyncRosterModal(false);
    setSyncRosterButtonDisabled(true);

    const payload = {
      asciCourseId: props.course_id,
      command: "syncCanvasLmsRoster",
    };

    postCommand(props.url, payload)
      .then((data) => {
        setSyncRosterButtonDisabled(false);
        if (data.success === "true") {
          console.log("Roster synced:", data);
          toast.success("Successfully synced Canvas LMS roster");
          refreshCourseRoster();
          setShowSyncRosterResults(true);
          setSyncRosterResults(data);
        } else {
          console.log(data.error);
          toast.error(data.error || "Failed to sync Canvas LMS roster");
        }
      })
      .catch((error) => {
        setSyncRosterButtonDisabled(false);
        console.log(error);
        toast.error(error);
      })
  };

  function getSyncRosterButton() {
    if (!props.hasCanvasLmsAccessToken)
      return (
        <>
        <p className="text-muted">Cannot sync course without a Canvas LMS access token</p>
        <button type="button" className="btn btn-primary" disabled>Synchronize Course Roster</button>
        </>
    );

    if (syncRosterButtonDisabled)
      return (
        <button type="button" className="btn btn-primary" disabled>Syncing Roster (Please Wait)</button>
      );
    return (
      <button type="button" className="btn btn-primary" onClick={syncRoster}>Synchronize Course Roster</button>
    );
  }

  function getSyncRosterResults() {
    const data = syncRosterResults;

    const sections = [
      { key: "added", label: "Added" },
      { key: "updated", label: "Updated" },
      { key: "removed", label: "Removed" },
      { key: "skipped", label: "Skipped" },
    ];

    return (
      <div className="mb-3" style={{ maxHeight: "400px", overflowY: "auto" }}>
        {sections.map(({ key, label }) => {
          if (key === "skipped" && (!data[key] || data[key].length === 0)) {
            return null;
          }
          return (
            <div key={key} className="mt-3">
              <h6>{label} ({data[key]?.length || 0})</h6>
              {data[key] && data[key].length > 0 ? (
                <ul className="list-group">
                  {data[key].map((user, i) => (
                    <li key={i}>
                      <div className="d-flex justify-content-between">
                      <span>
                          <span className="text-muted me-2">
                            {user.computingId}
                          </span>
                        <span>{user.fname} {user.lname}</span>
                      </span>

                      <span className="text-muted">
                        {user.role}
                      </span>
                    </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>None</p>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="card mb-4">
      {props.canvasLmsCourse !== null ? (
        <>
        <h4 className="card-header">Synchronize Roster from Canvas LMS</h4>
        <div className="card-body">
          <div className="mb-3">
            <h5>Canvas LMS Course Info</h5>
            <p>
              Course Code: {props.canvasLmsCourse.course_code} <br />
              Course Name: {props.canvasLmsCourse.name}
            </p>
            {getSyncRosterButton()}
          </div>
          {showSyncRosterResults && (
            <div className="mb-3">
              <h5>Roster Sync Results</h5>
              {getSyncRosterResults()}
            </div>
          )}
        </div>
        <ConfirmModal
          show={showSyncRosterModal}
          title="Confirm Canvas Roster Sync"
          onCancel={() => setShowSyncRosterModal(false)}
          onConfirm={confirmSyncCanvasLmsRoster}
        >
          <p>Are you sure you want to sync the roster from <strong>{props.canvasLmsCourse.name}</strong> on Canvas LMS?</p>
          <p>WARNING: Syncing the roster will remove all manually added users except for Instructors</p>
        </ConfirmModal>
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
