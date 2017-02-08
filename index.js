var exec = require('child_process').exec;
var fs = require('fs');

let wpa_supplicant_path = "path.conf"; //"/etc/wpa_supplicant/wpa_supplicant.conf";

exports.checkWifiConnection = function() {
    return new Promise(function(fn) {
        console.log('[INFO], Check Wifi Connection');
        let cmd = "iwconfig";
        var child = exec(cmd, function(error, stdout, stderr) {
            //console.log(stdout);
            //console.log(stderr);
            if (error !== null) {
                console.log('exec error: ' + error);
            } else {

                var res = stdout.search("ESSID");
                //console.log("Res :", res);
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


//Formar for PSK
function formatAp(essid, pwd) {
    return "\n\n//MyJouleBox Monitoring Wifi\nnetwork={\n\tssid=\"" + essid + "\"\n\n\tkey_mgmt=WPA-PSK\n\tpairwise=CCMP TKIP\n\tgroup=CCMP TKIP WEP104 WEP40\n\teap=TTLS PEAP TLS\n\tpsk=\"" + pwd + "\"\n}\n//MyJouleBox Monitoring Wifi END"
}


//SupressLine for a file
function suppressLineFromFile(lineStart, lineStop, fileName) {
  return new Promise(function(fn) {

    let cmd = "sed -i.bak '" + lineStart + "," + lineStop + "d' " + fileName + "";
    var child = exec(cmd, function(error, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        if (error !== null) {
            //console.log('exec error: ' + error);
        } else {
          //console.log("Supression OK");
        }
    });
  })
}
//Vérifie qu'une valeur de l'essid n'est pas déjà existante
function check(essid, pwd, fileName) {
    return new Promise(function(resolve, reject) {
        var promRes = "NoSSID";

        fs.readFile(fileName, 'utf8', function(err, data) {
            if (err) {
              resolve(promRes);
                return console.log(err);
            }
            //console.log("Read File");
            var line = data.split("\n");
            //console.log(line);
            var compare = false;
            for (var i = 0; i < line.length; ++i) {
                var re = new RegExp(pwd);
                let testPWD = line[i].match(re);
                if (compare && testPWD) {
                    //promRes = "Allready Exists :: remove";
                    var barUp = i;
                    for (var lineTest = i ; lineTest >= 0 && lineTest < line.length; lineTest++){
                      let testIn = line[lineTest].match(/}/);
                      if (testIn){
                        barUp = lineTest;
                        lineTest = -3;
                      }
                    }
                    var barDown = i;
                    for (var lineTest = i ; lineTest >= 0 && lineTest < line.length; lineTest--){
                      let testIn = line[lineTest].match(/network={/);
                      if (testIn){
                        barDown = lineTest;
                        lineTest = -1;
                      }
                    }
                    //console.log("Remove Essid " + essid + "and pwd " + pwd + "are linked");
                    //promRes ={barDown:barDown,barUp:barUp };
                    //fn(promRes);
                    reject([barDown+1,barUp+1,fileName]);
                    return;
                }
                var ressid = new RegExp(/.*ssid.*/);
                let testESSID = line[i].match(ressid);
                if (testESSID) {
                    compare = false;
                    var ressidV = new RegExp(essid);
                    let testESSIDValue = line[i].match(ressid);
                    if (testESSIDValue) {
                        compare = true;
                    }
                }
            }
            resolve(promRes);
        });
    })
}
//Connect the system to An access point
exports.connectToAP = function(essid, pwd) {
    return new Promise(function(fn) {
        let val = formatAp(essid, pwd)
            //Not test if network allready exist
        check(essid, pwd, wpa_supplicant_path)
        .catch(([barDown,barUp,fileName])=> {
          //console.log("Remove for " + barDown + "from  " + barUp + "");
          suppressLineFromFile(barDown,barUp,fileName)
          return "NoSSID";
        })
            .then((data) => {
                if (data === "NoSSID") {
                    console.log('[INFO], Connect to Wifi');
                    fs.appendFile(wpa_supplicant_path, val, function(err) {
                        fn(err);
                        return;
                    });
                } else {
                    fn(data);
                    return;
                }
            })
    })
}
