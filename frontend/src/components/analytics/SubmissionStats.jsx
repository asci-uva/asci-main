import React, { useEffect, useMemo, useRef } from "react";
import c3 from "c3";
import "c3/c3.css";
import { studentSubmissionAnalytics } from "./studentAnalytics";

const SLICE_COLORS = {
  "On Time": "#1baf7a",
  Late: "#eda100",
  Missing: "#d03b3b",
};

function formatPercent(value) {
  if (value === null || value === undefined) return "—";

  return `${value.toFixed(1)}%`;
}

function share(count, total) {
  if (!total) return "—";

  return `${Math.round((count / total) * 100)}%`;
}

const DURATION_UNITS = [
  ["d", 86400],
  ["h", 3600],
  ["m", 60],
  ["s", 1],
];

function formatTardiness(seconds) {
  if (seconds === null || seconds === undefined) return "—";

  let rest = Math.round(seconds);
  if (rest <= 0) return "None";

  const parts = [];
  DURATION_UNITS.forEach(([label, size]) => {
    const value = Math.floor(rest / size);
    rest -= value * size;
    if (value > 0) parts.push(`${value}${label}`);
  });

  return parts.slice(0, 2).join(" ");
}

function averageCoverage({ scoredCount, missingScoredCount }) {
  if (scoredCount === 0) return "nothing graded yet";

  const across = `across ${scoredCount} ${
    scoredCount === 1 ? "assignment" : "assignments"
  }`;

  if (missingScoredCount === 0) return across;

  return `${across}, ${missingScoredCount} missing`;
}

function AverageGrade({ analytics }) {
  return (
    <div className="mb-3">
      <div className="text-muted">Average Assignment Grade</div>
      <div style={{ fontSize: 2.5 + "rem", lineHeight: 1.1 }}>
        {formatPercent(analytics.averagePercent)}
      </div>
      <div className="text-muted">{averageCoverage(analytics)}</div>
    </div>
  );
}

function BreakdownTable({ analytics }) {
  const rows = [
    { label: "On Time", count: analytics.onTime },
    { label: "Late", count: analytics.late },
    { label: "Missing", count: analytics.missing },
  ];

  return (
    <table className="table table-sm mb-0">
      <thead>
        <tr>
          <th>Submissions</th>
          <th>Count</th>
          <th>Share</th>
        </tr>
      </thead>
      <tbody className="table-group-divider">
        {rows.map((row) => (
          <tr key={row.label}>
            <td>
              <span
                style={{
                  backgroundColor: SLICE_COLORS[row.label],
                  display: "inline-block",
                  width: 12 + "px",
                  height: 12 + "px",
                  borderRadius: 2 + "px",
                  marginRight: 8 + "px",
                }}
              />
              {row.label}
            </td>
            <td>{row.count}</td>
            <td>{share(row.count, analytics.totalDue)}</td>
          </tr>
        ))}
        <tr>
          <td>
            <b>Assignments due so far</b>
          </td>
          <td colSpan="2">
            <b>{analytics.totalDue}</b>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function TardinessStats({ analytics }) {
  const rows = [
    { label: "Mean", value: analytics.tardinessMeanSeconds },
    { label: "Median", value: analytics.tardinessMedianSeconds },
    { label: "Total", value: analytics.tardinessTotalSeconds },
  ];

  return (
    <table className="table table-sm mt-3 mb-0">
      <thead>
        <tr>
          <th>Tardiness</th>
          <th>Time late</th>
        </tr>
      </thead>
      <tbody className="table-group-divider">
        {rows.map((row) => (
          <tr key={row.label}>
            <td>{row.label}</td>
            <td>{formatTardiness(row.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SubmissionStats(props) {
  const chartRef = useRef(null);

  const analytics = useMemo(
    () =>
      studentSubmissionAnalytics(props.assignments, props.submissions, props.student),
    [props.assignments, props.submissions, props.student]
  );

  const hasData = props.student !== null && analytics.totalDue > 0;

  useEffect(() => {
    if (!hasData || chartRef.current === null) return;

    const chart = c3.generate({
      bindto: chartRef.current,
      data: {
        columns: [
          ["On Time", analytics.onTime],
          ["Late", analytics.late],
          ["Missing", analytics.missing],
        ],
        type: "pie",
        colors: SLICE_COLORS,
        order: null,
      },
      pie: {
        label: {
          format: (value, ratio) => (ratio < 0.05 ? "" : value),
        },
      },
      tooltip: {
        format: {
          value: (value, ratio) => `${value} (${Math.round(ratio * 100)}%)`,
        },
      },
    });

    return () => chart.destroy();
  }, [hasData, analytics.onTime, analytics.late, analytics.missing]);

  const body = () => {
    if (props.student === null)
      return (
        <p className="text-muted mb-0">
          Search for a student above to see their submission breakdown.
        </p>
      );

    if (!props.loaded) return <h5 className="mb-0">Loading…</h5>;

    if (props.canvasLmsCourse === null)
      return (
        <h5 className="mb-0">
          This course is not linked to a Canvas LMS course, so there are no
          assignments to report on. Link it on the External Tools page.
        </h5>
      );

    if (props.error) return <p className="alert alert-warning mb-0">{props.error}</p>;

    if (!hasData)
      return (
        <h5 className="mb-0">
          No assignments have come due for this student yet.
          {analytics.notYetDue > 0 &&
            ` ${analytics.notYetDue} ${
              analytics.notYetDue === 1 ? "assignment is" : "assignments are"
            } not due yet.`}
        </h5>
      );

    return (
      <>
        <div className="row">
          <div className="col-md-7">
            <div className="analytics-pie" ref={chartRef}></div>
          </div>
          <div className="col-md-5">
            <AverageGrade analytics={analytics} />
            <BreakdownTable analytics={analytics} />
            <TardinessStats analytics={analytics} />
          </div>
        </div>

        {analytics.notYetDue > 0 && (
          <p className="text-muted mt-3 mb-0">
            {analytics.notYetDue}{" "}
            {analytics.notYetDue === 1 ? "assignment is" : "assignments are"} not due
            yet and {analytics.notYetDue === 1 ? "is" : "are"} left out of the counts
            above.
          </p>
        )}
      </>
    );
  };

  return (
    <div className="card mb-4">
      <h4 className="card-header">Assignment Submissions</h4>
      <div className="card-body">{body()}</div>
    </div>
  );
}

export default SubmissionStats;
