// Clicking the toolbar icon opens the side panel (no popup). The panel persists
// while GitHub auth opens in a tab beside it, so the device-flow poll survives.
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
