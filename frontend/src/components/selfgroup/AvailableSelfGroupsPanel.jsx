import React from "react";
import {useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';

/* Shows available self made groups and provides a "join" button for each one. */
function AvailableSelfGroupsPanel(props) {

  const navigate = useNavigate();

  let docRoot = props.documentRoot;
  let url = props.url;
  let groups = props.groups;
  let sessionId = props.sessionId;
  let refreshCallback = props.refresh;

  console.log("Groups is: " + groups);
  console.log("refreshCallback is: " + refreshCallback);

  const handleJoin = (e) =>{
    e.preventDefault();
    
    if(localStorage.getItem('asci-user') === null) navigate(docRoot + "/login");
    else if(localStorage.getItem('asci-course') === null) navigate(docRoot + "/selectCourse");
    else{
      //Attempt to join group
      let request = {};
      request.command = "joinSelfMadeGroup";
      request.user = localStorage.getItem('asci-user');
      request.groupId = e.target.value;
      request.sessionId = sessionId;
      joinSelfMadeGroup(request, url); 
    }
  }

  const joinSelfMadeGroup = (json0, url0) =>{
    fetch(url0, {
      method: 'POST', // or 'PUT'
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(json0),
    }).then(response => response.json())
    .then(data => {
        console.log("Data is: ", data);
        let success = data.success;
        if(success === "true"){

          /* Success...do something!! */
          refreshCallback();
          
        }
        else{
          console.log("HOME: Server returned error");
          navigate(docRoot + "/error");
        }
      })
      .catch((error) => {
        console.log("HOME: There was an error:", error);
        navigate(docRoot + "/error");
        
      });
  }




  /* Rendering The Table of Groups */
  const GroupTableHeaderRow = () => {
      return <tr><th>Group Issue</th><th>Join Group</th></tr>;
    }

  const GroupTableRow = ({data}) => {
    return Object.keys(data).map(k =>
      <tr key={data[k].id}>
        <td>{data[k].issue}</td>
        <td><button value={data[k].id} onClick={handleJoin}>Join</button></td>
      </tr>
    );
  }

  const GroupTable = ({data}) => {
    if(data.length > 0){
      return (
        <table>
          <GroupTableHeaderRow />
          <GroupTableRow data={data} />
        </table>
      );
    }
    else return;
  }


  /* Main Rendering Area */

  if(groups == null || groups.length==0){
    return (
      <div className="question waitlist">
        <h4>Available Groups</h4>
        <h5>There are no groups available at this time.</h5>
      </div>
    );
  }
  
  return (
    <div className="question waitlist">
      <div>
      <h4>Available Groups</h4>
      <GroupTable data={groups} />
      </div>
    </div>
  );
  

}

export default AvailableSelfGroupsPanel;

