import React from "react";
import {useEffect, useState} from "react";
import { useNavigate } from 'react-router-dom';

function HandleGroup(props) {
    let url = props.url;
    let docRoot = props.documentRoot;

    const [primeStuName,setPrimeStuName] = useState("LOADING");
    const [primeStutId, setPrimeStuId] = useState("LOADING");
    const [otherStudents, setOtherStudents] = useState({});
    const [otherSessions, setOtherSessions] = useState({0: "LOADING"});
    const navigate = useNavigate();

    const [primeSubject, setPrimeSubject] = useState("LOADING");
    const [primeIssue, setPrimeIssue] = useState("LOADING");
    const [primeLocation, setPrimeLocation] = useState("LOADING");

    const [stuOptionOne, setStuOptionOne] = useState(false);

    const handleCheck = () => {
        setStuOptionOne(!stuOptionOne);
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

                setPrimeStuName(data.student.fname + " " + data.student.lname);
                setPrimeStuId(data.student.computing_id);
      
                /* Set up issue vars also */
                setPrimeSubject(data.session.issue_subject);
                setPrimeIssue(data.session.issue);
                setPrimeLocation(data.session.location);
            }
            else{
                console.log("Getting primary student info failed");
                console.log("error",data.error);
                navigate(docRoot + "/error");
            }

            if(data.have_group == "true"){
                console.log("Have group is true");
                let sessions = {0: "LOADING"}
                let session = {}
                for(var key in data.candi_sessions){
                    session = {}
                    session['issue']= data.candi_sessions[key].issue
                    session['issue_subject'] = data.candi_sessions[key].issue_subject
                    session['name'] = data.candidates[key].fname + " " + data.candidates[key].lname
                    session['stuid'] = data.candidates[key].computing_id
                    sessions[key] = session
                }
                setOtherSessions(sessions)
            }
          }).catch((error) => {
            console.log("HOME: There was an error:", error);
            navigate(docRoot + "/error");
            
          });
    }

    return(
        <div className="group">
            <div>
                <h2>The next student inline choose to be in a group:</h2>
                <label>Name: <b>{primeStuName}</b></label>
                <label>Subject: {primeSubject}</label>
                <label>Issue: </label>
                <label>{primeIssue}</label>
                <label>Location: {primeLocation}</label>
            </div>

            <div>
                <h2>Please select from Matched Students:</h2>
                {Object.keys(otherSessions).map(k => {
                    if (k!= 0){
                        console.log(k);
                        return (<label key ={k}>
                        <input
                            type="checkbox"
                            name={k}
                            checked={stuOptionOne}
                            onChange={handleCheck}
                        />
                        {otherSessions[k]['name']}
                        </label>
                    );}
                })}
            </div>
        </div>
    )


}

export default HandleGroup;