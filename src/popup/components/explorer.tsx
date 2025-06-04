import React, {
	useState,
	useContext,
	type MouseEvent as ReactMouseEvent,
	type ReactNode,
	type RefObject,
} from "react";
import { ms, flexCol, flexRow, type Style } from "../styles";
import { DarkModeContext } from "../darkModeContext";
import { OpenChevron, ClosedChevron } from "./chevron";

const handleContextMenu = (e: ReactMouseEvent) => {};

export const Explorer = ({
	data,
	title,
	contextMenuRef,
}: {
	data: FolderData | string[];
	title: string;
	contextMenuRef: RefObject<HTMLDivElement>;
}): JSX.Element => {
	const { isDarkMode } = useContext(DarkModeContext);
	const [isOpen, setIsOpen] = useState<boolean>(false);

	return (
		<div
			id={title}
			className="folder"
			style={ms(flexCol, {
				width: "100%",
				padding: "0.25rem",
				gap: "0rem",
				maxHeight: isOpen ? "fit-content" : "1.5rem",
				overflow: "clip",
			})}
		>
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: It's a div */}
			<div
				style={ms(flexRow, channelTitleStyle, {
					marginBottom: isOpen ? "0.25rem" : "0",
				})}
				onClick={() => {
					setIsOpen((prev) => !prev);
				}}
				onContextMenu={(e: ReactMouseEvent) => {
					e.preventDefault();
					const { target, clientX: x, clientY: y } = e;
					const folder = (target as HTMLElement).closest(".folder");
					console.log(folder.id, x, y);
					contextMenuRef.current.style.left = `${x}px`;
					contextMenuRef.current.style.top = `${y}px`;
					contextMenuRef.current.style.display = "flex";
				}}
			>
				<ChevronFolder isOpen={isOpen} isDarkMode={isDarkMode} />
				<p>{title}</p>
			</div>
			{isFolderData(data) &&
				Object.entries(data).map(
					([key, value]: [string, FolderData | string[]]) => (
						<Explorer
							key={key}
							title={key}
							data={value}
							contextMenuRef={contextMenuRef}
						/>
					),
				)}
			{Array.isArray(data) &&
				data.map((channels, i) => (
					<div
						key={channels}
						title="Click to navigate to Channel"
						style={ms(flexRow, channelTitleStyle, {
							margin: `${!i ? 0.25 : 0.5}rem 0 0 0.5rem`,
						})}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1}
							stroke="currentColor"
							width={16}
							height={16}
						>
							<title>Play Logo</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
							/>
						</svg>
						{/* biome-ignore lint/a11y/useKeyWithMouseEvents: no need for it */}
						<p
							key={channels}
							style={{
								width: "calc(100% - 1.5rem)",
								overflow: "hidden",
								whiteSpace: "nowrap",
								textOverflow: "ellipsis",
							}}
							onMouseOver={(e: ReactMouseEvent) => {
								const thisLine = e.target as HTMLParagraphElement;
								thisLine.style.fontWeight = "bold";
							}}
							onMouseOut={(e: ReactMouseEvent) => {
								const thisLine = e.target as HTMLParagraphElement;
								thisLine.style.fontWeight = "normal";
							}}
						>
							{channels}
						</p>
					</div>
				))}
		</div>
	);
};

export const ExplorerContainer = ({
	children,
}: { children: ReactNode }): JSX.Element => {
	const { isDarkMode } = useContext(DarkModeContext);
	const [isOpen, setIsOpen] = useState<boolean>(true);

	return (
		<div
			style={ms(flexCol, {
				width: "100%",
				padding: "0.25rem",
				gap: "0rem",
				backgroundColor: isDarkMode ? "#000" : "#FFF",
				paddingBottom: isOpen ? "0.5rem" : "0.25rem",
				maxHeight: isOpen ? "15rem" : "1.5rem",
				overflow: isOpen ? "auto" : "clip",
				scrollbarWidth: "thin",
				scrollbarColor: "#ABABAB transparent",
			})}
		>
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: It's a div */}
			<div
				style={ms(flexRow, channelTitleStyle, {
					marginBottom: "0.25rem",
				})}
				onClick={() => {
					setIsOpen((prev) => !prev);
				}}
			>
				<ChevronFolder isOpen={isOpen} isDarkMode={isDarkMode} />
				<p>Subscription Folders</p>
			</div>
			{children}
		</div>
	);
};

const channelTitleStyle: Style = {
	textAlign: "center",
	userSelect: "none",
	alignItems: "center",
	cursor: "pointer",
	gap: "0.5rem",
};

export type FolderData = {
	[keys: string]: string[] | FolderData;
};
const isFolderData = (
	data: string[] | FolderData | undefined,
): data is FolderData => data && !Array.isArray(data);

const closedFolderURL = chrome.runtime.getURL("folder.svg");
const openFolderURL = chrome.runtime.getURL("folderOpen.svg");
const ChevronFolder = ({
	isOpen,
	isDarkMode,
}: { isOpen: boolean; isDarkMode: boolean }): JSX.Element => (
	<>
		{isOpen ? <OpenChevron /> : <ClosedChevron />}
		<img
			src={isOpen ? openFolderURL : closedFolderURL}
			alt="folder icon"
			width={16}
			height={16}
			style={{
				filter: isDarkMode ? "invert(1)" : "",
			}}
		/>
	</>
);
