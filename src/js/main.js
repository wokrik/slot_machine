const LINES = 5; // qty of vertical lines
const VERTICAL_SLOTS = 3; // qty of images in vertical line
const ACCELERATION = .15; // px per frame
const ACCELERATION_DURATION = 1500; // acceleration period
const SPINNING_DURATION = 2000; // spinning period
const SLOT_HEIGHT = 100;
const SLOT_WIDTH = 100;
const TURNOVERS_TO_STOP = 3; // full turnovers between spinning period and stopping

const startBtn = document.getElementById('start');
const fpsInfo = document.getElementById('fps');

const defaultSlotOptions = {
    height: SLOT_HEIGHT,
    width: SLOT_WIDTH,
    img: './img/slots.png',
    extraTurnovers: 0, // qty of turnovers after left line stops
    index: 0
}

const lastPositions = []; // last position of each vertical line after stop spinning
const slots = []; // all instances of Slot on page
let slotsDoneDigit = 0;
let lastFps = 0;

// returns "random" integer between 0 and max - 1
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

const app = new PIXI.Application({
    transparent: true,
    height: SLOT_HEIGHT * VERTICAL_SLOTS
});
document.getElementById('slotMachine').appendChild(app.view);

class Slot {
    constructor(options) {
        this.height = options.height;
        this.width = options.width;
        this.img = options.img;
        this.extraTurnovers = options.extraTurnovers;
        this.index = options.index;
        lastPositions[this.index] = 0;
    }
    texture = new PIXI.Texture.from('img/slots.png');
    tilingSprite = new PIXI.TilingSprite(this.texture, SLOT_WIDTH + 2, SLOT_HEIGHT * VERTICAL_SLOTS);

    add() {
        this.tilingSprite.x = this.index * this.width;
        app.stage.addChild(this.tilingSprite);
    }

    spin() {
        let firstLoop = true; // now is first loop of cycle
        let deceleration = 0; // "speed" of deceleration
        const distanceToStop = (TURNOVERS_TO_STOP + this.extraTurnovers)* (SLOT_HEIGHT * VERTICAL_SLOTS); // distance sprite should "go" before stopping
        let distanceBehind = 0; // distance gone after 'spinning' phase
        let speed = 0; // current speed of spinning
        const startTime = performance.now();
        const animate = () => {
            const time = performance.now();
            const diff = time - startTime;
            if(diff < ACCELERATION_DURATION) { // acceleration phase
                speed += ACCELERATION;
                this.tilingSprite.tilePosition.y = lastPositions[this.index] + speed * speed / 2 / ACCELERATION;
            } else if(diff < ACCELERATION_DURATION + SPINNING_DURATION) { // spinning phase
                this.tilingSprite.tilePosition.y += speed + getRandomInt(30);
            } else { // deceleration phase
                if(firstLoop) {
                    this.tilingSprite.tilePosition.y = Math.ceil(this.tilingSprite.tilePosition.y / SLOT_HEIGHT) * SLOT_HEIGHT;
                    deceleration = speed * speed / 2 / distanceToStop;
                    firstLoop = false;
                }
                if(speed > 0) {
                    distanceBehind += speed;
                    if(distanceBehind <= distanceToStop) {
                        this.tilingSprite.tilePosition.y += speed;
                    }
                    if(speed - deceleration <= 0) {
                        this.tilingSprite.tilePosition.y = Math.ceil(this.tilingSprite.tilePosition.y / SLOT_HEIGHT) * SLOT_HEIGHT;
                    }
                    speed -= deceleration;
                } else {
                    lastPositions[this.index] = this.tilingSprite.tilePosition.y;
                    slotsDoneDigit += 1;
                    if(slotsDoneDigit === LINES) {
                        startBtn.classList.remove('busy');
                        startBtn.classList.add('blink');
                    }
                    return;
                }
            }
            const fps = Math.ceil(app.ticker.FPS);
            if(fps !== lastFps) {
                fpsInfo.innerText = fps;
            }
            requestAnimationFrame(animate);
        }
        animate();
    }
}

// creating slots
for(let i = 0; i < LINES; i++) {
    const slot = new Slot({...defaultSlotOptions, ...{index: i, extraTurnovers: i}});
    slot.add();
    slots.push(slot);
}

// starting game
startBtn.addEventListener('click', function () {
    if(!this.classList.contains('busy')) {
        slotsDoneDigit = 0;
        slots.forEach(function (slot) {
            slot.spin();
        })
        this.classList.add('busy');
        this.classList.remove('blink');
    }
})

