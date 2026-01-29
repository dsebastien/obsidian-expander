/**
 * Function evaluator for dynamic value expressions
 * Supports: now(), today(), date(), format(), lower(), upper(), trim(), replace(), file.*
 * Also supports: title(), slice(), repeat(), startsWith(), endsWith(), contains(), isEmpty()
 * Number functions: number(), min(), max(), abs(), ceil(), floor(), round(), toFixed()
 * Date functions: date(), time(), relative()
 * Control flow: if()
 * Utility: escapeHTML()
 *
 * Examples:
 * - "now().format('YYYY-MM-DD')"
 * - "today().format('MM/DD/YYYY')"
 * - "date('2024-01-15').format('YYYY')" → "2024"
 * - "date(file.name).format('YYYY-MM-DD')" → parses date from file name
 * - "upper('hello')" → "HELLO"
 * - "lower('HELLO')" → "hello"
 * - "trim('  hello  ')" → "hello"
 * - "replace('hello world', 'world', 'there')" → "hello there"
 * - "'hello world'.title()" → "Hello World"
 * - "if(file.name.isEmpty(), 'No name', file.name)"
 * - "number('42').abs()" → "42"
 * - "min(5, 3, 8)" → "3"
 * - Chaining: "upper('hello').replace('L', 'X')" → "HEXXO"
 * - File fields: "file.name", "file.path", "file.ctime.format('YYYY-MM-DD')"
 * - File with functions: "file.name.upper()", "upper(file.name)"
 */

import { log } from '../../utils/log'
import {
    DateValue,
    createNow,
    createToday,
    createDateValue,
    createDateFromString
} from '../../utils/date'
import { StringValue, createString } from '../../utils/string'
import { NumberValue, parseNumber, minValue, maxValue } from '../../utils/number'
import type { EvaluationContext } from '../types/evaluation-context'
import { getFileFields } from '../types/evaluation-context'

/**
 * Token types for expression parsing
 */
type TokenType =
    | 'IDENTIFIER'
    | 'DOT'
    | 'LPAREN'
    | 'RPAREN'
    | 'STRING'
    | 'NUMBER'
    | 'COMMA'
    | 'EOF'
    | 'UNKNOWN'

interface Token {
    type: TokenType
    value: string
}

/**
 * Simple tokenizer for function expressions
 */
function tokenize(expression: string): Token[] {
    const tokens: Token[] = []
    let i = 0

    while (i < expression.length) {
        const char = expression[i]

        // Skip whitespace
        if (char === undefined) {
            break
        }

        if (/\s/.test(char)) {
            i++
            continue
        }

        // Dot
        if (char === '.') {
            tokens.push({ type: 'DOT', value: '.' })
            i++
            continue
        }

        // Left paren
        if (char === '(') {
            tokens.push({ type: 'LPAREN', value: '(' })
            i++
            continue
        }

        // Right paren
        if (char === ')') {
            tokens.push({ type: 'RPAREN', value: ')' })
            i++
            continue
        }

        // Comma
        if (char === ',') {
            tokens.push({ type: 'COMMA', value: ',' })
            i++
            continue
        }

        // String literal (single or double quotes)
        if (char === "'" || char === '"') {
            const quote = char
            let str = ''
            i++ // Skip opening quote
            while (i < expression.length && expression[i] !== quote) {
                if (expression[i] === '\\' && i + 1 < expression.length) {
                    // Handle escape sequences
                    i++
                    const nextChar = expression[i]
                    str += nextChar === 'n' ? '\n' : nextChar === 't' ? '\t' : (nextChar ?? '')
                } else {
                    str += expression[i]
                }
                i++
            }
            i++ // Skip closing quote
            tokens.push({ type: 'STRING', value: str })
            continue
        }

        // Number literal (including negative numbers and decimals)
        if (
            /[0-9]/.test(char) ||
            (char === '-' && i + 1 < expression.length && /[0-9]/.test(expression[i + 1] ?? ''))
        ) {
            let num = ''
            if (char === '-') {
                num += char
                i++
            }
            while (i < expression.length) {
                const c = expression[i]
                if (c && /[0-9.]/.test(c)) {
                    num += c
                    i++
                } else {
                    break
                }
            }
            tokens.push({ type: 'NUMBER', value: num })
            continue
        }

        // Identifier (function name or property)
        if (/[a-zA-Z_]/.test(char)) {
            let name = ''
            while (i < expression.length) {
                const c = expression[i]
                if (c && /[a-zA-Z0-9_]/.test(c)) {
                    name += c
                    i++
                } else {
                    break
                }
            }
            tokens.push({ type: 'IDENTIFIER', value: name })
            continue
        }

        // Unknown character
        tokens.push({ type: 'UNKNOWN', value: char })
        i++
    }

    tokens.push({ type: 'EOF', value: '' })
    return tokens
}

/**
 * Represents a parsed expression element
 */
type ExpressionElement =
    | { type: 'function'; name: string; args: string[] }
    | { type: 'property'; name: string }
    | { type: 'fileField'; field: string }

/**
 * Parse an expression into a chain of elements
 * Handles: file.name, file.ctime.format("..."), now().format("..."), upper("text"), upper(file.name)
 */
function parseExpression(tokens: Token[], context?: EvaluationContext): ExpressionElement[] {
    const elements: ExpressionElement[] = []
    let pos = 0

    while (pos < tokens.length) {
        const token = tokens[pos]
        if (!token || token.type === 'EOF') break

        if (token.type === 'DOT') {
            pos++
            continue
        }

        if (token.type === 'IDENTIFIER') {
            const name = token.value
            pos++

            const nextToken = tokens[pos]

            // Check if this is a function call (followed by LPAREN)
            if (nextToken && nextToken.type === 'LPAREN') {
                pos++ // Skip LPAREN

                // Parse arguments
                const args: string[] = []
                while (pos < tokens.length) {
                    const argToken = tokens[pos]
                    if (!argToken) break

                    if (argToken.type === 'RPAREN') {
                        pos++
                        break
                    }

                    if (argToken.type === 'STRING' || argToken.type === 'NUMBER') {
                        args.push(argToken.value)
                        pos++

                        const commaToken = tokens[pos]
                        if (commaToken && commaToken.type === 'COMMA') {
                            pos++
                        }
                        continue
                    }

                    // Handle file.field as argument (e.g., upper(file.name))
                    if (argToken.type === 'IDENTIFIER' && argToken.value === 'file') {
                        pos++ // Skip 'file'
                        const dotToken = tokens[pos]
                        if (dotToken && dotToken.type === 'DOT') {
                            pos++ // Skip '.'
                            const fieldToken = tokens[pos]
                            if (fieldToken && fieldToken.type === 'IDENTIFIER') {
                                // Resolve file field value
                                if (context) {
                                    const fields = getFileFields(context.file)
                                    const fieldValue = resolveFileFieldValue(
                                        fields,
                                        fieldToken.value
                                    )
                                    args.push(fieldValue)
                                }
                                pos++

                                const commaToken = tokens[pos]
                                if (commaToken && commaToken.type === 'COMMA') {
                                    pos++
                                }
                                continue
                            }
                        }
                    }

                    if (argToken.type === 'COMMA') {
                        pos++
                        continue
                    }

                    pos++
                }

                elements.push({ type: 'function', name, args })
            } else if (name === 'file') {
                // file.field - expect DOT followed by field name
                if (nextToken && nextToken.type === 'DOT') {
                    pos++ // Skip DOT
                    const fieldToken = tokens[pos]
                    if (fieldToken && fieldToken.type === 'IDENTIFIER') {
                        elements.push({ type: 'fileField', field: fieldToken.value })
                        pos++
                    }
                }
            } else {
                // Plain property access (for chaining like .upper())
                elements.push({ type: 'property', name })
            }
        } else {
            pos++
        }
    }

    return elements
}

/**
 * Resolve a file field to its string value (for use as function argument)
 */
function resolveFileFieldValue(
    fields: ReturnType<typeof getFileFields>,
    fieldName: string
): string {
    switch (fieldName) {
        case 'name':
            return fields.name
        case 'path':
            return fields.path
        case 'folder':
            return fields.folder
        case 'ext':
            return fields.ext
        case 'ctime':
            return fields.ctime.toISOString()
        case 'mtime':
            return fields.mtime.toISOString()
        default:
            return ''
    }
}

type EvaluationResult = DateValue | StringValue | NumberValue | string | boolean | string[]

/**
 * Evaluate a parsed expression chain
 */
function evaluateExpression(
    elements: ExpressionElement[],
    context?: EvaluationContext
): EvaluationResult {
    if (elements.length === 0) {
        return ''
    }

    const firstElement = elements[0]
    if (!firstElement) {
        return ''
    }

    let result: EvaluationResult

    // Handle first element
    if (firstElement.type === 'fileField') {
        if (!context) {
            return '' // No context, can't resolve file fields
        }
        const fields = getFileFields(context.file)
        result = resolveFileField(fields, firstElement.field)
    } else if (firstElement.type === 'function') {
        result = evaluateInitialFunction(firstElement.name, firstElement.args)
    } else {
        // Property access without prior value - shouldn't happen at start
        return ''
    }

    // Process remaining chain
    for (let i = 1; i < elements.length; i++) {
        const element = elements[i]
        if (!element) continue

        if (element.type === 'function' || element.type === 'property') {
            const name = element.type === 'function' ? element.name : element.name
            const args = element.type === 'function' ? element.args : []

            if (result instanceof DateValue) {
                result = applyDateMethod(result, name, args)
            } else if (result instanceof NumberValue) {
                result = applyNumberMethod(result, name, args)
            } else if (result instanceof StringValue) {
                result = applyStringMethod(result, name, args)
            } else if (typeof result === 'string') {
                result = createString(result)
                result = applyStringMethod(result, name, args)
            }
            // booleans don't have chainable methods
        }
    }

    return result
}

/**
 * Resolve a file field to the appropriate value type
 */
function resolveFileField(
    fields: ReturnType<typeof getFileFields>,
    fieldName: string
): EvaluationResult {
    switch (fieldName) {
        case 'name':
            return createString(fields.name)
        case 'path':
            return createString(fields.path)
        case 'folder':
            return createString(fields.folder)
        case 'ext':
            return createString(fields.ext)
        case 'ctime':
            return createDateValue(fields.ctime)
        case 'mtime':
            return createDateValue(fields.mtime)
        default:
            return createString('')
    }
}

/**
 * Evaluate an initial function call (first in chain)
 */
function evaluateInitialFunction(name: string, args: string[]): EvaluationResult {
    switch (name) {
        // Date functions
        case 'now':
            return createNow()
        case 'today':
            return createToday()
        case 'date': {
            const dateStr = args[0] ?? ''
            const parsed = createDateFromString(dateStr)
            // Return the parsed date or a string error indicator
            return parsed ?? createString('')
        }

        // String functions
        case 'upper':
            return createString(args[0] ?? '').upper()
        case 'lower':
            return createString(args[0] ?? '').lower()
        case 'trim':
            return createString(args[0] ?? '').trim()
        case 'replace':
            return createString(args[0] ?? '').replace(args[1] ?? '', args[2] ?? '')
        case 'title':
            return createString(args[0] ?? '').title()

        // Number functions
        case 'number':
            return parseNumber(args[0] ?? '0')
        case 'min': {
            const nums = args.map((a) => parseFloat(a))
            return minValue(...nums)
        }
        case 'max': {
            const nums = args.map((a) => parseFloat(a))
            return maxValue(...nums)
        }

        // Conditional function
        case 'if': {
            // args[0] = condition (truthy check)
            // args[1] = true result
            // args[2] = false result (optional, defaults to '')
            const condition = args[0] ?? ''
            const isTruthy = evaluateTruthiness(condition)
            return createString(isTruthy ? (args[1] ?? '') : (args[2] ?? ''))
        }

        // Utility functions
        case 'escapeHTML':
            return createString(escapeHTML(args[0] ?? ''))

        default:
            return createString('')
    }
}

/**
 * Evaluate truthiness of a string value
 * Falsy values: empty string, "false", "0", "null", "undefined"
 */
function evaluateTruthiness(value: string): boolean {
    const trimmed = value.trim().toLowerCase()
    return (
        trimmed !== '' &&
        trimmed !== 'false' &&
        trimmed !== '0' &&
        trimmed !== 'null' &&
        trimmed !== 'undefined'
    )
}

/**
 * Escape HTML special characters
 */
function escapeHTML(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

function applyStringMethod(
    value: StringValue,
    name: string,
    args: string[]
): StringValue | boolean | string[] {
    switch (name) {
        case 'lower':
            return value.lower()
        case 'upper':
            return value.upper()
        case 'trim':
            return value.trim()
        case 'replace':
            return value.replace(args[0] ?? '', args[1] ?? '')
        case 'title':
            return value.title()
        case 'slice': {
            const start = parseInt(args[0] ?? '0', 10)
            const end = args[1] ? parseInt(args[1], 10) : undefined
            return value.slice(start, end)
        }
        case 'repeat': {
            const count = parseInt(args[0] ?? '1', 10)
            return value.repeat(count)
        }
        case 'startsWith':
            return value.startsWith(args[0] ?? '')
        case 'endsWith':
            return value.endsWith(args[0] ?? '')
        case 'contains':
            return value.contains(args[0] ?? '')
        case 'containsAll':
            return value.containsAll(...args)
        case 'containsAny':
            return value.containsAny(...args)
        case 'isEmpty':
            return value.isEmpty()
        case 'reverse':
            return value.reverse()
        case 'split': {
            const sep = args[0] ?? ''
            const limit = args[1] ? parseInt(args[1], 10) : undefined
            return value.split(sep, limit)
        }
        case 'format':
            // String format is a no-op, already a string
            return value
        default:
            return value
    }
}

/**
 * Apply a method to a DateValue
 */
function applyDateMethod(value: DateValue, name: string, args: string[]): EvaluationResult {
    switch (name) {
        case 'format':
            return value.format(args[0] ?? 'YYYY-MM-DD')
        case 'date':
            return value.dateOnly()
        case 'time':
            return value.time()
        case 'relative':
            return value.relative()
        case 'isEmpty':
            return value.isEmpty()
        default:
            // Convert to string and apply string method
            return applyStringMethod(createString(value.toString()), name, args)
    }
}

/**
 * Apply a method to a NumberValue
 */
function applyNumberMethod(value: NumberValue, name: string, args: string[]): EvaluationResult {
    switch (name) {
        case 'abs':
            return value.abs()
        case 'ceil':
            return value.ceil()
        case 'floor':
            return value.floor()
        case 'round': {
            const digits = args[0] ? parseInt(args[0], 10) : 0
            return value.round(digits)
        }
        case 'toFixed': {
            const precision = parseInt(args[0] ?? '0', 10)
            return value.toFixed(precision)
        }
        case 'isEmpty':
            return value.isEmpty()
        default:
            // Convert to string and apply string method
            return applyStringMethod(createString(value.toString()), name, args)
    }
}

/**
 * Check if a value is a dynamic expression (contains functions or file fields)
 */
export function isDynamicExpression(value: string): boolean {
    return (value.includes('(') && value.includes(')')) || value.startsWith('file.')
}

/**
 * Evaluate a value, handling both static values and dynamic expressions
 *
 * @param value - The value to evaluate (static string or dynamic expression)
 * @param context - Optional evaluation context with file information
 * @returns The evaluated string value
 */
export function evaluateValue(value: string, context?: EvaluationContext): string {
    // If not a dynamic expression, return as-is
    if (!isDynamicExpression(value)) {
        return value
    }

    try {
        const tokens = tokenize(value)
        const elements = parseExpression(tokens, context)
        const result = evaluateExpression(elements, context)
        return resultToString(result)
    } catch (error) {
        log(`Error evaluating expression: ${value}`, 'error', error)
        return value // Return original value on error
    }
}

/**
 * Convert an evaluation result to a string
 */
function resultToString(result: EvaluationResult): string {
    if (typeof result === 'boolean') {
        return result ? 'true' : 'false'
    }
    if (Array.isArray(result)) {
        return result.join(', ')
    }
    return result.toString()
}

// Keep old function name as alias for backwards compatibility
export const isFunctionExpression = isDynamicExpression
