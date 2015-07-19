var SCRIPTS = [
    'lib/jquery-1.10.2.min.js',
    'lib/jquery-ui.min.js',
    'lib/gmail.js',
    'lib/kbpgp-2.0.9-min.js',
    'main.js'
];

function injectScript(filename) {
    var s = document.createElement("script");
    s.src = chrome.extension.getURL(filename);
    s.onload = function() {
        s.parentNode.removeChild(s);
    };
    (document.head || document.documentElement).appendChild(s);
}

// Inject javascript
for (var i = 0, len = SCRIPTS.length; i < len; i++) {
    injectScript(SCRIPTS[i]);
}
