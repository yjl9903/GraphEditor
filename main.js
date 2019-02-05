// const mode
const NO_MODE = -1, WAIT_MODE = 0, DRAG_MODE = 1, LINK_MODE = 2, PAINT_MODE = 3;

function distance(x, y) {
    return Math.sqrt(1.0 * (x.x - y.x) * (x.x - y.x) + 1.0 * (x.y - y.y) * (x.y - y.y));
}
function isLineCross(a, b, c, d) {
    let u = (c.x - a.x) * (b.y - a.y) - (b.x - a.x) * (c.y - a.y);
    let v = (d.x - a.x) * (b.y - a.y) - (b.x - a.x) * (d.y - a.y);
    let w = (a.x - c.x) * (d.y - c.y) - (d.x - c.x) * (a.y - c.y);
    let z = (b.x - c.x) * (d.y - c.y) - (d.x - c.x) * (b.y - c.y);
    return u * v < 0 && w * z < 0;
}

function GraphEditor(dom) {
    // emit redraw
    function emit(name = 'draw') {
        document.dispatchEvent(new Event(name, { bubbles: false }));
    }

    {   // Class Vertex, Edge
        function Vertex(name, x = 0, y = 0) {
            this.name = name;
            // this.val = {}
            this.x = x;
            this.y = y;
            this.tos = [];
        }
        Vertex.prototype.color = '#fff';
        Vertex.prototype.radius = 40;
        Vertex.prototype.move = function(x, y) {
            this.x = x; this.y = y;
        };
        Vertex.prototype.link = function(v, d = 0) {
            this.tos.push(new Edge(v, d));
        }
        Vertex.prototype.light = function(color = '#ffb3ba') {
            this.color = color;
        } 
        Vertex.prototype.unlight = function() {
            delete this.color;
        }
        
        function Edge(v, d = 0) {
            this.to = v;
            this.dis = d;
        }
        Edge.prototype.color = '#000';
        Edge.prototype.width = 2;
        Edge.prototype.light = function(color = '#ffb3ba') {
            // this.color = color;
            this.width = 4;
        }
        Edge.prototype.unlight = function() {
            // delete this.color;
            delete this.width;
        }
    }

    const Graph = (function(){        
        let n = 0, m = 0, vertex = {};
    
        const clear = function() {
            n = 0; m = 0;
            for (let key in vertex) delete vertex[key];
            emit();
        };
    
        const add = function(name, x = 0, y = 0) {
            if (name in vertex) {
                console.log('same name');
                return false;
            }
            n += 1;
            vertex[name] = new Vertex(name, x, y);
            emit();
            return true;
        };
        const link = function(u, v, d = 1) {
            if (u && v && u !== v) {
                m += 2;
                u.link(v, d);
                v.link(u, d);
            } else {
                console.log('Link Error');
                return false;
            }
            emit();
            return true;
        }
        const del = function(u) {
            for (let v of u.tos) {
                let tmp = [];
                for (let w of v.to.tos) {
                    if (w.to.name !== u.name) tmp.push(w);
                }
                v.to.tos = tmp;
            }
            delete vertex[u.name];
            emit();
        }
        
        const forVertex = function(f) {
            for (let x in vertex) {
                f(vertex[x]);
            }
        }
        const forEdge = function(f) {
            for (let x in vertex) {
                for (let e of vertex[x].tos) {
                    f(vertex[x], e);
                }
            }
        }
        const findVertex = function(mx, my) {
            let m = { x: mx, y: my }, mn = Number.MAX_VALUE, v = null;
            forVertex(function(x) {
                if (distance(x, m) < mn) {
                    mn = distance(x, m); 
                    v = x;
                }
            });
            if (mn < Vertex.prototype.radius) return v;
            else return null;
        }
    
        return {
            clear, add, link, del, forVertex, forEdge, findVertex
        };
    })();

    let mode = WAIT_MODE, that = this, count = 1;

    const gcvs = function(sk) {
        const abs = sk.abs;
        function isInCanvas() {
            if (sk.mouseX < 0 || sk.mouseY < 0 || sk.mouseX > sk.width || sk.mouseY > sk.height) return false;
            return true;
        }

        document.addEventListener('draw', function() {
            sk.redraw();
        });

        const PAINT_SIZE = 15, PAINT_COLOR = 'red';
        let tot = null, time_id = -1, start = null;

        const reset = () => {
            if (time_id !== -1) clearTimeout(time_id), time_id = -1;
            mode = WAIT_MODE;
            sk.noLoop();
            tot = null;
            time_id = -1;
        };

        const actions = {
            '0': {
                pressed: () => {
                    tot = Graph.findVertex(sk.mouseX, sk.mouseY);
                    start = {x: sk.mouseX, y: sk.mouseY};

                    if (tot) {
                        time_id = setTimeout(() => {
                            if (distance(tot, { x: sk.mouseX, y: sk.mouseY}) < tot.radius) {
                                tot.move(sk.mouseX, sk.mouseY);
                                mode = DRAG_MODE;
                                tot.light();
                            }
                        }, 300);
                        mode = LINK_MODE;
                        start = {x: tot.x, y: tot.y};
                    }
                    sk.loop();
                },
                dragged: () => {
                    // console.log('WAIT_MODE: dragged');
                },
                released: () => {
                    if (isInCanvas()) {
                        let flag = true;
                        const end = {x: sk.mouseX, y: sk.mouseY};
                        Graph.forVertex((u) => {
                            let ntos = [];
                            for (let i = 0; i < u.tos.length; i++) {
                                let v = u.tos[i].to;
                                if (isLineCross(start, end, u, v)) {
                                    flag = false;
                                } else {
                                    ntos.push(u.tos[i]);
                                }
                            }
                            u.tos = ntos;
                        });
                        if (flag) {
                            Graph.add(count, sk.mouseX, sk.mouseY);
                            count += 1;
                        }
                    }
                    reset();
                }
            },
            '1': {
                dragged: () => {
                    tot.move(sk.mouseX, sk.mouseY);
                },
                released: () => {
                    tot.unlight();
                    if (sk.mouseX < 0 || sk.mouseY < 0 || sk.mouseX > sk.width || sk.mouseY > sk.height) {
                        Graph.del(tot);
                    }
                    reset();
                }
            },
            '2': {
                dragged: () => {
                    if (time_id !== -1 && distance(tot, { x: sk.mouseX, y: sk.mouseY }) >= tot.radius) 
                        clearTimeout(time_id), time_id = -1;
                },
                released: () => {
                    Graph.link(tot, Graph.findVertex(sk.mouseX, sk.mouseY));
                    reset();
                }
            },
            '3': {
                pressed: () => {
                    sk.loop();
                },
                dragged: () => {
                    if (!isInCanvas()) return;

                    sk.fill(PAINT_COLOR);
                    sk.ellipse(sk.mouseX, sk.mouseY, PAINT_SIZE);
                    
                    let dis = distance({x: sk.pmouseX, y: sk.pmouseY}, {x: sk.mouseX, y: sk.mouseY});
                    if (dis < PAINT_SIZE / 2.0) return;
                    
                    let x = 1.0 * sk.pmouseX, y = 1.0 * sk.pmouseY;
                    let dx = 1.0 * (sk.mouseX - sk.pmouseX) / dis, dy = 1.0 * (sk.mouseY - sk.pmouseY) / dis;

                    for (; distance({x: x, y: y}, {x: sk.mouseX, y: sk.mouseY}) > 1; x += dx, y += dy) {
                        sk.ellipse(x, y, PAINT_SIZE);
                    }
                },
                released: () => {
                    sk.noLoop();
                }
            }
        };

        sk.setup = function() {
            sk.createCanvas(800, 600);
            sk.noLoop();

            sk.textSize(18);
            sk.textFont('Consolas');
            sk.textAlign(sk.CENTER, sk.CENTER);

            sk.background(220);
        };
        
        sk.draw = function() {
            if (mode !== PAINT_MODE) sk.background(220);
    
            if (mode === LINK_MODE && start) {
                sk.strokeWeight(2);
                sk.stroke('#000');
                sk.line(start.x, start.y, sk.mouseX, sk.mouseY);
            }
    
            Graph.forEdge((u, e) => {
                let v = e.to;
                sk.strokeWeight(e.width);
                sk.stroke(e.color);
                sk.line(u.x, u.y, v.x, v.y);
            });
    
            sk.stroke('#000');
            sk.strokeWeight(2);
            Graph.forVertex((x) => {
                sk.fill(x.color);
                sk.ellipse(x.x, x.y, x.radius);
            });
    
            sk.noStroke();
            sk.fill('#000');
            Graph.forVertex((x) => {
                sk.text(x.name, x.x, x.y);
            });

            if (mode === DRAG_MODE && tot) {
                sk.stroke('#000');
                sk.strokeWeight(2);
                sk.fill(tot.color);
                sk.ellipse(tot.x, tot.y, tot.radius);
                sk.noStroke();
                sk.fill('#000');
                sk.text(tot.name, tot.x, tot.y);
            }
        };

        sk.mousePressed = function() {
            if (sk.mouseX < 0 || sk.mouseY < 0 || sk.mouseX > sk.width || sk.mouseY > sk.height) return;

            if (mode !== NO_MODE) actions[mode].pressed();
        };
        sk.mouseDragged = function() {

            if (mode !== NO_MODE) actions[mode].dragged();
        }
        sk.mouseReleased = function() {

            if (mode !== NO_MODE) actions[mode].released();
        }

        that.changeMode = function(x) {
            // if (mode !== WAIT_MODE) return;
            mode = x;
            if (mode !== PAINT_MODE) sk.redraw();
        }

        that.clear = function() {
            sk.background(220);
            Graph.clear();
            count = 1;
        };
    }

    new p5(gcvs, dom);
}

new Vue({
    el: '#app',
    data: {
        editor: Object,
    },
    methods: {
        changeMode(s) {
            // console.log(s);
            this.editor.changeMode(parseInt(s));
        },
        clear() {
            this.editor.clear();
        }
    },
    mounted() {
        this.editor = new GraphEditor('container');
    },
});