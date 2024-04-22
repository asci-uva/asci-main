import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function StudentPoints(props) {
    let docRoot = props.documentRoot;
    let url = props.url;
    let debugMode = props.debugMode;
    let root = "/asci";

    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [pointCount, setPointCount] = useState(0);

    useEffect(() => {
        //If token is set, kick to home screen to check validity of session
        if (localStorage.getItem('asci-user') !== null) {
            setUser(localStorage.getItem('asci-user'));

            //setup json command
            let request = {};
            request.command = "getPointsForUser";
            request.user = localStorage.getItem('asci-user');
            request.courseId = localStorage.getItem('asci-course');
            getPoints(request, url);
        }
        else {
            navigate(docRoot + "/login");
        }
    }, []);

    const getPoints = (json0, url0) => {
        fetch(url0, {
            method: 'POST', // or 'PUT'
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(json0),
        }).then(response => response.json())
            .then(data => {
                console.log("Data is: ", data);
                let success = data.success;

                if (success === "true") {
                    console.log("Get Points: Successfully fetched user quest points");
                    setPointCount(data.points);
                }
                else {
                    console.log("Get Points: Server returned error");
                    navigate(docRoot + "/error");
                }
            })
            .catch((error) => {
                console.log("Get Points: There was an error:", error);
                navigate(docRoot + "/error");
            });
    };

    return (
        <div className="pointCount">
            <h5 className="card-title">Points Earned: {pointCount}</h5>
        </div>
    );
}

export default StudentPoints;