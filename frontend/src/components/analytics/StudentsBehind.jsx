//GPT-5.1 used to create cusomizability for sorting students by different criteria (low scores, office hours visits, Piazza activity) and to implement the search bar functionality.
import React, { useState } from "react";
import { useEffect, useRef } from "react";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../context/UserContext";
import c3 from 'c3';
import 'c3/c3.css';

function StudentsBehind(props) {
  
  const {user, getCourse} = useUser();
  const [studentsBehind, setStudentsBehind] = useState(null);
  const [sortOption, setSortOption] = useState("combined");
  const [lowScoreThreshold, setLowScoreThreshold] = useState("any");
  const [ohThreshold, setOhThreshold] = useState("any");
  const [piazzaPostsThreshold, setPiazzaPostsThreshold] = useState("any");
  const [piazzaAsksThreshold, setPiazzaAsksThreshold] = useState("any");
  const [piazzaAnswersThreshold, setPiazzaAnswersThreshold] = useState("any");
  const [piazzaActivityThreshold, setPiazzaActivityThreshold] = useState("any");
  const [examAvgThreshold, setExamAvgThreshold] = useState("any");
  const [quizAvgThreshold, setQuizAvgThreshold] = useState("any");
  const [showPiazzaBreakdown, setShowPiazzaBreakdown] = useState(false);
  let course = getCourse();
  let url = props.url;
  
  //This function runs on page load!
  useEffect(() => {
    let request = {};
    request.command = "getStudentsFallingBehind";
    request.user = user.userid;
    request.courseId = course.course_id;

    console.log("Payload is: ", request);

    fetch(url, {
      method: "POST", // or 'PUT'
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Data is: ", data);
        
        if (data.success) {
          console.log("Received studs failing behind");

          /* DO SOMETHING HERE?? */
          if(studentsBehind == null)
            setStudentsBehind(data.students);

        } else {
          console.log("Stud. Falling Behind: Server returned error");
        }
      })
      .catch((error) => {
        console.log("Stud. Falling Behind: There was an error:", error);
      });

  });

    

    /* Handle searching through the table */
  /* ---------------------------------- */
  const onSearchBarChange = (e) => {
    console.log("searching!");
    var input, filter, table, tr, td, i, txtValue;
    input = document.getElementById("SBSearchTextBox");
    filter = input.value.toUpperCase();
    table = document.getElementById("SBTable");
    tr = table.getElementsByTagName("tr");

    // Loop through all table rows, and hide those who don't match the search query
    for (i = 0; i < tr.length; i++) {
      var tdAll = tr[i].getElementsByTagName("td");
      var match = false;
      for(var j = 0; j < tdAll.length; j++){
        td = tdAll[j];
        if (td) {
          txtValue = td.textContent || td.innerText;
          if (txtValue.toUpperCase().indexOf(filter) > -1) {
            match = true;
            break;
            
          } else {
            //keep searching
            
          }
        }
      }

      if(match) tr[i].style.display = "";
      else tr[i].style.display = "none";
    }
  }
  /* ---------------------------------- */
  /* ---------------------------------- */


  const formatExamAvg = (val) => {
    if (val === null || val === undefined) return "-";
    const num = Number(val);
    if (Number.isNaN(num)) return "-";
    return num.toFixed(1);
  };

  // compute a sorted copy of the data based on instructor-selected criteria
  const getSortedStudents = (data) => {
    if (!data) return data;

    // ensure we are working with a shallow-copied array
    const arr = Array.isArray(data) ? [...data] : Object.keys(data).map((k) => data[k]);

    const safe = (v) => (v == null ? 0 : v);
    const piazzaActivity = (s) => safe(s.posts) + safe(s.asks) + safe(s.answers);

    switch (sortOption) {
      case "lowScores":
        // students with the most low scores first
        arr.sort((a, b) => safe(b.subcount) - safe(a.subcount));
        break;
      case "fewOH":
        // students with the fewest office hours visits first
        arr.sort((a, b) => safe(a.ohcount) - safe(b.ohcount));
        break;
      case "lowPiazza":
        // students with the least Piazza activity (posts + asks + answers) first
        arr.sort((a, b) => piazzaActivity(a) - piazzaActivity(b));
        break;
      case "combined":
      default:
        // simple combined "risk" score:
        //  - more low scores increases risk
        //  - more OH visits / Piazza activity decreases risk
        const score = (s) => {
          const low = safe(s.subcount);
          const oh = safe(s.ohcount);
          const piaz = piazzaActivity(s);
          return low * 2 - oh - piaz;
        };
        arr.sort((a, b) => score(b) - score(a));
        break;
    }

    return arr;
  };


  // apply a threshold-based filter based on instructor-selected metric
  const getFilteredStudents = (data) => {
    if (!data) return data;

    const safe = (v) => (v == null ? 0 : v);
    const piazzaActivity = (s) => safe(s.posts) + safe(s.asks) + safe(s.answers);
    const parseThresh = (val) => {
      const t = parseInt(val, 10);
      return isNaN(t) ? null : t;
    };

    const lowT = parseThresh(lowScoreThreshold);
    const ohT = parseThresh(ohThreshold);
    const postsT = parseThresh(piazzaPostsThreshold);
    const asksT = parseThresh(piazzaAsksThreshold);
    const answersT = parseThresh(piazzaAnswersThreshold);
    const activityT = parseThresh(piazzaActivityThreshold);
    const examAvgT = parseThresh(examAvgThreshold);
    const quizAvgT = parseThresh(quizAvgThreshold);

    return data.filter((s) => {
      const low = safe(s.subcount);
      const oh = safe(s.ohcount);
      const posts = safe(s.posts);
      const asks = safe(s.asks);
      const answers = safe(s.answers);
      const totalPiazza = piazzaActivity(s);
      const examAvg = safe(s.exam_avg);
      const quizAvg = safe(s.quiz_avg);

      // low scores: keep students with at least threshold low-score assignments
      if (lowT !== null && low < lowT) return false;

      // office hours: keep students with fewer than threshold OH visits
      if (ohT !== null && oh >= ohT) return false;

      // Piazza posts: keep students with posts below threshold
      if (postsT !== null && posts >= postsT) return false;

      // Piazza questions: keep students with asks below threshold
      if (asksT !== null && asks >= asksT) return false;

      // Piazza answers: keep students with answers below threshold
      if (answersT !== null && answers >= answersT) return false;

      // Total Piazza activity: keep students with total activity below threshold
      if (activityT !== null && totalPiazza >= activityT) return false;

      // Exam average: keep students whose exam average is at or below threshold
      if (examAvgT !== null && examAvg > examAvgT) return false;

      // Quiz average: keep students whose quiz average is at or below threshold
      if (quizAvgT !== null && quizAvg > quizAvgT) return false;

      return true;
    });
  };


  //BEGIN HTML
  //----------------------------------

  const SBTableHeaderRow = ({ showPiazzaBreakdown }) => {
    return (
        <tr>
          <th>Comp. Id.</th>
          <th>First Name</th>
          <th>Last Name</th>
          <th>Num. Low Scores</th>
          <th>OH Visits</th>
          <th>Piazza Interactions</th>
          {showPiazzaBreakdown && (
            <>
              <th>Piazza Posts</th>
              <th>Piazza Asks</th>
              <th>Piazza Answers</th>
            </>
          )}
          <th>Exam Avg (%)</th>
          <th>Quiz Avg (%)</th>
          <th>HW Avg (%)</th>
        </tr>
      );
  }


  const SBTableRow = ({data, showPiazzaBreakdown}) => {
    return Object.keys(data).map(k => {
      const student = data[k];
      const safe = (v) => (v == null ? 0 : v);
      const totalPiazza = safe(student.posts) + safe(student.asks) + safe(student.answers);

      return (
        <tr key={k}>
          <td><b>{student.computing_id}</b></td>
          <td>{student.fname}</td>
          <td>{student.lname}</td>
          <td>{student.subcount}</td>
          <td>{student.ohcount}</td>
          <td>{totalPiazza}</td>
          {showPiazzaBreakdown && (
            <>
              <td>{student.posts}</td>
              <td>{student.asks}</td>
              <td>{student.answers}</td>
            </>
          )}
          <td>{formatExamAvg(student.exam_avg)}</td>
          <td>{formatExamAvg(student.quiz_avg)}</td>
          <td>{formatExamAvg(student.homework_avg)}</td>
        </tr>
      );
    });
  }

  const SBTable = ({data, showPiazzaBreakdown}) => {    
    const sortedData = getSortedStudents(data);
    const filteredData = getFilteredStudents(sortedData);

    if(filteredData != null && filteredData.length > 0){
      return (
            <table id="SBTable" className="table table-striped table-hover table-sm">
              <thead>
                <SBTableHeaderRow showPiazzaBreakdown={showPiazzaBreakdown} />
              </thead>
              <tbody className="table-group-divider">
                <SBTableRow data={filteredData} showPiazzaBreakdown={showPiazzaBreakdown} />
              </tbody>
            </table>
          
      );
    }
    else return (
      <h5>There does not appear to be anyone falling behind, perhaps because grade data is not synced yet. </h5>
    );
  }

  return (
      <div className="card">
        <h4 className="card-header">View Students Falling Behind</h4>
        <div className="card-body">
          <div className="mb-2 d-flex flex-wrap align-items-center">
            <label className="me-2 mb-1">Sort by:</label>
            <select
              className="form-select form-select-sm w-auto"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="combined">Overall risk (low scores + activity)</option>
              <option value="lowScores">Most low scores</option>
              <option value="fewOH">Least office hours visits</option>
              <option value="lowPiazza">Least Piazza activity</option>
            </select>
          </div>
          <div className="mb-2 d-flex flex-wrap align-items-center">
            <input
              id="piazzaBreakdownToggle"
              type="checkbox"
              className="form-check-input me-2"
              checked={showPiazzaBreakdown}
              onChange={(e) => setShowPiazzaBreakdown(e.target.checked)}
            />
            <label htmlFor="piazzaBreakdownToggle" className="form-check-label mb-1">
              Show Piazza breakdown (posts / questions / answers)
            </label>
          </div>
          <div className="mb-2">
            <strong>Filters</strong>
          </div>
          <div className="row">
            <div className="col-md-6">
              <div className="mb-1 d-flex flex-wrap align-items-center">
                <span className="me-2 mb-1">Homework Avg ≥</span>
                <select
                  className="form-select form-select-sm w-auto"
                  value={lowScoreThreshold}
                  onChange={(e) => setLowScoreThreshold(e.target.value)}
                >
                  <option value="any">Any</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>
              <div className="mb-1 d-flex flex-wrap align-items-center">
                <span className="me-2 mb-1">Exam Avg ≤</span>
                <select
                  className="form-select form-select-sm w-auto"
                  value={examAvgThreshold}
                  onChange={(e) => setExamAvgThreshold(e.target.value)}
                >
                  <option value="any">Any</option>
                  <option value="50">50</option>
                  <option value="60">60</option>
                  <option value="70">70</option>
                  <option value="80">80</option>
                  <option value="90">90</option>
                </select>
              </div>
              <div className="mb-1 d-flex flex-wrap align-items-center">
                <span className="me-2 mb-1">Quiz Avg ≤</span>
                <select
                  className="form-select form-select-sm w-auto"
                  value={quizAvgThreshold}
                  onChange={(e) => setQuizAvgThreshold(e.target.value)}
                >
                  <option value="any">Any</option>
                  <option value="50">50</option>
                  <option value="60">60</option>
                  <option value="70">70</option>
                  <option value="80">80</option>
                  <option value="90">90</option>
                </select>
              </div>
              <div className="mb-1 d-flex flex-wrap align-items-center">
                <span className="me-2 mb-1">Office-hours visits &lt;</span>
                <select
                  className="form-select form-select-sm w-auto"
                  value={ohThreshold}
                  onChange={(e) => setOhThreshold(e.target.value)}
                >
                  <option value="any">Any</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-1 d-flex flex-wrap align-items-center">
                <span className="me-2 mb-1">Piazza posts &lt;</span>
                <select
                  className="form-select form-select-sm w-auto"
                  value={piazzaPostsThreshold}
                  onChange={(e) => setPiazzaPostsThreshold(e.target.value)}
                >
                  <option value="any">Any</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>
              <div className="mb-1 d-flex flex-wrap align-items-center">
                <span className="me-2 mb-1">Piazza questions &lt;</span>
                <select
                  className="form-select form-select-sm w-auto"
                  value={piazzaAsksThreshold}
                  onChange={(e) => setPiazzaAsksThreshold(e.target.value)}
                >
                  <option value="any">Any</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>
              <div className="mb-1 d-flex flex-wrap align-items-center">
                <span className="me-2 mb-1">Piazza answers &lt;</span>
                <select
                  className="form-select form-select-sm w-auto"
                  value={piazzaAnswersThreshold}
                  onChange={(e) => setPiazzaAnswersThreshold(e.target.value)}
                >
                  <option value="any">Any</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>
              <div className="mb-2 d-flex flex-wrap align-items-center">
                <span className="me-2 mb-1">Total Piazza activity &lt;</span>
                <select
                  className="form-select form-select-sm w-auto"
                  value={piazzaActivityThreshold}
                  onChange={(e) => setPiazzaActivityThreshold(e.target.value)}
                >
                  <option value="any">Any</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>
            </div>
          </div>
          <div>
            <input
              id="SBSearchTextBox"
              type="text" className="mb-1"
              onChange={onSearchBarChange}
              placeholder="Search..." />
          </div>
          <div style={{height: 500 + 'px'}} className="overflow-auto">
            <SBTable data={studentsBehind} />
          </div>
        </div>
      </div>
  );



}

export default StudentsBehind; 

