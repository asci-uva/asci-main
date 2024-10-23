import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

function QuestCard(props) {
    let docRoot = props.documentRoot;
    let debugMode = props.debugMode;
    let root = "/asci";

    const navigate = useNavigate();

    let { user, getCourse } = useUser();
    let course = getCourse();
    const [currentQuest, setCurrentQuest] = useState(props.currentQuest);
    const [isChecked, setIsChecked] = useState(currentQuest["completion-status"] === "Unverified");

    const modifyCourseQuest = () => {
        setIsChecked(!isChecked);

        let request = {};
        if (!isChecked) {
            console.log("checkbox checked, set quest to be 'Unverified'");
            request.newStatus = "Unverified";
        }
        else {
            console.log("checkbox un-checked, set quest to be 'In progress'");
            request.newStatus = "In progress";
        }
        request.command = "changeUserQuestStatus";
        request.user = user.userid;
        request.questId = props.questId;
        request.courseId = course.course_id;

        fetch(props.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(request),
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
                        {console.log("in quest card")}
                        <h5 className="card-title">{currentQuest["name"]}</h5>
                        <p className="card-text">Description: {currentQuest["description"]}</p>
                        <p className="card-text">Prerequisites: {currentQuest["prerequisites"]}</p>
                        <p className="card-text">Total points: {currentQuest["total_points"]}</p>
                        <p className="card-text">Status: {currentQuest["completion-status"]}</p>
                        {currentQuest["completion-status"] === "Unverified" || currentQuest["completion-status"] === "In progress"? (
                            <label>Mark as done? <input type="checkbox" id={props.questId} name="checkbox" autoComplete="off" checked={isChecked} onChange={modifyCourseQuest} /> </label>
                        ) : null}

                    </div>
                </div>
            </div>
        </div>
    );
}

export default QuestCard;