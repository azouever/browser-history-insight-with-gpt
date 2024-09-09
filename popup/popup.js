document.addEventListener('DOMContentLoaded', function() {
  const historyList = document.getElementById('history-list');
  const oneDayAgo = (new Date()).getTime() - (24 * 60 * 60 * 1000);
  
  chrome.history.search({
    text: '',
    startTime: oneDayAgo,
    maxResults: 10
  }, function(data) {
    data.forEach(page => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = page.url;
      link.textContent = page.title || page.url;
      link.target = '_blank';
      li.appendChild(link);
      historyList.appendChild(li);
    });
  });
});

