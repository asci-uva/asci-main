import React, { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function CanvasLMSSync(props) {
    const [accessToken, setAccessToken] = useState("");
    const [disabled, setDisabled] = useState(false);

    const handleSynchronize = () => {
        setDisabled(true);

        const payload = {
            accessToken: accessToken,
            course_id: props.course_id,
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
        if(disabled)
            return (
                <button type="button" className="btn btn-primary" onClick={handleSynchronize} disabled>Synchronizing (Please Wait)</button>    
            );
        else
            return (
                <button type="button" className="btn btn-primary" onClick={handleSynchronize}>Synchronize Canvas LMS</button>
            );
    }

    return (
        <div className="card">
            <h4 className="card-header">Canvas LMS Synchronization</h4>
            <div className="card-body">
                <form className="">
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
            </div>
        </div>
    );
}

export default CanvasLMSSync;