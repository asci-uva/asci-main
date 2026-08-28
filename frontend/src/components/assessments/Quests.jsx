import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import QuestCard from "../admin/QuestCard";
import { useUser } from "../context/UserContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Quests(props) {
  let docRoot = props.documentRoot;
  let debugMode = props.debugMode;
  let url = props.url;
  let root = "/asci";

  const navigate = useNavigate();
  const {user, getCourseSettings} = useUser();
  const [quests, setQuests] = useState({});
  const [mnemonic, setMnemonic] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [total_pts, setTotalPts] = useState("");
  const [filteredData, setFilteredData] = useState(null);

  const settings = getCourseSettings();
  const showQuests = settings != null && settings.show_quests == "t";

  const getQuests = () => {
    let request = {
      command: "getAllQuests",
      user: user.userid
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

          setQuests(questList);
        }
        else {
          console.log("Get Quest: Server returned error");
          navigate(root + "/error");
        }
      })
      .catch((error) => {
        console.log("Get Quest: There was an error:", error);
        navigate(root + "/error");
      });
  };

  const handleSubmit = () => {
    const newQuest = {
      mnemonic: mnemonic,
      name: name,
      description: description,
      total_points: total_pts,
      command: "addQuest"
    };

    // Call the backend API to create the quest
    createQuest(newQuest);
  };
  
  const createQuest = (questData) => {
    fetch(props.url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(questData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          toast.success("Quest created successfully!");  
          getQuests();
        } else {
          toast.error("Error adding the new quest");
          navigate(root + "/error");
        }
      })
      .catch((e) => {
        console.log("Error", e.stack);
        console.log("Error", e.name);
        console.log("Error", e.message);
        toast.error("Error adding the quest");
        navigate(root + "/error");
      });
  };

  const handleDelete = (ID) => {
    const request = {
      command: "deleteQuest",
      questId: ID
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
        toast.success("Quest deleted successfully!"); 
        getQuests();
        } else {
        toast.error("Error deleting the quest");
        navigate(root + "/error");
        }
    })
    .catch((e) => {
        console.log("Error", e.stack);
        console.log("Error", e.name);
        console.log("Error", e.message);
        toast.error("Error deleting the quest");
        navigate(root + "/error");
    });
  };

  useEffect(() => {
    //If token is set, kick to home screen to check validity of session
    if (user) {
      if (showQuests) getQuests();
    }
    else {
      navigate(root + "/login");
    }
  }, [showQuests]);

  const onSearchBarChange = (e) => {
    console.log("searching!");
    const value = e.target.value.toLowerCase();

    if (value === "") {
      setFilteredData(null);
      return;
    }

    const filteredQuests = Object.keys(quests).filter(k => {
      const q = quests[k];
      return (
        q.name.toLowerCase().includes(value) ||
        q.description.toLowerCase().includes(value)
      );
    }).reduce((q, k) => {
      q[k] = quests[k];
      return q;
    }, {});

    setFilteredData(filteredQuests);
  }

  const ShowQuests = () => {
    if (showQuests) {
      var qData = quests;
      if(filteredData != null)
      {
        qData = filteredData;
      }

      return (
        <div className="row">
          <h4 className="mb-3">All Quests Options</h4>
          <div>
            <input
              id="QuestSearchTextBox"
              type="text" className="mb-1 mt-2"
              onChange={onSearchBarChange}
              placeholder="Search..." />
          </div>
          <div className="col-md-8">  
            <div>
              {Object.keys(qData).map((questId) => {
                return <div key={questId}>
                  <QuestCard currentQuest={quests[questId]} id={questId} url={props.url} showAddToCourse={true} showDelete={true} onDelete={handleDelete}/>
                  </div>
              })}
            </div>
          </div>
          
          <div className="col-md-4">
            <h4 className="card-header">Create New Quest</h4>
            <div className="card-body">

              <form className="">

                <div className="input-group mb-1">
                  <input
                    type="text" className="form-control"
                    value={mnemonic}
                    onChange={(e) => setMnemonic(e.target.value)}
                    placeholder="Mnemonic"></input>
                </div>

                <div className="input-group mb-1"> 
                  <input
                    type="text" className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name" />
                </div>
                
                <div className="input-group mb-1"> 
                    <textarea className="form-control"
                    rows="5" cols="33" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description"></textarea>
                </div>

                <div className="input-group mb-1"> 
                  <input
                    type="text" className="form-control mb-3"
                    value={total_pts}
                    onChange={(e) => setTotalPts(e.target.value)}
                    placeholder="Total Points" />
                </div>

                <button type="button" className="btn btn-primary" onClick={handleSubmit}>Add Quest</button>
              </form>
              <div className="p-2"><b>Note: </b>Quests for office hour frequency and Piazza post frequency have automated status updates. To ensure proper automation, set mnemonics are follows:
                <ul>
                  <li><b>OH#</b> (e.g. OH4 or OH10) for office hours of # visits</li>
                  <li><b>P#</b> (e.g. P3 or P12) <b>and</b> ensure "Piazza" is in the quest name for Piazza posts of # amount</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }
    else return (
      <div>
        <h4>Quests are disabled for this course. Enable them in Admin.</h4>
      </div>
    );
  }

  return (
    <div>
      {ShowQuests()}
    </div>
  )

}

export default Quests;
