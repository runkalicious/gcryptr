var global_compose;

(function() {
    var gmail = new Gmail(),
        privKeyManager = null,
        publicKeyManager = null,
        gmailObj = null;
    
    /* Add button to all compose windows */
    gmail.observe.on("compose", function(compose, type) {
        var encryptButton = $("<div>")
            .addClass("T-I J-J5-Ji aoO T-I-ax7 L3")
            .text("Encrypt")
            .click(function() {
                armorMessage(compose);
            });
        
        compose.find("div.aoO").before(encryptButton);
    });
    
    gmail.observe.on("view_thread", function(thread) {
        // required to enable "view_email" listener
        console.log(thread);
    });
    
    /* Add listener for when an email is opened */
    gmail.observe.on("view_email", function(email) {
        var msg = $(email.body().replace(/<br>/g, "\n")).text();
        
        if (msg.match("^-----BEGIN PGP MESSAGE")) {
            var link = $("<a href=\"#\" />")
                .text("Decrypt now").click(function() {
                    removeMessageArmor(email);
                });
            var banner = $("<div>")
                .text("This email is encrypted.")
                .append(link);
            
            email.dom().before(banner);
        }
    });
    
    console.log("Gcryptr is active for ", gmail.get.user_email());
    
    function setKeyManager(armored_key, isPrivate, callback) {
        kbpgp.KeyManager.import_from_armored_pgp({
            armored: armored_key
        }, function(err, km) {
            if (!err) {
                if (isPrivate)
                    privKeyManager = km;
                else
                    publicKeyManager = km;
                callback(gmailObj);
            }
            else {
                console.log("Error loading Private Key!");
            }
        });
    }
    
    function unlockPrivateKey(callback) {
        // Unlock private key for signing, if necessary
        if(privKeyManager.is_pgp_locked()) {
            // TODO make this private
            var passphrase = prompt("Your private key is locked. Please enter the password");
            privKeyManager.unlock_pgp({
                passphrase: passphrase
            }, function(err) {
                if(!err) {
                    callback();
                }
                else {
                    alert("Incorrect Password!");
                }
            });
        }
        else {
            callback();
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
        var _encrypt_and_sign = function() {
            var message = $("<div>").html(composeWindow.body().replace("<br>", "\n")).text();
            
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
                
                // Clear public key
                publicKeyManager = null;
            });
        };
        
        // Unlock private key for signing, if necessary
        unlockPrivateKey(_encrypt_and_sign);
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
        
        var message = $(email.body().replace(/<br>/g, "\n")).text();
        
        var _decrypt_and_verify = function() {
            var ring = new kbpgp.keyring.KeyRing;
            if (!privKeyManager.check_pgp_public_eq(publicKeyManager)) {
                ring.add_key_manager(publicKeyManager);
            }
            ring.add_key_manager(privKeyManager); // add second for cases when public==private
            
            // Decrypt message and verify signature
            kbpgp.unbox({keyfetch: ring, armored: message}, function(err, literals) {
                if (!err) {
                    var decrypted = literals[0].toString();
                    
                    // signature
                    var ds = km = null;
                    ds = literals[0].get_data_signer();
                    if (ds) { km = ds.get_key_manager(); }
                    if (km) {
                        decrypted += "<br><br>Signed by PGP fingerprint: ";
                        decrypted += km.get_pgp_fingerprint().toString("hex");
                    }
                    
                    // Display decrypted results
                    email.body(decrypted);
                    
                    // clear public key
                    publicKeyManager = null;
                }
                else {
                    console.log("Error decrypting message: " + err);
                }
            });
        }
        
        // Unlock private key for decrypting, if necessary
        unlockPrivateKey(_decrypt_and_verify);
    }
    
    function promptForKey(keyType, callback) {
        var template = $('<div id="dialog-form" title="Get PGP Key"> <p class="validateTips">All form fields are required.</p>  <form> <fieldset> <label for="name">Armored PGP {0} Key</label> <textarea name="keyStr" id="keyStr" class="text ui-widget-content ui-corner-all"></textarea>  <!-- Allow form submission with keyboard without duplicating the dialog button --> <input type="submit" tabindex="-1" style="position:absolute; top:-1000px"> </fieldset> </form> </div>'.replace("{0}", keyType));
        $(document.body).append(template);
        
        var dialog, form,
            key = $("#keyStr");
        
        var _getKey = function() {
            var keyStr = key.val().trim();
            if(keyStr.length > 0 
                && keyStr.match("^-----BEGIN PGP")
                && keyStr.match("KEY BLOCK-----$")) {
                
                    dialog.dialog("close");
                    setKeyManager(keyStr, (keyType.toLowerCase() == "private"), callback);
                    return true;
            }
            return false;
        };
        
        dialog = $(template).dialog({
            autoOpen: false,
            height: 300,
            width: 350,
            modal: true,
            buttons: {
                "Choose Key": _getKey,
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
