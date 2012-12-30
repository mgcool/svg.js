/* svg.js v0.1-45-g44be0ce - svg container element event group arrange defs clip gradient doc shape rect ellipse poly path image text sugar - svgjs.com/license */
(function() {

  this.SVG = {
    // define default namespaces
    ns:         'http://www.w3.org/2000/svg',
    xlink:      'http://www.w3.org/1999/xlink',
    
    // method for element creation
    create: function(e) {
      return document.createElementNS(this.ns, e);
    },
    
    // method for extending objects
    extend: function(o, m) {
      for (var k in m)
        o.prototype[k] = m[k];
    }
    
  };

  SVG.Container = {
    
    // add given element at goven position
    add: function(e, i) {
      if (!this.has(e)) {
        i = i == null ? this.children().length : i;
        this.children().splice(i, 0, e);
        this.node.insertBefore(e.node, this.node.childNodes[i] || null);
        e.parent = this;
      }
      
      return this;
    },
    
    // basically does the same as add() but returns the added element rather than 'this'
    put: function(e, i) {
      this.add(e, i);
      return e;
    },
    
    // chacks if the given element is a child
    has: function(e) {
      return this.children().indexOf(e) >= 0;
    },
    
    // returns all child elements and initializes store array if non existant
    children: function() {
      return this._children || (this._children = []);
    },
    
    // remove a given child element
    remove: function(e) {
      return this.removeAt(this.children().indexOf(e));
    },
    
    // remove child element at a given position
    removeAt: function(i) {
      if (0 <= i && i < this.children().length) {
        var e = this.children()[i];
        this.children().splice(i, 1);
        this.node.removeChild(e.node);
        e.parent = null;
      }
      
      return this;
    },
    
    // returns defs element and initializes store array if non existant
    defs: function() {
      return this._defs || (this._defs = this.put(new SVG.Defs(), 0));
    },
    
    // re-level defs to first positon in element stack
    level: function() {
      return this.remove(d).put(this.defs(), 0);
    },
    
    // create a group element
    group: function() {
      return this.put(new SVG.G());
    },
    
    // create a rect element
    rect: function(w, h) {
      return this.put(new SVG.Rect().size(w, h));
    },
    
    // create circle element, based on ellipse
    circle: function(d) {
      return this.ellipse(d);
    },
    
    // create and ellipse
    ellipse: function(w, h) {
      return this.put(new SVG.Ellipse().size(w, h));
    },
    
    // create a polyline element
    polyline: function(p) {
      return this.put(new SVG.Polyline().plot(p));
    },
    
    // create a polygon element
    polygon: function(p) {
      return this.put(new SVG.Polygon().plot(p));
    },
    
    // create a path element
    path: function(d) {
      return this.put(new SVG.Path().plot(d));
    },
    
    // create image element, load image and set its size
    image: function(s, w, h) {
      w = w != null ? w : 100;
      return this.put(new SVG.Image().load(s).size(w, h != null ? h : w));
    },
    
    // create text element
    text: function(t) {
      return this.put(new SVG.Text().text(t));
    },
    
    // create element in defs
    gradient: function(t, b) {
      return this.defs().gradient(t, b);
    },
    
    // hack for safari preventing text to be rendered in one line,
    // basically it sets the position of the svg node to absolute
    // when the dom is loaded, and resets it to relative a few ms later.
    stage: function() {
      var r, e = this;
      
      r = function() {
        if (document.readyState === 'complete') {
          e.attr('style', 'position:absolute;');
          setTimeout(function() { e.attr('style', 'position:relative;'); }, 5);
        } else {
          setTimeout(r, 10);
        }
      };
      
      r();
      
      return this;
    }
    
  };

  SVG.Element = function Element(n) {
    // keep reference to the element node 
    this.node = n;
    
    // initialize attribute store
    this.attrs = {};
    
    // initialize transformations store
    this.trans = {
      x:        0,
      y:        0,
      scaleX:   1,
      scaleY:   1,
      rotation: 0,
      skewX:    0,
      skewY:    0
    };
  };
  
  // Add element-specific functions
  SVG.extend(SVG.Element, {
    
    // move element to given x and y values
    move: function(x, y) {
      return this.attr({ x: x, y: y });
    },
    
    // set element size to given width and height
    size: function(w, h) {
      return this.attr({ width: w, height: h });
    },
    
    // position element by its center
    center: function(x, y) {
      var b = this.bbox();
      
      return this.move(x - b.width / 2, y - b.height / 2);
    },
    
    // remove element
    remove: function() {
      return this.parent != null ? this.parent.remove(this) : void 0;
    },
    
    // get parent document
    parentDoc: function() {
      return this._parent(SVG.Doc);
    },
    
    // set svg element attribute
    attr: function(a, v, n) {
      if (arguments.length < 2) {
        // apply every attribute individually if an object is passed
        if (typeof a == 'object')
          for (v in a) this.attr(v, a[v]);
        
        // act as a getter for style attributes
        else if (this._isStyle(a))
          return a == 'text' ?
                   this.content :
                 a == 'leading' ?
                   this[a] :
                   this.style[a];
        
        // act as a getter if the first and only argument is not an object
        else
          return this.attrs[a];
      
      } else {
        // store value
        this.attrs[a] = v;
        
        // treat x differently on text elements
        if (a == 'x' && this._isText())
          for (var i = this.lines.length - 1; i >= 0; i--)
            this.lines[i].attr(a, v);
        
        // set the actual attribute
        else
          n != null ?
            this.node.setAttributeNS(n, a, v) :
            this.node.setAttribute(a, v);
        
        // if the passed argument belongs to the style as well, add it there
        if (this._isStyle(a)) {
          a == 'text' ?
            this.text(v) :
          a == 'leading' ?
            this[a] = v :
            this.style[a] = v;
        
          this.text(this.content);
        }
      }
      
      return this;
    },
    
    transform: function(o) {
      // act as a getter if the first argument is a string
      if (typeof o === 'string')
        return this.trans[o];
        
      // ... otherwise continue as a setter
      var k,
          t = [],
          b = this.bbox(),
          s = this.attr('transform') || '',
          l = s.match(/[a-z]+\([^\)]+\)/g) || [];
      
      // merge values
      for (k in o)
        if (o[k] != null)
          this.trans[k] = o[k];
      
      // alias current transformations
      o = this.trans;
      
      // add rotate
      if (o.rotation != 0)
        t.push('rotate(' + o.rotation + ',' + (o.cx != null ? o.cx : b.cx) + ',' + (o.cy != null ? o.cy : b.cy) + ')');
      
      // add scale
      t.push('scale(' + o.scaleX + ',' + o.scaleY + ')');
      
      // add skew on x axis
      if (o.skewX != 0)
        t.push('skewX(' + o.skewX + ')');
      
      // add skew on y axis
      if (o.skewY != 0)
        t.push('skewY(' + o.skewY + ')')
      
      // add translate
      t.push('translate(' + o.x + ',' + o.y + ')');
      
      // add only te required transformations
      return this.attr('transform', t.join(' '));
    },
    
    // get bounding box
    bbox: function() {
      // actual bounding box
      var b = this.node.getBBox();
      
      return {
        // include translations on x an y
        x:      b.x + this.trans.x,
        y:      b.y + this.trans.y,
        
        // add the center
        cx:     b.x + this.trans.x + b.width  / 2,
        cy:     b.y + this.trans.y + b.height / 2,
        
        // plain width and height
        width:  b.width,
        height: b.height
      };
    },
    
    // private: find svg parent
    _parent: function(pt) {
      var e = this;
      
      // find ancestor with given type
      while (e != null && !(e instanceof pt))
        e = e.parent;
  
      return e;
    },
    
    // private: tester method for style detection
    _isStyle: function(a) {
      return typeof a == 'string' && this._isText() ? (/^font|text|leading/).test(a) : false;
    },
    
    // private: element type tester
    _isText: function() {
      return this instanceof SVG.Text;
    }
    
  });


  var eventTypes = ['click', 'mousedown', 'mouseup', 'mouseover', 'mouseout', 'mousemove'];
  
  // generate events
  for (var i = eventTypes.length - 1; i >= 0; i--) {
    var t = eventTypes[i];
    SVG.Element.prototype[t] = function(f) {
      var e = this;
      this.node['on' + t] = function() {
        return f.apply(e, arguments);
      };
      
      return e;
    };
  };

  SVG.G = function G() {
    this.constructor.call(this, SVG.create('g'));
  };
  
  // inherit from SVG.Element
  SVG.G.prototype = new SVG.Element();
  
  // include the container object
  SVG.extend(SVG.G, SVG.Container);

  SVG.extend(SVG.Element, {
    
    // get all siblings, including myself
    siblings: function() {
      return this.parent.children();
    },
    
    // send given element one step forwards
    forward: function() {
      var i = this.siblings().indexOf(this);
      
      return this.parent.remove(this).put(this, i + 1);
    },
    
    // send given element one step backwards
    backward: function() {
      var i, p = this.parent.level();
      
      i = this.siblings().indexOf(this);
      
      if (i > 1)
        p.remove(this).add(this, i - 1);
      
      return this;
    },
    
    // send given element all the way to the front
    front: function() {
      return this.parent.remove(this).put(this);
    },
    
    // send given element all the way to the back
    back: function() {
      var i, p = this.parent.level();
      
      i = this.siblings().indexOf(this);
      
      if (i > 1)
        p.remove(this).add(this, 0);
      
      return this;
    }
    
  });

  SVG.Defs = function Defs() {
    this.constructor.call(this, SVG.create('defs'));
  };
  
  // inherit from SVG.Element
  SVG.Defs.prototype = new SVG.Element();
  
  // include the container object
  SVG.extend(SVG.Defs, SVG.Container);

  var clipID = 0;
  
  SVG.Clip = function Clip() {
    this.constructor.call(this, SVG.create('clipPath'));
    
    // set unique id
    this.id = 'svgjs_clip_' + (clipID++);
    this.attr('id', this.id);
  };
  
  // inherit from SVG.Element
  SVG.Clip.prototype = new SVG.Element();
  
  // include the container object
  SVG.extend(SVG.Clip, SVG.Container);
  
  // add clipping functionality to element
  SVG.extend(SVG.Element, {
    
    // clip element using another element
    clip: function(b) {
      var p = this.parent.defs().clip();
      b(p);
  
      return this.clipTo(p);
    },
  
    // distribute clipping path to svg element
    clipTo: function(p) {
      return this.attr('clip-path', 'url(#' + p.id + ')');
    }
    
  });
  
  // add def-specific functions
  SVG.extend(SVG.Defs, {
    
    // create clippath
    clip: function() {
      return this.put(new SVG.Clip());
    }
    
  });

  var gradID = 0;
  
  SVG.Gradient = function Gradient(t) {
    this.constructor.call(this, SVG.create(t + 'Gradient'));
    
    // set unique id
    this.id = 'svgjs_grad_' + (gradID++);
    this.attr('id', this.id);
    
    // store type
    this.type = t;
  };
  
  // inherit from SVG.Element
  SVG.Gradient.prototype = new SVG.Element();
  
  // include the container object
  SVG.extend(SVG.Gradient, SVG.Container);
  
  // add gradient-specific functions
  SVG.extend(SVG.Gradient, {
    
    // from position
    from: function(x, y) {
      return this.type == 'radial' ?
               this.attr({ fx: x + '%', fy: y + '%' }) :
               this.attr({ x1: x + '%', y1: y + '%' });
    },
    
    // to position
    to: function(x, y) {
      return this.type == 'radial' ?
               this.attr({ cx: x + '%', cy: y + '%' }) :
               this.attr({ x2: x + '%', y2: y + '%' });
    },
    
    // radius for radial gradient
    radius: function(r) {
      return this.type == 'radial' ?
               this.attr({ r: r + '%' }) :
               this;
    },
    
    // add a color stop
    at: function(o) {
      return this.put(new SVG.Stop(o));
    },
    
    // update gradient
    update: function(b) {
      // remove all stops
      while (this.node.hasChildNodes())
        this.node.removeChild(this.node.lastChild);
      
      // invoke passed block
      b(this);
      
      return this;
    },
    
    // return the fill id
    fill: function() {
      return 'url(#' + this.id + ')';
    }
    
  });
  
  // add def-specific functions
  SVG.extend(SVG.Defs, {
    
    // define clippath
    gradient: function(t, b) {
      var e = this.put(new SVG.Gradient(t));
      
      // invoke passed block
      b(e);
      
      return e;
    }
    
  });
  
  
  SVG.Stop = function Stop(o) {
    this.constructor.call(this, SVG.create('stop'));
    
    // immediatelly build stop
    this.update(o);
  };
  
  // inherit from SVG.Element
  SVG.Stop.prototype = new SVG.Element();
  
  // add mark-specific functions
  SVG.extend(SVG.Stop, {
    
    // add color stops
    update: function(o) {
      var i,
          s = '',
          a = ['opacity', 'color'];
      
      // build style attribute
      for (i = a.length - 1; i >= 0; i--)
        if (o[a[i]] != null)
          s += 'stop-' + a[i] + ':' + o[a[i]] + ';';
      
      // set attributes
      return this.attr({
        offset: (o.offset != null ? o.offset : this.attrs.offset || 0) + '%',
        style:  s
      });
    }
    
  });
  


  SVG.Doc = function Doc(e) {
    this.constructor.call(this, SVG.create('svg'));
    
    // create extra wrapper
    var w = document.createElement('div');
    w.style.cssText = 'position:relative;width:100%;height:100%;';
    
    // ensure the presence of a html element
    if (typeof e == 'string')
      e = document.getElementById(e);
    
    // set svg element attributes
    this.
      attr({ xmlns: SVG.ns, version: '1.1', width: '100%', height: '100%' }).
      attr('xlink', SVG.xlink, SVG.ns).
      defs();
    
    // add elements
    e.appendChild(w);
    w.appendChild(this.node);
    
    // ensure correct rendering for safari
    this.stage();
  };
  
  // inherit from SVG.Element
  SVG.Doc.prototype = new SVG.Element();
  
  // include the container object
  SVG.extend(SVG.Doc, SVG.Container);
  
  


  SVG.Shape = function Shape(element) {
    this.constructor.call(this, element);
  };
  
  // inherit from SVG.Element
  SVG.Shape.prototype = new SVG.Element();

  SVG.Rect = function Rect() {
    this.constructor.call(this, SVG.create('rect'));
  };
  
  // inherit from SVG.Shape
  SVG.Rect.prototype = new SVG.Shape();

  SVG.Ellipse = function Ellipse() {
    this.constructor.call(this, SVG.create('ellipse'));
  };
  
  // inherit from SVG.Shape
  SVG.Ellipse.prototype = new SVG.Shape();
  
  // Add ellipse-specific functions
  SVG.extend(SVG.Ellipse, {
    
    // custom move function
    move: function(x, y) {
      this.attrs.x = x;
      this.attrs.y = y;
      
      return this.center();
    },
  
    // custom size function
    size: function(w, h) {
      return this.
        attr({ rx: w / 2, ry: (h != null ? h : w) / 2 }).
        center();
    },
    
    // position element by its center
    center: function(x, y) {
      return this.attr({
        cx: x || (this.attrs.x || 0) + (this.attrs.rx || 0),
        cy: y || (this.attrs.y || 0) + (this.attrs.ry || 0)
      });
    }
    
  });


  SVG.Poly = {
    
    // set polygon data with default zero point if no data is passed
    plot: function(p) {
      return this.attr('points', p || '0,0');
    },
    
    // move path using translate
    move: function(x, y) {
      return this.transform({ x: x, y: y });
    }
    
  };
  
  
  
  SVG.Polyline = function Polyline() {
    this.constructor.call(this, SVG.create('polyline'));
  };
  
  // inherit from SVG.Shape
  SVG.Polyline.prototype = new SVG.Shape();
  
  // Add polygon-specific functions
  SVG.extend(SVG.Polyline, SVG.Poly);
  
  
  
  SVG.Polygon = function Polygon() {
    this.constructor.call(this, SVG.create('polygon'));
  };
  
  // inherit from SVG.Shape
  SVG.Polygon.prototype = new SVG.Shape();
  
  // Add polygon-specific functions
  SVG.extend(SVG.Polygon, SVG.Poly);

  SVG.Path = function Path() {
    this.constructor.call(this, SVG.create('path'));
  };
  
  // inherit from SVG.Shape
  SVG.Path.prototype = new SVG.Shape();
  
  // Add path-specific functions
  SVG.extend(SVG.Path, {
    
    // set path data
    plot: function(d) {
      return this.attr('d', d || 'M0,0');
    },
    
    // move path using translate, path's don't take x and y
    move: function(x, y) {
      return this.transform({ x: x, y: y });
    }
    
  });

  SVG.Image = function Image() {
    this.constructor.call(this, SVG.create('image'));
  };
  
  // inherit from SVG.Element
  SVG.Image.prototype = new SVG.Shape();
  
  // add image-specific functions
  SVG.extend(SVG.Image, {
    
    // (re)load image
    load: function(u) {
      return this.attr('xlink:href', u, SVG.xlink);
    }
    
  });

  var _styleAttr = ['size', 'family', 'weight', 'stretch', 'variant', 'style'];
  
  
  SVG.Text = function Text() {
    this.constructor.call(this, SVG.create('text'));
    
    // define default style
    this.style = { 'font-size':  16, 'font-family': 'Helvetica', 'text-anchor': 'start' };
    this.leading = 1.2;
  };
  
  // inherit from SVG.Element
  SVG.Text.prototype = new SVG.Shape();
  
  // Add image-specific functions
  SVG.extend(SVG.Text, {
    
    text: function(t) {
      // update the content
      this.content = t = t || 'text';
      this.lines = [];
      
      var i, n,
          s = this._style(),
          p = this.parentDoc(),
          a = t.split("\n"),
          f = this.style['font-size'];
      
      // remove existing child nodes
      while (this.node.hasChildNodes())
        this.node.removeChild(this.node.lastChild);
      
      // build new lines
      for (i = 0, l = a.length; i < l; i++) {
        // create new tspan and set attributes
        n = new TSpan().
          text(a[i]).
          attr({
            dy:     f * this.leading - (i == 0 ? f * 0.3 : 0),
            x:      (this.attrs.x || 0),
            style:  s
          });
        
        // add new tspan
        this.node.appendChild(n.node);
        this.lines.push(n);
      };
      
      // set style
      return this.attr('style', s);
    },
    
    // build style based on _styleAttr
    _style: function() {
      var i, o = '';
      
      for (i = _styleAttr.length - 1; i >= 0; i--)
        if (this.style['font-' + _styleAttr[i]] != null)
          o += 'font-' + _styleAttr[i] + ':' + this.style['font-' + _styleAttr[i]] + ';';
      
      o += 'text-anchor:' + this.style['text-anchor'] + ';';
        
      return o;
    }
    
  });
  
  
  function TSpan() {
    this.constructor.call(this, SVG.create('tspan'));
  };
  
  // inherit from SVG.Element
  TSpan.prototype = new SVG.Shape();
  
  // include the container object
  SVG.extend(TSpan, {
    
    text: function(t) {
      this.node.appendChild(document.createTextNode(t));
      
      return this;
    }
    
  });

  var _strokeAttr = ['width', 'opacity', 'linecap', 'linejoin', 'miterlimit', 'dasharray', 'dashoffset'],
      _fillAttr   = ['opacity', 'rule'];
  
  
  // Add shape-specific functions
  SVG.extend(SVG.Shape, {
    
    // set fill color and opacity
    fill: function(f) {
      var i;
      
      // set fill color if not null
      if (f.color != null)
        this.attr('fill', f.color);
      
      // set all attributes from _fillAttr list with prependes 'fill-' if not null
      for (i = _fillAttr.length - 1; i >= 0; i--)
        if (f[_fillAttr[i]] != null)
          this.attr('fill-' + _fillAttr[i], f[_fillAttr[i]]);
      
      return this;
    },
  
    // set stroke color and opacity
    stroke: function(s) {
      var i;
      
      // set stroke color if not null
      if (s.color)
        this.attr('stroke', s.color);
      
      // set all attributes from _strokeAttr list with prependes 'stroke-' if not null
      for (i = _strokeAttr.length - 1; i >= 0; i--)
        if (s[_strokeAttr[i]] != null)
          this.attr('stroke-' + _strokeAttr[i], s[_strokeAttr[i]]);
      
      return this;
    }
    
  });
  
  // Add element-specific functions
  SVG.extend(SVG.Element, {
    
    // rotation
    rotate: function(d, x, y) {
      var b = this.bbox();
      
      return this.transform({
        rotation: d || 0,
        cx:       x == null ? b.cx : x,
        cy:       y == null ? b.cx : y
      });
    },
    
    // skew
    skew: function(x, y) {
      return this.transform({
        skewX: x || 0,
        skewY: y || 0
      });
    }
    
  });
  
  // Add group-specific functions
  SVG.extend(SVG.G, {
    
    // move using translate
    move: function(x, y) {
      return this.transform({ x: x, y: y });
    }
    
  });
  
  // Add text-specific functions
  SVG.extend(SVG.Text, {
    
    // set font 
    font: function(o) {
      var k, a = {};
      
      for (k in o)
        k == 'leading' ?
          a[k] = o[k] :
        k == 'anchor' ?
          a['text-anchor'] = o[k] :
        _styleAttr.indexOf(k) > -1 ?
          a['font-'+ k] = o[k] :
          void 0;
      
      return this.attr(a).text(this.content);
    }
    
  });
  
  
  


}).call(this);
function svg(e) { return new SVG.Doc(e); };
