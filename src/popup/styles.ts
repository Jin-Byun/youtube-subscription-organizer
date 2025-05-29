// give priority to the latter styles

type Style = { [key: string]: string };

const finalStyle = (...Styles: Style[]): Style =>
	Styles.reduce((acc, style) => Object.assign(acc, style));
