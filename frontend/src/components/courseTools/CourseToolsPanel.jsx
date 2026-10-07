import React, { useState } from "react";
import { toast } from "react-toastify";
import { useUser } from "../context/UserContext";
import { useCanvasSyncSettings } from "../utils/useCanvasSyncSettings";
import { useCanvasTokenStatus } from "../utils/useCanvasTokenStatus";
import { useCanvasLmsCourse } from "../utils/useCanvasLmsCourse";
import { useCourseTools } from "../utils/useCourseTools";
import { isInstructorRole, isStaffRole } from "../utils/roles";
import { errorMessage } from "../utils/errorMessage";
import CanvasLmsSync from "./CanvasLmsSync";
import CanvasSyncActions from "./CanvasSyncActions";
import GradescopeCsvUpload from "./GradescopeCsvUpload";
import PiazzaUpload from "./PiazzaUpload";
import CanvasLinkWarning from "./CanvasLinkWarning";
import CanvasTokenExpiredWarning from "./CanvasTokenExpiredWarning";
import ConfirmModal from "../utils/ConfirmModal";
import QueueSettings from "./QueueSettings";

function CourseToolsPanel(props) {
  const { getCourse } = useUser();
  const course = getCourse();
  const courseId = course.course_id;
  const isStaff = isStaffRole(course.role);
  const canManageTools = isInstructorRole(course.role);

  const {
    status: canvasTokenStatus,
    loaded: canvasTokenStatusLoaded,
    error: canvasTokenStatusError,
    refresh: refreshCanvasTokenStatus,
  } = useCanvasTokenStatus(props.url, courseId, isStaff);

  const {
    tools,
    lastUploads,
    setLastUploads,
    loaded: externalToolsLoaded,
    error: externalToolsError,
    setToolEnabled,
  } = useCourseTools(props.url, courseId, isStaff);

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

  const isEnabled = (key) => tools.find((t) => t.key === key).enabled;
  const canvasEnabled = isEnabled("canvas");

  const [activeKey, setActiveKey] = useState(null);
  const [adding, setAdding] = useState(false);
  const [toolToRemove, setToolToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  const enabledTools = tools.filter((t) => t.enabled);
  const availableTools = tools.filter((t) => !t.enabled);
  const activeTool =
    enabledTools.find((t) => t.key === activeKey)?.key ?? enabledTools[0]?.key;

  const paneClass = (key) => `tab-pane fade ${key === activeTool ? "show active" : ""}`;

  const handleAddTool = (tool) => {
    setAdding(true);
    setToolEnabled(tool.key, true)
      .then((data) => {
        setAdding(false);
        if (data.success === "true") {
          setActiveKey(tool.key);
          toast.success(`${tool.label} added to this course`);
        } else {
          console.log(data.error);
          toast.error(errorMessage(data.error, `Failed to add ${tool.label}`));
        }
      })
      .catch((e) => {
        console.log(e);
        setAdding(false);
        toast.error(errorMessage(e, `Failed to add ${tool.label}`));
      });
  };

  const handleRemoveTool = () => {
    const tool = toolToRemove;
    setToolToRemove(null);
    setRemoving(true);
    setToolEnabled(tool.key, false)
      .then((data) => {
        setRemoving(false);
        if (data.success === "true") toast.success(`${tool.label} removed from this course`);
        else {
          console.log(data.error);
          toast.error(errorMessage(data.error, `Failed to remove ${tool.label}`));
        }
      })
      .catch((e) => {
        console.log(e);
        setRemoving(false);
        toast.error(errorMessage(e, `Failed to remove ${tool.label}`));
      });
  };

  const removeButton = (key) =>
    canManageTools && (
      <div className="border-top pt-3 mt-3">
        <button
          type="button"
          className="btn btn-danger"
          disabled={removing}
          onClick={() => setToolToRemove(tools.find((t) => t.key === key))}
        >
          <i className="bi-trash"></i> Remove Tool
        </button>
      </div>
    );

  if (!externalToolsLoaded)
    return <p className="text-muted mb-0">Loading…</p>;

  if (externalToolsError)
    return <p className="text-muted mb-0">Could not load this course's tools.</p>;

  return (
    <>
      {canvasEnabled && canvasTokenStatusLoaded && canvasTokenStatus.isTokenExpired && (
        <CanvasTokenExpiredWarning canvasLmsCourse={canvasLmsCourse} />
      )}

      {canvasEnabled && canvasTokenStatusLoaded && canvasLmsCourse !== null && !canvasTokenStatus.hasToken && (
        <CanvasLinkWarning
          canvasLmsCourse={canvasLmsCourse}
          message=", but the primary instructor has not added a Canvas access token. Synced features are disabled until they add one or the course is unlinked."
        />
      )}

      <ul className="nav nav-pills mb-3" id="course-tools-tab" role="tablist">
        {enabledTools.map((tab) => (
          <li className="nav-item" role="presentation" key={tab.key}>
            <button
              className={`nav-link ${tab.key === activeTool ? "active" : ""}`}
              id={`ext-${tab.key}-tab`}
              type="button"
              role="tab"
              aria-controls={`ext-${tab.key}`}
              aria-selected={tab.key === activeTool}
              onClick={() => setActiveKey(tab.key)}
            >
              {tab.label}
            </button>
          </li>
        ))}
        {canManageTools && (
          <li className="nav-item dropdown ms-auto">
            <button
              className="btn btn-outline-primary dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              disabled={availableTools.length === 0}
            >
              <i className="bi-plus-lg"></i> Add Tool
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              {availableTools.map((tool) => (
                <li key={tool.key}>
                  <button className="dropdown-item" type="button" disabled={adding} onClick={() => handleAddTool(tool)}>
                    {tool.label}
                  </button>
                </li>
              ))}
            </ul>
          </li>
        )}
      </ul>

      {enabledTools.length === 0 && (
        <p className="text-muted mb-0">
          No tools have been added to this course yet.
          {canManageTools && " Use Add Tool to add one."}
        </p>
      )}

      <div className="tab-content" id="course-tools-tabContent">
        {isEnabled("queue") && (
          <div className={paneClass("queue")} id="ext-queue" role="tabpanel" aria-labelledby="ext-queue-tab">
            <div className="col-md-12 my-auto">
              <QueueSettings course_id={courseId} {...props} />
              {removeButton("queue")}
            </div>
          </div>
        )}

        {isEnabled("llm") && (
          <div className={paneClass("llm")} id="ext-llm" role="tabpanel" aria-labelledby="ext-llm-tab">
            <div className="col-md-12 my-auto">
              <p className="text-muted mb-0">
                The LLM Chat Bot is available to students on the main chat bot page and while waiting on the queue.
              </p>
              {removeButton("llm")}
            </div>
          </div>
        )}

        {canvasEnabled && (
          <div className={paneClass("canvas")} id="ext-canvas" role="tabpanel" aria-labelledby="ext-canvas-tab">
            <div className="col-md-12 my-auto">
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
              {canvasLmsCourse !== null && (
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
              {removeButton("canvas")}
            </div>
          </div>
        )}

        {isEnabled("gradescope") && (
          <div className={paneClass("gradescope")} id="ext-gradescope" role="tabpanel" aria-labelledby="ext-gradescope-tab">
            <div className="col-md-12 my-auto">
              <GradescopeCsvUpload
                course_id={courseId}
                lastUploadedAt={lastUploads.gradescope}
                lastUploadedLoaded={externalToolsLoaded}
                onLastUploadsChange={setLastUploads}
                {...props}
              />
              {removeButton("gradescope")}
            </div>
          </div>
        )}

        {isEnabled("piazza") && (
          <div className={paneClass("piazza")} id="ext-piazza" role="tabpanel" aria-labelledby="ext-piazza-tab">
            <div className="col-md-12 my-auto">
              <PiazzaUpload
                course_id={courseId}
                lastUploadedAt={lastUploads.piazza}
                lastUploadedLoaded={externalToolsLoaded}
                onLastUploadsChange={setLastUploads}
                {...props}
              />
              {removeButton("piazza")}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        show={toolToRemove !== null}
        title={`Remove ${toolToRemove?.label}?`}
        confirmLabel="Remove Tool"
        confirmClassName="btn-danger"
        onCancel={() => setToolToRemove(null)}
        onConfirm={handleRemoveTool}
      >
        <p className="mb-0">
          {toolToRemove?.label} will be turned off for this course. Its settings and data will be kept.
        </p>
      </ConfirmModal>
    </>
  );
}

export default CourseToolsPanel;
