import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import QuestCard from "./QuestCard";
import { useUser } from "../context/UserContext";

function ViewQuests(props) {
  let docRoot = props.documentRoot;
  let debugMode = props.debugMode;
  let url = props.url;
  let root = "/asci";

  const navigate = useNavigate();
  const {user, getCourse, courseSettings} = useUser();
  let course = getCourse();
  const [quests, setQuests] = useState({});

  useEffect(() => {
    //If token is set, kick to home screen to check validity of session
    if (user) {
      //setup json command
      getQuests();
    }
    else {
      navigate(root + "/login");
    }
  }, []);

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

          console.log("Get Quests: Successfully fetched quests");
          let questList = {}
          for (var key in data.quests) {
            questList[key] = {};
            // Add quest info
            questList[key]["name"] = data.quests[key]["name"];
            questList[key]["description"] = data.quests[key]["description"];
            questList[key]["total_points"] = data.quests[key]["total_points"];
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

  const ShowQuests = () => {
    if (courseSettings.show_quests == "t"){
      return (
        <div className="card mb-4">
          <h4 className="card-header">All Quests Options</h4>
            <div className="card-body">
                <div>
                  {Object.keys(quests).map((questId) => {
                    return <QuestCard currentQuest={quests[questId]} id={questId} url={props.url} key={questId} />
                  })}
                </div>
            </div>
        </div>
      );
    }
    else return (
        <div className="card mb-4">
          <h4 className="card-header">All Quests Options</h4>
            <div className="card-body">
                <div>
                  <p>Quests are disabled for this course.</p>
                </div>
            </div>
        </div>
      );
            
  }

  return (
    <div>
      <ShowQuests />
    </div>
  )

}

export default ViewQuests;
