import React from "react";
import "./index.css";
import ReactDOM from "react-dom/client";
import  App  from "./App";

const ASCI_TAB_ID_KEY = "asci-tab-id";

const getOrCreateTabId = () => {
    let tabId = sessionStorage.getItem(ASCI_TAB_ID_KEY);
    if (!tabId) {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            tabId = window.crypto.randomUUID();
        } else {
            tabId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        }
        sessionStorage.setItem(ASCI_TAB_ID_KEY, tabId);
    }
    return tabId;
};

const originalFetch = window.fetch.bind(window);
window.fetch = (input, init = {}) => {
    const headers = new Headers(
        init.headers || (input instanceof Request ? input.headers : undefined)
    );
    headers.set("X-ASCI-Tab-Id", getOrCreateTabId());
    return originalFetch(input, { ...init, headers });
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <App/>
);
