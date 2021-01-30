/*
    # author: fuong74200
    # require
        -> avail.js
    # comments
        -> This is just a beta test version of game.js
           there is may exist some of performance issues
    # license
        -> Private use only
*/

const Game = function (cfgs = {}) {

    console.log('ready');

    const self = this;

    this.canvas;
    this.context;

    this.clearCache = function () {
        // this will remove all scene.discardedObjects which may cause a lot of error logs due to missing object
        self.scene.discardedObjects = {};
    }

    let _readyState = false;

    this.scene = {
        Objects: {},
        mainCamera: {
            x: 0,
            y: 0,
            renderSize: {
                width: 1920,
                height: 1080
            }
        },
        discardedObjects: {},
        getObjectById: function (id) {
            if (this.Objects[id]) {
                let object = this.Objects[id];
                object.destroy = function () {
                    self.scene.discardedObjects[id] = {
                        ...self.scene.Objects[id]
                    };
                    delete self.scene.Objects[id];
                };
                return object;
            } else {
                return self.scene.discardedObjects[id];
            }
        }
    }

    this.loop = {
        FPS: 60,
        currentFPS: 0,
    }

    this.vec2d = function (x = 0, y = 0) {
        return {
            x: x,
            y: y
        }
    }

    this.randomInt = function (minimum, maximum) {
        var randomnumber = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
        return randomnumber;
    }

    let ctx;
    let canvas;

    let defaultConfigs = {
        width: 800,
        height: 600,
        sceneHeight: cfgs.height * (cfgs.antialias / 2) || 1200,
        sceneWidth: cfgs.width * (cfgs.antialias / 2) || 1600,
        naturalWidth: cfgs.width || 800,
        naturalHeight: cfgs.height || 600,
        antialias: 1,
        containerID: 'game',
        style: {
            backgroundColor: '#b1b1b1',
        },
        init: {
            preload: _preload,
            create: _create,
            update: _update
        },
        container: document.getElementsByTagName('body')[0],
        ...cfgs
    }

    this.storage = {
        images: {}
    }

    this.configs = {
        ...defaultConfigs
    }

    defaultConfigs.init.create = cfgs.init.create.bind(_create())

    function _createCanvas() {
        let container = document.createElement('div');
        container.style.width = defaultConfigs.naturalWidth;
        container.style.height = defaultConfigs.naturalHeight;

        let canvas = document.createElement('canvas');
        canvas.width = defaultConfigs.width;
        canvas.height = defaultConfigs.height;
        for (let key of Object.keys(defaultConfigs.style)) {
            canvas.style[key] = defaultConfigs.style[key]
        }
        defaultConfigs.container.appendChild(container).appendChild(canvas);
        self.canvas = canvas;
        self.context = canvas.getContext('2d');
    }

    const _INIT = (function () {
        _createCanvas();

        ctx = self.context;
        canvas = self.canvas;

        // anti aliasing zoom
        canvas.width = defaultConfigs.width * defaultConfigs.antialias;
        canvas.height = defaultConfigs.height * defaultConfigs.antialias;
        canvas.style.width = defaultConfigs.width;
        canvas.style.height = defaultConfigs.height;
        ctx.scale(defaultConfigs.antialias, defaultConfigs.antialias);

        startAnimating(self.loop.FPS);
    })();

    defaultConfigs.init.update = cfgs.init.update.bind(self);

    // events

    canvas.onclick = function (e) {
        let mouseX = e.clientX - canvas.getBoundingClientRect().left;
        let mouseY = e.clientY - canvas.getBoundingClientRect().top;
        let target = null;
        for (let object of Object.entries(self.scene.Objects)) {
            let obj = object[1];
            if (
                mouseX >= obj.style.x
                && mouseX <= obj.style.x + obj.style.width
                && mouseY >= obj.style.y
                && mouseY <= obj.style.y + obj.style.height
            ) {
                target = obj
            }
        }
        e.gameObject = target;
        if (target) {
            for (let click of target._ioEvents.click) {
                click(e);
            }
        }
    }

    function _update() { }

    function _create() {
        let _self = this;
        this.add = {
            object: function (configs) {
                let objectConfigs = {
                    id: $.md5(Math.random().toString()),
                    _name: 'node',
                    collider: {
                        width: 0,
                        height: 0,
                        offsetTop: 0,
                        offsetLeft: 0,
                    },
                    destroy: function () {
                        self.scene.Objects[this.id]._updateEvents = [];
                        self.scene.Objects[this.id]._renderEvents = [];
                        delete self.scene.Objects[this.id]
                    },
                    gravity: {
                        speedX: 0,
                        speedY: 0,
                        gravity: 0.1,
                        gravitySpeed: 0,
                        onGround: false,
                        mass: 0,
                    },
                    hitGound: function (collider) {
                        let ground = self.configs.sceneHeight - this.style.y;
                        if (this.style.y + this.style.height + this.gravity.mass - (this.gravity.gravitySpeed + this.gravity.speedY) > ground && this.gravity.onGround == false) {
                            if (collider) this.style.y = ground - this.style.height - this.gravity.gravitySpeed + this.gravity.speedY - 1 - this.gravity.mass;
                            if (this.gravity.gravitySpeed > 0 && this.gravity.speedY > 0) {
                                this.gravity.gravitySpeed = -this.gravity.gravitySpeed;
                            } else {
                                this.gravity.speedY = -this.gravity.speedY;
                                this.gravity.gravitySpeed = -this.gravity.gravitySpeed;
                            }
                            if (this.gravity.gravitySpeed < 0.5 && this.gravity.gravitySpeed > -.5) {
                                this.gravity.gravitySpeed = 0;
                                this.gravity.speedX -= 0.05;
                                this.gravity.speedY = 0;
                                this.gravity.onGround = true;
                            }
                        } else if (this.gravity.onGround) {
                            this.gravity.gravitySpeed = 0;
                            this.gravity.speedX -= 0.05;
                            if (this.gravity.speedX > -.5 && this.gravity.speedX < .5) {
                                this.gravity.speedX = 0;
                            }
                            if (collider) this.style.y = ground - this.style.height - this.gravity.gravitySpeed + this.gravity.speedY - 1 - this.gravity.mass;
                        }
                    },
                    accelerate: function (vector = new self.vec2d(1, 1), collider = true) {
                        if (vector.x != 0 && vector.y != 0) {
                            this.gravity.onGround = false;
                        }
                        let obj = self.scene.Objects[objectConfigs.id];
                        obj.gravity.speedX = vector.x;
                        obj.gravity.speedY = vector.y;
                        obj.update(e => {
                            obj.gravity.gravitySpeed += obj.gravity.gravity;
                            obj.style.x += obj.gravity.speedX;
                            obj.style.y += obj.gravity.speedY + obj.gravity.gravitySpeed + this.gravity.mass;
                            if (collider) this.hitGound(collider);
                        })
                    },
                    style: {
                        x: 0,
                        y: 0,
                        width: 0,
                        height: 0,
                        display: 'none',
                        marginTop: 0,
                        marginRight: 0,
                        marginBottom: 0,
                        marginLeft: 0,
                        transform: {
                            scale: 1
                        }
                    },
                    _updateEvents: [],
                    _renderEvents: [],
                    _ioEvents: {
                        click: [],
                    },
                    on: function (event, callback = function () { }) {
                        this._ioEvents[event].push(callback);
                    },
                    update: function (callback) {
                        this._updateEvents.push(callback)
                    },
                    render: function (callback) {
                        this._renderEvents.push(callback)
                    },
                    ...configs
                }
                self.scene.Objects[objectConfigs.id] = {
                    ...objectConfigs
                }
                return self.scene.Objects[objectConfigs.id];
            }
        };
        this.draw = {
            circle: function (configs = {}, ctxStyle = {}) {

                _configs = {
                    x: 0,
                    y: 0,
                    radius: 0,
                    startAngle: 0,
                    endAngle: 2 * Math.PI,
                    ...configs,
                }

                let out = _self.add.object({
                    _configs: {
                        ..._configs
                    },
                    style: {
                        x: _configs.x,
                        y: _configs.y,
                        width: _configs.radius * 2,
                        height: _configs.radius * 2,
                    },
                    ctxStyle: {
                        ...ctxStyle
                    }
                });

                out.render(function (e) {
                    ctx.beginPath();
                    for (let key of Object.keys(e.ctxStyle)) {
                        ctx[key] = e.ctxStyle[key];
                    };
                    ctx.arc(e.style.x, e.style.y, e._configs.radius, e._configs.startAngle, e._configs.endAngle);
                    ctx.fill();
                    ctx.stroke();
                })

                return out;
            },

            text: function (content, x = 0, y = 0, configs = {}, ctxStyle = {}) {

                _configs = {
                    font: "30px Arial",
                    x: 0,
                    y: 0,
                    ...configs
                }

                for (let key of Object.keys(_configs)) {
                    ctx[key] = _configs[key]
                };

                let id = _configs.id || $.md5(Math.random().toString());

                let out = _self.add.object({
                    id: id,
                    _text: {
                        ..._configs,
                        content: content
                    },
                    style: {
                        x: x,
                        y: y,
                        width: 80,
                        height: 80
                    },
                    ctxStyle: {
                        ...ctxStyle
                    }
                })

                out.render(function (e) {
                    for (let key of Object.keys(e.ctxStyle)) {
                        ctx[key] = e.ctxStyle[key];
                    };
                    ctx.fillText(e._text.content, x, y);
                })

                return out;
            }
        }
    }

    let times = [];
    let fps;

    function startAnimating(fps) {
        fpsInterval = 1000 / fps;
        then = Date.now();
        startTime = then;
        animate();
    }

    function animate() {
        requestAnimationFrame(animate);
        now = Date.now();
        elapsed = now - then;
        if (elapsed > fpsInterval) {
            then = now - (elapsed % fpsInterval);

            ctx.globalAlpha = 1
            ctx.fillStyle = "rgba(0, 0, 0, .1)";
            ctx.fillRect(0, 0, self.configs.naturalWidth, self.configs.naturalWidth)


            // code goes following

            _renderObjects()

            if (_readyState) defaultConfigs.init.update();

            let now1 = performance.now();
            while (times.length > 0 && times[0] <= now1 - 1000) {
                times.shift();
            }
            times.push(now1);
            self.loop.currentFPS = times.length;
        }
    }

    function isOutofScene() {

    }

    function _renderObjects() {
        const keys = Object.keys(self.scene.Objects) || Object.keys(game.scene.discardedObjects);
        for (let key of keys) {
            if (self.scene.Objects[key]) {
                for (let event of self.scene.Objects[key]._updateEvents) {
                    event(self.scene.Objects[key]);
                }
            }
            if (self.scene.Objects[key]) {
                for (let event of self.scene.Objects[key]._renderEvents) {
                    event(self.scene.Objects[key]);
                }
            }
        }
    }

    function _preload() {
        let _self = this;

        this._stacks = 0; // number of remaining files
        this._maxStacks = 0;
        this._filesSize = 0;
        this._onLoading = 'undefined';


        this.onprogress = function () { } // this event will be throw every times a file was loaded
        this.oncomplete = function () { } // this event will be throw when all files were loaded

        this.onprogress.bind(_self)
        this.oncomplete.bind(_self)

        function completeStack(imageInfo) {
            _self._stacks--;
            self.storage.images[imageInfo.label] = {
                ...imageInfo
            }

            if (_self._stacks == 0) {
                this.onprogress();
                this.oncomplete();
                _readyState = true;
                defaultConfigs.init.create();
            } else {
                this.onprogress();

                let iTime = performance.getEntriesByName(imageInfo.image.src)[0];
                _self._filesSize += iTime.transferSize
            }

        }

        _loadImage = function (label, url) {
            _self._stacks++;
            _self._maxStacks++;

            let image = new Image();
            image.src = url;

            _self._onLoading = `${label} : ${url}`;

            image.onerror = function (event) {
                completeStack({
                    image: null,
                    event: event,
                    label: label,
                    url: url,
                    width: image.naturalWidth,
                    height: image.naturalHeight
                })
            }

            image.onload = event => {
                completeStack({
                    image: image,
                    event: event,
                    label: label,
                    url: url,
                    width: image.naturalWidth,
                    height: image.naturalHeight
                })
            }
        }

        this.loadImage = function (label, url) {
            setTimeout(function () {
                _loadImage(label, url)
            }, _self._maxStacks / 1000)
        }

        loadImage(`avatar_1`, "none.jpg");
    }

    defaultConfigs.init.preload = cfgs.init.preload.bind(_preload())

    defaultConfigs.init.preload();

}