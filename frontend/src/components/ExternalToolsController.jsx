import React, { useState } from "react";
import { TOOLS } from "./utils/externalTools";
import CanvasExternalTool from "./externalTools/CanvasExternalTool";
import GradescopeExternalTool from "./externalTools/GradescopeExternalTool";

const PANES = {
  canvas: CanvasExternalTool,
  gradescope: GradescopeExternalTool,
};

const ExternalToolsController = (props) => {
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
                <h1><i className="bi-puzzle big-icon"></i></h1>
                <h2>External Tools</h2>
                <p>
                  Enable and configure the external tools this course uses.
                </p>
              </div>
              <button type="button" className="sidebar-button" onClick={handleCollapse}><i className="bi-arrows-collapse-vertical"></i></button>
            </div>
          </div>
          <div className={contentCol}>

            <h3 className="mb-3">External Tools</h3>

            <div className="card">
              <div className="card-header">
                <ul className="nav nav-tabs card-header-tabs" id="external-tools-tab" role="tablist">
                  {TOOLS.map((tool, idx) => (
                    <li className="nav-item" role="presentation" key={tool.key}>
                      <button
                        className={`nav-link ${idx === 0 ? "active" : ""}`}
                        id={`ext-${tool.key}-tab`}
                        data-bs-toggle="pill"
                        data-bs-target={`#ext-${tool.key}`}
                        type="button"
                        role="tab"
                        aria-controls={`ext-${tool.key}`}
                        aria-selected={idx === 0}
                      >
                        {tool.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="tab-content card-body" id="external-tools-tabContent">
                {TOOLS.map((tool, idx) => {
                  const Pane = PANES[tool.key];
                  return (
                    <div
                      className={`tab-pane fade ${idx === 0 ? "show active" : ""}`}
                      id={`ext-${tool.key}`}
                      role="tabpanel"
                      aria-labelledby={`ext-${tool.key}-tab`}
                      key={tool.key}
                    >
                      <div className="col-md-12 my-auto">
                        {Pane ? <Pane {...props} /> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default ExternalToolsController;
