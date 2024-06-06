import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Error() {
  return (
    <div>
      <h1 className="font-weight-light">Error</h1>
      <p>
        We are sorry, but something seems to have gone wrong. Please try again
        later.
      </p>
      <p>
        This might be because you have been logged out due to inactivity.{" "}
        <a href=".">Click here to refresh the page</a>
      </p>
    </div>
  );
}

export default Error;
