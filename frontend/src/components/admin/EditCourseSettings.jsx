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

  const { user, getCourse, courseSettings, setCourseSettings } = useUser();
  let course = getCourse();

  console.log("course settings is: " , courseSettings);

  /* Queue Settings */
  const [showQueueList, setShowQueueList] = useState(courseSettings.show_queue_list == "t");
  const [groupingEnabled, setGroupingEnabled] = useState(courseSettings.grouping_enabled == "t");
  const [smartGrouping, setSmartGrouping] = useState(courseSettings.smart_grouping == "t");

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
      show_queue_list: showQueueList,
      grouping_enabled: groupingEnabled,
      smart_grouping: smartGrouping,
      show_quests: showQuests,     //this one cannot actually be changed
    };

    request.settings = newSettings;

    // Call the backend API to update the course
    updateSettings(request);
  };

  const updateSettings = (course) => {
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
          toast.success("Settings updated successfully!");

          setCourseSettings(data.settings);
          
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

  const handleShowQueueListChange = (e) => {
      const element = e.target;
      console.log("changing boolean showQueueList to " , element.checked);
      setShowQueueList(element.checked);
  }

  const handleGroupingEnabledChange = (e) => {
      const element = e.target;
      console.log("changing boolean groupingEnabled to " , element.checked);
      setGroupingEnabled(element.checked);
  }

  const handleSmartGroupingChange = (e) => {
      const element = e.target;
      console.log("changing boolean smartGrouping to " , element.checked);
      setSmartGrouping(element.checked);
  }

  return (
    <>
      <div className="card">
        <h5 className="card-header">Course Settings</h5>
          <div className="card-body">

            <h5>Queue Settings</h5>

            <div className="form-check form-switch">
              <input className="form-check-input" type="checkbox" id="showQueueList" checked={showQueueList} onChange={ handleShowQueueListChange }></input>
              <label className="form-check-label" htmlFor="showQueueList"><b>Show Full Queue: </b>Entire queue will be shown to teaching assistants</label>
            </div>
            <div className="form-check form-switch">
              <input className="form-check-input" type="checkbox" id="groupingEnabled" checked={groupingEnabled} onChange={ handleGroupingEnabledChange }></input>
              <label className="form-check-label" htmlFor="groupingEnabled"><b>Enable Groups: </b>Allow students to be helped in groups</label>
            </div>
            <div className="form-check form-switch">
              <input className="form-check-input" type="checkbox" id="smartGrouping" checked={smartGrouping} onChange={ handleSmartGroupingChange }></input>
              <label className="form-check-label" htmlFor="smartGrouping"><b>Enable Smart Grouping: </b>Recommended student groups will be presented to TAs based on student issues</label>
            </div>

            <h5>Quick Task Settings</h5>

            <div className="form-check form-switch mb-1">
              <input className="form-check-input" type="checkbox" id="showQuests" checked={false} disabled></input>
              <label className="form-check-label" htmlFor="showQuests"><b>Enable Quick Tasks: </b>(Coming Soon...)</label>
            </div>

            <button type="button" className="btn btn-primary" onClick={handleSubmit}>Save Settings</button>

          </div>
      </div>
      
    </>
  );
}

export default EditCourseSettings;
