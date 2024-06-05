import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import Chat from "../chat/Chat";

function StudentWaitingRoom(props) {
  const navigate = useNavigate();
  let {user, getCourse} = useUser();
  let course = getCourse();


  const [position, setPosition] = useState(-1);
  const [minsWaiting, setMinsWaiting] = useState("...");
  const [tip, setTip] = useState("This is a really good tip.");

  const [issueSubject, setIssueSubject] = useState("");

  //variables for managing polling the server
  let polling = false;
  let timeoutId = 0;
  let pollTime = 3000;

  let url = props.url;
  let docRoot = props.documentRoot;

  //This function runs on page load!
  useEffect(() => {
    //Make sure id and course are set
    console.log("StudWait: Setting user and course id");
    console.log("StudWait: User: " + user);
    console.log("StudWait: Course: " + course);

    console.log("waiting room mounted, start polling");
    polling = true;
    poll();

    getTip();

    //called when this component unmounts
    return () => {
      console.log("Waiting room: Stopping polling");
      clearTimeout(timeoutId);
      polling = false;
    };
  }, []);

  function poll() {
    console.log("waitingRoom...polling for queue position");

    //setup json command
    let request = {};
    request.command = "getQueueStatus";
    request.user = user.userid;
    request.courseId = course.course_id;
    getStatus(request, url);
  }
  //get another tip
  //This function checks the users queue status and updates things

  const getTip = (e) => {
    // e.preventDefault();

    let request = {};
    request.user = user.userid;
    request.command = "getTip";
    fetchTip(request, url);
  };
  const fetchTip = (json0, url0) => {
    fetch(url0, {
      method: "POST", // or 'PUT'
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(json0),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Tip data is: ", data);
        let max = data.tips.length;
        let randNum = Math.floor(Math.random() * max);
        while (tip == data.tips[randNum]) {
          randNum = Math.floor(Math.random() * max);
        }
        setTip(data.tips[randNum]);
      })
      .catch((error) => {
        console.log("There was an error:", error);
        navigate(docRoot + "/error");
      });
  };

  const thisHelped = () => {};

  //This function checks the users queue status and updates things
  const getStatus = (json0, url0) => {
    fetch(url0, {
      method: "POST", // or 'PUT'
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(json0),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Status data is: ", data);
        const validData = Boolean(
          data && data.session && data.session.issue
        );
        console.log("validData is: ", validData);
        if (validData) {
          const text = `${data["session"]["issue_subject"]}: ${data["session"]["issue"]}`;
          console.log("text is: ", text);
          setIssueSubject(text);
        }

        if (data.success !== "true") {
          console.log("Waiting room: Something went wrong");
          navigate(docRoot + "/error");
        } else if (data.session === null) {
          console.log("Student doesn't have a session");
          navigate(docRoot + "/joinQueue");
        } else if (data.session.status === "in_progress") {
          console.log("Being helped now!");
          navigate(docRoot + "/studentMeeting");
        } else if (
          data.session.status === "waiting" ||
          data.session.status === "grouping"
        ) {
          console.log("WR: Displaying new queue position");
          setPosition(5);

          //Get the start date
          console.log("Date now is: " + Date.now());
          console.log(
            "Date of entry time is: " +
            new Date(data.session.entry_time).getTime()
          );
          let waitTime = parseInt(
            (Date.now() -
              new Date(data.session.entry_time).getTime()) /
            1000 /
            60,
            10
          );
          setMinsWaiting(waitTime);

          if (polling == true) {
            console.log("WR: Setting timeout for next poll");
            timeoutId = setTimeout(poll, pollTime);
          }
        } else {
          console.log("StudentWaitingRoom: Something went wrong!");
          navigate(docRoot + "/error");
        }
      })
      .catch((error) => {
        console.log("Waiting room: There was an error:", error);
        navigate(docRoot + "/error");
      });
  };

  const leaveQueue = (e) => {
    e.preventDefault();

    let request = {};
    request.command = "leaveQueue";

    request.user = user.userid;
    request.courseId = course.course_id;
    reqLeaveQueue(request, url);
  };

  //This function attempts to leave the queue
  const reqLeaveQueue = (json0, url0) => {
    fetch(url0, {
      method: "POST", // or 'PUT'
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(json0),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Req leave queue data is: ", data);

        if (data.success === "true") {
          console.log("Left queue");
          navigate(docRoot + "/joinQueue");
        } else {
          console.log("Leaving queue failed");
          navigate(docRoot + "/error");
        }
      })
      .catch((error) => {
        console.log(
          "Waiting room: There was an error leaving the queue:",
          error
        );
        navigate(docRoot + "/error");
      });
  };

  return (
    <div className="container p-4">
      <div className="row my-auto">
        <div className="col-md-4">
          <h1><i className="bi-clock-history big-icon"></i></h1>
          <h2>Waiting Room</h2>
          <p>On the queue.</p>
        </div>
        <div className="col-md-8 my-auto">
          <h4>
            You are currently in the queue for {course.name}. A TA Will
            be with you shortly
          </h4>
          <div className="text-center my-6">
            <button className="btn btn-danger" onClick={leaveQueue}>
              Leave queue
            </button>
          </div>
          <Chat
            url={url}
            docRoot={docRoot}
            issueSubject={issueSubject}
            courseName={course.name}
          />
        </div>
      </div>
    </div>
  );
}

export default StudentWaitingRoom;
