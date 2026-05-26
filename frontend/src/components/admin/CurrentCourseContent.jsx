import React, { useState, useEffect } from "react";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../context/UserContext";

function CurrentCourseContent(props) {
    const {user, getCourse} = useUser();
    const [courseFiles, setCourseFiles] = useState([]);
    let course = getCourse();
    
    function refreshCourseContent() {
        if (!user || !course) return;
        
        const payload = {
            command: "getCourseContent",
            user: user.userid,
            course: course.course_id
        };

        fetch(props.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(payload),
        })
        .then((response) => response.json())
        .then((data) => {
            if (data) {
                console.log("Course content fetched successfully!");
                setCourseFiles(data.files);
            } else {
                console.error("Error fetching the course content");
            }
        })
        .catch((error) => {
            console.error("There was an error:", error);
        });
    }

    const deleteFile = (filename) => {
        if (!filename) return;
        
        console.log("Selected file: " + filename);
        const payload = {
            command: "removeCourseContent",
            user: user.userid,
            course: course.course_id,
            filename: filename
        };

        try {
            fetch(props.url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(payload),
            })
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
                if (data.success) {
                    console.log("File removed successfully!");
                    refreshCourseContent();
                } else {
                    console.error("Error removing the file");
                }
            })
            .catch((error) => {
                console.error("There was an error:", error);
            });
        }
        catch (error)
        {
            console.error("There was an error:", error);
        }
    }

    useEffect(() => {
        refreshCourseContent();
    }, [props.refresh]);

    
    const ContentTableHeaderRow = () => {
        return (
            <tr>
            <th>File Name</th>
            <th>File Type</th>
            <th>Delete?</th>
            </tr>
        );
    }

    const ContentTableRow = ({data}) => {
        return Object.keys(data).map(k =>
        <tr key={k}>
            <td>{data[k].split('.')[0]}</td>
            <td>{data[k].split('.')[1]}</td>
            <td>
                <div className="input-group mb-3"> 
                    <button type="button" className="btn btn-danger" onClick={() => deleteFile(data[k])}>Delete</button>
                </div> 
            </td>
        </tr>);
    }

    const ContentTable = ({data = []}) => {    
        if(data.length > 0){
            return (
                <table id="contentTable" className="table table-striped table-hover table-sm">
                <thead>
                    <ContentTableHeaderRow />
                </thead>
                <tbody className="table-group-divider">
                    <ContentTableRow data={data} />
                </tbody>
                </table>
            );
        }
        else return (
        <h5>There does not appear to be any content uploaded yet. </h5>
        );
    }

    return (
        <div className="card mb-4">
            <h4 className="card-header">Course Content Uploaded</h4>
            <div className="card-body">
            <form className="mb-3">
                <p className="form-label">Course Content</p>
                <div style={{height: 500 + 'px'}} className="overflow-auto">
                    <ContentTable data={courseFiles} />
                </div>
            </form>
        </div>
        </div>
    );
}

export default CurrentCourseContent; 
