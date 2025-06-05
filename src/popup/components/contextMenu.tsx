import React, { type RefObject } from "react";
import { DarkModeContext } from "../darkModeContext";

export const ContextMenu = ({
	ref,
}: { ref: RefObject<HTMLDivElement> }): JSX.Element => {
	const { isDarkMode } = React.useContext(DarkModeContext);
	return (
		<div
			ref={ref}
			id="contextMenu"
			style={{
				width: "5rem",
				height: "fit-content",
				position: "absolute",
				display: "none",
				flexDirection: "column",
				top: "0px",
				left: "0px",
				border: "1px solid #444",
				borderRadius: "0.5rem",
				backgroundColor: isDarkMode ? "#000" : "#FFF",
				color: isDarkMode ? "#FFF" : "#000",
				overflow: "clip",
			}}
			title="For ..."
		>
			{/* biome-ignore lint/a11y/useKeyWithMouseEvents: <explanation> */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
			<h4
				style={{
					padding: "0.5rem 0.75rem",
					borderBottom: "1px dashed #444",
					cursor: "pointer",
					transition: "background-color 0.3s, letter-spacing 0.3s",
				}}
				onMouseOver={(e) => {
					const el = e.target as HTMLHeadingElement;
					el.style.backgroundColor = isDarkMode ? "#300" : "#C77";
					el.style.letterSpacing = "0.5px";
				}}
				onMouseOut={(e) => {
					const el = e.target as HTMLHeadingElement;
					el.style.backgroundColor = isDarkMode ? "#000" : "#FFF";
					el.style.letterSpacing = "normal";
				}}
				onClick={() => {
					const el = ref.current;
					closeMenu(el);
				}}
			>
				Remove
			</h4>
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
			{/* biome-ignore lint/a11y/useKeyWithMouseEvents: <explanation> */}
			<h4
				style={{
					padding: "0.5rem 0.75rem",
					cursor: "pointer",
					transition: "background-color 0.3s, letter-spacing 0.3s",
				}}
				onMouseOver={(e) => {
					const el = e.target as HTMLHeadingElement;
					el.style.backgroundColor = isDarkMode ? "#333" : "#CCC";
					el.style.letterSpacing = "0.5px";
				}}
				onMouseOut={(e) => {
					const el = e.target as HTMLHeadingElement;
					el.style.backgroundColor = isDarkMode ? "#000" : "#FFF";
					el.style.letterSpacing = "normal";
				}}
				onClick={() => {
					const el = ref.current;
					el.removeAttribute("data-target");
					el.removeAttribute("data-parent");
					closeMenu(el);
				}}
			>
				close
			</h4>
		</div>
	);
};

const closeMenu = (el: HTMLDivElement) => {
	el.title = "";
	el.style.display = "none";
	el.style.top = "0px";
	el.style.left = "0px";
};
