var global_compose;

(function() {
    var gmail = new Gmail(),
        privKeyManager = null,
        publicKeyManager = null,
        gmailObj = null;
    
    console.log('Hello,', gmail.get.user_email());
    
    /* Add button to all compose windows */
    gmail.observe.on("compose", function(compose, type) {
        var encryptButton = $("<div>")
            .addClass("T-I J-J5-Ji aoO T-I-ax7 L3")
            .text("Encrypt")
            .click(function() {
                encryptMessage(compose);
            });
        
        compose.find("div.aoO").before(encryptButton);
    });
    
    gmail.observe.on("view_thread", function(thread) {
        // required to enable "view_email" listener
        console.log(thread);
    });
    
    /* Add listener for when an email is opened */
    gmail.observe.on("view_email", function(email) {
        console.log("Viewing email");
        var msg = $(email.body().replace(/<br>/g, "\n")).text();
        
        console.log(msg);
        
        if (msg.match("^-----BEGIN PGP")) {
            var link = $("<a href=\"#\" />")
                .text("Decrypt now").click(function() {
                    decryptMessage(msg, email);
                });
            var banner = $("<div>")
                .text("This email is encrypted.")
                .append(link);
            
            email.dom().before(banner);
        }
    });
    
    function setKeyManager(armored_key, isPrivate, callback) {
        console.log("setKeyManager: isPrivate=> " + isPrivate);
        
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
    
    function encryptMessage(composeWindow) {
        console.log(privKeyManager);
        
        if(privKeyManager === null || !privKeyManager.has_pgp_private()) {
            // prompt for private key
            gmailObj = composeWindow;
            promptForKey("Private", encryptMessage);
            return false;
        }
        if(publicKeyManager === null) {
            // prompt for public key
            gmailObj = composeWindow;
            promptForKey("Public", encryptMessage);
            return false;
        }
        
        // Clear any saved info
        gmailObj = null;
        
        /* Encrypt and sign the message */
        var _encrypt_and_sign = function() {
            var params = {
                msg: $(composeWindow.body()).text(),
                encrypt_for: publicKeyManager,
                sign_with: privKeyManager
            };
            /* Encrypt the message */
            kbpgp.box(params, function(err, result_string, result_buffer) {
                result_string = result_string.replace(/\n/g, "<br>");
                composeWindow.body(result_string);
                
                // Clear public key
                publicKeyManager = null;
            });
        };
        
        // Unlock private key for signing, if necessary
        if(privKeyManager.is_pgp_locked()) {
            // TODO make this private
            var passphrase = prompt("Your private key is locked. Please enter the password");
            privKeyManager.unlock_pgp({
                passphrase: passphrase
            }, function(err) {
                if(!err) {
                    _encrypt_and_sign();
                }
                else {
                    alert("Incorrect Password!");
                }
            });
        }
        else {
            _encrypt_and_sign();
        }
    }
    
    function decryptMessage(message, email) {
        //var form = $("<input id=\"files\" type=\"file\" name=\"files\" class=\"modal\" />");
        //$(document.body).append(form);
        //$(form).jmodal();
        
        //var private_key = prompt("Please copy your private key here");
        
        kbpgp.KeyManager.import_from_armored_pgp({
            armored: private_key
        }, function(err, alice) {
            if (!err) {
                if (alice.is_pgp_locked()) {
                    var passphrase = prompt("Please enter your password");
                    
                    alice.unlock_pgp({
                        passphrase: passphrase
                    }, function(err) {
                        if (!err) {
                            console.log("Loaded private key with passphrase");
                        }
                    });
                } else {
                    console.log("Loaded private key w/o passphrase");
                }
            }
            else {
                console.log("Error opening private key: " + err);
            }
        });
        
        /*document.getElementById('files').addEventListener('change', function(event) {
            var files = event.target.files;
            var r = new FileReader();
            r.readAsBinaryString(files[0]);
            r.onloadend = function(file) {
                var buffer = new kbpgp.Buffer(r.result);
                
                
                
            };
        }, false);*/
        
        // do decryption
        /*var ring = new kbpgp.keyring.KeyRing;
        var kms = [alice, bob, charlie];
        var pgp_msg = "---- BEGIN PGP MESSAGE ----- ....";
        var asp = 
        for (var i in kms) {
            ring.add_key_manager(kms[i]);
        }
        kbpgp.unbox({keyfetch: ring, armored: pgp_msg, asp }, function(err, literals) {
          if (err != null) {
            return console.log("Problem: " + err);
          } else {
            console.log("decrypted message");
            console.log(literals[0].toString());
            var ds = km = null;
            ds = literals[0].get_data_signer();
            if (ds) { km = ds.get_key_manager(); }
            if (km) {
              console.log("Signed by PGP fingerprint");
              console.log(km.get_pgp_fingerprint().toString('hex'));
            }
          }
        });*/
    }
    
    function promptForKey(keyType, callback) {
        console.log("promptForKey: keyType=> " + keyType);
        
        var template = $('<div id="dialog-form" title="Get PGP Key"> <p class="validateTips">All form fields are required.</p>  <form> <fieldset> <label for="name">Armored PGP {0} Key</label> <textarea name="keyStr" id="keyStr" class="text ui-widget-content ui-corner-all"></textarea>  <!-- Allow form submission with keyboard without duplicating the dialog button --> <input type="submit" tabindex="-1" style="position:absolute; top:-1000px"> </fieldset> </form> </div>'.replace("{0}", keyType));
        $(document.body).append(template);
        
        var dialog, form,
            key = $("#keyStr");
        
        var _getKey = function() {
            var keyStr = key.val();
            if(keyStr.length > 0) {
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
