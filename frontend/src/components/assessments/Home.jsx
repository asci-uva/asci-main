import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import Quests from "./Quests";
import Assignments from "./Assignments";

const TABS = [
  { key: "quests", label: "Quests" },
  { key: "assignments", label: "Assignments" },
];

function Home(props) {
  const { getCourse } = useUser();
  const course = getCourse();

  const [sidebarOpen, setSidebarOpen] = useState("sidebar-visible");
  const [sidebarCol, setSidebarCol] = useState("col-md-3");
  const [contentCol, setContentCol] = useState("page-container content col-md-9 my-auto");

  const handleCollapse = () => {
    if (sidebarOpen === "sidebar-visible") {
      setSidebarCol("col-md-1");
      setContentCol("page-container content col-md-11");
      setSidebarOpen("sidebar-hidden");
    } else {
      setSidebarCol("col-md-3");
      setContentCol("page-container content col-md-9 my-auto");
      setSidebarOpen("sidebar-visible");
    }
  };

  return (
    <>
      <div className="container-fluid page-width">
        <div className="row g-0">
          <div className={sidebarCol}>
            <div className="sidebar">
              <div className={sidebarOpen}>
                <h1><i className="bi-clipboard-check big-icon"></i></h1>
                <h2>Assessments</h2>
                <p>
                  Manage the quests and assignments students work on in this
                  course.
                </p>
              </div>
              <button type="button" className="sidebar-button" onClick={handleCollapse}><i className="bi-arrows-collapse-vertical"></i></button>
            </div>
          </div>

          <div className={contentCol}>
            <h3 className="mb-3">Course: {course.mnemonic} {course.number} - {course.name} ({course.semester})</h3>

            <div className="card">
              <div className="card-header">
                <ul className="nav nav-tabs card-header-tabs" id="assessments-tab" role="tablist">
                  {TABS.map((tab, idx) => (
                    <li className="nav-item" role="presentation" key={tab.key}>
                      <button
                        className={`nav-link ${idx === 0 ? "active" : ""}`}
                        id={`assessments-${tab.key}-tab`}
                        data-bs-toggle="pill"
                        data-bs-target={`#assessments-${tab.key}`}
                        type="button"
                        role="tab"
                        aria-controls={`assessments-${tab.key}`}
                        aria-selected={idx === 0}
                      >
                        {tab.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="tab-content card-body" id="assessments-tabContent">
                <div className="tab-pane fade show active" id="assessments-quests" role="tabpanel" aria-labelledby="assessments-quests-tab">
                  <div className="col-md-12 my-auto">
                    <Quests {...props} />
                  </div>
                </div>

                <div className="tab-pane fade" id="assessments-assignments" role="tabpanel" aria-labelledby="assessments-assignments-tab">
                  <div className="col-md-12 my-auto">
                    <Assignments {...props} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
