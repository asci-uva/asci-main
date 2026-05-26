import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

function QuestCard(props) {
    const currentQuest = props.currentQuest;
    const {user, getCourse} = useUser();
    let course = getCourse();
    const automated = (currentQuest["mnemonic"].substring(0, 2).toUpperCase() == "OH" || (currentQuest["mnemonic"].substring(0, 1).toUpperCase() == "P" && currentQuest["name"].toLowerCase().includes("piazza")));
    var color = "red";
    if (currentQuest["completion-status"] === "Completed")
    {
        color = "#306e59ff";
    }
    else if (currentQuest["completion-status"] === "Completed - Pending Approval")
    {
        color = "#4fb153ff";
    }
    else if (currentQuest["completion-status"] === "In progress")
    {
        color = "orange";
    }

    const ShowQuestCard = () => {
        return (
            <div className="row">
                <div className="column">
                    <div className="quest-card">
                        <div className="card-body">
                            <h5 className="card-title">{currentQuest["name"]}</h5>
                            <p className="card-text">Description: {currentQuest["description"]}</p>
                            <p className="card-text">Total points: {currentQuest["total_points"]}</p>
                            <div className="d-flex align-items-center gap-2"> 
                                Status:<p className="card-text" style={{color}}>{currentQuest["completion-status"]}</p>
                            </div>
                            {(!automated && (currentQuest["completion-status"] != "Completed - Pending Approval" && currentQuest["completion-status"] != "Completed")) && (<button className="btn btn-primary mt-2" onClick={props.markComplete}>Mark as Complete</button>)}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return ShowQuestCard();

}

export default QuestCard;