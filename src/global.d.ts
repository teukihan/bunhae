/// <reference types="vite/client" />

interface ExtendedFont extends opentype.Font {
	charToGlyph(ch: string): ExtendedGlyph;
}

interface ExtendedGlyph extends opentype.Glyph {
	font: opentype.Font;
}
