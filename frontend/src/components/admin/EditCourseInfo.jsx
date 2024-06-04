import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function EditCourseInfo(props) {
  let url = props.url;
  let docRoot = props.documentRoot;
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [mnemonic, setMnemonic] = useState("");
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [semester, setSemester] = useState("");

  const handleSubmit = () => {
    const updatedCourse = {
      course_id: courseId,
      mnemonic,
      number,
      name,
      semester,
      command: "updateCourseInfo",
      user: localStorage.getItem("asci-user"),
    };

    // Call the backend API to update the course
    updateCourse(updatedCourse);
  };

  const updateCourse = (course) => {
    fetch(props.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(course),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        if (data.success) {
          toast.success("Course updated successfully!");
          navigate(docRoot);
        } else {
          toast.error("Error updating the course");
          navigate(docRoot + "/error");
        }
      })
      .catch((error) => {
        toast.error("Error updating the course");
        navigate(docRoot + "/error");
      });
  };

  return (
    <>
    
      <form class="border border-primary rounded p-2">
      <div class="form-group mb-2">
        <h4>Edit Course Information</h4>
        <input
          type="text" class="form-control"
          value={mnemonic}
          onChange={(e) => setMnemonic(e.target.value)}
          placeholder="Mnemonic"></input>
        </div>
        <div class="form-group mb-2">
        <input
          type="text" class="form-control"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="Number" />
        </div>
        <div class="form-group mb-2">
        <input
          type="text" class="form-control"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name" />
        </div>
        <div class="form-group mb-2">
        <input
          type="text" class="form-control"
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          placeholder="Semester" />
        </div>
        <button type="button" class="btn btn-primary" onClick={handleSubmit}>Update Course</button>
      </form>
    </>
  );
}

export default EditCourseInfo;
