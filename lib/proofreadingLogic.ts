export type ProofreadingResult = {
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    suggestion?: string;
    context: string;
    index: number; // Position in text for potential highlighting
    length: number;
    note?: string;
};

export interface ProofreadingSettings {
    forbiddenWords: string[];
    inconsistencyRules: { incorrect: string; correct: string; note?: string }[];
}

export const DEFAULT_SETTINGS: ProofreadingSettings = {
    forbiddenWords: ['ございます', '思われます', '！？'],
    inconsistencyRules: [
        { incorrect: 'コンピュータ', correct: 'コンピューター', note: 'JIS規格準拠' },
        { incorrect: 'ブラウザ', correct: 'ブラウザー' },
        { incorrect: 'プリンタ', correct: 'プリンター' },
        { incorrect: 'ユーザ', correct: 'ユーザー' },
        { incorrect: 'サーバ', correct: 'サーバー' },
        { incorrect: 'メモリ', correct: 'メモリー' },
        { incorrect: 'エディタ', correct: 'エディター' },
    ]
};

export function analyzeText(text: string, settings: ProofreadingSettings = DEFAULT_SETTINGS): ProofreadingResult[] {
    const results: ProofreadingResult[] = [];

    if (!text) return results;

    // 1. Forbidden Words
    settings.forbiddenWords.forEach(word => {
        if (!word) return;
        let pos = text.indexOf(word);
        while (pos !== -1) {
            results.push({
                id: `forbidden-${pos}-${word}`,
                type: 'warning',
                message: `禁止ワード「${word}」が含まれています。`,
                suggestion: '別の表現を検討してください',
                context: text.substring(Math.max(0, pos - 10), Math.min(text.length, pos + word.length + 10)),
                index: pos,
                length: word.length
            });
            pos = text.indexOf(word, pos + 1);
        }
    });

    // 2. Sentence Ending Repetition (〜ます。〜ます。〜ます。)
    // Split by sentence endings (。|！|？|\n)
    const rawSentences = text.split(/([。！？\n]+)/);

    // Reconstruct pairs
    const pairs: string[] = [];
    for (let i = 0; i < rawSentences.length; i += 2) {
        const s = rawSentences[i];
        const d = rawSentences[i + 1] || '';
        if (s || d) {
            pairs.push(s + d);
        }
    }

    let repeatCount = 0;
    let lastEndingType = ''; // 'desu', 'masu', 'other'
    let currentPos = 0;

    pairs.forEach((sentence, idx) => {
        const len = sentence.length;
        // Remove trailing punctuation and whitespace to check the actual ending
        const cleanContent = sentence.replace(/[。！？\n\s]+$/, '');

        if (cleanContent.length === 0) {
            currentPos += len;
            return;
        }

        let currentType = 'other';

        if (cleanContent.endsWith('ます')) { currentType = 'masu'; }
        else if (cleanContent.endsWith('です')) { currentType = 'desu'; }

        // Check for repetition
        if (currentType !== 'other' && currentType === lastEndingType) {
            repeatCount++;
        } else {
            repeatCount = 1;
            lastEndingType = currentType;
        }

        if (repeatCount >= 3) {
            // Calculate index for highlighting the ending
            // We want to highlight the last 2 chars ('ます' or 'です') of the clean content
            // The position of the end of cleanContent relative to sentence start is cleanContent.length
            // So the start of 'ます'/'です' is cleanContent.length - 2
            const highlightIndex = currentPos + cleanContent.length - 2;

            results.push({
                id: `repetition-${idx}`,
                type: 'warning',
                message: `文末が「${currentType === 'masu' ? 'ます' : 'です'}」で3回以上連続しています。`,
                suggestion: '体言止めや別の文末表現を使ってリズムを変えましょう',
                context: sentence.substring(Math.max(0, sentence.length - 20)),
                index: highlightIndex,
                length: 2
            });
        }
        currentPos += len;
    });

    // 3. Inconsistency Check
    settings.inconsistencyRules.forEach(rule => {
        const { incorrect, correct, note } = rule;
        if (!incorrect || !correct) return;

        // Use regex with word-boundary-like logic to avoid partial matches
        // Escape special regex characters in the search string
        const escaped = incorrect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'g');
        let match;
        while ((match = regex.exec(text)) !== null) {
            const pos = match.index;

            // Check if the text at this position is actually the correct form
            // e.g., if incorrect="ユーザ" and correct="ユーザー",
            // and the text has "ユーザー", we should skip it
            const surroundingText = text.substring(pos, pos + correct.length);
            if (surroundingText === correct) {
                continue;
            }

            // Also check if the incorrect match is part of a longer correct form
            // by verifying the character after the match isn't extending the word
            // For cases where correct is longer than incorrect and starts with incorrect
            let isPartOfCorrect = false;
            if (correct.startsWith(incorrect) && correct.length > incorrect.length) {
                const extraChars = correct.substring(incorrect.length);
                const textAfter = text.substring(pos + incorrect.length, pos + incorrect.length + extraChars.length);
                if (textAfter === extraChars) {
                    isPartOfCorrect = true;
                }
            }

            if (!isPartOfCorrect) {
                results.push({
                    id: `inconsistency-${pos}-${incorrect}`,
                    type: 'warning',
                    message: `表記ゆれの可能性があります：「${incorrect}」`,
                    suggestion: correct,
                    context: text.substring(Math.max(0, pos - 10), Math.min(text.length, pos + incorrect.length + 10)),
                    index: pos,
                    length: incorrect.length,
                    note: note
                });
            }
        }
    });

    return results;
}

export function getCharacterCount(text: string): number {
    return text.length;
}

export function getCharacterCountNoSpaces(text: string): number {
    return text.replace(/[\s\n\r\t　]/g, '').length;
}
