import "virtual:uno.css";
import { render } from "preact";
import { App } from "./app.tsx";

// biome-ignore lint/style/noNonNullAssertion:
render(<App />, document.getElementById("app")!);
