import React from "react";
import "./index.css";
import ReactDOM from "react-dom/client";

import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import {
  Navigation,
  Footer,
  Home,
  Question,
  Login,
  Ta,
  StudentWaitingRoom
} from "./components";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Router>
    <Navigation />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/question" element={<Question />} />
      <Route path="/ta" element={<Ta />} />
      <Route path="/studentwaitingroom" element={<StudentWaitingRoom />} />
    </Routes>
    <Footer />
  </Router>,
);


