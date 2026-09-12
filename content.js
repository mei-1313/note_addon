(function() {
    'use strict';

    const BUTTON_ID = 'note-stats-csv-download-button';
    const CONTAINER_ID = 'note-stats-csv-container';
    const SHOW_MORE_TEXT = 'もっとみる';
    const MAX_LOAD_ATTEMPTS = 100;

    console.log('[note Stats CSV] 拡張機能が読み込まれました。URL:', window.location.href);

    function isStatsPage() {
        const href = window.location.href;
        return href.includes('/stats') ||
               href.includes('/sitesettings') ||
               href.includes('/analytics') ||
               href.includes('/dashboard') ||
               !!findStatsTable();
    }

    function findStatsTable() {
        // 1. aria-label="記事一覧" を持つテーブル
        let table = document.querySelector('table[aria-label="記事一覧"]');
        if (table) return table;

        // 2. ページ内のすべてのテーブルから統計ヘッダーを持つテーブルを検出
        const tables = Array.from(document.querySelectorAll('table'));
        for (const t of tables) {
            const text = t.textContent || '';
            if (text.includes('タイトル') && (text.includes('ページビュー') || text.includes('インプレッション') || text.includes('スキ'))) {
                return t;
            }
            if (t.classList.contains('o-statsContent__table')) {
                return t;
            }
        }

        return null;
    }

    function injectButton() {
        const table = findStatsTable();
        const existingContainer = document.getElementById(CONTAINER_ID);

        if (!table) {
            // テーブルがない画面ではボタンを削除
            if (existingContainer) {
                existingContainer.remove();
            }
            return;
        }

        const targetWrapper = table.closest('.overflow-x-auto') || table;
        if (!targetWrapper || !targetWrapper.parentNode) return;

        // 既にテーブルの直前にコンテナが存在している場合は何もしない
        if (existingContainer && targetWrapper.previousElementSibling === existingContainer) {
            return;
        }

        // 古いコンテナがあれば除去して再配置
        if (existingContainer) {
            existingContainer.remove();
        }

        console.log('[note Stats CSV] 統計テーブルを検出しました。ボタンを生成します。', table);

        const container = document.createElement('div');
        container.id = CONTAINER_ID;
        container.style.display = 'block';
        container.style.width = '100%';
        container.style.margin = '16px 0';
        container.style.clear = 'both';

        const button = document.createElement('button');
        button.id = BUTTON_ID;
        button.type = 'button';
        button.innerText = 'CSV形式でダウンロード（全件表示）';
        button.style.display = 'inline-flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.padding = '10px 20px';
        button.style.backgroundColor = '#2cb696';
        button.style.color = '#ffffff';
        button.style.border = 'none';
        button.style.borderRadius = '6px';
        button.style.cursor = 'pointer';
        button.style.fontWeight = 'bold';
        button.style.fontSize = '14px';
        button.style.lineHeight = '1.5';
        button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        button.style.transition = 'all 0.2s ease';
        button.style.zIndex = '9999';

        button.addEventListener('mouseenter', () => {
            if (!button.disabled) button.style.backgroundColor = '#23957a';
        });
        button.addEventListener('mouseleave', () => {
            if (!button.disabled) button.style.backgroundColor = '#2cb696';
        });

        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await handleDownloadClick(button);
        });

        container.appendChild(button);
        targetWrapper.parentNode.insertBefore(container, targetWrapper);
        console.log('[note Stats CSV] ボタンを挿入しました。', container);
    }

    async function handleDownloadClick(button) {
        button.disabled = true;
        button.style.backgroundColor = '#ccc';
        button.style.cursor = 'not-allowed';
        const originalText = button.innerText;
        button.innerText = 'データ展開中...';

        const startUrl = window.location.href;

        try {
            await loadAllData(startUrl);
            if (window.location.href === startUrl) {
                const table = findStatsTable();
                if (table) {
                    downloadCSV(table);
                } else {
                    alert('統計テーブルが見つかりませんでした。');
                }
            } else {
                alert('ページが移動したため、ダウンロードを中止しました。');
            }
        } catch (error) {
            console.error('[note Stats CSV] Download failed:', error);
            alert('データの読み込み中にエラーが発生しました。');
        } finally {
            button.disabled = false;
            button.style.backgroundColor = '#2cb696';
            button.style.cursor = 'pointer';
            button.innerText = originalText;
        }
    }

    function findShowMoreButton() {
        // 1. 旧コンテナ内
        const oldContainer = document.querySelector('.o-statsContent__main');
        if (oldContainer) {
            const oldButtons = Array.from(oldContainer.querySelectorAll('button.a-button, button'));
            const oldFound = oldButtons.find(btn => btn.textContent.includes(SHOW_MORE_TEXT) && isElementVisible(btn));
            if (oldFound) return oldFound;
        }

        // 2. ページ内のすべてのbuttonから「もっとみる」を検索
        const allButtons = Array.from(document.querySelectorAll('button'));
        return allButtons.find(btn => {
            const text = btn.textContent || '';
            return text.includes(SHOW_MORE_TEXT) && isElementVisible(btn);
        });
    }

    async function loadAllData(startUrl) {
        let attempts = 0;
        while (attempts < MAX_LOAD_ATTEMPTS) {
            if (window.location.href !== startUrl) {
                console.warn('[note Stats CSV] URL changed, stopping data load.');
                return;
            }

            const showMoreButton = findShowMoreButton();
            if (!showMoreButton) {
                console.log('[note Stats CSV] 「もっとみる」ボタンが見つかりません。全件展開完了とみなします。');
                break;
            }

            console.log(`[note Stats CSV] 「もっとみる」をクリックします (${attempts + 1}/${MAX_LOAD_ATTEMPTS})`);
            showMoreButton.click();
            attempts++;
            
            await new Promise(resolve => setTimeout(resolve, 1200));
        }
        
        if (attempts >= MAX_LOAD_ATTEMPTS) {
            console.warn('[note Stats CSV] Reached maximum load attempts.');
        }
    }

    function isElementVisible(el) {
        return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    }

    function downloadCSV(table) {
        // ヘッダー行の解析
        const ths = Array.from(table.querySelectorAll('thead th'));
        let headers = [];
        if (ths.length > 0) {
            const headerNames = ths.map(th => th.innerText.trim().replace(/\n/g, ' '));
            if (headerNames[0] && headerNames[0].includes('タイトル')) {
                headers = ['タイトル', 'URL', 'ステータス', '公開日', ...headerNames.slice(1)];
            } else {
                headers = headerNames;
            }
        } else {
            headers = ['タイトル', 'URL', 'ステータス', '公開日', 'インプレッション', 'ページビュー', 'スキ', 'コメント', '売上'];
        }

        // データ行の解析
        const bodyRows = Array.from(table.querySelectorAll('tbody tr'));
        const dataRows = (bodyRows.length > 0 ? bodyRows : Array.from(table.querySelectorAll('tr')).slice(1));

        const csvRows = [headers];

        dataRows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td'));
            if (cells.length === 0) return;

            const firstCell = cells[0];
            const link = firstCell.querySelector('a');

            let rowValues = [];
            if (link) {
                const title = link.textContent.trim();
                const url = link.href || link.getAttribute('href') || '';
                const fullText = firstCell.innerText.trim();

                // 公開日の抽出
                const dateMatch = fullText.match(/(\d{4}年\d{1,2}月\d{1,2}日|\d{4}[-/]\d{1,2}[-/]\d{1,2})/);
                const publishDate = dateMatch ? dateMatch[1] : '';

                // ステータスの抽出
                let status = '';
                const infoContainer = firstCell.querySelector('div > span.flex') || firstCell.querySelector('span.flex');
                if (infoContainer && infoContainer.children.length >= 1) {
                    status = infoContainer.children[0].innerText.trim();
                }
                if (!status) {
                    const knownStatuses = ['公開中', '下書き', '予約投稿', '非公開', '限定公開'];
                    for (const kw of knownStatuses) {
                        if (fullText.includes(kw)) {
                            status = kw;
                            break;
                        }
                    }
                }

                rowValues = [title, url, status, publishDate];
            } else {
                rowValues = [firstCell.innerText.trim().replace(/\n/g, ' ')];
            }

            for (let i = 1; i < cells.length; i++) {
                rowValues.push(cells[i].innerText.trim().replace(/\n/g, ' '));
            }

            csvRows.push(rowValues);
        });

        // CSV文字列の生成
        const csvContent = csvRows.map(row => {
            return row.map(val => {
                const str = (val === null || val === undefined) ? '' : String(val);
                return '"' + str.replace(/"/g, '""') + '"';
            }).join(',');
        }).join('\r\n');

        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
        const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
        const downloadUrl = URL.createObjectURL(blob);
        const linkElem = document.createElement('a');
        
        const now = new Date();
        const timestamp = now.getFullYear() +
            ('0' + (now.getMonth() + 1)).slice(-2) +
            ('0' + now.getDate()).slice(-2) +
            ('0' + now.getHours()).slice(-2) +
            ('0' + now.getMinutes()).slice(-2);
        
        linkElem.setAttribute('href', downloadUrl);
        linkElem.setAttribute('download', `note_stats_${timestamp}.csv`);
        linkElem.style.visibility = 'hidden';
        document.body.appendChild(linkElem);
        linkElem.click();
        document.body.removeChild(linkElem);
        URL.revokeObjectURL(downloadUrl);
        console.log(`[note Stats CSV] CSVダウンロードが完了しました (${csvRows.length - 1}件)`);
    }

    // 1. MutationObserver による動的変更検知
    const observer = new MutationObserver(() => {
        injectButton();
    });

    observer.observe(document.documentElement || document.body, {
        childList: true,
        subtree: true
    });

    // 2. 即時実行
    injectButton();

    // 3. SPA遅延描画対策: 500msごとに数回確認
    let pollCount = 0;
    const pollInterval = setInterval(() => {
        pollCount++;
        injectButton();
        if (document.getElementById(BUTTON_ID) || pollCount >= 20) {
            clearInterval(pollInterval);
        }
    }, 500);

})();
