import React, {
	createContext,
	useEffect,
	useState,
	type FC,
	type ReactNode,
} from "react";

type DarkModeContextType = {
	isDarkMode: boolean;
};

interface DarkModeProviderProps {
	children: ReactNode;
}

export const DarkModeContext = createContext<DarkModeContextType>({
	isDarkMode: false,
});

export const DarkModeProvider: FC<DarkModeProviderProps> = ({ children }) => {
	const isDarkMode = useDarkMode();

	return (
		<DarkModeContext.Provider value={{ isDarkMode }}>
			{children}
		</DarkModeContext.Provider>
	);
};

const useDarkMode = (): boolean => {
	const [isDarkMode, setIsDarkMode] = useState(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		setIsDarkMode(mediaQuery.matches);

		const handleChange = (event: MediaQueryListEvent) => {
			setIsDarkMode(event.matches);
		};

		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, []);

	return isDarkMode;
};
