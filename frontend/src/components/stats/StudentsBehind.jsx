import React, { useState } from "react";
import { useEffect, useRef } from "react";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../context/UserContext";
import c3 from 'c3';
import 'c3/c3.css';

function StudentsBehind(props) {
  
  const {user, getCourse} = useUser();
  const [studentsBehind, setStudentsBehind] = useState(null);
  let course = getCourse();
  let url = props.url;
  
  //This function runs on page load!
  useEffect(() => {
    let request = {};
    request.command = "getStudentsFallingBehind";
    request.user = user.userid;
    request.courseId = course.course_id;

    console.log("Payload is: ", request);

    fetch(url, {
      method: "POST", // or 'PUT'
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Data is: ", data);
        
        if (data.success) {
          console.log("Received studs failing behind");

          /* DO SOMETHING HERE?? */
          if(studentsBehind == null)
            setStudentsBehind(data.students);

        } else {
          console.log("Stud. Falling Behind: Server returned error");
        }
      })
      .catch((error) => {
        console.log("Stud. Falling Behind: There was an error:", error);
      });

  });

    

    /* Handle searching through the table */
  /* ---------------------------------- */
  const onSearchBarChange = (e) => {
    console.log("searching!");
    var input, filter, table, tr, td, i, txtValue;
    input = document.getElementById("SBSearchTextBox");
    filter = input.value.toUpperCase();
    table = document.getElementById("SBTable");
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


  //BEGIN HTML
  //----------------------------------

  const SBTableHeaderRow = () => {
    return (
        <tr>
          <th>Comp. Id.</th>
          <th>First Name</th>
          <th>Last Name</th>
          <th>Num. Low Scores</th>
          <th>OH Visits</th>
          <th>Piazza Posts</th>
          <th>Piazza Asks</th>
          <th>Piazza Answers</th>
        </tr>
      );
  }


  const SBTableRow = ({data}) => {
    return Object.keys(data).map(k =>
      <tr key={k}>
        <td><b>{data[k].computing_id}</b></td>
        <td>{data[k].fname}</td>
        <td>{data[k].lname}</td>
        <td>{data[k].subcount}</td>
        <td>{data[k].ohcount}</td>
        <td>{data[k].posts}</td>
        <td>{data[k].asks}</td>
        <td>{data[k].answers}</td>
      </tr>
    );
  }

  const SBTable = ({data}) => {    
    if(data != null && data.length > 0){
      return (
            <table id="SBTable" className="table table-striped table-hover table-sm">
              <thead>
                <SBTableHeaderRow />
              </thead>
              <tbody className="table-group-divider">
                <SBTableRow data={data} />
              </tbody>
            </table>
          
      );
    }
    else return (
      <h5>There does not appear to be anyone falling behind, perhaps because grade data is not synced yet. </h5>
    );
  }

  return (
      <div className="card">
        <h4 className="card-header">View Students Falling Behind</h4>
        <div className="card-body">
          <div>
            <input
              id="SBSearchTextBox"
              type="text" className="mb-1"
              onChange={onSearchBarChange}
              placeholder="Search..." />
          </div>
          <div style={{height: 500 + 'px'}} className="overflow-auto">
            <SBTable data={studentsBehind} />
          </div>
        </div>
      </div>
  );



}

export default StudentsBehind; 

