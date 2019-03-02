import * as maas from "maas";

class MAASConsoleProxy {
    log(...args) {
        self.postMessage({
            type: 'maas_console',
            payload: {
                fn: 'log',
                args: args,
            }
        });
    }
}

self.MAASConsole = new MAASConsoleProxy();

self.addEventListener('message', function (evt) {
    if (evt.data.type === 'generate_markov') {
        self.postMessage({
            type: evt.data.type,
            payload: maas.get_markov_from_text(evt.data.payload)
        });
    } else if (evt.data.type === 'generate_text') {
        self.postMessage({
            type: evt.data.type,
            payload: maas.generate_text(evt.data.payload).trim()
        });
    } else {
        self.postMessage(evt.data);
    }
});
