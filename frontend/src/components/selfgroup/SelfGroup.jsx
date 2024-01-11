import React from "react";
import {useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';

import AvailableSelfGroupsPanel from './AvailableSelfGroupsPanel';
import SelfGroupMemberPanel from './SelfGroupMemberPanel';

function SelfGroup(props) {

  const navigate = useNavigate();

  let user = props.user;
  let courseId = props.courseId;
  let url = props.url;
  let docRoot = props.documentRoot;
  let session = props.session;

  /*
   * -1: Loading component (pinging server to get status)
   * 0: Waiting to see what user wants
   * 1: In a group currently
   * 2: Rejected (said no thanks)
   */
  const [state, setState] = useState(-1);
  const [group, setGroup] = useState(null);
  const [availableGroups, setAvailableGroups] = useState(null);
  const [groupMembers, setGroupMembers] = useState(null);

  const fetchSelfGroupStatus = (json0, url0) =>{
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

          /* User now in a self create group */
          if(data.group == null){
            setState(0);
            setAvailableGroups(data.availableGroups);
          }
          else if(data.group != null){
            setState(1);
            setGroup(data.group);
            setGroupMembers(data.members);
          }
          
        }
        else{
          console.log("Server returned error");
          navigate(docRoot + "/error");
        }
      })
      .catch((error) => {
        console.log("There was an error:", error);
        navigate(docRoot + "/error");
        
      });
  }

  const getSelfGroupStatus = () =>{
    let request = {};
    request.command = "getSelfMadeGroup";
    request.user = localStorage.getItem('asci-user');
    request.courseId = localStorage.getItem('asci-course');
    request.sessionId = session.id;
    fetchSelfGroupStatus(request, url);  
  }



  /* THIS WILL RUN ON EVERY REFRESH */
  const onRefresh = () =>{
    /* ON REFRESH: If we have a session, ping server to get group details */
    if(session != null && state==-1) getSelfGroupStatus();   
    /* END PING SERVER FOR GROUP DETAILS */
  }

  const forceRefresh = () =>{
    getSelfGroupStatus();   
  }

  onRefresh();








   const handleCreateGroup = (e) =>{
    e.preventDefault();

    /* Request a self group be created */
    let request = {};
    request.command = "createSelfGroup";
    request.user = user;
    request.courseId = courseId;
    request.sessionId = session.id;
    request.location = session.location;
    createSelfGroupRequest(request, url);
  }

  const createSelfGroupRequest = (json0, url0) =>{
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

          /* User now in a self create group */
          if(data.group == null){
            setState(0);
          }
          else if(data.group != null){
            setState(1);
            setGroup(data.group);
            setGroupMembers(data.members);
          }
          
          
        }
        else{
          console.log("Server returned error");
          navigate(docRoot + "/error");
        }
      })
      .catch((error) => {
        console.log("There was an error:", error);
        navigate(docRoot + "/error");
        
      });
  }
  
  const handleNoThanks = (e) =>{
    e.preventDefault();
    /* State 2 equals user rejected group offer */
    setState(2);
  }

  const handleLeaveGroup = (e) =>{
    e.preventDefault();
    
    console.log("Leaving the group will happen here!");
    /* Request a self group be created */
    let request = {};
    request.command = "leaveSelfGroup";
    request.user = user;
    request.sessionId = session.id;
    request.groupId = group.id;
    //xxxxxx(request, url);

  }


  /* Render component based on state */
  if(session == null) return "";

  if(state == -1){
    return (
      <div className="question">
        <div>
        <h4>Loading...Please Wait a Moment.</h4>
        </div>
      </div>
    );
  }
  else if(state == 0){
    return (
      <div className="question">
        <div>
        <h4>Interested in joining a group while you wait?</h4>
        </div>
        
        <AvailableSelfGroupsPanel documentRoot={docRoot} url={url} refresh={forceRefresh} groups={availableGroups} sessionId={session.id} />
        
        <div>
          <h2>Or click here to create your own group and see if others join</h2>
          <button onClick={handleCreateGroup}>Create Group</button>
          <button onClick={handleNoThanks}>No Thanks</button>
        </div>
      </div>
      );
  }
  else if(state == 1){
    return (
      <div className="question">
        <div>
        <h4>You are in a group</h4>
        <h3> Issue: {group.issue}</h3>
        <h3> Location: {group.location}</h3>
        <SelfGroupMemberPanel callback={handleLeaveGroup} members={groupMembers} />
        </div>
      </div>
      );
  }
  else if(state == 2){
    return "";
  }
  else{
    return "";  
  }

}

export default SelfGroup;

