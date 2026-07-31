import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./views/App";

createRoot(document.getElementById("app")!).render(React.createElement(App));
