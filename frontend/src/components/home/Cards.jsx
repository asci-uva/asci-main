import React from "react";

import img from './document-icon.png';
import img2 from './card-id-icon.png';
import img3 from './trophy-icon.png';

function Cards(props) {
  let docRoot = props.documentRoot;
  let debugMode = props.debugMode;
  let root = "/asci";
  return (
    <div className="row">
      <div className="column">
        <div className="card">
          <img className="card-img-top" src={img} />
          <div className="card-body">
            <p className="card-text">Office Hours Queue</p>
            <a href={docRoot + "/queue"} className="btn btn-primary">Join Queue</a>
          </div>
        </div>
      </div>
      <div className="column">
        <div className="card">
        <img className="card-img-top" src={img2} />
          <div className="card-body">
            <p className="card-text">Admin</p>
            <a href={docRoot + "/admin"} className="btn btn-primary">Visit Admin Page</a>
          </div>
        </div>
      </div>
      <div className="column">
        <div className="card">
        <img className="card-img-top" src={img3} />
          <div className="card-body">
            <p className="card-text">Earn Points</p>
            {/* change link later */}
            <a href={docRoot + "/points"}  className="btn btn-primary">Earn Points</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cards;