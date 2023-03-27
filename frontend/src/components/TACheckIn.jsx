import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function TACheckIn(props) {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  let courseId = null;

  const [endTime, setEndTime] = useState("");
  const [courseName, setCourseName] = useState("");
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  let url = props.url;
  let docRoot = props.documentRoot;

  //This function runs on page load!
  useEffect(() => {
    //Need to redo this. Check if user id and course id set already.
    //If not, back out quick!
    if (localStorage.getItem("asci-user") === null) {
      navigate(docRoot + "/login");
    } else if (localStorage.getItem("asci-course") === null) {
      navigate(docRoot + "/selectCourse");
    } else {
      setUser(localStorage.getItem("asci-user"));
      courseId = localStorage.getItem("asci-course");

      //setup json command
      let request = {};
      request.command = "sessionPing";
      request.user = localStorage.getItem("asci-user");
      request.courseId = localStorage.getItem("asci-course");
      checkSession(request, url);
    }
  }, []);

  //This function checks the users session
  const checkSession = (json0, url0) => {
    fetch(url0, {
      method: "POST", // or 'PUT'
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(json0),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Data is: ", data);
        let success = data.success;
        if (success === "true") {
          setCourseName(
            data.usercourse.mnemonic +
              data.usercourse.number +
              "(" +
              data.usercourse.name +
              ")"
          );
        } else {
          console.log("HOME: Server returned error");
          navigate(docRoot + "/error");
        }
      })
      .catch((error) => {
        console.log("HOME: There was an error:", error);
        navigate(docRoot + "/error");
      });
  };

  const handleLogout = (e) => {
    e.preventDefault();
    //TODO: Add logout functionality?
    localStorage.clear();
    navigate(docRoot + "/");
  };

  const handleShift = (e) => {
    e.preventDefault();

    if (localStorage.getItem("asci-user") === null) {
      navigate(docRoot + "/login");
    } else if (localStorage.getItem("asci-course") === null) {
      navigate(docRoot + "/selectCourse");
    } else if (endTime === "") {
      setIsError(true);
      setErrorMessage("Please enter an end time");
    } else {
      setIsError(false);
      setErrorMessage("");

      setUser(localStorage.getItem("asci-user"));
      courseId = localStorage.getItem("asci-course");

      // START SHIFT
      let request = {};
      request.command = "startShift";
      request.user = localStorage.getItem("asci-user");
      request.courseId = courseId;
      let d = new Date();
      let now = d.getHours() + ":" + d.getMinutes();
      if (now > endTime) {
        request.endTime =
          d.getFullYear() +
          "-" +
          (d.getMonth() + 1) +
          "-" +
          (d.getDate() + 1) +
          " " +
          endTime +
          ":00";
      } else {
        request.endTime =
          d.getFullYear() +
          "-" +
          (d.getMonth() + 1) +
          "-" +
          d.getDate() +
          " " +
          endTime +
          ":00";
      }
      console.log(d.getFullYear() + "-" + d.getMonth() + "-" + d.getDay());
      console.log(request.endTime);

      startShift(request, url);
    }
  };

  const startShift = (json0, url0) => {
    fetch(url0, {
      method: "POST", // or 'PUT'
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(json0),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Data is: ", data);

        //if request succeeded
        if (data.success === "true" && data.shift != null) {
          navigate(docRoot + "/handleStudent");
        } else {
          console.log("JQ: Error, starting shift didn't succeed");
          navigate(docRoot + "/error");
        }
      })
      .catch((error) => {
        console.log("JQ: There was an error:", error);
        navigate(docRoot + "/error");
      });
  };

  return (
    <div className="question">
      <div>
        <h2>Hello {user}</h2>
        <h6>
          You have selected <b>{courseName}</b>. Enter your shift end time below
          to start working.
        </h6>
      </div>
      <br></br>
      <form>
        <label>Shift End Time</label>
        <input
          type="time"
          placeholder="Enter end time here"
          required
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        ></input>
      </form>
      {isError && (
        <div className="error">
          <label>
            <b>Error:</b> {errorMessage}
          </label>
        </div>
      )}

      <div>
        <button onClick={handleShift}>Start Shift</button>
      </div>
    </div>
  );
}

export default TACheckIn;
