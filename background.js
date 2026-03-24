/**
 * background.js - Service worker
 */

import * as api from './api.js';

chrome.runtime.onInstalled.addListener(() => {
    console.log('GitHub Achievement Automator installed.');
});

// Listener for messages from popup if complex async workflows are needed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'validateToken') {
        api.getUser().then(user => sendResponse({ success: true, user }))
                     .catch(err => sendResponse({ success: false, error: err.message }));
        return true; // async
    }
});
