import React, { useState } from "react";
import { useEffect, useRef } from "react";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../context/UserContext";
import { DayPilotCalendar, DayPilotNavigator, DayPilot } from "@daypilot/daypilot-lite-react";
import c3 from 'c3';
import 'c3/c3.css';

function TAWeek(props) {
  const [courseFile, setCourseFile] = useState(null);
  const [piazzaFile, setPiazzaFile] = useState(null);
  const [intervals, setIntervals] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const {user, getCourse} = useUser();
  let course = getCourse();
  let url = props.url;
  let chartRef = useRef(null);
  let chartCountRef = useRef(null);

  //This function runs on page load!
  useEffect(() => {
    let request = {};
    request.command = "getCourseStats";
    request.user = user.userid;
    request.courseId = course.course_id;

    fetch(url, {
      method: "POST", // or 'PUT'
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })
      .then((response) => response.json())
      .then((stats) => {
        console.log("Data is: ", stats);
        let success = stats.success;
        if (success === "true") {
          console.log("Received stats");

          let interval_tmp = [];
          let idx = 1;
          stats.details.activities.forEach((a) => {
            interval_tmp.push({
              id: idx++, 
              start: a.entry_time,
              end: a.exit_time,
              text: a.name + " (" + a.interactions + " students)",
              //participants: a.interactions
            });
          });

          setIntervals(interval_tmp);


        } else {
          console.log("Server returned error");
        }
      })
      .catch((error) => {
        console.log("There was an error:", error);
      });

  }, []);

    return (
      <>
        <div className="card mb-4">
        <h4 className="card-header">Week View</h4>
        <div className="card-body">
          <p>
            <a className="btn btn-primary" data-bs-toggle="collapse" href="#collapseSelect" role="button" aria-expanded="false" aria-controls="collapseSelect">
                  Change Week 
                </a>
          </p>
              <div className="collapse" id="collapseSelect">
                  <div className="card-body">
          <DayPilotNavigator
            selectMode={"Week"}
            onTimeRangeSelected={ args => {
              setStartDate(args.day);
            }}
          />
                      </div>
              </div>
          <DayPilotCalendar
            viewType = {"Week"}
            events = {intervals}
            startDate={startDate}
          />
        </div>
      </div>
      </>
    );
}

export default TAWeek; 

