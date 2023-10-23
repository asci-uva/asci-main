import React from "react";
import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";

function Navigation(props) {
  let docRoot = props.documentRoot;
  let debugMode = props.debugMode;

  return (
    <div className="navigation">
      <nav className="navbar navbar-expand navbar-dark bg-dark">
        <div className="container">
          <NavLink className="navbar-brand" to={docRoot + "/"}>
            HOME
          </NavLink>
          <div>
            <ul className="navbar-nav ml-auto">
              <li className="nav-item">
                <NavLink className="nav-link" to={docRoot + "/queue"}>
                  Queue
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to={docRoot + "/admin"}>
                  Admin
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink className="nav-link" to={docRoot + "/logout"}>
                  Logout
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Navigation;
