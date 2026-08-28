import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function QuestCard(props) {
    let docRoot = props.documentRoot;
    let debugMode = props.debugMode;
    let root = "/asci";
    let url = props.url;
    let questId = props.id;
    let command = '';

    const navigate = useNavigate();
    const {user, getCourse} = useUser();
    let course = getCourse();
    const [currentQuest, setCurrentQuest] = useState(props.currentQuest);

    const getQuests = () => {
        const request = {
        command: "getCourseQuests",
        user: user.userid,
        course: course.course_id
        };
        
        fetch(url, {
        method: 'POST', // or 'PUT'
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify(request),
        }).then(response => response.json())
        .then(data => {
            if (data.success === "true") {
            let questList = {}
            for (var key in data.quests) {
                questList[key] = {};
                // Add quest info
                questList[key]["name"] = data.quests[key]["name"];
                questList[key]["description"] = data.quests[key]["description"];
                questList[key]["total_points"] = data.quests[key]["total_points"];
            }

            setIsChecked(Object.hasOwn(questList, questId))
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

     useEffect(() => {
        getQuests();
    }, []);
    

    const [isChecked, setIsChecked] = useState(false);
    const modifyCourseQuestHandler = () => {
        setIsChecked(!isChecked);

        //setup json command
        if (!isChecked) {
            command = "addQuestForCourse";
        }
        else {
            command = "removeQuestForCourse";
        }

        let request = {
            command: command,
            user: user.userid,
            courseId: course.course_id,
            questId: questId
        }

        modifyCourseQuest(request);    
    };

    const modifyCourseQuest = (request) => {
        fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(request),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    console.log("Modify course quest: Successfully modifed course quest");
                } else {
                    console.log("Modify course quest: Server returned error");
                    navigate(root + "/error");
                }
            })
            .catch((error) => {
                console.log("Modify course quest: There was an error:", error);
                navigate(root + "/error");
            });
    };

    return (
        <div className="row">
            <div className="column">
                <div className="card">
                    <div className="card-body d-flex flex-column">
                        <h5 className="card-title">{currentQuest["name"]}</h5>
                        <p className="card-text">Description: {currentQuest["description"]}</p>
                        <p className="card-text">Total points: {currentQuest["total_points"]}</p>
                        {props.showAddToCourse && (
                            <label>Add to course? <input type="checkbox" id={questId} name="checkbox" autoComplete="off" checked={isChecked} onChange={modifyCourseQuestHandler} /> </label>
                        )}
                        {props.showDelete && (
                            <button type="button" className="btn btn-danger mt-3 w-25" onClick={() => props.onDelete(questId)}  >
                                Delete Quest
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QuestCard;