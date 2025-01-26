import { mount } from "svelte";
import App from "./App.svelte";
import Bunhae from "/src/bunhae.ts";

customElements.define("bunhae-component", Bunhae);

await Bunhae.preload("Noto Sans KR Regular");

mount(App, { target: document.body });
