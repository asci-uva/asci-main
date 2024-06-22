import React from "react";
import {useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';
import { useUser } from "../context/UserContext";
import { SelectCourse } from "./";
import { CreateNewCourse } from "./";

function SelectCourseHome(props) {
  
    let url = props.url;
    let docRoot = props.documentRoot; 
    
    return (
      <div className="container p-4">
        <div className="row my-auto">
          <div className="col-md-4">
            <h1><i className="bi-mortarboard big-icon"></i></h1>
            <h2>Select Course</h2>
            <p>Please select the course you would like to view.</p>
          </div>
          
          <div className="col-md-6">
            <SelectCourse {...props} />  

            <CreateNewCourse {...props} />
          </div>

        </div>
      </div>
    );
}

export default SelectCourseHome;

