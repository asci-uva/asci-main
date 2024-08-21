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

  /* Handle searching through the table */
  /* ---------------------------------- */
  const onSearchBarChange = (e) => {
    console.log("searching!");
    var input, filter, table, tr, td, i, txtValue;
    input = document.getElementById("rosterSearchTextBox");
    filter = input.value.toUpperCase();
    table = document.getElementById("rosterTable");
    tr = table.getElementsByTagName("tr");

    // Loop through all table rows, and hide those who don't match the search query
    for (i = 0; i < tr.length; i++) {
      var tdAll = tr[i].getElementsByTagName("td");
      var match = false;
      for(var j = 0; j < tdAll.length; j++){
        td = tdAll[j];
        if (td) {
          txtValue = td.textContent || td.innerText;
          if (txtValue.toUpperCase().indexOf(filter) > -1) {
            match = true;
            break;
            
          } else {
            //keep searching
            
          }
        }
      }

      if(match) tr[i].style.display = "";
      else tr[i].style.display = "none";
    }
  }
  /* ---------------------------------- */
  /* ---------------------------------- */

  


  const RosterTableHeaderRow = () => {
    return (
        <tr>
          <th>Comp. Id.</th>
          <th>First Name</th>
          <th>Last Name</th>
          <th>Pref. Name</th>
          <th>Role</th>
        </tr>
      );
  }


  const RosterTableRow = ({data}) => {
    return Object.keys(data).map(k =>
      <tr key={k}>
        <td><b>{data[k].computing_id}</b></td>
        <td>{data[k].fname}</td>
        <td>{data[k].lname}</td>
        <td>{data[k].pname}</td>
        <td>{data[k].role}</td>
      </tr>
    );
  }

  const RosterTable = ({data}) => {    
    if(data.length > 0){
      return (
            <table id="rosterTable" className="table table-striped table-hover table-sm">
              <thead>
                <RosterTableHeaderRow />
              </thead>
              <tbody class="table-group-divider">
                <RosterTableRow data={data} />
              </tbody>
            </table>
          
      );
    }
    else return (
      <h5>There does not appear to be anyone enrolled yet. </h5>
    );
  }

  return (
      <div className="card">
        <h4 className="card-header">View Roster</h4>
        <div className="card-body">
          <div>
            <input
              id="rosterSearchTextBox"
              type="text" className="mb-1"
              onChange={onSearchBarChange}
              placeholder="Search..." />
          </div>
          <div style={{height: 500 + 'px'}} className="overflow-auto">
            <RosterTable data={courseRoster} />
          </div>
        </div>
      </div>
  );
}

export default ViewRoster;
