document.addEventListener('DOMContentLoaded', function() {
  // Load saved settings
  chrome.storage.sync.get(['apiKey', 'prompt', 'model'], function(data) {
    document.getElementById('apiKey').value = data.apiKey || '';
    document.getElementById('prompt').value = data.prompt || 'Analyze the following text and provide key insights:\n\n"{selectedText}"';
    document.getElementById('model').value = data.model || 'gpt-3.5-turbo';
  });

  // Save settings
  document.getElementById('saveBtn').addEventListener('click', function() {
    const apiKey = document.getElementById('apiKey').value;
    const prompt = document.getElementById('prompt').value;
    const model = document.getElementById('model').value;
    
    chrome.storage.sync.set({ apiKey, prompt, model }, function() {
      const status = document.getElementById('status');
      status.textContent = 'Settings saved!';
      setTimeout(() => status.textContent = '', 2000);
    });
  });
});