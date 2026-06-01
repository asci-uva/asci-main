import React, { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function CanvasLMSSync(props) {
    const [canvasCourseId, setCanvasCourseId] = useState("");
    const [accessToken, setAccessToken] = useState("");
    const [disabled, setDisabled] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const synced = props.canvasLMSSynced;

    const handleSynchronize = () => {
        setDisabled(true);

        const payload = {
            canvasCourseId: canvasCourseId,
            accessToken: accessToken,
            courseId: props.course_id,
            command: "fetchCanvasLmsCourseName",
        };

        fetch(props.url, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then((response) => response.json())
            .then((data) => {
                setDisabled(false);
                if (data.success === "true") {
                    console.log("Retrieved Canvas LMS course name successfully");
                    props.setCanvasCourseName(data.courseName);
                    setShowModal(true);
                } else {
                    toast.error("Failed to get course name from Canvas LMS");
                }
            })
            .catch((error) => {
                setDisabled(false);
                toast.error("Error during fetching course info");
            });
    };

    const handleConfirmSynchronize = () => {
        setShowModal(false);
        setDisabled(true);

        const payload = {
            courseId: props.course_id,
            canvasCourseId: canvasCourseId,
            canvasCourseName: props.canvasCourseName,
            accessToken: accessToken,
            command: "setCanvasLmsCourse",
        };

        fetch(props.url, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })
            .then((response) => {
                if (!response.ok) {
                    setDisabled(false);
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then((data) => {
                setDisabled(false);
                if (data.success === "true") {
                    toast.success(data.message);
                    props.setCanvasLMSSynced(true);
                } else {
                    console.log(data.message);
                    toast.error(
                        data.message || "Failed to connect to Canvas LMS."
                    );
                }
            })
            .catch((error) => {
                setDisabled(false);
                console.error("Error during synchronization:", error);
                toast.error("Error during synchronization.")
            });
    };

    const handleDesynchronize = () => {
        setDisabled(true);

        const payload = {
            courseId: props.course_id,
            command: "removeCanvasLmsCourse",
        };

        fetch(props.url, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })
            .then((response) => {
                if (!response.ok) {
                    setDisabled(false);
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then((data) => {
                console.log("data is: ", data);
                setDisabled(false);
                if (data.success === "true") {
                    console.log(data.message);
                } else {
                    console.log(data.message);
                    toast.error(
                        data.message || "Failed to desynchronize from Canvas LMS."
                    );
                }
                props.setCanvasLMSSynced(false);
                setCanvasCourseId("");
                setAccessToken("");
            })
            .catch((error) => {
                console.error("Error during desynchronization:", error);
                setDisabled(false);
                toast.error("Error during desynchronization.")
            });
    };

    function getButton() {
        if (synced) {
            if (disabled)
                return (
                    <button type="button" className="btn btn-primary" disabled>Desynchronizing (Please Wait)</button>    
                );
            return (
                <button type="button" className="btn btn-primary" onClick={handleDesynchronize}>Desynchronize from course</button>  
            );
        }

        if (disabled)
            return (
                <button type="button" className="btn btn-primary" onClick={handleSynchronize} disabled>Synchronizing (Please Wait)</button>    
            );
        return (
            <button type="button" className="btn btn-primary" onClick={handleSynchronize}>Synchronize with course</button>
        );
    }

    return (
    <div className="card">
        <h4 className="card-header">Canvas LMS Synchronization</h4>
        <div className="card-body">
        {synced ? (
            <div>
            <p>Synced with {props.canvasCourseName}</p>
            {getButton()}
            </div>
        ) : (
            <form key={synced}>
            <div className="mb-3">
                <label>Canvas LMS Course ID</label>
                <input className="form-control"
                type="text"
                value={canvasCourseId}
                onChange={(e) => setCanvasCourseId(e.target.value)}
                required
                />
            </div>
            <div className="mb-3">
                <label>Canvas LMS Access Token:</label>
                <input className="form-control"
                type="text"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                required
                />
            </div>
            {getButton()}
            </form>
        )}
        </div>
        {showModal && (
            <div className="modal show d-block" tabIndex="-1">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Confirm Canvas Sync</h5>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to sync with <strong>{props.canvasCourseName}</strong> on Canvas LMS?</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleConfirmSynchronize}>Confirm</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
    );
}

export default CanvasLMSSync;