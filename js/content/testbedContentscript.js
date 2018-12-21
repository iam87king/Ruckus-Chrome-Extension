function autoLogin (username, password) {
    checkCredential(username, password);
}

function doLogin (username, password) {
    $('#username').val(username);
    $('#password').val(password);
    $('#fm1').find(':input[type="submit"]').click();
}

function checkCredential (defaultUsername, defaultPassword) {
    chrome.storage.sync.get('credentials', function (data) {
        var credentials = data.credentials || {};
        var credentialItem = credentials[location.hostname] || {};

        if ($.isEmptyObject(credentialItem)) {
            doLogin(defaultUsername, defaultPassword);
        } else if (credentialItem.statusCode === 302 && credentialItem.username && credentialItem.password) {
            doLogin(credentialItem.username, credentialItem.password);
        }
    });
}

$(document).ready(function () {
    if (location.pathname === '/cas/login') {
        chrome.storage.sync.get('options', function (data) {
            try {
                if (data.options.autoLogin.enabled) {
                    autoLogin(data.options.autoLogin.username, data.options.autoLogin.password);
                }
            } catch (e) {
                // ignore
            }
        });
    }
});
