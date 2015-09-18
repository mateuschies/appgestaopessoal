

try {
    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
    window.requestFileSystem(window.TEMPORARY, 30 * 1024 * 1024, successCallback, opt_errorCallback);
    var fsI;

    function successCallback(fs) {
        fsI = fs;
    }

    function opt_errorCallback(evt) {
        console.log(evt);
    }

    function errorHandler(e) {
        console.log(e);
    }
} catch (ex) {}

function saveToDisk(fileUrl, fileName, callback) {
    fileName = fileName.replace(/\//g, '_');

    setTimeout(function() {
        if (fsI) {
            fsI.root.getFile(fileName, {
                create: true,
                exclusive: true
            }, function(fileEntry) {
                fileEntry.createWriter(function(fileWriter) {

                    fileWriter.onwriteend = function(e) {
                        ler(fileName, callback);
                    };
                    fileWriter.onerror = function(e) {

                    };
                    var blob = dataURItoBlob(fileUrl);
                    fileWriter.write(blob);

                });//, errorHandler
            }, function(err) {
                fsI.root.getFile(fileName, {
                    create: false
                }, function(fileEntry) {
                    fileEntry.remove(function() {
                        console.log('File removed.');
                        saveToDisk(fileUrl, fileName, callback);
                    });//, errorHandler
                });
            });
        }
    }, 900);
}

function dataURItoBlob(dataURI, callback) {
    var byteString = atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    var blob = new Blob([ab], {
        type: mimeString
    });
    return blob;
}

function ler(arq, callback) {
    fsI.root.getFile(arq, {}, function(fileEntry) {

        fileEntry.file(function(file) {
            var reader = new FileReader();
            reader.onloadend = function(e) {
                var url;
                if (window.webkitURL) // Chrome 10 & 11 
                    url = window.webkitURL.createObjectURL(file);
                else // Chrome 9 
                    url = createObjectURL(file);
                if (callback)
                    callback(url);
                var save = document.createElement('a');
                save.href = url;
                save.target = '_blank';
                save.download = arq;
                var evt = document.createEvent('MouseEvents');
                evt.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
                save.dispatchEvent(evt);
                if (window.webkitURL) // Chrome 10 & 11 
                    url = window.webkitURL.revokeObjectURL(file);
                else // Chrome 9 
                    url = revokeObjectURL(file);
            };
            reader.readAsText(file);
        });//, errorHandler
    });//, errorHandler
}