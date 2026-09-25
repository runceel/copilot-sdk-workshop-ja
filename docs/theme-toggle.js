(function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    document.documentElement.dataset.theme =
        savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark';
})();

function toggleTheme() {
    const nextTheme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem('theme', nextTheme);
    updateToggleIcon();
}

function updateToggleIcon() {
    const isLight = document.documentElement.dataset.theme === 'light';
    document.querySelectorAll('.theme-toggle').forEach(button => {
        button.textContent = isLight ? '🌙 ダークモード' : '☀️ ライトモード';
        button.setAttribute('aria-label', `${isLight ? 'ダーク' : 'ライト'}モードに切り替える`);
    });
}

document.addEventListener('DOMContentLoaded', updateToggleIcon);
