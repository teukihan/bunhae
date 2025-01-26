<script lang="ts">
	import { onMount } from "svelte";
	import type Bunhae from "../src/bunhae.ts";

	// Initialize component styles
	onMount(() => {
		let style = new CSSStyleSheet();
		style.replaceSync(`
			@keyframes blink {
				from {
					stroke-dashoffset: 1;
				}
				to {
					stroke-dashoffset: 2000;
				}
			}
		`);
		component.adoptedStyleSheets.push(style);
	});

	// Define Hangul codes
	const codes = [
		0x1100, 0x1101, 0x1102, 0x1103, 0x1104, 0x1105, 0x1106, 0x1107, 0x1108,
		0x1109, 0x110a, 0x110b, 0x110c, 0x110d, 0x110e, 0x110f, 0x1110, 0x1111,
		0x1112, 0, 0x1161, 0x1162, 0x1163, 0x1164, 0x1165, 0x1166, 0x1167,
		0x1168, 0x1169, 0x116a, 0x116b, 0x116c, 0x116d, 0x116e, 0x116f, 0x1170,
		0x1171, 0x1172, 0x1173, 0x1174, 0x1175, 0, 0x11a8, 0x11a9, 0x11aa,
		0x11ab, 0x11ac, 0x11ad, 0x11ae, 0x11af, 0x11b0, 0x11b1, 0x11b2, 0x11b3,
		0x11b4, 0x11b5, 0x11b6, 0x11b7, 0x11b8, 0x11b9, 0x11ba, 0x11bb, 0x11bc,
		0x11bd, 0x11be, 0x11bf, 0x11c0, 0x11c1, 0x11c2,
	];
	const chosung = codes.slice(0, 19);
	const jungsung = codes.slice(20, 41);
	const jongsung = codes.slice(42);

	// State variables
	let selected = $state(0);
	let texts = $state("");
	let shadow = $state(true);
	let color = $state("#cccccc");
	let textColor = $state("#cccccc");
	let initialColor = $state("#ff7f7f");
	let medialColor = $state("#7fff7f");
	let medialSecondaryColor = $state("#7fff7f");
	let finalColor = $state("#7f7fff");
	let finalSecondaryColor = $state("#1f7fff");
	let fonts = $state([]);
	let fontFamily = $state("");
	let flags = $state("");
	let component: Bunhae;
	let render_duration = $state(0);
	let replace = $state(false);
	let cache = $state(true);
	let fontsize = $state(30);
	let animation = $state(false);

	// Effect to update texts based on selected code
	$effect(() => {
		texts = getHangulCombinations(selected).join("");
	});

	// Function to get Hangul combinations
	function getHangulCombinations(selected) {
		if (selected === 0) return ["다람쥐 헌 쳇바퀴에 타고파."];

		let combinations = [];
		if (chosung.includes(selected)) {
			jungsung.forEach((jung) => {
				combinations.push(
					String.fromCharCode(
						0xac00 +
							(selected - 0x1100) * 588 +
							(jung - 0x1161) * 28,
					),
				);
				jongsung.forEach((jong) => {
					combinations.push(
						String.fromCharCode(
							0xac00 +
								(selected - 0x1100) * 588 +
								(jung - 0x1161) * 28 +
								(jong - 0x11a7),
						),
					);
				});
				combinations.push("<br>");
			});
		} else if (jungsung.includes(selected)) {
			chosung.forEach((cho) => {
				combinations.push(
					String.fromCharCode(
						0xac00 +
							(cho - 0x1100) * 588 +
							(selected - 0x1161) * 28,
					),
				);
				jongsung.forEach((jong) => {
					combinations.push(
						String.fromCharCode(
							0xac00 +
								(cho - 0x1100) * 588 +
								(selected - 0x1161) * 28 +
								(jong - 0x11a7),
						),
					);
				});
				combinations.push("<br>");
			});
		} else if (jongsung.includes(selected)) {
			chosung.forEach((cho) => {
				jungsung.forEach((jung) => {
					combinations.push(
						String.fromCharCode(
							0xac00 +
								(cho - 0x1100) * 588 +
								(jung - 0x1161) * 28 +
								(selected - 0x11a7),
						),
					);
				});
				combinations.push("<br>");
			});
		}

		return combinations;
	}

	// Function to query local fonts
	async function queryFonts() {
		// @ts-ignore
		fonts = await queryLocalFonts();
		fontFamily = fonts[0].family;
	}

	// Function to handle render complete event
	function onredercomplete(ev) {
		render_duration = ev.detail;
	}

	// Function to generate HTML
	async function generate() {
		let html = await component.generateHTML(component.text, {
			textColor,
			colors: [
				initialColor,
				medialColor,
				medialSecondaryColor,
				finalColor,
				finalSecondaryColor,
			],
			flags,
		});

		let div = document.createElement("div");
		div.innerHTML = html;
		div.style.cssText = `display:inline-block; padding:5px; font-size:${fontsize}px; font-family: '${fontFamily}'`;
		navigator.clipboard.writeText(div.outerHTML);
		document.body.append(div);
		document.body.append(document.createElement("br"));
	}

	// Adopt style for component
	let adoptStyle = new CSSStyleSheet();
	adoptStyle.replaceSync(`
	svg{
		background-color: #666;
	}`);
</script>

<!-- Text area for Hangul combinations -->
<textarea bind:value={texts} style="width:100%;height:100px"></textarea>
<br />

<!-- Render buttons for Hangul codes -->
{#each codes as v}
	{#if v === 0}
		<br />
	{:else}
		<button onclick={() => (selected = v)}>{String.fromCharCode(v)}</button>
	{/if}
{/each}

<!-- Render controls and component -->
<div
	style="padding:5px; 
	color:{color}; 
	--text-color:{textColor};	
	--initial-color:{initialColor};
	--medial-color:{medialColor};
	--medial-secondary-color:{medialSecondaryColor};
	--final-color:{finalColor};
	--final-secondary-color:{finalSecondaryColor};
	"
>
	<div class="colors">
		<input type="color" bind:value={color} /> current color
		&nbsp;&nbsp;&nbsp;
		<br />
		<input type="color" bind:value={initialColor} /> --initial-color
		<br />
		<input type="color" bind:value={medialColor} /> --medial-color
		<input type="color" bind:value={medialSecondaryColor} />
		--medial-secondary-color
		<br />
		<input type="color" bind:value={finalColor} /> --final-color
		<input type="color" bind:value={finalSecondaryColor} />
		--final-secondary-color
		<br />
		<input type="color" bind:value={textColor} /> --text-color
		<br />
	</div>

	<!-- Font selection -->
	{#if fonts.length}
		<select bind:value={fontFamily} style="font-size:20px">
			{#each fonts as font}
				<option value={font.family}>{font.fullName}</option>
			{/each}
		</select>
	{:else}
		<button onclick={queryFonts}>배경폰트변경</button>
	{/if}

	<!-- Flags and options -->
	FLAG <input type="search" bind:value={flags} />
	<br />
	<label>
		<input type="checkbox" bind:checked={cache} /> use svg cache
	</label>
	<label>
		<input type="checkbox" bind:checked={replace} /> always replace
	</label>
	<br />

	<!-- Font size slider -->
	font size <input type="range" bind:value={fontsize} min="10" max="50" />
	{fontsize} px
	<br />

	<label>
		<input type="checkbox" bind:checked={animation} /> animation
	</label>
	<br />

	<!-- Render duration -->
	<div>render: {render_duration.toFixed(2)}ₘₛ</div>

	<!-- Bunhae component -->
	<div style="padding:10px 0px">
		<bunhae-component
			class:animation
			{shadow}
			style="font-size:{fontsize}px; font-family: '{fontFamily}'"
			{flags}
			{replace}
			{cache}
			bind:this={component}
			onrendercomplete={onredercomplete}
		>
			{@html texts}
		</bunhae-component>
	</div>

	<!-- Generate button -->
	<button onclick={generate}>generate & copy svg to clipboard</button>
</div>

<style>
	.colors {
		padding: 10px 0px;
		font-size: 11px;
		input {
			width: 20px;
			height: 20px;
		}
	}
	input,
	button {
		vertical-align: middle;
	}
	bunhae-component {
		color: red;
		cursor: text;
		&::part(container) {
			color: initial;
		}
		&::part(wrap):hover {
			background-color: #39f;
		}
		&.animation::part(initial) {
			stroke-width: 100px;
			stroke-dasharray: 1000;
			stroke-dashoffset: 0;
			stroke: #39f;
			animation: blink 1s infinite;
		}
	}
	button {
		margin: 3px;
	}
</style>
