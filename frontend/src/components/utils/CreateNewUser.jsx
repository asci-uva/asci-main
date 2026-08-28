import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import { useUser } from "../context/UserContext";

function CreateNewUser(props) {
  // let url = props.url;
  let docRoot = props.documentRoot;

  const navigate = useNavigate();

  // const { user, refreshCourseList, isInstructor } = useUser();

  const [computing_id, setComputingID] = useState("");
  const [fname, setFName] = useState("");
  const [lname, setLName] = useState("");
  const [pname, setPName] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = () => {
    const createdUser = {
      computing_id,
      fname,
      lname,
      pname,
      password,
      command: "createUser",
    };

    // Call the backend API to update the course
    createUser(createdUser);
  };

  const createUser = (user) => {
    fetch(props.url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Data is: " , data);
        if (data.success) {
          toast.success("User created successfully!");
        } else {
          toast.error("Error creating user");
          navigate(docRoot + "/error");
        }
      })
      .catch((e) => {
        console.log("Error", e.stack);
        console.log("Error", e.name);
        console.log("Error", e.message);
        toast.error("Error creating user");
        navigate(docRoot + "/error");
      });
  };

  /* If user is not an admin, do not show this panel? */
  // if(!isAdmin()){
  //   return;
  // }

  return (
        <div className="container p-4">     
          <form>
            <div className="mb-3">
              <label className="form-label">Fill in the information below to create a user.</label>

              <input
                type="text" className="form-control mb-1"
                value={computing_id}
                onChange={(e) => setComputingID(e.target.value)}
                placeholder="Computing ID"></input>
             
              
              <input
                type="text" className="form-control mb-1"
                value={fname}
                onChange={(e) => setFName(e.target.value)}
                placeholder="First Name" />
              
              
              <input
                type="text" className="form-control mb-1"
                value={lname}
                onChange={(e) => setLName(e.target.value)}
                placeholder="Last Name" />
              
          
              <input
                type="text" className="form-control mb-1"
                value={pname}
                onChange={(e) => setPName(e.target.value)}
                placeholder="Preferred Name" />


              <input
                type="password" className="form-control mb-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password" />
              
              <div className="p-1"><button type="button" className="btn btn-primary" onClick={handleSubmit}>Create New User</button></div>
            </div>
          </form>
        </div>
    );
  }

export default CreateNewUser;
