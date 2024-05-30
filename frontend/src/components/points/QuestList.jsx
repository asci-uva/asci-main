import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import QuestCard from "./QuestCard";

function QuestList(props) {
    let docRoot = props.documentRoot;
    let debugMode = props.debugMode;
    let url = props.url;
    let root = "/asci";

    // const { courseId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [quests, setQuests] = useState({});
    const [pointCount, setPointCount] = useState(0);

    useEffect(() => {
        //If token is set, kick to home screen to check validity of session
        if (localStorage.getItem('asci-user') !== null) {
            //try to get the user's quests
            setUser(localStorage.getItem('asci-user'));

            //setup json command
            let request = {};
            request.command = "getQuestsForUser";
            request.user = localStorage.getItem('asci-user');
            request.courseId = localStorage.getItem('asci-course');
            getQuests(request, url);

            request.command = "getPointsForUser";
            request.user = localStorage.getItem('asci-user');
            request.courseId = localStorage.getItem('asci-course');
            getPoints(request, url);
        }
        else {
            navigate(docRoot + "/login");
        }
    }, []);

    const getQuests = (json0, url0) => {
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

                    console.log("Get Quests: Successfully fetched quests");
                    let questList = {}
                    for (var key in data.quests) {
                        console.log("quest array");
                        console.log(data.quests[key]);
                        questList[key] = {};
                        // Add quest info
                        questList[key]["name"] = data.quests[key]["name"];
                        questList[key]["description"] = data.quests[key]["description"];
                        questList[key]["total_points"] = data.quests[key]["total_points"];
                        questList[key]["completion-status"] = data.quests[key]["status"];
                    }

                    setQuests(questList);
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
            <h1>All Quests for {user}</h1>
            <div className="pointCount">
                <h5 className="card-title">Points Earned: {pointCount}</h5>
            </div>
            <div>
                {Object.keys(quests).map((questId) => {
                    return <QuestCard currentQuest={quests[questId]} key={questId} />
                })}
            </div>
        </div>
    );

}

export default QuestList;