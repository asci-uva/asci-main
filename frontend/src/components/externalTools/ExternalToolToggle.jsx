import React, { useState } from "react";
import { toast } from "react-toastify";
import { errorMessage } from "../utils/errorMessage";

function ExternalToolToggle(props) {
  const { tool, label, enabled, loaded, error, canManage, onSave } = props;
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const next = e.target.checked;
    setSaving(true);
    onSave(tool, next)
      .then((data) => {
        setSaving(false);
        if (data.success === "true")
          toast.success(`${label} ${next ? "enabled" : "disabled"} for this course`);
        else {
          console.log(data.error);
          toast.error(errorMessage(data.error, `Failed to ${next ? "enable" : "disable"} ${label}`));
        }
      })
      .catch((e) => {
        console.log(e);
        setSaving(false);
        toast.error(errorMessage(e, `Failed to ${next ? "enable" : "disable"} ${label}`));
      });
  };

  if (!loaded)
    return <p className="text-muted mb-3">Loading…</p>;

  if (error)
    return <p className="text-muted mb-3">Could not load the {label} settings.</p>;

  return (
    <div className="mb-3">
      <div className="form-check form-switch">
        <input
          className="form-check-input"
          type="checkbox"
          role="switch"
          id={`enable-${tool}-switch`}
          checked={enabled}
          disabled={!canManage || saving}
          onChange={handleChange}
        />
        <label className="form-check-label" htmlFor={`enable-${tool}-switch`}>
          Enable {label} for this course
        </label>
      </div>
      <p className="text-muted small mb-0">
        {!canManage && " Only an instructor can change this."}
      </p>
    </div>
  );
}

export default ExternalToolToggle;
