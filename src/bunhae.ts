import fastdiff from "fast-diff";

import { syllablePartCounts, splitArrayBySizes } from "./utils";
import { loadFont, getGlyph } from "./fontLoader";
import { BunhaeClass, getStyleSheet, installBunhaeStyle } from "./style";

// Server side rendering fallback for HTMLElement
(globalThis as any).HTMLElement ??= class HTMLElement {};

let observer: MutationObserver;
const temporaryTextarea = globalThis.document?.createElement("textarea");

const segmenter = new Intl.Segmenter("ko", { granularity: "grapheme" });

const partNames = ["initial", "medial", "final"];

interface StylingOption {
	colors: string[];
}

const combinedVowels: { [key: number]: string } = {
	12632: "ㅘ",
	12633: "ㅙ",
	12634: "ㅚ",
	12637: "ㅝ",
	12638: "ㅞ",
	12639: "ㅟ",
	12642: "ㅢ",
};

const combinedConsonants: { [key: number]: string } = {
	//	0x11a8: "ㄱ",
	0x11a9: "ㄲ",
	0x11aa: "ㄳ",
	//	0x11ab: "ㄴ",
	0x11ac: "ㄵ",
	0x11ad: "ㄶ",
	//	0x11ae: "ㄷ",
	//	0x11af: "ㄹ",
	0x11b0: "ㄺ",
	0x11b1: "ㄻ",
	0x11b2: "ㄼ",
	0x11b3: "ㄽ",
	0x11b4: "ㄾ",
	0x11b5: "ㄿ",
	0x11b6: "ㅀ",
	//	0x11b7: "ㅁ",
	//	0x11b8: "ㅂ",
	0x11b9: "ㅄ",
	//	0x11ba: "ㅅ",
	0x11bb: "ㅆ",
	//	0x11bc: "ㅇ",
	// 0x11bd: "ㅈ",
	// 0x11be: "ㅊ",
	// 0x11bf: "ㅋ",
	// 0x11c0: "ㅌ",
	// 0x11c1: "ㅍ",
	// 0x11c2: "ㅎ",
};

// Define the Bunhae custom element
export default class Bunhae extends HTMLElement {
	static async preload(font = "Noto Sans KR Regular", section = "") {
		return loadFont(font, section);
	}

	static observedAttributes = ["cache", "replace", "flags", "render-font"];

	private container: HTMLSpanElement = undefined!;

	private root: any;
	private renderFont = "Noto Sans KR Regular";
	private useCache: boolean = true;
	private cache: Map<string, string> = new Map();
	private alwaysReplace: boolean = false;

	private lastText = "";

	constructor() {
		super();
	}

	/**
	 * Processes the inner HTML of an element by performing the following steps:
	 * 1. Trims leading and trailing whitespace.
	 * 2. Replaces multiple whitespace characters with a single space.
	 * 3. Converts <br> tags to newline characters.
	 * 4. Removes all other HTML tags.
	 * 5. Decodes HTML entities.
	 *
	 * @returns {string} The processed text content with HTML entities decoded.
	 */
	public explainText(): string {
		let result = this.innerHTML
			.trim()
			.replace(/\s+/g, " ")
			.replace(/\s+/g, " ")
			.replace(/<br[^>]*>\s*/g, "\n")
			.replace(/<[^>]+>/g, "");

		// Decode HTML entities
		temporaryTextarea.innerHTML = result;
		return temporaryTextarea.value;
	}

	public async connectedCallback() {
		const text = this.explainText();
		this.container = document.createElement("span");
		this.container.setAttribute("part", "container");

		let shadow = this.getAttribute("shadow");
		if (shadow !== "false") {
			const shadowRoot = this.attachShadow({ mode: "open" });
			const sheet = getStyleSheet();
			shadowRoot.adoptedStyleSheets = [sheet];
			this.root = document.createElement("span");
			this.root.classList.add(BunhaeClass);
			shadowRoot.append(this.root);

			// Initialize mutation observer
			observer ??= new MutationObserver((mutations) => {
				let set = new Set<Bunhae>();

				mutations.forEach((mutation) => {
					const target = mutation.target;

					let parent = target;
					while (parent && !(parent instanceof Bunhae)) {
						parent = parent.parentNode!;
					}
					if (!(parent instanceof Bunhae)) {
						return;
					}

					let self = parent as Bunhae;
					set.add(self);
				});
				set.forEach((self) => {
					self.updateText(self.explainText());
				});
			});

			observer.observe(this, {
				characterData: true,
				childList: true,
				subtree: true,
			});

			this.classList.add(BunhaeClass);
		} else {
			installBunhaeStyle();
			this.root = this;
			this.classList.add(BunhaeClass);
			this.innerHTML = "";
		}

		this.root.append(this.container);
		this.replaceText(text);
	}

	public attributeChangedCallback(
		name: string,
		_oldValue: any,
		newValue: string
	) {
		switch (name) {
			case "cache":
				this.useCache = newValue === "true";
				break;
			case "replace":
				this.alwaysReplace = newValue === "true";
				break;
			case "render-font":
				this.renderFont = newValue;
				break;
			case "flags":
				this.setFlags(newValue);
				break;
		}
	}

	/**
	 * Gets the list of adopted stylesheets for the shadow root.
	 *
	 * @returns {CSSStyleSheet[] | undefined} An array of `CSSStyleSheet` objects if the shadow root exists, otherwise `undefined`.
	 */
	get adoptedStyleSheets(): CSSStyleSheet[] | undefined {
		return this.shadowRoot?.adoptedStyleSheets;
	}

	/**
	 * Sets the adopted style sheets for the shadow root of the component.
	 *
	 * @param value - An array of CSSStyleSheet objects to be adopted by the shadow root.
	 *
	 * If the shadow root does not exist or the value is falsy, the method returns without making any changes.
	 */
	set adoptedStyleSheets(value) {
		if (!this.shadowRoot || !value) {
			return;
		}

		this.shadowRoot.adoptedStyleSheets = value;
	}

	private insertChar(ch: string, before_target: Node | null) {
		if (ch == " ") {
			let space = document.createTextNode(" ");
			this.container.insertBefore(space, before_target);
			return;
		}

		if (ch == "\n") {
			let br = document.createElement("br");
			this.container.insertBefore(br, before_target);
			return;
		}

		const span = document.createElement("span");
		span.setAttribute("part", "glyph");
		span.innerHTML = `<span part="char">${ch}</span>`;
		this.container.insertBefore(span, before_target);
		return this.generateSVG(ch).then((svg) => {
			svg && span.insertAdjacentHTML("afterbegin", svg);
		});
	}

	/**
	 * Generates HTML content from the given text, applying specified colors and flags.
	 *
	 * @param text - The input text to be converted into HTML.
	 * @param options - An optional object containing customization options.
	 * @param options.textColor - The color to be applied to the text.
	 * @param options.colors - An array of colors to be used for the SVG generation.
	 * @param options.flags - A string of flags that determine the color application pattern.
	 * @returns A promise that resolves to a string of HTML content.
	 */
	async generateHTML(
		text: string,
		{
			textColor = undefined as string | undefined,
			colors = [
				"currentColor",
				"currentColor",
				"currentColor",
				"currentColor",
				"currentColor",
			],
			flags = "",
		} = {}
	) {
		let result = [];

		let flaglist = flags.replace(
			/([0-9a-z])\{(\d+)\}/gi,
			(_, number, count) => {
				return number.repeat(count);
			}
		);

		let len = flaglist.length;
		let last_flag = len ? flaglist.charAt(len - 1) : "v";

		let i = 0;
		for (const { segment: ch } of segmenter.segment(text)) {
			// @ts-ignore
			let flag: number = parseInt(i < len ? flaglist[i] : last_flag, 36);
			i++;

			if (ch == " ") {
				result.push(" ");
				continue;
			}

			if (ch == "\n") {
				result.push("<br />");
				continue;
			}

			result.push(
				this.generateSVG(ch, {
					colors: [
						flag & 1 ? colors[0] : "currentColor",
						flag & 2 ? colors[1] : "currentColor",
						flag & 4 ? colors[2] : "currentColor",
						flag & 8 ? colors[3] : "currentColor",
						flag & 16 ? colors[4] : "currentColor",
					],
				}).then((svg) => {
					let textcolor =
						flag & 1 ? textColor ?? colors[0] : "currentColor";
					return `<span style="position:relative;display:inline-block;">${svg}<span style="color:${
						svg ? "transparent" : textcolor
					}">${ch}</span></span>`;
				})
			);
		}

		return Promise.all(result).then((r) => r.join(""));
	}

	/**
	 * Generates an SVG representation of the given text with optional styling.
	 *
	 * @param text - The text to generate the SVG for.
	 * @param styling - Optional styling options for the SVG.
	 * @returns A promise that resolves to the generated SVG string.
	 *
	 * The function handles Hangul syllables, compatible consonants, and vowels.
	 * It uses caching if enabled and retrieves glyph data to construct the SVG paths.
	 *
	 * The generated SVG can be styled with colors if the `styling` parameter is provided.
	 *
	 * @example
	 * ```typescript
	 * const svg = await generateSVG("한글", { colors: ["#ff0000", "#00ff00", "#0000ff"] });
	 * console.log(svg);
	 * ```
	 */
	async generateSVG(text: string, styling?: StylingOption) {
		if (text.length > 1) {
			let r: string[] = [];
			for (const { segment: c } of segmenter.segment(text)) {
				r.push(await this.generateSVG(c, styling));
			}
			return r.join("");
		}

		if (!styling && this.useCache) {
			const cached = this.cache.get(text);
			if (cached) {
				return cached;
			}
		}

		const charCode = text.charCodeAt(0);
		const isCompatibleConsonant = 0x3131 <= charCode && charCode <= 0x314e; // 호환 자음
		const isCompatibleVowel = 0x314f <= charCode && charCode <= 0x3163; // 호환 모음
		const isHangulSyllable = 0xac00 <= charCode && charCode <= 0xd7a3;

		if (!isCompatibleConsonant && !isCompatibleVowel && !isHangulSyllable) {
			return "";
		}

		const glyph = await getGlyph(text, this.renderFont);
		if (!glyph.index) {
			return "";
		}
		const path = glyph.path.toPathData(0);
		const paths = path.split("Z");

		const initial = text.charCodeAt(0) - 0xac00;
		const initialIndex = Math.floor(initial / 588);
		const medialIndex = Math.floor((initial - initialIndex * 588) / 28);
		const finalIndex = initial % 28;

		let combinedVowel = !!combinedVowels[medialIndex + 12623];
		let combinedConsonant =
			finalIndex && combinedConsonants[finalIndex + 0x11a7];

		let arrs;

		if (isCompatibleConsonant) {
			arrs = [paths];
		} else if (isCompatibleVowel) {
			arrs = [[], paths];
		} else {
			arrs = splitArrayBySizes(
				paths,
				syllablePartCounts[0x1100 + initialIndex],
				syllablePartCounts[0x1161 + medialIndex],
				finalIndex && syllablePartCounts[0x11a7 + finalIndex]
			);
		}

		const result = (
			styling
				? [
						`<svg style="position:absolute;width:100%;height:100%" viewBox="0 0 ${
							glyph.advanceWidth
						} ${glyph.font.ascender + glyph.font.descender}">`,
						...arrs.map((paths, i) => {
							if (!paths.length) {
								return `<path />`;
							}

							if (i == 1) {
								if (combinedVowel) {
									let v1 = paths.slice(0, 1);
									let v2 = paths.slice(1);

									return `<path style="paint-order:stroke fill;transform:scale(1,-1);translate:0 100%" fill="${
										styling.colors[i]
									}" d="${v1.join(
										"Z"
									)}Z" /><path style="paint-order:stroke fill;transform:scale(1,-1);translate:0 100%" fill="${
										styling.colors[i + 1]
									}" d="${v2.join("Z")}Z" />`;
								} else {
									return `<path style="paint-order:stroke fill;transform:scale(1,-1);translate:0 100%" fill="${
										styling.colors[i]
									}" d="${paths.join("Z")}Z" /><path />`;
								}
							}

							if (i == 2) {
								if (combinedConsonant) {
									let len = combinedConsonant == "ㅄ" ? 2 : 1;
									let v1 = paths.slice(0, len);
									let v2 = paths.slice(len);

									return `<path style="paint-order:stroke fill;transform:scale(1,-1);translate:0 100%" fill="${
										styling.colors[3]
									}" d="${v1.join(
										"Z"
									)}Z" /><path style="paint-order:stroke fill;transform:scale(1,-1);translate:0 100%" fill="${
										styling.colors[4]
									}" d="${v2.join("Z")}Z" />`;
								} else {
									return `<path style="paint-order:stroke fill;transform:scale(1,-1);translate:0 100%" fill="${
										styling.colors[3]
									}" d="${paths.join("Z")}Z" /><path />`;
								}
							}

							return `<path style="paint-order:stroke fill;transform:scale(1,-1);translate:0 100%" fill="${
								styling.colors[i == 2 ? 3 : i]
							}" d="${paths.join("Z")}Z" />`;
						}),
						"</svg>",
				  ]
				: [
						`<svg part="svg" viewBox="0 0 ${glyph.advanceWidth} ${
							glyph.font.ascender + glyph.font.descender
						}">`,
						...arrs.map((paths, i) => {
							if (!paths.length) {
								return `<path />`;
							}

							if (i == 1) {
								if (combinedVowel) {
									let v1 = paths.slice(0, 1);
									let v2 = paths.slice(1);

									return `<path part="${
										partNames[i]
									}" d="${v1.join("Z")}Z" /><path part="${
										partNames[i]
									}-secondary" d="${v2.join("Z")}Z" />`;
								}

								return `<path part="${
									partNames[i]
								}" d="${paths.join("Z")}Z" /><path />`;
							}

							if (i == 2) {
								if (combinedConsonant) {
									let len = combinedConsonant == "ㅄ" ? 2 : 1;
									let v1 = paths.slice(0, len);
									let v2 = paths.slice(len);

									return `<path part="${
										partNames[i]
									}" d="${v1.join("Z")}Z" /><path part="${
										partNames[i]
									}-secondary" d="${v2.join("Z")}Z" />`;
								}
							}

							return `<path part="${
								partNames[i]
							}" d="${paths.join("Z")}Z" />`;
						}),
						"</svg>",
				  ]
		).join("");

		if (this.useCache) {
			this.cache.set(text, result);
		}

		return result;
	}

	get text() {
		return this.lastText;
	}

	set text(text: string) {
		this.updateText(text);
	}

	public replaceText(text: string) {
		let s = performance.now();
		this.container.innerHTML = "";
		this.lastText = text;
		let prs: any[] = [];

		for (const ch of segmenter.segment(text)) {
			prs.push(this.insertChar(ch.segment, null));
		}

		this.setFlags(this.getAttribute("flags"));

		Promise.all(prs).then(() => {
			this.dispatchRenderCompleteEvent(performance.now() - s);
		});
	}

	public updateText(text: string, replace = false) {
		if (text === this.lastText) {
			return;
		}

		if (!this.container.parentNode) {
			this.container.innerHTML = "";
			this.innerHTML = "";
			this.root.append(this.container);
			replace = true;
		}

		if (this.alwaysReplace || replace) {
			this.replaceText(text);
			return;
		}

		let s = performance.now();
		let prs = [];

		const diff = fastdiff(this.lastText, text);
		let index = 0;

		this.lastText = text;

		for (const [op, str] of diff) {
			let segments = segmenter.segment(str);

			if (op === fastdiff.DELETE) {
				for (const _ of segments) {
					this.container.childNodes[index].remove();
				}
			} else if (op === fastdiff.INSERT) {
				for (const segment of segments) {
					prs.push(
						this.insertChar(
							segment.segment,
							this.container.childNodes[index++]
						)
					);
				}
			} else {
				index += Array.from(segments).length;
			}
		}

		this.setFlags(this.getAttribute("flags"));

		Promise.all(prs).then(() => {
			this.dispatchRenderCompleteEvent(performance.now() - s);
		});
	}

	private dispatchRenderCompleteEvent(time: number) {
		this.dispatchEvent(
			new CustomEvent("rendercomplete", {
				detail: time,
			})
		);
	}

	/**
	 * Sets the flags on the container's child nodes based on the provided flags string.
	 * If the flags string is null, it removes the "flag" attribute from all child nodes.
	 * If the flags string contains patterns like `number{count}`, it expands them to repeat the number `count` times.
	 *
	 * @param flags - A string representing the flags to set, or null to remove all flags.
	 *
	 * @remarks
	 * - The method first checks if the `root` and `container` properties are defined.
	 * - If `flags` is null, it removes the "flag" attribute from all elements with the "flag" attribute.
	 * - If `flags` is provided, it processes the string to expand any patterns and sets the "flag" attribute on each child node.
	 * - If the number of child nodes exceeds the length of the flags string, the last flag character is used for the remaining nodes.
	 */
	public async setFlags(flags: string | null) {
		if (!this.root || !this.container) {
			return;
		}

		if (!flags) {
			this.container
				.querySelectorAll("[flag]")
				.forEach((span) => span.removeAttribute("flag"));
			return;
		}

		let flaglist = flags.replace(
			/([0-9a-z])\{(\d+)\}/gi,
			(_, number, count) => {
				return number.toLowerCase().repeat(count);
			}
		);

		let len = flaglist.length;
		let last_flag = flaglist.charAt(len - 1);

		this.container.childNodes.forEach((span, i) => {
			let flag = i < len ? flaglist[i] : last_flag;
			if (span.nodeType === /*Node.ELEMENT_NODE*/ 1) {
				// @ts-ignore
				span.setAttribute("flag", flag);
			}
		});
	}
}
