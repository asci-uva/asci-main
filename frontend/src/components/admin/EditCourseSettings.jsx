import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../context/UserContext";

function EditCourseSettings(props) {
  let url = props.url;
  let docRoot = props.documentRoot;
  const { courseId } = useParams();
  const navigate = useNavigate();

  const { user, getCourse, courseSettings, setCourseSettings, refreshCourseList } = useUser();
  let course = getCourse();

  console.log("course settings is: " , courseSettings);

  /* Course Visibility Settings */
  const [archived, setArchived] = useState(courseSettings.archived == "t");

  /* Quest Settings */
  const [showQuests, setShowQuests] = useState(courseSettings.show_quests == "t");
  

  const handleSubmit = () => {
    
    //Call the clear queue method
    let request = {};
    request.command = "setCourseSettings";
    request.user = user.userid;
    request.courseId = course.course_id;
    
    let newSettings = {
      course_id: course.course_id,
      show_quests: showQuests,
      archived: archived,
    };

    request.settings = newSettings;

    // Call the backend API to update the course
    updateSettings(request);
  };

  const updateSettings = (course) => {
    fetch(props.url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(course),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        if (data.success) {
          toast.success("Settings updated successfully!");

          setCourseSettings(data.settings);

          refreshCourseList({ user: user.userid }, (success) => {
            if (!success) {
              console.log("refreshing course list seems to have failed");
            }
          });
          
        } else {
          toast.error("Error updating course settings");
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

    const handleArchivedChange = (e) => {
      const element = e.target;
      console.log("changing boolean archived to " , element.checked);
      setArchived(element.checked);
    }

  const handleShowQuestsChange = (e) => {
      const element = e.target;
      console.log("changing boolean showQuests to " , element.checked);
      setShowQuests(element.checked);
  }

  return (
    <>
      <div className="card mb-4">
        <h4 className="card-header">ASCI Settings</h4>
          <div className="card-body">

            <h5>Course Lifecycle</h5>

            <div className="form-check form-switch mb-3">
              <input className="form-check-input" type="checkbox" id="courseArchived" checked={archived} onChange={ handleArchivedChange }></input>
              <label className="form-check-label" htmlFor="courseArchived"><b>Archive Course: </b>Hide this course from student and TA course selection while keeping instructor access for management and restoration</label>
            </div>

            <button type="button" className="btn btn-primary mb-3 mx-auto" onClick={handleSubmit}>Save Settings</button>

          </div>
      </div>
      
    </>
  );
}

export default EditCourseSettings;
