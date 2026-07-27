import React, { createContext, useContext, useState, useEffect } from "react";
import { isInstructorRole, formatRole } from "../utils/roles";

const UserContext = createContext({
  userid: null,
  fname: null,
  lname: null,
  login: () => { },
  logout: () => { }
});

// Use REACT_APP_BACKEND_URL if set (empty = same-origin on Heroku).
// For local dev: set REACT_APP_BACKEND_URL=http://localhost:8081 in .env
const url = (process.env.REACT_APP_BACKEND_URL || "http://localhost:8081") + "/index.php";

export const useUser = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
  const [userid, setUserid] = useState(null);
  const [fname, setFname] = useState(null);
  const [lname, setLname] = useState(null);
  const [pname, setPname] = useState(null);
  const [discordUsername, setDiscordUsername] = useState(null);
  const [courseList, setCourseList] = useState(null);
  const [course, setCourse] = useState(null);
  const [courseSettings, setCourseSettings] = useState(null);
  const [courseRoster, setCourseRoster] = useState([]);
  const [courseExternalTools, setCourseExternalTools] = useState(null);
  const login = (userInfo, callback) => {
    let json = {};
    json.command = "login";
    json.user = userInfo.user;
    json.password = userInfo.password;

    let jsonString = JSON.stringify(json);

    fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: jsonString,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success === "true") {
          // successfully login
          console.log("Login Success");
          localStorage.setItem("asci-user", data.computing_id);
          setUserid(data.user.computing_id);
          setFname(data.user.fname);
          setLname(data.user.lname);
          setPname(data.user.pname);
          setDiscordUsername(data.user.discord_username ?? null);

          setCourseList(data.courses);
          setCourse(null);
          callback(true);
        } else {
          // fail to login
          console.log("login failed");
          callback(false, data.error.message);
        }
      })
      .catch((error) => {
        console.error("Error during login:", error);
        callback(false); // Call the callback with failure status
      });
  };

  const refreshCourseList = (userInfo, callback) => {
    let json = {};
    json.command = "getCourses";
    json.user = userInfo.user;

    let jsonString = JSON.stringify(json);

    fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: jsonString,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        if (data.success === "true") {

          setCourseList(data.courses);

          callback(true);
        } else {
          // fail to login
          console.log("refreshing courses failed");
          callback(false);
        }
      })
      .catch((error) => {
        console.error("Error during refresh course list:", error);
        callback(false); // Call the callback with failure status
      });
  };

  const courseListString = () => {
    let cList = {};
    for (var key in courseList) {
      //Construct the course title from it's pieces
      let courseName = ""
        + courseList[key]["mnemonic"]
        + courseList[key]["number"]
        + " "
        + courseList[key]["name"]
        + " - "
        + courseList[key]["semester"]
        + " ("
        + formatRole(courseList[key]["role"])
        + ")";

      cList[key] = courseName;
    }
    return cList;
  }

  const updateDiscordUsername = (newDiscordUsername, callback) => {
    const json = {
      command: "setDiscordUsername",
      user: userid,
      computingId: userid,
      discordUsername: newDiscordUsername || null,
      courseId: course ? getCourse().course_id : null,
    };

    fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(json),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success === "true") {
          setDiscordUsername(newDiscordUsername || null);
          if (callback) callback(true);
        } else {
          if (callback) callback(false, data.error);
        }
      })
      .catch((error) => {
        console.error("Error updating Discord username:", error);
        if (callback) callback(false);
      });
  };

  const isInstructor = () => {

    for (var key in courseList) {
      if (isInstructorRole(courseList[key]["role"])) return true;
    }

    return false;
  }

  const getCourse = () => {
    return courseList[course];
  }

  const getCourseSettings = () => {
    return courseSettings;
  };

  const refreshCourseRoster = (user) => {
    let json = {};
    json.command = "getCourseRoster";
    json.user = userid;
    json.course_id = getCourse().course_id;

    let jsonString = JSON.stringify(json);

    fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: jsonString,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("data is: ", data);
        if (data.success === "true") {

          setCourseRoster(data.roster);

        } else {
          // fail to login
          console.log("refreshing course roster failed");
        }
      })
      .catch((error) => {
        console.error("Error during refresh course roster:", error);

      });
  };

  const getCourseRoster = () => {
    return courseRoster;
  };

  const getCourseExternalTools = () => {
    return courseExternalTools;
  };

  useEffect(() => {
    if (course == null || courseList == null || courseList[course] == null) {
      setCourseExternalTools(null);
      return;
    }

    const courseId = courseList[course].course_id;
    fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        command: "getCourseExternalTools",
        user: userid,
        course_id: courseId,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success === "true") {
          setCourseExternalTools(data.externalTools);
        } else {
          console.log("Failed to load course external tools");
        }
      })
      .catch((error) => {
        console.error("Error loading course external tools:", error);
      });
  }, [course, courseList, userid]);

  const setCourseExternalTool = (tool, enabled, callback) => {
    if (course == null || courseList == null || courseList[course] == null) {
      if (callback) callback(false, "No course selected");
      return;
    }

    const courseId = courseList[course].course_id;
    fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        command: "setCourseExternalTool",
        user: userid,
        course_id: courseId,
        tool: tool,
        enabled: enabled,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success === "true") {
          setCourseExternalTools(data.externalTools);
          if (callback) callback(true);
        } else {
          if (callback) callback(false, data.error);
        }
      })
      .catch((error) => {
        console.error("Error updating course external tool:", error);
        if (callback) callback(false);
      });
  };

  const logout = () => {
    let json = {};
    json.command = "logout";
    json.user = userid;

    let jsonString = JSON.stringify(json);

    fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: jsonString,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success === "true") {
          // successfully logout
          console.log("Logout Success");
        } else {
          // fail to logout
          console.log("logout failed");
        }
      })
      .catch((error) => {
        console.error("Error during logout:", error);
      });
    setUserid(null);
    setFname(null);
    setLname(null);
    setPname(null);
    setDiscordUsername(null);
    setCourseList(null);
    setCourse(null);
    setCourseExternalTools(null);
    // Clear LocalStorage
    localStorage.clear();
    console.log("logout successfully, go back to login page");
  };

  const value = {
    user: {
      userid,
      fname,
      lname,
      pname,
      discord_username: discordUsername,
    },
    updateDiscordUsername,
    courseList,
    courseListString,
    login,
    logout,
    course,
    getCourse,
    setCourse,
    setCourseList,
    refreshCourseList,
    courseSettings,
    getCourseSettings,
    setCourseSettings,
    setCourseRoster,
    courseRoster,
    getCourseRoster,
    refreshCourseRoster,
    courseExternalTools,
    getCourseExternalTools,
    setCourseExternalTool,
    isInstructor,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

