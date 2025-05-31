import React, {
	useState,
	useEffect,
	useContext,
	useMemo,
	type MouseEventHandler,
	type MouseEvent as ReactMouseEvent,
	type FocusEvent as ReactFocusEvent,
} from "react";
import {
	ms,
	initialStyle,
	popupContainer,
	setBackgroundColor,
	type Style,
	buttonDefault,
	flexCol,
	flexRow,
} from "./styles";
import { DarkModeContext } from "./darkModeContext";
const imageURL = chrome.runtime.getURL("icon-64.png");

const Container = (): JSX.Element => {
	const { isDarkMode } = useContext(DarkModeContext);
	const startingStyle: Style = useMemo(() => {
		return ms(flexCol, initialStyle, setBackgroundColor(isDarkMode));
	}, [isDarkMode]);

	const [style, setStyle] = useState<Style>(startingStyle);
	const [users, setUsers] = useState<string[]>([]);
	// todo: fix here.
	useEffect(() => {
		let ignore = false;
		chrome.runtime
			.sendMessage({
				msg: "getUsers",
			})
			.then((res) => {
				console.log(ignore, res, "outside ignorecatch");
				// if (!ignore && data) {
				// 	console.log(data, "inside ignore catch");
				// 	setUsers(data);
				// }
			});
		return () => {
			ignore = true;
		};
	}, []);
	useEffect(() => {
		requestAnimationFrame(() => {
			setStyle(ms(startingStyle, popupContainer));
		});
	}, [startingStyle]);
	return (
		<div style={style} id="popup-container">
			<div
				style={ms(flexRow, {
					width: "100%",
					height: "4rem",
					justifyContent: "space-evenly",
					textAlign: "center",
					alignItems: "center",
				})}
			>
				<img src={imageURL} alt="icon" height={64} width={64} />
				<h2 style={{ width: "7rem", lineHeight: "1.8rem" }}>
					Subscription{" "}
					<span style={{ fontSize: "1.2em", letterSpacing: "0.05rem" }}>
						Organizer
					</span>
				</h2>
			</div>
			<div
				style={ms(flexCol, {
					width: "100%",
				})}
			>
				<div>
					{users?.map((user) => (
						<span key={user}>{user}</span>
					))}
				</div>
				<h2>Redirect To:</h2>
				<div
					style={ms(flexRow, {
						justifyContent: "space-around",
					})}
				>
					<RedirectButton url="https://www.youtube.com" text="Youtube" />
					<RedirectButton
						url="https://www.youtube.com/feed/subscriptions"
						text="Subscription"
					/>
				</div>
			</div>
			<div
				style={ms(flexCol, {
					width: "100%",
				})}
			>
				<h2>Quick Action</h2>
				<ResetAction />
			</div>
		</div>
	);
};

const ResetAction = (): JSX.Element => {
	const [resetStage, setResetState] = useState<boolean>(false);
	const [expandInstruction, setExpandInstruction] = useState<boolean>(false);
	const { isDarkMode } = useContext(DarkModeContext);
	useEffect(() => {
		if (resetStage) {
			requestAnimationFrame(() => {
				setExpandInstruction(true);
			});
		} else {
			setExpandInstruction(false);
		}
	}, [resetStage]);
	const resetActionItems = resetStage ? (
		<div
			style={ms(flexCol, {
				textAlign: "center",
			})}
		>
			<h3
				style={{
					overflow: "hidden",
					maxHeight: expandInstruction ? "4rem" : "0px",
					transition: "max-height 0.5s",
				}}
			>
				This will completely wipe the extension storage. Proceed?
			</h3>
			<div
				style={ms(flexRow, {
					justifyContent: "space-evenly",
					overflow: "hidden",
					margin: "0 auto",
					maxHeight: expandInstruction ? "3rem" : "0px",
					width: expandInstruction ? "100%" : "0%",
					opacity: expandInstruction ? "1" : "0",
					transition: expandInstruction
						? "width 0.5s 0.3s"
						: "width 0.7s 0.3s, max-height 1.5s 0.2s, opacity 1.5s",
				})}
			>
				<ActionButton
					text="Cancel"
					handleClick={() => {
						setExpandInstruction(false);
						setTimeout(() => {
							setResetState(false);
						}, 600);
					}}
				/>
				<ActionButton
					text="Reset"
					style={{
						backgroundColor: isDarkMode ? "#3A0000" : "#F00000",
						color: isDarkMode ? "#FFFFFF" : "#000000",
					}}
					handleClick={resetStorage}
					isAlert
				/>
			</div>
		</div>
	) : (
		<ActionButton
			text="Reset All"
			handleClick={() => {
				setResetState(true);
			}}
			style={{ margin: "0 auto" }}
		/>
	);
	return resetActionItems;
};

const RedirectButton = ({
	url,
	text,
}: { url: string; text: string }): JSX.Element => (
	<ActionButton handleClick={redirectTo} url={url} text={text} />
);

const ActionButton = ({
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
			thisButton.style.color = buttonStyle.color;
			return;
		}
		thisButton.style.backgroundColor = isDarkMode ? "#FF3030" : "#AA0000";
		thisButton.style.color = isDarkMode ? "#000000" : "#FFFFFF";
	};
	const turnDefault = (e: ReactMouseEvent | ReactFocusEvent) => {
		const thisButton = e.target as HTMLButtonElement;
		thisButton.style.backgroundColor = buttonStyle.backgroundColor;
		thisButton.style.color = buttonStyle.color;
	};

	return (
		<button
			type="button"
			data-url={url}
			style={buttonStyle}
			onClick={handleClick}
			onFocus={turnFocus}
			onBlur={turnDefault}
			onMouseOver={turnFocus}
			onMouseOut={turnDefault}
		>
			{text}
		</button>
	);
};

function redirectTo(e: ReactMouseEvent) {
	const thisButton = e.target as HTMLButtonElement;
	const url = thisButton.getAttribute("data-url");
	chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
		if (tab?.url === url) return;
		chrome.tabs.update(tab.id, { url });
	});
}

function resetStorage() {
	console.log("here in resetstronga");
	chrome.runtime.sendMessage(
		{
			msg: "reset",
		},
		(data) => {
			console.log(data, "in resetstorage");
		},
	);
	// chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
	// 	if (tabs.length === 0) return;
	// 	const currentTab = tabs[0];
	// 	if (!currentTab.url.startsWith("https://www.youtube.com")) return;
	// });
}

export default Container;
