import { parse_md_to_html_with_warnings, ParseResult } from './makoto.js';
import type { Warning } from './endosulfan.js';

/*todo:
- show multiple warnings per line
- show warnings that do not have line number
- show warning type, ability to ignore warnings based on type
- keyboard shortcuts???
*/

let editor: HTMLTextAreaElement = document.getElementById("editor")! as HTMLTextAreaElement;
let preview: HTMLElement = document.getElementById("rendered-text")!;
let dark_theme_toggle: HTMLInputElement = document.getElementById("dark-theme-toggle")! as HTMLInputElement;
let html_toggle: HTMLInputElement = document.getElementById("html-toggle")! as HTMLInputElement;

let show_html: boolean = false;
let unedited: boolean = true;

let use_local_storage: boolean = false;

let ignore_all_warnings: boolean = false;
let ignore_warnings: string[] = [];

function render_warnings(warnings: Warning[]) {
  document.querySelectorAll(".line-warning").forEach((item: Element) => item.classList.remove("line-warning"));
  warnings.forEach((warning: Warning) => {
    if (ignore_warnings.includes(warning.type)) return;
    if (warning.line_number) {
      let line: HTMLElement = editor.children[warning.line_number-1] as HTMLElement;
      line.classList.add("line-warning");
      line.title = warning.message;
    }
  });
}

const refresh_html = () => {
  //go through the lines and get the editor text
  let editor_text: string = Array.from(editor.children).map((item) => item.textContent).reduce((added, current) => added+"\n"+current)!;
  if (use_local_storage) {
    localStorage.setItem("markdown", editor_text);
  }
  let parsed: ParseResult = parse_md_to_html_with_warnings(editor_text);
  if (!ignore_all_warnings) {
    render_warnings(parsed.warnings);
  }
  if (show_html) {
    preview.innerText = parsed.html;
  } else {
    preview.innerHTML = parsed.html;
  }
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
    let selection: Selection = window.getSelection()!;
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

const html_change = () => {
  let changed: boolean = show_html !== html_toggle.checked;
  if (changed) {
    show_html = show_html ? false : true;
    refresh_html();
  }
}

html_toggle.addEventListener("change", html_change);

//applies if the browser remembers what the user typed in
if (editor.innerText.trim() !== "markdown goes here...") {
  unedited = false;
}

let params: URLSearchParams = new URLSearchParams(window.location.search);
if (params.get("help") === "true") {
  //give a quick intro to markdown
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
}

if (params.get("save") === "true") {
  //save to local storage, and retrieve from it
  if (localStorage) {
    use_local_storage = true;
  }
  let stored_markdown = localStorage.getItem("markdown");
  if (stored_markdown) {
    let extra_lines: string[] = stored_markdown.split("\n");
    (editor.children[0] as HTMLElement).innerText = extra_lines.shift()!;
    for (let i=0; i < extra_lines.length; i++) {
      let additional_line: HTMLElement =  document.createElement("LI");
      //needs to be .innerHTML so the html space entity can be parsed
      additional_line.innerHTML = extra_lines[i];
      editor.appendChild(additional_line);
    }
    unedited = false;
  }
}

let ignore_param = params.get("ignore");
if (ignore_param) {
  //allow user to specify warnings to ignore
  if (ignore_param === "all") {
    ignore_all_warnings = true;
  } else {
    ignore_warnings = ignore_param.split(",");
  }
}

refresh_html();
theme_change();
html_change();
