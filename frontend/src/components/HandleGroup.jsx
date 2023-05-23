import React from "react";
import {useEffect, useState} from "react";
import { useNavigate } from 'react-router-dom';

function HandleGroup(props) {
    let url = props.url;
    let docRoot = props.documentRoot;

    /* Info for the first student (from front of queue) */
    const [otherSessions, setOtherSessions] = useState({});
    const navigate = useNavigate();

    const [mainSessionId, setMainSessionId] = useState(-1);
    const [primeSubject, setPrimeSubject] = useState("LOADING");
    const [primeIssue, setPrimeIssue] = useState("LOADING");

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
                newChecked[oldId] = checked(oldId);
            }
        }

        setChecked(newChecked);
        console.log(newChecked);
      };

    useEffect(()=>{
        pollMatchedStudents();
    },[])

    function pollMatchedStudents(){
        let request = {};
        request.command = "getPotentialGroupInfo";
        request.user = localStorage.getItem('asci-user');
        request.courseId = localStorage.getItem('asci-course');
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

                /* SET GROUP MEMBER INFO */
                setOtherSessions(data.group_sessions);

                for(var sess in data.group_sessions){
                    console.log("sess is " + sess);
                    console.log(data.group_sessions[sess].id);
                    checked[data.group_sessions[sess].id] = false;
                    console.log(checked);
                }
                setChecked(checked);

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

        if(localStorage.getItem('asci-user') === null){
          navigate(docRoot + "/login");
        }
        else if(localStorage.getItem('asci-course') === null){
          navigate(docRoot + "/selectCourse");
        }
        else{

          //JOIN THE QUEUE
          let request = {};
          request.command = "createGroup";

          //set user and course so the server knows
          request.user = localStorage.getItem('asci-user');
          request.courseId = localStorage.getItem('asci-course');
          request.sessionId = mainSessionId;

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

    /* END CREATING GROUP ONCE BUTTON IS PRESSED */

    return(
        <div className="question">
            <div>
                <h2>The next student is willing to be in a group:</h2>
                <label><b>Subject:</b> {primeSubject}</label>
                <label><b>Issue:</b> {primeIssue} </label>
            </div>

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
                        <b>  Subject:</b> {otherSessions[k]['issue']}
                        </label>
                    );
                })}
            </div>

            <div>
                <h6>Click here when you are ready to start the session.</h6>
                <button onClick={createGroup}>Start Session</button>
            </div>
        </div>
    )


}

export default HandleGroup;