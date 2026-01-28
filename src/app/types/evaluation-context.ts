import type { TFile } from 'obsidian'

/**
 * Context for evaluating function expressions
 * Provides file metadata that can be accessed via file.* fields
 */
export interface EvaluationContext {
    /** The file being processed */
    file: TFile
}

/**
 * File fields that can be accessed in expressions
 * Follows Obsidian Bases conventions: https://help.obsidian.md/bases/functions#Fields
 */
export interface FileFields {
    /** File name without extension */
    name: string
    /** Full path relative to vault root */
    path: string
    /** Parent folder path */
    folder: string
    /** File extension (without dot) */
    ext: string
    /** Creation time */
    ctime: Date
    /** Modification time */
    mtime: Date
}

/**
 * Extract file fields from a TFile
 */
export function getFileFields(file: TFile): FileFields {
    const pathParts = file.path.split('/')
    pathParts.pop() // Remove filename
    const folder = pathParts.join('/') || '/'

    return {
        name: file.basename,
        path: file.path,
        folder,
        ext: file.extension,
        ctime: new Date(file.stat.ctime),
        mtime: new Date(file.stat.mtime)
    }
}
