import opentype from "opentype.js";

let fonts: { [key: string]: Promise<ExtendedFont> } = {};

/**
 * Loads a font asynchronously based on the provided prefix and section.
 *
 * @param prefix - The prefix for the font URL or the font name.
 * @param section - An optional section of the font to load. Defaults to an empty string.
 * @returns A promise that resolves to an ExtendedFont object.
 *
 * @throws Will reject the promise if there is an error during the font loading process.
 */
export async function loadFont(prefix: string, section = "") {
	return (fonts[`${prefix}${section}`] ??= new Promise(
		async (resolve, reject) => {
			try {
				const base = /^(https?:|\/|\.)/.test(prefix)
					? prefix
					: `https://cdn.jsdelivr.net/npm/bunhae-fonts/dist/${prefix.replaceAll(
							" ",
							"-"
					  )}`;

				let url = `${base}/Bunhae${section}.woff2`;

				const resp = await fetch(url);
				let buf = await resp.arrayBuffer();

				let { default: decompress } = await import(
					"woff2-encoder/decompress"
				);

				const fontBuffer = await decompress(buf);
				const font = opentype.parse(
					fontBuffer.buffer.slice(
						fontBuffer.byteOffset,
						fontBuffer.byteLength + fontBuffer.byteOffset
					)
				);
				resolve(font as ExtendedFont);
			} catch (e) {
				reject(e);
			}
		}
	));
}

/**
 * Retrieves the glyph for a given character from a specified font.
 *
 * @param ch - The character for which to retrieve the glyph.
 * @param fontFamily - The font to use for rendering the glyph. Defaults to "Noto-Sans-KR-Regular".
 * @returns A promise that resolves to the glyph corresponding to the given character.
 *
 * @remarks
 * If the character is a Hangul syllable (Unicode range 0xAC00 to 0xD7A3), the function will attempt to load a specific font range to find the glyph.
 *
 * @example
 * ```typescript
 * const glyph = await getGlyph('가');
 * console.log(glyph);
 * ```
 */
export async function getGlyph(
	ch: string,
	fontFamily = "Noto-Sans-KR-Regular"
) {
	let font = await loadFont(fontFamily);

	let glyph = font.charToGlyph(ch);

	glyph.font ??= font;

	if (glyph.index) {
		return glyph;
	}

	const code = ch.charCodeAt(0);
	if (0xac00 <= code && code <= 0xd7a3) {
		const i = Math.floor((code - 0xac00) / 200);
		const range_start = 0xac00 + i * 200;
		const range_end = range_start + 200 - 1;
		const key = `-${range_start.toString(16)}-${range_end.toString(16)}`;
		font = await loadFont(fontFamily, key.toUpperCase());
		glyph = font.charToGlyph(ch);
		glyph.font ??= font;
	}

	return glyph as ExtendedGlyph;
}
