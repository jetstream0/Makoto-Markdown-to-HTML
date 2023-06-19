import type { Warning } from './endosulfan';

export type ParseResult = {
  html: string,
  warnings: Warning[]
}

//some minor differences with markdown spec?
export function parse_md_to_html_with_warnings(md: string): ParseResult {
  let html: string = "";
  let html_line: string = "";
  let warnings: Warning[] = [];

  let line_number: number = 1;

  //markdown parsing vars
  let is_first_line: boolean = true;
  let backslashed: boolean = false;
  let heading_level: number = 0;
  let in_heading: boolean = false;
  let header_num: number = 0;
  let asterisk_num: number = 0;
  let asterisk_out_num: number = 0;
  let in_asterisk: boolean = false;
  let horizontal_num: number = 0;
  let horizontal_rule: boolean = false;
  let was_image: boolean = false;
  let image_alt: string | undefined = undefined;
  let image_src: string | undefined = undefined;
  let was_link: boolean = false;
  let link_content: string | undefined = undefined;
  let link_href: string | undefined = undefined;
  let in_code: boolean = false;
  let in_code_block: boolean = false;
  let first_line_code_block: boolean = false;
  let code_block_lang: string | undefined = undefined;
  let space_start: boolean = false;
  let in_blockquote: boolean = false;
  let in_unordered_list: boolean = false;
  let blockquote_list: boolean = false;
  let in_ordered_list: boolean = false;
  let ordered_list_num: number = 0;
  let in_superscript: boolean = false;
  let in_table: boolean = false;
  let in_table_header: boolean = false;
  let table_item: string = "";

  //loop through characters
  let chars: string = md;
  for (let i=0; i < chars.length; i++) {
    let char: string = chars[i];
    let end_add_char: boolean = true;
    //sanitize input
    if (char === "<") {
      char = "&lt;";
    } else if (char === ">") {
      char = "&gt;";
    }
    //handle backslashes
    if (backslashed) {
      backslashed = false;
      if (i !== chars.length-1) {
        html_line += char;
        continue;
      }
    }
    if (char === "\\" && chars[i+1] !== "\n") {
      backslashed = true;
      if (i === 0 || chars[i-1] === "\n") {
        html_line = "<p>"+html_line;
      }
      continue;
    }
    //end of text or newline
    if (char === "\n" || i === chars.length-1) {
      if (is_first_line) {
        //it can only be the first line once :)
        is_first_line = false;
      }
      //preserving the newlines/linebreaks of the code block
      if (in_code_block && char === "\n" && !first_line_code_block) {
        html_line += "<br>\n";
        space_start = true;
      }
      //if first line of code block, create the code block div
      if (first_line_code_block) {
        code_block_lang = code_block_lang!.toLowerCase().trim();
        let known_langs: string[] = ["python", "py", "rust", "rs", "javascript", "js", "typescript", "ts", "java", "c", "cpp", "csharp", "html", "css", "markdown", "md", "brainfuck", "php", "bash", "perl", "sql", "ruby", "basic", "assembly", "asm", "wasm", "r", "go", "swift"]
        if (!known_langs.includes(code_block_lang) && code_block_lang !== "") {
          warnings.push({
            type: "unknown-language",
            message: `Unknown language '${code_block_lang}' for code block`,
            line_number,
          });
        }
        if (code_block_lang === "") {
          //if no code block language specified, don't put it as a css class obviously
          html_line = `<div class="code-block">\n`;
        } else {
          html_line = `<div class="code-block code-${code_block_lang}">\n`;
        }
        code_block_lang = undefined;
        first_line_code_block = false;
      }
      //if image was never completed
      if (image_alt !== undefined) {
        if (!html_line.startsWith("<p>")) {
          html_line = "<p>"+html_line;
        }
        html_line += "!["+image_alt;
        if (image_src !== undefined) {
          html_line += "]("+image_src;
          warnings.push({
            type: "image-incomplete",
            message: "Image incomplete, missing `)`",
            line_number,
          });
        } else {
          warnings.push({
            type: "image-incomplete",
            message: "Image incomplete, missing `]` or `(`",
            line_number,
          });
        }
        image_alt = undefined;
        image_src = undefined;
      }
      //if link was never completed
      if (link_content !== undefined) {
        if (!html_line.startsWith("<p>")) {
          html_line = "<p>"+html_line;
        }
        html_line += "["+link_content;
        if (link_href !== undefined) {
          html_line += "]("+link_href;
          warnings.push({
            type: "link-incomplete",
            message: "Link incomplete, missing `)`",
            line_number,
          });
        } else {
          warnings.push({
            type: "link-incomplete",
            message: "Link incomplete, missing `]` or `(`",
            line_number,
          });
        }
        link_content = undefined;
        link_href = undefined;
      }
      //if last character
      if (i === chars.length-1 && char !== "\n") {
        let add_char: boolean = true;
        //close code block div
        if (in_code_block && i === chars.length-1) {
          in_code_block = false;
          add_char = false;
          html_line = "</div>";
        }
        //if in code
        if (in_code && char === "`") {
          in_code = false;
          html_line += "</code>";
          add_char = false;
        }
        //if in horizontal rule
        if (horizontal_rule) {
          add_char = false;
        }
        //handle image just ending
        if ((was_image || was_link) && char === ")") {
          add_char = false;
        }
        //handle table row ending thing?
        if (in_table && char === "|") {
          in_table = false;
          add_char = false;
          if (in_table_header) {
            html_line += `<th>${table_item}</th>\n</tr>\n</table>`;
          } else {
            html_line += `<td>${table_item}</td>\n</tr>\n</table>`;
          }
        }
        //if previous character is also newline, there hasn't been opportunity to add a <p>, so add it!
        if (chars[i-1] === "\n") {
          html_line = "<p>";
        }
        //ending a bold/italic?
        if (in_asterisk && char === "*") {
          if (asterisk_num === 2 && chars[i-1] === "*") {
            html_line += "</b>";
            in_asterisk = false;
            asterisk_num = 0;
            add_char = false;
          } else if (asterisk_num === 1) {
            html_line += "</i>";
            in_asterisk = false;
            asterisk_num = 0;
            add_char = false;
          }
        }
        //ending superscript
        if (in_superscript && char === "^") {
          html_line += "</sup>";
          in_superscript = false;
          add_char = false;
        }
        if (add_char) {
          html_line += char;
        }
      }
      if (in_asterisk) {
        //bold/italic never ended
        if (asterisk_num === 1) {
          //remove the last <i> and replace it with a *
          let split: string[] = html_line.split("<i>");
          html_line = "";
          for (let ii=0; ii < split.length; ii++) {
            html_line += split[ii];
            if (ii !== split.length-1) {
              if (ii === split.length-2) {
                html_line += "*";
              } else {
                html_line += "<i>";
              }
            }
          }
          warnings.push({
            type: "italic-not-closed",
            message: "Italic not closed, may be missing closing '*'? Backslash the '*' if this is intentional",
            line_number,
          });
        } else if (asterisk_num === 2) {
          //remove the last <b> and replace it with a **
          let split: string[] = html_line.split("<b>");
          html_line = "";
          for (let ii=0; ii < split.length; ii++) {
            html_line += split[ii];
            if (ii !== split.length-1) {
              if (ii === split.length-2) {
                html_line += "**";
              } else {
                html_line += "<b>";
              }
            }
          }
          warnings.push({
            type: "bold-not-closed",
            message: "Bold not closed, may be missing closing '**'? Backslash the '**' if this is intentional",
            line_number,
          });
        }
        asterisk_num = 0;
        asterisk_out_num = 0;
        in_asterisk = false;
      }
      if (in_superscript) {
        //superscript never ended
        //remove the last <sup> and replace it with a ^
        let split: string[] = html_line.split("<sup>");
        html_line = "";
        for (let ii=0; ii < split.length; ii++) {
          html_line += split[ii];
          if (ii !== split.length-1) {
            if (ii === split.length-2) {
              html_line += "^";
            } else {
              html_line += "<sup>";
            }
          }
        }
        in_superscript = false;
        warnings.push({
          type: "superscript-not-closed",
          message: "Superscript not closed, may be missing closing '^'? Backslash the '^' if this is intentional",
          line_number,
        });
      }
      //ending table row
      if (in_table) {
        in_table_header = false;
        html_line += "</tr>\n";
      }
      html += html_line;
      if (html_line.startsWith("<p>")) {
        html += "</p>\n";
      } else if ((html_line.startsWith("<li>") || html_line.startsWith("<ul>") || html_line.startsWith("<ol>")) && (in_unordered_list || in_ordered_list)) {
        html += "</li>\n";
        if (in_ordered_list) {
          ordered_list_num++;
        }
        if (i === chars.length-1 && in_unordered_list) {
          html += "</ul>";
          //set it to false, not that it matters
          blockquote_list = false;
        } else if (i === chars.length-1 && in_ordered_list) {
          html += "</ol>";
          //set it to false, not that it matters
          blockquote_list = false;
        }
      }
      html_line = "";
      horizontal_num = 0;
      if (char === "\n") {
        line_number++;
      }
      //check to see if unordered list is ending
      if (in_unordered_list && char === "\n" && ((chars.slice(i+1, i+3) !== "- " && !blockquote_list) || (chars.slice(i+1, i+5) !== "> - " && blockquote_list))) {
        html += "</ul>\n";
        in_unordered_list = false;
        blockquote_list = false;
      }
      //check to see if ordered list is ending
      let ol_num_length: number = String(ordered_list_num+1).length;
      if (in_ordered_list && char === "\n" && ((chars.slice(i+1, i+ol_num_length+3) !== `${ordered_list_num+1}. ` && !blockquote_list) || (chars.slice(i+1, i+ol_num_length+5) !== `> ${ordered_list_num+1}. ` && blockquote_list))) {
        html += "</ol>\n";
        ordered_list_num = 0;
        in_ordered_list = false;
        blockquote_list = false;
      }
      if (horizontal_rule || was_image || was_link) {
        if (i !== chars.length - 1 && html[html.length-1] !== "\n") {
          //only add new line if there isn't already one, and isn't last character
          html += "\n";
        } else if (i === chars.length - 1) {
          //remove newline
          html = html.trim();
        }
        horizontal_rule = false;
        was_image = false;
        was_link = false;
        continue;
      }
      //ending a header, line break not needed
      if (in_heading) {
        html += `</h${heading_level}>\n`;
        if (i === chars.length - 1) {
          //remove newline
          html = html.trim();
        }
        heading_level = 0;
        in_heading = false;
        //continue;
      }
      //if in blockquote
      if (in_blockquote && i === chars.length-1) {
        if (html[html.length-1] !== "\n") {
          html += "\n";
        }
        html += "</blockquote>";
        in_blockquote = false;
      } else if (in_blockquote && char === "\n" && chars[i-1] === "\n") {
        //two new lines in a row means blockquote ends
        html += "</blockquote>\n";
        in_blockquote = false;
      }
      heading_level = 0;
      if (i === chars.length - 1) {
        //remove newline
        html = html.trim();
      }
      continue;
    }
    //block quotes
    if (char === " " && chars[i-1] === ">" && !in_blockquote && (chars[i-2] === "\n" || i === 1)) {
      in_blockquote = true;
      html += "<blockquote>\n";
      continue;
    } else if (in_blockquote && chars[i-1] === "\n" && (char !== "&gt;" || chars[i+1] !== " ")) {
      if (blockquote_list) {
        //end list if list started in blockquote and blockquote ends
        blockquote_list = false;
        if (in_unordered_list) {
          html += "</ul>\n</blockquote>\n";
        } else if (in_ordered_list) {
          html += "</ol>\n</blockquote>\n";
        }
        ordered_list_num = 0;
        in_ordered_list = false;
        in_unordered_list = false;
      } else {
        html += "</blockquote>\n";
      }
      in_blockquote = false;
    } else if (char === "&gt;" && chars[i+1] === " " && (chars[i-1] === "\n" || i === 0)) {
      //do not add the '>' to the html
      end_add_char = false;
    } else if (char === " " && chars[i-1] === ">" && chars[i-2] === "\n") {
      //do not add the ' ' in '> ' to the html
      end_add_char = false;
    } else if (char === "&gt;" && chars[i+1] !== " " && (chars[i-1] === "\n" || i === 0)) {
      warnings.push({
        type: "blockquote-broken",
        message: "Missing space after `>` for blockquote?",
        line_number,
      });
    }
    //code blocks
    if (char === "`" && chars[i+1] !== "`" && ((chars.slice(i-3, i) === "\n``" || (i === 2 && chars.slice(0, i) === "``")) || (in_blockquote && (chars.slice(i-5, i) === "\n> ``" || (i === 4 && chars.slice(0, i) === "> ``"))))) {
      if (!in_code_block) {
        //make sure there is ``` further on, that is not backslashed
        let skip_next: boolean = false;
        let end_found: boolean = false;
        for (let ii=1; ii < chars.length-i; ii++) {
          let adjusted_index: number = i+ii;
          if (skip_next) {
            skip_next = false;
            continue;
          }
          if (chars[adjusted_index] === "\\") {
            skip_next = true;
          } else if (chars.slice(adjusted_index-3, adjusted_index+1) === "\n```" && (adjusted_index === chars.length-1 || chars[adjusted_index+1] === "\n")) {
            end_found = true;
            break;
          } else if (in_blockquote && chars.slice(adjusted_index-5, adjusted_index+1) === "\n> ```" && (adjusted_index === chars.length-1 || chars[adjusted_index+1] === "\n")) {
            end_found = true;
            break;
          } else if (in_blockquote && chars[adjusted_index] === "\n" && (chars[adjusted_index+1] !== ">" || chars[adjusted_index+2] !== " ")) {
            //blockquote ended without finding end
            break;
          }
        }
        if (end_found) {
          in_code = false;
          in_code_block = true;
          first_line_code_block = true;
          code_block_lang = "";
          //at this point html_line would have two backticks (probably a <code></code> actually) in it
          html_line = "";
          continue;
        } else {
          warnings.push({
            type: "code-block-not-closed",
            message: "Code block not closed, may be missing closing backticks?",
            line_number,
          });
        }
      } else if (in_code_block && chars[i+1] === "\n") { // || i === chars.length-1 will be handled by a different part
        in_code = false;
        in_code_block = false;
        html_line = "</div>\n";
        continue;
      }
    } else if (first_line_code_block) {
      code_block_lang += char;
      continue;
    } else if (in_code_block) {
      //do not render markdown inside code blocks... obviously
      //preserve spaces at the beginning of lines
      if (in_blockquote && ((char === " " && chars.slice(i-2, i) === "\n>") || (char === "&gt;" && chars[i-1] === "\n" && chars[i+1] === " "))) {
        //do not add the blockquote syntax thing "> " to the codeblock
      } else if (char === " " && space_start) {
        html_line += "&nbsp;";
      } else {
        space_start = false;
        html_line += char;
      }
      continue;
    }
    //handle unordered lists
    if (char === " " && chars[i-1] === "-" && (chars[i-2] === "\n" || i === 1 || (in_blockquote && chars.slice(i-3, i-1) === "> " && (chars[i-4] === "\n" || i === 3)))) {
      //it's a unordered list bullet point!!
      if (!in_unordered_list || (!in_blockquote && blockquote_list)) {
        html_line = "<ul>\n<li>";
        blockquote_list = false;
      } else {
        html_line = "<li>";
      }
      in_unordered_list = true;
      if (in_blockquote) {
        blockquote_list = true;
      }
      continue;
    } else if (char !== " " && chars[i-1] === "-" && (chars[i-2] === "\n" || i === 1)) {
      warnings.push({
        type: "unordered-list-broken",
        message: "Missing space after unordered list",
        line_number,
      });
    }
    //handle ordered lists
    let ol_num_length: number = String(ordered_list_num+1).length;
    if (char === " " && chars.slice(i-1-ol_num_length, i) === `${ordered_list_num+1}.` && (chars[i-ol_num_length-2] === "\n" || i === ol_num_length+1 || (in_blockquote && chars.slice(i-ol_num_length-3, i) === `> ${ordered_list_num+1}.` && (chars[i-ol_num_length-4] === "\n" || i === ol_num_length+3)))) {
      if (ordered_list_num === 0) {
        html_line = "<ol>\n<li>";
        in_ordered_list = true;
      } else {
        html_line = "<li>";
      }
      if (in_blockquote) {
        blockquote_list = true;
      }
      continue;
    }
    //handle code
    if (char === "`" && !in_code) {
      //make sure there is another ` in the line
      let skip_next: boolean = false;
      let end_found: boolean = false;
      for (let ii=1; ii < chars.length-i; ii++) {
        if (skip_next) {
          skip_next = false;
          continue;
        }
        if (chars[i+ii] === "\\") {
          skip_next = true;
        } else if (chars[i+ii] === "\n") {
          end_found = false;
          break;
        } else if (chars[i+ii] === "`") {
          end_found = true;
          break;
        }
      }
      if (end_found) {
        in_code = true;
        html_line += "<code>";
        //we have to repeat some code from later on and add a <p>
        if (i === 0 || chars[i-1] === "\n") {
          html_line = "<p>"+html_line;
        }
        continue;
      } else {
        warnings.push({
          type: "code-snippet-not-closed",
          message: "Code snippet not closed, may be missing closing backtick?",
          line_number,
        });
      }
    } else if (char === "`" && in_code) {
      in_code = false;
      html_line += "</code>";
      continue;
    } else if (in_code) {
      html_line += char;
      continue;
    }
    //handle tables
    if (char === "|" && (chars[i-1] === "\n" || i === 0 || (in_blockquote && chars.slice(i-2, i) === "> " && (chars[i-3] === "\n" || i === 3)))) {
      if (!in_table) {
        //start of table
        in_table = true;
        in_table_header = true;
        html += "<table>\n<tr>\n";
      } else {
        //just a new table row
        html += "<tr>\n";
      }
      continue;
    } else if (in_table && char === "|") {
      if (in_table_header) {
        html_line += `<th>${table_item}</th>\n`;
      } else {
        html_line += `<td>${table_item}</td>\n`;
      }
      table_item = "";
      continue;
    } else if (in_table && ((chars[i-1] === "\n" && char !== "|") || (in_blockquote && chars[i-3] === "\n" && char !== "|"))) {
      in_table = false;
      table_item = "";
      //table ends
      html += "</table>\n";
    } else if (in_table) {
      table_item += char;
      continue;
    }
    //handle heading levels
    //ensure headings are continuous and have after it ("#a##" or "##abc" are not a valid headings), and are at the beginning of the line
    //ensure headings are possible in block quotes
    if (chars.slice(i-heading_level-1, i) === "\n"+"#".repeat(heading_level) || (is_first_line && chars.slice(0, i) === "#".repeat(heading_level)) || (chars.slice(i-heading_level-3, i) === "\n> "+"#".repeat(heading_level) && in_blockquote) || (is_first_line && chars.slice(0, i) === "> "+"#".repeat(heading_level) && in_blockquote)) {
      if (char === "#" && !in_heading && heading_level < 6) {
        heading_level++;
        continue;
      } else if (heading_level > 0 && char === " " && !in_heading) {
        in_heading = true;
        html_line = `<h${heading_level} id="header-${header_num}">`;
        header_num++;
        continue;
      } else if (char === "#" && heading_level === 6) {
        warnings.push({
          type: "too-much-header",
          message: "Header cannot be more than 6 levels",
          line_number,
        })
      } else if (heading_level > 0) {
        //not a heading
        html_line = "<p>"+"#".repeat(heading_level);
        heading_level = 0;
        warnings.push({
          type: "heading-broken",
          message: "Missing space after `#` for heading?",
          line_number,
        });
      }
    }
    //handle horizontal rules
    //similar code as headings to ensure beginning of the line, continuous
    if (chars.slice(i-horizontal_num-1, i) === "\n"+"-".repeat(horizontal_num) || (is_first_line && chars.slice(0, i) === "-".repeat(horizontal_num))) {
      if (char === "-") {
        horizontal_num++;
        if (horizontal_num === 3 || (horizontal_num === 2 && chars[chars.length-1] === "-" && i === chars.length-2)) {
          horizontal_rule = true;
          html_line = "<hr>";
        } else if (horizontal_num < 3 && (chars[i+1] === "\n" || i === chars.length-2)) {
          //if next is end or newline, but less than 3 '-'s, it is not a valid horizontal rule
          html_line = "<p>"+"-".repeat(horizontal_num);
        }
        continue;
      } else if (horizontal_num > 0) {
        //no longer a horizontal line
        html_line = "<p>"+"-".repeat(horizontal_num);
        if (horizontal_num > 2) {
          warnings.push({
            type: "horizontal-rule-broken",
            message: "Horizontal rule broken",
            line_number,
          });
        }
      }
    }
    //handle images
    if (char === "!" && chars[i+1] === "[") {
      continue;
    } else if (char === "]" && chars[i+1] === "(" && image_alt !== undefined && image_src === undefined) {
      continue;
    } else if (char === "[" && chars[i-1] === "!" && image_alt === undefined && image_src === undefined) {
      image_alt = "";
      continue;
    } else if (char === "(" && chars[i-1] === "]" && image_alt !== undefined && image_src === undefined) {
      image_src = "";
      continue;
    } else if ((char === ")" || (chars[i+1] === ")" && i+1 === chars.length-1)) && image_src !== undefined) {
      if (chars[i+1] === ")" && i+1 === chars.length-1) {
        image_src += char;
      }
      if (image_alt === "") {
        warnings.push({
          type: "missing-image-alt",
          message: "Image is missing alt text, this is bad for accessibility",
          line_number,
        });
      }
      html_line += `<img src="${image_src}" alt="${image_alt}">`;
      was_image = true;
      image_alt = undefined;
      image_src = undefined;
      continue;
    } else if (image_alt !== undefined && image_src === undefined && !(char === "]" && chars[i+1] === "(")) {
      image_alt += char;
      continue;
    } else if (image_src !== undefined) {
      image_src += char;
      continue;
    } else if (was_image) {
      was_image = false;
    }
    //handle links
    if (char === "[") {
      link_content = "";
      continue;
    } else if (char === "]" && chars[i+1] === "(" && link_content !== undefined && link_href === undefined) {
      continue;
    } else if (char === "(" && chars[i-1] === "]" && link_content !== undefined && link_href === undefined) {
      link_href = "";
      continue;
    } else if ((char === ")" || (chars[i+1] === ")" && i+1 === chars.length-1)) && link_href !== undefined && link_content !== undefined) {
      let before_link: number;
      if (chars[i+1] === ")" && i+1 === chars.length-1) {
        link_href += char;
        before_link = i-link_href.length-link_content.length-3;
      } else {
        before_link = i-link_href.length-link_content.length-4;
      }
      if (chars[before_link] === "\n" || before_link === -1) {
        html_line = "<p>";
      }
      if (link_content === "") {
        warnings.push({
          type: "empty-link",
          message: "Link missing text",
          line_number,
        });
      }
      //":" includes protocols like http:// https:// wss:// and app uris
      if (!link_href.includes(":") && !link_href.startsWith("./") && !link_href.startsWith("/")) {
        warnings.push({
          type: "weird-href",
          message: "Link href does not start with './' or '/' or contain ':', please double check it",
          line_number,
        });
      }
      html_line += `<a href="${link_href}">${link_content}</a>`;
      was_link = true;
      link_content = undefined;
      link_href = undefined;
      continue;
    } else if (link_content !== undefined && link_href === undefined) {
      link_content += char;
      continue;
    } else if (link_href !== undefined) {
      link_href += char;
      continue;
    } else if (was_link) {
      was_link = false;
    }
    //add beginning paragraph
    if (i === 0 || chars[i-1] === "\n") {
      html_line = "<p>"+html_line;
    }
    //handle italics and bolds
    if (char === "*" && asterisk_num < 2 && !in_asterisk) {
      asterisk_num++;
      if (asterisk_num === 1 && chars[i+1] !== "*") {
        html_line += "<i>";
        in_asterisk = true;
      } else if (asterisk_num === 2) {
        html_line += "<b>";
        in_asterisk = true;
      }
      continue;
    } else if (char === "*" && in_asterisk) {
      asterisk_out_num++;
      if (asterisk_out_num === asterisk_num) {
        if (asterisk_num === 1) {
          html_line += "</i>";
        } else if (asterisk_num === 2) {
          html_line += "</b>";
        }
        in_asterisk = false;
        asterisk_num = 0;
        asterisk_out_num = 0;
        continue;
      } else if (asterisk_out_num === 1 && chars[i+1] === "*") {
        //implied that asterisk_num === 2 here due to previous if statement
        continue;
      }
    } else if (char !== "*" && in_asterisk) {
      asterisk_out_num = 0;
    }
    //handle superscripts
    if (char === "^") {
      if (in_superscript) {
        in_superscript = false;
        html_line += "</sup>";
        continue;
      } else {
        in_superscript = true;
        html_line += "<sup>";
        continue;
      }
    }
    //
    if (end_add_char) {
      html_line += char;
    }
  }

  return {
    html,
    warnings,
  };
}

export function parse_md_to_html(md: string): string {
  return parse_md_to_html_with_warnings(md).html;
}
