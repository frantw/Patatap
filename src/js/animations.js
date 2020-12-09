import { Application, Container, Graphics } from './pixi-legacy.mjs';
import { TweenLite, Expo, Circ, Sine} from "./gsap-core.js";

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

        this.flashes = [new flash(0), new flash(1), new flash(2)];
        this.veil = new wipe('y');
        this.wipe = new wipe('x');
        this.moon = new moon();
        this.ufo = new ufo();
        this.splits = new splits();
        this.pistons = [new piston(0), new piston(1), new piston(2)];
    }

    play({key}) {
        switch(key) {
            case 'q': this.flashes[0].play(); break;
            case 'a': this.flashes[1].play(); break;
            case 'z': this.flashes[2].play(); break;
            case 's': this.veil.play(); break;
            case 'x': this.wipe.play(); break;
            case 'e': this.moon.play(); break;
            case 'd': this.ufo.play(); break;
            case 'c': this.splits.play(); break;
            case 'r': this.pistons[0].play(); break;
            case 'f': this.pistons[1].play(); break;
            case 'v': this.pistons[2].play(); break;
        }
    }
}

class flash {
    constructor(id) {
        const container = this.container = new Container();
        const shape = this.shape = new Graphics();
        const colors = [COLORS.black.hex, COLORS.white.hex, COLORS.accent.hex];

        shape.beginFill(colors[id]);
        shape.drawRect(0, 0, renderer.width, renderer.height);
        shape.endFill();
        shape.visible = false;
        container.addChild(shape);
    }

    play() {
        const shape = this.shape;
        this.reset();

        const animation = this.animation = () => {
            shape.visible = Math.random() > 0.5;
        };
        app.ticker.add(animation);
        TweenLite.delayedCall(0.25, () => {
            this.clear();
        });
    }

    reset() {
        if (this.animation)
            this.clear();

        this.shape.visible = false;
        stage.addChild(this.container);
    }

    clear() {
        app.ticker.remove(this.animation);
        this.shape.visible = false;
        stage.removeChild(this.container);
        this.animation = undefined;
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

        container.addChild(shape);
    }

    play() {
        const self = this;
        const container = this.container;
        const shape = this.shape;
        const axis = this.axis;

        this.reset();

        const tweenIn = {ease: Expo.easeOut, onComplete: animationOut};
        const tweenOut = {ease: Expo.easeIn, onComplete: this.clear};
        if (axis == 'x') {
            tweenIn.x = renderer.width / 2;
            tweenOut.x = this.direction? (renderer.width * 1.5): (-renderer.width / 2);
        }
        else {
            tweenIn.y = renderer.height / 2;
            tweenOut.y = this.direction? (renderer.height * 1.5): (-renderer.height / 2);
        }

        this.tween = TweenLite.to(shape.position, 0.5, tweenIn);
        function animationOut(){
            self.tween = TweenLite.to(shape.position, 0.5, tweenOut);
        };
    }

    reset() {
        if (this.tween) {
            this.tween.kill();
            this.clear();
        }

        const axis = this.axis;
        const direction = this.direction = Math.random() > 0.5;
        if (axis == 'x')
            this.shape.x = direction? (-renderer.width / 2): (renderer.width * 1.5);
        else
            this.shape.y = direction? (-renderer.height / 2): (renderer.height * 1.5);
        stage.addChild(this.container);
    }

    clear() {
        this.tween = undefined;
        stage.removeChild(this.container);
    }
}

class moon {
    constructor() {
        const container = this.container = new Container();
        const shape = this.shape = new Graphics();
        this.color = COLORS.foreground.hex;

        const radius = (renderer.width < renderer.height ? renderer.width: renderer.height) * 0.33;
        const amount = this.amount = 42;
        this.halfAmount = amount / 2;

        this.points = [...Array(amount).keys()].map(i => {
            const pct = i / (amount - 1);
            const theta = pct * Math.PI * 2;
            return {
                x: radius * Math.cos(theta),
                y: radius * Math.sin(theta)
            };
        });

        shape.x = renderer.width / 2;
        shape.y = renderer.height / 2;
        container.addChild(shape);
    }

    play() {
        const self = this;
        const amount = this.amount;
        const halfAmount = this.halfAmount;

        this.reset();

        const current = this.current;
        const destinations = this.destinations;
        const options = {beginning: 0, ending: 0};

        this.tween = TweenLite.to(options, 0.5, {
            beginning: 1.0,
            ease: Sine.easeOut,
            onUpdate: function() {
                const t = this.totalTime() * 2;
                for (let i = halfAmount; i < amount; i++)
                    current[i].y = lerp(current[i].y, destinations[i].y, t);
                self.redraw(current);
            },
            onComplete: animationOut
        });

        function animationOut(){
            self.tween = TweenLite.to(options, 0.5, {
                ending: 1.0,
                ease: Sine.easeOut,
                onUpdate: function() {
                    const t = this.totalTime() * 2;
                    for (let i = 0; i < halfAmount; i++)
                        current[i].y = lerp(current[i].y, -(destinations[i].y), t);
                    self.redraw(current);
                },
                onComplete: self.clear
            });
        };
    }

    redraw(points) {
        const shape = this.shape;
        shape.clear();
        shape.beginFill(this.color);
        shape.drawPolygon(points);
        shape.endFill();
    }

    reset() {
        if (this.tween) {
            this.tween.kill();
            this.clear();
        }

        this.current = this.points.map(p => ({
            x: p.x,
            y: Math.abs(p.y)
        }));
        this.destinations = this.points.slice();
        this.shape.rotation = Math.random() * Math.PI * 2;
        stage.addChild(this.container);
    }

    clear() {
        this.tween = undefined;
        if (this.shape)
            this.shape.clear();
        stage.removeChild(this.container);
    }
}

class ufo {
    constructor() {
        const container = this.container = new Container();
        const shape = this.shape = new Graphics();
        const color = this.color = COLORS.accent.hex;

        const radius = (renderer.width < renderer.height ? renderer.width: renderer.height) * 0.25;
        shape.beginFill(color);
        shape.drawCircle(0, 0, radius);
        shape.endFill();

        container.addChild(shape);
    }

    play() {
        const self = this;
        const container = this.container;
        const shape = this.shape;

        this.reset();

        const tweenIn = {y: renderer.height / 2, ease: Circ.easeOut, onComplete: animationOut};
        const tweenOut = {x: 0, y: 0, ease: Circ.easeOut, onComplete: this.clear};

        this.tween = TweenLite.to(shape, 0.5, tweenIn);
        function animationOut(){
            self.tween = TweenLite.to(shape.scale, 0.5, tweenOut);
        };
    }

    reset() {
        if (this.tween) {
            this.tween.kill();
            this.clear();
        }

        const shape = this.shape;
        const right = Math.random() > 0.5;
        const top = Math.random() > 0.5;
        shape.x = right ? (renderer.width * 0.75): (renderer.width * 0.25);
        shape.y = top ? (-renderer.height * 0.5): (renderer.height * 1.5);
        shape.scale.set(1.0);
        stage.addChild(this.container);
    }

    clear() {
        this.tween = undefined;
        stage.removeChild(this.container);
    }
}

class splits {
    constructor() {
        const container = this.container = new Container();
        const shapeTop = this.shapeTop = new Graphics();
        const shapeBottom = this.shapeBottom = new Graphics();
        const distance = this.distance = renderer.height / 6;

        this.drawHalfCircle(shapeTop, Math.PI, 0);
        this.drawHalfCircle(shapeBottom, 0, Math.PI);

        container.addChild(shapeTop);
        container.addChild(shapeBottom);
        container.position.x = container.pivot.x = renderer.width / 2;
        container.position.y = container.pivot.y = renderer.height / 2;
    }

    play() {
        const self = this;
        const shapeTop = this.shapeTop;
        const shapeBottom = this.shapeBottom;

        this.reset();

        const options = {beginning: 0, ending: 0};
        this.tween = TweenLite.to(options, 0.5, {
            beginning: 1.0,
            ease: Circ.easeIn,
            onUpdate: function() {
                const t = this.totalTime() * 2;
                shapeTop.visible = shapeBottom.visible = Math.random() < t;
            },
            onComplete: animationOut
        });

        function animationOut(){
            self.tween = TweenLite.to(options, 0.5, {
                ending: 1.0,
                ease: Circ.easeOut,
                onUpdate: function() {
                    const t = this.totalTime() * 2;
                    shapeTop.y = - self.distance * t;
                    shapeBottom.y = self.distance * t;
                    shapeTop.alpha = shapeBottom.alpha = 1 - t;
                },
                onComplete: self.clear
            });
        };
    }

    reset() {
        if (this.tween) {
            this.tween.kill();
            this.clear();
        }

        this.container.rotation = Math.random() * Math.PI * 2;
        stage.addChild(this.container);
    }

    clear() {
        this.tween = undefined;
        stage.removeChild(this.container);
    }

    drawHalfCircle(shape, startAngle, endAngle) {
        const color = COLORS.foreground.hex;
        const radius = (renderer.width < renderer.height ? renderer.width: renderer.height) * 0.33;
        shape.beginFill(color);
        shape.arc(renderer.width / 2, renderer.height / 2, radius, startAngle, endAngle);
        shape.endFill;
    }
}

class piston {
    constructor(id) {
        const container = this.container = new Container();
        const shapes = this.shapes = [];
        const color = this.color = COLORS.white.hex;

        const amount = id * 4 + 1;
        const width = this.width = renderer.width * 0.75;
        const height = this.height = renderer.height * 0.5;

        const mask = this.mask = new Graphics();
        mask.beginFill(COLORS.black.hex, 1);
        mask.drawRect(width / 6, height / 2, width, height);
        mask.endFill();
        container.addChild(mask);
        mask.position.x = width + 1;

        for (let i = 0; i < amount; i++) {
            const h = height / amount - height / (amount * 3);
            const x = renderer.width * 0.25 / 2;
            const y = height / 2 + (i + 1) * (height / (amount + 1)) - height / (amount * 3);

            shapes[i] = new Graphics();
            shapes[i].beginFill(color);
            shapes[i].drawRect(x, y, width, h);
            shapes[i].endFill();
            shapes[i].mask = mask;
            container.addChild(shapes[i]);
        }
    }

    play() {
        const self = this;
        const container = this.container;
        const mask = this.mask;

        this.reset();

        const tweenIn = {ease: Sine.easeOut, onComplete: animationOut};
        const tweenOut = {ease: Sine.easeOut, onComplete: this.clear};
        tweenIn.x = 0;
        tweenOut.x = this.direction? -this.x: this.x;

        this.tween = TweenLite.to(mask.position, 0.125, tweenIn);
        function animationOut(){
            self.tween = TweenLite.to(mask.position, 0.125, tweenOut);
        };
    }

    reset() {
        if (this.tween) {
            this.tween.kill();
            this.clear();
        }

        const direction = this.direction = Math.random() > 0.5;
        const x = this.x = this.width + 1;
        this.mask.position.x = direction? x: -x;
        stage.addChild(this.container);
    }

    clear() {
        this.tween = undefined;
        stage.removeChild(this.container);
    }
}

function lerp(min, max, fraction){
    return (max - min) * fraction + min;
}
