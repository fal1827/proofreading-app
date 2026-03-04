import { analyzeText, getCharacterCount, ProofreadingSettings, DEFAULT_SETTINGS } from '@/lib/proofreadingLogic';

describe('analyzeText', () => {
    // === 禁止ワードチェック ===
    describe('禁止ワードチェック', () => {
        test('禁止ワードを検出する', () => {
            const text = 'これはございます。';
            const results = analyzeText(text, DEFAULT_SETTINGS);
            const forbidden = results.filter(r => r.id.startsWith('forbidden'));
            expect(forbidden.length).toBeGreaterThanOrEqual(1);
            expect(forbidden[0].message).toContain('ございます');
        });

        test('禁止ワードが複数回出現した場合すべて検出する', () => {
            const text = 'ございますと思われます。ございます。';
            const results = analyzeText(text, DEFAULT_SETTINGS);
            const forbidden = results.filter(r => r.id.startsWith('forbidden'));
            // 「ございます」x2 + 「思われます」x1 = 3
            expect(forbidden.length).toBe(3);
        });

        test('禁止ワードがない場合は検出しない', () => {
            const text = 'これは正常なテキストです。';
            const settings: ProofreadingSettings = {
                forbiddenWords: ['NG用語'],
                inconsistencyRules: [],
            };
            const results = analyzeText(text, settings);
            expect(results.length).toBe(0);
        });
    });

    // === 文末連続チェック ===
    describe('文末連続チェック', () => {
        test('「ます」が3回連続すると警告', () => {
            const text = '走ります。食べます。寝ます。';
            const results = analyzeText(text, { forbiddenWords: [], inconsistencyRules: [] });
            const repetitions = results.filter(r => r.id.startsWith('repetition'));
            expect(repetitions.length).toBeGreaterThanOrEqual(1);
            expect(repetitions[0].message).toContain('ます');
        });

        test('「です」が3回連続すると警告', () => {
            const text = 'これはペンです。あれは本です。それは机です。';
            const results = analyzeText(text, { forbiddenWords: [], inconsistencyRules: [] });
            const repetitions = results.filter(r => r.id.startsWith('repetition'));
            expect(repetitions.length).toBeGreaterThanOrEqual(1);
        });

        test('文末が2回しか連続しない場合は警告しない', () => {
            const text = '走ります。食べます。';
            const results = analyzeText(text, { forbiddenWords: [], inconsistencyRules: [] });
            const repetitions = results.filter(r => r.id.startsWith('repetition'));
            expect(repetitions.length).toBe(0);
        });

        test('異なる文末が混在する場合は警告しない', () => {
            const text = '走ります。これはペンです。食べます。';
            const results = analyzeText(text, { forbiddenWords: [], inconsistencyRules: [] });
            const repetitions = results.filter(r => r.id.startsWith('repetition'));
            expect(repetitions.length).toBe(0);
        });
    });

    // === 表記ゆれチェック ===
    describe('表記ゆれチェック', () => {
        test('NGワードを検出する', () => {
            const text = 'コンピュータを使う。';
            const results = analyzeText(text, DEFAULT_SETTINGS);
            const inconsistencies = results.filter(r => r.id.startsWith('inconsistency'));
            expect(inconsistencies.length).toBe(1);
            expect(inconsistencies[0].suggestion).toBe('コンピューター');
        });

        test('OKワードは検出しない（誤判定バグの修正確認）', () => {
            const text = 'コンピューターを使う。';
            const results = analyzeText(text, DEFAULT_SETTINGS);
            const inconsistencies = results.filter(r => r.id.startsWith('inconsistency'));
            expect(inconsistencies.length).toBe(0);
        });

        test('「ユーザ」はNG、「ユーザー」はOK', () => {
            const text = 'ユーザは多い。ユーザーも多い。';
            const settings: ProofreadingSettings = {
                forbiddenWords: [],
                inconsistencyRules: [
                    { incorrect: 'ユーザ', correct: 'ユーザー' },
                ],
            };
            const results = analyzeText(text, settings);
            const inconsistencies = results.filter(r => r.id.startsWith('inconsistency'));
            // 「ユーザは多い」の「ユーザ」だけが検出される
            // 「ユーザーも多い」の「ユーザー」は正しいのでスキップ
            expect(inconsistencies.length).toBe(1);
            expect(inconsistencies[0].index).toBe(0);
        });

        test('NGワードが複数回出現した場合すべて検出する', () => {
            const text = 'サーバとプリンタを接続する。';
            const settings: ProofreadingSettings = {
                forbiddenWords: [],
                inconsistencyRules: [
                    { incorrect: 'サーバ', correct: 'サーバー' },
                    { incorrect: 'プリンタ', correct: 'プリンター' },
                ],
            };
            const results = analyzeText(text, settings);
            const inconsistencies = results.filter(r => r.id.startsWith('inconsistency'));
            expect(inconsistencies.length).toBe(2);
        });
    });

    // === 空テキスト ===
    test('空のテキストでは結果が空', () => {
        const results = analyzeText('', DEFAULT_SETTINGS);
        expect(results.length).toBe(0);
    });
});

describe('getCharacterCount', () => {
    test('正しい文字数を返す', () => {
        expect(getCharacterCount('hello')).toBe(5);
        expect(getCharacterCount('こんにちは')).toBe(5);
        expect(getCharacterCount('')).toBe(0);
    });
});
