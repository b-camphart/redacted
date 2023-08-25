import { getValidWordRanges } from "../wordRanges";

export function replacementsAreValid(
    expectedNumber: number,
    replacements: string[],
): boolean {
    return replacements.length === expectedNumber &&
        replacements.every(replacement => replacement.length > 0 && getValidWordRanges(replacement).length === 1);
}