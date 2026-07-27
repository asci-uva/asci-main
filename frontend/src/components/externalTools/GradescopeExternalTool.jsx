import React from "react";
import { useUser } from "../context/UserContext";
import { isInstructorRole } from "../utils/roles";
import { TOOLS } from "../utils/externalTools";
import ExternalToolToggle from "./ExternalToolToggle";
import GradescopeSync from "../admin/GradescopeSync";

const GRADESCOPE_TOOL = TOOLS.find((tool) => tool.key === "gradescope");

const GradescopeExternalTool = (props) => {
  const { getCourse, getCourseExternalTools } = useUser();
  const course = getCourse();
  const isInstructor = isInstructorRole(course.role);
  const enabled = getCourseExternalTools()?.gradescope?.enabled ?? false;

  return (
    <>
      <ExternalToolToggle tool={GRADESCOPE_TOOL} />

      {!enabled ? (
        <p className="text-muted mb-0">
          Enable Gradescope to connect this course to Gradescope.
        </p>
      ) : isInstructor ? (
        <GradescopeSync {...props} />
      ) : (
        <div className="alert alert-info mb-0">
          Gradescope setup is managed by the course instructors.
        </div>
      )}
    </>
  );
};

export default GradescopeExternalTool;
