import React from "react";
import { createRoot } from "react-dom/client";
import Container from "./popup";
import { DarkModeProvider } from "./darkModeContext";

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(
	<DarkModeProvider>
		<Container />
	</DarkModeProvider>,
);
