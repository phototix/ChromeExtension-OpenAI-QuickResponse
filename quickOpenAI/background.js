// Create context menu when extension is installed/updated
chrome.runtime.onInstalled.addListener(() => {
  // Remove any existing menu items to avoid duplicates
  chrome.contextMenus.removeAll(() => {
    // Create new context menu item
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
      // Get settings from storage
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

      // Prepare the prompt
      const finalPrompt = prompt.replace('{selectedText}', info.selectionText);

      // Call OpenAI API
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
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      if (data.choices?.[0]?.message?.content) {
        // Create a new popup window with the response
        await chrome.windows.create({
          url: `data:text/html,<html>
                <head>
                  <style>
                    body { 
                      padding: 20px; 
                      font-family: Arial; 
                      white-space: pre-wrap;
                      max-width: 600px;
                    }
                    .close-btn {
                      position: absolute;
                      top: 10px;
                      right: 10px;
                      cursor: pointer;
                    }
                  </style>
                </head>
                <body>
                  <div class="close-btn" onclick="window.close()">×</div>
                  ${data.choices[0].message.content}
                </body>
                </html>`,
          type: 'popup',
          width: 650,
          height: 500,
          left: 200,
          top: 200
        });
      } else {
        throw new Error('No response from OpenAI');
      }
    } catch (error) {
      console.error('OpenAI Error:', error);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'OpenAI Error',
        message: error.message || 'An unknown error occurred'
      });
    } finally {
      await chrome.action.setBadgeText({ text: '', tabId: tab.id });
    }
  }
});