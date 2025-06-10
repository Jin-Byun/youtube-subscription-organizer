import React, { type RefObject } from "react";
import { DarkModeContext } from "../darkModeContext";
import { ActionButton } from "./actionButton";
import { ms, flexRow, type Style } from "../styles";

type DeletionTarget = {
	target: string;
	parent: string | undefined;
} | null;

const spanStyle = (isDark: boolean): Style => ({
	color: isDark ? "#F00000" : "#3A0000",
});

const explorerDisplayTitle = (title: string): string =>
	title.startsWith("YSO-KEY_") ? title.slice(8) : title;

const DeleteMessage = (
	{ target, parent }: DeletionTarget,
	isDarkMode: boolean,
): JSX.Element => (
	<p>
		This will remove
		{parent === target ? (
			<span> All folders </span>
		) : (
			<span style={spanStyle(isDarkMode)}> the {target} folder </span>
		)}
		from account:
		<span
			style={spanStyle(isDarkMode)}
		>{` ${explorerDisplayTitle(parent)}. `}</span>
		Do you confirm?
	</p>
);

export const ContextMenu = ({
	ref,
}: { ref: RefObject<HTMLDivElement> }): JSX.Element => {
	const { isDarkMode } = React.useContext(DarkModeContext);
	const [deletionTarget, setDeletionTarget] =
		React.useState<DeletionTarget>(null);

	React.useEffect(() => {
		if (ref.current) {
			const observer = new MutationObserver((list) => {
				if (!deletionTarget) return;
				const mutation = list[0];
				if (
					mutation.oldValue !== ref.current.getAttribute(mutation.attributeName)
				) {
					setDeletionTarget(null);
				}
			});
			observer.observe(ref.current, {
				attributeFilter: ["data-target"],
				attributeOldValue: true,
			});
			return () => observer.disconnect();
		}
	}, [deletionTarget, ref.current]);

	const resetMenu = () => {
		const el = ref.current;
		el.removeAttribute("data-target");
		el.removeAttribute("data-parent");
		el.title = "";
		el.style.display = "none";
		el.style.top = "0px";
		el.style.left = "0px";
		setDeletionTarget(null);
	};

	const PreDeleteComponents = (): JSX.Element => (
		<>
			{/* biome-ignore lint/a11y/useKeyWithMouseEvents: <explanation> */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
			<h4
				style={{
					padding: "0.5rem 0.75rem",
					borderBottom: "1px dashed #444",
					cursor: "pointer",
					transition: "background-color 0.3s, letter-spacing 0.3s",
				}}
				onMouseEnter={(e) => {
					const el = e.target as HTMLHeadingElement;
					el.style.backgroundColor = isDarkMode ? "#300" : "#C77";
					el.style.letterSpacing = "0.5px";
				}}
				onMouseLeave={(e) => {
					const el = e.target as HTMLHeadingElement;
					el.style.backgroundColor = isDarkMode ? "#000" : "#FFF";
					el.style.letterSpacing = "normal";
				}}
				onClick={() => {
					const el = ref.current;
					const target = el.getAttribute("data-target");
					const parent = el.getAttribute("data-parent");
					setDeletionTarget({
						target,
						parent,
					});
					// initialize menu for next step
					el.style.top = "6rem";
					el.style.left = "0.5rem";
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
				onMouseEnter={(e) => {
					const el = e.target as HTMLHeadingElement;
					el.style.backgroundColor = isDarkMode ? "#333" : "#CCC";
					el.style.letterSpacing = "0.5px";
				}}
				onMouseLeave={(e) => {
					const el = e.target as HTMLHeadingElement;
					el.style.backgroundColor = isDarkMode ? "#000" : "#FFF";
					el.style.letterSpacing = "normal";
				}}
				onClick={resetMenu}
			>
				close
			</h4>
		</>
	);

	const PostDeletionComponents = (): JSX.Element => (
		<>
			<h3>{DeleteMessage(deletionTarget, isDarkMode)}</h3>
			<div
				style={ms(flexRow, {
					justifyContent: "space-evenly",
					overflow: "hidden",
					maxHeight: "3rem",
					marginTop: "1rem",
					width: "100%",
				})}
			>
				<ActionButton text="Cancel" handleClick={resetMenu} />
				<ActionButton
					text="Delete"
					style={{
						backgroundColor: isDarkMode ? "#3A0000" : "#F00000",
						color: isDarkMode ? "#FFFFFF" : "#000000",
					}}
					handleClick={() => {
						const { parent, target } = deletionTarget;
						chrome.runtime.sendMessage(
							{ msg: "remove", parent, target },
							(response) => {
								if (!response.success) {
									console.error("failed to remove:", target);
									return;
								}
								// remove the folder from directory
								const targetFolder = document.getElementById(target);
								targetFolder.style.color = isDarkMode ? "#F00000" : "#3A0000";
								targetFolder.style.marginLeft = "1rem";
								targetFolder.style.width = "fit-content";
								targetFolder.innerHTML = `${explorerDisplayTitle(target)} Removed!`;
								resetMenu();
								setTimeout(() => {
									targetFolder.remove();
								}, 1500);
							},
						);
					}}
					isAlert
				/>
			</div>
		</>
	);
	return (
		<div
			ref={ref}
			id="contextMenu"
			style={{
				width: deletionTarget ? "13rem" : "5rem",
				padding: deletionTarget ? "0.5rem" : "0",
				textAlign: "center",
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
			{!deletionTarget ? <PreDeleteComponents /> : <PostDeletionComponents />}
		</div>
	);
};
