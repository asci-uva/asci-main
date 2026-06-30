import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { postCommand } from "../utils/postCommand";
import ConfirmModal from "../utils/ConfirmModal";
import { useUser } from "../context/UserContext";
import { intervalToParts, partsToInterval } from "../utils/CanvasStalePeriod";


function formatLinkedAsciCourse(c) {
    return `${c.mnemonic} ${c.number}: ${c.name} (${c.semester})`;
}

function range(n) {
    return Array.from({ length: n }, (_, i) => i);
}

function CanvasLmsSync(props) {
    const [canvasLmsAccessToken, setCanvasLmsAccessToken] = useState("");
    const [validateButtonDisabled, setValidateButtonDisabled] = useState(false);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [removeAccessTokenButtonDisabled, setRemoveAccessTokenButtonDisabled] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [terms, setTerms] = useState({});
    const [termNames, setTermNames] = useState([]);
    const [years, setYears] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTermName, setSelectedTermName] = useState("");
    const [selectedYear, setSelectedYear] = useState("");
    const [canvasLmsCourses, setCanvasLmsCourses] = useState([]);
    const [expandedCanvasLmsCourseId, setExpandedCanvasLmsCourseId] = useState(null);
    const [showSelectModal, setShowSelectModal] = useState(false);
    const [selectedCanvasLmsCourse, setSelectedCanvasLmsCourse] = useState(null);
    const [showRemoveCanvasLmsCourseModal, setShowRemoveCanvasLmsCourseModal] = useState(false);
    const [autosyncEnabled, setAutosyncEnabled] = useState(false);
    const [staleParts, setStaleParts] = useState({ years: 0, months: 0, days: 7, hours: 0 });
    const [saveSettingsButtonDisabled, setSaveSettingsButtonDisabled] = useState(false);

    const { getCourse } = useUser();
    const isInstructor = getCourse() && getCourse().role === "instructor";

    const filteredAndSortedCanvasLmsCourses = [...canvasLmsCourses]
        .filter((course) => {
            const termName = terms[course.enrollment_term_id] ?? "";

            if (termName === "") return false;

            const [year, term] = termName.split(" ");

            const yearMatch = !selectedYear || year === selectedYear;
            const termMatch = !selectedTermName || term === selectedTermName;

            const q = searchQuery.toLowerCase().trim();
            const searchMatch = !q || course.name.toLowerCase().includes(q) || course.course_code.toLowerCase().includes(q);

            return yearMatch && termMatch && searchMatch;
        })
        .sort((a, b) => { return b.enrollment_term_id - a.enrollment_term_id; });

    useEffect(() => {
        if (props.canvasLmsAccessTokenInfo.hasToken && props.canvasLmsAccessTokenInfo.isTokenWorking) {
            getEnrollmentYears();
            getCanvasLmsCourses();
        }
    }, [props.canvasLmsAccessTokenInfo]);

    useEffect(() => {
        if (props.canvasLmsCourse !== null && isInstructor) {
            getSyncSettings();
        }
    }, [props.canvasLmsCourse]);

    const getSyncSettings = () => {
        const payload = {
            asciCourseId: props.course_id,
            command: "getCanvasLmsSyncSettings",
        };

        postCommand(props.url, payload)
            .then((data) => {
                if (data.success === "true") {
                    setAutosyncEnabled(Boolean(data.settings.autosync_enabled));
                    setStaleParts(intervalToParts(data.settings.stale_period));
                } else {
                    toast.error(data.error);
                }
            })
            .catch((error) => {
                toast.error(error);
            });
    };

    const saveSyncSettings = () => {
        setSaveSettingsButtonDisabled(true);

        const payload = {
            asciCourseId: props.course_id,
            autosyncEnabled: autosyncEnabled,
            stalePeriod: partsToInterval(staleParts),
            command: "setCanvasLmsSyncSettings",
        };

        postCommand(props.url, payload)
            .then((data) => {
                setSaveSettingsButtonDisabled(false);
                if (data.success === "true") {
                    setAutosyncEnabled(Boolean(data.settings.autosync_enabled));
                    setStaleParts(intervalToParts(data.settings.stale_period));
                    toast.success("Successfully saved Canvas LMS sync settings");
                } else {
                    toast.error(data.error || "Failed to save Canvas LMS sync settings");
                }
            })
            .catch((error) => {
                setSaveSettingsButtonDisabled(false);
                toast.error(error);
            });
    };

    const setStalePart = (key, value) => {
        setStaleParts((prev) => ({ ...prev, [key]: parseInt(value, 10) || 0 }));
    };

    const validateCanvasAccessToken = () => {
        setShowValidationModal(true);
    };

    const confirmValidation = () => {
        setValidateButtonDisabled(true);
        setShowValidationModal(false);

        const trimmedCanvasLmsAccessToken = canvasLmsAccessToken.trim();

        const payload = {
            asciCourseId: props.course_id,
            canvasLmsAccessToken: trimmedCanvasLmsAccessToken,
            command: "validateCanvasLmsAccessToken",
        };

        postCommand(props.url, payload)
            .then((data) => {
                setValidateButtonDisabled(false);
                if (data.success === "true") {
                    props.setCanvasLmsAccessTokenInfo({
                        hasToken: true,
                        isTokenWorking: true,
                    });
                    getEnrollmentYears();
                    console.log("Successfully validated Canvas LMS access token");
                    toast.success("Successfully validated Canvas LMS access token");
                } else {
                    console.log(data.error);
                    toast.error(data.error || "Failed to validate Canvas LMS access token");
                }
            })
            .catch((error) => {
                setShowValidationModal(false);
                setValidateButtonDisabled(false);
                console.log(error);
                toast.error(error);
            });
    };

    const removeCanvasLmsAccessToken = () => {
        setShowRemoveModal(true);
    };

    const confirmRemoval = () => {
        setRemoveAccessTokenButtonDisabled(true);
        setShowRemoveModal(false);

        const payload = {
            asciCourseId: props.course_id,
            command: "removeCanvasLmsAccessToken",
        };

        postCommand(props.url, payload)
            .then((data) => {
                setRemoveAccessTokenButtonDisabled(false);
                if (data.success === "true") {
                    props.setCanvasLmsAccessTokenInfo({
                        hasToken: false,
                        isTokenWorking: false,
                    });
                    setCanvasLmsAccessToken("");
                    console.log("Successfully removed Canvas LMS access token");
                    toast.success("Successfully removed canvas LMS access token");
                } else {
                    console.log(data.error);
                    toast.error(data.error);
                }
            })
            .catch((error) => {
                setRemoveAccessTokenButtonDisabled(false);
                console.log(error);
                toast.error(error);
            });
    };

    const getEnrollmentYears = () => {
        const payload = {
            asciCourseId: props.course_id,
            command: "getCanvasLmsEnrollmentTerms",
        };

        postCommand(props.url, payload)
            .then((data) => {
                if (data.success === "true") {
                    setTerms(data.terms);
                    const termNamesArray = Object.values(data.terms);
                    setYears([...new Set(termNamesArray.map(t => t.split(" ")[0]))].sort().reverse());
                    setTermNames([...new Set(termNamesArray.map(t => t.split(" ")[1]))]);
                } else {
                    toast.error(data.error);
                }
            })
            .catch((error) => {
                toast.error(error);
            });
    };

    const getCanvasLmsCourses = () => {
        const payload = {
            asciCourseId: props.course_id,
            command: "getCanvasLmsCourses",
        };

        postCommand(props.url, payload)
            .then((data) => {
                if (data.success === "true") {
                    setCanvasLmsCourses(data.courses);
                } else {
                    toast.error(data.error);
                }
            })
            .catch((error) => {
                toast.error(error);
            });
    };

    const selectCanvasLmsCourse = (course) => {
        setShowSelectModal(true);
        setSelectedCanvasLmsCourse(course);
    };

    const confirmSelectCanvasLmsCourse = () => {
        setShowSelectModal(false);

        const payload = {
            asciCourseId: props.course_id,
            canvasLmsCourse: selectedCanvasLmsCourse,
            command: "syncCanvasLmsCourse"
        };

        postCommand(props.url, payload)
            .then((data) => {
                if (data.success === "true") {
                    console.log("Successfully synced with Canvas LMS course");
                    toast.success("Successfully synced with Canvas LMS course");
                    props.setCanvasLmsCourse(data.course);
                } else {
                    toast.error(data.error);
                }
            })
            .catch((error) => {
                toast.error(error);
            });
    };

    const removeCanvasLmsCourse = () => {
        setShowRemoveCanvasLmsCourseModal(true);
    };

    const confirmRemoveCanvasLmsCourse = () => {
        setShowRemoveCanvasLmsCourseModal(false);

        const payload = {
            asciCourseId: props.course_id,
            command: "desyncCanvasLmsCourse"
        };

        postCommand(props.url, payload)
            .then((data) => {
                if (data.success === "true") {
                    props.setCanvasLmsCourse(null);
                    setExpandedCanvasLmsCourseId(null);
                    setSearchQuery("");
                    setSelectedTermName("");
                    setSelectedYear("");
                    getCanvasLmsCourses();
                    console.log("Successfully desynced with Canvas LMS course");
                    toast.success("Successfully desynced with Canvas LMS course");
                } else {
                    toast.error(data.error);
                }
            })
            .catch((error) => {
                toast.error(error);
            });
    };

    function getValidateAccessTokenButton() {
        if (validateButtonDisabled)
            return <button type="button" className="btn btn-primary" disabled>Validating Access Token (Please Wait)</button>;
        return <button type="button" className="btn btn-primary" onClick={validateCanvasAccessToken}>Validate Access Token</button>;
    }

    function getRemoveAccessTokenButton() {
        if (removeAccessTokenButtonDisabled)
            return <button type="button" className="btn btn-primary" disabled>Removing Access Token (Please Wait)</button>;
        return <button type="button" className="btn btn-primary" onClick={removeCanvasLmsAccessToken}>Remove Access Token</button>;
    }

    function getSaveSettingsButton() {
        if (saveSettingsButtonDisabled)
            return <button type="button" className="btn btn-primary" disabled>Saving (Please Wait)</button>;
        return <button type="button" className="btn btn-primary" onClick={saveSyncSettings}>Save Sync Settings</button>;
    }

    return (
        <div className="card">
            <h4 className="card-header">Canvas LMS Synchronization</h4>
            <div className="card-body">
                <div className="mb-3">
                    <h5>Access token</h5>
                    {props.canvasLmsAccessTokenInfo.hasToken ? (
                        <>
                            <p className="text-muted">Canvas LMS access token detected</p>
                            {getRemoveAccessTokenButton()}
                        </>
                    ) : (
                        <>
                            <label>Enter Canvas LMS access token</label>
                            <input
                                className="form-control mb-3"
                                type="text"
                                value={canvasLmsAccessToken}
                                onChange={(e) => setCanvasLmsAccessToken(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") validateCanvasAccessToken();
                                }}
                                required
                            />
                            {getValidateAccessTokenButton()}
                        </>
                    )}
                </div>
                {!props.canvasLmsCourseLoaded ? (
                    <div className="mb-3">
                        <p className="text-muted mb-0">Loading…</p>
                    </div>
                ) : props.canvasLmsCourse !== null ? (
                    <>
                        <div className="mb-3">
                            <h5>Canvas LMS course</h5>
                            <p className="text-muted">Synced with {props.canvasLmsCourse.course_code} {props.canvasLmsCourse.name}</p>
                            <button type="button" className="btn btn-primary" onClick={removeCanvasLmsCourse}>Desynchronize from course</button>
                        </div>
                        {isInstructor && (
                            <div className="mb-3">
                                <h5>Sync Settings</h5>
                                <div className="form-check mb-3">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="autosyncEnabledCheckbox"
                                        checked={autosyncEnabled}
                                        onChange={(e) => setAutosyncEnabled(e.target.checked)}
                                    />
                                    <label className="form-check-label" htmlFor="autosyncEnabledCheckbox">
                                        Automatically sync roster when an instructor or TA opens this course
                                    </label>
                                </div>
                                <label className="form-label">Stale period</label>
                                <div className="d-flex gap-2 mb-3">
                                    <div>
                                        <label className="form-label small">Years</label>
                                        <select className="form-select" value={staleParts.years} onChange={(e) => setStalePart("years", e.target.value)}>
                                            {range(11).map((n) => (<option key={n} value={n}>{n}</option>))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label small">Months</label>
                                        <select className="form-select" value={staleParts.months} onChange={(e) => setStalePart("months", e.target.value)}>
                                            {range(12).map((n) => (<option key={n} value={n}>{n}</option>))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label small">Days</label>
                                        <select className="form-select" value={staleParts.days} onChange={(e) => setStalePart("days", e.target.value)}>
                                            {range(31).map((n) => (<option key={n} value={n}>{n}</option>))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label small">Hours</label>
                                        <select className="form-select" value={staleParts.hours} onChange={(e) => setStalePart("hours", e.target.value)}>
                                            {range(24).map((n) => (<option key={n} value={n}>{n}</option>))}
                                        </select>
                                    </div>
                                </div>
                                {getSaveSettingsButton()}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {props.canvasLmsAccessTokenInfo.hasToken && (
                            <div className="mb-3">
                                <h5>Select Canvas LMS Course</h5>
                                {!props.canvasLmsAccessTokenInfo.isTokenWorking ? (
                                    <p className="alert alert-warning d-flex justify-content-between align-items-center">Cannot connect to Canvas LMS.</p>
                                ) : (
                                    <>
                                        <div className="mb-3" style={{ position: "sticky", zIndex: 1000 }}>
                                            <div className="d-flex gap-2">
                                                <select
                                                    className="form-select"
                                                    style={{ width: "auto", flexShrink: 0 }}
                                                    value={selectedTermName}
                                                    onChange={(e) => setSelectedTermName(e.target.value)}
                                                >
                                                    <option value="">Select Term Name</option>
                                                    {termNames.map((term) => (
                                                        <option key={term} value={term}>{term}</option>
                                                    ))}
                                                </select>
                                                <select
                                                    className="form-select"
                                                    style={{ width: "auto", flexShrink: 0 }}
                                                    value={selectedYear}
                                                    onChange={(e) => setSelectedYear(e.target.value)}
                                                >
                                                    <option value="">Select Year</option>
                                                    {years.map((year) => (
                                                        <option key={year} value={year}>{year}</option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="text"
                                                    className="form-control flex-grow-1"
                                                    placeholder="Search by name or course code"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                                                <ul className="list-group">
                                                    {filteredAndSortedCanvasLmsCourses.map((course) => (
                                                        <li
                                                            key={course.id}
                                                            className={`list-group-item${course.linked ? " text-muted" : ""}`}
                                                            style={{ cursor: "pointer", ...(course.linked ? { opacity: 0.55 } : {}) }}
                                                            onClick={() =>
                                                                setExpandedCanvasLmsCourseId(
                                                                    expandedCanvasLmsCourseId === course.id ? null : course.id
                                                                )
                                                            }
                                                        >
                                                            <div className="d-flex justify-content-between">
                                                                <span>
                                                                    <span className="text-muted me-2">
                                                                        {course.course_code}
                                                                    </span>
                                                                    <span>{course.name}</span>
                                                                </span>

                                                                <span className="text-muted">
                                                                    {terms[course.enrollment_term_id] ?? "Unknown Term"}
                                                                </span>
                                                            </div>

                                                            {expandedCanvasLmsCourseId === course.id && (
                                                                <div className="mt-2">
                                                                    {course.linked ? (
                                                                        <>
                                                                            <button type="button" className="btn btn-primary" disabled>Select Course</button>
                                                                            <p className="mb-0 mt-2">Already linked to {formatLinkedAsciCourse(course.linked_asci_course)}</p>
                                                                        </>
                                                                    ) : (
                                                                        <button type="button" className="btn btn-primary" onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            selectCanvasLmsCourse(course);
                                                                        }}>Select Course</button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
            <ConfirmModal
                show={showValidationModal}
                title="Confirm Canvas access token validation"
                onCancel={() => setShowValidationModal(false)}
                onConfirm={confirmValidation}
            >
                <p>Are you sure you want to validate this Canvas LMS access token?</p>
                <p>Note: The access token will be directly tied to your ASCI account</p>
            </ConfirmModal>
            <ConfirmModal
                show={showRemoveModal}
                title="Confirm Canvas LMS access token removal"
                onCancel={() => setShowRemoveModal(false)}
                onConfirm={confirmRemoval}
            >
                <p>Are you sure you want to remove this Canvas LMS access token?</p>
                <p>Note: The access token is directly tied to your ASCI account</p>
                {props.canvasLmsCourse !== null && (
                    <p className="alert alert-warning d-flex justify-content-between align-items-center mb-3">
                        A Canvas LMS course is linked this ASCI course. Removing your access token will cause some synced features to not work
                    </p>
                )}
            </ConfirmModal>
            <ConfirmModal
                show={showSelectModal}
                title="Confirm Canvas LMS course selection"
                onCancel={() => { setShowSelectModal(false); setSelectedCanvasLmsCourse(null) }}
                onConfirm={confirmSelectCanvasLmsCourse}
            >
                <p>Are you sure you want to select this Canvas LMS course?</p>
            </ConfirmModal>
            <ConfirmModal
                show={showRemoveCanvasLmsCourseModal}
                title="Confirm Canvas LMS course desynchronization"
                onCancel={() => setShowRemoveCanvasLmsCourseModal(false)}
                onConfirm={confirmRemoveCanvasLmsCourse}
            >
                <p>Are you sure you want to desynchronize this Canvas LMS course?</p>
            </ConfirmModal>
        </div>
    );
}

export default CanvasLmsSync;