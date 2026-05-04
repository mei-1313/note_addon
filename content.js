(function() {
    'use strict';

    const BUTTON_ID = 'note-stats-csv-download-button';
    const SHOW_MORE_TEXT = 'もっとみる';
    const MAX_LOAD_ATTEMPTS = 100; // 安全のための上限回数
    const INITIAL_URL = window.location.href;

    function injectButton() {
        if (document.getElementById(BUTTON_ID)) return;

        const table = document.querySelector('.o-statsContent__table');
        if (!table) return;

        const button = document.createElement('button');
        button.id = BUTTON_ID;
        button.innerText = 'CSV形式でダウンロード（全件表示）';
        button.style.marginBottom = '10px';
        button.style.padding = '8px 16px';
        button.style.backgroundColor = '#2cb696';
        button.style.color = '#fff';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.cursor = 'pointer';
        button.style.fontWeight = 'bold';
        button.style.zIndex = '9999';

        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await handleDownloadClick(button, table);
        });

        table.parentNode.insertBefore(button, table);
    }

    async function handleDownloadClick(button, table) {
        button.disabled = true;
        button.style.backgroundColor = '#ccc';
        const originalText = button.innerText;
        button.innerText = 'データ展開中...';

        try {
            await loadAllData();
            // データロード後にURLが変わっていないか最終確認
            if (window.location.href === INITIAL_URL) {
                downloadCSV(table);
            } else {
                alert('ページが移動したため、ダウンロードを中止しました。');
            }
        } catch (error) {
            console.error('Download failed:', error);
            alert('データの読み込み中にエラーが発生しました。');
        } finally {
            button.disabled = false;
            button.style.backgroundColor = '#2cb696';
            button.innerText = originalText;
        }
    }

    async function loadAllData() {
        let attempts = 0;
        while (attempts < MAX_LOAD_ATTEMPTS) {
            // URLが変わっていたら即座に中断（安全装置）
            if (window.location.href !== INITIAL_URL) {
                console.warn('URL changed, stopping data load.');
                return;
            }

            // 統計コンテンツのメインエリア内からのみ「もっとみる」ボタンを探す
            const container = document.querySelector('.o-statsContent__main');
            if (!container) break;

            const buttons = Array.from(container.querySelectorAll('button.a-button'));
            const showMoreButton = buttons.find(btn => btn.textContent.includes(SHOW_MORE_TEXT));

            if (!showMoreButton || !isElementVisible(showMoreButton)) {
                break;
            }

            showMoreButton.click();
            attempts++;
            
            // データの読み込みとDOMの更新を待つ
            await new Promise(resolve => setTimeout(resolve, 1200));
        }
        
        if (attempts >= MAX_LOAD_ATTEMPTS) {
            console.warn('Reached maximum load attempts.');
        }
    }

    function isElementVisible(el) {
        return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    }

    function downloadCSV(table) {
        const rows = Array.from(table.querySelectorAll('tr'));
        const csvContent = rows.map(row => {
            const cells = Array.from(row.querySelectorAll('th, td'));
            return cells.map(cell => {
                let text = cell.innerText.trim();
                // 改行をスペースに置換、ダブルクォートをエスケープ
                text = text.replace(/\n/g, ' ');
                text = '"' + text.replace(/"/g, '""') + '"';
                return text;
            }).join(',');
        }).join('\n');

        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
        const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        const now = new Date();
        const timestamp = now.getFullYear() +
            ('0' + (now.getMonth() + 1)).slice(-2) +
            ('0' + now.getDate()).slice(-2) +
            ('0' + now.getHours()).slice(-2) +
            ('0' + now.getMinutes()).slice(-2);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `note_stats_${timestamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Observer to detect table appearing (only on the stats page)
    const observer = new MutationObserver(() => {
        if (window.location.href.includes('/sitesettings/stats')) {
            injectButton();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Initial check
    if (window.location.href.includes('/sitesettings/stats')) {
        injectButton();
    }
})();
