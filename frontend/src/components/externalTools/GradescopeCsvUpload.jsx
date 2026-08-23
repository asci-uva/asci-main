import React, { useEffect, useRef, useState } from "react";
import { useUser } from "../context/UserContext";
import { postCommand } from "../utils/postCommand";
import { isInstructorRole } from "../utils/roles";
import UploadGradescopeCsv from "../assessments/UploadGradescopeCsv";

function GradescopeCsvUpload(props) {
  const { getCourse } = useUser();
  const course = getCourse();
  const courseId = props.course_id;

  const [assignments, setAssignments] = useState([]);
  const [submissionsByAssignment, setSubmissionsByAssignment] = useState({});
  const [students, setStudents] = useState([]);
  const [assignmentsLoaded, setAssignmentsLoaded] = useState(false);
  const [submissionsLoaded, setSubmissionsLoaded] = useState(false);
  const assignmentsRequestRef = useRef(0);
  const submissionsRequestRef = useRef(0);

  const canUpload = isInstructorRole(course?.role);

  const loadSubmissions = () => {
    if (!courseId || !canUpload) return Promise.resolve();

    const requestId = ++submissionsRequestRef.current;
    const isCurrent = () => requestId === submissionsRequestRef.current;

    return postCommand(props.url, {
      asciCourseId: courseId,
      command: "getCanvasSubmissions",
    })
      .then((data) => {
        if (!isCurrent()) return;
        setSubmissionsLoaded(true);

        if (data.success !== "true") {
          console.log(data.error);
          return;
        }

        const grouped = {};
        (data.submissions || []).forEach((submission) => {
          const key = submission.canvas_lms_assignment_id;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(submission);
        });

        setSubmissionsByAssignment(grouped);
        setStudents(data.students || []);
      })
      .catch((e) => {
        console.log(e);
        if (!isCurrent()) return;
        setSubmissionsLoaded(true);
      });
  };

  useEffect(() => {
    if (!courseId || !canUpload) return;

    const requestId = ++assignmentsRequestRef.current;
    const isCurrent = () => requestId === assignmentsRequestRef.current;

    postCommand(props.url, {
      asciCourseId: courseId,
      command: "getCanvasAssignments",
    })
      .then((data) => {
        if (!isCurrent()) return;
        setAssignmentsLoaded(true);

        if (data.success === "true") setAssignments(data.assignments || []);
        else console.log(data.error);
      })
      .catch((e) => {
        console.log(e);
        if (!isCurrent()) return;
        setAssignmentsLoaded(true);
      });

    loadSubmissions();
  }, [props.url, courseId, canUpload]);

  if (!canUpload) return null;

  if (!assignmentsLoaded || !submissionsLoaded)
    return (
      <div className="card mb-4">
        <h4 className="card-header">Upload Gradescope CSV</h4>
        <div className="card-body">
          <p className="text-muted mb-0">Loading…</p>
        </div>
      </div>
    );

  return (
    <UploadGradescopeCsv
      {...props}
      course_id={courseId}
      assignments={assignments}
      submissionsByAssignment={submissionsByAssignment}
      students={students}
      onUploaded={loadSubmissions}
    />
  );
}

export default GradescopeCsvUpload;
