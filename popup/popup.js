document.addEventListener('DOMContentLoaded', function () {
    const historyList = document.getElementById('history-list');
    const timeRangeSelect = document.getElementById('time-range');
    const respLanguageSelect = document.getElementById('resp-language-select');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const searchButton = document.getElementById('search-button');
    const resultsPerPageSelect = document.getElementById('results-per-page');
    const exportButton = document.getElementById('export-button');
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    const analyzeButton = document.getElementById('analyze-button');
    const apiKeyInput = document.getElementById('api-key');
    const apiAddressInput = document.getElementById('api-address');

    document.getElementById('goto-md-editor').addEventListener('click', function () {
        window.open('https://azou.tech/markdown-editor/', '_blank');
    });

    let currentPage = 0;
    let resultsPerPage = parseInt(resultsPerPageSelect.value);
    let currentResults = [];
    // default time range last 5 minutes
    let startTime = Date.now() - (5 * 60 * 1000);
    let endTime = Date.now();

    function fetchHistory() {
        chrome.history.search({
            text: '',
            startTime: startTime,
            endTime: endTime,
            maxResults: 10000
        }, function (data) {
            currentResults = data;
            currentPage = 0;
            displayResults();
        });
    }

    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    function displayResults() {
        historyList.innerHTML = '';
        const start = currentPage * resultsPerPage;
        const end = start + resultsPerPage;
        const pageResults = currentResults.slice(start, end);

        pageResults.forEach((page, index) => {
            const li = document.createElement('li');
            const link = document.createElement('a');
            link.href = page.url;
            link.textContent = `${start + index + 1}. ${page.title || page.url}`;
            link.target = '_blank';

            const visitTime = formatDate(new Date(page.lastVisitTime));
            const info = document.createElement('span');
            info.className = 'info';
            info.textContent = ` (Visited on: ${visitTime})`;

            li.appendChild(link);
            li.appendChild(info);
            historyList.appendChild(li);
        });

        pageInfo.textContent = `Page ${currentPage + 1} of ${Math.ceil(currentResults.length / resultsPerPage)} - Showing ${resultsPerPage} of ${currentResults.length} results`;

        prevPageButton.disabled = currentPage === 0;
        nextPageButton.disabled = end >= currentResults.length;
    }

    function exportAllResults() {
        try {
            const formattedResults = currentResults.map(page => ({
                time: formatDate(new Date(page.lastVisitTime)),
                title: page.title || 'Untitled',
                url: page.url,
                visitCount: page.visitCount || 0
            }));
            const jsonString = JSON.stringify(formattedResults, null, 2);

            navigator.clipboard.writeText(jsonString).then(() => {
                window.alert('All results copied to clipboard!');
            }).catch(err => {
                console.error('Error copying to clipboard:', err);
            });
        } catch (error) {
            console.error('Error in exportAllResults:', error);
        }
    }

    timeRangeSelect.addEventListener('change', function () {
        const value = timeRangeSelect.value;
        if (value.endsWith('m')) { // Handle minute-based options
            const minutesAgo = parseInt(value);
            startTime = endTime - (minutesAgo * 60 * 1000);
        } else if (value.endsWith('h')) { // Handle hour-based options
            const hoursAgo = parseInt(value);
            startTime = endTime - (hoursAgo * 60 * 60 * 1000);
        } else if (value.endsWith('d')) { // Handle day-based options
            const daysAgo = parseInt(value);
            startTime = endTime - (daysAgo * 24 * 60 * 60 * 1000);
        }
        endTime = Date.now();
        fetchHistory();
    });


    searchButton.addEventListener('click', function () {
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            startTime = startDate.getTime();
            endTime = endDate.getTime();
            fetchHistory();
        } else {
            alert('Please enter valid dates.');
        }
    });

    resultsPerPageSelect.addEventListener('change', function () {
        resultsPerPage = parseInt(resultsPerPageSelect.value);
        currentPage = 0;
        displayResults();
    });

    prevPageButton.addEventListener('click', function () {
        if (currentPage > 0) {
            currentPage--;
            displayResults();
        }
    });

    nextPageButton.addEventListener('click', function () {
        if ((currentPage + 1) * resultsPerPage < currentResults.length) {
            currentPage++;
            displayResults();
        }
    });

    exportButton.addEventListener('click', function () {
        exportAllResults();
    });

    const overlay = document.getElementById('overlay');
    analyzeButton.addEventListener('click', function () {
        overlay.style.display = 'flex'; // Show overlay

        const apiAddress = apiAddressInput.value;
        const apiKey = apiKeyInput.value;
        const respLanguage = respLanguageSelect.value;

        if (!apiKey) {
            alert('Please enter your API key.');
            overlay.style.display = 'none'; // Hide overlay
            return;
        }

        const formattedResults = currentResults.map(page => ({
            time: formatDate(new Date(page.lastVisitTime)),
            title: page.title || 'Untitled',
            url: page.url,
        }));

        const jsonString = JSON.stringify(formattedResults, null, 2);
        let systemMessageContent;

        // Define system message content based on language
        const chinesePrompt = `# Role: 用户行为分析专家...`;
        const englishPrompt = `# Role: User Behavior Analysis Expert...`;

        systemMessageContent = (respLanguage === 'en') ? englishPrompt : chinesePrompt;

        const data = {
            model: "gpt-4o",
            messages: [
                {role: "system", content: systemMessageContent},
                {role: "user", content: "用户的浏览器历史记录数据已准备好，如下:\n" + jsonString}
            ]
        };

        let url = apiAddress || 'https://api.openai.com/v1/chat/completions';

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(data => {
                overlay.style.display = 'none'; // Hide overlay
                // alert('SUCCESS');
                // alert(data.choices[0].message.content);
                // navigator.clipboard.writeText(data.choices[0].message.content).then(() => {
                //     // alert('Analysis result copied to clipboard!, you can preview the result in a markdown editor.');
                // }).catch(err => {
                //     console.error('Error copying to clipboard:', err);
                // });
                let hash = btoa(RawDeflate.deflate(unescape(encodeURIComponent(data.choices[0].message.content))));
                window.open(`https://md.azou.tech/#${hash}`, '_blank');
            })
            .catch((error) => {
                overlay.style.display = 'none'; // Hide overlay
                console.error('Error:', error);
                alert('An error occurred while calling the API.');
            });
    });

    // Fetch initial history for the default time range
    timeRangeSelect.dispatchEvent(new Event('change'));
});
