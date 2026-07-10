(() => {
  'use strict';
  var t = {
      2481(t, e, r) {
        var n = r(8252),
          o = r(1958),
          i = TypeError;
        t.exports = function (t) {
          if (n(t)) return t;
          throw new i(o(t) + ' is not a function');
        };
      },
      7938(t, e, r) {
        var n = r(2666),
          o = r(3369),
          i = r(1250).f,
          a = n('unscopables'),
          u = Array.prototype;
        (void 0 === u[a] && i(u, a, { configurable: !0, value: o(null) }),
          (t.exports = function (t) {
            u[a][t] = !0;
          }));
      },
      3162(t, e, r) {
        var n = r(8271),
          o = String,
          i = TypeError;
        t.exports = function (t) {
          if (n(t)) return t;
          throw new i(o(t) + ' is not an object');
        };
      },
      8658(t, e, r) {
        var n = r(2364),
          o = r(9283),
          i = r(6013),
          a = function (t) {
            return function (e, r, a) {
              var u,
                c = n(e),
                s = i(c);
              if (0 === s) return !t && -1;
              var f = o(a, s);
              if (t && r != r) {
                for (; s > f;) if ((u = c[f++]) != u) return !0;
              } else for (; s > f; f++) if ((t || f in c) && c[f] === r) return t || f || 0;
              return !t && -1;
            };
          };
        t.exports = { includes: a(!0), indexOf: a(!1) };
      },
      7409(t, e, r) {
        var n = r(2289),
          o = n({}.toString),
          i = n(''.slice);
        t.exports = function (t) {
          return i(o(t), 8, -1);
        };
      },
      4993(t, e, r) {
        var n = r(9522),
          o = r(5456),
          i = r(6056),
          a = r(1250);
        t.exports = function (t, e, r) {
          for (var u = o(e), c = a.f, s = i.f, f = 0; f < u.length; f++) {
            var p = u[f];
            n(t, p) || (r && n(r, p)) || c(t, p, s(e, p));
          }
        };
      },
      232(t, e, r) {
        var n = r(7101),
          o = r(1250),
          i = r(9299);
        t.exports = n
          ? function (t, e, r) {
              return o.f(t, e, i(1, r));
            }
          : function (t, e, r) {
              return ((t[e] = r), t);
            };
      },
      9299(t) {
        t.exports = function (t, e) {
          return { enumerable: !(1 & t), configurable: !(2 & t), writable: !(4 & t), value: e };
        };
      },
      3589(t, e, r) {
        var n = r(8252),
          o = r(1250),
          i = r(4034),
          a = r(7214);
        t.exports = function (t, e, r, u) {
          u || (u = {});
          var c = u.enumerable,
            s = void 0 !== u.name ? u.name : e;
          if ((n(r) && i(r, s, u), u.global)) c ? (t[e] = r) : a(e, r);
          else {
            try {
              u.unsafe ? t[e] && (c = !0) : delete t[e];
            } catch (t) {}
            c
              ? (t[e] = r)
              : o.f(t, e, {
                  value: r,
                  enumerable: !1,
                  configurable: !u.nonConfigurable,
                  writable: !u.nonWritable,
                });
          }
          return t;
        };
      },
      7214(t, e, r) {
        var n = r(3405),
          o = Object.defineProperty;
        t.exports = function (t, e) {
          try {
            o(n, t, { value: e, configurable: !0, writable: !0 });
          } catch (r) {
            n[t] = e;
          }
          return e;
        };
      },
      7101(t, e, r) {
        t.exports = !r(8930)(function () {
          return (
            7 !==
            Object.defineProperty({}, 1, {
              get: function () {
                return 7;
              },
            })[1]
          );
        });
      },
      2998(t, e, r) {
        var n = r(3405),
          o = r(8271),
          i = n.document,
          a = o(i) && o(i.createElement);
        t.exports = function (t) {
          return a ? i.createElement(t) : {};
        };
      },
      7658(t) {
        t.exports = [
          'constructor',
          'hasOwnProperty',
          'isPrototypeOf',
          'propertyIsEnumerable',
          'toLocaleString',
          'toString',
          'valueOf',
        ];
      },
      6332(t, e, r) {
        var n = r(3405).navigator,
          o = n && n.userAgent;
        t.exports = o ? String(o) : '';
      },
      5168(t, e, r) {
        var n,
          o,
          i = r(3405),
          a = r(6332),
          u = i.process,
          c = i.Deno,
          s = (u && u.versions) || (c && c.version),
          f = s && s.v8;
        (f && (o = (n = f.split('.'))[0] > 0 && n[0] < 4 ? 1 : +(n[0] + n[1])),
          !o &&
            a &&
            (!(n = a.match(/Edge\/(\d+)/)) || n[1] >= 74) &&
            (n = a.match(/Chrome\/(\d+)/)) &&
            (o = +n[1]),
          (t.exports = o));
      },
      7725(t, e, r) {
        var n = r(3405),
          o = r(6056).f,
          i = r(232),
          a = r(3589),
          u = r(7214),
          c = r(4993),
          s = r(5129);
        t.exports = function (t, e) {
          var r,
            f,
            p,
            l,
            v,
            y = t.target,
            d = t.global,
            g = t.stat;
          if ((r = d ? n : g ? n[y] || u(y, {}) : n[y] && n[y].prototype))
            for (f in e) {
              if (
                ((l = e[f]),
                (p = t.dontCallGetSet ? (v = o(r, f)) && v.value : r[f]),
                !s(d ? f : y + (g ? '.' : '#') + f, t.forced) && void 0 !== p)
              ) {
                if (typeof l == typeof p) continue;
                c(l, p);
              }
              ((t.sham || (p && p.sham)) && i(l, 'sham', !0), a(r, f, l, t));
            }
        };
      },
      8930(t) {
        t.exports = function (t) {
          try {
            return !!t();
          } catch (t) {
            return !0;
          }
        };
      },
      5647(t, e, r) {
        t.exports = !r(8930)(function () {
          var t = function () {}.bind();
          return 'function' != typeof t || t.hasOwnProperty('prototype');
        });
      },
      3176(t, e, r) {
        var n = r(5647),
          o = Function.prototype.call;
        t.exports = n
          ? o.bind(o)
          : function () {
              return o.apply(o, arguments);
            };
      },
      3743(t, e, r) {
        var n = r(7101),
          o = r(9522),
          i = Function.prototype,
          a = n && Object.getOwnPropertyDescriptor,
          u = o(i, 'name'),
          c = u && (!n || (n && a(i, 'name').configurable));
        t.exports = {
          EXISTS: u,
          PROPER: u && 'something' === function () {}.name,
          CONFIGURABLE: c,
        };
      },
      2289(t, e, r) {
        var n = r(5647),
          o = Function.prototype,
          i = o.call,
          a = n && o.bind.bind(i, i);
        t.exports = n
          ? a
          : function (t) {
              return function () {
                return i.apply(t, arguments);
              };
            };
      },
      3220(t, e, r) {
        var n = r(3405),
          o = r(8252);
        t.exports = function (t, e) {
          var r;
          return arguments.length < 2 ? (o((r = n[t])) ? r : void 0) : n[t] && n[t][e];
        };
      },
      3377(t, e, r) {
        var n = r(2481),
          o = r(3022);
        t.exports = function (t, e) {
          var r = t[e];
          return o(r) ? void 0 : n(r);
        };
      },
      3405(t, e, r) {
        var n = function (t) {
          return t && t.Math === Math && t;
        };
        t.exports =
          n('object' == typeof globalThis && globalThis) ||
          n('object' == typeof window && window) ||
          n('object' == typeof self && self) ||
          n('object' == typeof r.g && r.g) ||
          n('object' == typeof this && this) ||
          (function () {
            return this;
          })() ||
          Function('return this')();
      },
      9522(t, e, r) {
        var n = r(2289),
          o = r(1724),
          i = n({}.hasOwnProperty);
        t.exports =
          Object.hasOwn ||
          function (t, e) {
            return i(o(t), e);
          };
      },
      4036(t) {
        t.exports = {};
      },
      9810(t, e, r) {
        t.exports = r(3220)('document', 'documentElement');
      },
      1782(t, e, r) {
        var n = r(7101),
          o = r(8930),
          i = r(2998);
        t.exports =
          !n &&
          !o(function () {
            return (
              7 !==
              Object.defineProperty(i('div'), 'a', {
                get: function () {
                  return 7;
                },
              }).a
            );
          });
      },
      1792(t, e, r) {
        var n = r(2289),
          o = r(8930),
          i = r(7409),
          a = Object,
          u = n(''.split);
        t.exports = o(function () {
          return !a('z').propertyIsEnumerable(0);
        })
          ? function (t) {
              return 'String' === i(t) ? u(t, '') : a(t);
            }
          : a;
      },
      4117(t, e, r) {
        var n = r(2289),
          o = r(8252),
          i = r(8486),
          a = n(Function.toString);
        (o(i.inspectSource) ||
          (i.inspectSource = function (t) {
            return a(t);
          }),
          (t.exports = i.inspectSource));
      },
      4206(t, e, r) {
        var n,
          o,
          i,
          a = r(3337),
          u = r(3405),
          c = r(8271),
          s = r(232),
          f = r(9522),
          p = r(8486),
          l = r(4040),
          v = r(4036),
          y = 'Object already initialized',
          d = u.TypeError,
          g = u.WeakMap;
        if (a || p.state) {
          var b = p.state || (p.state = new g());
          ((b.get = b.get),
            (b.has = b.has),
            (b.set = b.set),
            (n = function (t, e) {
              if (b.has(t)) throw new d(y);
              return ((e.facade = t), b.set(t, e), e);
            }),
            (o = function (t) {
              return b.get(t) || {};
            }),
            (i = function (t) {
              return b.has(t);
            }));
        } else {
          var h = l('state');
          ((v[h] = !0),
            (n = function (t, e) {
              if (f(t, h)) throw new d(y);
              return ((e.facade = t), s(t, h, e), e);
            }),
            (o = function (t) {
              return f(t, h) ? t[h] : {};
            }),
            (i = function (t) {
              return f(t, h);
            }));
        }
        t.exports = {
          set: n,
          get: o,
          has: i,
          enforce: function (t) {
            return i(t) ? o(t) : n(t, {});
          },
          getterFor: function (t) {
            return function (e) {
              var r;
              if (!c(e) || (r = o(e)).type !== t)
                throw new d('Incompatible receiver, ' + t + ' required');
              return r;
            };
          },
        };
      },
      8252(t) {
        var e = 'object' == typeof document && document.all;
        t.exports =
          void 0 === e && void 0 !== e
            ? function (t) {
                return 'function' == typeof t || t === e;
              }
            : function (t) {
                return 'function' == typeof t;
              };
      },
      5129(t, e, r) {
        var n = r(8930),
          o = r(8252),
          i = /#|\.prototype\./,
          a = function (t, e) {
            var r = c[u(t)];
            return r === f || (r !== s && (o(e) ? n(e) : !!e));
          },
          u = (a.normalize = function (t) {
            return String(t).replace(i, '.').toLowerCase();
          }),
          c = (a.data = {}),
          s = (a.NATIVE = 'N'),
          f = (a.POLYFILL = 'P');
        t.exports = a;
      },
      3022(t) {
        t.exports = function (t) {
          return null == t;
        };
      },
      8271(t, e, r) {
        var n = r(8252);
        t.exports = function (t) {
          return 'object' == typeof t ? null !== t : n(t);
        };
      },
      4214(t) {
        t.exports = !1;
      },
      8944(t, e, r) {
        var n = r(3220),
          o = r(8252),
          i = r(8130),
          a = r(5537),
          u = Object;
        t.exports = a
          ? function (t) {
              return 'symbol' == typeof t;
            }
          : function (t) {
              var e = n('Symbol');
              return o(e) && i(e.prototype, u(t));
            };
      },
      6013(t, e, r) {
        var n = r(5531);
        t.exports = function (t) {
          return n(t.length);
        };
      },
      4034(t, e, r) {
        var n = r(2289),
          o = r(8930),
          i = r(8252),
          a = r(9522),
          u = r(7101),
          c = r(3743).CONFIGURABLE,
          s = r(4117),
          f = r(4206),
          p = f.enforce,
          l = f.get,
          v = String,
          y = Object.defineProperty,
          d = n(''.slice),
          g = n(''.replace),
          b = n([].join),
          h =
            u &&
            !o(function () {
              return 8 !== y(function () {}, 'length', { value: 8 }).length;
            }),
          m = String(String).split('String'),
          x = (t.exports = function (t, e, r) {
            ('Symbol(' === d(v(e), 0, 7) &&
              (e = '[' + g(v(e), /^Symbol\(([^)]*)\).*$/, '$1') + ']'),
              r && r.getter && (e = 'get ' + e),
              r && r.setter && (e = 'set ' + e),
              (!a(t, 'name') || (c && t.name !== e)) &&
                (u ? y(t, 'name', { value: e, configurable: !0 }) : (t.name = e)),
              h &&
                r &&
                a(r, 'arity') &&
                t.length !== r.arity &&
                y(t, 'length', { value: r.arity }));
            try {
              r && a(r, 'constructor') && r.constructor
                ? u && y(t, 'prototype', { writable: !1 })
                : t.prototype && (t.prototype = void 0);
            } catch (t) {}
            var n = p(t);
            return (a(n, 'source') || (n.source = b(m, 'string' == typeof e ? e : '')), t);
          });
        Function.prototype.toString = x(function () {
          return (i(this) && l(this).source) || s(this);
        }, 'toString');
      },
      7966(t) {
        var e = Math.ceil,
          r = Math.floor;
        t.exports =
          Math.trunc ||
          function (t) {
            var n = +t;
            return (n > 0 ? r : e)(n);
          };
      },
      3369(t, e, r) {
        var n,
          o = r(3162),
          i = r(5422),
          a = r(7658),
          u = r(4036),
          c = r(9810),
          s = r(2998),
          f = r(4040),
          p = 'prototype',
          l = 'script',
          v = f('IE_PROTO'),
          y = function () {},
          d = function (t) {
            return '<' + l + '>' + t + '</' + l + '>';
          },
          g = function (t) {
            (t.write(d('')), t.close());
            var e = t.parentWindow.Object;
            return ((t = null), e);
          },
          b = function () {
            var t,
              e = s('iframe');
            return (
              (e.style.display = 'none'),
              c.appendChild(e),
              (e.src = String('java' + l + ':')),
              (t = e.contentWindow.document).open(),
              t.write(d('document.F=Object')),
              t.close(),
              t.F
            );
          },
          h = function () {
            try {
              n = new ActiveXObject('htmlfile');
            } catch (t) {}
            h = 'u' > typeof document ? (document.domain && n ? g(n) : b()) : g(n);
            for (var t = a.length; t--;) delete h[p][a[t]];
            return h();
          };
        ((u[v] = !0),
          (t.exports =
            Object.create ||
            function (t, e) {
              var r;
              return (
                null !== t ? ((y[p] = o(t)), (r = new y()), (y[p] = null), (r[v] = t)) : (r = h()),
                void 0 === e ? r : i.f(r, e)
              );
            }));
      },
      5422(t, e, r) {
        var n = r(7101),
          o = r(3667),
          i = r(1250),
          a = r(3162),
          u = r(2364),
          c = r(7185);
        e.f =
          n && !o
            ? Object.defineProperties
            : function (t, e) {
                a(t);
                for (var r, n = u(e), o = c(e), s = o.length, f = 0; s > f;)
                  i.f(t, (r = o[f++]), n[r]);
                return t;
              };
      },
      1250(t, e, r) {
        var n = r(7101),
          o = r(1782),
          i = r(3667),
          a = r(3162),
          u = r(3704),
          c = TypeError,
          s = Object.defineProperty,
          f = Object.getOwnPropertyDescriptor,
          p = 'enumerable',
          l = 'configurable',
          v = 'writable';
        e.f = n
          ? i
            ? function (t, e, r) {
                if (
                  (a(t),
                  (e = u(e)),
                  a(r),
                  'function' == typeof t && 'prototype' === e && 'value' in r && v in r && !r[v])
                ) {
                  var n = f(t, e);
                  n &&
                    n[v] &&
                    ((t[e] = r.value),
                    (r = {
                      configurable: l in r ? r[l] : n[l],
                      enumerable: p in r ? r[p] : n[p],
                      writable: !1,
                    }));
                }
                return s(t, e, r);
              }
            : s
          : function (t, e, r) {
              if ((a(t), (e = u(e)), a(r), o))
                try {
                  return s(t, e, r);
                } catch (t) {}
              if ('get' in r || 'set' in r) throw new c('Accessors not supported');
              return ('value' in r && (t[e] = r.value), t);
            };
      },
      6056(t, e, r) {
        var n = r(7101),
          o = r(3176),
          i = r(6640),
          a = r(9299),
          u = r(2364),
          c = r(3704),
          s = r(9522),
          f = r(1782),
          p = Object.getOwnPropertyDescriptor;
        e.f = n
          ? p
          : function (t, e) {
              if (((t = u(t)), (e = c(e)), f))
                try {
                  return p(t, e);
                } catch (t) {}
              if (s(t, e)) return a(!o(i.f, t, e), t[e]);
            };
      },
      7469(t, e, r) {
        var n = r(6067),
          o = r(7658).concat('length', 'prototype');
        e.f =
          Object.getOwnPropertyNames ||
          function (t) {
            return n(t, o);
          };
      },
      4540(t, e) {
        e.f = Object.getOwnPropertySymbols;
      },
      8130(t, e, r) {
        t.exports = r(2289)({}.isPrototypeOf);
      },
      6067(t, e, r) {
        var n = r(2289),
          o = r(9522),
          i = r(2364),
          a = r(8658).indexOf,
          u = r(4036),
          c = n([].push);
        t.exports = function (t, e) {
          var r,
            n = i(t),
            s = 0,
            f = [];
          for (r in n) !o(u, r) && o(n, r) && c(f, r);
          for (; e.length > s;) o(n, (r = e[s++])) && (~a(f, r) || c(f, r));
          return f;
        };
      },
      7185(t, e, r) {
        var n = r(6067),
          o = r(7658);
        t.exports =
          Object.keys ||
          function (t) {
            return n(t, o);
          };
      },
      6640(t, e) {
        var r = {}.propertyIsEnumerable,
          n = Object.getOwnPropertyDescriptor;
        e.f =
          n && !r.call({ 1: 2 }, 1)
            ? function (t) {
                var e = n(this, t);
                return !!e && e.enumerable;
              }
            : r;
      },
      5519(t, e, r) {
        var n = r(3176),
          o = r(8252),
          i = r(8271),
          a = TypeError;
        t.exports = function (t, e) {
          var r, u;
          if (
            ('string' === e && o((r = t.toString)) && !i((u = n(r, t)))) ||
            (o((r = t.valueOf)) && !i((u = n(r, t)))) ||
            ('string' !== e && o((r = t.toString)) && !i((u = n(r, t))))
          )
            return u;
          throw new a("Can't convert object to primitive value");
        };
      },
      5456(t, e, r) {
        var n = r(3220),
          o = r(2289),
          i = r(7469),
          a = r(4540),
          u = r(3162),
          c = o([].concat);
        t.exports =
          n('Reflect', 'ownKeys') ||
          function (t) {
            var e = i.f(u(t)),
              r = a.f;
            return r ? c(e, r(t)) : e;
          };
      },
      2341(t, e, r) {
        var n = r(3022),
          o = TypeError;
        t.exports = function (t) {
          if (n(t)) throw new o("Can't call method on " + t);
          return t;
        };
      },
      4040(t, e, r) {
        var n = r(8762),
          o = r(2161),
          i = n('keys');
        t.exports = function (t) {
          return i[t] || (i[t] = o(t));
        };
      },
      8486(t, e, r) {
        var n = r(4214),
          o = r(3405),
          i = r(7214),
          a = '__core-js_shared__',
          u = (t.exports = o[a] || i(a, {}));
        (u.versions || (u.versions = [])).push({
          version: '3.49.0',
          mode: n ? 'pure' : 'global',
          copyright:
            '© 2013–2025 Denis Pushkarev (zloirock.ru), 2025–2026 CoreJS Company (core-js.io). All rights reserved.',
          license: 'https://github.com/zloirock/core-js/blob/v3.49.0/LICENSE',
          source: 'https://github.com/zloirock/core-js',
        });
      },
      8762(t, e, r) {
        var n = r(8486);
        t.exports = function (t, e) {
          return n[t] || (n[t] = e || {});
        };
      },
      1520(t, e, r) {
        var n = r(5168),
          o = r(8930),
          i = r(3405).String;
        t.exports =
          !!Object.getOwnPropertySymbols &&
          !o(function () {
            var t = Symbol('symbol detection');
            return !i(t) || !(Object(t) instanceof Symbol) || (!Symbol.sham && n && n < 41);
          });
      },
      9283(t, e, r) {
        var n = r(136),
          o = Math.max,
          i = Math.min;
        t.exports = function (t, e) {
          var r = n(t);
          return r < 0 ? o(r + e, 0) : i(r, e);
        };
      },
      2364(t, e, r) {
        var n = r(1792),
          o = r(2341);
        t.exports = function (t) {
          return n(o(t));
        };
      },
      136(t, e, r) {
        var n = r(7966);
        t.exports = function (t) {
          var e = +t;
          return e != e || 0 === e ? 0 : n(e);
        };
      },
      5531(t, e, r) {
        var n = r(136),
          o = Math.min;
        t.exports = function (t) {
          var e = n(t);
          return e > 0 ? o(e, 0x1fffffffffffff) : 0;
        };
      },
      1724(t, e, r) {
        var n = r(2341),
          o = Object;
        t.exports = function (t) {
          return o(n(t));
        };
      },
      4610(t, e, r) {
        var n = r(3176),
          o = r(8271),
          i = r(8944),
          a = r(3377),
          u = r(5519),
          c = r(2666),
          s = TypeError,
          f = c('toPrimitive');
        t.exports = function (t, e) {
          if (!o(t) || i(t)) return t;
          var r,
            c = a(t, f);
          if (c) {
            if ((void 0 === e && (e = 'default'), !o((r = n(c, t, e))) || i(r))) return r;
            throw new s("Can't convert object to primitive value");
          }
          return (void 0 === e && (e = 'number'), u(t, e));
        };
      },
      3704(t, e, r) {
        var n = r(4610),
          o = r(8944);
        t.exports = function (t) {
          var e = n(t, 'string');
          return o(e) ? e : e + '';
        };
      },
      1958(t) {
        var e = String;
        t.exports = function (t) {
          try {
            return e(t);
          } catch (t) {
            return 'Object';
          }
        };
      },
      2161(t, e, r) {
        var n = r(2289),
          o = 0,
          i = Math.random(),
          a = n((1.1).toString);
        t.exports = function (t) {
          return 'Symbol(' + (void 0 === t ? '' : t) + ')_' + a(++o + i, 36);
        };
      },
      5537(t, e, r) {
        t.exports = r(1520) && !Symbol.sham && 'symbol' == typeof Symbol.iterator;
      },
      3667(t, e, r) {
        var n = r(7101),
          o = r(8930);
        t.exports =
          n &&
          o(function () {
            return (
              42 !==
              Object.defineProperty(function () {}, 'prototype', { value: 42, writable: !1 })
                .prototype
            );
          });
      },
      3337(t, e, r) {
        var n = r(3405),
          o = r(8252),
          i = n.WeakMap;
        t.exports = o(i) && /native code/.test(String(i));
      },
      2666(t, e, r) {
        var n = r(3405),
          o = r(8762),
          i = r(9522),
          a = r(2161),
          u = r(1520),
          c = r(5537),
          s = n.Symbol,
          f = o('wks'),
          p = c ? s.for || s : (s && s.withoutSetter) || a;
        t.exports = function (t) {
          return (i(f, t) || (f[t] = u && i(s, t) ? s[t] : p('Symbol.' + t)), f[t]);
        };
      },
      9690(t, e, r) {
        var n = r(7725),
          o = r(8658).includes,
          i = r(8930),
          a = r(7938),
          u = i(function () {
            return ![,].includes();
          }),
          c = i(function () {
            return [, 1].includes(void 0, 1);
          });
        (n(
          { target: 'Array', proto: !0, forced: u || c },
          {
            includes: function (t) {
              return o(this, t, arguments.length > 1 ? arguments[1] : void 0);
            },
          },
        ),
          a('includes'));
      },
    },
    e = {};
  function r(n) {
    var o = e[n];
    if (void 0 !== o) return o.exports;
    var i = (e[n] = { exports: {} });
    return (t[n].call(i.exports, i, i.exports, r), i.exports);
  }
  ((r.u = (t) => 'ablation-worker.js'),
    (r.g = (() => {
      if ('object' == typeof globalThis) return globalThis;
      try {
        return this || Function('return this')();
      } catch (t) {
        if ('object' == typeof window) return window;
      }
    })()),
    (r.p = ''),
    (r.b = document.baseURI || self.location.href),
    (() => {
      r(9690);
      let t = {
          subtreePrune: !0,
          rangeSeeding: !0,
          autoModsMemo: !0,
          memoGate: !0,
          maxBoostMemo: !0,
          convergenceGate: !0,
          energyCache: !0,
          highStatSort: !0,
          strictBeat: !0,
          tuningPreGate: !0,
          coarseLevelPrunes: !0,
          unrolledAdds: !0,
        },
        e = Object.keys(t);
      if ('u' > typeof process && process.env?.LO_ABLATE)
        for (let e of process.env.LO_ABLATE.split(',')) {
          let r = e.trim();
          if (r in t) t[r] = !1;
          else if (r.length) throw Error(`Unknown LO_ABLATE flag: ${r}`);
        }
      let n = ['maxBoostMemo', 'energyCache', 'convergenceGate', 'unrolledAdds'],
        o = document.getElementById('out'),
        i = (t) => {
          o.textContent += `${t}
`;
        };
      (async function () {
        let t = new URLSearchParams(window.location.search),
          o = Number(t.get('rounds')) || 5,
          a = t.get('flags')?.split(','),
          u = t.get('scenarios'),
          c = await (await fetch('fixtures/manifest.json')).json();
        i(`fixtures generated ${c.generated} | rounds ${o} | ${navigator.userAgent}`);
        let s = [...e.map((t) => [t]), n],
          f = new Worker(new URL(r.p + r.u(861), r.b)),
          p = [],
          l = [];
        for (let t of c.scenarios) {
          if (u && !t.name.includes(u)) continue;
          let e = s.filter((e) => {
            let r = e.join('+');
            return (
              (!a || !!a.includes(r)) && (!t.relevant || e.every((e) => t.relevant.includes(e)))
            );
          });
          if (!e.length) continue;
          let r = await (await fetch(`fixtures/${t.file}`)).json();
          await new Promise((n) => {
            f.onmessage = (e) => {
              'line' === e.data.type
                ? i(e.data.text)
                : 'done' === e.data.type
                  ? (p.push(...e.data.rows), n())
                  : 'error' === e.data.type &&
                    (i(`ERROR in ${t.name}: ${e.data.error}`),
                    l.push(`${t.name}: ${e.data.error}`),
                    n());
            };
            let a = { type: 'run', name: t.name, inputs: r, measurements: e, rounds: o };
            f.postMessage(a);
          });
        }
        (i('ALL DONE'),
          (window.__ABLATION_RESULT = { rows: p, errors: l }),
          (document.title = 'ablation done'));
      })().catch((t) => {
        (i(`FATAL: ${t.message}`),
          (window.__ABLATION_RESULT = { rows: [], errors: [`fatal: ${t.message}`] }),
          (document.title = 'ablation done'));
      });
    })());
})();
