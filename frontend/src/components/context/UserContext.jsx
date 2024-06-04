import React, { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext({
    userid: null,
    fname: null,
    lname: null,
    login: () => {},
    logout: () => {}
});

const url = "http://localhost:8081/index.php";

export const useUser = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
  const [userid, setUserid] = useState(null);
  const [fname, setFname] = useState(null);
  const [lname, setLname] = useState(null);
  const [pname, setPname] = useState(null);
  const [courseList, setCourseList] = useState(null);
  const [course, setCourse] = useState(null);

  const login = (userInfo, callback) => {
    let json = {};
    json.command = "login";
    json.user = userInfo.user;

    let jsonString = JSON.stringify(json);

    fetch(url, {
      method: "POST",
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

          setCourseList(data.courses);
          setCourse(null);
          callback(true);
        } else {
          // fail to login
          console.log("login failed");
          callback(false);
        }
      })
      .catch((error) => {
        console.error("Error during login:", error);
        callback(false); // Call the callback with failure status
      });
  };

  const courseListString = () => {
          let cList = {};
            for(var key in courseList){
              //Construct the course title from it's pieces
              let courseName = "" 
                                + courseList[key]["mnemonic"]
                                + courseList[key]["number"]
                                + " "
                                + courseList[key]["name"]
                                + " - "
                                + courseList[key]["semester"]
                                + " ("
                                + courseList[key]["role"]
                                + ")";

              cList[key] = courseName;
            }
        return cList;
  }

  const getCourse = () => {
    return courseList[course];
  }

  const logout = () => {
    setUserid(null);
    setFname(null);
    setLname(null);
    setPname(null);
    setCourseList(null);
    setCourse(null);
    // Clear LocalStorage
    localStorage.clear();
    console.log("logout successfully, go back to login page");
  };

  const value = {
      user: {
          userid,
          fname,
          lname,
          pname
      },
      courseList,
      courseListString,
      login,
      logout,
      course,
      getCourse,
      setCourse
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

