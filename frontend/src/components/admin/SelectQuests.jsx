import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import QuestCard from "./QuestCard";

function SelectQuests(props) {
  let docRoot = props.documentRoot;
  let debugMode = props.debugMode;
  let url = props.url;
  let root = "/asci";

  // const { courseId } = useParams();
  const navigate = useNavigate();
  let [user, setUser] = useState(null);
  const [quests, setQuests] = useState({});
  const [settings, setSettings] = useState(null);
  const [showQuests, setShowQuests] = useState(false);

  useEffect(() => {
    //If token is set, kick to home screen to check validity of session
    if (localStorage.getItem('asci-user') !== null) {
      setUser(localStorage.getItem('asci-user'));

      getSettings();
      //setup json command
      let request = {};
      request.command = "getAllQuests";
      getQuests(request, url);
    }
    else {
      navigate(docRoot + "/login");
    }
  }, []);

  function getSettings() {
    /* Also get course settings */
    let request2 = {};
    request2.command = "getCourseSettings";
    request2.user = localStorage.getItem('asci-user');
    request2.courseId = localStorage.getItem('asci-course');
    fetchSettings(request2, url);
  }

  const fetchSettings = (json0, url0) => {
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

          setSettings(data.settings);
          if(data.settings.show_quests == "t"){
            setShowQuests(true);
          }

        }
        else {
          console.log("HOME: Server returned error");
          navigate(docRoot + "/error");
        }
      })
      .catch((error) => {
        console.log("HOME: There was an error:", error);
        navigate(docRoot + "/error");

      });
  }

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
    console.log("settings: " + settings);
    if (showQuests) {
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
