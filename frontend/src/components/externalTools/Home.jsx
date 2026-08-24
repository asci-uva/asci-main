import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import { useCanvasSyncSettings } from "../utils/useCanvasSyncSettings";
import { useCanvasTokenStatus } from "../utils/useCanvasTokenStatus";
import { useCanvasLmsCourse } from "../utils/useCanvasLmsCourse";
import { useExternalTools } from "../utils/useExternalTools";
import { isInstructorRole, isStaffRole } from "../utils/roles";
import CanvasLmsSync from "./CanvasLmsSync";
import CanvasSyncActions from "./CanvasSyncActions";
import GradescopeSync from "./GradescopeSync";
import GradescopeCsvUpload from "./GradescopeCsvUpload";
import PiazzaUpload from "./PiazzaUpload";
import CanvasLinkWarning from "./CanvasLinkWarning";
import CanvasTokenExpiredWarning from "./CanvasTokenExpiredWarning";
import ExternalToolToggle from "./ExternalToolToggle";

const TABS = [
  { key: "canvas", label: "Canvas LMS" },
  { key: "gradescope", label: "Gradescope" },
  { key: "piazza", label: "Piazza" },
];

function Home(props) {
  const { getCourse } = useUser();
  const course = getCourse();
  const courseId = course.course_id;
  const isStaff = isStaffRole(course.role);
  const canManageTools = isInstructorRole(course.role);

  const [sidebarOpen, setSidebarOpen] = useState("sidebar-visible");
  const [sidebarCol, setSidebarCol] = useState("col-md-3");
  const [contentCol, setContentCol] = useState("page-container content col-md-9 my-auto");

  const {
    status: canvasTokenStatus,
    loaded: canvasTokenStatusLoaded,
    error: canvasTokenStatusError,
    refresh: refreshCanvasTokenStatus,
  } = useCanvasTokenStatus(props.url, courseId, isStaff);

  const {
    tools: externalTools,
    loaded: externalToolsLoaded,
    error: externalToolsError,
    save: saveExternalTool,
  } = useExternalTools(props.url, courseId, isStaff);

  const {
    course: canvasLmsCourse,
    setCourse: setCanvasLmsCourse,
    loaded: canvasLmsCourseLoaded,
  } = useCanvasLmsCourse(props.url, courseId, isStaff);

  const {
    settings: canvasSyncSettings,
    setSettings: setCanvasSyncSettings,
    loaded: canvasSyncSettingsLoaded,
    error: canvasSyncSettingsError,
    refresh: refreshCanvasSyncSettings,
    save: saveCanvasSyncSettings,
  } = useCanvasSyncSettings(
    props.url,
    courseId,
    canvasLmsCourse !== null && isStaff
  );

  const canvasEnabled = externalTools.canvas === true;

  const toolToggle = (tool, label) => (
    <ExternalToolToggle
      tool={tool}
      label={label}
      enabled={externalTools[tool] === true}
      loaded={externalToolsLoaded}
      error={externalToolsError}
      canManage={canManageTools}
      onSave={saveExternalTool}
    />
  );

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
                  Connect this course to other tools outside of ASCI
                </p>
              </div>
              <button type="button" className="sidebar-button" onClick={handleCollapse}><i className="bi-arrows-collapse-vertical"></i></button>
            </div>
          </div>

          <div className={contentCol}>
            <h3 className="mb-3">Course: {course.mnemonic} {course.number} - {course.name} ({course.semester})</h3>

            {canvasEnabled && canvasTokenStatusLoaded && canvasTokenStatus.isTokenExpired && (
              <CanvasTokenExpiredWarning canvasLmsCourse={canvasLmsCourse} />
            )}

            {canvasEnabled && canvasTokenStatusLoaded && canvasLmsCourse !== null && !canvasTokenStatus.hasToken && (
              <CanvasLinkWarning
                canvasLmsCourse={canvasLmsCourse}
                message=", but the primary instructor has not added a Canvas access token. Synced features are disabled until they add one or the course is unlinked."
              />
            )}

            <div className="card">
              <div className="card-header">
                <ul className="nav nav-tabs card-header-tabs" id="external-tools-tab" role="tablist">
                  {TABS.map((tab, idx) => (
                    <li className="nav-item" role="presentation" key={tab.key}>
                      <button
                        className={`nav-link ${idx === 0 ? "active" : ""}`}
                        id={`ext-${tab.key}-tab`}
                        data-bs-toggle="pill"
                        data-bs-target={`#ext-${tab.key}`}
                        type="button"
                        role="tab"
                        aria-controls={`ext-${tab.key}`}
                        aria-selected={idx === 0}
                      >
                        {tab.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="tab-content card-body" id="external-tools-tabContent">
                <div className="tab-pane fade show active" id="ext-canvas" role="tabpanel" aria-labelledby="ext-canvas-tab">
                  <div className="col-md-12 my-auto">
                    {toolToggle("canvas", "Canvas LMS")}
                    {canvasEnabled && (
                      <CanvasLmsSync
                        course_id={courseId}
                        canvasTokenStatus={canvasTokenStatus}
                        canvasTokenStatusLoaded={canvasTokenStatusLoaded}
                        canvasTokenStatusError={canvasTokenStatusError}
                        refreshCanvasTokenStatus={refreshCanvasTokenStatus}
                        canvasLmsCourse={canvasLmsCourse}
                        setCanvasLmsCourse={setCanvasLmsCourse}
                        canvasLmsCourseLoaded={canvasLmsCourseLoaded}
                        canvasSyncSettings={canvasSyncSettings}
                        canvasSyncSettingsLoaded={canvasSyncSettingsLoaded}
                        canvasSyncSettingsError={canvasSyncSettingsError}
                        saveCanvasSyncSettings={saveCanvasSyncSettings}
                        {...props}
                      />
                    )}
                    {canvasEnabled && canvasLmsCourse !== null && (
                      <CanvasSyncActions
                        course_id={courseId}
                        canvasTokenStatus={canvasTokenStatus}
                        canvasTokenStatusLoaded={canvasTokenStatusLoaded}
                        canvasLmsCourse={canvasLmsCourse}
                        canvasSyncSettings={canvasSyncSettings}
                        canvasSyncSettingsLoaded={canvasSyncSettingsLoaded}
                        setCanvasSyncSettings={setCanvasSyncSettings}
                        refreshCanvasSyncSettings={refreshCanvasSyncSettings}
                        {...props}
                      />
                    )}
                  </div>
                </div>

                <div className="tab-pane fade" id="ext-gradescope" role="tabpanel" aria-labelledby="ext-gradescope-tab">
                  <div className="col-md-12 my-auto">
                    {toolToggle("gradescope", "Gradescope")}
                    {externalTools.gradescope === true && (
                      <>
                        <GradescopeSync course_id={courseId} {...props} />
                        <GradescopeCsvUpload course_id={courseId} {...props} />
                      </>
                    )}
                  </div>
                </div>

                <div className="tab-pane fade" id="ext-piazza" role="tabpanel" aria-labelledby="ext-piazza-tab">
                  <div className="col-md-12 my-auto">
                    {toolToggle("piazza", "Piazza")}
                    {externalTools.piazza === true && (
                      <PiazzaUpload course_id={courseId} {...props} />
                    )}
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
