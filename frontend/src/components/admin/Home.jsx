import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import UploadRoster from "./UploadRoster";
import AddStudent from "./AddStudent";
import CanvasLmsSync from "./CanvasLmsSync";
import GradescopeSync from "./GradescopeSync";
import EditCourseInfo from "./EditCourseInfo";
import EditCourseSettings from "./EditCourseSettings";
import CreateNewCourse from "./CreateNewCourse";
import ViewRoster from "./ViewRoster";
import UpdateChat from "./UpdateChat";
import CurrentCourseContent from "./CurrentCourseContent";
import ViewQuests from "./ViewQuests";
import { postCommand } from "../utils/postCommand";
import { useCanvasSyncSettings } from "../utils/useCanvasSyncSettings";
import { useCanvasTokenStatus } from "../utils/useCanvasTokenStatus";
import { isStaffRole } from "../utils/roles";
import CanvasLinkWarning from "./CanvasLinkWarning";
import CanvasTokenExpiredWarning from "./CanvasTokenExpiredWarning";

function Home(props) {
  let docRoot = props.documentRoot;
  const { user, courseList, course, getCourse } = useUser();
  const [refresh, setRefresh] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState("sidebar-visible");
  const [sidebarCol, setSidebarCol] = useState("col-md-3");
  const [contentCol, setContentCol] = useState("page-container content col-md-9 my-auto");
  const [canvasLmsCourse, setCanvasLmsCourse] = useState(null);
  const [canvasLmsCourseLoaded, setCanvasLmsCourseLoaded] = useState(false);

  const courseRole = getCourse() && getCourse().role;
  const isStaff = isStaffRole(courseRole);

  const {
    status: canvasTokenStatus,
    refresh: refreshCanvasTokenStatus,
  } = useCanvasTokenStatus(props.url, courseList[course].course_id, isStaff);

  const {
    settings: canvasSyncSettings,
    setSettings: setCanvasSyncSettings,
    refresh: refreshCanvasSyncSettings,
    save: saveCanvasSyncSettings,
  } = useCanvasSyncSettings(
    props.url,
    courseList[course].course_id,
    canvasLmsCourse !== null && isStaff
  );

  const handleCollapse = () => {
    if (sidebarOpen === "sidebar-visible") {
      setSidebarCol("col-md-1");
      setContentCol("page-container content col-md-11");
      setSidebarOpen("sidebar-hidden");
    }
    else {
      setSidebarCol("col-md-3");
      setContentCol("page-container content col-md-9 my-auto");
      setSidebarOpen("sidebar-visible");
    }
  }

  const refreshContent = () => {
    setRefresh(prev => prev + 1);
  };

  useEffect(() => {
    setCanvasLmsCourseLoaded(false);

    const payload = {
      asciCourseId: courseList[course].course_id,
      command: "getCanvasLmsCourse",
    };

    postCommand(props.url, payload)
      .then((data) => {
        if (data.success === "true") {
          setCanvasLmsCourse(data.course);
        } else {
          setCanvasLmsCourse(null);
        }
        setCanvasLmsCourseLoaded(true);
      })
      .catch((error) => {
        console.log(error);
        setCanvasLmsCourseLoaded(true);
      });
  }, [courseList, course]);

  return (
    <>
      <div className="container-fluid page-width">
        <div className="row g-0">
          <div className={sidebarCol}>
            <div className="sidebar">
              <div className={sidebarOpen}>
                <h1><i className="bi-gear-wide-connected big-icon"></i></h1>
                <h2>Admin</h2>
                <p>
                  On this page, you can make adjustments to your course, manage your course, and synchronize your course with outside utilities.
                </p>
              </div>
              <button type="button" className="sidebar-button" onClick={handleCollapse}><i className="bi-arrows-collapse-vertical"></i></button>
            </div>

          </div>
          <div className={contentCol}>

            <h3 className="mb-3">Course: {courseList[course].mnemonic} {courseList[course].number} -  {courseList[course].name} ({courseList[course].semester})</h3>

            {canvasTokenStatus.isTokenExpired && (
              <CanvasTokenExpiredWarning canvasLmsCourse={canvasLmsCourse} />
            )}

            {canvasLmsCourse !== null && !canvasTokenStatus.hasToken && (
              <CanvasLinkWarning
                canvasLmsCourse={canvasLmsCourse}
                message=", but the primary instructor has not added a Canvas access token. Synced features are disabled until they add one or the course is unlinked."
              />
            )}

            <div className="card">
              <div className="card-header">
                <ul className="nav nav-tabs card-header-tabs" id="pills-tab" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button className="nav-link active" id="pills-general-tab" data-bs-toggle="pill" data-bs-target="#pills-general" type="button" role="tab" aria-controls="pills-home" aria-selected="true">General</button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button className="nav-link" id="pills-view-roster-tab" data-bs-toggle="pill" data-bs-target="#pills-view-roster" type="button" role="tab" aria-controls="pills-profile" aria-selected="false">View Roster</button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button className="nav-link" id="pills-roster-tab" data-bs-toggle="pill" data-bs-target="#pills-roster" type="button" role="tab" aria-controls="pills-profile" aria-selected="false">Update Roster</button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button className="nav-link" id="pills-sync-tab" data-bs-toggle="pill" data-bs-target="#pills-sync" type="button" role="tab" aria-controls="pills-contact" aria-selected="false">Course Content Uploads</button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button className="nav-link" id="pills-content-tab" data-bs-toggle="pill" data-bs-target="#pills-content" type="button" role="tab" aria-controls="pills-contact" aria-selected="false">Course Content</button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button className="nav-link" id="pills-quests-tab" data-bs-toggle="pill" data-bs-target="#pills-quests" type="button" role="tab" aria-controls="pills-contact" aria-selected="false">Quests</button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button className="nav-link" id="pills-external-tools-tab" data-bs-toggle="pill" data-bs-target="#pills-external-tools" type="button" role="tab" aria-controls="pills-contact" aria-selected="false">External Tools/Integrations</button>
                  </li>
                </ul>
              </div>

              <div className="tab-content card-body" id="pills-tabContent">

                <div className="tab-pane fade show active" id="pills-general" role="tabpanel" aria-labelledby="pills-home-tab">
                  <div className="col-md-12 my-auto">
                    <EditCourseSettings course_id={courseList[course].course_id} {...props} />
                  </div>
                  <div className="col-md-12 my-auto">
                    <EditCourseInfo course_id={courseList[course].course_id} {...props} />
                  </div>
                </div>

                <div className="tab-pane fade" id="pills-roster" role="tabpanel" aria-labelledby="pills-profile-tab">
                  <div className="col-md-12 my-auto mb-2">
                    <UploadRoster
                      course_id={courseList[course].course_id}
                      canvasTokenStatus={canvasTokenStatus}
                      canvasLmsCourse={canvasLmsCourse}
                      canvasLmsCourseLoaded={canvasLmsCourseLoaded}
                      canvasSyncSettings={canvasSyncSettings}
                      setCanvasSyncSettings={setCanvasSyncSettings}
                      refreshCanvasSyncSettings={refreshCanvasSyncSettings}
                      {...props} />
                  </div>
                  <div className="col-md-12 my-auto">
                    <AddStudent
                      course_id={courseList[course].course_id}
                      canvasTokenStatus={canvasTokenStatus}
                      canvasLmsCourse={canvasLmsCourse}
                      canvasLmsCourseLoaded={canvasLmsCourseLoaded}
                      {...props} />
                  </div>
                </div>

                <div className="tab-pane fade" id="pills-view-roster" role="tabpanel" aria-labelledby="pills-profile-tab">
                  <div className="col-md-12 my-auto mb-2">
                    <ViewRoster course_id={courseList[course].course_id} {...props} />
                  </div>
                </div>

                <div className="tab-pane fade" id="pills-sync" role="tabpanel" aria-labelledby="pills-contact-tab">
                  <div className="row">
                    <div className="col-md-12 my-auto">
                      <UpdateChat course_id={courseList[course].course_id} uploadSuccess={refreshContent} {...props} />
                    </div>
                  </div>
                </div>

                <div className="tab-pane fade" id="pills-content" role="tabpanel" aria-labelledby="pills-contact-tab">
                  <div className="row">
                    <div className="col-md-12 my-auto">
                      <CurrentCourseContent course_id={courseList[course].course_id} refresh={refresh} {...props} />
                    </div>
                  </div>
                </div>

                <div className="tab-pane fade" id="pills-quests" role="tabpanel" aria-labelledby="pills-contact-tab">
                  <div className="row">
                    <div className="col-md-12 my-auto">
                      <ViewQuests course_id={courseList[course].course_id} {...props} />
                    </div>
                  </div>
                </div>

                <div className="tab-pane fade" id="pills-external-tools" role="tabpanel" aria-labelledby="pills-contact-tab">
                  <div className="row">
                    <div className="col-md-12 my-auto">
                      <CanvasLmsSync
                        course_id={courseList[course].course_id}
                        canvasTokenStatus={canvasTokenStatus}
                        refreshCanvasTokenStatus={refreshCanvasTokenStatus}
                        canvasLmsCourse={canvasLmsCourse}
                        setCanvasLmsCourse={setCanvasLmsCourse}
                        canvasLmsCourseLoaded={canvasLmsCourseLoaded}
                        canvasSyncSettings={canvasSyncSettings}
                        saveCanvasSyncSettings={saveCanvasSyncSettings}
                        {...props}
                      />
                    </div>
                    <div className="col-md-12 my-auto">
                      <GradescopeSync course_id={courseList[course].course_id} {...props} />
                    </div>
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
