import React, { useState, useEffect, useRef } from "react";
import { useUser } from "../context/UserContext";
import { postCommand } from "../utils/postCommand";
import { useCanvasSyncSettings } from "../utils/useCanvasSyncSettings";
import { useCanvasTokenStatus } from "../utils/useCanvasTokenStatus";
import { isInstructorRole, isStaffRole } from "../utils/roles";
import { TOOLS } from "../utils/externalTools";
import ExternalToolToggle from "./ExternalToolToggle";
import CanvasLmsSync from "../admin/CanvasLmsSync";
import UploadRoster from "../admin/UploadRoster";
import CanvasLinkWarning from "../admin/CanvasLinkWarning";
import CanvasTokenExpiredWarning from "../admin/CanvasTokenExpiredWarning";

const CANVAS_TOOL = TOOLS.find((tool) => tool.key === "canvas");

const CanvasExternalTool = (props) => {
  const { getCourse, getCourseExternalTools } = useUser();
  const course = getCourse();
  const courseId = course.course_id;
  const courseRole = course.role;
  const isStaff = isStaffRole(courseRole);
  const isInstructor = isInstructorRole(courseRole);
  const enabled = getCourseExternalTools()?.canvas?.enabled ?? false;

  const [canvasLmsCourse, setCanvasLmsCourse] = useState(null);
  const [canvasLmsCourseLoaded, setCanvasLmsCourseLoaded] = useState(false);
  const canvasLmsCourseRequestIdRef = useRef(0);

  const {
    status: canvasTokenStatus,
    loaded: canvasTokenStatusLoaded,
    error: canvasTokenStatusError,
    refresh: refreshCanvasTokenStatus,
  } = useCanvasTokenStatus(props.url, courseId, enabled && isStaff);

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
    enabled && canvasLmsCourse !== null && isStaff
  );

  useEffect(() => {
    setCanvasLmsCourse(null);
    setCanvasLmsCourseLoaded(false);

    if (!enabled) return;

    const requestId = ++canvasLmsCourseRequestIdRef.current;
    const isCurrent = () => requestId === canvasLmsCourseRequestIdRef.current;

    postCommand(props.url, {
      asciCourseId: courseId,
      command: "getCanvasLmsCourse",
    })
      .then((data) => {
        if (!isCurrent()) return;
        setCanvasLmsCourse(data.success === "true" ? data.course : null);
        setCanvasLmsCourseLoaded(true);
      })
      .catch((error) => {
        console.log(error);
        if (!isCurrent()) return;
        setCanvasLmsCourseLoaded(true);
      });
  }, [courseId, props.url, enabled]);

  return (
    <>
      <ExternalToolToggle tool={CANVAS_TOOL} />

      {!enabled ? (
        <p className="text-muted mb-0">
          Enable Canvas to connect this course to Canvas LMS and keep your roster
          in sync.
        </p>
      ) : (
        <>
          {canvasTokenStatusLoaded && canvasTokenStatus.isTokenExpired && (
            <CanvasTokenExpiredWarning canvasLmsCourse={canvasLmsCourse} />
          )}

          {canvasTokenStatusLoaded && canvasLmsCourse !== null && !canvasTokenStatus.hasToken && (
            <CanvasLinkWarning
              canvasLmsCourse={canvasLmsCourse}
              message=", but the primary instructor has not added a Canvas access token. Synced features are disabled until they add one or the course is unlinked."
            />
          )}

          {isInstructor && (
            <div className="mb-4">
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
            </div>
          )}

          {isStaff && (
            <div>
              {!canvasLmsCourseLoaded ? (
                <p className="text-muted">Loading…</p>
              ) : canvasLmsCourse !== null ? (
                <UploadRoster
                  course_id={courseId}
                  canvasTokenStatus={canvasTokenStatus}
                  canvasTokenStatusLoaded={canvasTokenStatusLoaded}
                  canvasLmsCourse={canvasLmsCourse}
                  canvasLmsCourseLoaded={canvasLmsCourseLoaded}
                  canvasSyncSettings={canvasSyncSettings}
                  setCanvasSyncSettings={setCanvasSyncSettings}
                  refreshCanvasSyncSettings={refreshCanvasSyncSettings}
                  {...props}
                />
              ) : (
                <div className="alert alert-info mb-0">
                  No Canvas course is linked yet.{" "}
                  {isInstructor
                    ? "Use Setup above to link a Canvas course."
                    : "Ask your instructor to link a Canvas course."}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default CanvasExternalTool;
