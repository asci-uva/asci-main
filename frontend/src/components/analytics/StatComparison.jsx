import React, { useEffect, useMemo, useState } from "react";
import CollapsibleCard from "./CollapsibleCard";
import c3 from "c3";
import "c3/c3.css";
import { toDate, weekSpan, weekStart, weeksFor } from "./activityTimeline";
import { courseVisitDates, visitsOf } from "./OfficeHoursStats";
import { contributionDates, contributionsOf } from "./PiazzaStats";
import { studentSubmissionAnalytics } from "./studentAnalytics";

export const SOURCES = [
  {
    key: "officeHours",
    label: "Office Hours",
    history: "office hour",
    color: "#1baf7a",
    metrics: [
      {
        key: "visits",
        label: "Visits per week",
        series: "Office hour visits",
        axis: "y",
        format: (value) => `${value} ${value === 1 ? "visit" : "visits"}`,
      },
      {
        key: "hours",
        label: "Hours per week",
        series: "Hours in office hours",
        axis: "y",
        format: (value) => `${value.toFixed(1)} h`,
      },
    ],
  },
  {
    key: "piazza",
    label: "Piazza",
    history: "Piazza",
    color: "#3d7dd8",
    metrics: [
      {
        key: "contributions",
        label: "Contributions",
        series: "Piazza contributions",
        axis: "y",
        format: (value) =>
          `${value} ${value === 1 ? "contribution" : "contributions"}`,
      },
      {
        key: "questions",
        label: "Questions asked",
        series: "Piazza questions asked",
        axis: "y",
        format: (value) => `${value} ${value === 1 ? "question" : "questions"}`,
      },
      {
        key: "answers",
        label: "Answers given",
        series: "Piazza answers given",
        axis: "y",
        format: (value) => `${value} ${value === 1 ? "answer" : "answers"}`,
      },
    ],
  },
  {
    key: "grade",
    label: "Assignment Grade",
    history: "graded assignment",
    color: "#7a5bd8",
    metrics: [
      {
        key: "average",
        label: "Running average",
        series: "Average assignment grade",
        axis: "y2",
        format: (value) => `${value.toFixed(1)}%`,
      },
    ],
  },
];

const DEFAULT_METRICS = {
  officeHours: "visits",
  piazza: "contributions",
  grade: "average",
};

function historyList(sources) {
  const names = sources.map((source) => source.history);

  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} or ${names[1]}`;

  return `${names.slice(0, -1).join(", ")}, or ${names[names.length - 1]}`;
}

function metricFor(source, metrics) {
  return (
    source.metrics.find((metric) => metric.key === metrics[source.key]) ||
    source.metrics[0]
  );
}

function assignmentDueDates(assignments) {
  return (assignments || [])
    .map((assignment) => toDate(assignment.due_at))
    .filter((date) => date !== null);
}

function submissionDates(submissions) {
  return (submissions || [])
    .map((submission) => toDate(submission.submitted_at))
    .filter((date) => date !== null);
}

function markedAt(row, span) {
  return toDate(row.dueAt) || toDate(row.submittedAt) || span.lastWeek;
}

function gradeAverages(span, rows) {
  const graded = {};
  let undated = 0;

  rows.forEach((row) => {
    if (row.percent === null) return;

    if (toDate(row.dueAt) === null && toDate(row.submittedAt) === null) undated += 1;

    const week = weekStart(markedAt(row, span)).getTime();
    if (!graded[week]) graded[week] = { total: 0, count: 0 };

    graded[week].total += row.percent;
    graded[week].count += 1;
  });

  let total = 0;
  let count = 0;

  const values = weeksFor(span, []).map((week) => {
    const marks = graded[week.key];
    if (marks) {
      total += marks.total;
      count += marks.count;
    }

    return count > 0 ? total / count : null;
  });

  return { values, undated };
}

function hasCount(values) {
  return values.some((value) => value > 0);
}

export function statComparisonAnalytics(data, student, now = new Date()) {
  const sessions = data.sessions;
  const stream = data.stream;
  const assignments = data.assignments;

  const span = weekSpan(
    courseVisitDates(sessions)
      .concat(contributionDates(stream))
      .concat(assignmentDueDates(assignments))
      .concat(submissionDates(data.submissions))
      .filter((date) => date <= now),
    now
  );

  const empty = {
    labels: [],
    values: {},
    available: { officeHours: false, piazza: false, grade: false },
    gradeUndated: 0,
    weekCount: span === null ? 0 : span.weekCount,
  };

  if (span === null || !student) return empty;

  const submissions = studentSubmissionAnalytics(
    assignments,
    data.submissions,
    student,
    now
  );

  const officeHours = weeksFor(span, visitsOf(sessions, student));
  const piazza = weeksFor(span, contributionsOf(stream, student));
  const grade = gradeAverages(span, submissions.assignments);

  const values = {
    "officeHours.visits": officeHours.map((week) => week.count),
    "officeHours.hours": officeHours.map((week) => week.value / 3600),
    "piazza.contributions": piazza.map((week) => week.count),
    "piazza.questions": piazza.map((week) => week.segments.questions || 0),
    "piazza.answers": piazza.map((week) => week.segments.answers || 0),
    "grade.average": grade.values,
  };

  return {
    labels: officeHours.map((week) => week.label),
    values,
    available: {
      officeHours: hasCount(values["officeHours.visits"]),
      piazza: hasCount(values["piazza.contributions"]),
      grade: values["grade.average"].some((value) => value !== null),
    },
    gradeUndated: grade.undated,
    weekCount: span.weekCount,
  };
}

export function chartSeries(analytics, enabled, metrics, sources = SOURCES) {
  const series = [];

  sources.forEach((source) => {
    if (!enabled[source.key] || !analytics.available[source.key]) return;

    const metric = metricFor(source, metrics);

    series.push({
      id: metric.series,
      color: source.color,
      axis: metric.axis,
      format: metric.format,
      values: analytics.values[`${source.key}.${metric.key}`],
    });
  });

  return series;
}

function Toggles({ sources, analytics, enabled, metrics, onToggle, onMetric }) {
  return (
    <div className="d-flex flex-wrap mb-3">
      {sources.map((source) => {
        const available = analytics.available[source.key];

        return (
          <div key={source.key} className="d-flex align-items-center me-4 mb-2">
            <div className="form-check form-switch mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id={`stat-comparison-${source.key}`}
                checked={enabled[source.key] && available}
                disabled={!available}
                onChange={(event) => onToggle(source.key, event.target.checked)}
              />
              <label
                className="form-check-label"
                htmlFor={`stat-comparison-${source.key}`}
              >
                <span
                  style={{
                    backgroundColor: available ? source.color : "#e9ecef",
                    display: "inline-block",
                    width: 12 + "px",
                    height: 12 + "px",
                    borderRadius: 2 + "px",
                    marginRight: 8 + "px",
                  }}
                />
                {source.label}
              </label>
            </div>

            {source.metrics.length > 1 && (
              <select
                className="form-select form-select-sm ms-2"
                style={{ width: "auto" }}
                value={metrics[source.key]}
                disabled={!available || !enabled[source.key]}
                aria-label={`${source.label} metric`}
                onChange={(event) => onMetric(source.key, event.target.value)}
              >
                {source.metrics.map((metric) => (
                  <option key={metric.key} value={metric.key}>
                    {metric.label}
                  </option>
                ))}
              </select>
            )}

            {!available && (
              <span className="text-muted ms-2" style={{ fontSize: 0.8 + "rem" }}>
                no data
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatComparison(props) {
  const [chartNode, setChartNode] = useState(null);
  const [enabled, setEnabled] = useState({
    officeHours: true,
    piazza: true,
    grade: true,
  });
  const [metrics, setMetrics] = useState(DEFAULT_METRICS);

  const analytics = useMemo(
    () =>
      statComparisonAnalytics(
        {
          sessions: props.sessions,
          stream: props.stream,
          assignments: props.assignments,
          submissions: props.submissions,
        },
        props.student
      ),
    [props.sessions, props.stream, props.assignments, props.submissions, props.student]
  );
  
  const sources = useMemo(
    () =>
      SOURCES.filter((source) => {
        if (source.key === "piazza") return props.piazzaEnabled !== false;
        if (source.key === "grade") return props.canvasEnabled !== false;
        return true;
      }),
    [props.piazzaEnabled, props.canvasEnabled]
  );

  const series = useMemo(
    () => chartSeries(analytics, enabled, metrics, sources),
    [analytics, enabled, metrics, sources]
  );

  const anyAvailable = sources.some((source) => analytics.available[source.key]);

  useEffect(() => {
    if (chartNode === null || series.length === 0) return;

    const formats = {};
    series.forEach((entry) => {
      formats[entry.id] = entry.format;
    });

    const chart = c3.generate({
      bindto: chartNode,
      size: { height: 320 },
      data: {
        columns: series.map((entry) => [entry.id].concat(entry.values)),
        type: "line",
        colors: series.reduce((colors, entry) => {
          colors[entry.id] = entry.color;
          return colors;
        }, {}),
        axes: series.reduce((axes, entry) => {
          axes[entry.id] = entry.axis;
          return axes;
        }, {}),
      },
      axis: {
        x: {
          type: "category",
          categories: analytics.labels,
          tick: { culling: { max: 12 }, multiline: false },
        },
        y: {
          min: 0,
          padding: { bottom: 0 },
          label: { text: "Per week", position: "outer-middle" },
        },
        y2: {
          show: series.some((entry) => entry.axis === "y2"),
          min: 0,
          max: 100,
          padding: { top: 0, bottom: 0 },
          label: { text: "Grade (%)", position: "outer-middle" },
        },
      },
      point: { r: 3 },
      line: { connectNull: false },
      grid: { y: { show: true } },
      tooltip: {
        format: {
          title: (index) => `Week of ${analytics.labels[index]}`,
          value: (value, ratio, id) => formats[id](value),
        },
      },
    });

    return () => chart.destroy();
  }, [chartNode, series, analytics.labels]);

  const body = () => {
    if (!props.loaded) return <h5 className="mb-0">Loading…</h5>;

    if (!anyAvailable)
      return (
        <h5 className="mb-0">
          There is no {historyList(sources)} history for this student to compare.
        </h5>
      );

    return (
      <>
        <Toggles
          sources={sources}
          analytics={analytics}
          enabled={enabled}
          metrics={metrics}
          onToggle={(key, checked) =>
            setEnabled((current) => ({ ...current, [key]: checked }))
          }
          onMetric={(key, value) =>
            setMetrics((current) => ({ ...current, [key]: value }))
          }
        />

        {series.length > 0 ? (
          <div ref={setChartNode}></div>
        ) : (
          <p className="text-muted mb-0">
            Turn on a statistic above to graph it.
          </p>
        )}
      </>
    );
  };

  return <CollapsibleCard title="Compare Statistics">{body()}</CollapsibleCard>;
}

export default StatComparison;
