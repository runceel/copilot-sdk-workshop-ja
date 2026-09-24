'use strict';

const assert = require('node:assert/strict');
const { getLanguage } = require('../language-registry.js');
const {
    firstLessonUrl,
    homeUrl,
    lessonUrl,
    resolveLanguage,
    siteRootUrl
} = require('../language-navigation.js');
const { preprocessLanguageDirectives } = require('../markdown-language-preprocessor.js');

const preprocess = (markdown, languageId) =>
    preprocessLanguageDirectives(markdown, languageId, getLanguage);

assert.equal(
    preprocess('Shared\n:::language dotnet\n.NET only\n:::\n:::language python\nPython only\n:::\nEnd', 'dotnet'),
    'Shared\n.NET only\nEnd'
);
assert.equal(
    preprocess('Shared\n:::language dotnet\n.NET only\n:::\n:::language python\nPython only\n:::\nEnd', 'python'),
    'Shared\nPython only\nEnd'
);
assert.throws(
    () => preprocess(':::language dotnet\n:::language python\n:::\n:::', 'dotnet'),
    /2 行目.*入れ子にできません/
);
assert.throws(() => preprocess(':::language unknown\n:::', 'dotnet'), /不明な言語 "unknown"/);
assert.throws(() => preprocess(':::language dotnet\nUnclosed', 'dotnet'), /閉じられていません/);
assert.throws(() => preprocess(':::', 'dotnet'), /対応する言語ブロックがありません/);
assert.throws(() => preprocess(':::unexpected', 'dotnet'), /:::language <id> または :::/);
assert.throws(() => preprocess(null, 'dotnet'), /Markdown は文字列/);
assert.throws(() => preprocess('本文', 'unknown'), /有効な実装言語/);

for (const languageId of ['dotnet', 'go', 'java', 'nodejs', 'python', 'rust']) {
    const command = getLanguage(languageId).installCommand;
    const block = `\`\`\`bash\n${command}\n\`\`\``;
    assert.equal(
        preprocess(
            `# 事前準備\n\n:::language ${languageId}\n## 実行する\n${block}\n:::\n[次へ](01-first-session.md)`,
            languageId
        ),
        `# 事前準備\n\n## 実行する\n${block}\n[次へ](01-first-session.md)`
    );
    assert.match(getLanguage(languageId).runtimeNote, /必要です/);
}

assert.equal(lessonUrl('04-mcp-safety', 'rust'), '?step=04-mcp-safety&lang=rust');
assert.equal(lessonUrl('04-mcp-safety'), '?step=04-mcp-safety');
assert.equal(firstLessonUrl('java'), 'workshop/step.html?step=00-preflight&lang=java');
assert.equal(firstLessonUrl('python', 'museum'), 'workshop/step.html?step=museum-00-preflight&lang=python');
assert.equal(homeUrl('python'), '../index.html?lang=python');
assert.equal(homeUrl('python', 'museum'), '../index.html?lang=python&workshop=museum');
assert.equal(homeUrl(), '../index.html');
assert.equal(
    siteRootUrl('https://expert-adventure-l67eo16.pages.github.io/workshop/step.html?step=00-preflight').href,
    'https://expert-adventure-l67eo16.pages.github.io/'
);
assert.equal(
    siteRootUrl('https://github.github.io/copilot-sdk-workshop/workshop/step.html').href,
    'https://github.github.io/copilot-sdk-workshop/'
);
assert.equal(
    siteRootUrl('https://runceel.github.io/copilot-sdk-workshop-ja/workshop/step.html?step=00-preflight&lang=dotnet').href,
    'https://runceel.github.io/copilot-sdk-workshop-ja/'
);
assert.equal(resolveLanguage('?lang=go', 'rust', getLanguage).id, 'go');
assert.equal(resolveLanguage('', 'rust', getLanguage).id, 'rust');
assert.equal(resolveLanguage('?lang=unknown', 'rust', getLanguage), null);

console.log('Workshop language directive and navigation tests passed.');
