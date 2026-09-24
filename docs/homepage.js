(function () {
    'use strict';

    const storageKey = 'copilot-sdk-workshop.language';
    const picker = document.getElementById('languagePicker');
    const languageInputs = [...document.querySelectorAll('input[name="language"]')];
    const startLink = document.getElementById('startWorkshopLink');
    const docsLink = document.getElementById('sdkDocsLink');
    const summary = document.getElementById('languageSummary');
    const installCommand = document.getElementById('installCommand');
    const runtimeNote = document.getElementById('runtimeNote');
    const workshopInputs = [...document.querySelectorAll('input[name="workshop"]')];
    const targetAppLink = document.getElementById('targetAppLink');
    const previewTitle = document.getElementById('previewTitle');
    const preview = document.getElementById('workshopPreview');
    const startGuidance = document.getElementById('startGuidance');
    let selectedWorkshopId = null;

    const workshops = {
        sdlc: {
            name: 'アクセシビリティレビュー',
            previewTitle: 'accessibility-reviewer',
            preview: `URL → Playwright による検査
     → WCAG の参照
     → 構造化レポート

[tool] playwright-browser_navigate
[tool] accessibility_rule_lookup

Finding
The name input has no accessible name.`,
            guidance: '90 分の基本コースで、ソフトウェア開発を支援するツールを作ります。'
        },
        museum: {
            name: '博物館の展示づくり',
            previewTitle: 'museum-exhibit-studio',
            preview: `承認済みの事実 → 学芸員セッション
               → 展示内容の検証
               → 来館者向けの解説文

Available tools: []
System message: replace

# Journey to the Moon
## Narrative
## Visitor questions`,
            guidance: '90 分の基本コースで、開発支援以外の用途に使う学芸員ツールを作ります。'
        }
    };

    function getStoredLanguageId() {
        try {
            return window.localStorage.getItem(storageKey);
        } catch (error) {
            return null;
        }
    }

    function storeLanguageId(languageId) {
        try {
            window.localStorage.setItem(storageKey, languageId);
        } catch (error) {
            // Local storage can be unavailable in private browsing contexts.
        }
    }

    function updateSelection(languageId) {
        const language = WorkshopLanguages.getLanguage(languageId);
        const hasLanguage = language !== null;
        const workshop = selectedWorkshopId ? workshops[selectedWorkshopId] : null;
        const ready = workshop !== null && hasLanguage;

        picker.disabled = workshop === null;
        document.querySelectorAll('.language-option').forEach(option => {
            option.classList.toggle('selected', option.dataset.language === language?.id);
        });
        startLink.classList.toggle('disabled', !ready);
        startLink.setAttribute('aria-disabled', String(!ready));
        startLink.href = ready
            ? WorkshopLanguageNavigation.firstLessonUrl(language.id, selectedWorkshopId)
            : workshop ? '#language-picker' : '#workshop-picker';
        startLink.textContent = ready ? `${workshop.name}を開始` : '選択したワークショップを開始';
        targetAppLink.hidden = selectedWorkshopId !== 'sdlc';

        if (!hasLanguage) {
            docsLink.removeAttribute('href');
            docsLink.setAttribute('aria-disabled', 'true');
            summary.textContent = workshop
                ? `${workshop.name}の実装に使う言語を選択してください。`
                : 'まずワークショップを選び、次に実装に使う言語を選択してください。';
            installCommand.textContent = '';
            runtimeNote.textContent = '';
            startGuidance.textContent = workshop?.guidance ??
                'ワークショップと言語を選択してください。エージェントや SDK の経験は不要です。';
            return;
        }

        docsLink.href = language.docsUrl;
        docsLink.removeAttribute('aria-disabled');
        docsLink.textContent = `${language.displayName} SDK ドキュメント ↗`;
        summary.textContent = workshop
            ? `${workshop.name}では ${language.displayName} SDK を使用します。`
            : 'ワークショップを選択して続けてください。';
        installCommand.textContent = language.installCommand;
        runtimeNote.textContent = language.runtimeNote;
        startGuidance.textContent = workshop?.guidance ?? 'ワークショップを選択して続けてください。';
    }

    function selectWorkshop(workshopId) {
        selectedWorkshopId = workshops[workshopId] ? workshopId : null;
        document.querySelectorAll('.workshop-option').forEach(option => {
            option.classList.toggle('selected', option.dataset.workshop === selectedWorkshopId);
        });
        const workshop = selectedWorkshopId ? workshops[selectedWorkshopId] : null;
        previewTitle.textContent = workshop?.previewTitle ?? 'workshop-preview';
        preview.textContent = workshop?.preview ?? 'ワークショップを選択すると、エージェントの処理の流れを確認できます。';
        updateSelection(languageInputs.find(input => input.checked)?.value ?? null);
        if (workshop) {
            languageInputs[0].focus();
        }
    }

    languageInputs.forEach(input => {
        input.addEventListener('change', () => {
            const language = WorkshopLanguages.getLanguage(input.value);
            storeLanguageId(language.id);
            updateSelection(language.id);
        });
    });

    workshopInputs.forEach(input => {
        input.addEventListener('change', () => selectWorkshop(input.value));
    });

    startLink.addEventListener('click', event => {
        if (startLink.getAttribute('aria-disabled') === 'true') {
            event.preventDefault();
            if (!selectedWorkshopId) {
                workshopInputs[0].focus();
            } else {
                languageInputs[0].focus();
                languageInputs[0].reportValidity();
            }
        }
    });

    const initialLanguage = WorkshopLanguageNavigation.resolveLanguage(
        window.location.search,
        getStoredLanguageId(),
        WorkshopLanguages.getLanguage
    );
    if (initialLanguage) {
        const matchingLanguage = languageInputs.find(input => input.value === initialLanguage.id);
        matchingLanguage.checked = true;
        storeLanguageId(initialLanguage.id);
    }

    const requestedWorkshop = new URLSearchParams(window.location.search).get('workshop');
    const matchingWorkshop = workshopInputs.find(input => input.value === requestedWorkshop);
    if (matchingWorkshop) {
        matchingWorkshop.checked = true;
        selectWorkshop(matchingWorkshop.value);
    } else {
        updateSelection(initialLanguage?.id ?? null);
    }
}());
