import React from "react";
import { NavLink } from "react-router-dom";

function Navigation(props) {
  let docRoot = props.documentRoot;
  let debugMode = props.debugMode;


  return (
    <header className="p-3 text-bg-dark mb-4">
      <div className="container">
      <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start">
          <NavLink className="d-flex align-items-center mb-2 mb-lg-0 text-white text-decoration-none" to={docRoot + "/"}>
            ASCI@UVA
          </NavLink>
            <ul className="nav col-12 col-lg-auto me-lg-auto mb-2 justify-content-center mb-md-0">
              <li>
                <NavLink className="nav-link px-2 text-white" to={docRoot + "/queue"}>
                  Queue
                </NavLink>
              </li>
              <li>
                <NavLink className="nav-link px-2 text-white" to={docRoot + "/admin"}>
                  Admin
                </NavLink>
              </li>
              <li>
                <NavLink className="nav-link px-2 text-white" to={docRoot + "/points"}>
                  Earn Points
                </NavLink>
              </li>
            </ul>

            <div className="flex-shrink-0 dropdown">
              <a href="#" class="d-block text-white text-decoration-none dropdown-toggle" data-bs-toggle="dropdown" area-expanded="false">
     USERNAME-TODO 
              </a>
               <ul className="dropdown-menu text-small shadow">
              <li>
                <NavLink className="nav-link px-2" to={docRoot + "/logout"}>
                  Logout
                </NavLink>
              </li>
               </ul>
    </div>
                
      </div>
      </div>
    </header>
  );
}

export default Navigation;
