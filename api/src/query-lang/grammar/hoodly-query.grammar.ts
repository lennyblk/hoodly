/**
 * HQL (Hoodly Query Language) grammar, written as a Jison bnf/lex grammar object.
 *
 * Syntax:
 *   FIND <collection> [WHERE <condition>] [LIMIT <number>]
 *   condition := condition AND condition
 *              | condition OR condition
 *              | ( condition )
 *              | <field> <op> <value>
 *   op        := = | != | > | < | >= | <= | CONTAINS
 *   value     := STRING | NUMBER | TRUE | FALSE | NULL
 *
 * See docs/dossier-technique.md for the full grammar reference and examples.
 */
export const hoodlyQueryGrammar = {
  lex: {
    rules: [
      ['\\s+', '/* skip whitespace */'],
      ['FIND\\b', "return 'FIND'"],
      ['WHERE\\b', "return 'WHERE'"],
      ['AND\\b', "return 'AND'"],
      ['OR\\b', "return 'OR'"],
      ['LIMIT\\b', "return 'LIMIT'"],
      ['CONTAINS\\b', "return 'CONTAINS'"],
      ['true\\b', "return 'TRUE'"],
      ['false\\b', "return 'FALSE'"],
      ['null\\b', "return 'NULL'"],
      ['"[^"]*"', "yytext = yytext.slice(1, -1); return 'STRING';"],
      ["'[^']*'", "yytext = yytext.slice(1, -1); return 'STRING';"],
      ['[0-9]+(\\.[0-9]+)?\\b', "return 'NUMBER'"],
      ['[a-zA-Z_][a-zA-Z0-9_.]*', "return 'IDENTIFIER'"],
      ['!=', "return 'NEQ'"],
      ['>=', "return 'GTE'"],
      ['<=', "return 'LTE'"],
      ['=', "return 'EQ'"],
      ['>', "return 'GT'"],
      ['<', "return 'LT'"],
      ['\\(', "return 'LPAREN'"],
      ['\\)', "return 'RPAREN'"],
    ],
  },
  operators: [
    ['left', 'OR'],
    ['left', 'AND'],
  ],
  bnf: {
    query: [
      ['FIND IDENTIFIER where_opt limit_opt', 'return { collection: $2, where: $3, limit: $4 };'],
    ],
    where_opt: [
      ['WHERE condition', '$$ = $2;'],
      ['', '$$ = null;'],
    ],
    limit_opt: [
      ['LIMIT NUMBER', '$$ = Number($2);'],
      ['', '$$ = null;'],
    ],
    condition: [
      ['condition AND condition', '$$ = { and: [$1, $3] };'],
      ['condition OR condition', '$$ = { or: [$1, $3] };'],
      ['LPAREN condition RPAREN', '$$ = $2;'],
      ['IDENTIFIER operator value', '$$ = { field: $1, op: $2, value: $3 };'],
    ],
    operator: [
      ['EQ', "$$ = '=';"],
      ['NEQ', "$$ = '!=';"],
      ['GT', "$$ = '>';"],
      ['LT', "$$ = '<';"],
      ['GTE', "$$ = '>=';"],
      ['LTE', "$$ = '<=';"],
      ['CONTAINS', "$$ = 'contains';"],
    ],
    value: [
      ['STRING', '$$ = $1;'],
      ['NUMBER', '$$ = Number($1);'],
      ['TRUE', '$$ = true;'],
      ['FALSE', '$$ = false;'],
      ['NULL', '$$ = null;'],
    ],
  },
};
