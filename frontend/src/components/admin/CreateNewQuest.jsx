import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function CreateNewQuest(props) {
  const [mnemonic, setMnemonic] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [totalPoints, setTotalPoints] = useState("");

  const navigate = useNavigate();

  const handleCreateQuest = () => {
    const newQuest = {
      mnemonic,
      name,
      description,
      total_points,
      command: "createQuestForCourse",
      user: localStorage.getItem("asci-user"),
    };

    createQuest(newQuest);
  };

  let docRoot = props.documentRoot;

  const createQuest = (quest) => {
    fetch(props.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createQuest),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        if (data.success) {
          toast.success("Quest created successfully!");
          navigate(docRoot); // back to the course management if success
        } else {
          toast.error("Error creating the course");
          navigate(docRoot + "/error");
        }
      })
      .catch((error) => {
        toast.error("Error creating the course");
        navigate(docRoot + "/error");
      });
  };

  return (
    <div>
      <h2>Create New Quest</h2>

      <div>
        <label>Mnemonic:</label>
        <input
          type="text"
          value={mnemonic}
          onChange={(e) => setMnemonic(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Description:</label>
        <input
          type="text"
          value={number}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Total points:</label>
        <input
          type="text"
          value={semester}
          onChange={(e) => setTotalPoints(e.target.value)}
          required
        />
      </div>
      <button onClick={handleCreateQuest}>Create Quest</button>
    </div>
  );
}

export default CreateNewQuest;
