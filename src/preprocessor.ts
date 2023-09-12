import type { ReporterOptions } from 'knip';
import { promisify } from 'node:util';
import { exec as execSync } from 'node:child_process';

const exec = promisify(execSync);

async function isRecentlyModified(path: string) {
    // Ask git when this file was "changed"
    const { stdout } = await exec(`git log -1 --format="%ad" -- ${path}`);
    const lastModified = new Date(stdout);

    // Use 1 week for now; I don't believe Knip allows for configuration of this
    return Date.now() - lastModified.getTime() >= 1000 * 60 * 60 * 24 * 7;
} 

export async function gitPreprocessor(report: ReporterOptions): Promise<ReporterOptions> {
    const { files } = report.issues;

    // Bit messy, but it works
    const fileFilterResults = await Promise.all([...files].map(async file => [file, await isRecentlyModified(file)] as [string, boolean]));
    const filteredFiles = fileFilterResults.filter(([_, isRecentlyModified]) => isRecentlyModified).map(([file, _]) => file);

    return {
        ...report,
        issues: {
            ...report.issues,
            files: new Set(filteredFiles)
        }
    }
}
