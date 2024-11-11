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
    const {user, courseListString, setCourse, setCourseSettings} = useUser();
  
    let courseList = courseListString();
    courseList[0] = "Select a course";
  const handleSelectCourse = (e) =>{
    e.preventDefault();

    //if user didn't select a course
    if (purpose !== 0){
      
      console.log("Course id: ", purpose);
      console.log("Course name: ", courseList[purpose])

      //Set the local storage item
      setCourse(purpose);

      /* Get the course settings out of the DB */
      //Call the clear queue method
      let request = {};
      request.command = "getCourseSettings";
      request.user = user.userid;
      request.courseId = purpose;
      getCourseSettings(request, url); 

    }
  }

  const getCourseSettings = (json0, url0) =>{
    fetch(url0, {
      method: 'POST', // or 'PUT'
      credentials: "include",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(json0),
    }).then(response => response.json())
      .then(data => {
        console.log("Data is: ", data);

        //if request succeeded
        if(data.success === "true"){

          console.log("Course settings retrieved");
          setCourseSettings(data.settings);
          //navigate to the home page finally
          navigate(docRoot + "/");          
        }
        else{
          console.log("FATAL ERROR: Failed to get course settings");
        }

      })
      .catch((error) => {
        console.log("HOME: There was an error:", error);
        navigate(docRoot + "/error");

      });

  }

    console.log("Courses", courseList);
    return (
      <div className="container p-4">
        
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
    );
}

export default SelectCourse;

