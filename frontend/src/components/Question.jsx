import React from "react";
import {useState} from "react";

//https://www.youtube.com/watch?v=IkMND33x0qQ
function Question() {
  const [title, setTitle] = useState("question overview");
  const [details, setDetails] = useState("question details");
  const [purpose, setPurpose] = useState("");
  
  return (
    <div className="question">
      <h2>What would you like to inquire?</h2>
      <form>
        <label>Title:</label>
        <input
          type = "text"
          required
          value = {title}
          onChange={(e)=>setTitle(e.target.value)}
        />
        <label>Question details:</label>
        <textarea
          required
          value = {details}
          onChange={(e)=>setDetails(e.target.value)}>
        </textarea>
        <label>Purpose:</label>
        <select 
          value={purpose}
          onChange={(e)=>setPurpose(e.target.value)}>
          <option value="Assignment">Only Assignment Check Off</option>
          <option value="Logistic">Logistic questions</option>
        </select>
        <button>Submit</button>
      </form>
    </div>
  );
}

export default Question;