import type { Warning } from './endosulfan';

//some minor differences with markdown spec?
export function parse_md_to_html(md: string): string {
  let html: string = "";
  let html_line: string = "";

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
  let in_code: boolean = false;

  //loop through characters
  let chars: string = md;
  for (let i=0; i < chars.length; i++) {
    let char: string = chars[i];
    //console.log(char, asterisk_num, in_asterisk);
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
        html_line += "<p>";
      }
      continue;
    }
    //end of text or newline
    if (char === "\n" || i === chars.length-1) {
      if (is_first_line) {
        //it can only be the first line once :)
        is_first_line = false;
      }
      //if image was never completed
      if (image_alt !== undefined) {
        if (!html_line.startsWith("<p>")) {
          html_line = "<p>"+html_line;
        }
        html_line += "!["+image_alt;
        if (image_src !== undefined) {
          html_line += "]("+image_src;
        }
        image_alt = undefined;
        image_src = undefined;
      }
      //if last character
      if (i === chars.length-1 && char !== "\n") {
        let add_char: boolean = true;
        //if in code
        if (in_code && char === "`") {
          html_line += "</code>";
          add_char = false;
        }
        //if in horizontal rule
        if (horizontal_rule) {
          add_char = false;
        }
        //handle image just ending
        if (was_image && char === ")") {
          add_char = false;
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
        if (add_char) {
          html_line += char;
        }
      }
      html += html_line;
      if (html_line.startsWith("<p>")) {
        html += "</p>\n";
      }
      html_line = "";
      horizontal_num = 0;
      if (horizontal_rule || was_image) {
        if (i !== chars.length - 1 && html[html.length-1] !== "\n") {
          //only add new line if there isn't already one, and isn't last character
          html += "\n";
        } else if (i === chars.length - 1) {
          //remove newline
          html = html.trim();
        }
        horizontal_rule = false;
        was_image = false;
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
        continue;
      }
      heading_level = 0;
      if (i === chars.length - 1) {
        //remove newline
        html = html.trim();
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
        continue;
      }
    } else if (char === "`" && in_code) {
      html_line += "</code>";
      continue;
    } else if (in_code) {
      html_line += char;
      continue;
    }
    //handle heading levels
    //ensure headings are continuous and have after it ("#a##" or "##abc" are not a valid headings), and are at the beginning of the line
    if (chars.slice(i-heading_level-1, i) === "\n"+"#".repeat(heading_level) || (is_first_line && chars.slice(0, i) === "#".repeat(heading_level))) {
      if (char === "#" && !in_heading && heading_level <= 6) {
        heading_level++;
        continue;
      } else if (heading_level > 0 && char === " " && !in_heading) {
        in_heading = true;
        html_line += `<h${heading_level} id='header-${header_num}'>`;
        header_num++;
        continue;
      } else if (heading_level > 0) {
        html_line += "<p>"+"#".repeat(heading_level);
        heading_level = 0;
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
      }
    }
    //handle images
    if (char === "!" && chars[i+1] === "[") {
      continue;
    } else if (char === "]" && chars[i+1] === "(" && image_alt !== undefined) {
      continue;
    } else if (char === "[" && chars[i-1] === "!" && image_alt === undefined && image_src === undefined) {
      image_alt = "";
      continue;
    } else if (char === "(" && chars[i-1] === "]" && image_alt !== undefined) {
      image_src = "";
      continue;
    } else if ((char === ")" || (chars[i+1] === ")" && i+1 === chars.length-1)) && image_src !== undefined) {
      if (chars[i+1] === ")" && i+1 === chars.length-1) {
        image_src += char;
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
    } else {
      was_image = false;
    }
    //add beginning paragraph
    if (i === 0 || chars[i-1] === "\n") {
      html_line += "<p>";
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
    //
    html_line += char;
  }

  return html;
}

//WarningFunction to generate warnings and catch possible mistakes (eg: link not completed or possible space missing after #)
export function find_warnings(md: string): Warning[] {
  let warnings: Warning[] = [];
  //
  return warnings;
}
