import React from "react";
import {useState} from "react";
import { useNavigate } from 'react-router-dom';

//https://www.youtube.com/watch?v=IkMND33x0qQ
//https://bobbyhadz.com/blog/react-redirect-after-form-submit
function Question(props) {
  const [title, setTitle] = useState("question overview");
  const [details, setDetails] = useState("question details");
  const [purpose, setPurpose] = useState("");
  const [groupoption, setGroupOption] = useState(true);
  const navigate = useNavigate();

  let url = props.url;
  let docRoot = props.documentRoot;

  const handleSubmit = event => {
    event.preventDefault();
    navigate(docRoot + '/studentwaitingroom');
  };
  
  return ( 
    <div className="question">
      <h2>What is your question today?</h2>
      <form onSubmit={handleSubmit}>
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
        <p>Is "My Value" checked? {checked.toString()}</p>
        <button>Submit</button>
      </form>
    </div>
  );
}

export default Question;
