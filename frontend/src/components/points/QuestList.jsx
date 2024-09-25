import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import QuestCard from "./QuestCard";
import { useUser } from "../context/UserContext";

function QuestList(props) {
    let { user, getCourse } = useUser();
    let course = getCourse();

    let docRoot = props.documentRoot;
    let url = props.url;

    const navigate = useNavigate();
    const [quests, setQuests] = useState({});
    const [lockedQuests, setLockedQuests] = useState({});
    const [inProgressQuests, setInProgressQuests] = useState({});
    const [completedQuests, setCompletedQuests] = useState({});
    const [pointCount, setPointCount] = useState(0);

    useEffect(() => {
        let request = {};

        // // Get all quests to update the status
        request.command = "getQuestsForUser";
        request.user = user.userid;
        request.courseId = course.course_id;
        getQuests(request, url, null);

        // Get locked quests
        request.command = "getQuestsForUserWithStatus";
        request.user = user.userid;
        request.courseId = course.course_id;
        request.status = 'Locked';
        getQuests(request, url, 'Locked');

        // Get in progress quests
        request.command = "getQuestsForUserWithStatus";
        request.user = user.userid;
        request.courseId = course.course_id;
        request.status = 'In progress';
        getQuests(request, url, 'In progress');

        // Get completed quests
        request.command = "getQuestsForUserWithStatus";
        request.user = user.userid;
        request.courseId = course.course_id;
        request.status = 'Completed';
        getQuests(request, url, 'Completed');

        // Get point count after updating
        request.command = "getPointsForUser";
        request.user = user.userid;
        request.courseId = course.course_id;
        getPoints(request, url);
    }, []);

    // Update the quest status
    const getQuests = (json0, url0, status) => {
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

                if (success === "true") {
                    console.log("Get Quests: Successfully fetched quests: " + status);

                    // Update quests status and early return
                    if (status === null) {
                        console.log("Updated quest status");
                        return;
                    }

                    let questList = {}
                    console.log("quest array");
                    for (var key in data.quests) {
                        console.log(data.quests[key]);
                        questList[key] = {};
                        // Add quest info
                        questList[key]["name"] = data.quests[key]["name"];
                        questList[key]["description"] = data.quests[key]["description"];
                        questList[key]["total_points"] = data.quests[key]["total_points"];
                        questList[key]["completion-status"] = data.quests[key]["status"];
                        questList[key]["prerequisites"] = data.quests[key]["prerequisites"];
                    }
                    if (status === 'Locked') {
                        setLockedQuests(questList);
                    } else if (status === 'In progress') {
                        setInProgressQuests(questList);
                    } else if (status === 'Completed') {
                        setCompletedQuests(questList);
                    }
                }
                else {
                    console.log("Get Quest: Server returned error");
                    navigate(docRoot + "/error");
                }
            })
            .catch((error) => {
                console.log("Get Quest: There was an error:", error);
                navigate(docRoot + "/error");

            });
    };

    const getPoints = (json0, url0) => {
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

                if (success === "true") {
                    console.log("Get Points: Successfully fetched user quest points");
                    setPointCount(data.points);
                }
                else {
                    console.log("Get Points: Server returned error");
                    navigate(docRoot + "/error");
                }
            })
            .catch((error) => {
                console.log("Get Points: There was an error:", error);
                navigate(docRoot + "/error");
            });
    }

    return (
        <div>
            <h1>All Quests for {user.pname}</h1>
            <div className="pointCount">
                <h5 className="card-title">Points Earned: {pointCount}</h5>
            </div>
            <div className="accordion" id="accordionExample" style={ {marginTop: "30px" }}>
                <div className="accordion-item">
                    <h2 className="accordion-header" id="headingOne">
                        <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                            In Progress Quests
                        </button>
                    </h2>
                    <div id="collapseOne" className="accordion-collapse collapse show" aria-labelledby="headingOne" data-bs-parent="#accordionExample">
                        <div className="accordion-body">
                            {Object.keys(inProgressQuests).map((questId) => {
                                if (inProgressQuests[questId] != null) {
                                    return <QuestCard currentQuest={inProgressQuests[questId]} key={questId} />
                                }
                            })}
                        </div>
                    </div>
                </div>
                <div className="accordion-item">
                    <h2 className="accordion-header" id="headingTwo">
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                            Completed Quests
                        </button>
                    </h2>
                    <div id="collapseTwo" className="accordion-collapse collapse" aria-labelledby="headingTwo" data-bs-parent="#accordionExample">
                        <div className="accordion-body">
                            <div>
                                Complete quests to earn points
                            </div>
                            {Object.keys(completedQuests).map((questId) => {
                                if (completedQuests[questId] != null) {
                                    return <QuestCard currentQuest={completedQuests[questId]} key={questId} />
                                }
                            })}
                        </div>
                    </div>
                </div>
                <div className="accordion-item">
                    <h2 className="accordion-header" id="headingThree">
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                            Locked Quests
                        </button>
                    </h2>
                    <div id="collapseThree" className="accordion-collapse collapse" aria-labelledby="headingThree" data-bs-parent="#accordionExample">
                        <div className="accordion-body">
                            <div>
                                Meet the prerequisites to unlock the quests
                            </div>
                            {Object.keys(lockedQuests).map((questId) => {
                                if (lockedQuests[questId] != null) {
                                    return <QuestCard currentQuest={lockedQuests[questId]} key={questId} />
                                }
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

}

export default QuestList;