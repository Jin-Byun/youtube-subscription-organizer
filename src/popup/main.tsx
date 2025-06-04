import React from "react";
import { createRoot } from "react-dom/client";
import Container from "./popup";
import { DarkModeProvider } from "./darkModeContext";
import { ContextMenu } from "./components/contextMenu";

const root = createRoot(document.getElementById("root") as HTMLElement);

const Root = (): JSX.Element => {
	const contextMenuRef = React.useRef<HTMLDivElement>(null);
	return (
		<DarkModeProvider>
			<Container contextMenuRef={contextMenuRef} />
			<ContextMenu ref={contextMenuRef} />
		</DarkModeProvider>
	);
};

root.render(<Root />);
