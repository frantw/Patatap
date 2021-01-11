import { Application, Container, Graphics } from './pixi-legacy.mjs';
import { TweenLite, Expo, Circ, Sine, Power3 } from "./gsap-core.js";

const COLORS = {
    background: {r: 181, g: 181, b: 181, hex: 0xb5b5b5},
    middleground: {r: 141, g: 164, b: 170, hex: 0x8da4aa},
    foreground: {r: 227, g: 79, b: 12, hex: 0xe34f0c},
    highlight: {r: 163, g: 141, b: 116, hex: 0xa38d74},
    accent: {r: 255, g: 197, b: 215, hex: 0xffc5d7},
    white: {r: 255, g: 255, b: 255, hex: 0xffffff},
    black: {r: 0, g: 0, b: 0, hex: 0x000000}
};

const app = new Application();
document.getElementById('view').appendChild(app.view);

const renderer = app.renderer;
const stage = app.stage;

const background = {};
const foreground = {};
const getContainerByIndex = (ground, index) => ground.child[index];
const generateContainer = (el, childAmount) => {
    el.container = new Container();
    el.child = [];
    stage.addChild(el.container);
    for (let i = 0; i < childAmount; i++) {
        const container = new Container();
        el.container.addChild(container);
        el.child.unshift(container);
    }
};
generateContainer(background, 3);
generateContainer(foreground, 12);

export default class Animations {
    constructor() {
        renderer.view.style.display = "block";
        renderer.autoResize = true;
        renderer.resize(window.innerWidth, window.innerHeight);
        window.onresize = () => this.resize();
        renderer.backgroundColor = COLORS.background.hex;

        this.animations = {
            q: new flash({color: 'black'}),
            a: new flash({color: 'white'}),
            z: new flash({color: 'accent'}),
            w: new clay(),
            s: new wipe({axis: 'y'}),
            x: new wipe({axis: 'x'}),
            e: new moon(),
            d: new ufo(),
            c: new splits(),
            r: new piston({amount: 1}),
            f: new piston({amount: 5}),
            v: new piston({amount: 9}),
            t: new timer(),
            g: new corona({style: 'circle'}),
            b: new corona({style: 'triangle'}),
            y: new confetti({style: 'simple'}),
            h: new strike(),
            n: new confetti({style: 'colorful'}),
            u: new prism({style: 'triangle'}),
            j: new prism({style: 'square'}),
            m: new prism({style: 'hexagon'}),
            i: new squiggle(),
            k: new pinwheel(),
            o: new glimmer(),
            l: new zigzag(),
            p: new spiral()
        };
    }

    play({key}) {
        this.animations[key].play();
    }

    resize() {
        const animations = this.animations;
        renderer.resize(window.innerWidth, window.innerHeight);
        for (let key in animations)
            if (animations[key] && animations[key].resize)
                animations[key].resize();
    }
}

class flash {
    constructor({color}) { // color: black, white, accent
        this.parent = getContainerByIndex(background, 0);
        const container = this.container = new Container();
        const shape = this.shape = new Graphics();

        this.color = COLORS[color].hex;
        this.resize();

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
        this.parent.addChild(this.container);
    }

    clear() {
        app.ticker.remove(this.animation);
        this.shape.visible = false;
        this.parent.removeChild(this.container);
        this.animation = undefined;
    }

    resize() {
        const shape = this.shape;
        const color = this.color;
        shape.clear();
        shape.beginFill(color);
        shape.drawRect(0, 0, renderer.width, renderer.height);
        shape.endFill();
        shape.visible = false;
    }
}

class clay {
    constructor() {
        const parent = getContainerByIndex(background, 1);
        const container = this.container = new Container();
        const shape = this.shape = new Graphics();

        this.amount = Math.floor(Math.random()) * 8 + 8;
        this.color = COLORS.middleground.hex;
        this.resize();

        parent.addChild(container);
        container.addChild(shape);
    }

    play() {
        const self = this;

        this.reset();

        const options = {ending: 0};
        const points = this.points;
        const destinations = this.destinations;

        this.tween = TweenLite.to(options, 0.75, {
            ending: 1.0,
            ease: Circ.easeOut,
            onUpdate: () => {
                const t = options.ending;
                const current = destinations.map((d, i) => ({
                    x: lerp(points[i].x, d.x, t),
                    y: lerp(points[i].y, d.y, t)
                }));
                self.redraw(current);
            },
            onComplete: () => self.clear()
        });
    }

    redraw(points) {
        const shape = this.shape;
        const color = this.color;
        const amount = this.amount;
        shape.clear();
        shape.beginFill(color);

        // It doesn't actually draw through each of the points, just a approximation method.
        const x = (points[amount - 1].x + points[0].x) / 2;
        const y = (points[amount - 1].y + points[0].y) / 2;
        shape.moveTo(x, y);
        points.forEach((p, i) => {
            if (i < amount - 1) {
                const toX = (p.x + points[i + 1].x) / 2;
                const toY = (p.y + points[i + 1].y) / 2;
                shape.quadraticCurveTo(p.x, p.y, toX, toY);
            }
            else
                shape.quadraticCurveTo(p.x, p.y, x, y);
        });
        shape.endFill();
    }

    reset() {
        if (this.tween) {
            this.tween.kill();
            this.clear();
        }

        const pos = Math.random() * 8;
        const width = renderer.width;
        const height = renderer.height;
        const center = {
            x: width / 2,
            y: height / 2
        };
        const posX = pos % 4 == 0 ? center.x: (pos > 4 ? 0: width);
        const posY = pos % 4 == 2 ? center.y: (pos > 2 && pos < 5 ? height: 0);
        this.container.position.x = posX;
        this.container.position.y = posY;

        const radius = this.radius;
        const impact = {
            x: Math.random() * renderer.width,
            y: Math.random() * renderer.height
        };
        const angleBetween = (v1, v2) => Math.atan2(v2.y - v1.y, v2.x - v1.x);

        this.destinations = this.points.map(p => {
            const theta = angleBetween(p, impact) - p.theta;
            const distance = Math.sqrt(Math.pow(p.x - impact.x, 2) + Math.pow(p.y - impact.y, 2));
            const d = 10 * radius / Math.sqrt(distance);
            const x = d * Math.cos(theta) + p.x;
            const y = d * Math.sin(theta) + p.y;
            return {x, y};
        });
    }

    clear() {
        this.tween = undefined;
        if (this.shape)
            this.shape.clear();
    }

    resize() {
        const amount = this.amount;
        const radius = this.radius = renderer.height;
        this.points = [...Array(amount).keys()].map(i => {
            const pct = i / amount;
            const theta = Math.PI * 2 * pct;
            const x = radius * Math.sin(theta);
            const y = radius * Math.cos(theta);
            return {x, y, theta};
        });
    }
}

class wipe {
    constructor({axis}) {
        this.parent = getContainerByIndex(background, 2);
        const container = this.container = new Container();
        const shape = this.shape = new Graphics();

        this.axis = axis;
        this.color = axis == 'x' ? COLORS.middleground.hex: COLORS.highlight.hex;
        this.resize();

        container.addChild(shape);
    }

    play() {
        const self = this;
        const shape = this.shape;
        const axis = this.axis;

        this.reset();

        const tweenIn = {ease: Expo.easeOut, onComplete: animationOut};
        const tweenOut = {ease: Expo.easeIn, onComplete: () => this.clear()};
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
        this.parent.addChild(this.container);
    }

    clear() {
        this.tween = undefined;
        this.parent.removeChild(this.container);
    }

    resize() {
        const shape = this.shape;
        const color = this.color;
        const axis = this.axis;
        const center = this.center = {x: renderer.width / 2, y: renderer.height / 2};
        const rx = axis == 'x' ? (-center.x): 0;
        const ry = axis == 'x' ? 0: (-center.y);
        shape.clear();
        shape.beginFill(color);
        shape.drawRect(rx, ry, renderer.width, renderer.height);
        shape.endFill();
    }
}

class moon {
    constructor() {
        this.parent = getContainerByIndex(foreground, 5);
        const container = this.container = new Container();
        const shape = this.shape = new Graphics();

        this.color = COLORS.foreground.hex;
        this.amount = 42;
        this.halfAmount = 21;
        this.resize();

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
            onUpdate: () => {
                const t = options.beginning;
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
                onUpdate: () => {
                    const t = options.ending;
                    for (let i = 0; i < halfAmount; i++)
                        current[i].y = lerp(current[i].y, -(destinations[i].y), t);
                    self.redraw(current);
                },
                onComplete: () => self.clear()
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
        this.parent.addChild(this.container);
    }

    clear() {
        this.tween = undefined;
        if (this.shape)
            this.shape.clear();
        this.parent.removeChild(this.container);
    }

    resize() {
        const shape = this.shape;
        const amount = this.amount;
        const radius = (renderer.width < renderer.height ? renderer.width: renderer.height) * 0.33;

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
    }
}

class ufo {
    constructor() {
        this.parent = getContainerByIndex(foreground, 6);
        const container = this.container = new Container();
        const shape = this.shape = new Graphics();

        this.color = COLORS.accent.hex;
        this.resize();

        container.addChild(shape);
    }

    play() {
        const self = this;
        const shape = this.shape;

        this.reset();

        const tweenIn = {y: renderer.height / 2, ease: Circ.easeOut, onComplete: animationOut};
        const tweenOut = {x: 0, y: 0, ease: Circ.easeOut, onComplete: () => this.clear()};

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
        this.parent.addChild(this.container);
    }

    clear() {
        this.tween = undefined;
        this.parent.removeChild(this.container);
    }

    resize() {
        const shape = this.shape;
        const color = this.color;
        const radius = (renderer.width < renderer.height ? renderer.width: renderer.height) * 0.25;
        shape.clear();
        shape.beginFill(color);
        shape.drawCircle(0, 0, radius);
        shape.endFill();
    }
}

class splits {
    constructor() {
        this.parent = getContainerByIndex(foreground, 5);
        const container = this.container = new Container();
        const shapeUp = this.shapeUp = new Graphics();
        const shapeDown = this.shapeDown = new Graphics();

        this.color = COLORS.foreground.hex;
        this.resize();

        container.addChild(shapeUp);
        container.addChild(shapeDown);
    }

    play() {
        const self = this;
        const shapeUp = this.shapeUp;
        const shapeDown = this.shapeDown;

        this.reset();

        const options = {beginning: 0, ending: 0};
        this.tween = TweenLite.to(options, 0.5, {
            beginning: 1.0,
            ease: Circ.easeIn,
            onUpdate: () => {
                const t = options.beginning;
                shapeUp.visible = shapeDown.visible = Math.random() < t;
            },
            onComplete: animationOut
        });

        function animationOut(){
            self.tween = TweenLite.to(options, 0.5, {
                ending: 1.0,
                ease: Circ.easeOut,
                delay: 0.5,
                onUpdate: () => {
                    const t = options.ending;
                    shapeUp.y = lerp(shapeUp.y, - self.distance, t);
                    shapeDown.y = lerp(shapeDown.y, self.distance, t);
                    shapeUp.alpha = shapeDown.alpha = 1 - t;
                },
                onComplete: () => self.clear()
            });
        };
    }

    reset() {
        if (this.tween) {
            this.tween.kill();
            this.clear();
        }

        this.container.rotation = Math.random() * Math.PI * 2;
        this.shapeUp.y = 0.25;
        this.shapeDown.y = - 0.25;
        this.shapeUp.alpha = this.shapeDown.alpha = 1;
        this.parent.addChild(this.container);
    }

    clear() {
        this.tween = undefined;
        this.parent.removeChild(this.container);
    }

    drawHalfCircle(shape, startAngle, endAngle) {
        const color = this.color;
        const radius = (renderer.width < renderer.height ? renderer.width: renderer.height) * 0.33;
        shape.clear();
        shape.beginFill(color);
        shape.arc(renderer.width / 2, renderer.height / 2, radius, startAngle, endAngle);
        shape.endFill;
    }

    resize() {
        const container = this.container;
        const shapeUp = this.shapeUp;
        const shapeDown = this.shapeDown;

        this.distance = renderer.height / 6;
        this.drawHalfCircle(shapeUp, Math.PI, 0);
        this.drawHalfCircle(shapeDown, 0, Math.PI);

        container.position.x = container.pivot.x = renderer.width / 2;
        container.position.y = container.pivot.y = renderer.height / 2;
    }
}

class piston {
    constructor({amount}) {
        this.parent = getContainerByIndex(foreground, 10);
        const container = this.container = new Container();
        const shapes = this.shapes = [];
        const mask = this.mask = new Graphics();

        this.color = COLORS.white.hex;
        this.amount = amount;
        this.resize();

        shapes.forEach(shape => container.addChild(shape));
        container.addChild(mask);
    }

    play() {
        const self = this;
        const mask = this.mask;

        this.reset();

        const tweenIn = {ease: Sine.easeOut, onComplete: animationOut};
        const tweenOut = {ease: Sine.easeOut, onComplete: () => this.clear()};
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
        this.parent.addChild(this.container);
    }

    clear() {
        this.tween = undefined;
        this.parent.removeChild(this.container);
    }

    resize() {
        const shapes = this.shapes;
        const mask = this.mask;

        const amount = this.amount;
        const color = this.color;
        const width = this.width = renderer.width * 0.75;
        const height = this.height = renderer.height * 0.5;

        mask.clear();
        mask.beginFill(COLORS.black.hex, 1);
        mask.drawRect(width / 6, height / 2, width, height);
        mask.endFill();
        mask.position.x = width + 1;

        for (let i = 0; i < amount; i++) {
            const h = height / amount - height / (amount * 3);
            const x = renderer.width * 0.25 / 2;
            const y = height / 2 + (i + 1) * (height / (amount + 1)) - height / (amount * 3);

            if (shapes[i])
                shapes[i].clear();
            else
                shapes[i] = new Graphics();
            shapes[i].beginFill(color);
            shapes[i].drawRect(x, y, width, h);
            shapes[i].endFill();
            shapes[i].mask = mask;
        }
    }
}

class timer {
    constructor() {
        this.parent = getContainerByIndex(foreground, 7);
        const container = this.container = new Container();
        const shape = this.shape = new Graphics();

        this.color = COLORS.highlight.hex;
        this.resize();

        container.addChild(shape);
    }

    play() {
        const self = this;
        this.reset();

        const direction = this.direction;
        const twoPI = Math.PI * 2;
        const options = {theta: direction? 0: twoPI * 2};
        this.tween = TweenLite.to(options, 0.66, {
            theta: direction? twoPI * 2: 0,
            onUpdate: () => {
                const theta = options.theta;
                if (theta <= twoPI)
                    self.redraw(0, theta);
                else
                    self.redraw(theta - twoPI, twoPI);
            },
            onComplete: () => self.clear()
        });
    }

    reset() {
        if (this.tween) {
            this.tween.kill();
            this.clear();
        }

        this.direction = Math.random() > 0.5;
        this.container.rotation = Math.random() * Math.PI * 2;
        this.parent.addChild(this.container);
    }

    clear() {
        this.tween = undefined;
        if (this.shape)
            this.shape.clear();
        this.parent.removeChild(this.container);
    }

    draw(startAngle, endAngle) {
        const color = this.color;
        const radius = (renderer.width < renderer.height ? renderer.width: renderer.height) / 3;
        const lineWidth = (renderer.width < renderer.height ? renderer.width: renderer.height) / 10;
        const shape = this.shape;
        shape.beginFill(color, 0);
        shape.lineStyle(lineWidth, color, 1);
        shape.arc(0, 0, radius, startAngle, endAngle);
        shape.endFill();
    }

    redraw(startAngle, endAngle) {
        this.shape.clear();
        this.draw(startAngle, endAngle);
    }

    resize() {
        const container = this.container;
        container.position.x = renderer.width / 2;
        container.position.y = renderer.height / 2;
    }
}

class corona {
    constructor({style}) { // style: circle or triangle
        const parent = this.parent = getContainerByIndex(foreground, 0);
        const container = this.container = new Container();
        const shapes = this.shapes = [];

        this.style = style;
        this.color = style == 'circle'? COLORS.black.hex: COLORS.white.hex;
        this.amount = style == 'circle'? 24: 32;
        this.resize();

        shapes.forEach(shape => container.addChild(shape));
        parent.addChild(container);
    }

    play() {
        const self = this;
        const container = this.container;
        const shapes = this.shapes;
        const points = this.points;
        const amount = this.amount;

        this.reset();

        const current = this.current = new Graphics();
        this.draw(current, points[0].x, points[0].y, points[0].theta);
        container.addChild(current);

        const radius = this.radius;
        const direction = this.direction;
        const twoPI = Math.PI * 2;
        const options = {theta: direction? 0: twoPI * 2};
        this.tween = TweenLite.to(options, 1.4, {
            theta: direction? twoPI * 2: 0,
            ease: Power3.easeInOut,
            onUpdate: () => {
                const theta = options.theta;
                if (direction) {
                    if (theta <= twoPI)
                        for (let i = 0; i < amount; i++)
                            shapes[i].visible = points[i].theta < theta;
                    else
                        for (let i = 0; i < amount; i++)
                            shapes[i].visible = points[i].theta >= (theta - twoPI);
                }
                else {
                    if (theta > twoPI)
                        for (let i = 0; i < amount; i++)
                            shapes[i].visible = points[i].theta > (theta - twoPI);
                    else
                        for (let i = 0; i < amount; i++)
                            shapes[i].visible = points[i].theta <= theta;
                }
                self.redraw(current, radius * Math.cos(theta), radius * Math.sin(theta), theta);
            },
            onComplete: () => self.clear()
        });
    }

    reset() {
        if (this.tween) {
            this.tween.kill();
            this.clear();
        }

        this.direction = Math.random() > 0.5;
        this.container.rotation = Math.random() * Math.PI * 2;
        this.parent.addChild(this.container);
    }

    clear() {
        this.tween = undefined;
        if (this.current)
            this.current.clear();
        this.shapes[this.amount - 1].visible = false;
        this.parent.removeChild(this.container);
    }

    drawCircle(graphic, x, y) {
        graphic.beginFill(this.color);
        graphic.drawCircle(x, y, this.graphicRadius);
        graphic.endFill();
    }

    drawTriangle(graphic, x, y, theta) {
        const radius = this.graphicRadius;
        const pct = 1 / 3;
        const t1 = {
            x: x + radius * Math.cos(theta),
            y: y + radius * Math.sin(theta)
        }
        const t2 = {
            x: x + radius * Math.cos(theta + Math.PI * 2 * pct),
            y: y + radius * Math.sin(theta + Math.PI * 2 * pct)
        }
        const t3 = {
            x: x + radius * Math.cos(theta + Math.PI * 2 * pct * 2),
            y: y + radius * Math.sin(theta + Math.PI * 2 * pct * 2)
        }
        graphic.beginFill(this.color);
        graphic.moveTo(t1.x, t1.y);
        graphic.lineTo(t2.x, t2.y);
        graphic.lineTo(t3.x, t3.y);
        graphic.endFill();
    }

    draw(graphic, x, y, theta) {
        if (this.style == 'circle')
            this.drawCircle(graphic, x, y);
        else
            this.drawTriangle(graphic, x, y, theta);
    }

    redraw(graphic, x, y, theta) {
        graphic.clear();
        this.draw(graphic, x, y, theta);
    }

    resize() {
        const container = this.container;
        const shapes = this.shapes;
        const amount = this.amount;
        const style = this.style;
        const radius = this.radius = (renderer.width < renderer.height ? renderer.width: renderer.height) * (style == 'circle'? 0.33: 0.45);

        container.position.x = renderer.width / 2;
        container.position.y = renderer.height / 2;

        this.graphicRadius = (renderer.width < renderer.height ? renderer.width: renderer.height) / 90;
        this.points = [...Array(amount).keys()].map(i => {
            const pct = i / (amount - 1);
            const theta = pct * Math.PI * 2;

            if (shapes[i])
                shapes[i].clear();
            else
                shapes[i] = new Graphics();
            const shape = shapes[i];
            const x = radius * Math.cos(theta);
            const y = radius * Math.sin(theta);
            this.draw(shape, x, y, theta);
            shape.visible = false;
            return {x, y, theta};
        });
    }
}

class confetti {
    constructor({style}) { // style: simple or colorful
        this.parent = getContainerByIndex(foreground, 8);
        const container = this.container = new Container();
        const shapes = this.shapes = [];

        this.style = style;
        this.colors = Object.keys(COLORS).map(key => COLORS[key].hex);
        this.amount = style == 'simple'? 16: 32;
        this.resize();

        shapes.forEach(shape => container.addChild(shape));
    }

    play() {
        const self = this;
        const shapes = this.shapes;
        const points = this.points;

        this.reset();

        const options = {ending: 0};
        this.tween = TweenLite.to(options, 0.5, {
            ending: 1.0,
            ease: Sine.easeOut,
            onUpdate: () => {
                const t = options.ending;
                shapes.forEach((shape, idx) => {
                    const point = points[idx];
                    shape.x = lerp(shape.x, point.x, t);
                    shape.y = lerp(shape.y, point.y, t);
                });
            },
            onComplete: () => self.clear()
        });
    }

    reset() {
        if (this.tween) {
            this.tween.kill();
            this.clear();
        }
        const container = this.container;
        const shapes = this.shapes;
        const points = this.points;

        const width = renderer.width;
        const height = renderer.height;

        const center = {x: width / 2, y: height / 2};
        const axis = Math.random() > 0.5;
        const direction = Math.random() > 0.5;
        const style = this.style;

        let theta, deviation, radius;
        if (style == 'colorful') {
            const ox = axis? center.x: (direction? width * 1.125: width * - 0.125);
            const oy = !axis? center.y: (direction? height * 1.125: height * - 0.125);
            container.x = ox;
            container.y = oy;

            theta = Math.atan2(center.y - oy, center.x - ox);
            deviation = Math.PI / 2;
            radius = width;
        }
        else if (style == 'simple') {
            theta = Math.random() * Math.PI * 2; 
            deviation = Math.round(lerp(Math.PI / 4, Math.PI / 2, Math.random()));
            radius = height;
        }

        shapes.forEach((shape, idx) => {
            const t = theta + Math.random() * deviation * 2 - deviation;
            const r = Math.random() * radius;
            points[idx].x = r * Math.cos(t);
            points[idx].y = r * Math.sin(t);

            shape.x = 0;
            shape.y = 0;
        });
        this.parent.addChild(container);
    }

    clear() {
        this.tween = undefined;
        if (this.current)
            this.current.clear();
        this.parent.removeChild(this.container);
    }

    resize() {
        const container = this.container;
        const shapes = this.shapes;
        const colors = this.colors;
        const amount = this.amount;
        const style = this.style;

        const minRadius = (renderer.width < renderer.height ? renderer.width: renderer.height) * 12/900;
        const maxRadius = (renderer.width < renderer.height ? renderer.width: renderer.height) * 20/900;
        container.position.x = renderer.width / 2;
        container.position.y = renderer.height / 2;

        this.points = [...Array(amount).keys()].map((i) => {
            const radius = Math.round(lerp(minRadius, maxRadius, Math.random()));
            const color = style == 'simple'? COLORS.white.hex: colors[Math.random() * colors.length | 0];

            if (shapes[i])
                shapes[i].clear();
            else
                shapes[i] = new Graphics();
            const shape = shapes[i];
            shape.beginFill(color);
            shape.drawCircle(0, 0, radius);
            shape.endFill();
            return {x: 0, y: 0};
        });
    }
}

class strike {
    constructor() {
        const parent = getContainerByIndex(foreground, 4);
        const container = this.container = new Container();
        const shape = this.shape = new Graphics();

        this.color = COLORS.black.hex;
        this.resize();

        parent.addChild(container);
        container.addChild(shape);
    }

    play() {
        const self = this;

        this.reset();

        const options = {beginning: 0, ending: 0};
        const origin = this.origin;
        const destination = this.destination;

        this.tween = TweenLite.to(options, 0.25, {
            beginning: 1.0,
            ease: Circ.easeIn,
            onUpdate: () => {
                const t = options.beginning;
                const x = lerp(origin.x, destination.x, t);
                const y = lerp(origin.y, destination.y, t);
                self.redraw(origin, {x, y});
            },
            onComplete: animationOut
        });

        function animationOut(){
            self.tween = TweenLite.to(options, 0.25, {
                ending: 1.0,
                ease: Circ.easeOut,
                onUpdate: () => {
                    const t = options.ending;
                    const x = lerp(origin.x, destination.x, t);
                    const y = lerp(origin.y, destination.y, t);
                    self.redraw({x, y}, destination);
                },
                onComplete: () => self.clear()
            });
        };
    }

    redraw(p1, p2) {
        const shape = this.shape;
        shape.clear();
        shape.beginFill(this.color);
        shape.lineStyle({
            width: Math.round(this.ratio * 7) + 3,
            color: this.color,
            alpha: 1.0,
            cap: 'round'
        });
        shape.moveTo(p1.x, p1.y);
        shape.lineTo(p2.x, p2.y);
        shape.endFill();
    }

    reset() {
        if (this.tween) {
            this.tween.kill();
            this.clear();
        }

        const ratio = this.ratio = Math.random();
        const radius = Math.round(lerp(renderer.height * 0.5, renderer.width, ratio));
        const theta = Math.random() * Math.PI * 2;
        this.origin = {
            x: radius * Math.cos(theta),
            y: radius * Math.sin(theta)
        };
        this.destination = {
            x: radius * Math.cos(theta + Math.PI),
            y: radius * Math.sin(theta + Math.PI)
        };
    }

    clear() {
        this.tween = undefined;
        if (this.shape)
            this.shape.clear();
    }

    resize() {
        const container = this.container;
        container.position.x = renderer.width / 2;
        container.position.y = renderer.height / 2;
    }
}

class prism {
    constructor({style}) { // style: triangle, square or hexagon
        this.parent = getContainerByIndex(foreground, 11);
        const container = this.container = new Container();
        const shape = this.shape = new Graphics();

        const color = this.color = COLORS.black.hex;
        const amount = style == 'hexagon'? 6: (style == 'square'? 4: 3);
        const radius = 100;
        const pointRadius = 2;
        const lineWidth = 0.5;
        this.resize();

        const points = this.points = [...Array(amount).keys()].map(i => {
            const pct = i / amount;
            const theta = Math.PI * 2 * pct;
            const x = radius * Math.cos(theta);
            const y = radius * Math.sin(theta);
            shape.beginFill(color);
            shape.drawCircle(x, y, pointRadius);
            shape.endFill();
            return {x, y};
        });

        shape.beginFill(color, 0);
        shape.lineStyle(lineWidth, color);
        shape.moveTo(points[amount - 1].x, points[amount - 1].y);
        points.forEach(p => shape.lineTo(p.x, p.y));
        shape.endFill();

        container.addChild(shape);
    }

    play() {
        const self = this;

        this.reset();

        const options = {ending: 0};
        const scalar = 10;

        this.tween = TweenLite.to(options, 0.75, {
            ending: 1.0,
            ease: Circ.easeIn,
            onUpdate: () => {
                const t = options.ending;
                self.scale(t * scalar);
            },
            onComplete: () => self.clear()
        });
    }

    reset() {
        if (this.tween) {
            this.tween.kill();
            this.clear();
        }

        this.scale(0);
        this.parent.addChild(this.container);
    }

    clear() {
        this.tween = undefined;
        this.parent.removeChild(this.container);
    }

    scale(s) {
        this.shape.scale.x = s;
        this.shape.scale.y = s;
    }

    resize() {
        const container = this.container;
        container.position.x = renderer.width / 2;
        container.position.y = renderer.height / 2;
    }
}

class squiggle {
    constructor() {
        const parent = this.parent = getContainerByIndex(foreground, 3);
        const container = this.container = new Container();
        const shape = this.shape = new Graphics();

        this.color = COLORS.accent.hex;
        this.resize();

        parent.addChild(container);
        container.addChild(shape);
    }

    play() {
        const self = this;

        this.reset();

        const options = {beginning: 0, ending: 0};

        this.tween = TweenLite.to(options, 0.5, {
            beginning: 1.0,
            ease: Sine.easeOut,
            onUpdate: () => {
                const t = options.beginning;
                self.redraw(0.0, t);
            },
            onComplete: animationOut
        });

        function animationOut(){
            self.tween = TweenLite.to(options, 0.5, {
                ending: 1.0,
                ease: Sine.easeIn,
                onUpdate: () => {
                    const t = options.ending;
                    self.redraw(t, 1.0);
                },
                onComplete: () => self.clear()
            });
        };
    }

    redraw(startRatio, endRatio) {
        const shape = this.shape;
        const color = this.color;

        shape.clear();
        shape.beginFill(color, 0);
        shape.lineStyle({
            width: renderer.height / 40,
            color: color,
            alpha: 1.0,
            join: 'round',
            cap: 'round'
        });

        const ratioToIndex = ratio => Math.floor(this.amount * ratio);
        const points = this.points.slice(ratioToIndex(startRatio), ratioToIndex(endRatio));
        if (points.length) {
            shape.moveTo(points[0].x, points[0].y);
            points.forEach(p => shape.lineTo(p.x, p.y));
        }
        shape.endFill();
    }

    reset() {
        if (this.tween) {
            this.tween.kill();
            this.clear();
        }

        const direction = Math.random() > 0.5;
        this.shape.rotation =  direction * Math.PI;

        const amount = this.amount = 400;
        const width = renderer.width / 2;
        const height = renderer.height / 3;
        const phi = Math.round(Math.random() * 6) + 1;

        const offset = Math.PI * 0.5;
        this.points = [...Array(amount).keys()].map(i => {
            const pct = i / (amount - 1);
            const theta = Math.PI * 2 * pct * phi + offset;
            const x = lerp(- width / 2, width / 2, pct);
            const y = height * Math.sin(theta);
            return {x, y};
        });
    }

    clear() {
        this.tween = undefined;
        if (this.shape)
            this.shape.clear();
    }

    resize() {
        const container = this.container;
        container.position.x = renderer.width / 2;
        container.position.y = renderer.height / 2;
    }
}

class pinwheel {
    constructor() {
        const parent = getContainerByIndex(foreground, 2);
        const container = this.container = new Container();
        const shape = this.shape = new Graphics();

        this.color = COLORS.highlight.hex;
        this.amount = 8;
        this.resize();

        parent.addChild(container);
        container.addChild(shape);
    }

    play() {
        const self = this;

        this.reset();

        const options = {ending: 0};
        const current = this.current;
        const sequence = this.sequence;

        let idx = 0;
        this.tween = animationIn(idx);

        function animationIn(idx) {
            return TweenLite.to(current, 0.1, {
                ...sequence[idx],
                ease: Sine.easeOut,
                onUpdate: () => self.redraw(current),
                onComplete: () => (idx < sequence.length - 1)? self.tween = animationIn(++idx): animationOut()
            });
        }

        function animationOut(){
            self.tween = TweenLite.to(options, 0.1, {
                ending: 1.0,
                ease: Sine.easeOut,
                onUpdate: () => {
                    const t = options.ending;
                    self.shape.scale.x = 1 - t;
                    self.shape.scale.y = 1 - t;
                },
                onComplete: () => self.clear()
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

        const shape = this.shape;
        shape.scale.x = 1.0;
        shape.scale.y = 1.0;
        shape.rotation = Math.random() * Math.PI * 2;

        this.current = [...Array(this.amount * 2).keys()].map(() => 0);
    }

    clear() {
        this.tween = undefined;
        if (this.shape)
            this.shape.clear();
    }

    resize() {
        const container = this.container;
        const amount = this.amount;
        const radius = renderer.height / 5;
        const sequence = [];
        for (let num = 0; num < amount; num++) {
            const points = [];
            for (let i = 0; i < amount; i++) {
                const pct = (i <= num ? i : num)/ (num + 1);
                const theta = Math.PI * 2 * pct;
                const x = radius * Math.cos(theta);
                const y = radius * Math.sin(theta);
                points.push(x);
                points.push(y);
            };
            sequence.push(points);
        };
        this.sequence = sequence;

        container.position.x = renderer.width / 2;
        container.position.y = renderer.height / 2;
    }
}

class glimmer {
    constructor() {
        this.parent = getContainerByIndex(foreground, 1);
        const container = this.container = new Container();

        const amount = 12;
        const colors = Object.keys(COLORS).map(key => COLORS[key].hex).slice(1);
        this.points = [...Array(amount).keys()].map(() => {
            const color = colors[Math.random() * colors.length | 0];
            const shape = new Graphics();
            container.addChild(shape);
            return {color, shape};
        });
        this.resize();
    }

    play() {
        const self = this;

        this.reset();

        const points = this.points;
        this.tweens = points.map((point) => {
            return TweenLite.to(point, 0.2, {
                scale: 1,
                lineWidth: 0,
                ease: Sine.easeOut,
                delay: Math.random() * 0.5,
                onUpdate: () => self.redraw(point)
            });
        });
    }

    redraw({shape, x, y, radius, color, lineWidth, scale}) {
        shape.clear();
        shape.beginFill(color, 0);
        shape.lineStyle(lineWidth, color, 1);
        shape.drawCircle(0, 0, radius);
        shape.x = x;
        shape.y = y;
        shape.scale.x = scale;
        shape.scale.y = scale;
        shape.visible = true;
        shape.endFill();
    }

    reset() {
        if (this.tweens) {
            this.tweens.forEach(tween => tween.kill());
            this.clear();
        }

        const radius = renderer.height / 2;
        this.points.forEach(point => {
            const theta = Math.PI * 2 * Math.random();
            point.x = Math.random() * radius * Math.cos(theta);
            point.y = Math.random() * radius * Math.sin(theta);
            point.lineWidth = Math.random() * 20 + 40;
            point.scale = 0;
        });

        this.parent.addChild(this.container);
    }

    clear() {
        this.tweens = undefined;
        this.points.forEach(p => p.shape.visible = false);
        this.parent.removeChild(this.container);
    }

    resize() {
        const container = this.container;
        const minRadius = renderer.height * 20/900;
        const maxRadius = minRadius * 2;

        container.position.x = renderer.width / 2;
        container.position.y = renderer.height / 2;

        this.points.forEach(p => p.radius = Math.round(lerp(minRadius, maxRadius, Math.random())));
    }
}

class zigzag {
    constructor() {
        const parent = getContainerByIndex(foreground, 4);
        const container = this.container = new Container();
        const shape = this.shape = new Graphics();

        this.color = COLORS.black.hex;
        this.resize();

        parent.addChild(container);
        container.addChild(shape);
    }

    play() {
        const self = this;

        this.reset();

        const options = {beginning: 0, ending: 0};

        this.tween = TweenLite.to(options, 0.25, {
            beginning: 1.0,
            ease: Sine.easeOut,
            onUpdate: () => {
                const t = options.beginning;
                self.redraw(0.0, t);
            },
            onComplete: animationOut
        });

        function animationOut(){
            self.tween = TweenLite.to(options, 0.25, {
                ending: 1.0,
                ease: Sine.easeOut,
                onUpdate: () => {
                    const t = options.ending;
                    self.redraw(t, 1.0);
                },
                onComplete: () => self.clear()
            });
        };
    }

    redraw(startRatio, endRatio) {
        const shape = this.shape;
        const color = this.color;

        shape.clear();
        shape.beginFill(color, 0);
        shape.lineStyle({
            width: (renderer.width < renderer.height ? renderer.width: renderer.height) / 30,
            color: color,
            alpha: 1.0,
            join: 'miter',
            cap: 'butt'
        });

        const ratioToIndex = ratio => Math.floor(this.amount * ratio);
        const points = this.points.slice(ratioToIndex(startRatio), ratioToIndex(endRatio));
        if (points.length) {
            shape.moveTo(points[0].x, points[0].y);
            points.forEach(p => shape.lineTo(p.x, p.y));
        }
        shape.endFill();
    }

    reset() {
        if (this.tween) {
            this.tween.kill();
            this.clear();
        }

        const direction = Math.random() > 0.5;
        const position = Math.random() > 0.5;
        this.shape.rotation =  direction * Math.PI;
        this.shape.x = renderer.width * (position? 0.35: - 0.35);

        const amount = this.amount = 120;
        const width = renderer.width / 16;
        const height = renderer.height * 0.66;
        const phi = Math.round(Math.random() * 4) + 1;

        const offset = Math.PI * 0.5;
        this.points = [...Array(amount).keys()].map(i => {
            const pct = i / amount;
            const theta = Math.abs((((2 * (pct * Math.PI * 2 * phi + offset) / Math.PI) - 1) % 4) - 2) - 1;
            const x = theta * width / 2;
            const y = lerp(- height / 2, height / 2, pct);
            return {x, y};
        });
    }

    clear() {
        this.tween = undefined;
        if (this.shape)
            this.shape.clear();
    }

    resize() {
        const container = this.container;
        container.position.x = renderer.width / 2;
        container.position.y = renderer.height / 2;
    }
}

class spiral {
    constructor() {
        const parent = getContainerByIndex(foreground, 9);
        const container = this.container = new Container();
        const shape = this.shape = new Graphics();

        this.color = COLORS.black.hex;
        this.resize();

        parent.addChild(container);
        container.addChild(shape);
    }

    play() {
        const self = this;

        this.reset();

        const rotation = this.rotation;
        const scalar = this.scalar;
        const options = {beginning: 0, ending: 0, rotation, scalar};

        this.lineWidth = (renderer.width < renderer.height ? renderer.width: renderer.height) / this.amount;
        this.tween = TweenLite.to(options, 2.0, {
            beginning: 1.0,
            rotation: rotation + Math.PI / 8,
            scalar: Math.random() * 2 + 10,
            ease: Circ.easeIn,
            onUpdate: () => {
                const t = Math.min(lerp(0, self.resolution, options.beginning), 1);
                self.rotation = options.rotation;
                self.scalar = options.scalar;
                self.redraw(0.0, t);
            },
            onComplete: () => self.clear()
        });
    }

    redraw(startRatio, endRatio) {
        const shape = this.shape;
        const color = this.color;
        const lineWidth = this.lineWidth;

        shape.clear();
        shape.beginFill(color, 0);

        const amount = this.amount * 2;
        const ratioToIndex = ratio => Math.floor(amount * ratio);
        const points = this.points.slice(ratioToIndex(startRatio), ratioToIndex(endRatio));
        if (points.length) {
            points.forEach((p, i) => {
                const pct = i / amount;
                shape.lineStyle({
                    width: Math.sqrt(1 - pct) * lineWidth,
                    color: color,
                    alpha: 1.0,
                    join: 'round',
                    cap: 'round'
                });

                if (i % 2 === 0)
                    shape.moveTo(p.x, p.y);
                else
                    shape.lineTo(p.x, p.y);
            });
        }
        shape.endFill();

        this.container.rotation = this.rotation;
        this.shape.scale.x = this.scalar;
        this.shape.scale.y = this.scalar;
    }

    reset() {
        if (this.tween) {
            this.tween.kill();
            this.clear();
        }

        const container = this.container;
        const shape = this.shape;
        const rotation = this.rotation = Math.random() * Math.PI * 2;
        const scalar = this.scalar = 1.0;

        container.rotation = rotation;
        shape.scale.x = scalar;
        shape.scale.y = scalar;

        const amount = this.amount = 120;
        const resolution = this.resolution = 4;
        const magnitude = (renderer.width < renderer.height ? renderer.width: renderer.height) / 2;

        const points = this.points = [];
        [...Array(amount).keys()].forEach(i => {
            let pct = i / amount;
            const radius = () => magnitude * pct;
            const theta = () => Math.PI * pct * resolution;

            const x1 = radius() * Math.cos(theta());
            const y1 = radius() * Math.sin(theta());
            points.push({x: x1, y: y1});

            pct = (i + 0.25) / amount;
            const x2 = radius() * Math.cos(theta());
            const y2 = radius() * Math.sin(theta());
            points.push({x: x2, y: y2});
        });
        this.points.reverse();
    }

    clear() {
        this.tween = undefined;
        if (this.shape)
            this.shape.clear();
    }

    resize() {
        const container = this.container;
        container.position.x = renderer.width / 2;
        container.position.y = renderer.height / 2;
    }
}

function lerp(min, max, fraction){
    return (max - min) * fraction + min;
}
