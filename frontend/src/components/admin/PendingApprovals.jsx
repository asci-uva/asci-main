import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useUser } from "../context/UserContext";

function PendingApprovals(props) {
  let url = props.url;
  let root = "/asci";

  const navigate = useNavigate();
  const {user, getCourse, getCourseSettings, courseRoster, setCourseRoster, refreshCourseRoster} = useUser();
  let course = getCourse();
  const [filteredData, setFilteredData] = useState(null);
  const [quests, setQuests] = useState({});
  const [openStudent, setOpenStudent] = useState(null);

  const settings = getCourseSettings();
  const showQuests = settings != null && settings.show_quests == "t";

  const getUserQuests = (studentId) => {
    // let request = {
    //   command: "getPendingQuests",
    //   student: studentId,
    //   course: course.course_id,
    //   user: user.userid
    // };

    // fetch(url, {
    //   method: 'POST', // or 'PUT'
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   credentials: "include",
    //   body: JSON.stringify(request),
    // }).then(response => response.json())
    //   .then(data => {
    //     if (data.success === "true") {
    //       let questList = {}
    //       for (var key in data.quests) {
    //         // questList[key] = {};
    //         // // Add quest info
    //         // questList[key]["quest_id"] = data.quests[key]["quest_id"];
    //         // questList[key]["name"] = data.quests[key]["name"];
    //         // questList[key]["description"] = data.quests[key]["description"];
    //         // questList[key]["total_points"] = data.quests[key]["total_points"];
    //         // questList[key]["status"] = data.quests[key]["status"];
    //         // questList[key]["student"] = studentId;
    //       }

    //       //setQuests(prev => ({...prev, [studentId]: questList}));
    //     }
    //     else {
    //       console.log("Get User Quest: Server returned error");
    //       navigate(root + "/error");
    //     }
    //   })
    //   .catch((error) => {
    //     console.log("Get User Quest: There was an error:", error);
    //     navigate(root + "/error");
    //   });
  };

  const handleUpdate = async (questId, studentId, status) => {
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

  const handleBatchApproval = async (students) => {
    Object.keys(students).filter(k => students[k].role == 'student' && quests[students[k].computing_id]).forEach(k => {
        const stud = students[k];
        const allQuests = quests[stud.computing_id] || [];
        Object.values(allQuests).forEach(q => handleUpdate(q.quest_id, stud.computing_id, "Completed"));
    });
  };

  useEffect(() => {
    //If token is set, kick to home screen to check validity of session
    if (user) {
      refreshCourseRoster();
    }
    else {
      navigate(root + "/login");
    }
  }, []);

  useEffect(() => {
    if (!showQuests) return;

    Object.keys(courseRoster).filter(k => courseRoster[k].role == "student")
    .forEach(k => {
        const student = courseRoster[k];
        getUserQuests(student.computing_id);
    });
  }, [courseRoster, props.refresh, showQuests]);

  const PendingTableHeaderRow = () => {
    return (
        <tr>
          <th>Quest Name</th>
          <th>Description</th>
          <th>Total Points</th>
          <th>Status</th>
          <th>Approve?</th>
          <th>Reject?</th>
        </tr>
      );
  }

  const PendingView = ({data}) => {
    return Object.keys(data).filter(k => data[k].role == 'student' && (quests[data[k].computing_id] && Object.values(quests[data[k].computing_id]).length > 0)).map(k =>
        <div className="accordion-item" key={k}>
            <h2 className="accordion-header">
            <button id="PendingList" className="accordion-button" onClick={() => setOpenStudent(k)} type="button" data-bs-toggle="collapse" data-bs-target={"#collapse"+k} aria-expanded="false" aria-controls={"collapse" + k}>
                {data[k].fname} {data[k].lname} ({data[k].computing_id})
            </button>
            </h2>
            <div id={"collapse"+k} className={`accordion-collapse collapse ${openStudent == k ? 'show' : ''}`} aria-labelledby={"stud-heading"+k} data-bs-parent="#pendingAccordion">
            <div className="accordion-body">
                <button type="button" className="btn btn-primary float-end" onClick={() => handleBatchApproval([data[k]])}>Approve All</button>
                <table id="PendingTable" className="table table-striped table-hover table-sm">
                <thead>
                <PendingTableHeaderRow/>
                </thead>
                <tbody className="table-group-divider">
                <PendingTableRow data={quests[data[k].computing_id] || {}}/>
                </tbody>
                </table>
            </div>
            </div>
        </div>
    );
  }

  const PendingTableRow = ({data}) => {
    return Object.keys(data).map(k =>
      <tr key={k}>
        <td><b>{data[k].name}</b></td>
        <td>{data[k].description}</td>
        <td>{data[k].total_points}</td>
        <td>{data[k].status}</td>
        <td>
            <button type="button" className="btn btn-primary" onClick={() => handleUpdate(data[k].quest_id, data[k].student, "Completed")}>Approve</button>
        </td>
        <td>
            <button type="button" className="btn btn-danger" onClick={() => handleUpdate(data[k].quest_id, data[k].student, "Not started")}>Reject</button>
        </td>
      </tr>
    );
  }

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

  const ShowPending = () => {
    if (showQuests) {
      var students = courseRoster;
      if(filteredData != null)
      {
        students = filteredData;
      }

      return (
        <div className="container p-4">
          <div className="row">
            <div className="card mb-4">
                <h4 className="card-header">Pending Approvals <button type="button" className="btn btn-primary float-end" onClick={() => handleBatchApproval(students)}>Approve All Requests</button></h4>
                <div className="card-body">
                  <div>
                      <input
                        id="PendingSearchTextBox"
                        type="text" className="mb-1 mt-2"
                        onChange={onSearchBarChange}
                        placeholder="Search..." />
                    </div>
                    <div className="accordion" id="pendingAccordion">
                        <PendingView data={students}/>
                    </div>
                </div>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div>
      {ShowPending()}
    </div>
  )

}

export default PendingApprovals;
