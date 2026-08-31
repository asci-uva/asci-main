import React, { useState } from "react";
import { toast } from "react-toastify";
import { useUser } from "../context/UserContext";
import { postCommand } from "../utils/postCommand";
import { errorMessage } from "../utils/errorMessage";
import { isInstructorRole } from "../utils/roles";
import ConfirmModal from "../utils/ConfirmModal";
import { parseGradescopeCsv, matchAssignments, isZeroLateness } from "../utils/parseGradescopeCsv";

function identityKey(person) {
  const computingId = (person.computing_id || "").trim().toLowerCase();
  if (computingId !== "") return computingId;

  const email = (person.email || "").trim().toLowerCase();
  const at = email.indexOf("@");

  return at === -1 ? email : email.slice(0, at);
}

function uploadSummary(matched, submissionsByAssignment, students) {
  const roster = new Set(
    (students || []).map(identityKey).filter((key) => key !== "")
  );
  const hasRoster = roster.size > 0;

  let created = 0;
  let overwrite = 0;
  let skippedNoStudent = 0;
  let skippedNothingRecorded = 0;

  matched.forEach((assignment) => {
    const stored = new Set(
      (submissionsByAssignment[assignment.canvasAssignment.id] || [])
        .filter((submission) => submission.computing_id)
        .map((submission) => identityKey(submission))
    );

    assignment.submissions.forEach((row) => {
      const score = (row.score || "").trim();
      const hasScore = score !== "" && !isNaN(Number(score));
      const hasSubmittedAt = (row.submitted_at || "").trim() !== "";
      const hasLateness = (row.lateness || "").trim() !== "" && !isZeroLateness(row.lateness);

      if (!hasScore && !hasSubmittedAt && !hasLateness) {
        skippedNothingRecorded += 1;
        return;
      }

      const key = identityKey(row);
      if (hasRoster && !roster.has(key)) {
        skippedNoStudent += 1;
        return;
      }

      if (stored.has(key)) overwrite += 1;
      else created += 1;
    });
  });

  return {
    created,
    overwrite,
    skippedNoStudent,
    skippedNothingRecorded,
    rows: created + overwrite + skippedNoStudent + skippedNothingRecorded,
  };
}

function UploadGradescopeCsv(props) {
  const { user, getCourse } = useUser();
  const course = getCourse();

  const [parsed, setParsed] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [results, setResults] = useState(null);

  if (!isInstructorRole(course?.role)) return null;

  const reset = () => {
    setParsed(null);
    setParseError(null);
    setResults(null);
    setConfirming(false);
  };

  const handleFileChange = (event) => {
    const selected = event.target.files[0];
    reset();

    if (!selected) return;

    const reader = new FileReader();
    reader.onload = (loaded) => {
      try {
        const result = parseGradescopeCsv(loaded.target.result);
        if (result.error) {
          setParseError(result.error);
          return;
        }

        setParsed({
          students: result.students,
          ...matchAssignments(result.assignments, props.assignments),
        });
      } catch (e) {
        console.log(e);
        setParseError("Could not read this file as a Gradescope CSV export");
      }
    };
    reader.onerror = () => setParseError("Could not read this file");
    reader.readAsText(selected);
  };

  const upload = () => {
    if (!parsed || parsed.matched.length === 0) return;

    setUploading(true);
    setResults(null);

    const payload = {
      command: "uploadGradescopeSubmissions",
      asciCourseId: props.course_id,
      user: user.userid,
      submissions: parsed.matched.map((assignment) => ({
        canvasAssignmentId: assignment.canvasAssignment.canvas_assignment_id,
        rows: assignment.submissions,
      })),
    };

    postCommand(props.url, payload)
      .then((data) => {
        setUploading(false);

        if (data.success === "true") {
          setResults(data);
          toast.success("Uploaded Gradescope submissions");
          if (props.onUploaded) props.onUploaded();
        } else {
          console.log(data.error);
          toast.error(errorMessage(data.error, "Failed to upload Gradescope submissions"));
        }
      })
      .catch((e) => {
        console.log(e);
        setUploading(false);
        toast.error(errorMessage(e, "Failed to upload Gradescope submissions"));
      });
  };

  const Preview = () => {
    if (parseError) return <p className="alert alert-warning mt-3 mb-0">{parseError}</p>;
    if (!parsed || parsed.matched.length > 0) return null;

    return (
      <p className="alert alert-warning mt-3 mb-0">
        None of the {parsed.unmatched.length}{" "}
        {parsed.unmatched.length === 1 ? "column" : "columns"} in this file match an
        assignment synced from Canvas. Sync assignments first, or check that the
        Gradescope names match the Canvas names.
      </p>
    );
  };

  const Results = () => {
    if (!results) return null;

    return (
      <div className="mt-3">
        <h6>Upload Results</h6>
        <p className="mb-0">
          {results.imported} added, {results.updated} updated
          {results.skipped > 0 && `, ${results.skipped} skipped (no matching student on the roster)`}
        </p>
      </div>
    );
  };

  const UploadButton = () => {
    if (uploading)
      return (
        <button type="button" className="btn btn-primary" disabled>
          Uploading (Please Wait)
        </button>
      );

    return (
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => setConfirming(true)}
        disabled={!parsed || parsed.matched.length === 0}
      >
        Upload
      </button>
    );
  };

  const summary = parsed
    ? uploadSummary(parsed.matched, props.submissionsByAssignment || {}, props.students)
    : { rows: 0, created: 0, overwrite: 0, skippedNoStudent: 0, skippedNothingRecorded: 0 };

  return (
    <div className="card mb-4">
      <h4 className="card-header">Upload Gradescope CSV</h4>
      <div className="card-body">
        <p className="text-muted">
          Upload a Gradescope grade export to fill in scores, submission times, and lateness
          for assignments synced from Canvas. Columns are matched to Canvas assignments by
          name. A later Canvas sync overwrites anything Canvas has a value for.
        </p>

        <div className="input-group">
          <input className="form-control" type="file" onChange={handleFileChange} accept=".csv" />
          <UploadButton />
        </div>

        <Preview />
        <Results />
      </div>

      <ConfirmModal
        show={confirming}
        title="Confirm Upload"
        confirmLabel="Upload"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          upload();
        }}
      >
        <p className="mb-2">
          Found <b>{parsed?.students}</b> students and{" "}
          <b>{(parsed?.matched.length || 0) + (parsed?.unmatched.length || 0)}</b>{" "}
          assignment columns.
        </p>

        <div style={{ maxHeight: "300px", overflowY: "auto" }} className="mb-3">
          <h6>Will be uploaded ({parsed?.matched.length})</h6>
          <ul className="list-group mb-3">
            {parsed?.matched.map((assignment) => (
              <li key={assignment.name} className="d-flex justify-content-between">
                <span>{assignment.name}</span>
                <span className="text-muted">
                  {assignment.submissions.length} submissions
                </span>
              </li>
            ))}
          </ul>

          {parsed?.unmatched.length > 0 && (
            <>
              <h6>
                No matching Canvas assignment — will be ignored ({parsed.unmatched.length})
              </h6>
              <ul className="list-group mb-0">
                {parsed.unmatched.map((assignment) => (
                  <li key={assignment.name} className="text-muted">
                    {assignment.name}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {summary.overwrite > 0 && (
          <p className="alert alert-warning mb-0">
            <b>{summary.overwrite}</b> of these will replace a submission already stored,
            whether it came from an earlier upload or from Canvas. This cannot be undone.
          </p>
        )}
      </ConfirmModal>
    </div>
  );
}

export default UploadGradescopeCsv;
