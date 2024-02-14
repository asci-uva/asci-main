import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function AddStudent(props) {
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [pname, setPname] = useState("");
  const [computingId, setComputingId] = useState("");
  const [role, setRole] = useState("student"); // default to 'student' / can be switched to ta

  const { course_id } = props;
  const navigate = useNavigate();
  const docRoot = props.documentRoot;

  const handleAdd = () => {
    const newUser = {
      command: "manuallyAddStudent",
      fname,
      lname,
      pname,
      computingId,
      role,
      course_id: course_id,
      user: localStorage.getItem("asci-user"),
    };

    fetch(props.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newUser),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        if (data) {
          toast.success("Student/TA added successfully!");
        } else {
          toast.error("Error adding the student/TA");
        }
      })
      .catch((error) => {
        toast.error("Error adding the student/TA");
      });
  };

  return (
    <div className="question">
      <h2>Manually Add Student/TA</h2>

      
        <label>First Name:</label>
        <input
          type="text"
          value={fname}
          onChange={(e) => setFname(e.target.value)}
          required
        />
      

      
        <label>Last Name:</label>
        <input
          type="text"
          value={lname}
          onChange={(e) => setLname(e.target.value)}
          required
        />
      

      
        <label>Prefer Name:</label>
        <input
          type="text"
          value={pname}
          onChange={(e) => setPname(e.target.value)}
          required
        />
      

      
        <label>Computing ID:</label>
        <input
          type="text"
          value={computingId}
          onChange={(e) => setComputingId(e.target.value)}
          required
        />
      

      
        <label>Role:</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="student">Student</option>
          <option value="ta">TA</option>
        </select>
      

      <button onClick={handleAdd}>Add</button>
    </div>
  );
}

export default AddStudent;
