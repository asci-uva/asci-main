import React from "react";
import {useEffect, useState} from "react";
import { useNavigate } from 'react-router-dom';

function HandleGroup(props) {
    const [primeStuName,setPrimeStuName] = useState("LOADING");
    const [primeStutId, setPrimeStuId] = useState("LOADING");
    const [otherStudents, setOtherStudents] = useState([]);
    const navigate = useNavigate();

    const [primeSubject, setPrimeSubject] = useState("LOADING");
    const [primeIssue, setPrimeIssue] = useState("LOADING");
    const [primeLocation, setPrimeLocation] = useState("LOADING");

    const [stuOptionOne, setStuOptionOne] = useState(false);

    const handleCheck = () => {
        setStuOptionOne(!stuOptionOne);
      };

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
                <label>
                    <input
                    type="checkbox"
                    checked={stuOptionOne}
                    onChange={handleCheck}/>Student 1</label>
            </div>
        </div>
    )


}

export default HandleGroup;