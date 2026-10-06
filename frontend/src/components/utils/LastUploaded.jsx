import React from "react";
import { formatLastSynced } from "./CanvasStalePeriod";

function LastUploaded({
  lastUploadedAt,
  loaded = true,
  label = "Last uploaded",
  className = "text-muted",
}) {
  return (
    <span className={className}>
      {label}: {loaded ? formatLastSynced(lastUploadedAt) : "Loading…"}
    </span>
  );
}

export default LastUploaded;
