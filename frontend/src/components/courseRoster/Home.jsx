import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import { useCanvasSyncSettings } from "../utils/useCanvasSyncSettings";
import { useCanvasTokenStatus } from "../utils/useCanvasTokenStatus";
import { useCanvasLmsCourse } from "../utils/useCanvasLmsCourse";
import { isStaffRole } from "../utils/roles";
import ViewRoster from "./ViewRoster";
import UploadRoster from "./UploadRoster";
import AddStudent from "./AddStudent";

function Home(props) {
  const { getCourse } = useUser();
  const course = getCourse();
  const courseId = course.course_id;
  const isStaff = isStaffRole(course.role);

  const [sidebarOpen, setSidebarOpen] = useState("sidebar-visible");
  const [sidebarCol, setSidebarCol] = useState("col-md-3");
  const [contentCol, setContentCol] = useState("page-container content col-md-9 my-auto");

  const {
    status: canvasTokenStatus,
    loaded: canvasTokenStatusLoaded,
  } = useCanvasTokenStatus(props.url, courseId, isStaff);

  const {
    course: canvasLmsCourse,
    loaded: canvasLmsCourseLoaded,
  } = useCanvasLmsCourse(props.url, courseId, isStaff);

  const {
    settings: canvasSyncSettings,
    setSettings: setCanvasSyncSettings,
    refresh: refreshCanvasSyncSettings,
  } = useCanvasSyncSettings(
    props.url,
    courseId,
    canvasLmsCourse !== null && isStaff
  );

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
                <h1><i className="bi-people-fill big-icon"></i></h1>
                <h2>Course Roster</h2>
                <p>
                  View who is enrolled in this course, and add or replace people
                  on the roster.
                </p>
              </div>
              <button type="button" className="sidebar-button" onClick={handleCollapse}><i className="bi-arrows-collapse-vertical"></i></button>
            </div>
          </div>

          <div className={contentCol}>
            <h3 className="mb-3">Course: {course.mnemonic} {course.number} - {course.name} ({course.semester})</h3>

            <div className="card">
              <div className="card-header">
                <ul className="nav nav-tabs card-header-tabs" id="course-roster-tab" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button
                      className="nav-link active"
                      id="roster-view-tab"
                      data-bs-toggle="pill"
                      data-bs-target="#roster-view"
                      type="button"
                      role="tab"
                      aria-controls="roster-view"
                      aria-selected="true"
                    >
                      View Roster
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className="nav-link"
                      id="roster-update-tab"
                      data-bs-toggle="pill"
                      data-bs-target="#roster-update"
                      type="button"
                      role="tab"
                      aria-controls="roster-update"
                      aria-selected="false"
                    >
                      Update Roster
                    </button>
                  </li>
                </ul>
              </div>

              <div className="tab-content card-body" id="course-roster-tabContent">
                <div className="tab-pane fade show active" id="roster-view" role="tabpanel" aria-labelledby="roster-view-tab">
                  <div className="col-md-12 my-auto mb-2">
                    <ViewRoster course_id={courseId} {...props} />
                  </div>
                </div>

                <div className="tab-pane fade" id="roster-update" role="tabpanel" aria-labelledby="roster-update-tab">
                  <div className="col-md-12 my-auto mb-2">
                    <UploadRoster
                      course_id={courseId}
                      canvasTokenStatus={canvasTokenStatus}
                      canvasTokenStatusLoaded={canvasTokenStatusLoaded}
                      canvasLmsCourse={canvasLmsCourse}
                      canvasLmsCourseLoaded={canvasLmsCourseLoaded}
                      canvasSyncSettings={canvasSyncSettings}
                      setCanvasSyncSettings={setCanvasSyncSettings}
                      refreshCanvasSyncSettings={refreshCanvasSyncSettings}
                      {...props}
                    />
                  </div>
                  <div className="col-md-12 my-auto">
                    <AddStudent
                      course_id={courseId}
                      canvasTokenStatus={canvasTokenStatus}
                      canvasTokenStatusLoaded={canvasTokenStatusLoaded}
                      canvasLmsCourse={canvasLmsCourse}
                      canvasLmsCourseLoaded={canvasLmsCourseLoaded}
                      {...props}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
