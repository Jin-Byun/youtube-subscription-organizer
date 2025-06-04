import React, { type RefObject } from "react";
import { DarkModeContext } from "../darkModeContext";

export const ContextMenu = ({
	ref,
}: { ref: RefObject<HTMLDivElement> }): JSX.Element => {
	const { isDarkMode } = React.useContext(DarkModeContext);
	return (
		<div
			ref={ref}
			style={{
				width: "5rem",
				height: "fit-content",
				display: "flex",
				flexDirection: "column",
				position: "absolute",
				top: "0px",
				left: "0px",
				backgroundColor: isDarkMode ? "#000" : "#FFF",
				color: isDarkMode ? "#FFF" : "#000",
			}}
		>
			<h3>Remove</h3>
			<h3>close</h3>
		</div>
	);
};
