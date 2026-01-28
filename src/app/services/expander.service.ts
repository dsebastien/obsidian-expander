import type { PluginSettings, Replacement } from '../types/plugin-settings.intf'
import type { EvaluationContext } from '../types/evaluation-context'
import { evaluateValue } from './function-evaluator'

/**
 * Service for managing and evaluating expansions
 */
export class ExpanderService {
    constructor(private getSettings: () => PluginSettings) {}

    /**
     * Get the computed value for a key
     * Returns null if key doesn't exist or is disabled
     *
     * @param key - The replacement key
     * @param context - Optional evaluation context with file information for file.* fields
     */
    getReplacementValue(key: string, context?: EvaluationContext): string | null {
        const settings = this.getSettings()
        const replacement = settings.replacements.find((r) => r.key === key && r.enabled)

        if (!replacement) {
            return null
        }

        return evaluateValue(replacement.value, context)
    }

    /**
     * Check if a key exists and is enabled
     */
    hasKey(key: string): boolean {
        const settings = this.getSettings()
        return settings.replacements.some((r) => r.key === key && r.enabled)
    }

    /**
     * Get all enabled keys
     */
    getEnabledKeys(): string[] {
        const settings = this.getSettings()
        return settings.replacements.filter((r) => r.enabled).map((r) => r.key)
    }

    /**
     * Get all replacements (for UI display)
     */
    getAllReplacements(): Replacement[] {
        return this.getSettings().replacements
    }

    /**
     * Get a replacement by key
     */
    getReplacement(key: string): Replacement | undefined {
        return this.getSettings().replacements.find((r) => r.key === key)
    }

    /**
     * Preview a computed value (for UI display)
     * Returns the evaluated value or error message
     */
    previewValue(value: string): { success: boolean; result: string } {
        try {
            const result = evaluateValue(value)
            return { success: true, result }
        } catch (error) {
            return {
                success: false,
                result: error instanceof Error ? error.message : 'Unknown error'
            }
        }
    }
}
