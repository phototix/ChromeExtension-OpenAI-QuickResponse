// Create tooltip element
const tooltip = document.createElement('div');
tooltip.id = 'openai-tooltip';
document.body.appendChild(tooltip);

// Add styles to tooltip
Object.assign(tooltip.style, {
  position: 'absolute',
  display: 'none',
  backgroundColor: '#ffffff',
  border: '1px solid #ddd',
  borderRadius: '4px',
  padding: '10px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  zIndex: '9999',
  maxWidth: '400px',
  fontSize: '14px',
  color: '#333'
});

// Close button for tooltip
const closeBtn = document.createElement('button');
closeBtn.textContent = '×';
Object.assign(closeBtn.style, {
  position: 'absolute',
  right: '5px',
  top: '5px',
  background: 'none',
  border: 'none',
  fontSize: '16px',
  cursor: 'pointer'
});
closeBtn.addEventListener('click', () => {
  tooltip.style.display = 'none';
});
tooltip.appendChild(closeBtn);

// Content area
const content = document.createElement('div');
content.style.marginTop = '15px';
tooltip.appendChild(content);

// Function to show output in console as fallback
function showInConsole(response) {
  console.groupCollapsed('OpenAI Highlight Extension Response');
  console.log('Selected Text:', window.getSelection().toString().trim());
  console.log('Response:', response);
  console.groupEnd();
}

// Show loading state
function showLoading() {
  content.innerHTML = '<div style="text-align: center;">Loading...</div>';
}

// Show error
function showError(message) {
  content.innerHTML = `<div style="color: red;">Error: ${message}</div>`;
  console.error('OpenAI Highlight Extension Error:', message);
}

// Position tooltip near cursor
function positionTooltip(event) {
  try {
    tooltip.style.left = `${event.clientX + 15}px`;
    tooltip.style.top = `${event.clientY + 15}px`;
    tooltip.style.display = 'block';
    return true;
  } catch (e) {
    console.warn('Could not position tooltip:', e);
    return false;
  }
}

// Get selected text and send to OpenAI
async function handleSelection(event) {
  const selectedText = window.getSelection().toString().trim();
  if (!selectedText) return;

  // Get settings from storage
  const { apiKey, prompt, model } = await new Promise(resolve => {
    chrome.storage.sync.get(['apiKey', 'prompt', 'model'], resolve);
  });

  if (!apiKey) {
    alert('Please set your OpenAI API key in the extension settings');
    return;
  }

  // Try to show tooltip, fallback to console if fails
  const tooltipShown = positionTooltip(event);
  if (tooltipShown) {
    showLoading();
  } else {
    console.log('OpenAI Highlight Extension processing selected text...');
  }

  try {
    // Replace placeholder in prompt
    const finalPrompt = prompt.replace('{selectedText}', selectedText);

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: finalPrompt }],
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    if (data.error) {
      const errorMsg = data.error.message;
      if (tooltipShown) {
        showError(errorMsg);
      } else {
        showInConsole(`Error: ${errorMsg}`);
      }
    } else if (data.choices && data.choices[0]) {
      const responseText = data.choices[0].message.content;
      if (tooltipShown) {
        content.innerHTML = responseText;
      } else {
        showInConsole(responseText);
      }
    } else {
      const errorMsg = 'No response from OpenAI';
      if (tooltipShown) {
        showError(errorMsg);
      } else {
        showInConsole(errorMsg);
      }
    }
  } catch (error) {
    const errorMsg = error.message;
    if (tooltipShown) {
      showError(errorMsg);
    } else {
      showInConsole(`Error: ${errorMsg}`);
    }
  }
}

// Listen for mouseup events (text selection)
document.addEventListener('mouseup', function(event) {
  // Only trigger if there's a selection
  if (window.getSelection().toString().trim()) {
    handleSelection(event);
  }
});

// Close tooltip when clicking outside
document.addEventListener('mousedown', function(event) {
  if (tooltip.style.display !== 'none' && !tooltip.contains(event.target) && event.target !== tooltip) {
    tooltip.style.display = 'none';
  }
});