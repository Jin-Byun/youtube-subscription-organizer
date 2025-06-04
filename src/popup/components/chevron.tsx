import React from "react";

export const OpenChevron = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		strokeWidth={1.5}
		width={12}
		height={12}
		stroke="currentColor"
	>
		<title>Open Chevron</title>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="m19.5 8.25-7.5 7.5-7.5-7.5"
		/>
	</svg>
);

export const ClosedChevron = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		strokeWidth={1.5}
		width={12}
		height={12}
		stroke="currentColor"
	>
		<title>Closed Chevron</title>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="m8.25 4.5 7.5 7.5-7.5 7.5"
		/>
	</svg>
);
