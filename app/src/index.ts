import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./views/App";

const rootElement = document.getElementById("app");

if (!rootElement) {
	throw new Error('Expected to find root element with id "app".');
}

createRoot(rootElement).render(React.createElement(App));
