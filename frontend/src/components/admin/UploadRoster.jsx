import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function UploadRoster(props) {
  let url = props.url;
  let docRoot = props.documentRoot;

  return (
    <div>
      <div>
        <h2>Upload Roster</h2>
      </div>
    </div>
  );
}

export default UploadRoster;
