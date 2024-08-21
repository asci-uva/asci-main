import React, { useState } from "react";
import { useEffect, useRef } from "react";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../context/UserContext";
import c3 from 'c3';
import 'c3/c3.css';

function TAStats(props) {
  const [courseFile, setCourseFile] = useState(null);
  const [piazzaFile, setPiazzaFile] = useState(null);
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

          const chart = c3.generate({
            bindto: chartRef.current,
            data: {
              json: stats.stats,
              keys: {
                x: 'name',
                value: ['time']
              },
              types: {
                time: 'bar'
              }
            },
            axis: {
              rotated: true,
              x: {
                type: 'category'
              },
              y: {
                label: 'Time with Students (min)'
              }
            }
            
          });
          const chartCount = c3.generate({
            bindto: chartCountRef.current,
            data: {
              json: stats.stats,
              keys: {
                x: 'name',
                value: ['num_sessions']
              },
              types: {
                num_sessions: 'bar'
              }
            },
            axis: {
              rotated: true,
              x: {
                type: 'category'
              },
              y: {
                label: 'Time with Students (min)'
              }
            }
            
          });
        } else {
          console.log("Server returned error");
        }
      })
      .catch((error) => {
        console.log("There was an error:", error);
      });

  });

    return (
      <>
        <div className="card mb-4">
        <h4 className="card-header">TAs by help time</h4>
        <div className="card-body">
          <div ref={chartRef}></div>
        </div>
      </div>
      <div className="card mb-4">
        <h4 className="card-header">TAs by Interactions</h4>
        <div className="card-body">
          <div ref={chartCountRef}></div>
        </div>
      </div>
      </>
    );
}

export default TAStats; 

