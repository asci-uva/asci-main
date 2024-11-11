import React from "react";
import {useEffect, useState} from "react";
import { useNavigate } from 'react-router-dom';
import { useUser } from "../context/UserContext";

function HandleGroup(props) {
  let url = props.url;
  let docRoot = props.documentRoot;

  /* Importing user context */
  const { user, getCourse } = useUser();
  let course = getCourse();


  /* Info for the first student (from front of queue) */
  const [loading, setLoading] = useState(true);
  const [otherSessions, setOtherSessions] = useState({});
  const navigate = useNavigate();

  const [mainSessionId, setMainSessionId] = useState(-1);
  const [primeSubject, setPrimeSubject] = useState("");
  const [primeIssue, setPrimeIssue] = useState("");
  const [primeLocation, setPrimeLocation] = useState("");

  const [location, setLocation] = useState("");

  const [checked, setChecked] = useState({});

  const handleCheck = (e) => {
    console.log(e);
    console.log(e.target.name);
    var id = parseInt(e.target.name);
    console.log("id is " + id);

    var newChecked = {};
    for(var oldId in checked){
      if(oldId == id){
        newChecked[oldId] = !checked[oldId];
      }
      else{
        newChecked[oldId] = checked[oldId];
      }
    }

    setChecked(newChecked);

  };

  useEffect(()=>{
    pollMatchedStudents();
  },[])

  function pollMatchedStudents(){
    let request = {};
    request.command = "getPotentialGroupInfo";
    request.user = user.userid;
    request.courseId = course.course_id;
    getMatchedInfo(request, url); 
  }

  const getMatchedInfo = (json0, url0) =>{
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
        if(data.success === "true"){

          /* Set up issue vars also */
          setMainSessionId(data.session.id);
          setPrimeSubject(data.session.issue_subject);
          setPrimeIssue(data.session.issue);
          setPrimeLocation(data.session.location);

          /* SET GROUP MEMBER INFO */
          setOtherSessions(data.group_sessions);

          for(var sess in data.group_sessions){
            checked[data.group_sessions[sess].id] = true;
          }

          setChecked(checked);

          setLoading(false);

        }
        else{
          console.log("Getting primary student info failed");
          console.log("error",data.error);
          navigate(docRoot + "/error");
        }

      }).catch((error) => {
        console.log("HOME: There was an error:", error);
        navigate(docRoot + "/error");

      });
  }



  /* HANDLE CREATING THE GROUP ONCE THE BUTTON IS PRESSED */
  const createGroup = (e) =>{
    e.preventDefault();

    //JOIN THE QUEUE
    let request = {};
    request.command = "createGroup";

    //set user and course so the server knows
    request.user = user.userid;
    request.courseId = course.course_id;
    request.sessionId = mainSessionId;
    request.location = location;

    request.groupSessions = [];

    for(var key in otherSessions){
      var sessId = otherSessions[key]['id'];

      if(checked[sessId] == true){
        request.groupSessions.push(sessId);
      }
    }

    console.log(request);
    createGroupRequest(request, url); 
  }

  //This function group request to server
  const createGroupRequest = (json0, url0) =>{
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
          navigate(docRoot + "/meeting");
        }
        else{
          console.log("JQ: Error, creating group failed");
          navigate(docRoot + "/error");
        }

      })
      .catch((error) => {
        console.log("JQ: There was an error:", error);
        navigate(docRoot + "/error");

      });

  }

  /* Handle canceling the group creation */
  const cancelGroup = (e) =>{
    e.preventDefault();

    //JOIN THE QUEUE
    let request = {};
    request.command = "cancelGroup";

    //set user and course so the server knows
    request.user = user.userid;
    request.courseId = course.course_id;
    request.sessionId = mainSessionId;

    console.log(request);
    cancelGroupRequest(request, url); 
  }

  //This function cancels group request to server
  const cancelGroupRequest = (json0, url0) =>{
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
          navigate(docRoot + "/");
        }
        else{
          console.log("JQ: Error, creating group failed");
          navigate(docRoot + "/error");
        }

      })
      .catch((error) => {
        console.log("JQ: There was an error:", error);
        navigate(docRoot + "/error");

      });

  }

  function GroupPanel(props){
    if(otherSessions == null || otherSessions.length == 0){
      return(
        <div>
          <h5>There are no potential group members right now. Please click Start Session to continue.</h5>
          <div className="my-auto text-center">
            <button className="btn btn-primary mx-3" onClick={createGroup}>Start Session</button>
            <button className="btn btn-danger mx-3" onClick={cancelGroup}>Cancel</button>
          </div>
        </div>
      );
    }
    else{
      return(
        <div className="my-3">
          <form>
            <div>
              <h4>Select similar issues to create a group</h4>
              <div className="card">
                <h5 className="card-header">Potential Group Members</h5>
                <ul className="list-group list-group-flush">
              {Object.keys(otherSessions).map(k => { 
                return (<li className="list-group-item" key ={k}>
                  <div className="row"><div className="col-1">
                    <input
                      type="checkbox"
                      className="form-check-input me-1"
                      id={"checkbox" + otherSessions[k]['id']}
                      name={otherSessions[k]['id']}
                      checked={checked[otherSessions[k]['id']]}
                      onChange={handleCheck}
                    />
                  </div><div className="col-11">
                    <label className="form-check-label stretched-link" htmlFor={"checkbox"+otherSessions[k]['id']}>{otherSessions[k]['issue']}</label>
                    <p className="mb-1"><b>Location:</b> {otherSessions[k]['location']}</p>
                  </div></div>
                  </li>
                );
              })}
                </ul>
            </div>
            </div>

            <div className="my-3">
              <h4>Begin the session</h4>
              <div className="input-group">
                <input
                  type = "text"
                  className="form-control"
                  placeholder="Enter meeting location..."
                  required
                  value = {location}
                  onChange={(e)=>setLocation(e.target.value)}
                />
                <button className="btn btn-primary" onClick={createGroup}>Start Session</button>
              </div>
              <div className="my-auto text-center">
                <button className="btn btn-danger mx-3" onClick={cancelGroup}>Cancel</button>
              </div>
            </div>
          </form>
        </div>
      );
    }
  }




  /* END CREATING GROUP ONCE BUTTON IS PRESSED */

  if(!loading){
    return(
      <div className="container p-4">
        <div className="row my-auto">
          <div className="col-md-4">
            <h1><i className="bi-list-ol big-icon"></i></h1>
            <h2>Handle Queue</h2>
            <p>You are now handling students for <b>{course.name}</b>.</p>
          </div>
          <div className="col-md-8 my-auto">
            <h3>Create Group</h3>
            <div className="card my-3">
              <h4 className="card-header">The following student is willing to be in a group</h4>
              <div className="card-body">
                <h5>{primeSubject}</h5>
                <p className="mb-0">{primeIssue}</p>
              </div>
              <div className="card-footer pb-0">
                <p className="mb-2"><b>Location:</b> {primeLocation}</p>
                
              </div>
            </div>

            <div>
              {GroupPanel(null)}
            </div>
          </div>
        </div>
      </div>
    );
  }
  else{
    return(
      <div className="container p-4">
        <div className="row my-auto">
          <div>
            <h2>Finding potential group members. This might take a few seconds.:</h2>
          </div>
        </div>
      </div>
    );
  }


}

export default HandleGroup;
