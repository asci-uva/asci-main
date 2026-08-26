import React, { useMemo } from "react";
import CollapsibleCard from "./CollapsibleCard";
import { Timeline, toDate, weekSpan, weeksFor } from "./activityTimeline";

const CONTRIBUTION_SERIES = [
  { key: "questions", label: "Questions asked", color: "#3d7dd8" },
  { key: "answers", label: "Answers given", color: "#eda100" },
  { key: "followups", label: "Follow-ups", color: "#7a5bd8" },
  { key: "notes", label: "Notes", color: "#1baf7a" },
  { key: "other", label: "Other", color: "#9aa0a6" },
];

function isUpdate(action) {
  const text = String(action || "").toLowerCase();

  return text.startsWith("updated") && !text.includes("answer");
}

function contributionSeries(action) {
  const text = String(action || "").toLowerCase();

  if (text.includes("answer")) return "answers";
  if (text.includes("followup") || text.includes("follow_up")) return "followups";
  if (text.includes("question")) return "questions";
  if (text.includes("note")) return "notes";

  return "other";
}

const METRICS = [
  { key: "posts", label: "Total posts" },
  { key: "asks", label: "Questions asked" },
  { key: "answers", label: "Answers given" },
  { key: "days", label: "Days online" },
  { key: "views", label: "Views" },
];

function belongsTo(row, student) {
  if (student.id != null && row.user_id != null)
    return String(row.user_id) === String(student.id);

  if (!student.computing_id || !row.computing_id) return false;

  return (
    String(row.computing_id).toLowerCase() ===
    String(student.computing_id).toLowerCase()
  );
}

function isEndorsed(value) {
  if (value === true) return true;

  const text = String(value === null || value === undefined ? "" : value).toLowerCase();
  return text === "t" || text === "true";
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;

  const number = Number(value);
  return isNaN(number) ? null : number;
}

function formatStat(value) {
  if (value === null || value === undefined) return "—";

  return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(1);
}

export function contributionDates(stream) {
  return (stream || [])
    .filter((row) => !isUpdate(row.action))
    .map((row) => toDate(row.time))
    .filter((date) => date !== null);
}

export function contributionsOf(stream, student) {
  return (stream || [])
    .filter((row) => belongsTo(row, student) && !isUpdate(row.action))
    .map((row) => ({
      date: toDate(row.time),
      value: 1,
      series: contributionSeries(row.action),
    }))
    .filter((item) => item.date !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function endorsementsOf(stream, student) {
  return (stream || []).filter(
    (row) =>
      isEndorsed(row.endorsed) && belongsTo(row, student) && !isUpdate(row.action)
  ).length;
}

function classEndorsementAverage(stream, studentCount) {
  if (!stream || stream.length === 0 || studentCount === 0) return null;

  const endorsed = stream.filter(
    (row) => isEndorsed(row.endorsed) && !isUpdate(row.action)
  ).length;
  return endorsed / studentCount;
}

function statsFor(stats, student) {
  const row = (stats || []).find((entry) => belongsTo(entry, student));
  if (!row) return null;

  const totals = {};
  METRICS.forEach((metric) => {
    totals[metric.key] = toNumber(row[metric.key]);
  });

  return totals;
}

function classAverages(stats) {
  const rows = stats || [];
  const averages = { studentCount: rows.length };

  METRICS.forEach((metric) => {
    const values = rows
      .map((row) => toNumber(row[metric.key]))
      .filter((value) => value !== null);

    averages[metric.key] =
      values.length > 0
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : null;
  });

  return averages;
}

function seriesPresent(weeks) {
  return CONTRIBUTION_SERIES.filter((entry) =>
    weeks.some((week) => week.segments[entry.key] > 0)
  );
}

export function piazzaAnalytics(stats, stream, student, now = new Date()) {
  const span = weekSpan(contributionDates(stream), now);
  const classAverage = classAverages(stats);

  const hasStream = Boolean(stream && stream.length > 0);
  classAverage.endorsements = classEndorsementAverage(
    stream,
    classAverage.studentCount
  );

  if (!student)
    return {
      weeks: [],
      series: [],
      totals: null,
      contributions: 0,
      endorsements: null,
      weekCount: span === null ? 0 : span.weekCount,
      classAverage,
    };

  const contributions = contributionsOf(stream, student);

  const weeks = span === null ? [] : weeksFor(span, contributions);

  return {
    weeks,
    series: seriesPresent(weeks),
    totals: statsFor(stats, student),
    contributions: contributions.length,
    endorsements: hasStream ? endorsementsOf(stream, student) : null,
    weekCount: span === null ? 0 : span.weekCount,
    classAverage,
  };
}

function tooltip(week, series) {
  const total = `Week of ${week.label}: ${week.value} ${
    week.value === 1 ? "contribution" : "contributions"
  }`;

  const parts = series
    .filter((entry) => week.segments[entry.key] > 0)
    .map((entry) => `${week.segments[entry.key]} ${entry.label.toLowerCase()}`);

  return parts.length > 1 ? `${total} (${parts.join(", ")})` : total;
}

function StatsTable({ analytics }) {
  const totals = analytics.totals;
  const classAverage = analytics.classAverage;

  return (
    <table className="table table-sm mt-3 mb-0">
      <thead>
        <tr>
          <th>Piazza</th>
          <th>Student</th>
          <th>Class Average</th>
        </tr>
      </thead>
      <tbody className="table-group-divider">
        {METRICS.map((metric) => (
          <tr key={metric.key}>
            <td>{metric.label}</td>
            <td>{formatStat(totals === null ? null : totals[metric.key])}</td>
            <td className="text-muted">{formatStat(classAverage[metric.key])}</td>
          </tr>
        ))}
        <tr>
          <td>Instructor endorsements</td>
          <td>{formatStat(analytics.endorsements)}</td>
          <td className="text-muted">{formatStat(classAverage.endorsements)}</td>
        </tr>
      </tbody>
    </table>
  );
}

function PiazzaStats(props) {
  const analytics = useMemo(
    () => piazzaAnalytics(props.stats, props.stream, props.student),
    [props.stats, props.stream, props.student]
  );

  const body = () => {
    if (!props.loaded) return <h5 className="mb-0">Loading…</h5>;

    if (props.error) return <p className="alert alert-warning mb-0">{props.error}</p>;

    if (analytics.totals === null && analytics.weeks.length === 0)
      return (
        <h5 className="mb-0">
          No Piazza data has been uploaded for this course yet. Upload the Piazza
          course export on the External Tools page.
        </h5>
      );

    return (
      <>
        {analytics.weeks.length > 0 ? (
          <Timeline
            weeks={analytics.weeks}
            series={analytics.series}
            formatBar={(week) => String(week.value)}
            formatTooltip={(week) => tooltip(week, analytics.series)}
          />
        ) : (
          <p className="text-muted mb-0">
            No contribution history has been uploaded, so there is no weekly
            timeline. The totals below come from the Piazza statistics export.
          </p>
        )}

        <StatsTable analytics={analytics} />

        {analytics.totals === null && (
          <p className="text-muted mt-3 mb-0">
            This student has no row in the Piazza statistics export, so only the
            class average is shown.
          </p>
        )}
      </>
    );
  };

  return <CollapsibleCard title="Piazza">{body()}</CollapsibleCard>;
}

export default PiazzaStats;
