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
    
    const {user, getCourseSettings} = useUser();
    let settings = getCourseSettings();
    const [sidebarOpen, setSidebarOpen] = useState("sidebar-visible");
    const [sidebarCol, setSidebarCol] = useState("col-md-3");
    const [chatCol, setChatCol] = useState("page-container content col-md-9 my-auto");

    const handleCollapse = () => {
      if(sidebarOpen === "sidebar-visible")
      {
        setSidebarCol("col-md-1");
        setChatCol("page-container content col-md-11");
        setSidebarOpen("sidebar-hidden");
      }
      else
      {
        setSidebarCol("col-md-3");
        setChatCol("page-container content col-md-9 my-auto");
        setSidebarOpen("sidebar-visible");
      }
    }

    return (
    <>
      <div className="container-fluid page-width">
        <div className="full-page row g-0">
          <div className={sidebarCol}>
            <div className="sidebar">
              <div className={sidebarOpen}>
                <h1><i className="bi-chat-right-text big-icon"></i></h1>
                <h2>BotChat</h2>
                <p>
                  This course provides an automated chat bot.  It will provide answers with relevant links to actual course material.
                </p>
                <p>
                  Please note: the bot may not always provide correct responses.  Use the information it gives you and follow the relevant links to learn more.
                </p>
              </div>
              <button type="button" className="sidebar-button" onClick={handleCollapse}><i className="bi-arrows-collapse-vertical"></i></button>
            </div>
          </div>

          <div className={chatCol}>

            { settings!=null && settings.llm_enabled=="t" ? (
              <Chat {...props} />
            
            ) : (
              <p>Sorry! It looks like the chat bot is not enabled for this course. Please contact your instructor.</p>
            ) }
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatController;
