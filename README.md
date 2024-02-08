# Makoto Markdown to HTML
The Makoto parser converts markdown to HTML, powered by several hundred lines of spaghetti code. Specifically, it is a state machine (I think) that processes the markdown character by character.

Makoto uses the MIT license.

## Web Editor
A web markdown editor (output in HTML, of course), is available at [makoto.prussia.dev](https://makoto.prussia.dev) or [makoto.pages.dev](https://makoto.pages.dev).

### Query Params
The web editor features various query params.

- `help`: if "true", will display a quick intro to Makoto-flavoured markdown
- `save`: if "true", will save the user inputted markdown to local storage, and will retrieve any existing saved text from local storage
- `ignore`: if "all", all warnings will be ignored. Else, it can be a CSV (comma separated values) of warning types to ignore

Example: [https://makoto.prussia.dev/?help=true&ignore=unknown-language,empty-link](https://makoto.prussia.dev/?help=true&ignore=unknown-language,empty-link)

## HTML Output
Some example CSS to style the HTML output can be found in `styles/makoto.css`.

- Headings are given automatically generated ids ('header-0', 'header-1' etc) so url anchors (https://example.com/blog#header-1) are possible
- Newlines will be put only after headings, paragraphs, and horizontal rules, all others will not be in final output (exceptions: no newlines in the last line, and newlines in code blocks are preserved)
- Spaces at the beginning of the line are normally cut off in html, so spaces will be replaced with the html entity for spaces (&nbsp;&nbsp;) at the beginning of the line in code blocks
- Lines in code blocks will be split with <br>s
- If a language for the code block is provided, the parser will add a css class `code-<language name>` to the resulting code block div (which btw has class `code-block`)

## Notable Differences From Standard Markdown
- Only one newline between text is needed for a new paragraph, not two
- Superscripts are supported! "^1^" become "<sup>1</sup>". Use these for footnotes too, I'm not implementing those
- Underlined headers are not supported, just use a header and a horizontal rule
- Nested blockquotes and lists won't work
- The first row of a table will be assumed to be the header row, and don't bother with a row of dashes after it.
- Also, the pipe ("|") in tables is mandatory at the end of the row, otherwise weird things will happen
- Bold, italic, and other elements are not supported in tables

## List of Warning Types
- `unknown-language`
- `image-incomplete`
- `link-incomplete`
- `italic-not-closed`
- `bold-not-closed`
- `superscript-not-closed`
- `strikethrough-not-closed`
- `blockquote-broken`
- `code-block-not-closed`
- `unordered-list-broken`
- `code-snippet-not-closed`
- `too-much-header`
- `heading-broken`
- `horizontal-rule-broken`
- `missing-image-alt`
- `empty-link`
- `weird-href`

## Tests
Makoto's test cases are in `index.ts`. The tests are decently thorough for everything except tables, so hopefully most edge cases were caught.
