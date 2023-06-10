import { parse_md_to_html_with_warnings, ParseResult } from './makoto.js';
import type { Warning } from './endosulfan.js';

let editor: HTMLTextAreaElement = document.getElementById("editor")! as HTMLTextAreaElement;
let preview: HTMLElement = document.getElementById("rendered-text")!;
let dark_theme_toggle: HTMLInputElement = document.getElementById("dark-theme-toggle")! as HTMLInputElement;

let unedited: boolean = true;

function render_warnings(warnings: Warning[]) {
  console.log(warnings)
  warnings.forEach((warning: Warning) => {
    if (warning.line_number) {
      //
    }
  });
}

const refresh_html = () => {
  let parsed: ParseResult = parse_md_to_html_with_warnings(editor.innerText);
  render_warnings(parsed.warnings);
  preview.innerHTML = parsed.html;
};

editor.addEventListener("keyup", refresh_html);
document.addEventListener("click", (e: MouseEvent) => {
  if (e.target === editor && unedited) {
    (editor.children[0] as HTMLElement).innerText = "";
    unedited = false;
    refresh_html();
  } else if (e.target !== editor && editor.innerText.trim() === "") {
    (editor.children[0] as HTMLElement).innerText = "markdown goes here...";
    unedited = true;
  }
});

const theme_change = () => {
  if (dark_theme_toggle.checked) {
    preview.classList.add("dark");
  } else {
    preview.classList.remove("dark");
  }
};

dark_theme_toggle.addEventListener("change", theme_change);

refresh_html();
theme_change();

if (editor.innerText !== "markdown goes here...") {
  unedited = false;
}
