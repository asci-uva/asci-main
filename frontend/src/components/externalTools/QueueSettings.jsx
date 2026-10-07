import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useUser } from "../context/UserContext";
import { postCommand } from "../utils/postCommand";
import { errorMessage } from "../utils/errorMessage";

const SWITCHES = [
  {
    setting: "show_queue_list",
    title: "Show Full Queue",
    description: "Entire queue will be shown to teaching assistants",
  },
  {
    setting: "grouping_enabled",
    title: "Enable Groups",
    description: "Allow students to be helped in groups",
  },
  {
    setting: "smart_grouping",
    title: "Enable Smart Grouping",
    description: "Recommended student groups will be presented to TAs based on student issues",
  },
];

const fromSettings = (courseSettings) =>
  Object.fromEntries(SWITCHES.map(({ setting }) => [setting, courseSettings?.[setting] === "t"]));

function QueueSettings(props) {
  const { user, courseSettings, setCourseSettings } = useUser();
  const [values, setValues] = useState(() => fromSettings(courseSettings));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues(fromSettings(courseSettings));
  }, [courseSettings]);

  const handleSave = () => {
    setSaving(true);
    postCommand(props.url, {
      command: "setCourseSettings",
      user: user.userid,
      courseId: props.course_id,
      settings: { course_id: props.course_id, ...values },
    })
      .then((data) => {
        setSaving(false);
        if (data.success === "true") {
          setCourseSettings(data.settings);
          toast.success("Queue settings saved");
        } else {
          console.log(data.error);
          toast.error(errorMessage(data.error, "Failed to save Queue settings"));
        }
      })
      .catch((e) => {
        console.log(e);
        setSaving(false);
        toast.error(errorMessage(e, "Failed to save Queue settings"));
      });
  };

  return (
    <>
      {SWITCHES.map(({ setting, title, description }) => (
        <div className="form-check form-switch mb-3" key={setting}>
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            id={`queue-${setting}`}
            checked={values[setting]}
            onChange={(e) => setValues((prev) => ({ ...prev, [setting]: e.target.checked }))}
          />
          <label className="form-check-label" htmlFor={`queue-${setting}`}>
            <b>{title}: </b>{description}
          </label>
        </div>
      ))}
      <button type="button" className="btn btn-primary mb-3" disabled={saving} onClick={handleSave}>
        Save Queue Settings
      </button>
    </>
  );
}

export default QueueSettings;
