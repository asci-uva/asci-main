import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import { formatLastSynced } from "../utils/CanvasStalePeriod";
import { isInstructorRole } from "../utils/roles";
import ConfirmModal from "../utils/ConfirmModal";

function isTrue(value) {
  return value === true || value === "t";
}

function formatDueDate(dueAt) {
  if (!dueAt) return "No due date";

  const date = new Date(dueAt);
  if (isNaN(date.getTime())) return "No due date";

  return date.toLocaleString();
}

function formatSubmissionTypes(submissionTypes) {
  if (!submissionTypes || submissionTypes.length === 0) return "—";

  return submissionTypes.map((type) => type.replace(/_/g, " ")).join(", ");
}

function formatSubmittedAt(submittedAt) {
  if (!submittedAt) return "—";

  const date = new Date(submittedAt.replace(" ", "T"));
  if (isNaN(date.getTime())) return submittedAt;

  return date.toLocaleString();
}

function formatLateness(lateness) {
  if (!lateness) return "—";
  if (/^-?0+:0+:0+$/.test(lateness.trim())) return "On time";

  return lateness;
}

function hasSubmitted(submission) {
  return Boolean(submission && submission.submitted_at);
}

function studentName(person) {
  const name = [person.fname, person.lname].filter(Boolean).join(" ");
  if (name !== "") return name;
  if (person.computing_id) return person.computing_id;

  return `Canvas user ${person.canvas_user_id}`;
}

function rosterRows(students, submissions) {
  const byUserId = {};
  submissions.forEach((submission) => {
    if (submission.user_id != null) byUserId[submission.user_id] = submission;
  });

  const rosterIds = new Set(students.map((student) => String(student.id)));

  const rows = students.map((student) => {
    const submission = byUserId[student.id];

    return submission
      ? { key: `s${submission.id}`, student, submission }
      : { key: `m${student.id}`, student, submission: null };
  });

  submissions
    .filter(
      (submission) =>
        submission.user_id == null || !rosterIds.has(String(submission.user_id))
    )
    .forEach((submission) => {
      rows.push({ key: `x${submission.id}`, student: submission, submission, offRoster: true });
    });

  return rows;
}

function SourceBadge({ source }) {
  if (source === "csv_upload")
    return <span className="badge bg-secondary">Gradescope CSV</span>;
  if (source === "canvas_sync") return <span className="badge bg-info">Canvas</span>;

  return null;
}

function SubmissionsList({ rows, pointsPossible }) {
  if (rows.length === 0)
    return (
      <p className="text-muted mb-0">
        No students are enrolled and no submissions are stored for this assignment.
      </p>
    );

  return (
    <div style={{ maxHeight: 300 + "px" }} className="overflow-auto">
      <table className="table table-striped table-sm mb-0">
        <thead>
          <tr>
            <th>Student</th>
            <th>Score</th>
            <th>Submitted</th>
            <th>Lateness</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody className="table-group-divider">
          {rows.map(({ key, student, submission, offRoster }) => (
            <tr key={key} className={hasSubmitted(submission) ? "" : "text-muted"}>
              <td>
                {studentName(student)}
                {student.computing_id && (
                  <span className="text-muted ms-2">{student.computing_id}</span>
                )}
                {offRoster && (
                  <span className="badge bg-warning text-dark ms-2">Not on roster</span>
                )}
              </td>
              <td>
                {submission?.score ?? "—"}
                {submission?.score != null && pointsPossible != null && (
                  <span className="text-muted"> / {pointsPossible}</span>
                )}
              </td>
              <td>
                {hasSubmitted(submission) ? (
                  formatSubmittedAt(submission.submitted_at)
                ) : (
                  <span className="badge bg-secondary">Missing</span>
                )}
              </td>
              <td>{hasSubmitted(submission) ? formatLateness(submission.lateness) : "—"}</td>
              <td>{submission && <SourceBadge source={submission.source} />}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AssignmentCard({ assignment, submissions, students, expanded, onToggle, onRemove }) {
  const rows = rosterRows(students, submissions);
  const submitted = rows.filter((row) => hasSubmitted(row.submission)).length;
  const missing = rows.length - submitted;
  const missingFromCanvas = assignment.missing_from_canvas_at;

  return (
    <div className="card mb-2">
      <div
        className="card-header d-flex justify-content-between align-items-center"
        role="button"
        onClick={onToggle}
      >
        <span>
          <b>{assignment.name}</b>
          <span className="text-muted ms-2">
            {submitted} of {rows.length} submitted
          </span>
          {missing > 0 && (
            <span className="badge bg-secondary ms-2">{missing} missing</span>
          )}
        </span>
        <span>
          {missingFromCanvas && (
            <span className="badge bg-warning text-dark me-2">No longer in Canvas</span>
          )}
          {isTrue(assignment.published) ? (
            <span className="badge bg-success me-2">Published</span>
          ) : (
            <span className="badge bg-secondary me-2">Unpublished</span>
          )}
          <span className="text-muted">{expanded ? "▾" : "▸"}</span>
        </span>
      </div>

      {expanded && (
        <div className="card-body">
          {missingFromCanvas && (
            <div className="alert alert-warning d-flex justify-content-between align-items-center">
              <span>
                This assignment was not in the last sync — it has probably been deleted or
                unpublished in Canvas. It is kept here, along with its submissions, rather
                than removed. First noticed missing {formatSubmittedAt(missingFromCanvas)}.
              </span>
              {onRemove && (
                <button
                  type="button"
                  className="btn btn-danger ms-3 text-nowrap"
                  onClick={() => onRemove(assignment, submissions.length)}
                >
                  Remove
                </button>
              )}
            </div>
          )}

          <p className="text-muted">
            Due: {formatDueDate(assignment.due_at)} · Points:{" "}
            {assignment.points_possible ?? "—"} · Submission types:{" "}
            {formatSubmissionTypes(assignment.submission_types)}
            {assignment.html_url && (
              <>
                {" · "}
                <a href={assignment.html_url} target="_blank" rel="noreferrer">
                  View on Canvas
                </a>
              </>
            )}
          </p>

          <SubmissionsList rows={rows} pointsPossible={assignment.points_possible} />
        </div>
      )}
    </div>
  );
}

function RefreshButton({ canvasLmsCourse, refreshing, onRefresh }) {
  if (canvasLmsCourse === null) return null;

  if (refreshing)
    return (
      <button type="button" className="btn btn-primary" disabled>
        Syncing Assignments (Please Wait)
      </button>
    );

  return (
    <button type="button" className="btn btn-primary" onClick={onRefresh}>
      Sync Assignments from Canvas
    </button>
  );
}

function AssignmentsList(props) {
  const [expandedId, setExpandedId] = useState(null);
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const { getCourse } = useUser();

  const canRemove = isInstructorRole(getCourse()?.role);

  const assignments = props.assignments || [];
  const submissionsByAssignment = props.submissionsByAssignment || {};
  const students = props.students || [];

  const body = () => {
    if (!props.canvasLmsCourseLoaded || !props.loaded) return <h5>Loading…</h5>;

    if (props.canvasLmsCourse === null)
      return (
        <h5>
          This course is not linked to a Canvas LMS course. Link it on the External Tools
          page to see its assignments here.
        </h5>
      );

    if (props.error) return <p className="alert alert-warning">{props.error}</p>;

    return (
      <div style={{ maxHeight: 600 + "px" }} className="overflow-auto">
        {assignments.map((assignment) => (
          <AssignmentCard
            key={assignment.id}
            assignment={assignment}
            submissions={submissionsByAssignment[assignment.id] || []}
            students={students}
            expanded={expandedId === assignment.id}
            onToggle={() =>
              setExpandedId(expandedId === assignment.id ? null : assignment.id)
            }
            onRemove={
              canRemove && props.onRemoveFlagged
                ? (target, submissionCount) =>
                    setPendingRemoval({ assignment: target, submissionCount })
                : null
            }
          />
        ))}
      </div>
    );
  };

  return (
    <div className="card mb-4">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h4 className="mb-0">Canvas Assignments</h4>
        <RefreshButton
          canvasLmsCourse={props.canvasLmsCourse}
          refreshing={props.refreshing}
          onRefresh={props.onRefresh}
        />
      </div>
      <div className="card-body">
        {props.canvasLmsCourse !== null && props.loaded && !props.error && (
          <p className="text-muted">Last synced: {formatLastSynced(props.lastSyncedAt)}</p>
        )}

        {body()}
      </div>

      <ConfirmModal
        show={pendingRemoval !== null}
        title="Remove Assignment"
        confirmLabel="Remove"
        onCancel={() => setPendingRemoval(null)}
        onConfirm={() => {
          const target = pendingRemoval;
          setPendingRemoval(null);
          props.onRemoveFlagged(target.assignment);
        }}
      >
        <p>
          Remove <strong>{pendingRemoval?.assignment.name}</strong>? It is no longer in
          Canvas, so syncing will not bring it back unless it reappears there.
        </p>
        {pendingRemoval?.submissionCount > 0 && (
          <p className="alert alert-warning mb-0">
            Its {pendingRemoval.submissionCount}{" "}
            {pendingRemoval.submissionCount === 1 ? "submission" : "submissions"} will be
            deleted too, including any uploaded from a Gradescope CSV. This cannot be
            undone.
          </p>
        )}
      </ConfirmModal>
    </div>
  );
}

export default AssignmentsList;
