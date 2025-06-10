import React, {
	useContext,
	type MouseEventHandler,
	type MouseEvent as ReactMouseEvent,
	type FocusEvent as ReactFocusEvent,
} from "react";
import { ms, type Style, buttonDefault } from "../styles";
import { DarkModeContext } from "../darkModeContext";

export const ActionButton = ({
	handleClick,
	text,
	url,
	style,
	isAlert,
}: {
	handleClick: MouseEventHandler<HTMLButtonElement>;
	text: string;
	url?: string;
	style?: Style;
	isAlert?: boolean;
}): JSX.Element => {
	const { isDarkMode } = useContext(DarkModeContext);
	const buttonStyle = style
		? ms(buttonDefault(isDarkMode), style)
		: buttonDefault(isDarkMode);

	const turnFocus = (e: ReactMouseEvent | ReactFocusEvent) => {
		const thisButton = e.target as HTMLButtonElement;
		if (!isAlert) {
			thisButton.style.backgroundColor = isDarkMode ? "#3A0000" : "#FF8080";
			thisButton.style.color = buttonStyle.color as string;
			return;
		}
		thisButton.style.backgroundColor = isDarkMode ? "#FF3030" : "#AA0000";
		thisButton.style.color = isDarkMode ? "#000000" : "#FFFFFF";
	};
	const turnDefault = (e: ReactMouseEvent | ReactFocusEvent) => {
		const thisButton = e.target as HTMLButtonElement;
		thisButton.style.backgroundColor = buttonStyle.backgroundColor as string;
		thisButton.style.color = buttonStyle.color as string;
	};

	return (
		<button
			type="button"
			data-url={url}
			style={buttonStyle}
			onClick={handleClick}
			onMouseEnter={turnFocus}
			onMouseLeave={turnDefault}
		>
			{text}
		</button>
	);
};
