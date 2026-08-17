import React, { useEffect, useRef, useState } from "react";
import { useUser } from "../context/UserContext";
import { postCommand } from "../utils/postCommand";
import { errorMessage } from "../utils/errorMessage";
import { useCanvasLmsCourse } from "../utils/useCanvasLmsCourse";
import { isStaffRole } from "../utils/roles";
import StudentSearch from "./StudentSearch";
import StudentInfo from "./StudentInfo";
import SubmissionStats from "./SubmissionStats";

function Home(props) {
  const { getCourse } = useUser();
  const course = getCourse();
  const courseId = course.course_id;
  const isStaff = isStaffRole(course.role);

  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  const [assignmentsLoaded, setAssignmentsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const studentsRequestRef = useRef(0);
  const assignmentsRequestRef = useRef(0);

  const [sidebarOpen, setSidebarOpen] = useState("sidebar-visible");
  const [sidebarCol, setSidebarCol] = useState("col-md-3");
  const [contentCol, setContentCol] = useState("page-container content col-md-9 my-auto");

  const {
    course: canvasLmsCourse,
    loaded: canvasLmsCourseLoaded,
  } = useCanvasLmsCourse(props.url, courseId, isStaff);

  useEffect(() => {
    if (!isStaff || !courseId) return;

    const requestId = ++studentsRequestRef.current;
    const isCurrent = () => requestId === studentsRequestRef.current;

    postCommand(props.url, {
      asciCourseId: courseId,
      command: "getCanvasSubmissions",
    })
      .then((data) => {
        if (!isCurrent()) return;
        setStudentsLoaded(true);

        if (data.success === "true") {
          setStudents(data.students || []);
          setSubmissions(data.submissions || []);
        } else {
          console.log(data.error);
          setError(errorMessage(data.error, "Failed to load student submissions"));
        }
      })
      .catch((e) => {
        console.log(e);
        if (!isCurrent()) return;
        setStudentsLoaded(true);
        setError("Failed to load student submissions");
      });
  }, [props.url, courseId, isStaff]);

  useEffect(() => {
    if (!isStaff || !courseId || !canvasLmsCourseLoaded) return;

    const requestId = ++assignmentsRequestRef.current;
    const isCurrent = () => requestId === assignmentsRequestRef.current;

    if (canvasLmsCourse === null) {
      setAssignments([]);
      setAssignmentsLoaded(true);
      return;
    }

    postCommand(props.url, {
      asciCourseId: courseId,
      command: "getCanvasAssignments",
    })
      .then((data) => {
        if (!isCurrent()) return;
        setAssignmentsLoaded(true);

        if (data.success === "true") setAssignments(data.assignments || []);
        else {
          console.log(data.error);
          setError(errorMessage(data.error, "Failed to load Canvas LMS assignments"));
        }
      })
      .catch((e) => {
        console.log(e);
        if (!isCurrent()) return;
        setAssignmentsLoaded(true);
        setError("Failed to load Canvas LMS assignments");
      });
  }, [props.url, courseId, isStaff, canvasLmsCourse, canvasLmsCourseLoaded]);

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

  const body = () => {
    if (!isStaff)
      return (
        <div className="card">
          <div className="card-body">
            <h5 className="mb-0">Analytics are available to course staff only.</h5>
          </div>
        </div>
      );

    return (
      <>
        <StudentSearch
          students={students}
          selected={selected}
          loaded={studentsLoaded}
          onSelect={setSelected}
        />

        <StudentInfo student={selected} />

        <SubmissionStats
          student={selected}
          assignments={assignments}
          submissions={submissions}
          canvasLmsCourse={canvasLmsCourse}
          loaded={assignmentsLoaded && studentsLoaded}
          error={error}
        />
      </>
    );
  };

  return (
    <>
      <div className="container-fluid page-width">
        <div className="row g-0">
          <div className={sidebarCol}>
            <div className="sidebar">
              <div className={sidebarOpen}>
                <h1><i className="bi-person-lines-fill big-icon"></i></h1>
                <h2>Analytics</h2>
                <p>
                  Look up a student to see how they are doing in this course, from
                  the work they have handed in to the grades they have earned.
                </p>
              </div>
              <button type="button" className="sidebar-button" onClick={handleCollapse}><i className="bi-arrows-collapse-vertical"></i></button>
            </div>
          </div>

          <div className={contentCol}>
            <h3 className="mb-3">Course: {course.mnemonic} {course.number} - {course.name} ({course.semester})</h3>

            {body()}
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
