import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import UploadRoster from "./UploadRoster";
import AddStudent from "./AddStudent";
import GradescopeSync from "./GradescopeSync";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function EditCourse(props) {
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
      <div className="question">
        <h2>Edit Course</h2>
        <input
          value={mnemonic}
          onChange={(e) => setMnemonic(e.target.value)}
          placeholder="Mnemonic"
        />
        <input
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="Number"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
        />
        <input
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          placeholder="Semester"
        />
        <button onClick={handleSubmit}>Update Course</button>
      </div>

      <UploadRoster course_id={courseId} {...props} />
      <AddStudent course_id={courseId} {...props} />
      <GradescopeSync course_id={courseId} {...props} />
    </>
  );
}

export default EditCourse;
