const getKey = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["openai-key"], (result) => {
      if (result["openai-key"]) {
        const decodedKey = atob(result["openai-key"]);
        resolve(decodedKey);
      }
    });
  });
};

const generate = async (prompt) => {
  const key = await getKey();
  const url = `https://api.openai.com/v1/completions`;

  const completionResponse = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: `text-davinci-003`,
      prompt: prompt,
      max_tokens: 1250,
      temperature: 0.7,
    }),
  });

  const completion = await completionResponse.json();
  return completion.choices.pop();
};

const generateCompletionAction = async (info) => {
  try {
    sendMessage("generating...");
    const { selectionText } = info;
    const basePromptPrefix = `Write me a detailed table of contents for a blog post with the title below:
        
        Title:
        `;

    const baseCompletion = await generate(basePromptPrefix + selectionText);

    console.log(baseCompletion.text)

    const secondPrompt = `
        Take the table of contents and title of the blog post below and generate a blog post written in thwe style of Paul Graham. Make it feel like a story. Don't just list the points. Go deep into each one. Explain why. Add emojis where appropriate.
        
        Title: ${selectionText}
        
        Table of Contents: ${baseCompletion.text}
        
        Blog Post:
        `;

    const secondPromptCompletion = await generate(secondPrompt);

    sendMessage(secondPromptCompletion.text);
    console.log(secondPromptCompletion.text);
  } catch (error) {
    sendMessage(error.toString());
    console.log(error);
  }
};

const sendMessage = (content) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0].id;
  
      chrome.tabs.sendMessage(
        activeTab,
        { message: 'inject', content },
        (response) => {
          if (response.status === 'failed') {
            console.log('injection failed.');
          }
        }
      );
    });
  };

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "context-run",
    title: "Generate blog post",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener(generateCompletionAction);