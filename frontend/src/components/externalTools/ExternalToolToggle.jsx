import React from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../context/UserContext";
import { isPrimaryInstructor } from "../utils/roles";

function ExternalToolToggle({ tool }) {
  const { getCourse, getCourseExternalTools, setCourseExternalTool } = useUser();
  const course = getCourse();
  const externalTools = getCourseExternalTools();
  const enabled = externalTools?.[tool.key]?.enabled ?? false;
  const canToggle = course && isPrimaryInstructor(course.role);
  const inputId = `external-tool-toggle-${tool.key}`;

  const handleToggle = (checked) => {
    setCourseExternalTool(tool.key, checked, (success, error) => {
      if (success) {
        toast.success(
          `${tool.label} ${checked ? "enabled" : "disabled"} for this course.`
        );
      } else {
        toast.error(
          `Could not update ${tool.label}` +
          (error ? `: ${typeof error === "string" ? error : error.message}` : "")
        );
      }
    });
  };

  return (
    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
      <div className="form-check form-switch mb-0">
        <input
          className="form-check-input"
          type="checkbox"
          role="switch"
          id={inputId}
          checked={enabled}
          disabled={!canToggle}
          onChange={(e) => handleToggle(e.target.checked)}
        />
        <label className="form-check-label" htmlFor={inputId}>
          <b>{tool.label}</b> is {enabled ? "enabled" : "disabled"} for this course.
        </label>
      </div>
      {!canToggle && (
        <small className="text-muted">
          Only the primary instructor can enable or disable this tool.
        </small>
      )}
    </div>
  );
}

export default ExternalToolToggle;
