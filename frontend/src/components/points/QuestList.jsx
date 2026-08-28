import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import QuestCard from "./QuestCard";
import { useUser } from "../context/UserContext";

function QuestList(props) {
    let docRoot = props.documentRoot;
    let debugMode = props.debugMode;
    let url = props.url;
    let root = "/asci";

    // const { courseId } = useParams();
    const navigate = useNavigate();
    const { user, getCourse } = useUser();
    let course = getCourse();
    const [quests, setQuests] = useState({});
    const [pointCount, setPointCount] = useState(0);
    const [filterOption, setFilterOption] = useState("");

    useEffect(() => {
        //If token is set, kick to home screen to check validity of session
        if (user) {
            //try to get the user's quests
            getQuests();
            getPoints();
        }
        else {
            navigate(root + "/login");
        }
    }, []);

    const getQuests = () => {
        let request = {
            command: "getQuestsForUser",
            user: user.userid,
            courseId: course.course_id
        }

        fetch(url, {
            method: 'POST', // or 'PUT'
            credentials: "include",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        }).then(response => response.json())
            .then(data => {
                let success = data.success;

                if (success === "true") {

                    console.log("Get Quests: Successfully fetched quests");
                    let questList = {}
                    for (var key in data.quests) {
                        questList[key] = {};
                        // Add quest info
                        questList[key]["quest_id"] = data.quests[key]["quest_id"];
                        questList[key]["mnemonic"] = data.quests[key]["mnemonic"];
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

    const getPoints = () => {
        let request = {
            command: "getPointsForUser",
            user: user.userid,
            courseId: course.course_id
        }

        fetch(url, {
            method: 'POST', // or 'PUT'
            credentials: "include",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        }).then(response => response.json())
            .then(data => {
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

    const handleFilter = (value) => {
        setFilterOption(value);
        if (value == "All")
        {
            return getQuests();
        }

        const request = {
          command: "getQuestsByStatus",
          user: user.userid,
          courseId: course.course_id,
          status: value
        };
    
        fetch(props.url, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        })
        .then((response) => response.json())
        .then((data) => {
            console.log("Data is: ", data);
            if (data.success) {
                console.log("Filter Quests: Successfully filtered quests");
                let questList = {}
                for (var key in data.quests) {
                    questList[key] = {};
                    questList[key]["quest_id"] = data.quests[key]["quest_id"];
                    questList[key]["mnemonic"] = data.quests[key]["mnemonic"];
                    questList[key]["name"] = data.quests[key]["name"];
                    questList[key]["description"] = data.quests[key]["description"];
                    questList[key]["total_points"] = data.quests[key]["total_points"];
                    questList[key]["completion-status"] = data.quests[key]["status"];
                }

                setQuests(questList);
            }
            else
            {
                console.log("Filter Quests: Error filtering quests");
            }
        })
        .catch((e) => {
            console.log("Error: ", e);
            navigate(root + "/error");
        });
    };

    const handleMarkComplete = (currentQuest) => {
      const request = {
        command: "updateQuestStatus",
        questId: currentQuest["quest_id"],
        course: course.course_id,
        student: user.userid,
        status: "Completed - Pending Approval"
      };
  
      fetch(props.url, {
      method: "POST",
      credentials: "include",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      })
      .then((response) => response.json())
      .then((data) => {
          if (data.success) {
            getQuests();
            console.log("Success updating status")
          } else {
          console.log("Error updating the user quest status");
          }
      })
      .catch((error) => {
          console.log("Error updating the user quest status", error);
      });

    };

    const ShowQuests = () => {
        if(Object.keys(quests).length !== 0)
        {
            return (    
                <div>
                    {Object.keys(quests).map((questId) => {
                        return <QuestCard currentQuest={quests[questId]} key={questId} url={props.url} markComplete={() => handleMarkComplete(quests[questId])}/>
                    })}
                </div>
            );
        }
        else return (
            <div>
                <h5>There are no quests found.</h5>
            </div>
        )
    };
    
    return (
        <div className="page-container">
            <h1>{course.mnemonic} {course.number} {course.name} ({course.semester}) Quests for {user.pname}</h1>
            <div className="pointCount d-flex align-items-center">
                <h5 className="card-title">Points Earned: {pointCount}</h5>
                <div className="d-flex align-items-center ms-auto">
                    <select
                        className="form-select form-select-sm w-auto"
                        value={filterOption}
                        onChange={(e) => {handleFilter(e.target.value);}}
                    >
                    <option value="All">All Quests</option>
                    <option value="Completed">Completed</option>
                    <option value="In progress">In progress</option>
                    <option value="Not started">Not started</option>
                    {/* <option value="Locked">Locked</option> */}
                    </select>
                </div>
                
            </div>
            <div>
                {ShowQuests()}
            </div>
        </div>
    )

}

export default QuestList;
