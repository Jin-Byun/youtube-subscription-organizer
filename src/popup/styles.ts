export type Style = { [key: string]: string | Style };

// Create a deep copy of the first style and merge,
// giving priority to the latter styles
export const ms = (...styles: Style[]): Style =>
	styles.reduce((acc, style) => Object.assign(acc, style), {
		...styles[0],
	});

export const initialStyle: Style = {
	width: "0px",
	height: "0px",
	maxHeight: "0px",
	padding: "1rem",
	overflow: "hidden",
	transition: "width 0.4s, max-height 0.8s",
};

export const popupContainer = {
	width: "14rem",
	maxHeight: "30rem",
	height: "fit-content",
};

export const setBackgroundColor = (isDarkmode: boolean): Style => ({
	backgroundColor: isDarkmode ? "#2D2D2D" : "#FFFFFF",
	color: isDarkmode ? "#FFFFFF" : "#000000",
});

export const buttonDefault = (isDarkmode: boolean): Style => ({
	width: "fit-content",
	fontWeight: "bold",
	textDecoration: "none",
	backgroundColor: isDarkmode ? "#3A3A3A" : "#F0F0F0",
	color: isDarkmode ? "#FFFFFF" : "#000000",
	borderRadius: "0.5rem",
	padding: "0.5rem",
	border: "1px solid #565656",
	cursor: "pointer",
	transition: "background-color 0.3s",
});

export const flexRow: Style = {
	display: "flex",
	flexDirection: "row",
};

export const flexCol: Style = {
	display: "flex",
	flexDirection: "column",
	gap: "0.5rem",
};
