// Define counts for different Korean characters
export const syllablePartCounts: { [key: number]: number } = {
	0x1100: 1, // ㄱ
	0x1101: 2, // ㄲ
	0x1102: 1, // ㄴ
	0x1103: 1, // ㄷ
	0x1104: 2, // ㄸ
	0x1105: 1, // ㄹ
	0x1106: 2, // ㅁ
	0x1107: 2, // ㅂ
	0x1108: 4, // ㅃ
	0x1109: 1, // ㅅ
	0x110a: 1, // ㅆ
	0x110b: 2, // ㅇ
	0x110c: 1, // ㅈ
	0x110d: 1, // ㅉ
	0x110e: 1, // ㅊ
	0x110f: 1, // ㅋ
	0x1110: 1, // ㅌ
	0x1111: 2, // ㅍ
	0x1112: 3, // ㅎ

	0x1161: 1, // ㅏ
	0x1162: 1, // ㅐ
	0x1163: 1, // ㅑ
	0x1164: 2, // ㅒ
	0x1165: 1, // ㅓ
	0x1166: 2, // ㅔ
	0x1167: 1, // ㅕ
	0x1168: 2, // ㅖ
	0x1169: 1, // ㅗ
	0x116a: 2, // ㅘ
	0x116b: 2, // ㅙ
	0x116c: 2, // ㅚ
	0x116d: 1, // ㅛ
	0x116e: 1, // ㅜ
	0x116f: 2, // ㅝ
	0x1170: 3, // ㅞ
	0x1171: 2, // ㅟ
	0x1172: 1, // ㅠ
	0x1173: 1, // ㅡ
	0x1174: 2, // ㅢ
	0x1175: 1, // ㅣ

	0x11a8: 1, // ㄱ
	0x11a9: 2, // ㄲ
	0x11aa: 2, // ㄳ
	0x11ab: 1, // ㄴ
	0x11ac: 2, // ㄵ
	0x11ad: 4, // ㄶ
	0x11ae: 1, // ㄷ
	0x11af: 1, // ㄹ
	0x11b0: 2, // ㄺ
	0x11b1: 3, // ㄻ
	0x11b2: 3, // ㄼ
	0x11b3: 2, // ㄽ
	0x11b4: 2, // ㄾ
	0x11b5: 3, // ㄿ
	0x11b6: 4, // ㅀ
	0x11b7: 2, // ㅁ
	0x11b8: 2, // ㅂ
	0x11b9: 3, // ㅄ
	0x11ba: 1, // ㅅ
	0x11bb: 2, // ㅆ
	0x11bc: 2, // ㅇ
	0x11bd: 1, // ㅈ
	0x11be: 1, // ㅊ
	0x11bf: 1, // ㅋ
	0x11c0: 1, // ㅌ
	0x11c1: 2, // ㅍ
	0x11c2: 3, // ㅎ
};

// Function to split an array by given sizes
export function splitArrayBySizes(arr: any[], ...sizes: number[]) {
	const result = [];
	let index = 0;

	for (const size of sizes) {
		result.push(arr.slice(index, index + size));
		index += size;
	}

	return result;
}
