import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import * as diff from 'diff'

export interface FileUpdate {
  path: string
  diff?: string
}

export interface SyncResult {
  updated: Array<FileUpdate>
  skipped: Array<string>
  created: Array<string>
  deleted: Array<string>
  sourceFiles: Array<string>
  errors: Array<string>
}

export interface SyncOptions {
  deleteRemoved?: boolean
  previousSourceFiles?: Set<string>
}

export class FileSyncer {
  async sync(
    sourceDir: string,
    targetDir: string,
    options?: SyncOptions,
  ): Promise<SyncResult> {
    const result: SyncResult = {
      updated: [],
      skipped: [],
      created: [],
      deleted: [],
      sourceFiles: [],
      errors: [],
    }

    // Ensure directories exist
    if (!fs.existsSync(sourceDir)) {
      throw new Error(`Source directory does not exist: ${sourceDir}`)
    }
    if (!fs.existsSync(targetDir)) {
      throw new Error(`Target directory does not exist: ${targetDir}`)
    }

    // Walk through source directory and sync files
    await this.syncDirectory(sourceDir, targetDir, sourceDir, result)

    if (options?.deleteRemoved && options.previousSourceFiles) {
      const currentSourceFileSet = new Set(result.sourceFiles)
      await this.deleteRemovedFiles(
        targetDir,
        options.previousSourceFiles,
        currentSourceFileSet,
        result,
      )
    }

    return result
  }

  private async syncDirectory(
    currentPath: string,
    targetBase: string,
    sourceBase: string,
    result: SyncResult,
  ): Promise<void> {
    const entries = await fs.promises.readdir(currentPath, {
      withFileTypes: true,
    })

    for (const entry of entries) {
      const sourcePath = path.join(currentPath, entry.name)
      const relativePath = path.relative(sourceBase, sourcePath)
      const targetPath = path.join(targetBase, relativePath)

      // Skip certain directories
      if (entry.isDirectory()) {
        if (this.shouldSkipDirectory(entry.name)) {
          continue
        }

        // Ensure target directory exists
        if (!fs.existsSync(targetPath)) {
          await fs.promises.mkdir(targetPath, { recursive: true })
        }

        // Recursively sync subdirectory
        await this.syncDirectory(sourcePath, targetBase, sourceBase, result)
      } else if (entry.isFile()) {
        // Skip certain files
        if (this.shouldSkipFile(entry.name)) {
          continue
        }

        result.sourceFiles.push(relativePath)

        try {
          const shouldUpdate = await this.shouldUpdateFile(
            sourcePath,
            targetPath,
          )

          if (shouldUpdate) {
            // Check if file exists to generate diff
            let fileDiff: string | undefined
            const targetExists = fs.existsSync(targetPath)

            if (targetExists) {
              // Generate diff for existing files
              const oldContent = await fs.promises.readFile(targetPath, 'utf-8')
              const newContent = await fs.promises.readFile(sourcePath, 'utf-8')

              const changes = diff.createPatch(
                relativePath,
                oldContent,
                newContent,
                'Previous',
                'Current',
              )

              // Only include diff if there are actual changes
              if (changes && changes.split('\n').length > 5) {
                fileDiff = changes
              }
            }

            // Copy file
            await fs.promises.copyFile(sourcePath, targetPath)

            // Touch file to trigger dev server reload
            const now = new Date()
            await fs.promises.utimes(targetPath, now, now)

            if (!targetExists) {
              result.created.push(relativePath)
            } else {
              result.updated.push({
                path: relativePath,
                diff: fileDiff,
              })
            }
          } else {
            result.skipped.push(relativePath)
          }
        } catch (error) {
          result.errors.push(
            `${relativePath}: ${error instanceof Error ? error.message : String(error)}`,
          )
        }
      }
    }
  }

  private async shouldUpdateFile(
    sourcePath: string,
    targetPath: string,
  ): Promise<boolean> {
    // If target doesn't exist, definitely update
    if (!fs.existsSync(targetPath)) {
      return true
    }

    // Compare file sizes first (quick check)
    const [sourceStats, targetStats] = await Promise.all([
      fs.promises.stat(sourcePath),
      fs.promises.stat(targetPath),
    ])

    if (sourceStats.size !== targetStats.size) {
      return true
    }

    // Compare MD5 hashes for content
    const [sourceHash, targetHash] = await Promise.all([
      this.calculateHash(sourcePath),
      this.calculateHash(targetPath),
    ])

    return sourceHash !== targetHash
  }

  private async calculateHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5')
      const stream = fs.createReadStream(filePath)

      stream.on('data', (data) => hash.update(data))
      stream.on('end', () => resolve(hash.digest('hex')))
      stream.on('error', reject)
    })
  }

  private shouldSkipDirectory(name: string): boolean {
    const skipDirs = [
      'node_modules',
      '.git',
      'dist',
      'build',
      '.next',
      '.nuxt',
      '.cache',
      '.tmp-dev',
      'coverage',
      '.turbo',
    ]

    return skipDirs.includes(name) || name.startsWith('.')
  }

  private shouldSkipFile(name: string): boolean {
    const skipFiles = [
      '.DS_Store',
      'Thumbs.db',
      'desktop.ini',
      '.cta.json', // Skip .cta.json as it contains framework ID that changes each build
    ]

    const skipExtensions = ['.log', '.lock', '.pid', '.seed', '.sqlite']

    if (skipFiles.includes(name)) {
      return true
    }

    const ext = path.extname(name).toLowerCase()
    return skipExtensions.includes(ext)
  }

  private async deleteRemovedFiles(
    targetDir: string,
    previousSourceFiles: Set<string>,
    currentSourceFiles: Set<string>,
    result: SyncResult,
  ): Promise<void> {
    for (const relativePath of previousSourceFiles) {
      if (currentSourceFiles.has(relativePath)) {
        continue
      }

      const targetPath = path.join(targetDir, relativePath)

      try {
        if (!fs.existsSync(targetPath)) {
          continue
        }

        const stats = await fs.promises.stat(targetPath)
        if (!stats.isFile()) {
          continue
        }

        await fs.promises.unlink(targetPath)
        result.deleted.push(relativePath)
      } catch (error) {
        result.errors.push(
          `${relativePath}: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }
  }
}
