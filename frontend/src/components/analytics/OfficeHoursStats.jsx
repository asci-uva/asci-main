import React, { useMemo } from "react";
import CollapsibleCard from "./CollapsibleCard";
import { Timeline, toDate, weekSpan, weeksFor } from "./activityTimeline";

const MIN_VISIT_SECONDS = 300;

function belongsTo(session, student) {
  if (student.id != null && session.user_id != null)
    return String(session.user_id) === String(student.id);

  if (!student.computing_id || !session.computing_id) return false;

  return (
    String(session.computing_id).toLowerCase() ===
    String(student.computing_id).toLowerCase()
  );
}

function studentKey(session) {
  if (session.user_id != null) return `id:${session.user_id}`;
  if (session.computing_id) return `cid:${String(session.computing_id).toLowerCase()}`;

  return null;
}

function visitSeconds(session) {
  const exit = toDate(session.exit_time);
  if (exit === null) return null;

  const start = toDate(session.fulfillment_time) || toDate(session.entry_time);
  if (start === null) return null;

  const seconds = (exit.getTime() - start.getTime()) / 1000;

  return seconds >= MIN_VISIT_SECONDS ? seconds : null;
}

function visitStart(session) {
  return toDate(session.fulfillment_time) || toDate(session.entry_time);
}

function formatHours(seconds) {
  if (seconds === null || seconds === undefined) return "—";

  return `${(seconds / 3600).toFixed(1)} h`;
}

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return "—";

  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;

  return formatHours(seconds);
}

function formatCount(value) {
  if (value === null || value === undefined) return "—";

  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function visitsOf(sessions, student) {
  return (sessions || [])
    .filter((session) => belongsTo(session, student))
    .map((session) => ({ date: visitStart(session), value: visitSeconds(session) }))
    .filter((visit) => visit.date !== null && visit.value !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function courseVisitDates(sessions) {
  return (sessions || [])
    .filter((session) => visitSeconds(session) !== null)
    .map((session) => visitStart(session))
    .filter((date) => date !== null);
}

function classAverages(sessions, weekCount) {
  const byStudent = {};

  (sessions || []).forEach((session) => {
    const key = studentKey(session);
    const seconds = visitSeconds(session);
    if (key === null || seconds === null) return;

    if (!byStudent[key]) byStudent[key] = { visits: 0, seconds: 0 };
    byStudent[key].visits += 1;
    byStudent[key].seconds += seconds;
  });

  const students = Object.values(byStudent);
  if (students.length === 0)
    return {
      visitsPerWeek: null,
      totalVisits: null,
      averageVisitSeconds: null,
      totalSeconds: null,
      studentCount: 0,
    };

  const totalVisits = students.reduce((sum, entry) => sum + entry.visits, 0);
  const totalSeconds = students.reduce((sum, entry) => sum + entry.seconds, 0);

  return {
    visitsPerWeek: weekCount > 0 ? totalVisits / students.length / weekCount : null,
    totalVisits: totalVisits / students.length,
    averageVisitSeconds: totalVisits > 0 ? totalSeconds / totalVisits : null,
    totalSeconds: totalSeconds / students.length,
    studentCount: students.length,
  };
}

export function officeHoursAnalytics(sessions, student, now = new Date()) {
  const span = weekSpan(courseVisitDates(sessions), now);
  const weekCount = span === null ? 0 : span.weekCount;

  if (!student || span === null)
    return {
      weeks: [],
      totalVisits: 0,
      totalSeconds: null,
      averageVisitSeconds: null,
      visitsPerWeek: null,
      weekCount,
      classAverage: classAverages(sessions, weekCount),
    };

  const visits = visitsOf(sessions, student);
  const totalSeconds = visits.reduce((sum, visit) => sum + visit.value, 0);

  return {
    weeks: weeksFor(span, visits),
    totalVisits: visits.length,
    totalSeconds: visits.length > 0 ? totalSeconds : null,
    averageVisitSeconds: visits.length > 0 ? totalSeconds / visits.length : null,
    visitsPerWeek: weekCount > 0 ? visits.length / weekCount : null,
    weekCount,
    classAverage: classAverages(sessions, weekCount),
  };
}

function StatsTable({ analytics }) {
  const classAverage = analytics.classAverage;

  const rows = [
    {
      label: "Average visits per week",
      value: formatCount(analytics.visitsPerWeek),
      average: formatCount(classAverage.visitsPerWeek),
    },
    {
      label: "Total office hour visits",
      value: formatCount(analytics.totalVisits),
      average: formatCount(classAverage.totalVisits),
    },
    {
      label: "Average time per visit",
      value: formatDuration(analytics.averageVisitSeconds),
      average: formatDuration(classAverage.averageVisitSeconds),
    },
    {
      label: "Total time in office hours",
      value: formatHours(analytics.totalSeconds),
      average: formatHours(classAverage.totalSeconds),
    },
  ];

  return (
    <table className="table table-sm mt-3 mb-0">
      <thead>
        <tr>
          <th>Office Hours</th>
          <th>Student</th>
          <th>Class Average</th>
        </tr>
      </thead>
      <tbody className="table-group-divider">
        {rows.map((row) => (
          <tr key={row.label}>
            <td>{row.label}</td>
            <td>{row.value}</td>
            <td className="text-muted">{row.average}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function OfficeHoursStats(props) {
  const analytics = useMemo(
    () => officeHoursAnalytics(props.sessions, props.student),
    [props.sessions, props.student]
  );

  const body = () => {
    if (!props.loaded) return <h5 className="mb-0">Loading…</h5>;

    if (props.error) return <p className="alert alert-warning mb-0">{props.error}</p>;

    if (analytics.weeks.length === 0)
      return (
        <h5 className="mb-0">
          No office hour visits have been recorded for this course yet.
        </h5>
      );

    return (
      <>
        <Timeline
          weeks={analytics.weeks}
          formatBar={(week) => (week.value / 3600).toFixed(1)}
          formatTooltip={(week) =>
            `Week of ${week.label}: ${formatHours(week.value)} over ${week.count} ${
              week.count === 1 ? "visit" : "visits"
            }`
          }
        />

        <StatsTable analytics={analytics} />

        {analytics.totalVisits === 0 && (
          <p className="text-muted mt-3 mb-0">
            This student has not been to office hours yet. The class average covers{" "}
            {analytics.classAverage.studentCount}{" "}
            {analytics.classAverage.studentCount === 1 ? "student" : "students"} who
            have.
          </p>
        )}
      </>
    );
  };

  return <CollapsibleCard title="Office Hours">{body()}</CollapsibleCard>;
}

export default OfficeHoursStats;
