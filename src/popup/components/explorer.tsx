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

const explorerDisplayTitle = (title: string): string =>
	title.startsWith("YSO-KEY_") ? title.slice(8) : title;

export const Explorer = ({
	data,
	title,
	parent,
	contextMenuRef,
}: {
	data: FolderData | string[];
	title: string;
	parent: string;
	contextMenuRef: RefObject<HTMLDivElement>;
}): JSX.Element => {
	const { isDarkMode } = useContext(DarkModeContext);
	const [isOpen, setIsOpen] = useState<boolean>(false);

	return (
		<div
			id={title}
			data-parent={parent}
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
					const folder = (target as HTMLElement).closest(
						".folder",
					) as HTMLElement;
					const menu = contextMenuRef.current;
					menu.removeAttribute("data-parent");
					menu.setAttribute("data-target", folder.id);
					menu.setAttribute("data-parent", folder.getAttribute("data-parent"));
					menu.title = `For ${folder.id}`;
					menu.style.left = `${x}px`;
					menu.style.top = `${y}px`;
					menu.style.display = "flex";
				}}
			>
				<ChevronFolder isOpen={isOpen} isDarkMode={isDarkMode} />
				<p>{explorerDisplayTitle(title)}</p>
			</div>
			{isFolderData(data) &&
				Object.entries(data).map(
					([key, value]: [string, FolderData | string[]]) => (
						<Explorer
							key={key}
							title={key}
							parent={parent}
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
						<p
							key={channels}
							style={{
								width: "calc(100% - 1.5rem)",
								overflow: "hidden",
								whiteSpace: "nowrap",
								textOverflow: "ellipsis",
								transition: "font-weight 0.2s",
							}}
							onMouseEnter={(e: ReactMouseEvent) => {
								const thisLine = e.target as HTMLParagraphElement;
								thisLine.style.fontWeight = "bold";
							}}
							onMouseLeave={(e: ReactMouseEvent) => {
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
	const [hintVisible, setHintVisible] = useState<boolean>(true);
	const [isHover, setHover] = useState<boolean>(false);

	return (
		<>
			<ul
				id="expolorerHint"
				style={{
					width: "100%",
					maxHeight: hintVisible ? "4rem" : "0",
					marginLeft: "0.5rem",
					overflow: "clip",
					lineHeight: "1.25rem",
					listStyleType: "none",
					transition: "max-height 0.3s",
					pointerEvents: "none",
				}}
			>
				<li>Click on Folder to expand</li>
				<li>Click on Channels to navigate</li>
				<li>Right-Click to toggle edit Menu</li>
			</ul>
			<div
				style={ms(flexCol, {
					width: "100%",
					padding: "0.5rem",
					borderRadius: "0.25rem 0.25rem 0 0.25rem",
					gap: "0rem",
					backgroundColor: isDarkMode ? "#000" : "#EEE",
					paddingBottom: isOpen ? "0.5rem" : "0.25rem",
					maxHeight: isOpen ? "12rem" : "2rem",
					overflow: isOpen ? "auto" : "clip",
					scrollbarWidth: "thin",
					scrollbarColor: "#ABABAB transparent",
				})}
				onMouseEnter={() => {
					setHover(true);
				}}
				onMouseLeave={() => {
					setHover(false);
				}}
			>
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
				<div
					style={{
						position: "absolute",
						top: "calc(100% - 9rem)",
						right: "1rem",
						display: "flex",
						margin: "-0.5rem 0 0 auto",
						alignItems: "center",
						overflow: "clip",
						backgroundColor: isDarkMode ? "#000" : "#EEE",
						borderRadius: "0 0 0.25rem 0.25rem",
						paddingInline: "0.5rem",
						paddingBlock: isHover ? "0.5rem" : "0",
						maxHeight: isHover ? "2rem" : "0",
						transition: "padding 0.3s, max-height 0.3s",
					}}
					onMouseEnter={() => {
						setHover(true);
					}}
					onMouseLeave={() => {
						setHover(false);
					}}
					onClick={() => {
						setHintVisible((prev) => !prev);
					}}
				>
					{hintVisible ? "Hide" : "Show"} Hint
					<div
						style={{
							width: "2rem",
							height: "1.25rem",
							marginLeft: "0.5rem",
							padding: "0.1rem",
							borderRadius: "1rem",
							border: "1px solid black",
							backgroundColor: hintVisible ? "#F006" : "#777",
						}}
					>
						<div
							style={{
								position: "relative",
								left: hintVisible ? "0.8rem" : "0",
								width: "0.9rem",
								height: "0.9rem",
								borderRadius: "100%",
								border: "1px solid black",
								backgroundColor: isDarkMode ? "#2D2D2D" : "#FFFFFF",
								transition: "left 0.3s",
							}}
						/>
					</div>
				</div>
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
		</>
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
