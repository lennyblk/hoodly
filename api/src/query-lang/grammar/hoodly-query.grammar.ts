/**
 * HQL (Hoodly Query Language) grammar, written as a Jison bnf/lex grammar object.
 *
 * Syntax:
 *   FIND documents [WHERE <condition>] [LIMIT <number>]
 *   condition := condition AND condition
 *              | condition OR condition
 *              | ( condition )
 *              | <field> <op> <value>
 *   field     := id | title | type | name | ownerId | signers | status
 *              | gridfsId | announcementId | createdAt
 *   op        := = | != | > | < | >= | <= | CONTAINS
 *   value     := STRING | NUMBER | TRUE | FALSE | NULL
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
      ['documents\\b', "return 'DOCUMENTS'"],
      ['true\\b', "return 'TRUE'"],
      ['false\\b', "return 'FALSE'"],
      ['null\\b', "return 'NULL'"],
      [
        '(id|title|type|name|ownerId|signers|status|gridfsId|announcementId|createdAt)\\b',
        "return 'FIELD'",
      ],
      ['"[^"]*"', "yytext = yytext.slice(1, -1); return 'STRING';"],
      ["'[^']*'", "yytext = yytext.slice(1, -1); return 'STRING';"],
      ['[0-9]+(\\.[0-9]+)?\\b', "return 'NUMBER'"],
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
      ['FIND DOCUMENTS where_opt limit_opt', 'return { where: $3, limit: $4 };'],
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
      ['FIELD operator value', '$$ = { field: $1, op: $2, value: $3 };'],
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
