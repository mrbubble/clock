/**
 * @file Animated Swiss Federal Railways clock widget.
 *
 * This widget reproduces the mechanical subtleties of the Swiss Federal
 * Railways clock, the "Schweizer Bahnhofsuhr", by modeling each hand as a
 * damped torsional harmonic oscillator.
 * The clock was designed by Swiss engineer and designer Hans Hilfiker in 1944,
 * while working for the Swiss Federal Railways.
 * For more information on the clock, see:
 * <ul>
 * <li>http://en.wikipedia.org/wiki/Hans_Hilfiker
 * <li>http://www.swissworld.org/en/switzerland/swiss_specials/swiss_watches/the_swiss_railway_clock/
 * <li>http://en.wikipedia.org/wiki/Swiss_Federal_Railways
 * </ul>
 *
 * @example
 * // Here, "myclock" is a div element on the page where the clock will be. 
 * var e = document.getElementById('myclock');
 * var c = new clock.Clock(e);
 * c.run();
 *
 * @author Leonardo Mesquita <mrbolha@gmail.com>
 * @copyright Leonardo Mesquita 2010
 * @license Unlicense
 */

var clock = {};

clock.BASE_SIZE = 100;

clock.DEFAULT_OPTIONS_ = {
  // Width and height of clock, in pixels.
  size: 300,

  // Frames per second of clock animation.
  fps: 30,

  // Ratio of size used as margin. Should be between 0 and 1.
  margin: .1,

  // Shape of the clock features.
  shape: {
    marker_radius: 48.5,
    hour_marker: {
      width: 3.5,
      height: 12.0,
    },
    minute_marker: {
      width: 1.4,
      height: 3.5,
    },
    hour_hand: {
      base: {
        width: 6.4,
        height: 12.0,
      },
      top: {
        width: 5.2,
        height: 32.0,
      },
    },
    minute_hand: {
      base: {
        width: 5.2,
        height: 12.0,
      },
      top: {
        width: 3.6,
        height: 46.0,
      },
    },
    second_hand: {
      width: 1.4,
      base_height: 16.5,
      top_height: 31.2,
      top_radius: 5.25,
    },
  },

  // Behavior of the clock hands.
  behavior: {
    second_hand: {
      pause_seconds: 1.5,
      decay: .1,
      decay_seconds: .5,
    },
    minute_hand: {
      decay: .1,
      decay_seconds: .3,
      frequency: 6,
    },
    hour_hand: {
      decay: .1,
      decay_seconds: 1,
    },
  },

  // Style of the clock elements.
  style: {
    background: 'white',
    border: 'black',
    hour_marker: 'black',
    minute_marker: 'black',
    hour_hand: 'black',
    minute_hand: 'black',
    second_hand: 'red',
    shadow: {
      color: 'rgba(0, 0, 0, 0.2)',
      offsetX: 5,      
      offsetY: 5,
      blur: 2,
    },
  },
};

clock.Clock = function(e, opt) {
  opt = Object.assign({}, clock.DEFAULT_OPTIONS_, opt || {});
  this.canvas_ = document.createElement("canvas");
  this.canvas_.width = this.canvas_.height = opt.size;
  e.appendChild(this.canvas_)
  this.context_ = this.canvas_.getContext('2d');
  this.interval_ = 1000.0 / opt.fps;
  this.margin_ = opt.margin;
  this.shape_ = opt.shape;
  this.behavior_ = opt.behavior;
  this.style_ = opt.style;
};

clock.Clock.prototype.run = function() {
  // Adjust the drawing context in size and position, so that (0, 0) is the
  // center of the clock and its diameter is BASE_SIZE.
  // Leaves a margin defined as a fraction of the canvas size.
  var ctx = this.context_;
  this.prepareContext(ctx);

  this.computeQuads();
  this.prepareBackground();

  // Installs the clock to refresh at the desired rate.
  var clock = this;
  window.setInterval(function() { clock.draw(); }, this.interval_);
};

clock.Clock.prototype.resetTransform = function() {
  var ctx = this.context_;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  this.prepareContext(ctx);
  this.prepareBackground();
};

clock.Clock.prototype.prepareContext = function(ctx) {
  // Adjust the drawing context in size and position, so that (0, 0) is the
  // center of the clock and its diameter is BASE_SIZE.
  // Leaves a margin defined as a fraction of the canvas size.
  ctx.translate(this.canvas_.width / 2, this.canvas_.height / 2);

  var original_size = Math.min(this.canvas_.width, this.canvas_.height);
  var scale = original_size / (clock.BASE_SIZE / (1 - 2 * this.margin_));
  ctx.scale(scale, scale);
};

clock.Clock.prototype.computeQuads = function() {
  this.quads_ = {
    hour_marker: this.makeQuad(this.shape_.hour_marker.width,
                               this.shape_.marker_radius,
                               this.shape_.hour_marker.width,
                               this.shape_.hour_marker.height -
                               this.shape_.marker_radius),
    minute_marker: this.makeQuad(this.shape_.minute_marker.width,
                                 this.shape_.marker_radius,
                                 this.shape_.minute_marker.width,
                                 this.shape_.minute_marker.height -
                                 this.shape_.marker_radius),
    hour_hand: this.makeQuad(this.shape_.hour_hand.top.width,
                             this.shape_.hour_hand.top.height,
                             this.shape_.hour_hand.base.width,
                             this.shape_.hour_hand.base.height),
    minute_hand: this.makeQuad(this.shape_.minute_hand.top.width,
                               this.shape_.minute_hand.top.height,
                               this.shape_.minute_hand.base.width,
                               this.shape_.minute_hand.base.height),
    second_hand: this.makeQuad(this.shape_.second_hand.width,
                               this.shape_.second_hand.top_height,
                               this.shape_.second_hand.width,
                               this.shape_.second_hand.base_height),
  }
};

clock.Clock.prototype.makeQuad = function(topWidth, topHeight, baseWidth,
                                           baseHeight) {
  return {
    topLeft: {
      x: -topWidth / 2,
      y: -topHeight,
    },
    bottomRight: {
      x: baseWidth / 2,
      y: baseHeight,
    },
  };
};

clock.Clock.prototype.draw = function() {
  this.drawBackground();
  var now = new Date();
  this.drawHands(now);
};

clock.Clock.prototype.drawBackground = function() {
  var ctx = this.context_;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, this.canvas_.width, this.canvas_.height);
  ctx.drawImage(this.buffer, 0, 0);
  ctx.restore();
};

clock.Clock.prototype.prepareBackground = function() {
  this.buffer = document.createElement('CANVAS');
  this.buffer.width = this.canvas_.width;
  this.buffer.height = this.canvas_.height;
  var ctx = this.buffer.getContext('2d');
  this.prepareContext(ctx);
  ctx.fillStyle = this.style_.background;
  ctx.strokeStyle = this.style_.border;
  ctx.beginPath();
  ctx.arc(0, 0, clock.BASE_SIZE / 2, 0, Math.PI * 2, true);
  ctx.fill();
  ctx.stroke();

  var angle = 0;
  var step = Math.PI / 6;
  for (var i = 0; i < 12; ++i) {
    ctx.fillStyle = this.style_.hour_marker;
    this.drawQuad(ctx, this.quads_.hour_marker, angle);
    ctx.fill();
    var s = Math.PI / 30;
    var a = s;
    ctx.fillStyle = this.style_.minute_marker;
    for (var j = 0; j < 4; ++j) {
      this.drawQuad(ctx, this.quads_.minute_marker, angle + a);
      ctx.fill();
      a += s;
    }
    angle += step;
  }
};

clock.Clock.prototype.drawHands = function(now) {
  var ctx = this.context_;
  ctx.save();

  ctx.shadowColor = this.style_.shadow.color;
  ctx.shadowOffsetX = this.style_.shadow.offsetX;
  ctx.shadowOffsetY = this.style_.shadow.offsetY;
  ctx.shadowBlur = this.style_.shadow.blur;

  ctx.fillStyle = this.style_.hour_hand;
  var angle = this.computeHoursAngle(now);
  this.drawQuad(ctx, this.quads_.hour_hand, angle);
  ctx.fill();

  ctx.fillStyle = this.style_.minute_hand;
  angle = this.computeMinutesAngle(now);
  this.drawQuad(ctx, this.quads_.minute_hand, angle);
  ctx.fill();

  ctx.fillStyle = this.style_.second_hand;
  ctx.strokeStyle = this.style_.second_hand;
  angle = this.computeSecondsAngle(now);
  this.drawQuad(ctx, this.quads_.second_hand, angle);
  var p = this.rotate({ x: 0, y: -this.shape_.second_hand.top_height }, angle);
  ctx.moveTo(p.x + this.shape_.second_hand.top_radius, p.y);
  ctx.arc(p.x, p.y, this.shape_.second_hand.top_radius, 0, Math.PI * 2, false);
  ctx.fill();
  ctx.restore();
};

clock.Clock.prototype.computeSecondsAngle = function(now) {
  var cycle = 60 - this.behavior_.second_hand.pause_seconds;
  var t = now.getMilliseconds() / 1000.0 + now.getSeconds();
  var v = 2 * Math.PI / cycle;
  var l = Math.log(this.behavior_.second_hand.decay) /
          this.behavior_.second_hand.decay_seconds;
  if (t >= cycle) {
    var x = t - cycle;
    return v * x * Math.exp(l * x);
  }
  return v * t * (1 - Math.exp(l * t));
};

clock.Clock.prototype.computeMinutesAngle = function(now) {
  var delta = Math.PI / 30;
  var angle = delta * now.getMinutes();
  var t = now.getMilliseconds() / 1000.0 + now.getSeconds();
  var l = Math.log(this.behavior_.minute_hand.decay) /
          this.behavior_.minute_hand.decay_seconds;
  var w = 2 * Math.PI * this.behavior_.minute_hand.frequency;
  var wt = w * t;
  return angle + delta * Math.exp(l * t) *
      ((l / w) * Math.sin(wt) - Math.cos(wt));
};

clock.Clock.prototype.computeHoursAngle = function(now) {
  var t = now.getMilliseconds() / 1000.0 + now.getSeconds();
  var delta = Math.PI / 360;
  var angle = (now.getMinutes() + 60 * now.getHours())* delta;
  var l = Math.log(this.behavior_.hour_hand.decay) /
          this.behavior_.hour_hand.decay_seconds;
  return angle + delta * (l * t - 1) * Math.exp(l * t);
};

clock.Clock.prototype.drawQuad = function(ctx, quad, angle) {
  var points = [
    { x: -quad.topLeft.x, y: quad.topLeft.y },
    { x: quad.bottomRight.x, y: quad.bottomRight.y },
    { x: -quad.bottomRight.x, y: quad.bottomRight.y },
  ];
  ctx.beginPath();
  var l = points.length;
  var p = this.rotate(quad.topLeft, angle);
  ctx.moveTo(p.x, p.y);
  for (var i = 0; i < l; ++i) {
    var p = this.rotate(points[i], angle);
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
};

clock.Clock.prototype.rotate = function(point, angle) {
  return {
    x: Math.cos(angle) * point.x - Math.sin(angle) * point.y,
    y: Math.sin(angle) * point.x + Math.cos(angle) * point.y,
  };
};
