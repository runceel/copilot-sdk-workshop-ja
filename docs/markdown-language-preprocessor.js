(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
    root.WorkshopMarkdown = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    function directiveError(lineNumber, message) {
        return new Error(`${lineNumber} 行目の言語ディレクティブにエラーがあります: ${message}`);
    }

    function preprocessLanguageDirectives(markdown, languageId, getLanguage) {
        if (typeof markdown !== 'string') {
            throw new TypeError('Markdown は文字列で指定してください。');
        }
        if (typeof getLanguage !== 'function' || !getLanguage(languageId)) {
            throw new Error(`レッスンの表示には有効な実装言語を指定してください: "${languageId ?? ''}"。`);
        }

        const output = [];
        let activeLanguageId = null;
        const lines = markdown.split(/\r?\n/);

        lines.forEach((line, index) => {
            const lineNumber = index + 1;
            const languageMatch = line.match(/^:::language\s+(\S+)\s*$/);
            const closingMatch = /^:::\s*$/.test(line);
            const directiveLike = line.startsWith(':::');

            if (languageMatch) {
                if (activeLanguageId !== null) {
                    throw directiveError(lineNumber, '言語ブロックは入れ子にできません。');
                }
                if (!getLanguage(languageMatch[1])) {
                    throw directiveError(lineNumber, `不明な言語 "${languageMatch[1]}" です。`);
                }
                activeLanguageId = languageMatch[1];
                return;
            }

            if (closingMatch) {
                if (activeLanguageId === null) {
                    throw directiveError(lineNumber, '終了ディレクティブに対応する言語ブロックがありません。');
                }
                activeLanguageId = null;
                return;
            }

            if (directiveLike) {
                throw directiveError(lineNumber, ':::language <id> または ::: を指定してください。');
            }

            if (activeLanguageId === null || activeLanguageId === languageId) {
                output.push(line);
            }
        });

        if (activeLanguageId !== null) {
            throw directiveError(lines.length, `"${activeLanguageId}" の言語ブロックが閉じられていません。`);
        }

        return output.join('\n');
    }

    return Object.freeze({ preprocessLanguageDirectives });
}));
