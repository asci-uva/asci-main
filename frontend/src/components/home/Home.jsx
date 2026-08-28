import React, { useState } from "react";
import Cards from "./Cards";
import { useUser } from "../context/UserContext";


//This page needs to:
//See if student is logged in and kick to login page if not
//If, logged in, reset student info and kick to dashboard

function Home(props) {
  const { user, updateDiscordUsername, isInstructor } = useUser();
  const [discordInput, setDiscordInput] = useState(user.discord_username || "");
  const [discordStatus, setDiscordStatus] = useState(null); // null | "saved" | "error"

  const handleSaveDiscord = () => {
    updateDiscordUsername(discordInput, (success) => {
      setDiscordStatus(success ? "saved" : "error");
    });
  };

  return (
    <div className="page-container row">
      <div className="col-md-4">
        <h2>ASCI</h2>
        <h6>AI-Smart Classroom Initiative</h6>
        <p>Welcome back {user.pname} {user.lname}!  Navigate to different parts of the application from here.</p>
        <button
          id="theme-toggle"
          className="btn btn-primary"
          onClick={() => {
            const html = document.documentElement
            const curTheme = html.getAttribute("data-bs-theme")
            const newTheme = curTheme === "dark" ? "light" : "dark"
            html.setAttribute("data-bs-theme", newTheme)
            localStorage.setItem("theme", newTheme)
            console.log("Theme changed to: " + newTheme)
          }}
        >
          Toggle Theme
        </button>
        {!isInstructor() && (
          <div className="mt-3">
            <label htmlFor="discord-username" className="form-label fw-semibold">Discord Username</label>
            <div className="input-group">
              <input
                id="discord-username"
                type="text"
                className="form-control"
                placeholder="your_discord_handle"
                value={discordInput}
                onChange={(e) => { setDiscordInput(e.target.value); setDiscordStatus(null); }}
              />
              <button className="btn btn-outline-secondary" onClick={handleSaveDiscord}>Save</button>
            </div>
            {discordStatus === "saved" && <div className="text-success mt-1 small">Saved!</div>}
            {discordStatus === "error" && <div className="text-danger mt-1 small">Failed to save. Please try again.</div>}
          </div>
        )}
      </div>
      <div className="col-md-8">
        <Cards
          documentRoot={props.documentRoot}
          debugMode={props.debugMode}
        />
      </div>
    </div>
  );
}

export default Home;
