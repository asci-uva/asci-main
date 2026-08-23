import React from "react";
import CollapsibleCard from "./CollapsibleCard";
import { formatRole } from "../utils/roles";

function StudentInfo(props) {
  const student = props.student;

  const body = () => {
    return (
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
    );
  };

  return <CollapsibleCard title="Student">{body()}</CollapsibleCard>;
}

export default StudentInfo;
