import React from "react";
import { createRoot } from "react-dom/client";
import Container from "./popup";

const root = createRoot(document.getElementById("root") as HTMLElement);

root.render(<Container />);