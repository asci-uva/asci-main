import React from "react";

function CanvasLinkWarning({ canvasLmsCourse, message }) {
  if (!canvasLmsCourse) return null;

  return (
    <div className="alert alert-warning d-flex justify-content-between align-items-center mb-3">
      <span>
        This course is still linked to Canvas LMS course {canvasLmsCourse.course_code} {canvasLmsCourse.name}{message}
      </span>
    </div>
  );
}

export default CanvasLinkWarning;
