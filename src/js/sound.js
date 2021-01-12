const SOUNDS = [
    {key: 'q', filename: 'flash-1'},
    {key: 'w', filename: 'clay'},
    {key: 'e', filename: 'moon'},
    {key: 'r', filename: 'piston-1'},
    {key: 't', filename: 'timer'},
    {key: 'y', filename: 'suspension'},
    {key: 'u', filename: 'prism-1'},
    {key: 'i', filename: 'squiggle'},
    {key: 'o', filename: 'glimmer'},
    {key: 'p', filename: 'dotted-spiral'},
    {key: 'a', filename: 'flash-2'},
    {key: 's', filename: 'veil'},
    {key: 'd', filename: 'ufo'},
    {key: 'f', filename: 'piston-2'},
    {key: 'g', filename: 'bubbles'},
    {key: 'h', filename: 'strike'},
    {key: 'j', filename: 'prism-2'},
    {key: 'k', filename: 'pinwheel'},
    {key: 'l', filename: 'zig-zag'},
    {key: 'z', filename: 'flash-3'},
    {key: 'x', filename: 'wipe'},
    {key: 'c', filename: 'splits'},
    {key: 'v', filename: 'piston-3'},
    {key: 'b', filename: 'corona'},
    {key: 'n', filename: 'confetti'},
    {key: 'm', filename: 'prism-3'}
];

export default class Sound {
    constructor(decodeHandle) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.source = null;
        this.buffer = {};

        this.loaded = 0;
        this.decodeHandle = decodeHandle;
        SOUNDS.forEach(s => {
            this.load(`../src/assets/sounds/${s.filename}.mp3`, s.key)
        });
    }

    decode(arrayBuffer, key) {
        this.ctx.decodeAudioData(arrayBuffer, (buffer) => {
            this.buffer[key] = buffer;
            this.decodeHandle(++this.loaded);
        }, () => {
            console.log('Error decoding');
        });
    }

    load(src, key) {
        let self = this;
        let xhr = new XMLHttpRequest();
        xhr.open('GET', src, true);
        xhr.responseType = 'arraybuffer';

        xhr.onload = function() {
            self.decode(this.response, key);
        };

        xhr.onerror = function() {
            console.log('Error loading');
        };

        xhr.send();
    }

    stop() {
        if (this.source) {
            let time = this.ctx.currentTime;
            this.source.stop(time);
        }
    }

    play({key}) {
        let time = this.ctx.currentTime;
        this.source = this.ctx.createBufferSource();
        this.source.buffer = this.buffer[key];
        this.source.connect(this.ctx.destination);
        this.source.loop = false;

        if (this.source.start)
            this.source.start(time);
        else if (this.source.noteOn)
            this.source.noteOn(time);
    }
};
