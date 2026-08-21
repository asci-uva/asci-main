import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import { useCanvasLmsCourse } from "../utils/useCanvasLmsCourse";
import { useExternalTools } from "../utils/useExternalTools";
import { isInstructorRole, isStaffRole } from "../utils/roles";
import Quests from "./Quests";
import Assignments from "./Assignments";
import StudentPoints from "./StudentPoints";

function Home(props) {
  const { getCourse, getCourseSettings } = useUser();
  const course = getCourse();
  const courseId = course.course_id;
  const isStaff = isStaffRole(course.role);

  const settings = getCourseSettings();
  const showQuests = settings != null && settings.show_quests == "t";

  const {
    course: canvasLmsCourse,
    loaded: canvasLmsCourseLoaded,
  } = useCanvasLmsCourse(props.url, courseId, isStaff);

  const { tools: externalTools } = useExternalTools(props.url, courseId, isStaff);
  const gradescopeEnabled = externalTools.gradescope === true;

  const [sidebarOpen, setSidebarOpen] = useState("sidebar-visible");
  const [sidebarCol, setSidebarCol] = useState("col-md-3");
  const [contentCol, setContentCol] = useState("page-container content col-md-9 my-auto");

  const tabs = [];

  if (isInstructorRole(course.role)) {
    tabs.push({
      key: "assignments",
      label: "Assignments",
      content: (
        <Assignments
          course_id={courseId}
          canvasLmsCourse={canvasLmsCourse}
          canvasLmsCourseLoaded={canvasLmsCourseLoaded}
          gradescopeEnabled={gradescopeEnabled}
          {...props}
        />
      ),
    });
    if (showQuests)
      tabs.push({ key: "quests", label: "Quests", content: <Quests {...props} /> });
  }

  if (isStaff && showQuests)
    tabs.push({
      key: "points",
      label: "Student Points",
      content: <StudentPoints {...props} />,
    });

  const handleCollapse = () => {
    if (sidebarOpen === "sidebar-visible") {
      setSidebarCol("col-md-1");
      setContentCol("page-container content col-md-11");
      setSidebarOpen("sidebar-hidden");
    } else {
      setSidebarCol("col-md-3");
      setContentCol("page-container content col-md-9 my-auto");
      setSidebarOpen("sidebar-visible");
    }
  };

  return (
    <>
      <div className="container-fluid page-width">
        <div className="row g-0">
          <div className={sidebarCol}>
            <div className="sidebar">
              <div className={sidebarOpen}>
                <h1><i className="bi-clipboard-check big-icon"></i></h1>
                <h2>Assessments</h2>
                <p>
                  {showQuests
                    ? "Manage the assignments and quests students work on in this course, and the points they have earned."
                    : "Manage the assignments students work on in this course."}
                </p>
              </div>
              <button type="button" className="sidebar-button" onClick={handleCollapse}><i className="bi-arrows-collapse-vertical"></i></button>
            </div>
          </div>

          <div className={contentCol}>
            <h3 className="mb-3">Course: {course.mnemonic} {course.number} - {course.name} ({course.semester})</h3>

            <div className="card">
              <div className="card-header">
                <ul className="nav nav-tabs card-header-tabs" id="assessments-tab" role="tablist">
                  {tabs.map((tab, idx) => (
                    <li className="nav-item" role="presentation" key={tab.key}>
                      <button
                        className={`nav-link ${idx === 0 ? "active" : ""}`}
                        id={`assessments-${tab.key}-tab`}
                        data-bs-toggle="pill"
                        data-bs-target={`#assessments-${tab.key}`}
                        type="button"
                        role="tab"
                        aria-controls={`assessments-${tab.key}`}
                        aria-selected={idx === 0}
                      >
                        {tab.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="tab-content card-body" id="assessments-tabContent">
                {tabs.map((tab, idx) => (
                  <div
                    className={`tab-pane fade ${idx === 0 ? "show active" : ""}`}
                    id={`assessments-${tab.key}`}
                    role="tabpanel"
                    aria-labelledby={`assessments-${tab.key}-tab`}
                    key={tab.key}
                  >
                    <div className="col-md-12 my-auto">{tab.content}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
