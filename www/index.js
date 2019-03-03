import * as maas from "maas";

const WORKER = (new function () {
    let self = this,
        worker = new Worker('bootstrap.worker.js'),
        callbacks = {};

    self.postMessage = function (type, payload) {
        return worker.postMessage({type, payload});
    };
    self.registerCallback = function (type, callback) {
        let callbacksArray = callbacks[type] || [];

        callbacksArray.push(callback);

        callbacks[type] = callbacksArray;
    };
    self.removeCallback = function (type, callback) {
        let callbacksArray = callbacks[type] || [];

        callbacks[type] = callbacksArray.filter((fn) => fn !== callback);
    };

    function routeMessage(evt) {
        let {type, payload} = evt.data;

        (callbacks[type] || []).forEach(function (callback) {
            callback(type, payload);
        });
    }
    worker.addEventListener('message', routeMessage);
}());

const MAAS_CONSOLE = (new function () {
    let self = this,
        consoleElement = document.querySelector('#maas-console');

    self.log = function (message) {
        let logEntry = document.createElement('li'),
            nowDate = new Date();

        logEntry.innerHTML = `${formatDate(nowDate)} - ${message}`;
        logEntry.classList.add('list-group-item');
        consoleElement.insertBefore(logEntry, consoleElement.firstChild);

        setTimeout(function () {
            logEntry.classList.add('show');
        }, 100);
    };

    function routeMessage(type, payload) {
        let {fn, args} = payload;

        self[fn](...args);
    }
    WORKER.registerCallback('maas_console', routeMessage);

    function formatDate(theDate) {
        return [
            [
                theDate.getFullYear(),
                formatNumber(theDate.getMonth() + 1, 2, '0'),
                formatNumber(theDate.getDate(), 2, '0')
            ].join('-'),
            [
                formatNumber(theDate.getHours(), 2, '0'),
                formatNumber(theDate.getMinutes(), 2, '0'),
                formatNumber(theDate.getSeconds(), 2, '0')
            ].join(':')
        ].join(' ');
    }

    function formatNumber(num, fieldLength, fillChar) {
        fieldLength = fieldLength || 0;
        fillChar = fillChar.toString() || '';

        if (fieldLength === 0 && fillChar === '') {
            return num.toString();
        }

        num = num.toString();
        if (num.length < fieldLength) {
            return `${fillChar.repeat(fieldLength - num.length)}${num}`;
        }

        return num;
    }
}());

document.querySelector('#generate-markov-btn').addEventListener('click', function (evt) {
    let file = document.querySelector('#input-text').files[0],
        reader = new FileReader(),
        button = evt.target,
        spinner = button.querySelector('span');

    if (file === undefined) {
        MAAS_CONSOLE.log('No file selected');
        return;
    }

    button.disabled = true;
    spinner.classList.add('show');

    reader.addEventListener('load', function (evt) {
        WORKER.postMessage('generate_markov', evt.target.result);
    });
    WORKER.registerCallback('generate_markov', hideSpinner);

    reader.readAsText(file);
    MAAS_CONSOLE.log(`load file ${file.name}`);

    function hideSpinner() {
        spinner.classList.remove('show');
        button.disabled = false;

        WORKER.removeCallback('generate_markov', hideSpinner);
    }
});

document.querySelector('#generate-text-btn').addEventListener('click', function() {
    let numberOfWords = parseInt(document.querySelector('#number-of-words').value, 10);

    WORKER.postMessage('generate_text', numberOfWords);
});

(function (fileInput) {
    let labelElement = document.querySelector('label[for="input-text"]'),
        generateTextButton = document.querySelector('#generate-text-btn'),
        originallabelText = labelElement.innerHTML;

    fileInput.addEventListener('change', function(evt) {
        let file = fileInput.files[0];

        generateTextButton.disabled = true;

        if (labelElement) {
            let text = originallabelText;

            if (file) {
                text = file.name;
            }

            labelElement.innerHTML = text;
        }
    });

    if (fileInput.files[0]) {
        labelElement.innerHTML = fileInput.files[0].name;
    }
}(document.querySelector('#input-text')));


document.querySelectorAll('.srv-resource').forEach(function (element) {
    async function loadResource(evt) {
        let url = evt.target.getAttribute('data-href'),
            response = await fetch(url),
            button = evt.target,
            spinner = button.querySelector('span');

        button.disabled = true;
        spinner.classList.add('show');
        MAAS_CONSOLE.log(`download file ${url}`);
        WORKER.postMessage('generate_markov', await response.text());
        WORKER.registerCallback('generate_markov', hideSpinner);

        function hideSpinner() {
            spinner.classList.remove('show');
            button.disabled = false;

            WORKER.removeCallback('generate_markov', hideSpinner);
        }
    }

    element.addEventListener('click', loadResource);
});

WORKER.registerCallback('generate_text', function (_type, payload) {
    document.querySelector('#generate-text-output').innerHTML = payload.replace(/\n/g, '<br />\n');
});

WORKER.registerCallback('generate_markov', function (_type, _payload) {
    document.querySelector('#generate-text-btn').disabled = false;
});
