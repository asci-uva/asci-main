import React, { useState } from "react";
import { useEffect, useRef } from "react";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../context/UserContext";
import { DayPilotCalendar, DayPilotNavigator, DayPilot } from "@daypilot/daypilot-lite-react";
import c3 from 'c3';
import 'c3/c3.css';

function TAList(props) {
  const [tainfo, setTainfo] = useState([]);
  const {user, getCourse} = useUser();
  let course = getCourse();
  let url = props.url;

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

          setTainfo(stats.details.tas);

        } else {
          console.log("Server returned error");
        }
      })
      .catch((error) => {
        console.log("There was an error:", error);
      });

  }, []);
  
  const TATableHeaderRow = () => {
    return (
        <tr>
          <th>Entry Time</th>
          <th>Exit Time</th>
          <th>Num Students</th>
        </tr>
      );
  }

  const TAView = ({data}) => {
    return Object.keys(data).map(k =>
      <div className="accordion-item" key={k}>
        <h2 className="accordion-header">
          <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target={"#collapse"+k} aria-expanded="false" aria-controls={"collapse" + k}>
            {data[k].name} ({data[k].computing_id})
          </button>
        </h2>
        <div id={"collapse"+k} className="accordion-collapse collapse" aria-labeledby={"heading"+k} data-bs-parent="#taAccordion">
          <div className="accordion-body">
            <table id="TATable" className="table table-striped table-hover table-sm">
              <thead>
              <TATableHeaderRow/>
              </thead>
              <tbody className="table-group-divider">
              <TATableRow data={data[k].activity}/>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const TATableRow = ({data}) => {
    return Object.keys(data).map(k =>
      <tr key={k}>
        <td>{data[k].entry_time}</td>
        <td>{data[k].exit_time}</td>
        <td>{data[k].interactions}</td>
      </tr>
    );
  }

    return (
      <>
        <div className="card mb-4">
        <h4 className="card-header">List View</h4>
        <div className="card-body">
          <div className="accordion" id="taAccordion">
            <TAView data={tainfo}/>
          </div>
        </div>
      </div>
      </>
    );
}

export default TAList; 

