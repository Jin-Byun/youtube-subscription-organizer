import React, {
	useState,
	useEffect,
	useContext,
	useMemo,
	type MouseEvent as ReactMouseEvent,
	type RefObject,
} from "react";
import {
	ms,
	initialStyle,
	popupContainer,
	setBackgroundColor,
	type Style,
	flexCol,
	flexRow,
} from "./styles";
import { DarkModeContext } from "./darkModeContext";
import { ActionButton } from "./components/actionButton";
import {
	Explorer,
	ExplorerContainer,
	type FolderData,
} from "./components/explorer";

const imageURL = chrome.runtime.getURL("icon-64.png");

const Container = ({
	contextMenuRef,
}: { contextMenuRef: RefObject<HTMLDivElement> }): JSX.Element => {
	const { isDarkMode } = useContext(DarkModeContext);
	const startingStyle: Style = useMemo(() => {
		return ms(flexCol, initialStyle, setBackgroundColor(isDarkMode));
	}, [isDarkMode]);

	const [style, setStyle] = useState<Style>(startingStyle);
	const [folders, setFolders] = useState<FolderData>(null);
	useEffect(() => {
		let ignore = false;
		chrome.runtime
			.sendMessage({
				msg: "getUsers",
			})
			.then((res) => {
				if (!ignore && res) {
					setFolders(res.data);
				}
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
		// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
		<div
			style={style}
			id="popup-container"
			onClick={(e: ReactMouseEvent) => {
				const el = e.target as HTMLElement;
				if (!el.closest("#contextMenu")) {
					e.preventDefault();
					const menu = contextMenuRef.current;
					menu.title = "";
					menu.removeAttribute("data-target");
					menu.removeAttribute("data-parent");
					menu.style.display = "none";
					menu.style.top = "0px";
					menu.style.left = "0px";
				}
			}}
		>
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
			<ExplorerContainer>
				{folders &&
					Object.entries(folders).map(([key, value]) => (
						<Explorer
							key={key}
							data={value}
							title={key}
							parent={key}
							contextMenuRef={contextMenuRef}
						/>
					))}
			</ExplorerContainer>
			<div
				style={ms(flexCol, {
					width: "100%",
				})}
			>
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
}

export default Container;
