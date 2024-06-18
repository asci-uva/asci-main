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
    toast("Uploading course content and creating RAG. Please wait...", { autoClose: false});

    var formData = new FormData();

    formData.append("command", "createLlm");
    formData.append("user", user.userid);
    formData.append("courseid", course.course_id);
    formData.append('coursecontent', courseFile);

    fetch(props.uploadurl, {
      method: "POST",
      body: formData
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        toast.dismiss();
        if (data) {
          console.log("Course contents uploaded successfully!");
          toast.success("Course contents uploaded successfully!");
        } else {
          console.error("Error uploading the course contents");
          toast.error("Error uploading the course contents");
        }
      })
      .catch((error) => {
        console.error("There was an error:", error);
        toast.error("There was an error uploading the course contents");
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
