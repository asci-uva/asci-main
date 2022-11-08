import React from "react";
import "./index.css";
import ReactDOM from "react-dom/client";

import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import {
  Navigation,
  Footer,
  Home,
  Question,
  Contact,
  Ta,
} from "./components";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Router>
    <Navigation />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/question" element={<Question />} />
      <Route path="/ta" element={<Ta />} />
    </Routes>
    <Footer />
  </Router>,
);


