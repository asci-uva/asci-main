import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { postCommand } from "../utils/postCommand";
import { errorMessage } from "../utils/errorMessage";
import AssignmentsList from "./AssignmentsList";
import UploadGradescopeCsv from "./UploadGradescopeCsv";

function Assignments(props) {
  const courseId = props.course_id;

  const [assignments, setAssignments] = useState([]);
  const [submissionsByAssignment, setSubmissionsByAssignment] = useState({});
  const [students, setStudents] = useState([]);
  const [assignmentsLoaded, setAssignmentsLoaded] = useState(false);
  const [submissionsLoaded, setSubmissionsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const requestIdRef = useRef(0);
  const submissionsRequestIdRef = useRef(0);

  const loaded = assignmentsLoaded && submissionsLoaded;

  const loadSubmissions = () => {
    if (!courseId) return Promise.resolve();

    const requestId = ++submissionsRequestIdRef.current;
    const isCurrent = () => requestId === submissionsRequestIdRef.current;

    return postCommand(props.url, {
      asciCourseId: courseId,
      command: "getCanvasSubmissions",
    })
      .then((data) => {
        if (!isCurrent()) return;
        setSubmissionsLoaded(true);

        if (data.success !== "true") {
          console.log(data.error);
          return;
        }

        const grouped = {};
        (data.submissions || []).forEach((submission) => {
          const key = submission.canvas_lms_assignment_id;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(submission);
        });

        setSubmissionsByAssignment(grouped);
        setStudents(data.students || []);
      })
      .catch((e) => {
        console.log(e);
        if (!isCurrent()) return;
        setSubmissionsLoaded(true);
      });
  };

  const removeFlaggedAssignment = (assignment) => {
    return postCommand(props.url, {
      asciCourseId: courseId,
      command: "removeFlaggedCanvasAssignment",
      canvasAssignmentId: assignment.canvas_assignment_id,
    })
      .then((data) => {
        if (data.success === "true") {
          setAssignments(data.assignments || []);
          const removed = data.removedSubmissions;
          toast.success(
            removed > 0
              ? `Removed ${assignment.name} and its ${removed} ${
                  removed === 1 ? "submission" : "submissions"
                }`
              : `Removed ${assignment.name}`
          );
          return loadSubmissions();
        }

        console.log(data.error);
        toast.error(errorMessage(data.error, "Failed to remove the assignment"));
      })
      .catch((e) => {
        console.log(e);
        toast.error(errorMessage(e, "Failed to remove the assignment"));
      });
  };

  const loadAssignments = ({ refresh = false } = {}) => {
    if (!courseId) return Promise.resolve();

    const requestId = ++requestIdRef.current;
    const isCurrent = () => requestId === requestIdRef.current;

    if (refresh) setRefreshing(true);

    return postCommand(props.url, {
      asciCourseId: courseId,
      command: "getCanvasAssignments",
      ...(refresh ? { refresh: true } : {}),
    })
      .then((data) => {
        if (!isCurrent()) return;
        setRefreshing(false);
        setAssignmentsLoaded(true);

        if (data.success === "true") {
          setAssignments(data.assignments || []);
          setError(null);
          if (refresh) {
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

            return loadSubmissions();
          }
        } else {
          console.log(data.error);
          setError(errorMessage(data.error, "Failed to load Canvas LMS assignments"));
          if (refresh)
            toast.error(errorMessage(data.error, "Failed to sync Canvas LMS assignments"));
        }
      })
      .catch((e) => {
        console.log(e);
        if (!isCurrent()) return;
        setRefreshing(false);
        setAssignmentsLoaded(true);
        setError("Failed to load Canvas LMS assignments");
        if (refresh) toast.error("Failed to sync Canvas LMS assignments");
      });
  };

  useEffect(() => {
    if (!props.canvasLmsCourseLoaded) return;

    if (props.canvasLmsCourse === null) {
      requestIdRef.current++;
      submissionsRequestIdRef.current++;
      setAssignments([]);
      setSubmissionsByAssignment({});
      setStudents([]);
      setError(null);
      setAssignmentsLoaded(true);
      setSubmissionsLoaded(true);
      return;
    }

    loadAssignments();
    loadSubmissions();
  }, [props.canvasLmsCourse, props.canvasLmsCourseLoaded, courseId]);

  const lastSyncedAt = assignments.length > 0 ? assignments[0].last_synced_at : null;

  return (
    <>
      {props.gradescopeEnabled && props.canvasLmsCourse !== null && loaded && (
        <UploadGradescopeCsv
          url={props.url}
          course_id={courseId}
          assignments={assignments}
          submissionsByAssignment={submissionsByAssignment}
          students={students}
          onUploaded={loadSubmissions}
        />
      )}

      <AssignmentsList
        assignments={assignments}
        submissionsByAssignment={submissionsByAssignment}
        students={students}
        canvasLmsCourse={props.canvasLmsCourse}
        canvasLmsCourseLoaded={props.canvasLmsCourseLoaded}
        loaded={loaded}
        error={error}
        refreshing={refreshing}
        lastSyncedAt={lastSyncedAt}
        onRefresh={() => loadAssignments({ refresh: true })}
        onRemoveFlagged={removeFlaggedAssignment}
      />
    </>
  );
}

export default Assignments;
