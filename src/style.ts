import _style_content from "./bunhae.module.css?raw";
import style_content_min from "../generated/bunhae.module.css?raw";

let style_content =
	import.meta.env.MODE === "development" ? _style_content : style_content_min;

let stylesheet: CSSStyleSheet;

export let BunhaeClass =
	style_content.match(/\.([a-zA-Z0-9_-]+)\s*{/)?.[1] ?? "bunhae";

export const installBunhaeStyle = () => {
	let sheet = getStyleSheet();
	if (!document.adoptedStyleSheets.includes(sheet)) {
		document.adoptedStyleSheets.push(sheet);
	}
};

export function getStyleSheet() {
	if (stylesheet) {
		return stylesheet;
	}

	stylesheet = new CSSStyleSheet();
	stylesheet.replaceSync(style_content);

	return stylesheet;
}
