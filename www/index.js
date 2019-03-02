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

const MAASConsole = (new function () {
    let self = this,
        consoleElement = document.querySelector('#maas-console');

    self.log = function (message) {
        let logEntry = document.createElement('li'),
            nowDate = new Date(),
            now = `${nowDate.getFullYear()}-${nowDate.getMonth() + 1}-${nowDate.getDate()} ${nowDate.getHours()}:${nowDate.getMinutes()}:${nowDate.getSeconds()}`;

        logEntry.innerHTML = `${now} - ${message}`;
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
}());

document.querySelector('#generate-markov-btn').addEventListener('click', function (evt) {
    let fileList = document.querySelector('#input-text').files,
        reader = new FileReader(),
        button = evt.target,
        spinner = button.querySelector('span');

        button.disabled = true;
        spinner.classList.add('show');
    reader.addEventListener('load', function (evt) {
        WORKER.postMessage('generate_markov', evt.target.result);
    });
    WORKER.registerCallback('generate_markov', hideSpinner);

    reader.readAsText(fileList[0]);

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

document.querySelector('#input-text').addEventListener('change', function() {
    document.querySelector('#generate-text-btn').disabled = true;
});

document.querySelectorAll('.srv-resource').forEach(function (element) {
    async function loadResource(evt) {
        let url = evt.target.getAttribute('data-href'),
            response = await fetch(url),
            button = evt.target,
            spinner = button.querySelector('span');

        button.disabled = true;
        spinner.classList.add('show');
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

WORKER.registerCallback('generate_markov', function (_type, payload) {
    document.querySelector('#generate-text-btn').disabled = false;
});
