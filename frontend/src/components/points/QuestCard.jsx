import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function QuestCard(props) {
    let docRoot = props.documentRoot;
    let debugMode = props.debugMode;
    let root = "/asci";

    const[currentQuest, setCurrentQuest] = useState(props.currentQuest);

    return (
        <div className="row">
            <div className="column">
                <div className="card">
                    <div className="card-body">
                        {console.log("in quest card")}
                        <h5 className="card-title">{currentQuest["name"]}</h5>
                        <p className="card-text">Description: {currentQuest["description"]}</p>
                        <p className="card-text">Total points: {currentQuest["total_points"]}</p>
                        <p className="card-text">Status: {currentQuest["completion-status"]}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QuestCard;