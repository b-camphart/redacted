export type NumberRange = [number, number];

const letterRegex = new RegExp("[a-zA-Z]")
const numberRegex = new RegExp("[0-9]")

function isLetter(character: string): boolean {
    return letterRegex.test(character)
}

function isNumber(character: string): boolean {
    return numberRegex.test(character)
}

export function getValidWordRanges(content: string): NumberRange[] {
    const wordRanges: NumberRange[] = [];
    let currentRange: NumberRange | null = null;
    
    for (let index = 0; index < content.length; index++) {
        const character = content.charAt(index);
        if (currentRange !== null) {
            if (isLetter(character) || isNumber(character) || character === "'") {
                currentRange[1] = index + 1;
            } else {
                const lastCharIndex = index - 1;
                const secondToLastCharIndex = index - 2;
                if (lastCharIndex >= currentRange[0] && secondToLastCharIndex >= currentRange[0]) {
                    if (content.charAt(lastCharIndex) === "'" && content.charAt(secondToLastCharIndex) !== "s") {
                        currentRange[1] = index -1;
                    }
                }
                wordRanges.push(currentRange);
                currentRange = null;
            }
        } else {
            if (isLetter(character) || isNumber(character)) {
                currentRange = [index, index + 1];
            }
        }
    }

    if (currentRange !== null) {
        const lastCharIndex = content.length - 1;
        const secondToLastCharIndex = content.length - 2;
        if (lastCharIndex >= currentRange[0] && secondToLastCharIndex >= currentRange[0]) {
            if (content.charAt(lastCharIndex) === "'" && content.charAt(secondToLastCharIndex) !== "s") {
                currentRange[1] = content.length -1;
            }
        }
        wordRanges.push(currentRange)
    }

    return wordRanges;
}