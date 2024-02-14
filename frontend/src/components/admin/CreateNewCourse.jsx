import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function CreateNewCourse(props) {
  const [mnemonic, setMnemonic] = useState("");
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [semester, setSemester] = useState("");

  const navigate = useNavigate();

  const handleCreateCourse = () => {
    const newCourse = {
      mnemonic,
      number,
      name,
      semester,
      command: "createCourse",
      user: localStorage.getItem("asci-user"),
    };

    createCourse(newCourse);
  };

  let docRoot = props.documentRoot;

  const createCourse = (course) => {
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
          toast.success("Course created successfully!");
          navigate(docRoot); // back to the course management if success
        } else {
          toast.error("Error creating the course");
          navigate(docRoot + "/error");
        }
      })
      .catch((error) => {
        toast.error("Error creating the course");
        navigate(docRoot + "/error");
      });
  };

  return (
    <div className="question">
      <h2>Create New Course</h2>


        <label>Mnemonic:</label>
        <input
          type="text"
          value={mnemonic}
          onChange={(e) => setMnemonic(e.target.value)}
          required
        />

        <label>Number:</label>
        <input
          type="text"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          required
        />

        <label>Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label>Semester:</label>
        <input
          type="text"
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          required
        />

      <button onClick={handleCreateCourse}>Create Course</button>
    </div>
  );
}

export default CreateNewCourse;
