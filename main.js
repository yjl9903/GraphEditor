

function GraphEditor(dom) {
    // const mode
    const NO_MODE = 0, DRAG_MODE = 1, LINK_MODE = 2, PAINT_MODE = 3;

    // emit redraw
    function emit(name = 'draw') {
        document.dispatchEvent(new Event(name, { bubbles: false }));
    }
    function distance(x, y) {
        return Math.sqrt((x.x - y.x) ** 2 + (x.y - y.y) ** 2);
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

    let mode = NO_MODE;
    const actions = (function() {
        
    })();

    const gcvs = function(sk) {
        document.addEventListener('draw', function() {
            sk.redraw();
        });

        sk.setup = function() {
            sk.createCanvas(800, 600);
            sk.noLoop();

            sk.textSize(18);
            sk.textFont('Consolas');
            sk.textAlign(sk.CENTER, sk.CENTER);
        };
        
        sk.draw = function() {
            sk.background(220);
    
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
        };

        sk.mousePressed = function() {
            if (sk.mouseX < 0 || sk.mouseY < 0 || sk.mouseX > sk.width || sk.mouseY > sk.height) return;
            
        };
        sk.mouseDragged = function() {

        }
        sk.mouseReleased = function() {

        }
    }

    new p5(gcvs, dom);
}

new Vue({
    el: 'container',
    data: {

    },
    methods: {
        
    },
    mounted() {
        new GraphEditor('container');
    },
});