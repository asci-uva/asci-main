import React from "react";
import {useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';
import { useUser } from "../context/UserContext";

function SelectCourse(props) {
  // const [title, setTitle] = useState("question overview");
  // const [details, setDetails] = useState("question details");
  // const [purpose, setPurpose] = useState("");
  const navigate = useNavigate();
  
  const [purpose, setPurpose] = useState(0);
  
    let url = props.url;
  let docRoot = props.documentRoot; 
    const {user, courseListString, setCourse} = useUser();
  
    let courseList = courseListString();
    courseList[0] = "Select a course";
  const handleSelectCourse = (e) =>{
    e.preventDefault();

    //if user didn't select a course
    if (purpose !== 0){
      //TODO: Add student question
      console.log("Course id: ", purpose);
      console.log("Course name: ", courseList[purpose])

      //Set the local storage item
      setCourse(purpose);

      //navigate to the home page finally
      navigate(docRoot + "/");

    }

    

  }

    console.log("Courses", courseList);
    return (
      <div className="container p-4">
        <div className="row my-auto">
        <div className="col-md-4">
        <h1><i className="bi-mortarboard big-icon"></i></h1>
        <h2>Select Course</h2>
        <p>Please select the course you would like to view.</p>
        </div>
      <div className="col-md-8 my-auto">
      <form>
          <div className="mb-3">
          <label className="form-label">Please select your course below.</label>
        <select className="form-select" 
          value={purpose}
          onChange={(e)=>setPurpose(e.target.value)}>
          {Object.keys(courseList).map(
                k => (
                <option key={k} value={k}>
                    {courseList[k]}
                </option>
                )
          )}
        </select>
      </div>
          <button className="btn btn-primary" onClick={handleSelectCourse}>Select Course</button>
        </form>
      </div>
        </div>
        </div>
    );
}

export default SelectCourse;

