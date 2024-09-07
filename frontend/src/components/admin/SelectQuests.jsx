import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import QuestCard from "./QuestCard";
import { useUser } from "../context/UserContext";

function SelectQuests(props) {
  let { user, courseSettings } = useUser();

  let docRoot = props.documentRoot;
  let url = props.url;

  const navigate = useNavigate();
  const [quests, setQuests] = useState({});

  useEffect(() => {
    // Setup json command
    let request = {};
    request.command = "getAllQuests";
    request.user = user.userid;
    getQuests(request, url);
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
            console.log("quest array" + data.quests[key]);
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
    if (courseSettings.show_quests == "t") {
      return (
        <div>
          <h1>All Quests Options</h1>
          <div>
            {Object.keys(quests).map((questId) => {
              return <QuestCard currentQuest={quests[questId]} id={questId} url={props.url} key={questId} />
            })}
          </div>
        </div>
      );
    }
    else return;
  }

  return (
    <div>
      <ShowQuests />
    </div>
  )

}

export default SelectQuests;
