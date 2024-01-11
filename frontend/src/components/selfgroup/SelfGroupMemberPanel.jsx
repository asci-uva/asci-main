import React from "react";

function SelfGroupMemberPanel(props) {


  let members = props.members;
  let callback = props.callback;


  const handleLeave = (e) =>{
    e.preventDefault();
    callback(e);
  }

  /* Main Rendering Area */

  if(members == null || members.length==0){
    return (
      <div className="question waitlist">
        <h5>Oops, there do not seem to be any members right now.</h5>
        <button onClick={handleLeave}>Leave Group</button>
      </div>
    );
  }
  
  return (
    <div className="question waitlist">
      <div>
      <h4>Group Members:</h4>
      {Object.keys(members).map(k =>
        <div>
        <h6>{members[k].fname} {members[k].lname}</h6>
        </div>
      )}
      <button onClick={handleLeave}>Leave Group</button>
      </div>
    </div>
  );
  

}

export default SelfGroupMemberPanel;

