const MAX_POINTS_SUFFIX = " - Max Points";
const SUBMISSION_TIME_SUFFIX = " - Submission Time";
const LATENESS_SUFFIX = " - Lateness (H:M:S)";

const COMPANION_SUFFIXES = [MAX_POINTS_SUFFIX, SUBMISSION_TIME_SUFFIX, LATENESS_SUFFIX];
const IDENTITY_COLUMNS = ["first name", "last name", "sid", "email"];
const TOTAL_LATENESS_COLUMN = "total lateness (h:m:s)";

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  const stripped = text.replace(/^﻿/, "");

  for (let i = 0; i < stripped.length; i++) {
    const char = stripped[i];

    if (inQuotes) {
      if (char === '"') {
        if (stripped[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && stripped[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

export function isZeroLateness(lateness) {
  return /^-?0+:0+:0+(\.0+)?$/.test((lateness || "").trim());
}

function isCompanionColumn(header) {
  return COMPANION_SUFFIXES.some((suffix) => header.endsWith(suffix));
}

function isIdentityColumn(header) {
  const lowered = header.toLowerCase();

  return IDENTITY_COLUMNS.includes(lowered) || lowered === TOTAL_LATENESS_COLUMN;
}

function columnIndexes(headers) {
  const byName = {};
  headers.forEach((header, index) => {
    byName[header.trim()] = index;
  });

  return byName;
}

export function parseGradescopeCsv(text) {
  const rows = parseCsv(text).filter((row) => row.some((cell) => cell.trim() !== ""));

  if (rows.length === 0) return { students: 0, assignments: [], error: "The file is empty" };

  const headers = rows[0].map((header) => header.trim());
  const byName = columnIndexes(headers);

  const sidIndex = headers.findIndex((header) => header.toLowerCase() === "sid");
  const emailIndex = headers.findIndex((header) => header.toLowerCase() === "email");

  if (sidIndex === -1 && emailIndex === -1)
    return {
      students: 0,
      assignments: [],
      error: "The file has no SID or Email column, so submissions cannot be matched to students",
    };

  const assignmentNames = headers.filter(
    (header) => header !== "" && !isIdentityColumn(header) && !isCompanionColumn(header)
  );

  const studentRows = rows.slice(1);

  const cellAt = (row, index) => (index === undefined || index === -1 ? "" : (row[index] ?? "").trim());

  const assignments = assignmentNames.map((name) => {
    const scoreIndex = byName[name];
    const submittedIndex = byName[name + SUBMISSION_TIME_SUFFIX];
    const latenessIndex = byName[name + LATENESS_SUFFIX];
    const maxPointsIndex = byName[name + MAX_POINTS_SUFFIX];

    const submissions = studentRows
      .map((row) => ({
        computing_id: cellAt(row, sidIndex),
        email: cellAt(row, emailIndex),
        score: cellAt(row, scoreIndex),
        submitted_at: cellAt(row, submittedIndex),
        lateness: cellAt(row, latenessIndex),
      }))
      .filter((submission) => submission.computing_id !== "" || submission.email !== "")
      .filter(
        (submission) =>
          submission.score !== "" ||
          submission.submitted_at !== "" ||
          (submission.lateness !== "" && !isZeroLateness(submission.lateness))
      );

    return {
      name,
      maxPoints: maxPointsIndex === undefined ? null : cellAt(studentRows[0] ?? [], maxPointsIndex),
      hasSubmissionTime: submittedIndex !== undefined,
      hasLateness: latenessIndex !== undefined,
      submissions,
    };
  });

  return { students: studentRows.length, assignments, error: null };
}

export function matchAssignments(parsedAssignments, canvasAssignments) {
  const canvasByName = {};
  (canvasAssignments || []).forEach((assignment) => {
    if (!assignment.name) return;
    canvasByName[assignment.name.trim().toLowerCase()] = assignment;
  });

  const matched = [];
  const unmatched = [];

  parsedAssignments.forEach((parsed) => {
    const canvasAssignment = canvasByName[parsed.name.trim().toLowerCase()];

    if (canvasAssignment) matched.push({ ...parsed, canvasAssignment });
    else unmatched.push(parsed);
  });

  return { matched, unmatched };
}
