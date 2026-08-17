export const ON_TIME = "onTime";
export const LATE = "late";
export const MISSING = "missing";
export const NOT_YET_DUE = "notYetDue";

function toDate(value) {
  if (!value) return null;

  const date = new Date(String(value).replace(" ", "T"));
  return isNaN(date.getTime()) ? null : date;
}

function isPublished(assignment) {
  return assignment.published !== false && assignment.published !== "f";
}

const UNIT_SECONDS = {
  year: 31557600,
  mon: 2592000,
  week: 604800,
  day: 86400,
  hour: 3600,
  min: 60,
  sec: 1,
};

export function intervalToSeconds(interval) {
  if (interval === null || interval === undefined) return null;

  const text = String(interval).trim();
  if (text === "") return null;

  let seconds = 0;
  let matched = false;

  const units = /(-?\d+)\s*(year|mon|week|day|hour|min|sec)/g;
  let unit;
  while ((unit = units.exec(text)) !== null) {
    seconds += Number(unit[1]) * UNIT_SECONDS[unit[2]];
    matched = true;
  }

  const clock = /(-?)(\d+):(\d{2}):(\d{2}(?:\.\d+)?)/.exec(text);
  if (clock) {
    const magnitude =
      Number(clock[2]) * 3600 + Number(clock[3]) * 60 + Number(clock[4]);
    seconds += clock[1] === "-" ? -magnitude : magnitude;
    matched = true;
  }

  return matched ? seconds : null;
}
export function submissionState(assignment, submission, now) {
  const due = toDate(assignment.due_at);

  if (!submission || !submission.submitted_at) {
    if (due !== null && due > now) return NOT_YET_DUE;
    return MISSING;
  }

  const lateSeconds = intervalToSeconds(submission.lateness);
  if (lateSeconds !== null) return lateSeconds > 0 ? LATE : ON_TIME;

  const submitted = toDate(submission.submitted_at);
  if (due !== null && submitted !== null && submitted > due) return LATE;

  return ON_TIME;
}

export function tardinessSeconds(assignment, submission, now = new Date()) {
  const state = submissionState(assignment, submission, now);
  if (state !== ON_TIME && state !== LATE) return null;

  const lateSeconds = intervalToSeconds(submission.lateness);
  if (lateSeconds !== null) return Math.max(0, lateSeconds);

  const due = toDate(assignment.due_at);
  const submitted = toDate(submission.submitted_at);
  if (due !== null && submitted !== null)
    return Math.max(0, (submitted.getTime() - due.getTime()) / 1000);

  return 0;
}

function median(values) {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function belongsTo(submission, student) {
  if (student.id != null && submission.user_id != null)
    return String(submission.user_id) === String(student.id);

  if (!student.computing_id || !submission.computing_id) return false;

  return (
    String(submission.computing_id).toLowerCase() ===
    String(student.computing_id).toLowerCase()
  );
}

export function studentSubmissionAnalytics(
  assignments,
  submissions,
  student,
  now = new Date()
) {
  const counts = { [ON_TIME]: 0, [LATE]: 0, [MISSING]: 0, [NOT_YET_DUE]: 0 };

  if (!student) return emptyAnalytics(counts);

  const mine = (submissions || []).filter((submission) =>
    belongsTo(submission, student)
  );

  const byAssignment = {};
  mine.forEach((submission) => {
    byAssignment[submission.canvas_lms_assignment_id] = submission;
  });

  let percentTotal = 0;
  let gradedCount = 0;
  let missingScoredCount = 0;
  const tardiness = [];

  (assignments || [])
    .filter(
      (assignment) => isPublished(assignment) && !assignment.missing_from_canvas_at
    )
    .forEach((assignment) => {
      const submission = byAssignment[assignment.id];
      const state = submissionState(assignment, submission, now);
      counts[state] += 1;

      if (state === ON_TIME || state === LATE)
        tardiness.push(tardinessSeconds(assignment, submission, now));

      const points = Number(assignment.points_possible);
      if (isNaN(points) || points <= 0) return;

      if (state === MISSING) {
        missingScoredCount += 1;
        return;
      }

      if (
        submission &&
        submission.score !== null &&
        submission.score !== undefined &&
        submission.score !== "" &&
        !isNaN(Number(submission.score))
      ) {
        percentTotal += (Number(submission.score) / points) * 100;
        gradedCount += 1;
      }
    });

  const scoredCount = gradedCount + missingScoredCount;
  const submittedCount = tardiness.length;
  const tardinessTotal = tardiness.reduce((sum, seconds) => sum + seconds, 0);

  return {
    onTime: counts[ON_TIME],
    late: counts[LATE],
    missing: counts[MISSING],
    notYetDue: counts[NOT_YET_DUE],
    totalDue: counts[ON_TIME] + counts[LATE] + counts[MISSING],
    gradedCount,
    missingScoredCount,
    scoredCount,
    averagePercent: scoredCount > 0 ? percentTotal / scoredCount : null,
    submittedCount,
    tardinessTotalSeconds: submittedCount > 0 ? tardinessTotal : null,
    tardinessMeanSeconds: submittedCount > 0 ? tardinessTotal / submittedCount : null,
    tardinessMedianSeconds: median(tardiness),
  };
}

function emptyAnalytics(counts) {
  return {
    onTime: counts[ON_TIME],
    late: counts[LATE],
    missing: counts[MISSING],
    notYetDue: counts[NOT_YET_DUE],
    totalDue: 0,
    gradedCount: 0,
    missingScoredCount: 0,
    scoredCount: 0,
    averagePercent: null,
    submittedCount: 0,
    tardinessTotalSeconds: null,
    tardinessMeanSeconds: null,
    tardinessMedianSeconds: null,
  };
}
