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
          <h2>There are no potential group members right now. Please click Start Session to continue.</h2>
        </div>
      );
    }
    else{
      return(
        <div>
          <form>
            <div>
              <h2>Please select other issues that are similar to the one above:</h2>
              {Object.keys(otherSessions).map(k => { 
                return (<label key ={k}>
                  <input
                    type="checkbox"
                    name={otherSessions[k]['id']}
                    checked={checked[otherSessions[k]['id']]}
                    onChange={handleCheck}
                  />
                  <b>  Issue:</b> {otherSessions[k]['issue']}
                  <br />
                  <b>Location:</b> {otherSessions[k]['location']}
                </label>
                );
              })}
            </div>

            <div>
              <label>Where should the group meet?</label>
              <input
                type = "text"
                placeholder="Enter location here..."
                required
                value = {location}
                onChange={(e)=>setLocation(e.target.value)}
              />
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
      
          <div>
            <h2>The next student is willing to be in a group:</h2>
            <label><b>Subject:</b> {primeSubject}</label>
            <label><b>Issue:</b> {primeIssue} </label>
            <label><b>Location:</b> {primeLocation} </label>
          </div>

          <div>
            {GroupPanel(null)}
          </div>


          <div>
            <h6>Click here when you are ready to start the session.</h6>
            <button className="btn btn-primary p-1" onClick={cancelGroup}>Cancel</button>
            <button className="btn btn-primary p-1" onClick={createGroup}>Start Session</button>
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
