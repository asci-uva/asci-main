import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import EditCourseInfo from "./EditCourseInfo";
import EditCourseSettings from "./EditCourseSettings";
import UpdateChat from "./UpdateChat";
import CurrentCourseContent from "./CurrentCourseContent";
import ViewQuests from "./ViewQuests";

function Home(props) {
  const { courseList, course } = useUser();
  const [refresh, setRefresh] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState("sidebar-visible");
  const [sidebarCol, setSidebarCol] = useState("col-md-3");
  const [contentCol, setContentCol] = useState("page-container content col-md-9 my-auto");

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
                  On this page, you can make adjustments to your course and manage its content. The roster and the tools this course syncs with have pages of their own.
                </p>
              </div>
              <button type="button" className="sidebar-button" onClick={handleCollapse}><i className="bi-arrows-collapse-vertical"></i></button>
            </div>

          </div>
          <div className={contentCol}>

            <h3 className="mb-3">Course: {courseList[course].mnemonic} {courseList[course].number} -  {courseList[course].name} ({courseList[course].semester})</h3>

            <div className="card">
              <div className="card-header">
                <ul className="nav nav-tabs card-header-tabs" id="pills-tab" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button className="nav-link active" id="pills-general-tab" data-bs-toggle="pill" data-bs-target="#pills-general" type="button" role="tab" aria-controls="pills-home" aria-selected="true">General</button>
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

              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
