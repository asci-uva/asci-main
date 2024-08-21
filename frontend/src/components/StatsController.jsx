import React from "react";
import { useEffect, useState } from "react";
import Home from "./stats/Home";
import {
  Login,
  Error,
  Logout,
  Navigation,
} from "./utils";
import { useUser } from "./context/UserContext";

const StatsController = (props) => {
  // const { user, login } = useUser();
  const root = "/asci";

  return (
      <Home {...props} />
  );
};

export default StatsController;

