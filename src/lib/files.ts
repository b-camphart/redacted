export async function createFile(parentDir: string, filename: string): Promise<string> {
    const fs = await import('fs');

    const path = parentDir + filename;

    fs.mkdirSync(parentDir, { recursive: true });
    fs.writeFileSync(path, '')

    return path;
}