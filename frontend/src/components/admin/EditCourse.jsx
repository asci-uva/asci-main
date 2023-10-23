import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

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
          console.log("Course updated successfully!");
          navigate(docRoot);
        } else {
          console.error("Error updating the course");
          navigate(docRoot + "/error");
        }
      })
      .catch((error) => {
        console.error("There was an error:", error);
        navigate(docRoot + "/error");
      });
  };

  return (
    <div>
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
  );
}

export default EditCourse;
