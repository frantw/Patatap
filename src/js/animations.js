import { Application, Container, Graphics } from './pixi-legacy.mjs';
import { TweenLite, Expo } from "./gsap-core.js";

const COLORS = {
    background: {r: 181, g: 181, b: 181, hex: 0xb5b5b5},
    middleground: {r: 141, g: 164, b: 170, hex: 0x8da4aa},
    foreground: {r: 227, g: 79, b: 12, hex: 0xe34f0c},
    highlight: {r: 163, g: 141, b: 116, hex: 0xa38d74},
    accent: {r: 255, g: 197, b: 215, hex: 0xffc5d7},
    white: {r: 255, g: 255, b: 255, hex: 0xffffff},
    black: {r: 0, g: 0, b: 0, hex: 0x000000},
    isDark: false
};

const app = new Application();
document.getElementById('view').appendChild(app.view);

const renderer = app.renderer;
const stage = app.stage;
const duration = 1000;

export default class Animations {
    constructor() {
        renderer.view.style.display = "block";
        renderer.autoResize = true;
        renderer.resize(window.innerWidth, window.innerHeight);
        window.onresize = () => renderer.resize(window.innerWidth, window.innerHeight);
        renderer.backgroundColor = COLORS.background.hex;

        this.flash = new flash();
        this.veil = new wipe('y');
        this.wipe = new wipe('x');
    }

    play({key}) {
        switch(key) {
            case 'q': this.flash.play(0); break;
            case 'a': this.flash.play(1); break;
            case 'z': this.flash.play(2); break;
            case 's': this.veil.play(); break;
            case 'x': this.wipe.play(); break;
        }
    }
}

class flash {
    constructor() {
        const container = this.container = new Container();
        const shapes = this.shapes = [];
        this.colors = [COLORS.black.hex, COLORS.white.hex, COLORS.accent.hex];

        for (let i = 0; i < 3; i++) {
            shapes[i] = new Graphics();
            shapes[i].beginFill(this.colors[i]);
            shapes[i].drawRect(0, 0, renderer.width, renderer.height);
            shapes[i].endFill();
            shapes[i].visible = false;
            container.addChild(shapes[i]);
        }
    }

    play(id) {
        const container = this.container;
        const shape = this.shapes[id];

        stage.addChild(container);
        const animation = () => {
            shape.visible = Math.random() > 0.5;
        };
        app.ticker.add(animation);
        TweenLite.delayedCall(0.25, () => {
            app.ticker.remove(animation);
            shape.visible = false;
            stage.removeChild(this.container);
        });
    }
}

class wipe {
    constructor(axis) {
        const container = this.container = new Container();
        const shape = this.shape = new Graphics();
        const center = this.center = {x: renderer.width / 2, y: renderer.height / 2};
        const color = axis == 'x' ? COLORS.middleground.hex: COLORS.highlight.hex;
        const rx = axis == 'x' ? (-center.x): 0;
        const ry = axis == 'x' ? 0: (-center.y);
        this.axis = axis;

        shape.beginFill(color);
        shape.drawRect(rx, ry, renderer.width, renderer.height);
        shape.endFill();
        shape.visible = false;

        container.addChild(shape);
    }

    play() {
        const self = this;
        const container = this.container;
        const shape = this.shape;
        const axis = this.axis;
        const direction = Math.random() > 0.5;

        if (this.tween) {
            this.tween.kill();
            clear();
        }
        container.position.x = 0;
        container.position.y = 0;

        const tweenIn = {ease: Expo.easeOut, onComplete: animationOut};
        const tweenOut = {ease: Expo.easeIn, onComplete: clear};
        if (axis == 'x') {
            shape.x = direction? (-renderer.width / 2): (renderer.width * 1.5);
            tweenIn.x = direction? (renderer.width): (-renderer.width);
            tweenOut.x = direction? (renderer.width * 2): (-renderer.width * 2);
        }
        else {
            shape.y = direction? (-renderer.height / 2): (renderer.height * 1.5);
            tweenIn.y = direction? (renderer.height): (-renderer.height);
            tweenOut.y = direction? (renderer.height * 2): (-renderer.height * 2);
        }

        shape.visible = true;
        stage.addChild(container);
        this.tween = TweenLite.to(container.position, 0.5, tweenIn);
        function animationOut(){
            self.tween = TweenLite.to(container.position, 0.5, tweenOut);
        };
        function clear(){
            self.tween = undefined;
            stage.removeChild(container);
            shape.visible = false;
        };
    }
}
