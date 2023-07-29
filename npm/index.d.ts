export type Warning = {
    type: string;
    message: string;
    line_number?: number;
};
export type ParseResult = {
    html: string;
    warnings: Warning[];
};
export declare function parse_md_to_html_with_warnings(md: string): ParseResult;
export declare function parse_md_to_html(md: string): string;
