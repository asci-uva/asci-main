import React from "react";

//https://www.youtube.com/watch?v=IkMND33x0qQ
function Question() {
  return (
    <div className="question">
      <h2>What would you like to inquire?</h2>
      <form>
        <label>Title:</label>
        <input
          type = "text"
          required
        />
        <label>Question details:</label>
        <textarea
          required>
        </textarea>
        <label>Purpose:</label>
        <select>
          <option value="Assignment">Only Assignment Check Off</option>
          <option value="Logistic">Logistic questions</option>
        </select>
        <button>Submit</button>
      </form>
    </div>
  );
}

export default Question;