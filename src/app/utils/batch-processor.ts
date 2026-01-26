import { BATCH_SIZE } from '../constants'

/**
 * Process items in batches with concurrency control
 *
 * @param items - Array of items to process
 * @param processor - Function to process each item
 * @param batchSize - Number of items to process concurrently (default: BATCH_SIZE)
 * @returns Array of results from all processed items
 */
export async function processInBatches<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = BATCH_SIZE
): Promise<R[]> {
    const results: R[] = []

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize)
        const batchResults = await Promise.all(batch.map(processor))
        results.push(...batchResults)
    }

    return results
}

/**
 * Process items in batches with progress callback
 *
 * @param items - Array of items to process
 * @param processor - Function to process each item
 * @param onProgress - Callback with current progress (processed count, total count)
 * @param batchSize - Number of items to process concurrently (default: BATCH_SIZE)
 * @returns Array of results from all processed items
 */
export async function processInBatchesWithProgress<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    onProgress: (processed: number, total: number) => void,
    batchSize: number = BATCH_SIZE
): Promise<R[]> {
    const results: R[] = []
    const total = items.length

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize)
        const batchResults = await Promise.all(batch.map(processor))
        results.push(...batchResults)
        onProgress(Math.min(i + batchSize, total), total)
    }

    return results
}
