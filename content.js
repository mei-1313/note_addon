(function() {
    'use strict';

    const BUTTON_ID = 'note-stats-csv-download-button';
    const SHOW_MORE_TEXT = 'もっとみる';
    const MAX_LOAD_ATTEMPTS = 100; // 安全のための上限回数
    const INITIAL_URL = window.location.href;

    function findStatsTable() {
        return document.querySelector('table[aria-label="記事一覧"]') ||
               document.querySelector('.o-statsContent__table') ||
               document.querySelector('table');
    }

    function injectButton() {
        if (document.getElementById(BUTTON_ID)) return;

        const table = findStatsTable();
        if (!table) return;

        const button = document.createElement('button');
        button.id = BUTTON_ID;
        button.innerText = 'CSV形式でダウンロード（全件表示）';
        button.style.marginBottom = '12px';
        button.style.padding = '10px 18px';
        button.style.backgroundColor = '#2cb696';
        button.style.color = '#fff';
        button.style.border = 'none';
        button.style.borderRadius = '6px';
        button.style.cursor = 'pointer';
        button.style.fontWeight = 'bold';
        button.style.fontSize = '14px';
        button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        button.style.transition = 'background-color 0.2s ease';
        button.style.zIndex = '9999';

        button.addEventListener('mouseenter', () => {
            if (!button.disabled) button.style.backgroundColor = '#259b80';
        });
        button.addEventListener('mouseleave', () => {
            if (!button.disabled) button.style.backgroundColor = '#2cb696';
        });

        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await handleDownloadClick(button);
        });

        // 横スクロール用コンテナ（overflow-x-auto）があればその外側（上部）に配置
        const targetContainer = table.closest('.overflow-x-auto') || table;
        targetContainer.parentNode.insertBefore(button, targetContainer);
    }

    async function handleDownloadClick(button) {
        button.disabled = true;
        button.style.backgroundColor = '#ccc';
        button.style.cursor = 'not-allowed';
        const originalText = button.innerText;
        button.innerText = 'データ展開中...';

        try {
            await loadAllData();
            // データロード後にURLが変わっていないか最終確認
            if (window.location.href === INITIAL_URL) {
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
            console.error('Download failed:', error);
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

    async function loadAllData() {
        let attempts = 0;
        while (attempts < MAX_LOAD_ATTEMPTS) {
            // URLが変わっていたら即座に中断（安全装置）
            if (window.location.href !== INITIAL_URL) {
                console.warn('URL changed, stopping data load.');
                return;
            }

            const showMoreButton = findShowMoreButton();
            if (!showMoreButton) {
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
        // ヘッダー行の解析
        const ths = Array.from(table.querySelectorAll('thead th'));
        let headers = [];
        if (ths.length > 0) {
            const headerNames = ths.map(th => th.innerText.trim().replace(/\n/g, ' '));
            if (headerNames[0] && headerNames[0].includes('タイトル')) {
                // タイトル列を「タイトル, URL, ステータス, 公開日」に分割・展開
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

                // 公開日の抽出 (YYYY年MM月DD日 または YYYY-MM-DD または YYYY/MM/DD)
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
                // フォールバック: linkがない場合はそのままテキスト
                rowValues = [firstCell.innerText.trim().replace(/\n/g, ' ')];
            }

            // 残りの列（インプレッション, ページビュー, スキ, コメント, 売上等）
            for (let i = 1; i < cells.length; i++) {
                rowValues.push(cells[i].innerText.trim().replace(/\n/g, ' '));
            }

            csvRows.push(rowValues);
        });

        // CSV文字列の生成（ダブルクォートエスケープ）
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
