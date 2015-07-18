var global_compose;

(function() {
    var gmail = new Gmail();
    
    console.log('Hello,', gmail.get.user_email());
    
    gmail.observe.on("compose", function(compose, type) {
        // TODO remove
        console.log('api.dom.compose object:', compose, 'type is:', type );
        global_compose = compose;
        
        var encryptButton = $("<div class=\"T-I J-J5-Ji aoO T-I-ax7 L3\">Encrypt</div>").click(function() {
            encryptMessage(compose);
        });
        
        compose.find("div.aoO").before(encryptButton);
    });
    
    function encryptMessage(composeWindow) {
        console.log(composeWindow.body());
    }
    
    function decryptMessage(email) {
        console.log(email.body());
    }
    
})();
