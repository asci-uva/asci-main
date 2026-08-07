import React from "react";

function CanvasTokenExpiredWarning({ canvasLmsCourse }) {
  const courseSuffix = canvasLmsCourse
    ? ` This course is still linked to Canvas LMS course ${canvasLmsCourse.course_code} ${canvasLmsCourse.name}.`
    : "";

  return (
    <div className="alert alert-warning d-flex justify-content-between align-items-center mb-3">
      <span>
        The primary instructor's Canvas access token has expired or is no longer valid. Canvas-synced features are disabled until the primary instructor re-adds a valid access token.{courseSuffix}
      </span>
    </div>
  );
}

export default CanvasTokenExpiredWarning;
