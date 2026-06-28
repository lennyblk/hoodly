declare module 'jison' {
  export class Parser {
    constructor(grammar: unknown);
    parse(input: string): unknown;
  }
}
