import React from "react";

// Bars and their date labels are separate flex rows, so both have to lay out on
// this exact width or the labels drift out from under the bars they belong to.
export const COLUMN_WIDTH = 72;

// Bars that are not broken down by category are stacked as a single series.
export const DEFAULT_SERIES = "value";
const DEFAULT_COLOR = "#1baf7a";

export function toDate(value) {
  if (!value) return null;

  const date = new Date(String(value).replace(" ", "T"));
  return isNaN(date.getTime()) ? null : date;
}

export function weekStart(date) {
  const start = new Date(date.getTime());
  start.setHours(0, 0, 0, 0);
  // Monday starts the week; getDay() counts Sunday as 0.
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));

  return start;
}

// Weeks are stepped by calendar date rather than by adding 604800 seconds, so
// that a daylight saving change cannot push a date into the previous bucket.
export function addWeek(date) {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + 7);

  return next;
}

export function weekLabel(date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/*
 * The span every student in the course is charted against: the first week
 * anything happened through the current week. Keeping it course-wide rather
 * than per student is what makes two students comparable at a glance.
 */
export function weekSpan(dates, now) {
  if (dates.length === 0) return null;

  const times = dates.map((date) => date.getTime());
  const firstWeek = weekStart(new Date(Math.min(...times)));
  const lastWeek = weekStart(new Date(Math.max(Math.max(...times), now.getTime())));

  let weekCount = 0;
  for (let start = firstWeek; start <= lastWeek; start = addWeek(start)) weekCount += 1;

  return { firstWeek, lastWeek, weekCount };
}

export function weeksFor(span, items) {
  const weeks = [];
  const index = {};

  for (let start = span.firstWeek; start <= span.lastWeek; start = addWeek(start)) {
    index[start.getTime()] = weeks.length;
    weeks.push({
      key: start.getTime(),
      label: weekLabel(start),
      value: 0,
      count: 0,
      segments: {},
    });
  }

  items.forEach((item) => {
    const week = weeks[index[weekStart(item.date).getTime()]];
    if (week === undefined) return;

    const series = item.series || DEFAULT_SERIES;

    week.value += item.value;
    week.count += 1;
    week.segments[series] = (week.segments[series] || 0) + item.value;
  });

  return weeks;
}

export function Legend({ series }) {
  return (
    <div className="d-flex flex-wrap mb-2">
      {series.map((entry) => (
        <div key={entry.key} className="d-flex align-items-center me-3">
          <span
            style={{
              backgroundColor: entry.color,
              display: "inline-block",
              width: 12 + "px",
              height: 12 + "px",
              borderRadius: 2 + "px",
              marginRight: 6 + "px",
            }}
          />
          <span className="text-muted" style={{ fontSize: 0.8 + "rem" }}>
            {entry.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Timeline({ weeks, series, formatBar, formatTooltip }) {
  const peak = weeks.reduce((highest, week) => Math.max(highest, week.value), 0);
  const scale = peak > 0 ? peak : 1;
  const categorised = series !== undefined && series.length > 0;
  const stack = categorised
    ? series
    : [{ key: DEFAULT_SERIES, label: "", color: DEFAULT_COLOR }];

  return (
    <>
      {categorised && <Legend series={stack} />}

      <div className="overflow-auto pb-2">
        <div
          className="d-flex align-items-end"
          style={{ height: 200 + "px", width: "max-content" }}
        >
          {weeks.map((week) => (
            <div
              key={week.key}
              className="d-flex flex-column justify-content-end align-items-center h-100"
              style={{ width: COLUMN_WIDTH + "px", flexShrink: 0 }}
              title={formatTooltip(week)}
            >
              <div className="text-muted" style={{ fontSize: 0.75 + "rem" }}>
                {week.value > 0 ? formatBar(week) : ""}
              </div>
              <div
                className="d-flex flex-column-reverse"
                style={{
                  backgroundColor: week.value > 0 ? "transparent" : "#e9ecef",
                  width: 28 + "px",
                  height: `${Math.max((week.value / scale) * 100, 2)}%`,
                  borderRadius: 2 + "px",
                  overflow: "hidden",
                }}
              >
                {stack.map((entry) =>
                  week.segments[entry.key] > 0 ? (
                    <div
                      key={entry.key}
                      style={{
                        flexGrow: week.segments[entry.key],
                        backgroundColor: entry.color,
                      }}
                    />
                  ) : null
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="d-flex border-top pt-1" style={{ width: "max-content" }}>
          {weeks.map((week) => (
            <div
              key={week.key}
              className="text-center text-muted"
              style={{
                width: COLUMN_WIDTH + "px",
                flexShrink: 0,
                fontSize: 0.75 + "rem",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {week.label}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
