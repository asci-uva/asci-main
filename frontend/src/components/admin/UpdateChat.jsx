import React, { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../context/UserContext";

function UpdateChat(props) {
  const [courseFile, setCourseFile] = useState(null);
  const {user, getCourse} = useUser();
  let course = getCourse();

  const handleFileChange = (event) => {
    setCourseFile(event.target.files[0]);
  };

  const uploadContent = () => {
    if (!courseFile) return;

    var formData = new FormData();

    formData.append("command", "createLlm");
    formData.append("user", user.userid);
    formData.append("courseid", course.course_id);
    formData.append('coursecontent', courseFile);

    fetch("http://localhost:8081/fileupload.php", {
      method: "POST",
      body: formData
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        if (data) {
          console.log("Roster uploaded successfully!");
          toast.success("Roster uploaded successfully!");
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

    <div className="card">
        <h4 className="card-header">Update/Create LLM</h4>
          <form className="p-3">
      
            <input className="form-control mb-2" type="file" onChange={handleFileChange} accept=".zip" />
            <button type="button" className="btn btn-primary" onClick={uploadContent}>Upload</button>
      
          </form>

    </div>
  );
}

export default UpdateChat; 
