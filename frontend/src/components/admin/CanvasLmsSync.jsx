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

    useEffect(() => {
        if (props.hasCanvasLmsAccessToken)
            getEnrollmentYears();
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
                    props.setCanvasLmsSynced(false);
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

        fetch(props.url, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success === "true") {
                    console.log(data);
                    setTerms(data.terms);
                    setYears([...new Set(Object.keys(data.terms).map(term => term.split(" ")[0]))].sort().reverse());
                    setTermNames([...new Set(Object.keys(data.terms).map(term => term.split(" ")[1]))]);
                } else {
                    toast.error(data.error);
                }
            })
            .catch((error) => {
                toast.error(error);
            });
    };

    const searchCanvasLmsCourses = () => {
        const termKey = `${selectedYear} ${selectedTermName}`;
        const termId = terms[termKey];

        const payload = {
            asciCourseId: props.course_id,
            termId: termId,
            command: "searchCanvasLmsCourses",
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
                    console.log(data);
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

    function get_search_courses_button() {
        return <button type="button" className="btn btn-primary" onClick={searchCanvasLmsCourses}>Search</button>;
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
                <h5>Search for course</h5>
                <div className="mb-3">
                    <label>Filter Semester</label>
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
                        {get_search_courses_button()}
                    </div>
                </div>
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
                            <h5 className="modal-title">Confirm Canvas access token removal</h5>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to remove this Canvas LMS access token?</p>
                            <p>Note: The access token is directly tied to your ASCI account</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowRemoveModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={confirmRemoval}>Confirm</button>
                        </div>
                    </div>
                </div>
            </div>
            )}
        </div>
    );
}

// function CanvasLmsSync(props) {
//     const [canvasCourseId, setCanvasCourseId] = useState("");
//     const [accessToken, setAccessToken] = useState("");
//     const [selectedTerm, setSelectedTerm] = useState("");
//     const [selectedYear, setSelectedYear] = useState("");
//     const [disabled, setDisabled] = useState(false);
//     const [showModal, setShowModal] = useState(false);
//     const synced = props.canvasLmsSynced;

//     const terms = ["Fall", "Spring", "Summer"];
//     const years = ["2020", "2023", "2021", "2022"].sort().reverse();

//     const handleSynchronize = () => {
//         const trimmedCourseId = canvasCourseId.trim();
//         const trimmedAccessToken = accessToken.trim()

//         setCanvasCourseId(trimmedCourseId);
//         setAccessToken(trimmedAccessToken);

//         const payload = {
//             canvasCourseId: canvasCourseId,
//             accessToken: accessToken,
//             courseId: props.course_id,
//             command: "fetchCanvasLmsCourseName",
//         };
//     };

//     const handleConfirmSynchronize = () => {
//         setShowModal(false);
//         setDisabled(true);

//         const payload = {
//             courseId: props.course_id,
//             canvasCourseId: canvasCourseId,
//             canvasCourseName: props.canvasCourseName,
//             accessToken: accessToken,
//             command: "setCanvasLmsCourse",
//         };

//         fetch(props.url, {
//             method: "POST",
//             credentials: "include",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify(payload),
//         })
//             .then((response) => response.json())
//             .then((data) => {
//                 setDisabled(false);
//                 if (data.success === "true") {
//                     console.log(data.message);
//                     toast.success(data.message);
//                     props.setCanvasLmsSynced(true);
//                 } else {
//                     console.log(data.error);
//                     toast.error(data.error);
//                 }
//             })
//             .catch((error) => {
//                 setDisabled(false);
//                 console.error("Error during synchronization:", error);
//                 toast.error("Error during synchronization:", error)
//             });
//     };

//     const handleDesynchronize = () => {
//         setShowModal(true);
//     };

//     const handleConfirmDesynchronize = () => {
//         setDisabled(true);

//         const payload = {
//             courseId: props.course_id,
//             command: "removeCanvasLmsCourse",
//         };

//         fetch(props.url, {
//             method: "POST",
//             credentials: "include",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify(payload),
//         })
//             .then((response) => response.json())
//             .then((data) => {
//                 setDisabled(false);
//                 setShowModal(false);
//                 if (data.success === "true") {
//                     console.log(data.message);
//                     toast.success(data.message);
//                 } else {
//                     console.log(data.error);
//                     toast.error(data.error);
//                 }
//                 props.setCanvasLmsSynced(false);
//                 setCanvasCourseId("");
//                 setAccessToken("");
//             })
//             .catch((error) => {
//                 setDisabled(false);
//                 console.error("Error during desynchronization:", error);
//                 toast.error("Error during desynchronization:", error)
//             });
//     };

//     function getButton() {
//         if (synced) {
//             if (disabled)
//                 return (
//                     <button type="button" className="btn btn-primary" disabled>Desynchronizing (Please Wait)</button>    
//                 );
//             return (
//                 <button type="button" className="btn btn-primary" onClick={handleDesynchronize}>Desynchronize from course</button>  
//             );
//         }

//         if (disabled)
//             return (
//                 <button type="button" className="btn btn-primary" onClick={handleSynchronize} disabled>Synchronizing (Please Wait)</button>    
//             );
//         return (
//             <button type="button" className="btn btn-primary" onClick={handleSynchronize}>Synchronize with course</button>
//         );
//     }

//     return (
//     <div className="card">
//         <h4 className="card-header">Canvas LMS Synchronization</h4>
//         <div className="card-body">
//         {synced ? (
//             <div>
//             <p>Synced with {props.canvasCourseName}</p>
//             {getButton()}
//             </div>
//         ) : (
//             <form key={synced}>
//             {/* <div className="mb-3">
//                 <label>Canvas LMS Course ID</label>
//                 <input className="form-control"
//                 type="text"
//                 value={canvasCourseId}
//                 onChange={(e) => setCanvasCourseId(e.target.value)}
//                 required
//                 />
//             </div> */}
//             <div className="mb-3">
//                 <label>Canvas LMS Access Token:</label>
//                 <input className="form-control"
//                 type="text"
//                 value={accessToken}
//                 onChange={(e) => setAccessToken(e.target.value)}
//                 required
//                 />
//             </div>
//             <div className="mb-3 d-flex gap-2">
//                 <select className="form-select" value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)}>
//                     <option value="">Select Term</option>
//                     {terms.map((term) => (
//                         <option key={term} value={term}>{term}</option>
//                     ))}
//                 </select>

//                 <select className="form-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
//                     <option value="">Select Year</option>
//                     {years.map((year) => (
//                         <option key={year} value={year}>{year}</option>
//                     ))}
//                 </select>
//             </div>
//             {getButton()}
//             </form>
//         )}
//         </div>
//         {showModal && !synced && (
//             <div className="modal show d-block" tabIndex="-1">
//                 <div className="modal-dialog">
//                     <div className="modal-content">
//                         <div className="modal-header">
//                             <h5 className="modal-title">Confirm Canvas Sync</h5>
//                         </div>
//                         <div className="modal-body">
//                             <p>Are you sure you want to sync with <strong>{props.canvasCourseName}</strong> on Canvas LMS?</p>
//                         </div>
//                         <div className="modal-footer">
//                             <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
//                             <button className="btn btn-primary" onClick={handleConfirmSynchronize}>Confirm</button>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         )}
//         {showModal && synced && (
//             <div className="modal show d-block" tabIndex="-1">
//                 <div className="modal-dialog">
//                     <div className="modal-content">
//                         <div className="modal-header">
//                             <h5 className="modal-title">Confirm Canvas Desync</h5>
//                         </div>
//                         <div className="modal-body">
//                             <p>Are you sure you want to desync from <strong>{props.canvasCourseName}</strong> on Canvas LMS?</p>
//                         </div>
//                         <div className="modal-footer">
//                             <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
//                             <button className="btn btn-primary" onClick={handleConfirmDesynchronize}>Confirm</button>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         )}
//     </div>
//     );
// }

export default CanvasLmsSync;