import React from "react";
import {useEffect, useState} from "react";
import { useNavigate } from 'react-router-dom';
import { useUser } from "../context/UserContext";

function ViewRoster(props) {

  let {user, getCourse, courseRoster, setCourseRoster, refreshCourseRoster} = useUser();
  let course = getCourse();

  let url = props.url; 
  let docRoot = props.documentRoot;

  useEffect(() => {
    // setCourseRoster(
    // [
    //   {computing_id: "mrf8t", fname: "Mark", lname: "Floryan", pname: "Mark", role: "instructor"}
    // ]
    //);

    refreshCourseRoster();
  

  }, []);

  


  const WaitTableHeaderRow = () => {
    return <tr><th>Comp. Id.</th><th>First Name</th><th>Last Name</th><th>Preferred Name</th><th>Role</th></tr>;
  }


  const WaitTableRow = ({data}) => {
    return Object.keys(data).map(k =>
      <tr key={k}>
        <td><b>{data[k].computing_id}</b></td><td>{data[k].fname}</td><td>{data[k].lname}</td><td>{data[k].pname}</td><td>{data[k].role}</td>
      </tr>
    );
  }

  const WaitTable = ({data}) => {    
    if(data.length > 0){
      return (
        
            <table className="table table-striped">
              <thead>
                <WaitTableHeaderRow />
              </thead>
              <tbody>
                <WaitTableRow data={data} />
              </tbody>
            </table>
          
      );
    }
    else return (
      <h5>There does not appear to be anyone enrolled yet. </h5>
    );
  }

  return (
    <div className="container p-4">
      <div className="row my-auto">        
        <div className="col-md-12 my-auto">
          <h5> You can view the roster for {course.name} below.</h5>
          <div>
            <WaitTable data={courseRoster} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewRoster;
