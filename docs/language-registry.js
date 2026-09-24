(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
    root.WorkshopLanguages = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const languages = Object.freeze([
        {
            id: 'dotnet',
            displayName: '.NET',
            docsUrl: 'https://github.com/github/copilot-sdk/tree/main/dotnet',
            installCommand: 'dotnet add package GitHub.Copilot.SDK',
            runtimeNote: '.NET SDK と、サポート対象の C# ランタイムが必要です。'
        },
        {
            id: 'go',
            displayName: 'Go',
            docsUrl: 'https://github.com/github/copilot-sdk/tree/main/go',
            installCommand: 'go get github.com/github/copilot-sdk/go',
            runtimeNote: 'サポート対象の Go ツールチェーンとモジュールが必要です。'
        },
        {
            id: 'java',
            displayName: 'Java',
            docsUrl: 'https://github.com/github/copilot-sdk/tree/main/java',
            installCommand: 'mvn dependency:get -Dartifact=com.github:copilot-sdk-java:1.0.11',
            runtimeNote: 'サポート対象の JDK と Maven プロジェクトが必要です。'
        },
        {
            id: 'nodejs',
            displayName: 'Node.js',
            docsUrl: 'https://github.com/github/copilot-sdk/tree/main/nodejs',
            installCommand: 'npm install @github/copilot-sdk',
            runtimeNote: '現在サポートされている Node.js の LTS リリースが必要です。'
        },
        {
            id: 'python',
            displayName: 'Python',
            docsUrl: 'https://github.com/github/copilot-sdk/tree/main/python',
            installCommand: 'pip install github-copilot-sdk',
            runtimeNote: 'Python と、独立した仮想環境が必要です。'
        },
        {
            id: 'rust',
            displayName: 'Rust',
            docsUrl: 'https://github.com/github/copilot-sdk/tree/main/rust',
            installCommand: 'cargo add copilot-sdk',
            runtimeNote: 'rustup でインストールした Rust と Cargo が必要です。'
        }
    ]);

    const languageById = Object.freeze(Object.fromEntries(
        languages.map(language => [language.id, language])
    ));

    function getLanguage(languageId) {
        return languageById[languageId] ?? null;
    }

    return Object.freeze({ languages, getLanguage });
}));
