import React from "react";
import {useState, useEffect} from "react";
import { useNavigate} from 'react-router-dom';

function Error() {
	
	  return (
	    <div className="error">
	          <h1 className="font-weight-light">Error</h1>
	          <p>We are sorry, but something seems to have gone wrong. Please try again later.</p>    
	    </div>
	  );
	}

export default Error;