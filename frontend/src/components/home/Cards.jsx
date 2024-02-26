import React from "react";

import img from './document-icon.png';
import img2 from './card-id-icon.png';
import img3 from './trophy-icon.png';

function Cards(props) {
  let docRoot = props.documentRoot;
  let debugMode = props.debugMode;
  let root = "/asci";
  return (
    <div class="row">
      <div class="column">
        <div class="card">
          <img class="card-img-top" src={img} />
          <div class="card-body">
            <p class="card-text">Office Hours Queue</p>
            <a href={docRoot + "/queue"} class="btn btn-primary">Join Queue</a>
          </div>
        </div>
      </div>
      <div class="column">
        <div class="card">
        <img class="card-img-top" src={img2} />
          <div class="card-body">
            <p class="card-text">Admin</p>
            <a href={docRoot + "/admin"} class="btn btn-primary">Visit Admin Page</a>
          </div>
        </div>
      </div>
      <div class="column">
        <div class="card">
        <img class="card-img-top" src={img3} />
          <div class="card-body">
            <p class="card-text">Earn Points</p>
            {/* change link later */}
            <a href="#" class="btn btn-primary">Earn Points</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cards;