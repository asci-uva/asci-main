import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function QuestCard(props) {
    let docRoot = props.documentRoot;
    let debugMode = props.debugMode;
    let root = "/asci";
    let url = props.url;
    let questId = props.id;

    const navigate = useNavigate();
    const [currentQuest, setCurrentQuest] = useState(props.currentQuest);

    // localStorage.removeItem("checkbox" + questId);

    // set the inital checkbox to be the localStorage value or false
    const [isChecked, setIsChecked] = useState(localStorage.getItem("checkbox" + questId) === 'true' ? true : false);
    console.log("isChecked initial " + isChecked);

    const modifyCourseQuestHandler = () => {
        setIsChecked(!isChecked);
        localStorage.setItem("checkbox" + questId, document.getElementById(questId).checked);
        console.log("isChecked after " + isChecked);
        console.log("localStorage: " + localStorage.getItem("checkbox" + questId));

        //setup json command
        let request = {};
        if (!isChecked) {
            console.log("checkbox checked");
            request.command = "addQuestForCourse";
        }
        else {
            console.log("checkbox un-checked");
            request.command = "removeQuestForCourse";
        }
        request.courseId = localStorage.getItem('asci-course');
        request.questId = questId;

        modifyCourseQuest(request, url);
    };

    const modifyCourseQuest = (json0, url0) => {
        fetch(url0, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(json0),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
                if (data.success) {
                    console.log("Modify course quest: Successfully modifed course quest");
                } else {
                    console.log("Modify course quest: Server returned error");
                    navigate(docRoot + "/error");
                }
            })
            .catch((error) => {
                console.log("Modify course quest: There was an error:", error);
                navigate(docRoot + "/error");
            });
    };

    return (
        <div className="row">
            <div className="column">
                <div className="card">
                    <div className="card-body">
                        <h5 className="card-title">{currentQuest["name"]}</h5>
                        <p className="card-text">Description: {currentQuest["description"]}</p>
                        <p className="card-text">Total points: {currentQuest["total_points"]}</p>
                        <label>Add to course? <input type="checkbox" id={questId} name="checkbox" autoComplete="off" checked={isChecked} onChange={modifyCourseQuestHandler} /> </label>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QuestCard;