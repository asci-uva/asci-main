import React from "react";
import {useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';

function SelectCourse() {
  // const [title, setTitle] = useState("question overview");
  // const [details, setDetails] = useState("question details");
  // const [purpose, setPurpose] = useState("");
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  
  const [purpose, setPurpose] = useState(0);
  const [courses, setCourses] = useState({
      0: "Select course..."
    });

  let url = 'http://localhost:8081/index.php'; 
  
    //This function runs on page load!
    useEffect(() => {

      console.log("SelectCourse: Checking if user is set");
      console.log("Courses is:", courses);
      //If token is set, kick to home screen to check validity of session
      if (localStorage.getItem('asci-user') !== null) {
        //try to get the user's courses
        setUser(localStorage.getItem('asci-user'));

        //setup json command
        let request = {};
        request.command = "getCourses";
        request.user = localStorage.getItem('asci-user');
        getCourses(request, url); 
      }
      else{
        navigate("/login");
      }
    }, []);

    //This function checks the users session
    const getCourses = (json0, url0) =>{
      fetch(url0, {
        method: 'POST', // or 'PUT'
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(json0),
      }).then(response => response.json())
      .then(data => {
          console.log("Data is: ", data);
          let success = data.success;
          
          if(success === "true"){

            console.log("SelectCourse: Successfully fetched courses");
            let c = {0: "Select course..."}
            for(var key in data.courses){
              //Construct the course title from it's pieces
              let courseName = "" 
                                + data.courses[key]["mnemonic"]
                                + data.courses[key]["number"]
                                + " "
                                + data.courses[key]["name"]
                                + " - "
                                + data.courses[key]["semester"]
                                + " ("
                                + data.courses[key]["role"]
                                + ")";

              c[key] = courseName;
            }

            setCourses(c);
            
          }
          else{
            console.log("Select Course: Server returned error");
            navigate("/error");
          }
        })
        .catch((error) => {
          console.log("Select Course: There was an error:", error);
          navigate("/error");
          
        });
  }

  const handleLogout = (e) =>{
    e.preventDefault();
    //TODO: Add logout functionality?
    localStorage.clear();
    navigate('/');
  }

  const handleSelectCourse = (e) =>{
    e.preventDefault();

    //confirm username is set
    if (localStorage.getItem('asci-user') === null) {
      navigate("/login");
    }
    //if user didn't select a course
    if (purpose !== 0){
      //TODO: Add student question
      setUser(localStorage.getItem('asci-user'));
      console.log("Course id: ", purpose);
      console.log("Course name: ", courses[purpose])

      //Set the local storage item
      localStorage.setItem('asci-course', purpose);

      //navigate to the home page finally
      navigate("/");

    }

    

  }

  return (
    <div className="question">
      <div>
      <h2>Welcome {user}</h2>
      </div>
      <br></br>
      <form>
      <label>Please select your course below.</label>
        <select 
          value={purpose}
          onChange={(e)=>setPurpose(e.target.value)}>
          {Object.keys(courses).map(
                k => (
                <option key={k} value={k}>
                    {courses[k]}
                </option>
                )
          )}
        </select>
      </form>
      <div>
        <button onClick={handleSelectCourse}>Select Course</button>
      </div>
    </div>
  );
}

export default SelectCourse;

