let game = new Game({
    width: 1920,
    height: 1080,
    init: {
        create: create,
        update: update,
        preload: preload
    },
    antialias: 1, // scene will be 4x zoom should be in range of 1 and 10
    style: {
        width: '100%',
        height: 600,
        background: '#f2f2f2'
    },
})

$.titleBlink('game')

function preload() {
    // null check
}

function create() {
    const _game = this;

    //let fpsMeter = this.draw.text(game.loop.currentFPS, 10, 20, { id: 'fpsMeter', font: "20px Calibri" }, { fillStyle: 'white', strokeStyle: "white" });

    this.Firefork = function (x, y, isFirework, colored) {
        let opacity = Math.random() + 0.5;

        let color = `rgba(${game.randomInt(0, 255)}, ${game.randomInt(0, 255)}, ${game.randomInt(0, 255)})`;

        if (isFirework) this.firework = _game.draw.circle({ x: x, y: y, radius: 2 }, { fillStyle: color, strokeStyle: color });

        if (!isFirework) {
            this.firework = _game.draw.circle({ x: x, y: y, radius: 1.5 }, { fillStyle: colored, strokeStyle: colored });
        };

        this.accelerate = function (vector = new game.vec2d(0, 0)) {
            this.firework.accelerate(vector, false);
        }
        this.firework.update(e => {
            if (e.gravity.speedY + e.gravity.gravitySpeed > game.randomInt(0, 10)) {
                if (isFirework) {
                    for (let i = 0; i < 150; i++) {
                        game.context.globalAlpha = 1
                        let f = new _game.Firefork(e.style.x, e.style.y, false, color);

                        let vy = game.randomInt(-13, -10) * Math.random();
                        let vx = game.randomInt(-4, 4) * Math.random();

                        while (vx == 0 || vy == 0) {
                            vy = game.randomInt(-13, -10) * Math.random();
                            vx = game.randomInt(-4, 4) * Math.random();
                        }

                        f.firework.gravity.mass = game.randomInt(3, 6)
                        f.firework._configs.radius -= 0.1;
                        f.firework.gravity.speedX = game.randomInt(-5, 0)

                        f.color = color;

                        f.firework.opacity = {
                            stroke: 1,
                            fill: 1
                        };

                        f.accelerate(new game.vec2d(vx, vy));
                        f.firework.render(e => {

                            e.ctxStyle.strokeStyle = `rgba(255, 255, 255, ${e.opacity.stroke})`;
                            e.ctxStyle.fillStyle = f.color.split(")")[0] + ' ,' + e.opacity.fill + ')';

                            e.opacity.stroke -= 0.1;
                            e.opacity.fill -= Math.random() / 50;

                            if (e.opacity.fill < 0) {
                                e.destroy();
                            }
                        })
                    }
                    e.destroy();
                }
            }
        })
    }

    function fire() {
        let vy = game.randomInt(9, 13);
        let vx = game.randomInt(-3, 3);

        let xAxis = game.randomInt(100, window.innerWidth - 100);

        let f1 = new this.Firefork(xAxis, 1000, true);
        f1.accelerate(new game.vec2d(vx, -vy))


        let mult = game.randomInt(-2, 2);

        while (mult == 0) {
            let f1 = new this.Firefork(xAxis, 1000, true);
            f1.accelerate(new game.vec2d(vx, -vy))
            mult = game.randomInt(-1, 1);
        }
    }

    setInterval(function () {
        fire()
    }, 300)

}

function update() {
    game.context.globalAlpha = .7;
    $("#fps").innerHTML = game.loop.currentFPS;
    $("#particles").innerHTML = Object.keys(game.scene.Objects).length;
}