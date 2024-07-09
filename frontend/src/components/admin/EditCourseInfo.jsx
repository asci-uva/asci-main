import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../context/UserContext";

function EditCourseInfo(props) {
  let url = props.url;
  let docRoot = props.documentRoot;
  const { courseId } = useParams();
  const navigate = useNavigate();

  const { user, getCourse, courseSettings, setCourseSettings, refreshCourseList } = useUser();
  let course = getCourse();

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
      user: user.userid,
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

          refreshCourseList({user : user.userid}, (success) => {
              if (success) {
                //Nothing to do...
              } else {
                console.log("refreshing course list seems to have failed");
              }
            });

          
          navigate(docRoot);
        } else {
          toast.error("Error updating the course");
          navigate(docRoot + "/error");
        }
      })
      .catch((e) => {
        console.log("Error", e.stack);
        console.log("Error", e.name);
        console.log("Error", e.message);
        toast.error("Error updating the course");
        navigate(docRoot + "/error");
      });
  };

  return (
    <>
    
      
      <div className="card mb-4">
        <h4 className="card-header">Modify Course Identifiers</h4>
          <div className="card-body">

            <form className="">

              <div class="input-group mb-3">
            <input
              type="text" className="form-control"
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
              placeholder="Mnemonic"></input>
           
            
            <input
              type="text" className="form-control"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Number" />
            
            <input
              type="text" className="form-control"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              placeholder="Semester" />
           
               </div>

            <input
              type="text" className="form-control mb-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name" />
            
            
            
            <button type="button" className="btn btn-primary" onClick={handleSubmit}>Save Identifier</button>

            </form>
          </div>
      </div>
      
    </>
  );
}

export default EditCourseInfo;
