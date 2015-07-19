var SCRIPTS = [
    'lib/jquery-1.10.2.min.js',
    'lib/jquery-ui.min.js',
    'lib/gmail.js',
    'lib/kbpgp-2.0.8-min.js',
    'main.js'
];

var STYLES = [
    'lib/jquery-ui.min.css',
    'lib/jquery-ui.structure.min.css',
    'lib/jquery-ui.theme.min.css'
];

function injectScript(filename, type) {
    var s = document.createElement(type);
    s.src = chrome.extension.getURL(filename);
    s.onload = function() {
        s.parentNode.removeChild(s);
    };
    (document.head || document.documentElement).appendChild(s);
}

// Inject javascript
for (var i = 0, len = SCRIPTS.length; i < len; i++) {
    function(SCRIPTS[i], "script");
}

// inject CSS
for (var i = 0, len = STYLES.length; i < len; i++) {
    function(STYLES[i], "style");
}
