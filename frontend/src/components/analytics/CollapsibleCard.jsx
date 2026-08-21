import React, { useState } from "react";

function slug(title) {
  return String(title).toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function CollapsibleCard(props) {
  const [open, setOpen] = useState(props.defaultOpen !== false);
  const bodyId = `analytics-${slug(props.title)}`;

  return (
    <div className="card mb-4">
      <h4 className="card-header p-0">
        <button
          type="button"
          className="btn btn-link text-reset text-decoration-none fs-4 w-100 p-3 d-flex align-items-center justify-content-between"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen(!open)}
        >
          <span>{props.title}</span>
          <i className={open ? "bi-chevron-up" : "bi-chevron-down"}></i>
        </button>
      </h4>

      {open && (
        <div className="card-body" id={bodyId}>
          {props.children}
        </div>
      )}
    </div>
  );
}

export default CollapsibleCard;
