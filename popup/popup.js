document.addEventListener('DOMContentLoaded', function() {
      const historyList = document.getElementById('history-list');
      const timeRangeSelect = document.getElementById('time-range');
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

      let currentPage = 0;
      let resultsPerPage = parseInt(resultsPerPageSelect.value);
      let currentResults = [];
      let startTime = null;
      let endTime = null;

      function fetchHistory() {
        chrome.history.search({
          text: '',
          startTime: startTime,
          endTime: endTime,
          maxResults: 1000
        }, function(data) {
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

      timeRangeSelect.addEventListener('change', function() {
        const value = timeRangeSelect.value;
        if (value.endsWith('h')) {
          const hoursAgo = parseInt(value);
          startTime = Date.now() - (hoursAgo * 60 * 60 * 1000);
        } else if (value.endsWith('d')) {
          const daysAgo = parseInt(value);
          startTime = Date.now() - (daysAgo * 24 * 60 * 60 * 1000);
        }
        endTime = Date.now();
        fetchHistory();
      });

      searchButton.addEventListener('click', function() {
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

      resultsPerPageSelect.addEventListener('change', function() {
        resultsPerPage = parseInt(resultsPerPageSelect.value);
        currentPage = 0;
        displayResults();
      });

      prevPageButton.addEventListener('click', function() {
        if (currentPage > 0) {
          currentPage--;
          displayResults();
        }
      });

      nextPageButton.addEventListener('click', function() {
        if ((currentPage + 1) * resultsPerPage < currentResults.length) {
          currentPage++;
          displayResults();
        }
      });

      exportButton.addEventListener('click', function() {
        exportAllResults();
      });

      analyzeButton.addEventListener('click', function() {
        window.alert('Waiting for the analysis to complete, this may take a few seconds...');
        const apiKey = apiKeyInput.value;
        if (!apiKey) {
          alert('Please enter your OpenAI API key.');
          return;
        }
          const formattedResults = currentResults.map(page => ({
            time: formatDate(new Date(page.lastVisitTime)),
            title: page.title || 'Untitled',
            url: page.url,
            visitCount: page.visitCount || 0
          }));
          const jsonString = JSON.stringify(formattedResults, null, 2);

        const data = {
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `# Role: 用户行为分析专家

## Profile:
- Author: pp
- Version: 1.4
- Language: 中文
- Description: 作为用户行为分析专家，我擅长通过分析浏览器历史记录，帮助用户了解其在特定时间段内的在线行为模式和习惯。

### Skill:
1. 精通数据分析技术，能够从浏览器历史记录中提取关键信息。
2. 擅长使用时间线进行数据可视化。
3. 能够识别用户在特定网站花费的时间并进行深入分析。
4. 善于总结和提炼用户的在线行为模式。
5. 具备将复杂数据转化为用户友好报告的能力。

## Goals:
1. 提取用户浏览器历史记录中的关键数据。
2. 按时间线对用户的在线行为进行详细分析。
3. 识别用户在哪些网站花费时间最长。
4. 为用户提供清晰的行为总结报告。
5. 帮助用户了解其在线行为的规律和趋势。

## Constrains:
1. 确保用户数据的隐私和安全。
2. 在分析中保持数据的准确性和完整性。
3. 时间线分析需根据数据量灵活调整。
4. 确保报告内容易于理解。
5. 提供的总结应有助于用户行为的改善。

## OutputFormat:
1. 输出包含时间线分析的详细报告。
2. 提供用户在各网站花费时间的统计数据。
3. 输出用户行为的总结和建议。
4. 确保报告图表清晰可读。
5. 报告应包括对用户行为的关键见解。

## Workflow:
1. 首先，收集并整理用户的浏览器历史记录数据。
2. 然后，根据数据量确定分析的时间单位（小时或天）。
3. 接着，进行时间线分析，识别用户在哪些网站花费时间最长。
4. 之后，提炼并总结用户的在线行为模式。
5. 最后，生成一份详细的报告，帮助用户了解其在线行为。
`
            },
            {
              role: "user",
              content: "用户的浏览器历史记录数据已准备好，如下:\n" + jsonString
            }
          ]
        };

        fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
          // must use utf-8 encoding
          window.alert('SUCCESS');
          // window.alert(data);
          window.alert(data.choices[0].message.content);
          // copy to clipboard with utf-8 encoding
          navigator.clipboard.writeText(data.choices[0].message.content).then(() => {
            window.alert('Analysis result copied to clipboard!, you can preview the result in a markdown editor.');
          }).catch(err => {
            console.error('Error copying to clipboard:', err);
          });

          // Handle the data received from the API
        })
        .catch((error) => {
          console.error('Error:', error);
          window.alert('An error occurred while calling the API.');
        });
      });

      // Fetch initial history for the default time range
      timeRangeSelect.dispatchEvent(new Event('change'));
    });
