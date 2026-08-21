import React, { useRef, useState } from "react";
import CollapsibleCard from "./CollapsibleCard";

function fullName(student) {
  return [student.fname, student.lname].filter(Boolean).join(" ");
}

function matches(student, query) {
  const haystack = [student.fname, student.lname, student.pname, student.computing_id]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function StudentSearch(props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const students = props.students || [];
  const trimmed = query.trim().toLowerCase();
  const results = trimmed === "" ? students : students.filter((s) => matches(s, trimmed));

  const select = (student) => {
    setQuery("");
    setOpen(false);
    if (inputRef.current !== null) inputRef.current.blur();
    props.onSelect(student);
  };

  return (
    <CollapsibleCard title="Find a Student">
      <div className="position-relative mb-2">
        <input
          id="analyticsSearchTextBox"
          ref={inputRef}
          type="text"
          className="form-control"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && inputRef.current !== null)
              inputRef.current.blur();
          }}
          placeholder="Search by name or computing id..."
          autoComplete="off"
        />

        {open && students.length > 0 && (
          <div
            className="position-absolute w-100 shadow overflow-auto bg-body"
            style={{ maxHeight: 260 + "px", top: 100 + "%", left: 0, zIndex: 1000 }}
            onMouseDown={(e) => e.preventDefault()}
          >
            {results.length === 0 ? (
              <div className="list-group">
                <div className="list-group-item text-muted">
                  No students match "{query}".
                </div>
              </div>
            ) : (
              <ul className="list-group">
                {results.map((student) => (
                  <li key={student.computing_id} className="list-group-item p-0">
                    <button
                      type="button"
                      className="btn btn-link text-decoration-none w-100 text-start"
                      onClick={() => select(student)}
                    >
                      {fullName(student)}{" "}
                      <span className="text-muted">({student.computing_id})</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {props.loaded && students.length === 0 && (
        <p className="text-muted mb-0">
          No students are enrolled in this course yet.
        </p>
      )}

      {props.selected && (
        <p className="mb-0">
          Showing <b>{fullName(props.selected)}</b>
          <button
            type="button"
            className="btn btn-secondary btn-sm ms-3"
            onClick={() => props.onSelect(null)}
          >
            Clear
          </button>
        </p>
      )}
    </CollapsibleCard>
  );
}

export default StudentSearch;
