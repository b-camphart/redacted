import { describe, expect, it } from 'vitest';
import { getValidWordRanges } from '../../../src/usecases/story/wordRanges';

describe('valid word ranges', () => {

    it("no censorable words", () => {
        expect(getValidWordRanges("")).toEqual([]);
        expect(getValidWordRanges("   ")).toEqual([]);
        expect(getValidWordRanges(" \n  ")).toEqual([]);
        expect(getValidWordRanges('" " . ?  ! ( ) [ ] < > - - + _ =')).toEqual([]);
    });

    it("one censorable word", () => {
        expect(getValidWordRanges("hello")).toEqual(censoredIndices("_____"));
        expect(getValidWordRanges("hello!")).toEqual(censoredIndices("_____!"));
        expect(getValidWordRanges("  hello! ")).toEqual(censoredIndices("  _____! "));
        expect(getValidWordRanges("  hello")).toEqual(censoredIndices("  _____"));
    });

    it("two censorable words", () => {
        expect(getValidWordRanges("  Hello, there! ")).toEqual(censoredIndices("  _____, _____! "));
    });

    it("contractions", () => {
        expect(getValidWordRanges("\"I'm quoting Bob: 'I can't swim!' \"")).toEqual(
            censoredIndices("\"___ _______ ___: '_ _____ ____!' \"")
        );
        expect(getValidWordRanges("'Simple quote'")).toEqual(censoredIndices("'______ _____'"));
        expect(getValidWordRanges("'The words' censors can be tricky'")).toEqual(
            censoredIndices("'___ ______ _______ ___ __ ______'")
        );
        expect(getValidWordRanges("'The words' censors can be tricky!'")).toEqual(
            censoredIndices("'___ ______ _______ ___ __ ______!'")
        );
        expect(getValidWordRanges("This bad grammar is the words'")).toEqual(
            censoredIndices("____ ___ _______ __ ___ ______")
        );
        expect(getValidWordRanges("'The first quote' I said.  'The second quote'")).toEqual(
            censoredIndices("'___ _____ _____' _ ____.  '___ ______ _____'")
        );
        expect(getValidWordRanges("bla s'")).toEqual(
            censoredIndices("___ __")
        )
    });

    it('counts numbers as part of words', () => {
        expect(getValidWordRanges('1')).toEqual(censoredIndices("_"))
        expect(getValidWordRanges('word1 word2')).toEqual(censoredIndices('_____ _____'))

    })

    const censoredIndices = (censoredContent: string) => {
        let censorStart = -1;
        const censors = [];
        for (let charIndex = 0; charIndex < censoredContent.length; charIndex++) {
            const char = censoredContent.charAt(charIndex);
            if (char !== "_") {
                if (censorStart >= 0) censors.push([censorStart, charIndex]);
                censorStart = -1;
                continue;
            }
            if (censorStart < 0) censorStart = charIndex;
        }
        if (censorStart >= 0) censors.push([censorStart, censoredContent.length]);
        return censors;
    };

})