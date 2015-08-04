(function() {
    var MAX_TIME_DIFF = 30000; // 30 seconds
    
    var gmail = new Gmail(),
        privKeyManager = null,
        publicKeyManager = null,
        sendButton = null,
        gmailObj = null;
    
    /* Add button to all compose windows */
    gmail.observe.on("compose", function(compose, type) {
        sendButton = compose.find("div.aoO");
        var encryptButton = $("<div>")
            .addClass("T-I J-J5-Ji aoO T-I-ax7 L3")
            .text("Send Securely")
            .click(function() {
                armorMessage(compose);
            });
        
        sendButton.before(encryptButton);
    });
    
    gmail.observe.on("view_thread", function(thread) {
        // required to enable "view_email" listener
    });
    
    /* Add listener for when an email is opened */
    gmail.observe.on("view_email", function(email) {
        var msg = $(email.body().replace(/<br>/g, "\n")).text();
        
        if (msg.match("^-----BEGIN PGP MESSAGE")) {
            var link = $("<a href=\"#\" />").text("Decrypt it now")
                .click(function() {
                    removeMessageArmor(email);
                });
            var p = $("<p>").html("<strong>Note:</strong> This message is encrypted. ").append(link);
            p.prepend($("<span class=\"ui-icon ui-icon-info\" style=\"float:left; margin-right:.3em;\">"));
            var container = $("<div class=\"ui-state-highlight ui-corner-all\">").append(p);
            
            email.dom().before($("<div id=\"decrypt-banner\" class=\"ui-widget\">").append(container));
        }
    });
    
    console.log("Gcryptr is active for:", gmail.get.user_email());
    
    function setKeyManager(armored_key, isPrivate, passphrase, callback) {
        try {
            kbpgp.KeyManager.import_from_armored_pgp({
                armored: armored_key
            }, function(err, km) {
                if (err)
                    throw "Error loading Private Key!"
                
                if (isPrivate) {
                    if (km.is_pgp_locked()) {
                        km.unlock_pgp({
                            passphrase: passphrase
                        }, function(err) {
                            if (err)
                                throw "Error unlocking Private Key!";
                            
                            // unlocked private key
                            privKeyManager = km;
                            callback(gmailObj);
                        });
                    }
                    else {
                        // non-locked private key
                        privKeyManager = km;
                        callback(gmailObj);
                    }
                }
                else {
                    // set public key, no need to unlock
                    publicKeyManager = km;
                    callback(gmailObj);
                }
            });
        }
        catch (err) {
            console.log(err);
            alert(err);
        }
    }
    
    function armorMessage(composeWindow) {
        if(privKeyManager === null || !privKeyManager.has_pgp_private()) {
            // prompt for private key
            gmailObj = composeWindow;
            promptForKey("Private", armorMessage);
            return false;
        }
        if(publicKeyManager === null) {
            // prompt for public key
            gmailObj = composeWindow;
            promptForKey("Public", armorMessage);
            return false;
        }
        
        // Clear any saved info
        gmailObj = null;
        
        /* Encrypt and sign the message */
        var message = $("<div>").html(composeWindow.body().replace("<br>", "\n")).text();
        message += "|<" + Date.now() + ">"; // timestamp nonce
        
        var params = {
            msg: message,
            encrypt_for: publicKeyManager,
            sign_with: privKeyManager
        };
        /* Encrypt the message */
        kbpgp.box(params, function(err, result_string, result_buffer) {
            if (!err) {
                result_string = result_string.replace(/\n/g, "<br>");
                composeWindow.body(result_string);
            }
            else {
                console.log("Error encrypting or signing: " + err);
            }
            
            // Send the message
            sendButton.click();
            sendButton = null;
            
            // Clear public key
            publicKeyManager = null;
        });
    }
    
    function removeMessageArmor(email) {
        if(privKeyManager === null || !privKeyManager.has_pgp_private()) {
            // prompt for private key
            gmailObj = email;
            promptForKey("Private", removeMessageArmor);
            return false;
        }
        if(publicKeyManager === null) {
            // prompt for public key
            gmailObj = email;
            promptForKey("Public", removeMessageArmor);
            return false;
        }
        
        // Clear any saved info
        gmailObj = null;
        
        var message = $(email.body().replace(/<br>/g, "\n")).text();
        
        var ring = new kbpgp.keyring.KeyRing;
        ring.add_key_manager(publicKeyManager);
        ring.add_key_manager(privKeyManager); // add second for cases when public==private
        
        // Decrypt message and verify signature
        kbpgp.unbox({keyfetch: ring, armored: message}, function(err, literals) {
            if (!err) {
                var message = literals[0].toString();
                
                // replay detection
                var timestamp = email.data().timestamp,
                    idx = message.lastIndexOf("|"),
                    nonce = message.substring(idx+2, message.length-1);
                message = message.substring(0, idx);
                
                var diff = Math.abs(timestamp - parseInt(nonce));
                if (diff > MAX_TIME_DIFF) {
                    var p = $("<p style=\"font-weight:normal;\">").text(" Check email history.");
                    p.prepend($("<strong>Possible message duplicate!</strong>"));
                    p.prepend($("<span class=\"ui-icon ui-icon-alert\" style=\"float:left; margin-right:.3em;\">"));
                    var container = $("<div class=\"ui-state-error ui-corner-all\">").append(p);
                    var banner = $("<div id=\"replay-banner\" class=\"ui-widget\">").append(container);
                    $("#decrypt-banner").after(banner);
                }
                
                // signature
                var ds = km = null;
                ds = literals[0].get_data_signer();
                if (ds) { km = ds.get_key_manager(); }
                if (km) {
                    var p = $("<p style=\"font-weight:normal;\">")
                        .text(" Signed by PGP fingerprint: " + km.get_pgp_fingerprint().toString("hex"));
                    p.prepend($("<strong>Signature Valid!</strong>"));
                    p.prepend($("<span class=\"ui-icon ui-icon-check\" style=\"float:left; margin-right:.3em;\">"));
                    var container = $("<div class=\"ui-state-default ui-corner-all\">").append(p);
                    $("#decrypt-banner > div").replaceWith(container);
                }
                else {
                    // Remove banner
                    $("#decrypt-banner").remove();
                }
                
                // Display decrypted results
                email.body(message);
            }
            else {
                var p = $("<p style=\"font-weight:normal;\">").text(" Ensure the correct keys were provided.");
                p.prepend($("<strong>Unable to decrypt and verify message!</strong>"));
                p.prepend($("<span class=\"ui-icon ui-icon-alert\" style=\"float:left; margin-right:.3em;\">"));
                var container = $("<div class=\"ui-state-error ui-corner-all\">").append(p);
                var banner = $("<div id=\"error-banner\" class=\"ui-widget\">").append(container);
                $("#decrypt-banner").replaceWith(banner);
            }
            
            // clear public key
            publicKeyManager = null;
        });
    }
    
    function promptForKey(keyType, callback) {
        var isPrivate = (keyType.toLowerCase() == "private");
        var passphrase = (!isPrivate) ? '' : '<label for="passphrase">Passphrase</label> <input type="password" id="passphrase" name="passphrase" class="text ui-widget-content ui-corner-all" />';
        var template = $('<div id="dialog-form" title="Get PGP {0} Key" style="font-size: 0.8em;"></div>'.replace(/\{0\}/g, keyType));
        var kblookup = (isPrivate) ? '' : '<h3>Keybase.io</h3> <div> <label>Twitter username:</label> <input type="text" id="username" name="username" class="text ui-widget-content ui-corner-all" /> <input type="submit" id="search" value="Search" /> <div id="kbresults"> </div> </div>';
        var accordion = $('<div id="accordion"> {0} <h3>Manual</h3> <div> <form> <fieldset style="border:0;"> <textarea name="keyStr" id="keyStr" class="text ui-widget-content ui-corner-all" rows="14" cols="65" placeholder="-----BEGIN PGP {1} KEY BLOCK-----\n\n                    &lt;your key here&gt;\n\n-----END PGP {1} KEY BLOCK-----"></textarea> {2} <input type="submit" tabindex="-1" style="position:absolute; top:-1000px"> </fieldset> </form> </div> </div>'.replace(/\{0\}/g, kblookup).replace(/\{1\}/g, keyType.toUpperCase()).replace(/\{2\}/g, passphrase));
        
        $(template).append(accordion);
        $(document.body).append(template);
        
        var dialog, form,
            username = $("#username"),
            key = $("#keyStr"),
            pass = $("#passphrase");
        
        var _getKey = function(fingerprint) {
            if (typeof(fingerprint) === 'undefined') {
                // Manual
                var keyStr = (key.length > 0) ? key.val().trim() : null,
                keyPass = (pass.length > 0) ? pass.val().trim() : null;
                
                if(keyStr.length > 0 
                    && keyStr.match("^-----BEGIN PGP")
                    && keyStr.match("KEY BLOCK-----$")) {
                    
                        dialog.dialog("close");
                        setKeyManager(keyStr, isPrivate, keyPass, callback);
                        return true;
                }
            }
            else {
                // Keybase lookup
                var baseurl = "https://keybase.io/_/api/1.0/user/lookup.json?key_fingerprint=";
                
                $.getJSON( baseurl + fingerprint, function(data) {
                    if (data.status.code === 0) {
                        // success
                        var pubKey = data.them[0].public_keys.primary.bundle;
                        
                        dialog.dialog("close");
                        setKeyManager(pubKey, isPrivate, null, callback);
                        return true;
                    }
                });
            }
            
            return false;
        };
        
        var _search = function() {
            var baseurl = "https://keybase.io/_/api/1.0/user/discover.json?flatten=1&twitter=";
            
            $.getJSON( baseurl + username.val(), function(data) {
                $("#kbresults").empty();
                
                if (data.matches.length < 1)
                    alert("No users found");
                    
                $.each( data.matches, function(i, user) {
                    var result = $('<div style="margin:10px;">');
                    var link = $('<a href="#">')
                        .append('<img style="float:left;width:100px;height:100px;" src="' + user.thumbnail + '"/>')
                        .append('<span style="float:left;padding:5px;font-weight:bold;">' + user.full_name + '</span>')
                        .click(function() {
                            _getKey(user.public_key.key_fingerprint);
                        });
                    
                    $("#kbresults").append(result.append(link));
                });
                
            });
            
        };
        
        // Make collapsible
        $(accordion).accordion({
            heightStyle: "content"
        });
        
        $(accordion).find("#search").click(_search);
        
        // Pop up
        dialog = $(template).dialog({
            autoOpen: false,
            height: 500,
            width: 600,
            modal: true,
            buttons: {
                "Use this key": _getKey,
                Cancel: function() {
                    dialog.dialog("close");
                }
            },
            close: function() {
                form[0].reset();
                $(template).remove();
            }
        });
        
        form = dialog.find("form").on("submit", function(event) {
            event.preventDefault();
            _getKey();
        });
        
        dialog.dialog("open");
    }
    
})();
