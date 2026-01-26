/**
 * Debounced function type
 */
export interface DebouncedFunction<Args extends unknown[]> {
    (...args: Args): void
    cancel: () => void
    flush: () => void
}

/**
 * Create a debounced version of a function
 * The function will only be called after it hasn't been invoked for the specified delay
 *
 * @param fn - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns A debounced function with cancel and flush methods
 */
export function debounce<Args extends unknown[]>(
    fn: (...args: Args) => void,
    delay: number
): DebouncedFunction<Args> {
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let lastArgs: Args | null = null

    const debouncedFn = (...args: Args): void => {
        lastArgs = args

        if (timeoutId !== null) {
            clearTimeout(timeoutId)
        }

        timeoutId = setTimeout(() => {
            if (lastArgs !== null) {
                fn(...lastArgs)
            }
            timeoutId = null
            lastArgs = null
        }, delay)
    }

    debouncedFn.cancel = (): void => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId)
            timeoutId = null
        }
        lastArgs = null
    }

    debouncedFn.flush = (): void => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId)
            timeoutId = null
            if (lastArgs !== null) {
                fn(...lastArgs)
                lastArgs = null
            }
        }
    }

    return debouncedFn
}

/**
 * Create a throttled version of a function
 * The function will be called at most once per specified interval
 *
 * @param fn - The function to throttle
 * @param interval - The minimum interval between calls in milliseconds
 * @returns A throttled function
 */
export function throttle<Args extends unknown[]>(
    fn: (...args: Args) => void,
    interval: number
): (...args: Args) => void {
    let lastCall = 0
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    return (...args: Args): void => {
        const now = Date.now()
        const remaining = interval - (now - lastCall)

        if (remaining <= 0) {
            if (timeoutId !== null) {
                clearTimeout(timeoutId)
                timeoutId = null
            }
            lastCall = now
            fn(...args)
        } else if (timeoutId === null) {
            timeoutId = setTimeout(() => {
                lastCall = Date.now()
                timeoutId = null
                fn(...args)
            }, remaining)
        }
    }
}
