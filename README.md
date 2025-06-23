# OpenAI Context Assistant (Chrome Extension) v0.1

![Extension Icon](icons/icon48.png)

A Chrome extension that lets you analyze selected text with OpenAI's API via right-click context menu.

## Features

- Right-click any selected text to analyze with OpenAI
- Configurable prompt templates
- Supports GPT-3.5 and GPT-4 models
- Clean popup window for responses
- Secure API key storage

## Installation

### From Chrome Web Store
*(Coming soon)*

### Manual Installation
1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the extension folder

## Usage

1. Select text on any webpage
2. Right-click and choose "Analyze with OpenAI"
3. View results in a popup window

## Configuration

Click the extension icon to configure:
- OpenAI API key (required)
- Custom prompt template (default: `Analyze the following text and provide key insights:\n\n"{selectedText}"`)
- Model selection (GPT-3.5 Turbo or GPT-4)


## Requirements

- Chrome browser (version 88 or newer)
- OpenAI API key (get yours at [platform.openai.com](https://platform.openai.com/))

## Known Issues

- No rate limiting implemented
- Large responses may overflow popup window
- No history of previous queries

## Roadmap

- v0.2: Add response formatting options
- v0.3: Implement query history
- v0.4: Add rate limiting and usage tracking

## Contributing

Pull requests are welcome! For major changes, please open an issue first.

