import { parse_md_to_html } from './makoto';
import { test_assert_equal, total_tests, failed_tests, passed_tests } from './endosulfan';

/*
Quirks
- Only one newline between text is needed for a new paragraph, not two.
- Headings are given automatically generated ids ('header-0', 'header-1' etc) so url anchors (https://example.com/blog#header-1) are possible
- Will only put newlines after headings, paragraphs, and horizontal rules, all others will not be in final output (exception is it will not put a newline on the last line, and also newlines in code blocks are preserved)
- Spaces at the beginning of the line are normally cut off with html, so this parser will replace spaces with the html entity for spaces (&nbsp;&nbsp;) at the beginning of the line in code blocks
- Lines in code blocks will be split with <br>s
- The three backticks indicating a beginning or end of a code MUST be on their own line
  Invalid:
  ```burger```
  Valid:
  ```
  burger
  ```
- If a language for the code block is provided, the parser will add a css class "code-<language name>" to the resulting code block div (which btw has class code-block)
- All elements should be able to be used in block quotes (ok, not really a quirk). In code blocks, the code in the code block must also start with "> " of course
- Superscripts are supported! "^1^" become "<sup>1</sup>". Use these for footnotes too, I'm not implementing those.
- Underlined headers are not supported, just use a header and a horizontal rule
- Nested blockquotes won't work
- The first row of a table will be assumed to be the header row, and don't bother with a row of dashes after it.
- Also, the pipe ("|") in tables is mandatory at the end of the row, otherwise weird things will happen.
- Bold, italic, and other elements are not supported in tables
- 
*/

/*
List of warning types
- unknown-language
- image-incomplete
- link-incomplete
- italic-not-closed
- bold-not-closed
- superscript-not-closed
- blockquote-broken
- code-block-not-closed
- unordered-list-broken
- code-snippet-not-closed
- too-much-header
- heading-broken
- horizontal-rule-broken
- missing-image-alt
- empty-link
- weird-href
*/

//tests

test_assert_equal(parse_md_to_html("a\n\n\nb"), "<p>a</p>\n<p>b</p>", "new line test 1");

test_assert_equal(parse_md_to_html("a\n\n\nb\n"), "<p>a</p>\n<p>b</p>", "new line test 2");

test_assert_equal(parse_md_to_html("a\n\n\nb\n\n"), "<p>a</p>\n<p>b</p>", "new line test 3");

test_assert_equal(parse_md_to_html("# testing\n## Heading#\n# Chee see\nlorem ipsum"), "<h1 id=\"header-0\">testing</h1>\n<h2 id=\"header-1\">Heading#</h2>\n<h1 id=\"header-2\">Chee see</h1>\n<p>lorem ipsum</p>", "heading test 1");

test_assert_equal(parse_md_to_html("in the sam#e way# bricks don't\n# Yay\n#a# b"), "<p>in the sam#e way# bricks don't</p>\n<h1 id=\"header-0\">Yay</h1>\n<p>#a# b</p>", "heading test 2");

test_assert_equal(parse_md_to_html("# <script>a\<bc</script>"), "<h1 id=\"header-0\">&lt;script&gt;a&lt;bc&lt;/script&gt;</h1>", "sanitize test");

test_assert_equal(parse_md_to_html("# tet offensive\n"), "<h1 id=\"header-0\">tet offensive</h1>", "heading test 3");

test_assert_equal(parse_md_to_html("**test abc** *a*\n## **ch*ch**"), "<p><b>test abc</b> <i>a</i></p>\n<h2 id=\"header-0\"><b>ch*ch</b></h2>", "bold italic test 1");

test_assert_equal(parse_md_to_html("****a*"), "<p><b></b>a*</p>", "bold italic test 2");

test_assert_equal(parse_md_to_html("**burger** *b*ca*\n**with no fries**"), "<p><b>burger</b> <i>b</i>ca*</p>\n<p><b>with no fries</b></p>", "bold italic test 3");

test_assert_equal(parse_md_to_html("---\n--\n----\n--a-\n---"), "<hr>\n<p>--</p>\n<hr>\n<p>--a-</p>\n<hr>", "horizontal rule test");

test_assert_equal(parse_md_to_html("\\*\\*cheese\\*\\*\n*\\*cheese\\*\\*"), "<p>**cheese**</p>\n<p><i>*cheese*</i></p>", "backslash test");

test_assert_equal(parse_md_to_html("asdf![alt text](/images/ming-dynasty.png)\n![(burger!)](https://burger.com/burger.png)"), "<p>asdf<img src=\"/images/ming-dynasty.png\" alt=\"alt text\"></p>\n<img src=\"https://burger.com/burger.png\" alt=\"(burger!)\">", "image test");

test_assert_equal(parse_md_to_html("asdf![alt text(/images/ming-dynasty.png)\n![burgeerr](wee.pong\n)"), "<p>asdf![alt text(/images/ming-dynasty.png)</p>\n<p>![burgeerr](wee.pong</p>\n<p>)</p>", "invalid image test");

test_assert_equal(parse_md_to_html("Yo quiero [cheeseburger](https://wendys.org/burger).\n[Con cheerios.](/cheerios)"), "<p>Yo quiero <a href=\"https://wendys.org/burger\">cheeseburger</a>.</p>\n<p><a href=\"/cheerios\">Con cheerios.</a></p>", "link test 1");

test_assert_equal(parse_md_to_html("[a](b)\n[fake link](oops"), "<p><a href=\"b\">a</a></p>\n<p>[fake link](oops</p>", "link test 2");

test_assert_equal(parse_md_to_html("`e\n\\`testing `console.log('*koala*');`"), "<p>`e</p>\n<p>`testing <code>console.log('*koala*');</code></p>", "code snippet test");

test_assert_equal(parse_md_to_html("```\nif time == 420:\n    weed()\n```"), "<div class=\"code-block\">\nif time == 420:<br>\n&nbsp;&nbsp;&nbsp;&nbsp;weed()<br>\n</div>", "code block test 1");

test_assert_equal(parse_md_to_html("## testing\n```markdown\n# title\n  i like **cheeseburgers** and `code`\n```\n```"), "<h2 id=\"header-0\">testing</h2>\n<div class=\"code-block code-markdown\">\n# title<br>\n&nbsp;&nbsp;i like **cheeseburgers** and `code`<br>\n</div>\n<p><code></code>`</p>", "code block test 2");

test_assert_equal(parse_md_to_html("> ```\n> if\n>  b\n> a\n> ```"), "<blockquote>\n<div class=\"code-block\">\nif<br>\n&nbsp;b<br>\na<br>\n</div>\n</blockquote>", "code block test 2")

test_assert_equal(parse_md_to_html("test\n> test\n> ## TEST\n> **beach**\n> `wee`\n> # dd"), "<p>test</p>\n<blockquote>\n<p>test</p>\n<h2 id=\"header-0\">TEST</h2>\n<p><b>beach</b></p>\n<p><code>wee</code></p>\n<h1 id=\"header-1\">dd</h1>\n</blockquote>", "block quote test 1");

test_assert_equal(parse_md_to_html("> ```\n> alert('e')\n> ```"), "<blockquote>\n<div class=\"code-block\">\nalert('e')<br>\n</div>\n</blockquote>", "block quote test 2");

test_assert_equal(parse_md_to_html("> a\n\n> b"), "<blockquote>\n<p>a</p>\n</blockquote>\n<blockquote>\n<p>b</p>\n</blockquote>", "block quote test 3");

test_assert_equal(parse_md_to_html("> - burger\n> -winter melons\n> abcdefg\n> - fries\n- p**i**zza\na"), "<blockquote>\n<ul>\n<li>burger</li>\n</ul>\n<p>-winter melons</p>\n<p>abcdefg</p>\n<ul>\n<li>fries</li>\n</ul>\n</blockquote>\n<ul>\n<li>p<b>i</b>zza</li>\n</ul>\n<p>a</p>", "unordered lists test 1");

test_assert_equal(parse_md_to_html("- a**b**\n- cd\n- \[a]"), "<ul>\n<li>a<b>b</b></li>\n<li>cd</li>\n<li>[a]</li>\n</ul>", "unordered lists test 2");

test_assert_equal(parse_md_to_html("1. a\n2. b\n3. c\n5. should *fail*\n> 1. d\n> 2. e\n3. should fail too"), "<ol>\n<li>a</li>\n<li>b</li>\n<li>c</li>\n</ol>\n<p>5. should <i>fail</i></p>\n<blockquote>\n<ol>\n<li>d</li>\n<li>e</li>\n</ol>\n</blockquote>\n<p>3. should fail too</p>", "ordered lists test 1")

test_assert_equal(parse_md_to_html("1. uno\n2. dos\n3. tres\n4. cuatro\n5. cinco\n6. seis\n7. siete\n8. ocho\n9. nueve\n10. diez\n11. once"), "<ol>\n<li>uno</li>\n<li>dos</li>\n<li>tres</li>\n<li>cuatro</li>\n<li>cinco</li>\n<li>seis</li>\n<li>siete</li>\n<li>ocho</li>\n<li>nueve</li>\n<li>diez</li>\n<li>once</li>\n</ol>", "ordered lists test 2");

test_assert_equal(parse_md_to_html("a ^ace^ base\n```js\n^sup^\n```\ne=mc^2\n^ea^"), "<p>a <sup>ace</sup> base</p>\n<div class=\"code-block code-js\">\n^sup^<br>\n</div>\n<p>e=mc^2</p>\n<p><sup>ea</sup></p>", "superscript test");

test_assert_equal(parse_md_to_html("~~asdf~~ testing ~~is this thing on?~~ this will not be ~~struck through\n~~wee\n~~**a a a**\n~~*aloha~~*"), "<p><s>asdf</s> testing <s>is this thing on?</s> this will not be ~~struck through</p>\n<p>~~wee</p>\n<p>~~<b>a a a</b></p>\n<p><s>*aloha</s>*</p>", "strikethrough test");

//I don't care about table edgecases.
test_assert_equal(parse_md_to_html("|a|b|c|\n|d|e|f|\n# a"), "<table>\n<tr>\n<th>a</th>\n<th>b</th>\n<th>c</th>\n</tr>\n<tr>\n<td>d</td>\n<td>e</td>\n<td>f</td>\n</tr>\n</table>\n<h1 id=\"header-0\">a</h1>", "basic table test");

console.log(`Total Passed: \x1B[32m${passed_tests}/${total_tests}\x1B[m\nTotal Failed: \x1B[31m${failed_tests}/${total_tests}\x1B[m`);
