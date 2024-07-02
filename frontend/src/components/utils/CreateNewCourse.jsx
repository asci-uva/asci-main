import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../context/UserContext";

function CreateNewCourse(props) {
  let url = props.url;
  let docRoot = props.documentRoot;

  const navigate = useNavigate();

  const { user, refreshCourseList, isInstructor } = useUser();

  /* This state variable changes how the component displays */
  const [state, setState] = useState(0); //0 just shows a link in text form (small). 1 shows form.

  const [mnemonic, setMnemonic] = useState("");
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [semester, setSemester] = useState("");

  const handleSubmit = () => {
    const createdCourse = {
      mnemonic,
      number,
      name,
      semester,
      command: "createCourse",
      user: user.userid,
    };

    // Call the backend API to update the course
    createCourse(createdCourse);
  };

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
        console.log("Data is: " , data);
        if (data.success) {
          toast.success("Course created successfully!");

          refreshCourseList({user : user.userid}, (success) => {
              if (success) {
                //Nothing to do...
              } else {
                console.log("refreshing course list seems to have failed");
              }
            });

          
          setState(0);
        } else {
          toast.error("Error creating course");
          navigate(docRoot + "/error");
        }
      })
      .catch((e) => {
        console.log("Error", e.stack);
        console.log("Error", e.name);
        console.log("Error", e.message);
        toast.error("Error creating course");
        navigate(docRoot + "/error");
      });
  };


  const handleLinkClick = (e) => {
    console.log("clicked!");
    setState(1);
  };
  const handleCancel = (e) => {
    console.log("clicked!");
    setState(0);
  };


  /* If user is not an instructor in any course, do not show this panel */
  if(!isInstructor()){
    return;
  }

  if(state == 0){
    return (
        <div>
          <p className="text-center"><a className="link-success" href="#" onClick={handleLinkClick}>You can create a new course here.</a></p>
        </div>
      );
  }
  else{ //should be 1
    return (
      <>

        <div className="container p-4">     
          <form>
            <div className="mb-3">
              <label className="form-label">Fill in the information below to create a course.</label>

              <input
                type="text" className="form-control mb-1"
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                placeholder="ECON"></input>
             
              
              <input
                type="text" className="form-control mb-1"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="101" />
              
              
              <input
                type="text" className="form-control mb-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Intro to Economics" />
              
              
              <input
                type="text" className="form-control mb-2"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="Sp-24" />
              
              <div className="p-1"><button type="button" className="btn btn-primary" onClick={handleSubmit}>Create New Course</button></div>
              <div className="p-1"><button type="button" className="btn btn-danger" onClick={handleCancel}>Cancel</button></div>
            </div>
          </form>
        </div>
        
        
      </>
    );
  }
}

export default CreateNewCourse;
