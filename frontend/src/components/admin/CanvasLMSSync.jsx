import React, { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function CanvasLMSSync(props) {
    const [canvasCourseId, setCanvasCourseId] = useState("");
    const [accessToken, setAccessToken] = useState("");
    const [disabled, setDisabled] = useState(false);
    const [synced, setSynced] = useState(false);

    const handleSynchronize = () => {
        setDisabled(true);

        const payload = {
            canvasCourseId: canvasCourseId,
            accessToken: accessToken,
            courseId: props.course_id,
            command: "setCanvasLMSAccessToken",
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
                    toast.success(data.message);
                    setSynced(true);
                    console.log(data.message);
                    console.log("Missing students:", data.missingStudents);
                } else {
                    console.log(data.message);
                    toast.error(
                        data.message || "Failed to connect to Canvas LMS."
                    );
                }
            })
            .catch((error) => {
                console.error("Error during synchronization:", error);
                setDisabled(false);
                toast.error("Error during synchronization.")
            });
    };

    function getButton() {
        if (synced) {
            if (disabled)
                return (
                    <button type="button" className="btn btn-primary" disabled>Desynchronizing (Please Wait)</button>    
                );
            return (
                <button type="button" className="btn btn-primary" onClick={handleDesynchronize}>Desynchronize Canvas LMS</button>  
            );
        }

        if (disabled)
            return (
                <button type="button" className="btn btn-primary" disabled>Synchronizing (Please Wait)</button>    
            );
        return (
            <button type="button" className="btn btn-primary" onClick={handleSynchronize}>Synchronize Canvas LMS</button>
        );
    }

    return (
    <div className="card">
        <h4 className="card-header">Canvas LMS Synchronization</h4>
        <div className="card-body">
        {synced ? (
            <div>
            <p>Canvas LMS is synced.</p>
            {getButton()}
            </div>
        ) : (
            <form>
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
    </div>
    );
}

export default CanvasLMSSync;