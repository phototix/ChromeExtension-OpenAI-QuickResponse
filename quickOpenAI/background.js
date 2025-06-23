// Create context menu when extension is installed/updated
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "openaiAnalyze",
      title: "Analyze with OpenAI",
      contexts: ["selection"]
    });
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "openaiAnalyze" && info.selectionText) {
    try {
      const { apiKey, prompt, model } = await chrome.storage.sync.get([
        'apiKey',
        'prompt',
        'model'
      ]);

      if (!apiKey) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'OpenAI Error',
          message: 'Please set your API key in extension settings'
        });
        return;
      }

      // Show loading state
      await chrome.action.setBadgeText({ text: '...', tabId: tab.id });
      await chrome.action.setBadgeBackgroundColor({ color: '#4CAF50', tabId: tab.id });

      const finalPrompt = prompt.replace('{selectedText}', info.selectionText);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || 'gpt-3.5-turbo',
          messages: [{ role: "user", content: finalPrompt }],
          temperature: 0.7
        })
      });

      const data = await response.json();
      
      if (data.error) throw new Error(data.error.message);
      if (!data.choices?.[0]?.message?.content) throw new Error('No response from OpenAI');

      // Send the response to the content script to show your dialog
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: showResponse,
        args: [data.choices[0].message.content]
      });

    } catch (error) {
      console.error('OpenAI Error:', error);
      // Send error to content script to show in dialog
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: showResponse,
        args: [`Error: ${error.message}`]
      });
    } finally {
      await chrome.action.setBadgeText({ text: '', tabId: tab.id });
    }
  }
});

// This function will be serialized and sent to the content script
function showResponse(content) {
  // Your existing dialog implementation
  let currentDialog = null;
  
  // Close existing dialog if any
  if (currentDialog) currentDialog.remove();
  
  // Create new dialog
  currentDialog = document.createElement('div');
  currentDialog.style = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(80vw, 600px);
    max-height: 70vh;
    background: white;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    z-index: 2147483647;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `;
  
  currentDialog.innerHTML = `
    <div style="padding: 16px; border-bottom: 1px solid #eee; 
                display: flex; justify-content: space-between;
                align-items: center; background: #f9f9f9;">
      <h3 style="margin: 0;">AI Analysis</h3>
      <button id="close-dialog" style="background: none; border: none; 
             cursor: pointer; font-size: 20px;">×</button>
    </div>
    <div style="padding: 16px; overflow-y: auto; flex-grow: 1;">
      ${content}
    </div>
    <div style="padding: 8px 16px; border-top: 1px solid #eee; 
                text-align: right; background: #f9f9f9;">
      <button id="copy-btn" style="padding: 4px 8px; margin-right: 8px;">Copy</button>
      <button id="close-btn" style="padding: 4px 8px;">Close</button>
    </div>
  `;
  
  // Add functionality
  currentDialog.querySelector('#close-dialog').onclick = () => currentDialog.remove();
  currentDialog.querySelector('#close-btn').onclick = () => currentDialog.remove();
  currentDialog.querySelector('#copy-btn').onclick = () => {
    navigator.clipboard.writeText(content);
  };
  
  // Add to page
  document.body.appendChild(currentDialog);
  
  // Add overlay
  const overlay = document.createElement('div');
  overlay.style = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 2147483646;
  `;
  overlay.onclick = () => {
    currentDialog.remove();
    overlay.remove();
  };
  document.body.appendChild(overlay);
}
