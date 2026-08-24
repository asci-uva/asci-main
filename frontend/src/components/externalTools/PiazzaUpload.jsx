import React, { useRef, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../context/UserContext";
import { isInstructorRole } from "../utils/roles";

function PiazzaUpload(props) {
  const { user, getCourse } = useUser();
  const course = getCourse();
  const courseId = props.course_id;

  const [piazzaFile, setPiazzaFile] = useState(null);
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const fileInputRef = useRef(null);

  const canUpload = isInstructorRole(course?.role);

  const handleFileChange = (event) => {
    setPiazzaFile(event.target.files[0] || null);
  };

  const clearFile = () => {
    setPiazzaFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = () => {
    if (!piazzaFile || uploadInProgress) return;

    toast("Uploading Piazza export. Please wait...", { autoClose: false });
    setUploadInProgress(true);

    const formData = new FormData();
    formData.append("command", "uploadPiazza");
    formData.append("user", user.userid);
    formData.append("courseid", courseId);
    formData.append("piazzacontent", piazzaFile);

    fetch(props.uploadurl, {
      method: "POST",
      credentials: "include",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        toast.dismiss();
        setUploadInProgress(false);

        if (!data || data.success !== "true") {
          console.log(data);
          toast.error(
            (data && data.error) || "Error uploading the Piazza export"
          );
          return;
        }

        toast.success("Piazza export uploaded successfully!");
        clearFile();
        if (props.onUploaded) props.onUploaded();
      })
      .catch((error) => {
        console.log(error);
        toast.dismiss();
        setUploadInProgress(false);
        toast.error("There was an error uploading the Piazza export");
      });
  };

  if (!canUpload) return null;

  return (
    <div className="card mb-4">
      <h4 className="card-header">Upload Piazza Export</h4>
      <div className="card-body">
        <form className="mb-0">
          <label className="form-label">Piazza Export ZIP</label>
          <div className="input-group mb-3">
            <input
              className="form-control"
              type="file"
              accept=".zip"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={uploadInProgress}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={uploadInProgress || piazzaFile === null}
            >
              {uploadInProgress ? "Uploading (Please Wait)" : "Upload"}
            </button>
          </div>
          <p className="form-text mb-0">
            Upload the ZIP file exactly as Piazza provides it. Request it from
            Piazza's statistics page and they will email you a download link. The
            archive must still contain <code>users.json</code> and{" "}
            <code>contributions.csv</code>, which supply the per-student totals
            and the contribution history on the Analytics page. Max upload size
            is 80MB.
          </p>
        </form>
      </div>
    </div>
  );
}

export default PiazzaUpload;
