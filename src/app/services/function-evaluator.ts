/**
 * Function evaluator for dynamic value expressions
 * Supports: now(), today(), format(), lower(), upper(), trim(), replace()
 *
 * Examples:
 * - "now().format('YYYY-MM-DD')"
 * - "today().format('MM/DD/YYYY')"
 * - "lower()"
 * - "upper()"
 * - "trim()"
 * - "replace('old', 'new')"
 */

import { log } from '../../utils/log'

/**
 * Token types for expression parsing
 */
type TokenType = 'FUNCTION' | 'DOT' | 'LPAREN' | 'RPAREN' | 'STRING' | 'COMMA' | 'EOF' | 'UNKNOWN'

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

        // Function name (identifier)
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
            tokens.push({ type: 'FUNCTION', value: name })
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
 * Parse and evaluate a function call
 */
interface FunctionCall {
    name: string
    args: string[]
}

/**
 * Parse a function call from tokens starting at position
 */
function parseFunctionCall(
    tokens: Token[],
    pos: number
): { call: FunctionCall; newPos: number } | null {
    const token = tokens[pos]
    if (!token || token.type !== 'FUNCTION') {
        return null
    }

    const name = token.value
    pos++

    // Expect left paren
    const lparenToken = tokens[pos]
    if (!lparenToken || lparenToken.type !== 'LPAREN') {
        return null
    }
    pos++

    // Parse arguments
    const args: string[] = []
    while (pos < tokens.length) {
        const argToken = tokens[pos]
        if (!argToken) break

        if (argToken.type === 'RPAREN') {
            pos++
            break
        }

        if (argToken.type === 'STRING') {
            args.push(argToken.value)
            pos++

            // Check for comma
            const nextToken = tokens[pos]
            if (nextToken && nextToken.type === 'COMMA') {
                pos++
            }
            continue
        }

        if (argToken.type === 'COMMA') {
            pos++
            continue
        }

        // Unexpected token
        pos++
    }

    return { call: { name, args }, newPos: pos }
}

/**
 * Date wrapper class for chaining operations
 */
class DateValue {
    constructor(private date: Date) {}

    format(pattern: string): string {
        // Simple date formatting (subset of Moment.js patterns)
        const year = this.date.getFullYear()
        const month = this.date.getMonth() + 1
        const day = this.date.getDate()
        const hours = this.date.getHours()
        const minutes = this.date.getMinutes()
        const seconds = this.date.getSeconds()

        const pad = (n: number, width: number = 2): string => n.toString().padStart(width, '0')

        return pattern
            .replace(/YYYY/g, year.toString())
            .replace(/YY/g, year.toString().slice(-2))
            .replace(/MM/g, pad(month))
            .replace(/M/g, month.toString())
            .replace(/DD/g, pad(day))
            .replace(/D/g, day.toString())
            .replace(/HH/g, pad(hours))
            .replace(/H/g, hours.toString())
            .replace(/hh/g, pad(hours % 12 || 12))
            .replace(/h/g, (hours % 12 || 12).toString())
            .replace(/mm/g, pad(minutes))
            .replace(/m/g, minutes.toString())
            .replace(/ss/g, pad(seconds))
            .replace(/s/g, seconds.toString())
            .replace(/A/g, hours >= 12 ? 'PM' : 'AM')
            .replace(/a/g, hours >= 12 ? 'pm' : 'am')
    }

    toString(): string {
        return this.date.toISOString()
    }
}

/**
 * String wrapper class for chaining operations
 */
class StringValue {
    constructor(private str: string) {}

    lower(): StringValue {
        return new StringValue(this.str.toLowerCase())
    }

    upper(): StringValue {
        return new StringValue(this.str.toUpperCase())
    }

    trim(): StringValue {
        return new StringValue(this.str.trim())
    }

    replace(pattern: string, replacement: string): StringValue {
        return new StringValue(this.str.replace(new RegExp(pattern, 'g'), replacement))
    }

    toString(): string {
        return this.str
    }
}

type EvaluationResult = DateValue | StringValue | string

/**
 * Evaluate a parsed expression
 */
function evaluateFunctionCalls(calls: FunctionCall[]): EvaluationResult {
    if (calls.length === 0) {
        return ''
    }

    const firstCall = calls[0]
    if (!firstCall) {
        return ''
    }

    let result: EvaluationResult

    // Initial function call
    switch (firstCall.name) {
        case 'now':
            result = new DateValue(new Date())
            break
        case 'today': {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            result = new DateValue(today)
            break
        }
        default:
            // Start with empty string for string functions
            result = new StringValue('')
    }

    // Process chain
    for (
        let i = firstCall.name === 'now' || firstCall.name === 'today' ? 1 : 0;
        i < calls.length;
        i++
    ) {
        const call = calls[i]
        if (!call) continue

        if (result instanceof DateValue) {
            switch (call.name) {
                case 'format':
                    result = result.format(call.args[0] ?? 'YYYY-MM-DD')
                    break
                default:
                    // Convert to string and continue
                    result = new StringValue(result.toString())
                    result = applyStringMethod(result, call)
            }
        } else if (result instanceof StringValue) {
            result = applyStringMethod(result, call)
        } else if (typeof result === 'string') {
            result = new StringValue(result)
            result = applyStringMethod(result, call)
        }
    }

    return result
}

function applyStringMethod(value: StringValue, call: FunctionCall): StringValue {
    switch (call.name) {
        case 'lower':
            return value.lower()
        case 'upper':
            return value.upper()
        case 'trim':
            return value.trim()
        case 'replace':
            return value.replace(call.args[0] ?? '', call.args[1] ?? '')
        case 'format':
            // String format is a no-op, already a string
            return value
        default:
            return value
    }
}

/**
 * Check if a value is a function expression (contains parentheses)
 */
export function isFunctionExpression(value: string): boolean {
    return value.includes('(') && value.includes(')')
}

/**
 * Evaluate a value, handling both static values and function expressions
 *
 * @param value - The value to evaluate (static string or function expression)
 * @returns The evaluated string value
 */
export function evaluateValue(value: string): string {
    // If not a function expression, return as-is
    if (!isFunctionExpression(value)) {
        return value
    }

    try {
        const tokens = tokenize(value)
        const calls: FunctionCall[] = []

        let pos = 0
        while (pos < tokens.length) {
            const token = tokens[pos]
            if (!token) break

            if (token.type === 'EOF') {
                break
            }

            if (token.type === 'DOT') {
                pos++
                continue
            }

            if (token.type === 'FUNCTION') {
                const parsed = parseFunctionCall(tokens, pos)
                if (parsed) {
                    calls.push(parsed.call)
                    pos = parsed.newPos
                } else {
                    pos++
                }
            } else {
                pos++
            }
        }

        const result = evaluateFunctionCalls(calls)
        return result.toString()
    } catch (error) {
        log(`Error evaluating function expression: ${value}`, 'error', error)
        return value // Return original value on error
    }
}
