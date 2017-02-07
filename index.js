var exec = require('child_process').exec;
var fs = require('fs');

let wpa_supplicant_path = "path.conf"; //"/etc/wpa_supplicant/wpa_supplicant.conf";

exports.checkWifiConnection = function() {
    return new Promise(function(fn) {
        console.log('[INFO], Check Wifi Connection');
        let cmd = "iwconfig";
        var child = exec(cmd, function(error, stdout, stderr) {
            console.log(stdout);
            console.log(stderr);
            if (error !== null) {
                console.log('exec error: ' + error);
            } else {

                var res = stdout.search("ESSID");
                console.log("Res :", res);
                var reso = JSON.stringify(res);
                var ress = stdout.split("\"");

                if (ress.length >= 2) {
                    let wifiName = ress[1];
                    fn(wifiName);
                    return;
                } else {
                    fn("nothing");
                    return;
                }
            }
        });
    })
}

function formatAp(essid, pwd) {
    return "\n\nnetwork={\n\tssid=\"" + essid + "\"\n\n\tkey_mgmt=WPA-PSK\n\tpairwise=CCMP TKIP\n\tgroup=CCMP TKIP WEP104 WEP40\n\teap=TTLS PEAP TLS\n\tpsk=\"" + pwd + "\"\n}"
}
//Connect the system to An access point
exports.connectToAP = function(essid, pwd) {
    return new Promise(function(fn) {
        let val = formatAp(essid, pwd)
        //Not test if network allready exist
				fs.appendFile(wpa_supplicant_path, val, function(err) {
            fn(err);
            return;
        });
    })
}
