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
- 
*/

/*
List of warning types
- 
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

test_assert_equal(parse_md_to_html("---\n--\n----\n--a-\n---"), "<hr>\n<p>--</p>\n<hr>\n<p>--a-</p>\n<hr>", "horizontal rule test");

test_assert_equal(parse_md_to_html("\\*\\*cheese\\*\\*\n*\\*cheese\\*\\*"), "<p>**cheese**</p>\n<p><i>*cheese*</i></p>", "backslash test");

test_assert_equal(parse_md_to_html("asdf![alt text](/images/ming-dynasty.png)\n![(burger!)](https://burger.com/burger.png)"), "<p>asdf<img src=\"/images/ming-dynasty.png\" alt=\"alt text\"></p>\n<img src=\"https://burger.com/burger.png\" alt=\"(burger!)\">", "image test");

test_assert_equal(parse_md_to_html("asdf![alt text(/images/ming-dynasty.png)\n![burgeerr](wee.pong\n)"), "<p>asdf![alt text(/images/ming-dynasty.png)</p>\n<p>![burgeerr](wee.pong</p>\n<p>)</p>", "invalid image test");

test_assert_equal(parse_md_to_html("Yo quiero [cheeseburger](https://wendys.org/burger).\n[Con cheerios.](/cheerios)"), "<p>Yo quiero <a href=\"https://wendys.org/burger\">cheeseburger</a>.</p>\n<p><a href=\"/cheerios\">Con cheerios.</a></p>", "link test 1");

test_assert_equal(parse_md_to_html("[a](b)\n[fake link](oops"), "<p><a href=\"b\">a</a></p>\n<p>[fake link](oops</p>", "link test 2");

test_assert_equal(parse_md_to_html("`e\n\\`testing `console.log('*koala*');`"), "<p>`e</p>\n<p>`testing <code>console.log('*koala*');</code></p>", "code snippet test");

test_assert_equal(parse_md_to_html("```\nif time == 420:\n    weed()\n```"), "<div class=\"code-block\">\nif time == 420:<br>\n&nbsp;&nbsp;&nbsp;&nbsp;weed()<br>\n</div>", "code block test 1");

test_assert_equal(parse_md_to_html("## testing\n```markdown\n# title\n  i like **cheeseburgers** and `code`\n```\n```"), "<h2 id=\"header-0\">testing</h2>\n<div class=\"code-block code-markdown\">\n# title<br>\n&nbsp;&nbsp;i like **cheeseburgers** and `code`<br>\n</div>\n<p><code></code>`</p>", "code block test 2");

test_assert_equal(parse_md_to_html("test\n> test\n> ## TEST\n> **beach**\n> `wee`\n> # dd"), "<p>test</p>\n<blockquote>\n<p>test</p>\n<h2 id=\"header-0\">TEST</h2>\n<p><b>beach</b></p>\n<p><code>wee</code></p>\n<h1 id=\"header-1\">dd</h1>\n</blockquote>", "block quote test 1");

test_assert_equal(parse_md_to_html("> ```\n> alert('e')\n> ```"), "<blockquote>\n<div class=\"code-block\">\nalert('e')<br>\n</div>\n</blockquote>", "block quote test 2");

//todo: ordered lists, unordered lists, tables

console.log(parse_md_to_html("- burger\n- fries\n- pizza"));

console.log(`Total Passed: \x1B[32m${passed_tests}/${total_tests}\x1B[m\nTotal Failed: \x1B[31m${failed_tests}/${total_tests}\x1B[m`);
