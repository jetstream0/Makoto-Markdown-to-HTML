import { parse_md_to_html_with_warnings, ParseResult } from './makoto.js';
import type { Warning } from './endosulfan.js';

/*todo:
- FIX not being able to delete at start of line when there is warning on the line
- show multiple warnings per line
- show warnings that do not have line number
- show warning type, ability to ignore warnings based on type
- keyboard shortcuts???
*/

let editor: HTMLTextAreaElement = document.getElementById("editor")! as HTMLTextAreaElement;
let preview: HTMLElement = document.getElementById("rendered-text")!;
let dark_theme_toggle: HTMLInputElement = document.getElementById("dark-theme-toggle")! as HTMLInputElement;

let unedited: boolean = true;

function render_warnings(warnings: Warning[]) {
  document.querySelectorAll(".line-warning").forEach((item: Element) => item.remove());
  warnings.forEach((warning: Warning) => {
    if (warning.line_number) {
      let line: Element = editor.children[warning.line_number-1];
      let warning_span: HTMLElement = document.createElement("SPAN");
      warning_span.classList.add("line-warning");
      warning_span.title = warning.message;
      line.insertBefore(warning_span, line.childNodes[0]);
    }
  });
}

const refresh_html = () => {
  //go through the lines and get the editor text
  let editor_text: string = Array.from(editor.children).map((item) => item.textContent).reduce((added, current) => added+"\n"+current);
  let parsed: ParseResult = parse_md_to_html_with_warnings(editor_text);
  render_warnings(parsed.warnings);
  preview.innerHTML = parsed.html;
};

editor.addEventListener("keyup", () => {
  if (editor.children.length === 0) {
    //the first <li> was deleted
    let li: HTMLElement = document.createElement("LI");
    unedited = true;
    editor.appendChild(li);
    //reset cursor position
    let range: Range = document.createRange();
    range.setStart(li, 0);
    range.collapse(true);
    let selection: Selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
  refresh_html();
});

document.addEventListener("click", (e: MouseEvent) => {
  if (e.target === editor && unedited) {
    (editor.children[0] as HTMLElement).innerText = "";
    unedited = false;
    refresh_html();
  } else if (e.target !== editor && editor.innerText.trim() === "" && editor.children.length === 1) {
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

//applies if the browser remembers what the user typed in
if (editor.innerText.trim() !== "markdown goes here...") {
  unedited = false;
}

//give a quick intro to markdown
let params: URLSearchParams = new URLSearchParams(window.location.search);
if (params.get("help") === "true") {
  (editor.children[0] as HTMLElement).innerText = "# Makoto Markdown Parser";
  let extra_lines: string[] = [
    "This markdown parser is powered by spaghetti. You can have **bold text** or *italic text*, and even ^superscripts!^",
    "Of course, you can have [links](https://en.wikipedia.org), and use backslashes to \\*escape\\*. Here's a list:",
    "- uno",
    "- dos",
    "- tres",
    "> ## Wow! A blockquote!",
    "> Reasons why blockquotes are cool:",
    "> 1. They are blocks",
    "> 2. They are also quotes",
    "Now here's some `code`!!!!",
    "```rust",
    "fn main() {",
    "&nbsp;&nbsp;println!('HOLA MUNDO');",
    "}",
    "```",
    "---",
    "![Not a bass!](https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Gibson_Les_Paul_54_Custom.jpg/86px-Gibson_Les_Paul_54_Custom.jpg)"
  ];
  for (let i=0; i < extra_lines.length; i++) {
    let additional_line: HTMLElement =  document.createElement("LI");
    //needs to be .innerHTML so the html space entity can be parsed
    additional_line.innerHTML = extra_lines[i];
    editor.appendChild(additional_line);
  }
  //
}

refresh_html();
theme_change();
