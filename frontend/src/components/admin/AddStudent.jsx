import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useUser } from "../context/UserContext";


function AddStudent(props) {
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [pname, setPname] = useState("");
  const [computingId, setComputingId] = useState("");
  const [role, setRole] = useState("student"); // default to 'student' / can be switched to ta

  let { user, getCourse, refreshCourseRoster } = useUser();
  let course = getCourse();

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
      course_id: course.course_id,
      user: user.userid,
    };

    fetch(props.url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newUser),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        if (data.success) {
          toast.success("Student/TA added successfully!");
          refreshCourseRoster();
        } else {
          toast.error("Error adding the student/TA");
        }
      })
      .catch((error) => {
        toast.error("Error adding the student/TA");
      });
  };

  return (


    <div className="card">
      <h4 className="card-header">Add Individual</h4>
      <div className="card-body">

        {props.canvasLmsCourseLoaded && props.canvasLmsAccessTokenInfo.hasToken && props.canvasLmsCourse && (
          <div className="alert alert-warning d-flex justify-content-between align-items-center mb-3">
            <span>
              This course is still linked to Canvas LMS course {props.canvasLmsCourse.course_code} {props.canvasLmsCourse.name}.
              Manually added students will be removed upon next sync.
            </span>
          </div>
        )}

        <form className="">

          <div className="mb-3">
            <label htmlFor="fnameinput" className="form-label">First Name</label>
            <input type="text" value={fname} onChange={(e) => setFname(e.target.value)}
              required className="form-control" id="fnameinput" placeholder="First Name"></input>
          </div>



          <div className="mb-3">
            <label htmlFor="lnameinput" className="form-label">Last Name</label>
            <input type="text" value={lname} onChange={(e) => setLname(e.target.value)}
              required className="form-control" id="lnameinput" placeholder="Last Name"></input>
          </div>



          <div className="mb-3">
            <label htmlFor="onameinput" className="form-label">Preferred Name</label>
            <input type="text" value={pname} onChange={(e) => setPname(e.target.value)}
              required className="form-control" id="pnameinput" placeholder="Preferred Name"></input>
          </div>



          <div className="mb-3">
            <label htmlFor="compidinput" className="form-label">Computing Id</label>
            <input type="text" value={computingId} onChange={(e) => setComputingId(e.target.value)}
              required className="form-control" id="compidinput" placeholder="Computing Id"></input>
          </div>


          <div className="mb-3">
            <label htmlFor="role" className="form-label">Role:</label>
            <select className="form-select" value={role} id="role" onChange={(e) => setRole(e.target.value)}>
              <option value="student">Student</option>
              <option value="ta">TA</option>
              <option value="instructor">Instructor</option>
            </select>
          </div>



          <button type="button" className="btn btn-primary" onClick={handleAdd}>Add Individual</button>

        </form>
      </div>
    </div>
  );
}

export default AddStudent;
