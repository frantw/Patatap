import Sound from './sound.js';

const sound = new Sound();

window.addEventListener('keydown', (e) => {
    if (e.keyCode > 64 && e.keyCode < 91) {
        sound.play({key: e.key});
    }
});
