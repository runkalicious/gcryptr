
var j = document.createElement('script');
j.src = chrome.extension.getURL('lib/jquery-1.10.2.min.js');
(document.head || document.documentElement).appendChild(j);

var g = document.createElement('script');
g.src = chrome.extension.getURL('lib/gmail.js');
(document.head || document.documentElement).appendChild(g);

var f = document.createElement('script');
f.src = chrome.extension.getURL('lib/kbpgp-2.0.8-min.js');
(document.head || document.documentElement).appendChild(f);

var s = document.createElement('script');
s.src = chrome.extension.getURL('main.js');
(document.head || document.documentElement).appendChild(s);
