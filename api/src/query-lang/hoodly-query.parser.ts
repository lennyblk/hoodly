/// <reference path="../types/jison.d.ts" />
import { Parser } from 'jison';
import { BadRequestException } from '@nestjs/common';
import { hoodlyQueryGrammar } from './grammar/hoodly-query.grammar';

export type HqlComparisonOp = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains';
export type HqlValue = string | number | boolean | null;

export interface HqlComparisonNode {
  field: string;
  op: HqlComparisonOp;
  value: HqlValue;
}
export interface HqlAndNode {
  and: [HqlConditionNode, HqlConditionNode];
}
export interface HqlOrNode {
  or: [HqlConditionNode, HqlConditionNode];
}
export type HqlConditionNode = HqlComparisonNode | HqlAndNode | HqlOrNode;

export interface HqlQuery {
  collection: string;
  where: HqlConditionNode | null;
  limit: number | null;
}

const parser = new Parser(hoodlyQueryGrammar);

/** Parses an HQL string (e.g. `FIND documents WHERE status = "signed" LIMIT 10`). */
export function parseHql(input: string): HqlQuery {
  if (!input || !input.trim()) {
    throw new BadRequestException('Empty query');
  }
  try {
    return parser.parse(input.trim()) as HqlQuery;
  } catch (e: any) {
    throw new BadRequestException(`HQL syntax error: ${e.message.split('\n')[0]}`);
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function comparisonToMongo(node: HqlComparisonNode): Record<string, unknown> {
  const { field, op, value } = node;
  switch (op) {
    case '=':
      return { [field]: value };
    case '!=':
      return { [field]: { $ne: value } };
    case '>':
      return { [field]: { $gt: value } };
    case '<':
      return { [field]: { $lt: value } };
    case '>=':
      return { [field]: { $gte: value } };
    case '<=':
      return { [field]: { $lte: value } };
    case 'contains':
      return { [field]: { $regex: escapeRegex(String(value)), $options: 'i' } };
  }
}

/** Converts the WHERE clause AST into a native MongoDB filter object. */
export function hqlConditionToMongoFilter(node: HqlConditionNode | null): Record<string, unknown> {
  if (!node) return {};
  if ('and' in node) return { $and: node.and.map(hqlConditionToMongoFilter) };
  if ('or' in node) return { $or: node.or.map(hqlConditionToMongoFilter) };
  return comparisonToMongo(node);
}
