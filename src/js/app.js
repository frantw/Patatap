import Sound from './sound.js';
import Animations from './animations.js';

const sound = new Sound();
const animations = new Animations();

window.addEventListener('keydown', (e) => {
    if (e.keyCode > 64 && e.keyCode < 91) {
        const key = e.key.toLowerCase();
        sound.play({key});
        animations.play({key});
    }
});
