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
      <div className="col-md-4">
        <div className="card">
          <img className="card-img-top" src={img} />
          <div className="card-body">
            <h5 className="card-title">Office Hours Queue</h5>
            <p className="card-text text-center"><a href={docRoot + "/queue"} className="btn btn-primary">Join Queue</a></p>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card">
        <img className="card-img-top" src={img2} />
          <div className="card-body">
            <h5 className="card-title">Admin</h5>
            <p className="card-text text-center"><a href={docRoot + "/admin"} className="btn btn-primary">Visit Admin Page</a></p>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card">
        <img className="card-img-top" src={img3} />
          <div className="card-body">
            <h5 className="card-title">Earn Points</h5>
            {/* change link later */}
            <p className="cart-text text-center"><a href={docRoot + "/points"}  className="btn btn-primary">Earn Points</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cards;
