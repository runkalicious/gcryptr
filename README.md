Gcryptr: A Gmail Encryption Helper
==================================

Gcryptr is a Chrome plugin that let's you encrypt simple email messages. 

Note: this was created as an assignment for an NYU School of Engineering course, [CS-GY 6903](http://bulletin.engineering.nyu.edu/preview_course_nopop.php?catoid=2&coid=2437). This has *not been vetted* and *should only be treated as an educational tool*.

Getting Started
===============

To install the extension, clone the repo and:

1. Open Chrome and go to chrome://extensions
2. If the Developer Mode toggle is set to "-", click it to go into Developer Mode.
3. Click "Load unpacked extension..."
4. Choose the `chrome` directory in this repo.
5. Enable the newly added extension.
6. Head to your Gmail account, and compose a new message or open an encrypted message.

Project Credit
==============

Gcryptr is built on top of the hard work of other enterprising developers. Please support their projects.

Cryptography is difficult and I'm not a cryptographer. Therefore, Gcryptr uses open source javascript crypto library, [Forge](https://github.com/digitalbazaar/forge).

Interfacing with the Gmail interface is handled by the awesome [gmail.js](https://github.com/KartikTalwar/gmail.js) library.

TODOs
=====

* Encrypt attachments, inline images.
* Support symmetric, passphrase encryption
