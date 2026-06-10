import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function CanvasLmsSync(props) {
    const [canvasLmsAccessToken, setCanvasLmsAccessToken] = useState("");
    const [validateButtonDisabled, setValidateButtonDisabled] = useState(false);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [removeAccessTokenButtonDisabled, setRemoveAccessTokenButtonDisabled] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [terms, setTerms] = useState({});
    const [termNames, setTermNames] = useState([]);
    const [years, setYears] = useState([]);
    const [selectedTermName, setSelectedTermName] = useState("");
    const [selectedYear, setSelectedYear] = useState("");
    const [canvasLmsCourses, setCanvasLmsCourses] = useState([]);
    const [expandedCanvasLmsCourseId, setExpandedCanvasLmsCourseId] = useState(null);
    const [showSelectModal, setShowSelectModal] = useState(false);
    const [selectedCanvasLmsCourse, setSelectedCanvasLmsCourse] = useState(null);
    const [showRemoveCanvasLmsCourseModal, setShowRemoveCanvasLmsCourseModal] = useState(false);

    const filteredAndSortedCanvasLmsCourses = [...canvasLmsCourses]
    .filter((course) => {
        const termName =
            terms[course.enrollment_term_id] ?? "";

        const [year, term] = termName.split(" ");

        const yearMatch =
            !selectedYear || year === selectedYear;

        const termMatch =
            !selectedTermName || term === selectedTermName;

        return yearMatch && termMatch;
    })
    .sort((a, b) => {
        return b.enrollment_term_id - a.enrollment_term_id;
    });

    useEffect(() => {
        if (props.hasCanvasLmsAccessToken) {
            getEnrollmentYears();
            getCanvasLmsCourses();
        }
    }, [props.hasCanvasLmsAccessToken]);

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

        fetch(props.url, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then((response) => response.json())
            .then((data) => {
                setValidateButtonDisabled(false);
                if (data.success === "true") {
                    props.setHasCanvasLmsAccessToken(true);
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

        fetch(props.url, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then((response) => response.json())
            .then((data) => {
                setRemoveAccessTokenButtonDisabled(false);
                if (data.success === "true") {
                    props.setHasCanvasLmsAccessToken(false);
                    setCanvasLmsAccessToken("");
                    console.log("Successfully removed Canvas LMS access token");
                    toast.success("Successfully removed canvas LMS access token");
                    if (props.canvasLmsCourse !== null)
                        confirmRemoveCanvasLmsCourse();
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

        fetch(props.url, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then((response) => response.json())
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

        fetch(props.url, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then((response) => response.json())
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

        fetch(props.url, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then((response) => response.json())
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

        fetch(props.url, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success === "true") {
                    props.setCanvasLmsCourse(null);
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

    function get_validate_button() {
        if (validateButtonDisabled)
            return <button type="button" className="btn btn-primary" disabled>Validating Access Token (Please Wait)</button>;
        return <button type="button" className="btn btn-primary" onClick={validateCanvasAccessToken}>Validate Access Token</button>;
    }

    function get_remove_access_token_button() {
        if (removeAccessTokenButtonDisabled)
            return <button type="button" className="btn btn-primary" disabled>Removing Access Token (Please Wait)</button>;
        return <button type="button" className="btn btn-primary" onClick={removeCanvasLmsAccessToken}>Remove Access Token</button>;
    }

    return (
        <div className="card">
            <h4 className="card-header">Canvas LMS Synchronization</h4>
            <div className="card-body">
                <h5>Access token validation</h5>
            {props.hasCanvasLmsAccessToken ? (
                <>
                <div className="mb-3">
                    <p>Canvas LMS access token detected</p>
                    {get_remove_access_token_button()}
                </div>
                <h5>Select a Canvas LMS course</h5>
                {props.canvasLmsCourse !== null ? (
                <div className="mb-3">
                    <p>Synced with {props.canvasLmsCourse.course_code} {props.canvasLmsCourse.name}</p>
                    <button type="button" className="btn btn-primary" onClick={removeCanvasLmsCourse}>Desynchronize from Canvas LMS course</button>
                </div>
                ) : (
                <>
                <div className="mb-3" style={{position: "sticky", zIndex: 1000}}>
                    <div className="d-flex gap-2">
                        <select
                            className="form-select"
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
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                        >
                            <option value="">Select Year</option>
                            {years.map((year) => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="mb-3">
                    <div style={{maxHeight: "400px", overflowY: "auto"}}>
                        <ul className="list-group">
                            {filteredAndSortedCanvasLmsCourses.map((course) => (
                                <li
                                    key={course.id}
                                    className="list-group-item"
                                    style={{ cursor: "pointer" }}
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
                                            <button type="button" className="btn btn-primary" onClick={(e) => {
                                                e.stopPropagation();
                                                selectCanvasLmsCourse(course);
                                            }}>Select Course</button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                </>
                )}
                </>
            ) : (
                <>
                    <div className="mb-3">
                        <label>Enter Canvas LMS access token</label>
                        <input
                            className="form-control"
                            type="text"
                            value={canvasLmsAccessToken}
                            onChange={(e) => setCanvasLmsAccessToken(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") validateCanvasAccessToken();
                            }}
                            required
                        />
                    </div>
                    {get_validate_button()}
                </>
            )}
            </div>
            {showValidationModal && (
            <div className="modal show d-block" tabIndex="-1">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Confirm Canvas access token validation</h5>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to validate this Canvas LMS access token?</p>
                            <p>Note: The access token will be directly tied to your ASCI account</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowValidationModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={confirmValidation}>Confirm</button>
                        </div>
                    </div>
                </div>
            </div>
            )}
            {showRemoveModal && (
            <div className="modal show d-block" tabIndex="-1">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Confirm Canvas LMS access token removal</h5>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to remove this Canvas LMS access token?</p>
                            <p>Note: The access token is directly tied to your ASCI account</p>
                            {props.canvasLmsCourse !== null && (
                                <p>WARNING: A Canvas LMS course is linked this ASCI course. Removing your access token will also desynchronize it</p>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowRemoveModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={confirmRemoval}>Confirm</button>
                        </div>
                    </div>
                </div>
            </div>
            )}
            {showSelectModal && (
            <div className="modal show d-block" tabIndex="-1">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Confirm Canvas LMS course selection</h5>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to select this Canvas LMS course?</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => {setShowSelectModal(false); setSelectedCanvasLmsCourse(null)}}>Cancel</button>
                            <button className="btn btn-primary" onClick={confirmSelectCanvasLmsCourse}>Confirm</button>
                        </div>
                    </div>
                </div>
            </div>
            )}
            {showRemoveCanvasLmsCourseModal && (
            <div className="modal show d-block" tabIndex="-1">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Confirm Canvas LMS course desynchronization</h5>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to desynchronize this Canvas LMS course?</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowRemoveCanvasLmsCourseModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={confirmRemoveCanvasLmsCourse}>Confirm</button>
                        </div>
                    </div>
                </div>
            </div>
            )}
        </div>
    );
}

export default CanvasLmsSync;