import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useUser } from "../context/UserContext";

function ManagePoints(props) {
  let url = props.url;
  let root = "/asci";
  let pageURL = root + "/admin/ManagePoints";

  const navigate = useNavigate();
  const {user, getCourse, courseRoster, setCourseRoster, refreshCourseRoster} = useUser();
  let course = getCourse();
  const [filteredData, setFilteredData] = useState(null);
  const [points, setPoints] = useState([]);
  const [quests, setQuests] = useState({});
  const [showQuests, setShowQuests] = useState(false);
  const [openStudent, setOpenStudent] = useState(null);

  const getSettings = () => {
    let request = {
      command: "getCourseSettings",
      user: user.userid,
      courseId: course.course_id
    };
    
    fetch(url, {
      method: 'POST', // or 'PUT'
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: "include",
      body: JSON.stringify(request),
    }).then(response => response.json())
      .then(data => {
        if (data.success === "true") {
          if(data.settings.show_quests == "t"){
            setShowQuests(true);
          }

        }
        else {
          console.log("HOME: Server returned error");
          navigate(root + "/error");
        }
      })
      .catch((error) => {
        console.log("HOME: There was an error:", error);
        navigate(root + "/error");

      });
  }

  const getUserQuests = (studentId) => {
    let request = {
      command: "getStudentQuests",
      student: studentId,
      course: course.course_id,
      user: user.userid
    };

    fetch(url, {
      method: 'POST', // or 'PUT'
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: "include",
      body: JSON.stringify(request),
    }).then(response => response.json())
      .then(data => {
        if (data.success === "true") {
          let questList = {}
          for (var key in data.quests) {
            questList[key] = {};
            // Add quest info
            questList[key]["quest_id"] = data.quests[key]["quest_id"];
            questList[key]["name"] = data.quests[key]["name"];
            questList[key]["description"] = data.quests[key]["description"];
            questList[key]["total_points"] = data.quests[key]["total_points"];
            questList[key]["status"] = data.quests[key]["status"];
            questList[key]["updated_status"] = "";
            questList[key]["student"] = studentId;
          }

          setQuests(prev => ({...prev, [studentId]: questList}));
        }
        else {
          console.log("Get User Quest: Server returned error");
          navigate(root + "/error");
        }
      })
      .catch((error) => {
        console.log("Get User Quest: There was an error:", error);
        navigate(root + "/error");
      });
  };

  const getUserPoints = (studentId) => {
    let request = {
      command: "getPointsForStudent",
      student: studentId,
      course: course.course_id,
      user: user.userid
    };

    fetch(url, {
      method: 'POST', // or 'PUT'
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: "include",
      body: JSON.stringify(request),
    }).then(response => response.json())
      .then(data => {
        if (data.success === "true") {
            setPoints(prev => ({...prev, [studentId]: data.points}));
        }
        else {
          console.log("Get User Points: Server returned error");
          navigate(root + "/error");
        }
      })
      .catch((error) => {
        console.log("Get User Points: There was an error:", error);
        navigate(root + "/error");
      });
  };

  const handleUpdate = (questId, studentId, status) => {
      const request = {
        command: "updateQuestStatus",
        questId: questId,
        course: course.course_id,
        student: studentId,
        status: status,
        user: user.userid
      };
  
      fetch(props.url, {
      method: "POST",
      credentials: "include",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      })
      .then((response) => response.json())
      .then((data) => {
          if (data.success) {
          setQuests(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [questId]: {
                ...prev[studentId][questId],
                status: status
                }
            }
          }));
          getUserPoints(studentId);
          } else {
          console.log("Error updating the user quest status");
          navigate(root + "/error");
          }
      })
      .catch((error) => {
          console.log("Error updating the user quest status", error);
          navigate(root + "/error");
      });

  };

  useEffect(() => {
    //If token is set, kick to home screen to check validity of session
    if (user) {
      getSettings();
      refreshCourseRoster();
    }
    else {
      navigate(root + "/login");
    }
  }, []);

  useEffect(() => {
    Object.keys(courseRoster).filter(k => courseRoster[k].role == "student")
    .forEach(k => {
        const student = courseRoster[k];
        getUserQuests(student.computing_id);
        getUserPoints(student.computing_id);
    });
  }, [courseRoster, props.refresh]);

  const StudPtTableHeaderRow = () => {
    return (
        <tr>
          <th>Quest Name</th>
          <th>Description</th>
          <th>Total Points</th>
          <th>Status</th>
          <th>Update Status?</th>
        </tr>
      );
  }

  const StudPtView = ({data}) => {
    return Object.keys(data).filter(k => data[k].role == 'student').map(k =>
      <div className="accordion-item" key={k}>
        <h2 className="accordion-header">
          <button id="StudPtList" className="accordion-button" onClick={() => setOpenStudent(k)} type="button" data-bs-toggle="collapse" data-bs-target={"#collapse"+k} aria-expanded="false" aria-controls={"collapse" + k}>
            {data[k].fname} {data[k].lname} ({data[k].computing_id}) - ({points[data[k].computing_id] || 0})
          </button>
        </h2>
        <div id={"collapse"+k} className={`accordion-collapse collapse ${openStudent == k ? 'show' : ''}`} aria-labelledby={"stud-heading"+k} data-bs-parent="#studptAccordion">
          <div className="accordion-body">
            <table id="StudPtTable" className="table table-striped table-hover table-sm">
              <thead>
              <StudPtTableHeaderRow/>
              </thead>
              <tbody className="table-group-divider">
              <StudPtTableRow data={quests[data[k].computing_id] || {}}/>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const StudPtTableRow = ({data}) => {
    return Object.keys(data).map(k =>
      <tr key={k}>
        <td><b>{data[k].name}</b></td>
        <td>{data[k].description}</td>
        <td>{data[k].total_points}</td>
        <td>{data[k].status}</td>
        <td>
            <div className="d-flex align-items-center gap-2">
                <select
                className="form-select form-select-sm w-auto"
                value={data[k].updated_status || ""}
                onChange={(e) => {
                    setQuests(prev => ({
                        ...prev,
                        [data[k].student]: {
                            ...prev[data[k].student],
                            [data[k].quest_id]: {
                            ...prev[data[k].student][data[k].quest_id],
                            updated_status: e.target.value
                            }
                        }
                    }));
                }}
                >
                <option></option>
                <option value="Completed">Completed</option>
                <option value="In progress">In progress</option>
                <option value="Not started">Not started</option>
                {/* <option value="Locked">Locked</option> */}
                </select>
                <button type="button" className="btn btn-primary" onClick={() => handleUpdate(data[k].quest_id, data[k].student, data[k].updated_status)}>Update</button>
            </div>
        </td>
      </tr>
    );
  }

  // source used to help download student point data: https://learnreactui.dev/contents/how-to-download-a-file-in-react
  const handleDownload = () => {
    //convert data into csv file first
    const headers = ["Computing ID", "First Name", "Last Name", "Earned Points", "Quest Name", "Description", "Total Points", "Status"];
    const rows = [];

    Object.keys(courseRoster).forEach(k =>
      {
        const student = courseRoster[k];

        if (student.role !== "student") return;

        const computing_id = student.computing_id;
        const fname = student.fname;
        const lname = student.lname;
        const earnedpt = points[computing_id] || 0;

        const studentQuests = quests[computing_id] || {};
        if(Object.keys(studentQuests).length === 0) {
          rows.push([computing_id, fname, lname, earnedpt, "", "", "", ""].join(","));
        }
        else
        {
          Object.values(studentQuests).forEach(q => {
            // source used for removing all non-alphanumberic characters (excluding spaces) so csv formats correctly: https://stackoverflow.com/questions/9364400/remove-not-alphanumeric-characters-from-string
            let name = q.name.replace(/[^0-9a-z\s]/gi, '');
            let desc = q.description.replace(/[^0-9a-z\s]/gi, '')
            rows.push([computing_id, fname, lname, earnedpt, name, desc, q.total_points, q.status].join(","));
          });
        }
      }
    );

    const csvFile = [headers.join(","), ...rows].join("\n");
    
    //download the file
    fetch(pageURL)
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(new Blob([csvFile], { type: 'text/csv'}));
        const link = document.createElement("a");
        link.href = url;
        link.download = course.mnemonic + " " + course.number + " " + course.name + " (" + course.semester + ")-Student Points";
        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error("Error downloading student points:", error);
      });

  };

  const onSearchBarChange = (e) => {
    console.log("searching!");
    const value = e.target.value.toLowerCase();

    if (value === "") {
      setFilteredData(null);
      return;
    }

    const roster = Object.keys(courseRoster).filter(k => {
      const student = courseRoster[k];
      return (
        student.fname.toLowerCase().includes(value) ||
        student.lname.toLowerCase().includes(value) ||
        student.computing_id.toLowerCase().includes(value)
      );
    }).reduce((student, k) => {
      student[k] = courseRoster[k];
      return student;
    }, {});

    setFilteredData(roster);
  }

  const ShowStudentPoints = () => {
    if (showQuests) {
      var students = courseRoster;
      if(filteredData != null)
      {
        students = filteredData;
      }
      var instructors = Object.keys(courseRoster).find(k => courseRoster[k].role == "instructor" && courseRoster[k].computing_id == user.userid);
      
      return (
        <div className="container p-4">
          <div className="row">
            <div className="card mb-4">
                <h4 className="card-header">Student List {instructors && (<button type="button" className="btn btn-primary float-end" onClick={handleDownload}>Download Student Points</button> )}</h4>
                <div className="card-body">
                  <div>
                      <input
                        id="StudPointSearchTextBox"
                        type="text" className="mb-1 mt-2"
                        onChange={onSearchBarChange}
                        placeholder="Search..." />
                    </div>
                    <div className="accordion" id="studptAccordion">
                        <StudPtView data={students}/>
                    </div>
                </div>
            </div>
          </div>
        </div>
      );
    }
    else return (
      <div className="page-container">
        <h4>Quests are disabled for this course. Enable them in Admin to manage student points.</h4>
      </div>
    );
  }

  return (
    <div>
      {ShowStudentPoints()}
    </div>
  )

}

export default ManagePoints;
