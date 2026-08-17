import React from "react";
import { formatRole } from "../utils/roles";

function StudentInfo(props) {
  const student = props.student;

  if (!student)
    return (
      <div className="card mb-4">
        <h4 className="card-header">Student</h4>
        <div className="card-body">
          <p className="text-muted mb-0">
            Search for a student above to see their statistics for this course.
          </p>
        </div>
      </div>
    );

  return (
    <div className="card mb-4">
      <h4 className="card-header">Student</h4>
      <div className="card-body">
        <dl className="row mb-0">
          <dt className="col-sm-3">First Name</dt>
          <dd className="col-sm-9">{student.fname || "—"}</dd>

          <dt className="col-sm-3">Last Name</dt>
          <dd className="col-sm-9">{student.lname || "—"}</dd>

          {student.pname && student.pname !== student.fname && (
            <>
              <dt className="col-sm-3">Preferred Name</dt>
              <dd className="col-sm-9">{student.pname}</dd>
            </>
          )}

          <dt className="col-sm-3">Computing ID</dt>
          <dd className="col-sm-9">
            <b>{student.computing_id}</b>
          </dd>

          {student.role && (
            <>
              <dt className="col-sm-3">Role</dt>
              <dd className="col-sm-9 mb-0">{formatRole(student.role)}</dd>
            </>
          )}
        </dl>
      </div>
    </div>
  );
}

export default StudentInfo;
