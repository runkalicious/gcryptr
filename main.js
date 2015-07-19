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
        console.log(message);
        
        // do decryption
    }
    
})();

var public_key = "";
