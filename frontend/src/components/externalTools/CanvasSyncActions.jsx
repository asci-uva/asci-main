import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useUser } from "../context/UserContext";
import { postCommand } from "../utils/postCommand";
import ConfirmModal from "../utils/ConfirmModal";
import { errorMessage } from "../utils/errorMessage";
import { formatLastSynced, isStaleSync } from "../utils/CanvasStalePeriod";
import { isInstructorRole } from "../utils/roles";

function LastSynced({ lastSyncedAt, stale }) {
  return (
    <span className={stale ? "text-danger" : "text-muted"}>
      Last synced: {formatLastSynced(lastSyncedAt)}
    </span>
  );
}

function CanvasSyncActions(props) {
  const { user, getCourse, refreshCourseRoster } = useUser();
  const course = getCourse();
  const courseId = props.course_id;

  const [assignmentsSyncedAt, setAssignmentsSyncedAt] = useState(null);
  const [assignmentsLoaded, setAssignmentsLoaded] = useState(false);
  const [syncing, setSyncing] = useState(null);
  const [pendingSync, setPendingSync] = useState(null);
  const requestIdRef = useRef(0);

  const canSync = isInstructorRole(course?.role);

  useEffect(() => {
    if (!courseId || !canSync) return;

    const requestId = ++requestIdRef.current;
    const isCurrent = () => requestId === requestIdRef.current;

    postCommand(props.url, {
      asciCourseId: courseId,
      command: "getCanvasAssignments",
      user: user.userid
    })
      .then((data) => {
        if (!isCurrent()) return;
        setAssignmentsLoaded(true);

        if (data.success === "true") {
          const assignments = data.assignments || [];
          setAssignmentsSyncedAt(
            assignments.length > 0 ? assignments[0].last_synced_at : null
          );
        } else console.log(data.error);
      })
      .catch((e) => {
        console.log(e);
        if (!isCurrent()) return;
        setAssignmentsLoaded(true);
      });
  }, [props.url, courseId, canSync]);

  const syncRoster = () =>
    postCommand(props.url, {
      asciCourseId: courseId,
      command: "syncCanvasLmsRoster",
      user: user.userid
    })
      .then((data) => {
        if (data.success !== "true") {
          console.log(data.error);
          toast.error(errorMessage(data.error, "Failed to sync Canvas LMS roster"));
          return;
        }

        refreshCourseRoster();

        if (data.course)
          props.setCanvasSyncSettings((prev) => ({
            ...(prev || {}),
            last_synced_at: data.course.last_synced_at,
            stale_period: data.course.stale_period,
            autosync_enabled: data.course.autosync_enabled,
            is_stale: false, // a course that was just synced is by definition not stale
          }));
        else props.refreshCanvasSyncSettings();

        toast.success("Successfully synced Canvas LMS roster");
      })
      .catch((e) => {
        console.log(e);
        toast.error(errorMessage(e, "Failed to sync Canvas LMS roster"));
      });

  const syncAssignments = () => {
    const requestId = ++requestIdRef.current;
    const isCurrent = () => requestId === requestIdRef.current;

    return postCommand(props.url, {
      asciCourseId: courseId,
      command: "getCanvasAssignments",
      user: user.userid,
      refresh: true,
    })
      .then((data) => {
        if (data.success !== "true") {
          console.log(data.error);
          toast.error(
            errorMessage(data.error, "Failed to sync Canvas LMS assignments")
          );
          return;
        }

        if (isCurrent()) {
          const assignments = data.assignments || [];
          setAssignmentsSyncedAt(
            assignments.length > 0 ? assignments[0].last_synced_at : null
          );
        }

        if (data.guarded)
          toast.warning(
            "Canvas returned no assignments. Nothing was changed — check that the course is still linked correctly."
          );
        else if (data.flagged > 0)
          toast.warning(
            `Synced Canvas LMS assignments. ${data.flagged} ${
              data.flagged === 1 ? "assignment is" : "assignments are"
            } no longer in Canvas and have been flagged.`
          );
        else toast.success("Successfully synced Canvas LMS assignments");
      })
      .catch((e) => {
        console.log(e);
        toast.error(errorMessage(e, "Failed to sync Canvas LMS assignments"));
      });
  };

  const runSync = (which) => {
    setPendingSync(null);
    setSyncing(which);

    const work =
      which === "roster"
        ? syncRoster()
        : which === "assignments"
        ? syncAssignments()
        : Promise.all([syncRoster(), syncAssignments()]);

    work.then(() => setSyncing(null)).catch(() => setSyncing(null));
  };

  const start = (which) =>
    which === "assignments" ? runSync(which) : setPendingSync(which);

  if (!canSync) return null;

  const tokenReady =
    props.canvasTokenStatusLoaded &&
    props.canvasTokenStatus.hasToken &&
    props.canvasTokenStatus.isTokenWorking;

  const rosterSettings = props.canvasSyncSettings;
  const disabled = !tokenReady || syncing !== null;

  const label = (which, idle) => (syncing === which ? "Syncing…" : idle);

  return (
    <div className="card mb-4">
      <h4 className="card-header">Synchronize with Canvas LMS</h4>
      <div className="card-body">
        {props.canvasTokenStatusLoaded && !tokenReady && (
          <p className="alert alert-warning">
            Cannot sync with Canvas LMS. Check the access token above.
          </p>
        )}

        <div className="mb-3">
          <button
            type="button"
            className="btn btn-primary"
            disabled={disabled}
            onClick={() => start("all")}
          >
            {label("all", "Sync All")}
          </button>
        </div>

        <div className="mb-3">
          <button
            type="button"
            className="btn btn-primary"
            disabled={disabled}
            onClick={() => start("roster")}
          >
            {label("roster", "Sync Roster")}
          </button>
          <div className="mt-1">
            {props.canvasSyncSettingsLoaded && rosterSettings ? (
              <LastSynced
                lastSyncedAt={rosterSettings.last_synced_at}
                stale={rosterSettings.is_stale}
              />
            ) : (
              <span className="text-muted">Last synced: Loading…</span>
            )}
          </div>
        </div>

        <div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={disabled}
            onClick={() => start("assignments")}
          >
            {label("assignments", "Sync Assignments")}
          </button>
          <div className="mt-1">
            {assignmentsLoaded ? (
              <LastSynced
                lastSyncedAt={assignmentsSyncedAt}
                stale={isStaleSync(
                  assignmentsSyncedAt,
                  props.canvasLmsCourse && props.canvasLmsCourse.stale_period
                )}
              />
            ) : (
              <span className="text-muted">Last synced: Loading…</span>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        show={pendingSync !== null}
        title="Confirm Canvas Roster Sync"
        onCancel={() => setPendingSync(null)}
        onConfirm={() => runSync(pendingSync)}
      >
        <p>
          Are you sure you want to sync the roster
          {pendingSync === "all" && " and assignments"} from{" "}
          <strong>{props.canvasLmsCourse.name}</strong> on Canvas LMS?
        </p>
        <p className="alert alert-warning d-flex justify-content-between align-items-center mb-3">
          Syncing the roster will remove all manually added users except for Instructors
        </p>
      </ConfirmModal>
    </div>
  );
}

export default CanvasSyncActions;
