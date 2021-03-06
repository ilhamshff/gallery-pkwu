/*!
 * @license
 * flipbook-vue v0.10.4
 * Copyright © 2022 Takeshi Sone.
 * Released under the MIT License.
 */

import { multiply, perspective, translate, translate3d, rotateY, toString, identity } from 'rematrix';

var Matrix;

var Matrix$1 = Matrix = /*@__PURE__*/(function () {
  function Matrix(arg) {
    if (arg) {
      if (arg.m) {
        this.m = [].concat( arg.m );
      } else {
        this.m = [].concat( arg );
      }
    } else {
      this.m = identity();
    }
  }

  Matrix.prototype.clone = function clone () {
    return new Matrix(this);
  };

  Matrix.prototype.multiply = function multiply$1 (m) {
    return this.m = multiply(this.m, m);
  };

  Matrix.prototype.perspective = function perspective$1 (d) {
    return this.multiply(perspective(d));
  };

  Matrix.prototype.transformX = function transformX (x) {
    return (x * this.m[0] + this.m[12]) / (x * this.m[3] + this.m[15]);
  };

  Matrix.prototype.translate = function translate$1 (x, y) {
    return this.multiply(translate(x, y));
  };

  Matrix.prototype.translate3d = function translate3d$1 (x, y, z) {
    return this.multiply(translate3d(x, y, z));
  };

  Matrix.prototype.rotateY = function rotateY$1 (deg) {
    return this.multiply(rotateY(deg));
  };

  Matrix.prototype.toString = function toString$1 () {
    return toString(this.m);
  };

  return Matrix;
}());

var spinner = "data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%3F%3E%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22500%22%20height%3D%22500%22%20viewBox%3D%220%200%20500%20500%22%20fill%3D%22transparent%22%20style%3D%22background-color%3A%20%23fff%22%3E%20%20%3Ccircle%20%20%20%20cx%3D%22250%22%20%20%20%20cy%3D%22250%22%20%20%20%20r%3D%2248%22%20%20%20%20stroke%3D%22%23333%22%20%20%20%20stroke-width%3D%222%22%20%20%20%20stroke-dasharray%3D%22271%2030%22%20%20%3E%20%20%20%20%3CanimateTransform%20%20%20%20%20%20attributeName%3D%22transform%22%20%20%20%20%20%20attributeType%3D%22XML%22%20%20%20%20%20%20type%3D%22rotate%22%20%20%20%20%20%20from%3D%220%20250%20250%22%20%20%20%20%20%20to%3D%22360%20250%20250%22%20%20%20%20%20%20dur%3D%221s%22%20%20%20%20%20%20repeatCount%3D%22indefinite%22%20%20%20%20%2F%3E%20%20%3C%2Fcircle%3E%3C%2Fsvg%3E";

var IE, easeIn, easeInOut, easeOut;

easeIn = function(x) {
  return Math.pow(x, 2);
};

easeOut = function(x) {
  return 1 - easeIn(1 - x);
};

easeInOut = function(x) {
  if (x < 0.5) {
    return easeIn(x * 2) / 2;
  } else {
    return 0.5 + easeOut((x - 0.5) * 2) / 2;
  }
};

IE = /Trident/.test(navigator.userAgent);

var script = {
  props: {
    pages: {
      type: Array,
      required: true
    },
    pagesHiRes: {
      type: Array,
      default: function() {
        return [];
      }
    },
    flipDuration: {
      type: Number,
      default: 1000
    },
    zoomDuration: {
      type: Number,
      default: 500
    },
    zooms: {
      type: Array,
      default: function() {
        return [1, 2, 4];
      }
    },
    perspective: {
      type: Number,
      default: 2400
    },
    nPolygons: {
      type: Number,
      default: 10
    },
    ambient: {
      type: Number,
      default: 0.4
    },
    gloss: {
      type: Number,
      default: 0.6
    },
    swipeMin: {
      type: Number,
      default: 3
    },
    singlePage: {
      type: Boolean,
      default: false
    },
    forwardDirection: {
      validator: function(val) {
        return val === 'right' || val === 'left';
      },
      default: 'right'
    },
    centering: {
      type: Boolean,
      default: true
    },
    startPage: {
      type: Number,
      default: null
    },
    loadingImage: {
      type: String,
      default: spinner
    },
    clickToZoom: {
      type: Boolean,
      default: true
    },
    dragToFlip: {
      type: Boolean,
      default: true
    }
  },
  data: function() {
    return {
      viewWidth: 0,
      viewHeight: 0,
      imageWidth: null,
      imageHeight: null,
      displayedPages: 1,
      nImageLoad: 0,
      nImageLoadTrigger: 0,
      imageLoadCallback: null,
      currentPage: 0,
      firstPage: 0,
      secondPage: 1,
      zoomIndex: 0,
      zoom: 1,
      zooming: false,
      touchStartX: null,
      touchStartY: null,
      maxMove: 0,
      activeCursor: null,
      hasTouchEvents: false,
      hasPointerEvents: false,
      minX: 2e308,
      maxX: -2e308,
      preloadedImages: {},
      flip: {
        progress: 0,
        direction: null,
        frontImage: null,
        backImage: null,
        auto: false,
        opacity: 1
      },
      currentCenterOffset: null,
      animatingCenter: false,
      startScrollLeft: 0,
      startScrollTop: 0,
      scrollLeft: 0,
      scrollTop: 0,
      loadedImages: {}
    };
  },
  computed: {
    canFlipLeft: function() {
      if (this.forwardDirection === 'left') {
        return this.canGoForward;
      } else {
        return this.canGoBack;
      }
    },
    canFlipRight: function() {
      if (this.forwardDirection === 'right') {
        return this.canGoForward;
      } else {
        return this.canGoBack;
      }
    },
    canZoomIn: function() {
      return !this.zooming && this.zoomIndex < this.zooms_.length - 1;
    },
    canZoomOut: function() {
      return !this.zooming && this.zoomIndex > 0;
    },
    numPages: function() {
      if (this.pages[0] === null) {
        return this.pages.length - 1;
      } else {
        return this.pages.length;
      }
    },
    page: function() {
      if (this.pages[0] !== null) {
        return this.currentPage + 1;
      } else {
        return Math.max(1, this.currentPage);
      }
    },
    zooms_: function() {
      return this.zooms || [1];
    },
    canGoForward: function() {
      return !this.flip.direction && this.currentPage < this.pages.length - this.displayedPages;
    },
    canGoBack: function() {
      return !this.flip.direction && this.currentPage >= this.displayedPages && !(this.displayedPages === 1 && !this.pageUrl(this.firstPage - 1));
    },
    leftPage: function() {
      if (this.forwardDirection === 'right' || this.displayedPages === 1) {
        return this.firstPage;
      } else {
        return this.secondPage;
      }
    },
    rightPage: function() {
      if (this.forwardDirection === 'left') {
        return this.firstPage;
      } else {
        return this.secondPage;
      }
    },
    showLeftPage: function() {
      return this.pageUrl(this.leftPage);
    },
    showRightPage: function() {
      return this.pageUrl(this.rightPage) && this.displayedPages === 2;
    },
    cursor: function() {
      if (this.activeCursor) {
        return this.activeCursor;
      } else if (IE) {
        return 'auto';
      } else if (this.clickToZoom && this.canZoomIn) {
        return 'zoom-in';
      } else if (this.clickToZoom && this.canZoomOut) {
        return 'zoom-out';
      } else if (this.dragToFlip) {
        return 'grab';
      } else {
        return 'auto';
      }
    },
    pageScale: function() {
      var scale, vw, xScale, yScale;
      vw = this.viewWidth / this.displayedPages;
      xScale = vw / this.imageWidth;
      yScale = this.viewHeight / this.imageHeight;
      scale = xScale < yScale ? xScale : yScale;
      if (scale < 1) {
        return scale;
      } else {
        return 1;
      }
    },
    pageWidth: function() {
      return Math.round(this.imageWidth * this.pageScale);
    },
    pageHeight: function() {
      return Math.round(this.imageHeight * this.pageScale);
    },
    xMargin: function() {
      return (this.viewWidth - this.pageWidth * this.displayedPages) / 2;
    },
    yMargin: function() {
      return (this.viewHeight - this.pageHeight) / 2;
    },
    polygonWidth: function() {
      var w;
      w = this.pageWidth / this.nPolygons;
      w = Math.ceil(w + 1 / this.zoom);
      return w + 'px';
    },
    polygonHeight: function() {
      return this.pageHeight + 'px';
    },
    polygonBgSize: function() {
      return ((this.pageWidth) + "px " + (this.pageHeight) + "px");
    },
    polygonArray: function() {
      return this.makePolygonArray('front').concat(this.makePolygonArray('back'));
    },
    boundingLeft: function() {
      var x;
      if (this.displayedPages === 1) {
        return this.xMargin;
      } else {
        x = this.pageUrl(this.leftPage) ? this.xMargin : this.viewWidth / 2;
        if (x < this.minX) {
          return x;
        } else {
          return this.minX;
        }
      }
    },
    boundingRight: function() {
      var x;
      if (this.displayedPages === 1) {
        return this.viewWidth - this.xMargin;
      } else {
        x = this.pageUrl(this.rightPage) ? this.viewWidth - this.xMargin : this.viewWidth / 2;
        if (x > this.maxX) {
          return x;
        } else {
          return this.maxX;
        }
      }
    },
    centerOffset: function() {
      var retval;
      retval = this.centering ? Math.round(this.viewWidth / 2 - (this.boundingLeft + this.boundingRight) / 2) : 0;
      if (this.currentCenterOffset === null && this.imageWidth !== null) {
        this.currentCenterOffset = retval;
      }
      return retval;
    },
    centerOffsetSmoothed: function() {
      return Math.round(this.currentCenterOffset);
    },
    dragToScroll: function() {
      return !this.hasTouchEvents;
    },
    scrollLeftMin: function() {
      var w;
      w = (this.boundingRight - this.boundingLeft) * this.zoom;
      if (w < this.viewWidth) {
        return (this.boundingLeft + this.centerOffsetSmoothed) * this.zoom - (this.viewWidth - w) / 2;
      } else {
        return (this.boundingLeft + this.centerOffsetSmoothed) * this.zoom;
      }
    },
    scrollLeftMax: function() {
      var w;
      w = (this.boundingRight - this.boundingLeft) * this.zoom;
      if (w < this.viewWidth) {
        return (this.boundingLeft + this.centerOffsetSmoothed) * this.zoom - (this.viewWidth - w) / 2;
      } else {
        return (this.boundingRight + this.centerOffsetSmoothed) * this.zoom - this.viewWidth;
      }
    },
    scrollTopMin: function() {
      var h;
      h = this.pageHeight * this.zoom;
      if (h < this.viewHeight) {
        return this.yMargin * this.zoom - (this.viewHeight - h) / 2;
      } else {
        return this.yMargin * this.zoom;
      }
    },
    scrollTopMax: function() {
      var h;
      h = this.pageHeight * this.zoom;
      if (h < this.viewHeight) {
        return this.yMargin * this.zoom - (this.viewHeight - h) / 2;
      } else {
        return (this.yMargin + this.pageHeight) * this.zoom - this.viewHeight;
      }
    },
    scrollLeftLimited: function() {
      return Math.min(this.scrollLeftMax, Math.max(this.scrollLeftMin, this.scrollLeft));
    },
    scrollTopLimited: function() {
      return Math.min(this.scrollTopMax, Math.max(this.scrollTopMin, this.scrollTop));
    }
  },
  mounted: function() {
    window.addEventListener('resize', this.onResize, {
      passive: true
    });
    this.onResize();
    this.zoom = this.zooms_[0];
    return this.goToPage(this.startPage);
  },
  beforeDestroy: function() {
    return window.removeEventListener('resize', this.onResize, {
      passive: true
    });
  },
  methods: {
    onResize: function() {
      var viewport;
      viewport = this.$refs.viewport;
      if (!viewport) {
        return;
      }
      this.viewWidth = viewport.clientWidth;
      this.viewHeight = viewport.clientHeight;
      this.displayedPages = this.viewWidth > this.viewHeight && !this.singlePage ? 2 : 1;
      if (this.displayedPages === 2) {
        this.currentPage &= ~1;
      }
      this.fixFirstPage();
      this.minX = 2e308;
      return this.maxX = -2e308;
    },
    fixFirstPage: function() {
      if (this.displayedPages === 1 && this.currentPage === 0 && this.pages.length && !this.pageUrl(0)) {
        return this.currentPage++;
      }
    },
    pageUrl: function(page, hiRes) {
      if ( hiRes === void 0 ) hiRes = false;

      var url;
      if (hiRes && this.zoom > 1 && !this.zooming) {
        url = this.pagesHiRes[page];
        if (url) {
          return url;
        }
      }
      return this.pages[page] || null;
    },
    pageUrlLoading: function(page, hiRes) {
      if ( hiRes === void 0 ) hiRes = false;

      var url;
      url = this.pageUrl(page, hiRes);
      if (hiRes && this.zoom > 1 && !this.zooming) {
        // High-res image doesn't use 'loading'
        return url;
      }
      return url && this.loadImage(url);
    },
    flipLeft: function() {
      if (!this.canFlipLeft) {
        return;
      }
      return this.flipStart('left', true);
    },
    flipRight: function() {
      if (!this.canFlipRight) {
        return;
      }
      return this.flipStart('right', true);
    },
    makePolygonArray: function(face) {
      var bgPos, dRadian, dRotate, direction, i, image, j, lighting, m, originRight, pageMatrix, pageRotation, pageX, polygonWidth, progress, rad, radian, radius, ref, results, rotate, theta, x, x0, x1, z;
      if (!this.flip.direction) {
        return [];
      }
      progress = this.flip.progress;
      direction = this.flip.direction;
      if (this.displayedPages === 1 && direction !== this.forwardDirection) {
        progress = 1 - progress;
        direction = this.forwardDirection;
      }
      this.flip.opacity = this.displayedPages === 1 && progress > .7 ? 1 - (progress - .7) / .3 : 1;
      image = face === 'front' ? this.flip.frontImage : this.flip.backImage;
      polygonWidth = this.pageWidth / this.nPolygons;
      pageX = this.xMargin;
      originRight = false;
      if (this.displayedPages === 1) {
        if (this.forwardDirection === 'right') {
          if (face === 'back') {
            originRight = true;
            pageX = this.xMargin - this.pageWidth;
          }
        } else {
          if (direction === 'left') {
            if (face === 'back') {
              pageX = this.pageWidth - this.xMargin;
            } else {
              originRight = true;
            }
          } else {
            if (face === 'front') {
              pageX = this.pageWidth - this.xMargin;
            } else {
              originRight = true;
            }
          }
        }
      } else {
        if (direction === 'left') {
          if (face === 'back') {
            pageX = this.viewWidth / 2;
          } else {
            originRight = true;
          }
        } else {
          if (face === 'front') {
            pageX = this.viewWidth / 2;
          } else {
            originRight = true;
          }
        }
      }
      pageMatrix = new Matrix$1();
      pageMatrix.translate(this.viewWidth / 2);
      pageMatrix.perspective(this.perspective);
      pageMatrix.translate(-this.viewWidth / 2);
      pageMatrix.translate(pageX, this.yMargin);
      pageRotation = 0;
      if (progress > 0.5) {
        pageRotation = -(progress - 0.5) * 2 * 180;
      }
      if (direction === 'left') {
        pageRotation = -pageRotation;
      }
      if (face === 'back') {
        pageRotation += 180;
      }
      if (pageRotation) {
        if (originRight) {
          pageMatrix.translate(this.pageWidth);
        }
        pageMatrix.rotateY(pageRotation);
        if (originRight) {
          pageMatrix.translate(-this.pageWidth);
        }
      }
      if (progress < 0.5) {
        theta = progress * 2 * Math.PI;
      } else {
        theta = (1 - (progress - 0.5) * 2) * Math.PI;
      }
      if (theta === 0) {
        theta = 1e-9;
      }
      radius = this.pageWidth / theta;
      radian = 0;
      dRadian = theta / this.nPolygons;
      rotate = dRadian / 2 / Math.PI * 180;
      dRotate = dRadian / Math.PI * 180;
      if (originRight) {
        rotate = -theta / Math.PI * 180 + dRotate / 2;
      }
      if (face === 'back') {
        rotate = -rotate;
        dRotate = -dRotate;
      }
      this.minX = 2e308;
      this.maxX = -2e308;
      results = [];
      for (i = j = 0, ref = this.nPolygons; (0 <= ref ? j < ref : j > ref); i = 0 <= ref ? ++j : --j) {
        bgPos = (i / (this.nPolygons - 1) * 100) + "% 0px";
        m = pageMatrix.clone();
        rad = originRight ? theta - radian : radian;
        x = Math.sin(rad) * radius;
        if (originRight) {
          x = this.pageWidth - x;
        }
        z = (1 - Math.cos(rad)) * radius;
        if (face === 'back') {
          z = -z;
        }
        m.translate3d(x, 0, z);
        m.rotateY(-rotate);
        x0 = m.transformX(0);
        x1 = m.transformX(polygonWidth);
        this.maxX = Math.max(Math.max(x0, x1), this.maxX);
        this.minX = Math.min(Math.min(x0, x1), this.minX);
        lighting = this.computeLighting(pageRotation - rotate, dRotate);
        radian += dRadian;
        rotate += dRotate;
        results.push([face + i, image, lighting, bgPos, m.toString(), Math.abs(Math.round(z))]);
      }
      return results;
    },
    computeLighting: function(rot, dRotate) {
      var DEG, POW, blackness, diffuse, gradients, lightingPoints, specular;
      gradients = [];
      lightingPoints = [-0.5, -0.25, 0, 0.25, 0.5];
      if (this.ambient < 1) {
        blackness = 1 - this.ambient;
        diffuse = lightingPoints.map(function (d) {
          return (1 - Math.cos((rot - dRotate * d) / 180 * Math.PI)) * blackness;
        });
        gradients.push(("linear-gradient(to right,\n  rgba(0, 0, 0, " + (diffuse[0]) + "),\n  rgba(0, 0, 0, " + (diffuse[1]) + ") 25%,\n  rgba(0, 0, 0, " + (diffuse[2]) + ") 50%,\n  rgba(0, 0, 0, " + (diffuse[3]) + ") 75%,\n  rgba(0, 0, 0, " + (diffuse[4]) + "))"));
      }
      if (this.gloss > 0 && !IE) {
        DEG = 30;
        POW = 200;
        specular = lightingPoints.map(function (d) {
          return Math.max(Math.pow( Math.cos((rot + DEG - dRotate * d) / 180 * Math.PI), POW ), Math.pow( Math.cos((rot - DEG - dRotate * d) / 180 * Math.PI), POW ));
        });
        gradients.push(("linear-gradient(to right,\n  rgba(255, 255, 255, " + (specular[0] * this.gloss) + "),\n  rgba(255, 255, 255, " + (specular[1] * this.gloss) + ") 25%,\n  rgba(255, 255, 255, " + (specular[2] * this.gloss) + ") 50%,\n  rgba(255, 255, 255, " + (specular[3] * this.gloss) + ") 75%,\n  rgba(255, 255, 255, " + (specular[4] * this.gloss) + "))"));
      }
      return gradients.join(',');
    },
    flipStart: function(direction, auto) {
      var this$1 = this;

      if (direction !== this.forwardDirection) {
        if (this.displayedPages === 1) {
          this.flip.frontImage = this.pageUrl(this.currentPage - 1);
          this.flip.backImage = null;
        } else {
          this.flip.frontImage = this.pageUrl(this.firstPage);
          this.flip.backImage = this.pageUrl(this.currentPage - this.displayedPages + 1);
        }
      } else {
        if (this.displayedPages === 1) {
          this.flip.frontImage = this.pageUrl(this.currentPage);
          this.flip.backImage = null;
        } else {
          this.flip.frontImage = this.pageUrl(this.secondPage);
          this.flip.backImage = this.pageUrl(this.currentPage + this.displayedPages);
        }
      }
      this.flip.direction = direction;
      this.flip.progress = 0;
      return requestAnimationFrame(function () {
        return requestAnimationFrame(function () {
          if (this$1.flip.direction !== this$1.forwardDirection) {
            if (this$1.displayedPages === 2) {
              this$1.firstPage = this$1.currentPage - this$1.displayedPages;
            }
          } else {
            if (this$1.displayedPages === 1) {
              this$1.firstPage = this$1.currentPage + this$1.displayedPages;
            } else {
              this$1.secondPage = this$1.currentPage + 1 + this$1.displayedPages;
            }
          }
          if (auto) {
            return this$1.flipAuto(true);
          }
        });
      });
    },
    flipAuto: function(ease) {
      var this$1 = this;

      var animate, duration, startRatio, t0;
      t0 = Date.now();
      duration = this.flipDuration * (1 - this.flip.progress);
      startRatio = this.flip.progress;
      this.flip.auto = true;
      this.$emit(("flip-" + (this.flip.direction) + "-start"), this.page);
      animate = function () {
        return requestAnimationFrame(function () {
          var ratio, t;
          t = Date.now() - t0;
          ratio = startRatio + t / duration;
          if (ratio > 1) {
            ratio = 1;
          }
          this$1.flip.progress = ease ? easeInOut(ratio) : ratio;
          if (ratio < 1) {
            return animate();
          } else {
            if (this$1.flip.direction !== this$1.forwardDirection) {
              this$1.currentPage -= this$1.displayedPages;
            } else {
              this$1.currentPage += this$1.displayedPages;
            }
            this$1.$emit(("flip-" + (this$1.flip.direction) + "-end"), this$1.page);
            if (this$1.displayedPages === 1 && this$1.flip.direction === this$1.forwardDirection) {
              this$1.flip.direction = null;
            } else {
              this$1.onImageLoad(1, function () {
                return this$1.flip.direction = null;
              });
            }
            return this$1.flip.auto = false;
          }
        });
      };
      return animate();
    },
    flipRevert: function() {
      var this$1 = this;

      var animate, duration, startRatio, t0;
      t0 = Date.now();
      duration = this.flipDuration * this.flip.progress;
      startRatio = this.flip.progress;
      this.flip.auto = true;
      animate = function () {
        return requestAnimationFrame(function () {
          var ratio, t;
          t = Date.now() - t0;
          ratio = startRatio - startRatio * t / duration;
          if (ratio < 0) {
            ratio = 0;
          }
          this$1.flip.progress = ratio;
          if (ratio > 0) {
            return animate();
          } else {
            this$1.firstPage = this$1.currentPage;
            this$1.secondPage = this$1.currentPage + 1;
            if (this$1.displayedPages === 1 && this$1.flip.direction !== this$1.forwardDirection) {
              this$1.flip.direction = null;
            } else {
              this$1.onImageLoad(1, function () {
                return this$1.flip.direction = null;
              });
            }
            return this$1.flip.auto = false;
          }
        });
      };
      return animate();
    },
    onImageLoad: function(trigger, cb) {
      this.nImageLoad = 0;
      this.nImageLoadTrigger = trigger;
      return this.imageLoadCallback = cb;
    },
    didLoadImage: function(ev) {
      if (this.imageWidth === null) {
        this.imageWidth = (ev.target || ev.path[0]).naturalWidth;
        this.imageHeight = (ev.target || ev.path[0]).naturalHeight;
        this.preloadImages();
      }
      if (!this.imageLoadCallback) {
        return;
      }
      if (++this.nImageLoad >= this.nImageLoadTrigger) {
        this.imageLoadCallback();
        return this.imageLoadCallback = null;
      }
    },
    zoomIn: function() {
      if (!this.canZoomIn) {
        return;
      }
      this.zoomIndex += 1;
      return this.zoomTo(this.zooms_[this.zoomIndex]);
    },
    zoomOut: function() {
      if (!this.canZoomOut) {
        return;
      }
      this.zoomIndex -= 1;
      return this.zoomTo(this.zooms_[this.zoomIndex]);
    },
    zoomTo: function(zoom, fixedX, fixedY) {
      var this$1 = this;

      var animate, containerFixedX, containerFixedY, end, endX, endY, start, startX, startY, t0, viewport;
      start = this.zoom;
      end = zoom;
      viewport = this.$refs.viewport;
      startX = viewport.scrollLeft;
      startY = viewport.scrollTop;
      fixedX || (fixedX = viewport.clientWidth / 2);
      fixedY || (fixedY = viewport.clientHeight / 2);
      containerFixedX = fixedX + startX;
      containerFixedY = fixedY + startY;
      endX = containerFixedX / start * end - fixedX;
      endY = containerFixedY / start * end - fixedY;
      t0 = Date.now();
      this.zooming = true;
      this.$emit('zoom-start', zoom);
      animate = function () {
        return requestAnimationFrame(function () {
          var ratio, t;
          t = Date.now() - t0;
          ratio = t / this$1.zoomDuration;
          if (ratio > 1 || IE) {
            ratio = 1;
          }
          ratio = easeInOut(ratio);
          this$1.zoom = start + (end - start) * ratio;
          this$1.scrollLeft = startX + (endX - startX) * ratio;
          this$1.scrollTop = startY + (endY - startY) * ratio;
          if (t < this$1.zoomDuration) {
            return animate();
          } else {
            this$1.$emit('zoom-end', zoom);
            this$1.zooming = false;
            this$1.zoom = zoom;
            this$1.scrollLeft = endX;
            return this$1.scrollTop = endY;
          }
        });
      };
      animate();
      if (end > 1) {
        return this.preloadImages(true);
      }
    },
    zoomAt: function(touch) {
      var rect, x, y;
      rect = this.$refs.viewport.getBoundingClientRect();
      x = touch.pageX - rect.left;
      y = touch.pageY - rect.top;
      this.zoomIndex = (this.zoomIndex + 1) % this.zooms_.length;
      return this.zoomTo(this.zooms_[this.zoomIndex], x, y);
    },
    swipeStart: function(touch) {
      this.touchStartX = touch.pageX;
      this.touchStartY = touch.pageY;
      this.maxMove = 0;
      if (this.zoom <= 1) {
        if (this.dragToFlip) {
          return this.activeCursor = 'grab';
        }
      } else {
        this.startScrollLeft = this.$refs.viewport.scrollLeft;
        this.startScrollTop = this.$refs.viewport.scrollTop;
        return this.activeCursor = 'all-scroll';
      }
    },
    swipeMove: function(touch) {
      var x, y;
      if (!this.dragToFlip) {
        return;
      }
      if (this.touchStartX == null) {
        return;
      }
      x = touch.pageX - this.touchStartX;
      y = touch.pageY - this.touchStartY;
      this.maxMove = Math.max(this.maxMove, Math.abs(x));
      this.maxMove = Math.max(this.maxMove, Math.abs(y));
      if (this.zoom > 1) {
        if (this.dragToScroll) {
          this.dragScroll(x, y);
        }
        return;
      }
      if (Math.abs(y) > Math.abs(x)) {
        return;
      }
      this.activeCursor = 'grabbing';
      if (x > 0) {
        if (this.flip.direction === null && this.canFlipLeft && x >= this.swipeMin) {
          this.flipStart('left', false);
        }
        if (this.flip.direction === 'left') {
          this.flip.progress = x / this.pageWidth;
          if (this.flip.progress > 1) {
            this.flip.progress = 1;
          }
        }
      } else {
        if (this.flip.direction === null && this.canFlipRight && x <= -this.swipeMin) {
          this.flipStart('right', false);
        }
        if (this.flip.direction === 'right') {
          this.flip.progress = -x / this.pageWidth;
          if (this.flip.progress > 1) {
            this.flip.progress = 1;
          }
        }
      }
      return true;
    },
    swipeEnd: function(touch) {
      if (this.touchStartX == null) {
        return;
      }
      if (this.clickToZoom && this.maxMove < this.swipeMin) {
        this.zoomAt(touch);
      }
      if (this.flip.direction !== null && !this.flip.auto) {
        if (this.flip.progress > 1 / 4) {
          this.flipAuto(false);
        } else {
          this.flipRevert();
        }
      }
      this.touchStartX = null;
      return this.activeCursor = null;
    },
    onTouchStart: function(ev) {
      this.hasTouchEvents = true;
      return this.swipeStart(ev.changedTouches[0]);
    },
    onTouchMove: function(ev) {
      if (this.swipeMove(ev.changedTouches[0])) {
        if (ev.cancelable) {
          return ev.preventDefault();
        }
      }
    },
    onTouchEnd: function(ev) {
      return this.swipeEnd(ev.changedTouches[0]);
    },
    onPointerDown: function(ev) {
      this.hasPointerEvents = true;
      if (this.hasTouchEvents) {
        return;
      }
      if (ev.which && ev.which !== 1) { // Ignore right-click
        return;
      }
      this.swipeStart(ev);
      try {
        return ev.target.setPointerCapture(ev.pointerId);
      } catch (error) {

      }
    },
    onPointerMove: function(ev) {
      if (!this.hasTouchEvents) {
        return this.swipeMove(ev);
      }
    },
    onPointerUp: function(ev) {
      if (this.hasTouchEvents) {
        return;
      }
      this.swipeEnd(ev);
      try {
        return ev.target.releasePointerCapture(ev.pointerId);
      } catch (error) {

      }
    },
    onMouseDown: function(ev) {
      if (this.hasTouchEvents || this.hasPointerEvents) {
        return;
      }
      if (ev.which && ev.which !== 1) { // Ignore right-click
        return;
      }
      return this.swipeStart(ev);
    },
    onMouseMove: function(ev) {
      if (!(this.hasTouchEvents || this.hasPointerEvents)) {
        return this.swipeMove(ev);
      }
    },
    onMouseUp: function(ev) {
      if (!(this.hasTouchEvents || this.hasPointerEvents)) {
        return this.swipeEnd(ev);
      }
    },
    dragScroll: function(x, y) {
      this.scrollLeft = this.startScrollLeft - x;
      return this.scrollTop = this.startScrollTop - y;
    },
    onWheel: function(ev) {
      if (this.zoom > 1 && this.dragToScroll) {
        this.scrollLeft = this.$refs.viewport.scrollLeft + ev.deltaX;
        this.scrollTop = this.$refs.viewport.scrollTop + ev.deltaY;
        if (ev.cancelable) {
          return ev.preventDefault();
        }
      }
    },
    preloadImages: function(hiRes) {
      if ( hiRes === void 0 ) hiRes = false;

      var i, j, k, ref, ref1, ref2, ref3, src;
      for (i = j = ref = this.currentPage - 3, ref1 = this.currentPage + 3; (ref <= ref1 ? j <= ref1 : j >= ref1); i = ref <= ref1 ? ++j : --j) {
        this.pageUrlLoading(i); // this preloads image
      }
      if (hiRes) {
        for (i = k = ref2 = this.currentPage, ref3 = this.currentPage + this.displayedPages; (ref2 <= ref3 ? k < ref3 : k > ref3); i = ref2 <= ref3 ? ++k : --k) {
          src = this.pagesHiRes[i];
          if (src) {
            (new Image()).src = src;
          }
        }
      }
    },
    goToPage: function(p) {
      if (p === null || p === this.page) {
        return;
      }
      if (this.pages[0] === null) {
        if (this.displayedPages === 2 && p === 1) {
          this.currentPage = 0;
        } else {
          this.currentPage = p;
        }
      } else {
        this.currentPage = p - 1;
      }
      this.minX = 2e308;
      this.maxX = -2e308;
      return this.currentCenterOffset = this.centerOffset;
    },
    loadImage: function(url) {
      var this$1 = this;

      var img;
      if (this.imageWidth === null) {
        // First loaded image defines the image width and height.
        // So it must be true image, not 'loading' image.
        return url;
      } else {
        if (this.loadedImages[url]) {
          return url;
        } else {
          img = new Image();
          img.onload = function () {
            return this$1.$set(this$1.loadedImages, url, true);
          };
          img.src = url;
          return this.loadingImage;
        }
      }
    }
  },
  watch: {
    currentPage: function() {
      this.firstPage = this.currentPage;
      this.secondPage = this.currentPage + 1;
      return this.preloadImages();
    },
    centerOffset: function() {
      var this$1 = this;

      var animate;
      if (this.animatingCenter) {
        return;
      }
      animate = function () {
        return requestAnimationFrame(function () {
          var diff, rate;
          rate = 0.1;
          diff = this$1.centerOffset - this$1.currentCenterOffset;
          if (Math.abs(diff) < 0.5) {
            this$1.currentCenterOffset = this$1.centerOffset;
            return this$1.animatingCenter = false;
          } else {
            this$1.currentCenterOffset += diff * rate;
            return animate();
          }
        });
      };
      this.animatingCenter = true;
      return animate();
    },
    scrollLeftLimited: function(val) {
      var this$1 = this;

      if (IE) {
        return requestAnimationFrame(function () {
          return this$1.$refs.viewport.scrollLeft = val;
        });
      } else {
        return this.$refs.viewport.scrollLeft = val;
      }
    },
    scrollTopLimited: function(val) {
      var this$1 = this;

      if (IE) {
        return requestAnimationFrame(function () {
          return this$1.$refs.viewport.scrollTop = val;
        });
      } else {
        return this.$refs.viewport.scrollTop = val;
      }
    },
    pages: function(after, before) {
      this.fixFirstPage();
      if (!(before != null ? before.length : void 0) && (after != null ? after.length : void 0)) {
        if (this.startPage > 1 && after[0] === null) {
          return this.currentPage++;
        }
      }
    },
    startPage: function(p) {
      return this.goToPage(p);
    }
  }
};

function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier /* server only */, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
    if (typeof shadowMode !== 'boolean') {
        createInjectorSSR = createInjector;
        createInjector = shadowMode;
        shadowMode = false;
    }
    // Vue.extend constructor export interop.
    var options = typeof script === 'function' ? script.options : script;
    // render functions
    if (template && template.render) {
        options.render = template.render;
        options.staticRenderFns = template.staticRenderFns;
        options._compiled = true;
        // functional template
        if (isFunctionalTemplate) {
            options.functional = true;
        }
    }
    // scopedId
    if (scopeId) {
        options._scopeId = scopeId;
    }
    var hook;
    if (moduleIdentifier) {
        // server build
        hook = function (context) {
            // 2.3 injection
            context =
                context || // cached call
                    (this.$vnode && this.$vnode.ssrContext) || // stateful
                    (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext); // functional
            // 2.2 with runInNewContext: true
            if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
                context = __VUE_SSR_CONTEXT__;
            }
            // inject component styles
            if (style) {
                style.call(this, createInjectorSSR(context));
            }
            // register component module identifier for async chunk inference
            if (context && context._registeredComponents) {
                context._registeredComponents.add(moduleIdentifier);
            }
        };
        // used by ssr in case component is cached and beforeCreate
        // never gets called
        options._ssrRegister = hook;
    }
    else if (style) {
        hook = shadowMode
            ? function (context) {
                style.call(this, createInjectorShadow(context, this.$root.$options.shadowRoot));
            }
            : function (context) {
                style.call(this, createInjector(context));
            };
    }
    if (hook) {
        if (options.functional) {
            // register for functional component in vue file
            var originalRender = options.render;
            options.render = function renderWithStyleInjection(h, context) {
                hook.call(context);
                return originalRender(h, context);
            };
        }
        else {
            // inject component registration as beforeCreate hook
            var existing = options.beforeCreate;
            options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
    }
    return script;
}

var isOldIE = typeof navigator !== 'undefined' &&
    /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());
function createInjector(context) {
    return function (id, style) { return addStyle(id, style); };
}
var HEAD;
var styles = {};
function addStyle(id, css) {
    var group = isOldIE ? css.media || 'default' : id;
    var style = styles[group] || (styles[group] = { ids: new Set(), styles: [] });
    if (!style.ids.has(id)) {
        style.ids.add(id);
        var code = css.source;
        if (css.map) {
            // https://developer.chrome.com/devtools/docs/javascript-debugging
            // this makes source maps inside style tags work properly in Chrome
            code += '\n/*# sourceURL=' + css.map.sources[0] + ' */';
            // http://stackoverflow.com/a/26603875
            code +=
                '\n/*# sourceMappingURL=data:application/json;base64,' +
                    btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
                    ' */';
        }
        if (!style.element) {
            style.element = document.createElement('style');
            style.element.type = 'text/css';
            if (css.media)
                { style.element.setAttribute('media', css.media); }
            if (HEAD === undefined) {
                HEAD = document.head || document.getElementsByTagName('head')[0];
            }
            HEAD.appendChild(style.element);
        }
        if ('styleSheet' in style.element) {
            style.styles.push(code);
            style.element.styleSheet.cssText = style.styles
                .filter(Boolean)
                .join('\n');
        }
        else {
            var index = style.ids.size - 1;
            var textNode = document.createTextNode(code);
            var nodes = style.element.childNodes;
            if (nodes[index])
                { style.element.removeChild(nodes[index]); }
            if (nodes.length)
                { style.element.insertBefore(textNode, nodes[index]); }
            else
                { style.element.appendChild(textNode); }
        }
    }
}

/* script */
var __vue_script__ = script;

/* template */
var __vue_render__ = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_vm._t("default",null,null,{
      canFlipLeft: _vm.canFlipLeft,
      canFlipRight: _vm.canFlipRight,
      canZoomIn: _vm.canZoomIn,
      canZoomOut: _vm.canZoomOut,
      page: _vm.page,
      numPages: _vm.numPages,
      flipLeft: _vm.flipLeft,
      flipRight: _vm.flipRight,
      zoomIn: _vm.zoomIn,
      zoomOut: _vm.zoomOut,
    }),_vm._v(" "),_c('div',{ref:"viewport",staticClass:"viewport",class:{
      zoom: _vm.zooming || _vm.zoom > 1,
      'drag-to-scroll': _vm.dragToScroll,
    },style:({ cursor: _vm.cursor == 'grabbing' ? 'grabbing' : 'auto' }),on:{"touchmove":_vm.onTouchMove,"pointermove":_vm.onPointerMove,"mousemove":_vm.onMouseMove,"touchend":_vm.onTouchEnd,"touchcancel":_vm.onTouchEnd,"pointerup":_vm.onPointerUp,"pointercancel":_vm.onPointerUp,"mouseup":_vm.onMouseUp,"wheel":_vm.onWheel}},[_c('div',{staticClass:"flipbook-container",style:({ transform: ("scale(" + _vm.zoom + ")") })},[_c('div',{staticClass:"click-to-flip left",style:({ cursor: _vm.canFlipLeft ? 'pointer' : 'auto' }),on:{"click":_vm.flipLeft}}),_vm._v(" "),_c('div',{staticClass:"click-to-flip right",style:({ cursor: _vm.canFlipRight ? 'pointer' : 'auto' }),on:{"click":_vm.flipRight}}),_vm._v(" "),_c('div',{style:({ transform: ("translateX(" + _vm.centerOffsetSmoothed + "px)") })},[(_vm.showLeftPage)?_c('img',{staticClass:"page fixed",style:({
            width: _vm.pageWidth + 'px',
            height: _vm.pageHeight + 'px',
            left: _vm.xMargin + 'px',
            top: _vm.yMargin + 'px',
          }),attrs:{"src":_vm.pageUrlLoading(_vm.leftPage, true)},on:{"load":function($event){return _vm.didLoadImage($event)}}}):_vm._e(),_vm._v(" "),(_vm.showRightPage)?_c('img',{staticClass:"page fixed",style:({
            width: _vm.pageWidth + 'px',
            height: _vm.pageHeight + 'px',
            left: _vm.viewWidth / 2 + 'px',
            top: _vm.yMargin + 'px',
          }),attrs:{"src":_vm.pageUrlLoading(_vm.rightPage, true)},on:{"load":function($event){return _vm.didLoadImage($event)}}}):_vm._e(),_vm._v(" "),_c('div',{style:({ opacity: _vm.flip.opacity })},_vm._l((_vm.polygonArray),function(ref){
            var key = ref[0];
            var bgImage = ref[1];
            var lighting = ref[2];
            var bgPos = ref[3];
            var transform = ref[4];
            var z = ref[5];
return _c('div',{key:key,staticClass:"polygon",class:{ blank: !bgImage },style:({
              backgroundImage: bgImage && ("url(" + (_vm.loadImage(bgImage)) + ")"),
              backgroundSize: _vm.polygonBgSize,
              backgroundPosition: bgPos,
              width: _vm.polygonWidth,
              height: _vm.polygonHeight,
              transform: transform,
              zIndex: z,
            })},[_c('div',{directives:[{name:"show",rawName:"v-show",value:(lighting.length),expression:"lighting.length"}],staticClass:"lighting",style:({ backgroundImage: lighting })})])}),0),_vm._v(" "),_c('div',{staticClass:"bounding-box",style:({
            left: _vm.boundingLeft + 'px',
            top: _vm.yMargin + 'px',
            width: _vm.boundingRight - _vm.boundingLeft + 'px',
            height: _vm.pageHeight + 'px',
            cursor: _vm.cursor,
          }),on:{"touchstart":_vm.onTouchStart,"pointerdown":_vm.onPointerDown,"mousedown":_vm.onMouseDown}})])])])],2)};
var __vue_staticRenderFns__ = [];

  /* style */
  var __vue_inject_styles__ = function (inject) {
    if (!inject) { return }
    inject("data-v-7564ba74_0", { source: ".viewport[data-v-7564ba74]{-webkit-overflow-scrolling:touch;width:100%;height:100%}.viewport.zoom[data-v-7564ba74]{overflow:scroll}.viewport.zoom.drag-to-scroll[data-v-7564ba74]{overflow:hidden}.flipbook-container[data-v-7564ba74]{position:relative;width:100%;height:100%;-webkit-transform-origin:top left;transform-origin:top left;-webkit-user-select:none;-ms-user-select:none;user-select:none}.click-to-flip[data-v-7564ba74]{position:absolute;width:50%;height:100%;top:0;-webkit-user-select:none;-ms-user-select:none;user-select:none}.click-to-flip.left[data-v-7564ba74]{left:0}.click-to-flip.right[data-v-7564ba74]{right:0}.bounding-box[data-v-7564ba74]{position:absolute;-webkit-user-select:none;-ms-user-select:none;user-select:none}.page[data-v-7564ba74]{position:absolute;-webkit-backface-visibility:hidden;backface-visibility:hidden}.polygon[data-v-7564ba74]{position:absolute;top:0;left:0;background-repeat:no-repeat;-webkit-backface-visibility:hidden;backface-visibility:hidden;-webkit-transform-origin:center left;transform-origin:center left}.polygon.blank[data-v-7564ba74]{background-color:#ddd}.polygon .lighting[data-v-7564ba74]{width:100%;height:100%}", map: undefined, media: undefined });

  };
  /* scoped */
  var __vue_scope_id__ = "data-v-7564ba74";
  /* module identifier */
  var __vue_module_identifier__ = undefined;
  /* functional template */
  var __vue_is_functional_template__ = false;
  /* style inject SSR */
  
  /* style inject shadow dom */
  

  
  var __vue_component__ = /*#__PURE__*/normalizeComponent(
    { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
    __vue_inject_styles__,
    __vue_script__,
    __vue_scope_id__,
    __vue_is_functional_template__,
    __vue_module_identifier__,
    false,
    createInjector,
    undefined,
    undefined
  );

export default __vue_component__;
