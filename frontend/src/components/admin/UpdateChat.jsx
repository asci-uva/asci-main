import React, { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../context/UserContext";

function UpdateChat(props) {
  const [courseFile, setCourseFile] = useState(null);
  const [piazzaFile, setPiazzaFile] = useState(null);
  const {user, getCourse} = useUser();
  let course = getCourse();

  const handleFileChange = (event) => {
    setCourseFile(event.target.files[0]);
  };
  const handlePiazzaFileChange = (event) => {
    setPiazzaFile(event.target.files[0]);
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
  
  const uploadPiazza = () => {
    if (!piazzaFile) return;
    toast("Uploading piazza data and creating RAG. Please wait...", { autoClose: false});

    var formData = new FormData();

    formData.append("command", "createLlmPiazza");
    formData.append("user", user.userid);
    formData.append("courseid", course.course_id);
    formData.append('piazzacontent', piazzaFile);

    fetch(props.uploadurl, {
      method: "POST",
      body: formData
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        toast.dismiss();
        if (data) {
          console.log("Piazza contents uploaded successfully!");
          toast.success("Piazza contents uploaded successfully!");
        } else {
          console.error("Error uploading the piazza contents");
          toast.error("Error uploading the piazza contents");
        }
      })
      .catch((error) => {
        console.error("There was an error:", error);
        toast.error("There was an error uploading the piazza contents");
      });

  };

  return (

    <div className="card mb-4">
        <h4 className="card-header">Upload Course Content</h4>
        <div className="card-body">
          <p>You may optionally upload course content to provide context to students using the LLM chatbot, so that they can get more tailored results based on your actual course content.</p>
          <form className="mb-3">
            <p className="form-label">Course Content ZIP</p>
            <div className="input-group mb-3"> 
            <input className="form-control" type="file" onChange={handleFileChange} accept=".zip" />
            <button type="button" className="btn btn-primary" onClick={uploadContent}>Upload</button>
            </div>
            <p className="form-text">This zip file should include any course content you would like the LLM to use when answering student questions.  Ideally, documents should be text, markdown, or PDF files.  Max upload size is 80MB.</p>
          </form>
          <form className="mb-3">
            <p className="form-label">Piazza Export ZIP</p>
      
            <div class="input-group mb-3"> 
            <input className="form-control" type="file" onChange={handlePiazzaFileChange} accept=".zip" />
            <button type="button" className="btn btn-primary" onClick={uploadPiazza}>Upload</button>
            </div>
            <p className="form-text">This zip file should be the exact file provided by Piazza when downloading all course content.  When requesting it from Piazza's statistics page, they will email you a link to this file.  We will ignore any posts with less than 10 views.  Max upload size is 80MB.</p>
      
          </form>
      </div>
    </div>
  );
}

export default UpdateChat; 
