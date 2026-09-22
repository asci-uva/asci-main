import React, { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";

function DiscordActivity(props) {
  const { user, getCourse, getCourseSettings, setCourseSettings } = useUser();
  const [guildId, setGuildId] = useState(getCourseSettings()?.discord_server_id || "");
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [channelData, setChannelData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [channelLoading, setChannelLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("channels"); // "channels" | "summary"
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [maxHours, setMaxHours] = useState(24);
  let course = getCourse();
  let url = props.url;

  // Auto-load channels on mount if a guild ID is already saved for this course
  useEffect(() => {
    if (guildId) loadChannels();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const formatDuration = (seconds) => {
    if (seconds == null) return "—";
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
  };

  const loadChannels = () => {
    if (!guildId.trim()) {
      setError("Please enter a Discord Server (Guild) ID.");
      return;
    }
    setLoading(true);
    setError(null);
    setChannels([]);
    setSelectedChannel(null);
    setChannelData(null);
    setSummary(null);

    let request = {
      command: "getDiscordChannels",
      user: user.userid,
      courseId: course.course_id,
      guildId: guildId.trim(),
    };

    fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    })
      .then((r) => r.json())
      .then((data) => {
        setLoading(false);
        if (data.success === "true") {
          setChannels(data.channels);
          if (data.channels.length === 0)
            setError("No text channels found in this server.");
          // persist guild ID into course settings
          const current = getCourseSettings();
          const updated = { ...current, discord_server_id: guildId.trim() };
          setCourseSettings(updated);
          fetch(url, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ command: "setCourseSettings", user: user.userid, courseId: course.course_id, settings: updated }),
          });
        } else {
          setError(data.error || "Failed to load channels.");
        }
      })
      .catch((err) => {
        setLoading(false);
        setError("Network error loading channels: " + err.message + ". Is the backend running?");
      });
  };

  const loadChannelActivity = (channel) => {
    setSelectedChannel(channel);
    setChannelData(null);
    setChannelLoading(true);
    setError(null);

    let request = {
      command: "getDiscordActivity",
      user: user.userid,
      courseId: course.course_id,
      channelId: channel.id,
    };

    fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    })
      .then((r) => r.json())
      .then((data) => {
        setChannelLoading(false);
        if (data.success === "true") {
          setChannelData(data.questions);
        } else {
          setError(data.error || "Failed to load channel activity.");
        }
      })
      .catch((err) => {
        setChannelLoading(false);
        setError("Network error loading channel activity: " + err.message + ". Is the backend running?");
      });
  };

  const loadSummary = () => {
    setSummaryLoading(true);
    setError(null);
    setSummary(null);

    let request = {
      command: "getDiscordServerSummary",
      user: user.userid,
      courseId: course.course_id,
      guildId: guildId.trim(),
    };

    fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    })
      .then((r) => r.json())
      .then((data) => {
        setSummaryLoading(false);
        if (data.success === "true") {
          setSummary(data.channels);
        } else {
          setError(data.error || "Failed to load server summary.");
        }
      })
      .catch((err) => {
        setSummaryLoading(false);
        setError("Network error loading summary: " + err.message + ". Is the backend running?");
      });
  };

  return (
    <>
      <div className="full-page card mb-4">
        <h4 className="card-header">Discord Activity Monitor</h4>
        <div className="card-body">
          <p className="text-muted mb-3">
            Enter your Discord Server ID to load team channels. For each message
            ending in <strong>?</strong>, the response times from other channel
            members are shown.
          </p>

          {/* Guild ID input */}
          <div className="input-group mb-3" style={{ maxWidth: "480px" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Discord Server (Guild) ID"
              value={guildId}
              onChange={(e) => setGuildId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadChannels()}
            />
            <button
              className="btn btn-primary"
              onClick={loadChannels}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-1"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Loading…
                </>
              ) : (
                "Load Channels"
              )}
            </button>
          </div>

          {/* Outlier filter */}
          <div className="d-flex align-items-center gap-2 mb-3">
            <label className="form-label mb-0 text-nowrap">Ignore responses after</label>
            <input
              type="number"
              className="form-control form-control-sm"
              style={{ width: "80px" }}
              min="1"
              value={maxHours}
              onChange={(e) => {
                setMaxHours(Number(e.target.value));
                setSummary(null); // summary needs re-fetch with new threshold
              }}
            />
            <span className="text-muted">hours</span>
          </div>

          {error && (
            <div className="alert alert-danger py-2">{error}</div>
          )}

          {/* Two-column layout: channel list + detail */}
          {channels.length > 0 && (
            <>
              {/* Tab switcher */}
              <ul className="nav nav-tabs mb-3">
                <li className="nav-item">
                  <button
                    className={"nav-link" + (activeTab === "channels" ? " active" : "")}
                    onClick={() => setActiveTab("channels")}
                  >
                    Channel Activity
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={"nav-link" + (activeTab === "summary" ? " active" : "")}
                    onClick={() => { setActiveTab("summary"); if (!summary && !summaryLoading) loadSummary(); }}                  >
                    Server Summary
                  </button>
                </li>
              </ul>

              {/* ── Channel Activity tab ── */}
              {activeTab === "channels" && (
                <div className="row">
                  {/* Channel list */}
                  <div className="col-md-3">
                    <h6 className="fw-semibold mb-2">Channels (Teams)</h6>
                    <div className="list-group">
                      {channels.map((ch) => (
                        <button
                          key={ch.id}
                          className={
                            "list-group-item list-group-item-action" +
                            (selectedChannel && selectedChannel.id === ch.id ? " active" : "")
                          }
                          onClick={() => loadChannelActivity(ch)}
                        >
                          # {ch.name}
                          {ch.member_count != null && (
                            <span className="badge bg-secondary float-end ms-1">
                              {ch.member_count}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Channel detail */}
                  <div className="col-md-9">
                    {!selectedChannel && (
                      <p className="text-muted">Select a channel to view activity.</p>
                    )}

                    {channelLoading && (
                      <div className="d-flex align-items-center gap-2">
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        <span>Loading messages…</span>
                      </div>
                    )}

                    {channelData && selectedChannel && (
                      <>
                        <h6 className="fw-semibold mb-3">
                          # {selectedChannel.name} — Questions &amp; Response Times
                        </h6>

                        {channelData.length === 0 ? (
                          <p className="text-muted">
                            No questions (messages ending in '?') found in this channel.
                          </p>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-sm align-middle">
                              <thead className="table-dark">
                                <tr>
                                  <th>Question</th>
                                  <th>Asked by</th>
                                  <th>Asked at</th>
                                  <th>Responder</th>
                                  <th>Response time</th>
                                </tr>
                              </thead>
                              <tbody>
                                {channelData.map((q, i) => {
                                  const filteredResponses = (q.responses || []).filter(
                                    r => r.response_time_seconds == null || r.response_time_seconds <= maxHours * 3600
                                  );
                                  const hasResponses = filteredResponses.length > 0;
                                  return (
                                    <>
                                      <tr key={"q" + i} className="table-light fw-semibold">
                                        <td
                                          style={{ maxWidth: "260px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                                          title={q.question_text}
                                        >
                                          {q.question_text}
                                        </td>
                                        <td>{q.asker}</td>
                                        <td>{new Date(q.asked_at).toLocaleString()}</td>
                                        <td colSpan={2} className="text-muted fst-italic">
                                          {hasResponses ? `${filteredResponses.length} response${filteredResponses.length > 1 ? "s" : ""}` : "No response"}
                                        </td>
                                      </tr>
                                      {hasResponses && filteredResponses.map((r, j) => (
                                        <tr key={"r" + i + "-" + j}>
                                          <td colSpan={3}></td>
                                          <td>{r.responder}</td>
                                          <td>
                                            {r.response_time_seconds != null ? (
                                              <span className={r.response_time_seconds <= 3600 ? "text-success fw-semibold" : r.response_time_seconds <= 21600 ? "text-warning fw-semibold" : "text-danger fw-semibold"}>
                                                {formatDuration(r.response_time_seconds)}
                                              </span>
                                            ) : (
                                              <span className="text-muted">—</span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── Server Summary tab ── */}
              {activeTab === "summary" && (
                <div>
                  {!summary && !summaryLoading && (
                    <button className="btn btn-outline-primary btn-sm mb-3" onClick={loadSummary}>
                      Load Summary (up to {maxHours}h cutoff)
                    </button>
                  )}

                  {summaryLoading && (
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      <span>Loading server summary… (fetching all channels)</span>
                    </div>
                  )}

                  {summary && summary.length === 0 && (
                    <p className="text-muted">No question activity found across any channels.</p>
                  )}

                  {summary && summary.length > 0 && (
                    <>
                      <p className="text-muted mb-3">
                        Per team member, grouped by channel. <strong>Participation</strong> = responses given ÷ questions asked by others (green ≥ 75%, yellow ≥ 40%, red &lt; 40%). Response time: green ≤ 1 hr, yellow ≤ 6 hrs, red &gt; 6 hrs.
                      </p>
                      <div className="row g-3">
                        {summary.map((ch, ci) => {
                          const totalQuestions = ch.members.reduce((sum, m) => sum + m.questions_asked, 0);
                          return (
                          <div className="col-12" key={ci}>
                            <div className="card h-100">
                              <div className="card-header fw-semibold"># {ch.channel_name}</div>
                              <div className="card-body p-0">
                                {ch.members.length === 0 ? (
                                  <p className="text-muted p-3 mb-0">No responses recorded.</p>
                                ) : (
                                  <table className="table table-sm mb-0">
                                    <thead>
                                      <tr>
                                        <th>Member</th>
                                        <th>Questions asked</th>
                                        <th>Responses given</th>
                                        <th>Participation</th>
                                        <th>Avg response time</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {ch.members.map((m, mi) => {
                                        const eligible = totalQuestions - m.questions_asked;
                                        const participation = eligible > 0 ? Math.round((m.responses_given / eligible) * 100) : null;
                                        return (
                                        <tr key={mi}>
                                          <td>{m.name}</td>
                                          <td>{m.questions_asked}</td>
                                          <td>{m.responses_given}</td>
                                          <td>
                                            {participation != null ? (
                                              <span className={participation >= 75 ? "text-success fw-semibold" : participation >= 40 ? "text-warning fw-semibold" : "text-danger fw-semibold"}>
                                                {participation}%
                                              </span>
                                            ) : (
                                              <span className="text-muted">—</span>
                                            )}
                                          </td>
                                          <td>
                                            {m.avg_response_seconds != null ? (
                                              <span className={m.avg_response_seconds <= 3600 ? "text-success fw-semibold" : m.avg_response_seconds <= 21600 ? "text-warning fw-semibold" : "text-danger fw-semibold"}>
                                                {formatDuration(Math.round(m.avg_response_seconds))}
                                              </span>
                                            ) : (
                                              <span className="text-muted">—</span>
                                            )}
                                          </td>
                                        </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default DiscordActivity;
