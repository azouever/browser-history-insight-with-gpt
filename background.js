
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension Installed");
});

chrome.action.onClicked.addListener(() => {
  const oneDayAgo = (new Date()).getTime() - (24 * 60 * 60 * 1000);
  
  chrome.history.search({
    text: '',
    startTime: oneDayAgo,
    maxResults: 100
  }, function(data) {
    data.forEach(page => {
      console.log(page);
    });
  });
});
