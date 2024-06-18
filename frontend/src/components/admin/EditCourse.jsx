import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import UploadRoster from "./UploadRoster";
import AddStudent from "./AddStudent";
import GradescopeSync from "./GradescopeSync";
import EditCourseInfo from "./EditCourseInfo";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function EditCourse(props) {
  let url = props.url;
  let docRoot = props.documentRoot;
  const { courseId } = useParams();
  const navigate = useNavigate();

  
  return (
    <>
    
      <div className="container">
        <div className="row">
          <div className="col-md">
            <EditCourseInfo course_id={courseId} {...props} />
          </div>
          <div className="col-md">
            <UploadRoster course_id={courseId} {...props} />
          </div>
          <div className="col-md">
            <AddStudent course_id={courseId} {...props} />
          </div>
        </div>
        <div className="row">
          <div className="col-md">
            <GradescopeSync course_id={courseId} {...props} />
          </div>
          <div className="col-md">
            
          </div>
          <div className="col-md">
            
          </div>
        </div>
      </div>
      
      
      
    </>
  );
}

export default EditCourse;
