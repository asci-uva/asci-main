import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import {
  Chat
} from "./chat";
import {
  Login,
  Error,
  Logout,
  Navigation,
} from "./utils";
import { useUser } from "./context/UserContext";

const ChatController = (props) => {
  const navigate = useNavigate();
    
    const {user} = useUser();
    return (
    <>
      <div className="container p-4">
        <div className="row my-auto">
        <div className="col-md-4">
        <h1><i className="bi-chat-right-text big-icon"></i></h1>
        <h2>BotChat</h2>
        <p>
          This course provides an automated chat bot.  It will provide answers with relevant links to actual course material.
        </p>
          <p>
            Please note: the bot may not always provide correct responses.  Use the information it gives you and follow the relevant links to learn more.
          </p>
        </div>
      <div className="col-md-8 my-auto">
        <Chat {...props} />
      </div>
    </div>
    </div>
    </>
  );
};

export default ChatController;
