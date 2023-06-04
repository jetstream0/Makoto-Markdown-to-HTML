import { parse_md_to_html } from './makoto';
import { test_assert_equal, total_tests, failed_tests, passed_tests } from './endosulfan';

/*
Quirks
- Will only put newlines after headings, paragraphs, and horizontal rules, all others will not be in final output (exception is it will not put a newline on the last line)
- 
*/

//tests

test_assert_equal(parse_md_to_html("a\n\n\nb"), "<p>a</p>\n<p>b</p>", "new line test 1");

test_assert_equal(parse_md_to_html("a\n\n\nb\n"), "<p>a</p>\n<p>b</p>", "new line test 2");

test_assert_equal(parse_md_to_html("a\n\n\nb\n\n"), "<p>a</p>\n<p>b</p>", "new line test 3");

test_assert_equal(parse_md_to_html("# testing\n## Heading#\n# Chee see\nlorem ipsum"), "<h1 id='header-0'>testing</h1>\n<h2 id='header-1'>Heading#</h2>\n<h1 id='header-2'>Chee see</h1>\n<p>lorem ipsum</p>", "heading test 1");

test_assert_equal(parse_md_to_html("in the sam#e way# bricks don't\n# Yay\n#a# b"), "<p>in the sam#e way# bricks don't</p>\n<h1 id='header-0'>Yay</h1>\n<p>#a# b</p>", "heading test 2");

test_assert_equal(parse_md_to_html("# <script>a\<bc</script>"), "<h1 id='header-0'>&lt;script&gt;a&lt;bc&lt;/script&gt;</h1>", "sanitize test");

test_assert_equal(parse_md_to_html("# tet offensive\n"), "<h1 id='header-0'>tet offensive</h1>", "heading test 3");

test_assert_equal(parse_md_to_html("**test abc** *a*\n## **ch*ch**"), "<p><b>test abc</b> <i>a</i></p>\n<h2 id='header-0'><b>ch*ch</b></h2>", "bold italic test 1");

test_assert_equal(parse_md_to_html("****a*"), "<p><b></b>a*</p>", "bold italic test 2");

test_assert_equal(parse_md_to_html("---\n--\n----\n--a-\n---"), "<hr>\n<p>--</p>\n<hr>\n<p>--a-</p>\n<hr>", "horizontal rule test");

test_assert_equal(parse_md_to_html("\\*\\*cheese\\*\\*\n*\\*cheese\\*\\*"), "<p>**cheese**</p>\n<p><i>*cheese*</i></p>", "backslash test");

test_assert_equal(parse_md_to_html("asdf![alt text](/images/ming-dynasty.png)\n![(burger!)](https://burger.com/burger.png)"), "<p>asdf<img src=\"/images/ming-dynasty.png\" alt=\"alt text\"></p>\n<img src=\"https://burger.com/burger.png\" alt=\"(burger!)\">", "image test");

test_assert_equal(parse_md_to_html("asdf![alt text(/images/ming-dynasty.png)\n![burgeerr](wee.pong\n)"), "<p>asdf![alt text(/images/ming-dynasty.png)</p>\n<p>![burgeerr](wee.pong</p>\n<p>)</p>", "invalid image test");

test_assert_equal(parse_md_to_html("`e\ntesting `console.log('*koala*')`"), "<p>`e</p>\n<p>testing <code>console.log('*koala*')</code></p>", "code snippet test");

//todo: links, blockquotes, ordered lists, unordered lists, table, code block

console.log(`Total Passed: \x1B[32m${passed_tests}/${total_tests}\x1B[m\nTotal Failed: \x1B[31m${failed_tests}/${total_tests}\x1B[m`);
