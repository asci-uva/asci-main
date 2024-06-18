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

    let {user, getCourse} = useUser();

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
      user: user,
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
        if (data.success) {
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
    

    <div className="card">
        <h5 className="card-header">Add Student or TA</h5>
          <div className="card-body">

            <form className="">
      
              
                <div className="form-floating mb-1">
                  <input type="text" value={fname} onChange={(e) => setFname(e.target.value)}
                  required className="form-control" id="fnameinput" placeholder="first name"></input>
                  <label for="fnameinput">First Name</label>
                </div>
              

              
                <div className="form-floating mb-1">
                  <input type="text" value={lname} onChange={(e) => setLname(e.target.value)}
                  required className="form-control" id="lnameinput" placeholder="last name"></input>
                  <label for="lnameinput">Last Name</label>
                </div>
              

              
                <div className="form-floating mb-1">
                  <input type="text" value={pname} onChange={(e) => setPname(e.target.value)}
                  required className="form-control" id="pnameinput" placeholder="preferred name"></input>
                  <label for="onameinput">Preferred Name</label>
                </div>
              

              
                <div className="form-floating mb-1">
                  <input type="text" value={computingId} onChange={(e) => setComputingId(e.target.value)}
                  required className="form-control" id="compidinput" placeholder="Computing Id"></input>
                  <label for="compidinput">Computing Id</label>
                </div>
              
            
              <div>
              <label className="mb-1">Role:</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="ta">TA</option>
              </select>
              </div>
              
            

              <button type="button" className="btn btn-primary" onClick={handleAdd}>Add</button>
  
            </form>
          </div>
      </div>
  );
}

export default AddStudent;
