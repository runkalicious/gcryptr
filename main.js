var global_compose;

(function() {
    var gmail = new Gmail();
    
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
    
    function encryptMessage(composeWindow) {
        var body = $(composeWindow.body()).text();
        
        /* Assign PGP public key */
        kbpgp.KeyManager.import_from_armored_pgp({
            armored: public_key
        },
        function(err, recipient) {
            if(!err) {
                var params = {
                    msg: body,
                    encrypt_for: recipient
                };
                
                /* Encrypt the message */
                kbpgp.box(params, function(err, result_string, result_buffer) {
                    result_string = result_string.replace(/\n/g, "<br>");
                    composeWindow.body(result_string);
                });
            }
            else {
                console.log("Error loading public key: " + err);
            }
        });
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
    
})();

var public_key = "";

var private_key = ""
