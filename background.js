// Background script for Noice LLM Assistant
// Handles keyboard command and routes to content script

browser.commands.onCommand.addListener((command) => {
  if (command === "toggle-assistant") {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      if (tabs[0]) {
        browser.tabs.sendMessage(tabs[0].id, { action: "toggle" }).catch((err) => {
          console.log("Noice: Could not send message to tab", err);
        });
      }
    });
  }
});
