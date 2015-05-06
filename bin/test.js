(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
(function (process,global){
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/jakearchibald/es6-promise/master/LICENSE
 * @version   2.1.1
 */

(function() {
    "use strict";
    function lib$es6$promise$utils$$objectOrFunction(x) {
      return typeof x === 'function' || (typeof x === 'object' && x !== null);
    }

    function lib$es6$promise$utils$$isFunction(x) {
      return typeof x === 'function';
    }

    function lib$es6$promise$utils$$isMaybeThenable(x) {
      return typeof x === 'object' && x !== null;
    }

    var lib$es6$promise$utils$$_isArray;
    if (!Array.isArray) {
      lib$es6$promise$utils$$_isArray = function (x) {
        return Object.prototype.toString.call(x) === '[object Array]';
      };
    } else {
      lib$es6$promise$utils$$_isArray = Array.isArray;
    }

    var lib$es6$promise$utils$$isArray = lib$es6$promise$utils$$_isArray;
    var lib$es6$promise$asap$$len = 0;
    var lib$es6$promise$asap$$toString = {}.toString;
    var lib$es6$promise$asap$$vertxNext;
    function lib$es6$promise$asap$$asap(callback, arg) {
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len] = callback;
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len + 1] = arg;
      lib$es6$promise$asap$$len += 2;
      if (lib$es6$promise$asap$$len === 2) {
        // If len is 2, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        lib$es6$promise$asap$$scheduleFlush();
      }
    }

    var lib$es6$promise$asap$$default = lib$es6$promise$asap$$asap;

    var lib$es6$promise$asap$$browserWindow = (typeof window !== 'undefined') ? window : undefined;
    var lib$es6$promise$asap$$browserGlobal = lib$es6$promise$asap$$browserWindow || {};
    var lib$es6$promise$asap$$BrowserMutationObserver = lib$es6$promise$asap$$browserGlobal.MutationObserver || lib$es6$promise$asap$$browserGlobal.WebKitMutationObserver;
    var lib$es6$promise$asap$$isNode = typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

    // test for web worker but not in IE10
    var lib$es6$promise$asap$$isWorker = typeof Uint8ClampedArray !== 'undefined' &&
      typeof importScripts !== 'undefined' &&
      typeof MessageChannel !== 'undefined';

    // node
    function lib$es6$promise$asap$$useNextTick() {
      var nextTick = process.nextTick;
      // node version 0.10.x displays a deprecation warning when nextTick is used recursively
      // setImmediate should be used instead instead
      var version = process.versions.node.match(/^(?:(\d+)\.)?(?:(\d+)\.)?(\*|\d+)$/);
      if (Array.isArray(version) && version[1] === '0' && version[2] === '10') {
        nextTick = setImmediate;
      }
      return function() {
        nextTick(lib$es6$promise$asap$$flush);
      };
    }

    // vertx
    function lib$es6$promise$asap$$useVertxTimer() {
      return function() {
        lib$es6$promise$asap$$vertxNext(lib$es6$promise$asap$$flush);
      };
    }

    function lib$es6$promise$asap$$useMutationObserver() {
      var iterations = 0;
      var observer = new lib$es6$promise$asap$$BrowserMutationObserver(lib$es6$promise$asap$$flush);
      var node = document.createTextNode('');
      observer.observe(node, { characterData: true });

      return function() {
        node.data = (iterations = ++iterations % 2);
      };
    }

    // web worker
    function lib$es6$promise$asap$$useMessageChannel() {
      var channel = new MessageChannel();
      channel.port1.onmessage = lib$es6$promise$asap$$flush;
      return function () {
        channel.port2.postMessage(0);
      };
    }

    function lib$es6$promise$asap$$useSetTimeout() {
      return function() {
        setTimeout(lib$es6$promise$asap$$flush, 1);
      };
    }

    var lib$es6$promise$asap$$queue = new Array(1000);
    function lib$es6$promise$asap$$flush() {
      for (var i = 0; i < lib$es6$promise$asap$$len; i+=2) {
        var callback = lib$es6$promise$asap$$queue[i];
        var arg = lib$es6$promise$asap$$queue[i+1];

        callback(arg);

        lib$es6$promise$asap$$queue[i] = undefined;
        lib$es6$promise$asap$$queue[i+1] = undefined;
      }

      lib$es6$promise$asap$$len = 0;
    }

    function lib$es6$promise$asap$$attemptVertex() {
      try {
        var r = require;
        var vertx = r('vertx');
        lib$es6$promise$asap$$vertxNext = vertx.runOnLoop || vertx.runOnContext;
        return lib$es6$promise$asap$$useVertxTimer();
      } catch(e) {
        return lib$es6$promise$asap$$useSetTimeout();
      }
    }

    var lib$es6$promise$asap$$scheduleFlush;
    // Decide what async method to use to triggering processing of queued callbacks:
    if (lib$es6$promise$asap$$isNode) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useNextTick();
    } else if (lib$es6$promise$asap$$BrowserMutationObserver) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMutationObserver();
    } else if (lib$es6$promise$asap$$isWorker) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMessageChannel();
    } else if (lib$es6$promise$asap$$browserWindow === undefined && typeof require === 'function') {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$attemptVertex();
    } else {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useSetTimeout();
    }

    function lib$es6$promise$$internal$$noop() {}

    var lib$es6$promise$$internal$$PENDING   = void 0;
    var lib$es6$promise$$internal$$FULFILLED = 1;
    var lib$es6$promise$$internal$$REJECTED  = 2;

    var lib$es6$promise$$internal$$GET_THEN_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$selfFullfillment() {
      return new TypeError("You cannot resolve a promise with itself");
    }

    function lib$es6$promise$$internal$$cannotReturnOwn() {
      return new TypeError('A promises callback cannot return that same promise.');
    }

    function lib$es6$promise$$internal$$getThen(promise) {
      try {
        return promise.then;
      } catch(error) {
        lib$es6$promise$$internal$$GET_THEN_ERROR.error = error;
        return lib$es6$promise$$internal$$GET_THEN_ERROR;
      }
    }

    function lib$es6$promise$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler) {
      try {
        then.call(value, fulfillmentHandler, rejectionHandler);
      } catch(e) {
        return e;
      }
    }

    function lib$es6$promise$$internal$$handleForeignThenable(promise, thenable, then) {
       lib$es6$promise$asap$$default(function(promise) {
        var sealed = false;
        var error = lib$es6$promise$$internal$$tryThen(then, thenable, function(value) {
          if (sealed) { return; }
          sealed = true;
          if (thenable !== value) {
            lib$es6$promise$$internal$$resolve(promise, value);
          } else {
            lib$es6$promise$$internal$$fulfill(promise, value);
          }
        }, function(reason) {
          if (sealed) { return; }
          sealed = true;

          lib$es6$promise$$internal$$reject(promise, reason);
        }, 'Settle: ' + (promise._label || ' unknown promise'));

        if (!sealed && error) {
          sealed = true;
          lib$es6$promise$$internal$$reject(promise, error);
        }
      }, promise);
    }

    function lib$es6$promise$$internal$$handleOwnThenable(promise, thenable) {
      if (thenable._state === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, thenable._result);
      } else if (thenable._state === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, thenable._result);
      } else {
        lib$es6$promise$$internal$$subscribe(thenable, undefined, function(value) {
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      }
    }

    function lib$es6$promise$$internal$$handleMaybeThenable(promise, maybeThenable) {
      if (maybeThenable.constructor === promise.constructor) {
        lib$es6$promise$$internal$$handleOwnThenable(promise, maybeThenable);
      } else {
        var then = lib$es6$promise$$internal$$getThen(maybeThenable);

        if (then === lib$es6$promise$$internal$$GET_THEN_ERROR) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$GET_THEN_ERROR.error);
        } else if (then === undefined) {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        } else if (lib$es6$promise$utils$$isFunction(then)) {
          lib$es6$promise$$internal$$handleForeignThenable(promise, maybeThenable, then);
        } else {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        }
      }
    }

    function lib$es6$promise$$internal$$resolve(promise, value) {
      if (promise === value) {
        lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$selfFullfillment());
      } else if (lib$es6$promise$utils$$objectOrFunction(value)) {
        lib$es6$promise$$internal$$handleMaybeThenable(promise, value);
      } else {
        lib$es6$promise$$internal$$fulfill(promise, value);
      }
    }

    function lib$es6$promise$$internal$$publishRejection(promise) {
      if (promise._onerror) {
        promise._onerror(promise._result);
      }

      lib$es6$promise$$internal$$publish(promise);
    }

    function lib$es6$promise$$internal$$fulfill(promise, value) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }

      promise._result = value;
      promise._state = lib$es6$promise$$internal$$FULFILLED;

      if (promise._subscribers.length !== 0) {
        lib$es6$promise$asap$$default(lib$es6$promise$$internal$$publish, promise);
      }
    }

    function lib$es6$promise$$internal$$reject(promise, reason) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }
      promise._state = lib$es6$promise$$internal$$REJECTED;
      promise._result = reason;

      lib$es6$promise$asap$$default(lib$es6$promise$$internal$$publishRejection, promise);
    }

    function lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
      var subscribers = parent._subscribers;
      var length = subscribers.length;

      parent._onerror = null;

      subscribers[length] = child;
      subscribers[length + lib$es6$promise$$internal$$FULFILLED] = onFulfillment;
      subscribers[length + lib$es6$promise$$internal$$REJECTED]  = onRejection;

      if (length === 0 && parent._state) {
        lib$es6$promise$asap$$default(lib$es6$promise$$internal$$publish, parent);
      }
    }

    function lib$es6$promise$$internal$$publish(promise) {
      var subscribers = promise._subscribers;
      var settled = promise._state;

      if (subscribers.length === 0) { return; }

      var child, callback, detail = promise._result;

      for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];

        if (child) {
          lib$es6$promise$$internal$$invokeCallback(settled, child, callback, detail);
        } else {
          callback(detail);
        }
      }

      promise._subscribers.length = 0;
    }

    function lib$es6$promise$$internal$$ErrorObject() {
      this.error = null;
    }

    var lib$es6$promise$$internal$$TRY_CATCH_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$tryCatch(callback, detail) {
      try {
        return callback(detail);
      } catch(e) {
        lib$es6$promise$$internal$$TRY_CATCH_ERROR.error = e;
        return lib$es6$promise$$internal$$TRY_CATCH_ERROR;
      }
    }

    function lib$es6$promise$$internal$$invokeCallback(settled, promise, callback, detail) {
      var hasCallback = lib$es6$promise$utils$$isFunction(callback),
          value, error, succeeded, failed;

      if (hasCallback) {
        value = lib$es6$promise$$internal$$tryCatch(callback, detail);

        if (value === lib$es6$promise$$internal$$TRY_CATCH_ERROR) {
          failed = true;
          error = value.error;
          value = null;
        } else {
          succeeded = true;
        }

        if (promise === value) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$cannotReturnOwn());
          return;
        }

      } else {
        value = detail;
        succeeded = true;
      }

      if (promise._state !== lib$es6$promise$$internal$$PENDING) {
        // noop
      } else if (hasCallback && succeeded) {
        lib$es6$promise$$internal$$resolve(promise, value);
      } else if (failed) {
        lib$es6$promise$$internal$$reject(promise, error);
      } else if (settled === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, value);
      } else if (settled === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, value);
      }
    }

    function lib$es6$promise$$internal$$initializePromise(promise, resolver) {
      try {
        resolver(function resolvePromise(value){
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function rejectPromise(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      } catch(e) {
        lib$es6$promise$$internal$$reject(promise, e);
      }
    }

    function lib$es6$promise$enumerator$$Enumerator(Constructor, input) {
      var enumerator = this;

      enumerator._instanceConstructor = Constructor;
      enumerator.promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (enumerator._validateInput(input)) {
        enumerator._input     = input;
        enumerator.length     = input.length;
        enumerator._remaining = input.length;

        enumerator._init();

        if (enumerator.length === 0) {
          lib$es6$promise$$internal$$fulfill(enumerator.promise, enumerator._result);
        } else {
          enumerator.length = enumerator.length || 0;
          enumerator._enumerate();
          if (enumerator._remaining === 0) {
            lib$es6$promise$$internal$$fulfill(enumerator.promise, enumerator._result);
          }
        }
      } else {
        lib$es6$promise$$internal$$reject(enumerator.promise, enumerator._validationError());
      }
    }

    lib$es6$promise$enumerator$$Enumerator.prototype._validateInput = function(input) {
      return lib$es6$promise$utils$$isArray(input);
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._validationError = function() {
      return new Error('Array Methods must be provided an Array');
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._init = function() {
      this._result = new Array(this.length);
    };

    var lib$es6$promise$enumerator$$default = lib$es6$promise$enumerator$$Enumerator;

    lib$es6$promise$enumerator$$Enumerator.prototype._enumerate = function() {
      var enumerator = this;

      var length  = enumerator.length;
      var promise = enumerator.promise;
      var input   = enumerator._input;

      for (var i = 0; promise._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        enumerator._eachEntry(input[i], i);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._eachEntry = function(entry, i) {
      var enumerator = this;
      var c = enumerator._instanceConstructor;

      if (lib$es6$promise$utils$$isMaybeThenable(entry)) {
        if (entry.constructor === c && entry._state !== lib$es6$promise$$internal$$PENDING) {
          entry._onerror = null;
          enumerator._settledAt(entry._state, i, entry._result);
        } else {
          enumerator._willSettleAt(c.resolve(entry), i);
        }
      } else {
        enumerator._remaining--;
        enumerator._result[i] = entry;
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._settledAt = function(state, i, value) {
      var enumerator = this;
      var promise = enumerator.promise;

      if (promise._state === lib$es6$promise$$internal$$PENDING) {
        enumerator._remaining--;

        if (state === lib$es6$promise$$internal$$REJECTED) {
          lib$es6$promise$$internal$$reject(promise, value);
        } else {
          enumerator._result[i] = value;
        }
      }

      if (enumerator._remaining === 0) {
        lib$es6$promise$$internal$$fulfill(promise, enumerator._result);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._willSettleAt = function(promise, i) {
      var enumerator = this;

      lib$es6$promise$$internal$$subscribe(promise, undefined, function(value) {
        enumerator._settledAt(lib$es6$promise$$internal$$FULFILLED, i, value);
      }, function(reason) {
        enumerator._settledAt(lib$es6$promise$$internal$$REJECTED, i, reason);
      });
    };
    function lib$es6$promise$promise$all$$all(entries) {
      return new lib$es6$promise$enumerator$$default(this, entries).promise;
    }
    var lib$es6$promise$promise$all$$default = lib$es6$promise$promise$all$$all;
    function lib$es6$promise$promise$race$$race(entries) {
      /*jshint validthis:true */
      var Constructor = this;

      var promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (!lib$es6$promise$utils$$isArray(entries)) {
        lib$es6$promise$$internal$$reject(promise, new TypeError('You must pass an array to race.'));
        return promise;
      }

      var length = entries.length;

      function onFulfillment(value) {
        lib$es6$promise$$internal$$resolve(promise, value);
      }

      function onRejection(reason) {
        lib$es6$promise$$internal$$reject(promise, reason);
      }

      for (var i = 0; promise._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        lib$es6$promise$$internal$$subscribe(Constructor.resolve(entries[i]), undefined, onFulfillment, onRejection);
      }

      return promise;
    }
    var lib$es6$promise$promise$race$$default = lib$es6$promise$promise$race$$race;
    function lib$es6$promise$promise$resolve$$resolve(object) {
      /*jshint validthis:true */
      var Constructor = this;

      if (object && typeof object === 'object' && object.constructor === Constructor) {
        return object;
      }

      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$resolve(promise, object);
      return promise;
    }
    var lib$es6$promise$promise$resolve$$default = lib$es6$promise$promise$resolve$$resolve;
    function lib$es6$promise$promise$reject$$reject(reason) {
      /*jshint validthis:true */
      var Constructor = this;
      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$reject(promise, reason);
      return promise;
    }
    var lib$es6$promise$promise$reject$$default = lib$es6$promise$promise$reject$$reject;

    var lib$es6$promise$promise$$counter = 0;

    function lib$es6$promise$promise$$needsResolver() {
      throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
    }

    function lib$es6$promise$promise$$needsNew() {
      throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
    }

    var lib$es6$promise$promise$$default = lib$es6$promise$promise$$Promise;
    /**
      Promise objects represent the eventual result of an asynchronous operation. The
      primary way of interacting with a promise is through its `then` method, which
      registers callbacks to receive either a promise’s eventual value or the reason
      why the promise cannot be fulfilled.

      Terminology
      -----------

      - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
      - `thenable` is an object or function that defines a `then` method.
      - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
      - `exception` is a value that is thrown using the throw statement.
      - `reason` is a value that indicates why a promise was rejected.
      - `settled` the final resting state of a promise, fulfilled or rejected.

      A promise can be in one of three states: pending, fulfilled, or rejected.

      Promises that are fulfilled have a fulfillment value and are in the fulfilled
      state.  Promises that are rejected have a rejection reason and are in the
      rejected state.  A fulfillment value is never a thenable.

      Promises can also be said to *resolve* a value.  If this value is also a
      promise, then the original promise's settled state will match the value's
      settled state.  So a promise that *resolves* a promise that rejects will
      itself reject, and a promise that *resolves* a promise that fulfills will
      itself fulfill.


      Basic Usage:
      ------------

      ```js
      var promise = new Promise(function(resolve, reject) {
        // on success
        resolve(value);

        // on failure
        reject(reason);
      });

      promise.then(function(value) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Advanced Usage:
      ---------------

      Promises shine when abstracting away asynchronous interactions such as
      `XMLHttpRequest`s.

      ```js
      function getJSON(url) {
        return new Promise(function(resolve, reject){
          var xhr = new XMLHttpRequest();

          xhr.open('GET', url);
          xhr.onreadystatechange = handler;
          xhr.responseType = 'json';
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.send();

          function handler() {
            if (this.readyState === this.DONE) {
              if (this.status === 200) {
                resolve(this.response);
              } else {
                reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
              }
            }
          };
        });
      }

      getJSON('/posts.json').then(function(json) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Unlike callbacks, promises are great composable primitives.

      ```js
      Promise.all([
        getJSON('/posts'),
        getJSON('/comments')
      ]).then(function(values){
        values[0] // => postsJSON
        values[1] // => commentsJSON

        return values;
      });
      ```

      @class Promise
      @param {function} resolver
      Useful for tooling.
      @constructor
    */
    function lib$es6$promise$promise$$Promise(resolver) {
      this._id = lib$es6$promise$promise$$counter++;
      this._state = undefined;
      this._result = undefined;
      this._subscribers = [];

      if (lib$es6$promise$$internal$$noop !== resolver) {
        if (!lib$es6$promise$utils$$isFunction(resolver)) {
          lib$es6$promise$promise$$needsResolver();
        }

        if (!(this instanceof lib$es6$promise$promise$$Promise)) {
          lib$es6$promise$promise$$needsNew();
        }

        lib$es6$promise$$internal$$initializePromise(this, resolver);
      }
    }

    lib$es6$promise$promise$$Promise.all = lib$es6$promise$promise$all$$default;
    lib$es6$promise$promise$$Promise.race = lib$es6$promise$promise$race$$default;
    lib$es6$promise$promise$$Promise.resolve = lib$es6$promise$promise$resolve$$default;
    lib$es6$promise$promise$$Promise.reject = lib$es6$promise$promise$reject$$default;

    lib$es6$promise$promise$$Promise.prototype = {
      constructor: lib$es6$promise$promise$$Promise,

    /**
      The primary way of interacting with a promise is through its `then` method,
      which registers callbacks to receive either a promise's eventual value or the
      reason why the promise cannot be fulfilled.

      ```js
      findUser().then(function(user){
        // user is available
      }, function(reason){
        // user is unavailable, and you are given the reason why
      });
      ```

      Chaining
      --------

      The return value of `then` is itself a promise.  This second, 'downstream'
      promise is resolved with the return value of the first promise's fulfillment
      or rejection handler, or rejected if the handler throws an exception.

      ```js
      findUser().then(function (user) {
        return user.name;
      }, function (reason) {
        return 'default name';
      }).then(function (userName) {
        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
        // will be `'default name'`
      });

      findUser().then(function (user) {
        throw new Error('Found user, but still unhappy');
      }, function (reason) {
        throw new Error('`findUser` rejected and we're unhappy');
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
        // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
      });
      ```
      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.

      ```js
      findUser().then(function (user) {
        throw new PedagogicalException('Upstream error');
      }).then(function (value) {
        // never reached
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // The `PedgagocialException` is propagated all the way down to here
      });
      ```

      Assimilation
      ------------

      Sometimes the value you want to propagate to a downstream promise can only be
      retrieved asynchronously. This can be achieved by returning a promise in the
      fulfillment or rejection handler. The downstream promise will then be pending
      until the returned promise is settled. This is called *assimilation*.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // The user's comments are now available
      });
      ```

      If the assimliated promise rejects, then the downstream promise will also reject.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // If `findCommentsByAuthor` fulfills, we'll have the value here
      }, function (reason) {
        // If `findCommentsByAuthor` rejects, we'll have the reason here
      });
      ```

      Simple Example
      --------------

      Synchronous Example

      ```javascript
      var result;

      try {
        result = findResult();
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js
      findResult(function(result, err){
        if (err) {
          // failure
        } else {
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findResult().then(function(result){
        // success
      }, function(reason){
        // failure
      });
      ```

      Advanced Example
      --------------

      Synchronous Example

      ```javascript
      var author, books;

      try {
        author = findAuthor();
        books  = findBooksByAuthor(author);
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js

      function foundBooks(books) {

      }

      function failure(reason) {

      }

      findAuthor(function(author, err){
        if (err) {
          failure(err);
          // failure
        } else {
          try {
            findBoooksByAuthor(author, function(books, err) {
              if (err) {
                failure(err);
              } else {
                try {
                  foundBooks(books);
                } catch(reason) {
                  failure(reason);
                }
              }
            });
          } catch(error) {
            failure(err);
          }
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findAuthor().
        then(findBooksByAuthor).
        then(function(books){
          // found books
      }).catch(function(reason){
        // something went wrong
      });
      ```

      @method then
      @param {Function} onFulfilled
      @param {Function} onRejected
      Useful for tooling.
      @return {Promise}
    */
      then: function(onFulfillment, onRejection) {
        var parent = this;
        var state = parent._state;

        if (state === lib$es6$promise$$internal$$FULFILLED && !onFulfillment || state === lib$es6$promise$$internal$$REJECTED && !onRejection) {
          return this;
        }

        var child = new this.constructor(lib$es6$promise$$internal$$noop);
        var result = parent._result;

        if (state) {
          var callback = arguments[state - 1];
          lib$es6$promise$asap$$default(function(){
            lib$es6$promise$$internal$$invokeCallback(state, child, callback, result);
          });
        } else {
          lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection);
        }

        return child;
      },

    /**
      `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
      as the catch block of a try/catch statement.

      ```js
      function findAuthor(){
        throw new Error('couldn't find that author');
      }

      // synchronous
      try {
        findAuthor();
      } catch(reason) {
        // something went wrong
      }

      // async with promises
      findAuthor().catch(function(reason){
        // something went wrong
      });
      ```

      @method catch
      @param {Function} onRejection
      Useful for tooling.
      @return {Promise}
    */
      'catch': function(onRejection) {
        return this.then(null, onRejection);
      }
    };
    function lib$es6$promise$polyfill$$polyfill() {
      var local;

      if (typeof global !== 'undefined') {
          local = global;
      } else if (typeof self !== 'undefined') {
          local = self;
      } else {
          try {
              local = Function('return this')();
          } catch (e) {
              throw new Error('polyfill failed because global object is unavailable in this environment');
          }
      }

      var P = local.Promise;

      if (P && Object.prototype.toString.call(P.resolve()) === '[object Promise]' && !P.cast) {
        return;
      }

      local.Promise = lib$es6$promise$promise$$default;
    }
    var lib$es6$promise$polyfill$$default = lib$es6$promise$polyfill$$polyfill;

    var lib$es6$promise$umd$$ES6Promise = {
      'Promise': lib$es6$promise$promise$$default,
      'polyfill': lib$es6$promise$polyfill$$default
    };

    /* global define:true module:true window: true */
    if (typeof define === 'function' && define['amd']) {
      define(function() { return lib$es6$promise$umd$$ES6Promise; });
    } else if (typeof module !== 'undefined' && module['exports']) {
      module['exports'] = lib$es6$promise$umd$$ES6Promise;
    } else if (typeof this !== 'undefined') {
      this['ES6Promise'] = lib$es6$promise$umd$$ES6Promise;
    }

    lib$es6$promise$polyfill$$default();
}).call(this);


}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":1}],3:[function(require,module,exports){
/*jslint onevar:true, undef:true, newcap:true, regexp:true, bitwise:true, maxerr:50, indent:4, white:false, nomen:false, plusplus:false */
/*global define:false, require:false, exports:false, module:false, signals:false */

/** @license
 * JS Signals <http://millermedeiros.github.com/js-signals/>
 * Released under the MIT license
 * Author: Miller Medeiros
 * Version: 1.0.0 - Build: 268 (2012/11/29 05:48 PM)
 */

(function(global){

    // SignalBinding -------------------------------------------------
    //================================================================

    /**
     * Object that represents a binding between a Signal and a listener function.
     * <br />- <strong>This is an internal constructor and shouldn't be called by regular users.</strong>
     * <br />- inspired by Joa Ebert AS3 SignalBinding and Robert Penner's Slot classes.
     * @author Miller Medeiros
     * @constructor
     * @internal
     * @name SignalBinding
     * @param {Signal} signal Reference to Signal object that listener is currently bound to.
     * @param {Function} listener Handler function bound to the signal.
     * @param {boolean} isOnce If binding should be executed just once.
     * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
     * @param {Number} [priority] The priority level of the event listener. (default = 0).
     */
    function SignalBinding(signal, listener, isOnce, listenerContext, priority) {

        /**
         * Handler function bound to the signal.
         * @type Function
         * @private
         */
        this._listener = listener;

        /**
         * If binding should be executed just once.
         * @type boolean
         * @private
         */
        this._isOnce = isOnce;

        /**
         * Context on which listener will be executed (object that should represent the `this` variable inside listener function).
         * @memberOf SignalBinding.prototype
         * @name context
         * @type Object|undefined|null
         */
        this.context = listenerContext;

        /**
         * Reference to Signal object that listener is currently bound to.
         * @type Signal
         * @private
         */
        this._signal = signal;

        /**
         * Listener priority
         * @type Number
         * @private
         */
        this._priority = priority || 0;
    }

    SignalBinding.prototype = {

        /**
         * If binding is active and should be executed.
         * @type boolean
         */
        active : true,

        /**
         * Default parameters passed to listener during `Signal.dispatch` and `SignalBinding.execute`. (curried parameters)
         * @type Array|null
         */
        params : null,

        /**
         * Call listener passing arbitrary parameters.
         * <p>If binding was added using `Signal.addOnce()` it will be automatically removed from signal dispatch queue, this method is used internally for the signal dispatch.</p>
         * @param {Array} [paramsArr] Array of parameters that should be passed to the listener
         * @return {*} Value returned by the listener.
         */
        execute : function (paramsArr) {
            var handlerReturn, params;
            if (this.active && !!this._listener) {
                params = this.params? this.params.concat(paramsArr) : paramsArr;
                handlerReturn = this._listener.apply(this.context, params);
                if (this._isOnce) {
                    this.detach();
                }
            }
            return handlerReturn;
        },

        /**
         * Detach binding from signal.
         * - alias to: mySignal.remove(myBinding.getListener());
         * @return {Function|null} Handler function bound to the signal or `null` if binding was previously detached.
         */
        detach : function () {
            return this.isBound()? this._signal.remove(this._listener, this.context) : null;
        },

        /**
         * @return {Boolean} `true` if binding is still bound to the signal and have a listener.
         */
        isBound : function () {
            return (!!this._signal && !!this._listener);
        },

        /**
         * @return {boolean} If SignalBinding will only be executed once.
         */
        isOnce : function () {
            return this._isOnce;
        },

        /**
         * @return {Function} Handler function bound to the signal.
         */
        getListener : function () {
            return this._listener;
        },

        /**
         * @return {Signal} Signal that listener is currently bound to.
         */
        getSignal : function () {
            return this._signal;
        },

        /**
         * Delete instance properties
         * @private
         */
        _destroy : function () {
            delete this._signal;
            delete this._listener;
            delete this.context;
        },

        /**
         * @return {string} String representation of the object.
         */
        toString : function () {
            return '[SignalBinding isOnce:' + this._isOnce +', isBound:'+ this.isBound() +', active:' + this.active + ']';
        }

    };


/*global SignalBinding:false*/

    // Signal --------------------------------------------------------
    //================================================================

    function validateListener(listener, fnName) {
        if (typeof listener !== 'function') {
            throw new Error( 'listener is a required param of {fn}() and should be a Function.'.replace('{fn}', fnName) );
        }
    }

    /**
     * Custom event broadcaster
     * <br />- inspired by Robert Penner's AS3 Signals.
     * @name Signal
     * @author Miller Medeiros
     * @constructor
     */
    function Signal() {
        /**
         * @type Array.<SignalBinding>
         * @private
         */
        this._bindings = [];
        this._prevParams = null;

        // enforce dispatch to aways work on same context (#47)
        var self = this;
        this.dispatch = function(){
            Signal.prototype.dispatch.apply(self, arguments);
        };
    }

    Signal.prototype = {

        /**
         * Signals Version Number
         * @type String
         * @const
         */
        VERSION : '1.0.0',

        /**
         * If Signal should keep record of previously dispatched parameters and
         * automatically execute listener during `add()`/`addOnce()` if Signal was
         * already dispatched before.
         * @type boolean
         */
        memorize : false,

        /**
         * @type boolean
         * @private
         */
        _shouldPropagate : true,

        /**
         * If Signal is active and should broadcast events.
         * <p><strong>IMPORTANT:</strong> Setting this property during a dispatch will only affect the next dispatch, if you want to stop the propagation of a signal use `halt()` instead.</p>
         * @type boolean
         */
        active : true,

        /**
         * @param {Function} listener
         * @param {boolean} isOnce
         * @param {Object} [listenerContext]
         * @param {Number} [priority]
         * @return {SignalBinding}
         * @private
         */
        _registerListener : function (listener, isOnce, listenerContext, priority) {

            var prevIndex = this._indexOfListener(listener, listenerContext),
                binding;

            if (prevIndex !== -1) {
                binding = this._bindings[prevIndex];
                if (binding.isOnce() !== isOnce) {
                    throw new Error('You cannot add'+ (isOnce? '' : 'Once') +'() then add'+ (!isOnce? '' : 'Once') +'() the same listener without removing the relationship first.');
                }
            } else {
                binding = new SignalBinding(this, listener, isOnce, listenerContext, priority);
                this._addBinding(binding);
            }

            if(this.memorize && this._prevParams){
                binding.execute(this._prevParams);
            }

            return binding;
        },

        /**
         * @param {SignalBinding} binding
         * @private
         */
        _addBinding : function (binding) {
            //simplified insertion sort
            var n = this._bindings.length;
            do { --n; } while (this._bindings[n] && binding._priority <= this._bindings[n]._priority);
            this._bindings.splice(n + 1, 0, binding);
        },

        /**
         * @param {Function} listener
         * @return {number}
         * @private
         */
        _indexOfListener : function (listener, context) {
            var n = this._bindings.length,
                cur;
            while (n--) {
                cur = this._bindings[n];
                if (cur._listener === listener && cur.context === context) {
                    return n;
                }
            }
            return -1;
        },

        /**
         * Check if listener was attached to Signal.
         * @param {Function} listener
         * @param {Object} [context]
         * @return {boolean} if Signal has the specified listener.
         */
        has : function (listener, context) {
            return this._indexOfListener(listener, context) !== -1;
        },

        /**
         * Add a listener to the signal.
         * @param {Function} listener Signal handler function.
         * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
         * @param {Number} [priority] The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added. (default = 0)
         * @return {SignalBinding} An Object representing the binding between the Signal and listener.
         */
        add : function (listener, listenerContext, priority) {
            validateListener(listener, 'add');
            return this._registerListener(listener, false, listenerContext, priority);
        },

        /**
         * Add listener to the signal that should be removed after first execution (will be executed only once).
         * @param {Function} listener Signal handler function.
         * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
         * @param {Number} [priority] The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added. (default = 0)
         * @return {SignalBinding} An Object representing the binding between the Signal and listener.
         */
        addOnce : function (listener, listenerContext, priority) {
            validateListener(listener, 'addOnce');
            return this._registerListener(listener, true, listenerContext, priority);
        },

        /**
         * Remove a single listener from the dispatch queue.
         * @param {Function} listener Handler function that should be removed.
         * @param {Object} [context] Execution context (since you can add the same handler multiple times if executing in a different context).
         * @return {Function} Listener handler function.
         */
        remove : function (listener, context) {
            validateListener(listener, 'remove');

            var i = this._indexOfListener(listener, context);
            if (i !== -1) {
                this._bindings[i]._destroy(); //no reason to a SignalBinding exist if it isn't attached to a signal
                this._bindings.splice(i, 1);
            }
            return listener;
        },

        /**
         * Remove all listeners from the Signal.
         */
        removeAll : function () {
            var n = this._bindings.length;
            while (n--) {
                this._bindings[n]._destroy();
            }
            this._bindings.length = 0;
        },

        /**
         * @return {number} Number of listeners attached to the Signal.
         */
        getNumListeners : function () {
            return this._bindings.length;
        },

        /**
         * Stop propagation of the event, blocking the dispatch to next listeners on the queue.
         * <p><strong>IMPORTANT:</strong> should be called only during signal dispatch, calling it before/after dispatch won't affect signal broadcast.</p>
         * @see Signal.prototype.disable
         */
        halt : function () {
            this._shouldPropagate = false;
        },

        /**
         * Dispatch/Broadcast Signal to all listeners added to the queue.
         * @param {...*} [params] Parameters that should be passed to each handler.
         */
        dispatch : function (params) {
            if (! this.active) {
                return;
            }

            var paramsArr = Array.prototype.slice.call(arguments),
                n = this._bindings.length,
                bindings;

            if (this.memorize) {
                this._prevParams = paramsArr;
            }

            if (! n) {
                //should come after memorize
                return;
            }

            bindings = this._bindings.slice(); //clone array in case add/remove items during dispatch
            this._shouldPropagate = true; //in case `halt` was called before dispatch or during the previous dispatch.

            //execute all callbacks until end of the list or until a callback returns `false` or stops propagation
            //reverse loop since listeners with higher priority will be added at the end of the list
            do { n--; } while (bindings[n] && this._shouldPropagate && bindings[n].execute(paramsArr) !== false);
        },

        /**
         * Forget memorized arguments.
         * @see Signal.memorize
         */
        forget : function(){
            this._prevParams = null;
        },

        /**
         * Remove all bindings from signal and destroy any reference to external objects (destroy Signal object).
         * <p><strong>IMPORTANT:</strong> calling any method on the signal instance after calling dispose will throw errors.</p>
         */
        dispose : function () {
            this.removeAll();
            delete this._bindings;
            delete this._prevParams;
        },

        /**
         * @return {string} String representation of the object.
         */
        toString : function () {
            return '[Signal active:'+ this.active +' numListeners:'+ this.getNumListeners() +']';
        }

    };


    // Namespace -----------------------------------------------------
    //================================================================

    /**
     * Signals namespace
     * @namespace
     * @name signals
     */
    var signals = Signal;

    /**
     * Custom event broadcaster
     * @see Signal
     */
    // alias for backwards compatibility (see #gh-44)
    signals.Signal = Signal;



    //exports to multiple environments
    if(typeof define === 'function' && define.amd){ //AMD
        define(function () { return signals; });
    } else if (typeof module !== 'undefined' && module.exports){ //node
        module.exports = signals;
    } else { //browser
        //use string because of Google closure compiler ADVANCED_MODE
        /*jslint sub:true */
        global['signals'] = signals;
    }

}(this));

},{}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

/**
 * Logger Class
 * @return {object} Logger
 */

exports['default'] = (function () {

	return {

		/* toggle active state */
		enabled: true,

		initLogger: function initLogger(active) {
			this.enabled = active;
		},

		setState: function setState(active) {
			this.enabled = active;
		},

		log: function log(msg) {
			if (this.enabled) {
				console.log(':::: ' + this.name + ' :::: [ ' + msg + ' ] ');
			}
		},

		error: function error(msg) {
			if (this.enabled) {
				console.error(':::: ' + this.name + ' :::: ***** ERROR ***** - [ ' + msg + ' ] ');
			}
		}
	};
})();

module.exports = exports['default'];


},{}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _signals = require('signals');

var _signals2 = _interopRequireDefault(_signals);

/**
 * export application 
 * signals each one for different app states
 */
var stateChanged = new _signals2['default']();
exports.stateChanged = stateChanged;
var transitionStarted = new _signals2['default']();
exports.transitionStarted = transitionStarted;
var transitionComplete = new _signals2['default']();
exports.transitionComplete = transitionComplete;
var allTransitionsStarted = new _signals2['default']();
exports.allTransitionsStarted = allTransitionsStarted;
var allTransitionCompleted = new _signals2['default']();
exports.allTransitionCompleted = allTransitionCompleted;


},{"signals":3}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

/**
 * Logger Class
 * @return {object} Logger
 */

exports['default'] = (function () {

	return {

		/* toggle active state */
		enabled: true,

		initLogger: function initLogger(active) {
			this.enabled = active;
		},

		setState: function setState(active) {
			this.enabled = active;
		},

		log: function log(msg) {
			if (this.enabled) {
				console.log(':::: ' + this.name + ' :::: [ ' + msg + ' ] ');
			}
		},

		error: function error(msg) {
			if (this.enabled) {
				console.error(':::: ' + this.name + ' :::: ***** ERROR ***** - [ ' + msg + ' ] ');
			}
		}
	};
})();

module.exports = exports['default'];


},{}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

/**
 * Deffer the promise 
 * @return {object} { resolve : function, reject : function }
 */
exports.Deferred = Deferred;

/**
 * create a facad for es6-promise all
 * ovrridden facad to display error logs for development 
 * due to es6-promise error suppression issue
 * @param  {array}   promises 
 * @return {function} 
 */
exports.all = all;

var _es6Promise = require('es6-promise');

/**
 * Promise facad object
 * creates a facad for application promises, 
 * detatches feom the library being used to serve promises to the app
 * @type {Object}
 */
var PromiseFacade = {};
function Deferred() {
	var result = {};
	result.promise = new _es6Promise.Promise(function (resolve, reject) {
		result.resolve = resolve;
		result.reject = reject;
	});
	return result;
}

function all() {
	var _arguments = arguments;

	var externalError = undefined,
	    error = function error(e) {
		console.error(' --- PROMISE CAUGHT ERROR --- ', _arguments[0].stack, e);
		if (externalError) {
			externalError('es6-promise all error ', _arguments[0].stack, e);
		};
	};

	return (function () {
		var all = _es6Promise.Promise.all(_arguments[0]);
		return {
			then: function then() {
				externalError = arguments[1];
				all.then(arguments[0])['catch'](error);
			}
		};
	})(arguments);
}

/**
 * return object getters
 * 
 * - all - checks to see if all promises has completed before continuing
 * - Promise - returns a Promise
 * - Deferred - returns an un resolved promise and an object with the resolve and reject functions
 * @return {function}   [description]
 */
Object.defineProperty(PromiseFacade, 'all', { get: function get() {
		return all;
	} });
Object.defineProperty(PromiseFacade, 'Promise', { get: function get() {
		return _es6Promise.Promise;
	} });
Object.defineProperty(PromiseFacade, 'Deferred', { get: function get() {
		return Deferred;
	} });

/* export defaults */
exports['default'] = PromiseFacade;


},{"es6-promise":2}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utilsMixin = require('../utils/mixin');

var _utilsMixin2 = _interopRequireDefault(_utilsMixin);

var _commonLogger = require('../common/Logger');

var _commonLogger2 = _interopRequireDefault(_commonLogger);

var defaultViewManager = _utilsMixin2['default']({ name: 'DefaultViewManager' }, _commonLogger2['default']);

/* views */
var views = {};

/**
 * initialize the default view manager
 * Used if a view manager has not been set
 * @param  {object} options
 */
defaultViewManager.init = function (options) {
  views = options.views;
  defaultViewManager.initLogger(options.debug);

  defaultViewManager.log('initiated');
  return this;
};

/**
 * fetch view
 * @param  {string} viewRef 
 * @return {object} requested view
 */
defaultViewManager.fetchView = function (viewRef) {
  if (views[viewRef]) {
    return views[viewRef];
  }
};

exports['default'] = defaultViewManager;
module.exports = exports['default'];


},{"../common/Logger":4,"../utils/mixin":18}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _commonLoggerJs = require('../common/logger.js');

var _commonLoggerJs2 = _interopRequireDefault(_commonLoggerJs);

var _commonDispatcher = require('../common/dispatcher');

var _utilsDefault = require('../utils/default');

var _utilsDefault2 = _interopRequireDefault(_utilsDefault);

var _utilsMixin = require('../utils/mixin');

var _utilsMixin2 = _interopRequireDefault(_utilsMixin);

/* create class and extend logger */
var FSM = _utilsMixin2['default']({ name: 'StateMachine' }, _commonLoggerJs2['default']);

(function () {
	var _states = {},
	    _currentState = null,
	    _initial = null,
	    _actionQueue = [],
	    _history = [],
	    _cancelled = false,
	    _transitionCompleted = true,
	    _stateChangedHandler = null,
	    _options = {
		history: false,
		limitq: true,
		qtransitions: true,
		debug: false
	};

	/**
  * check to se if th animation has cancelled in 
  * between state transitions
  * @return {Boolean} cancelled
 */
	function isCancelled() {
		if (_cancelled) {
			_transitionCompleted = true;
			_cancelled = false;
			return true;
		}
		return false;
	}

	/**
  * transition to the next state
  * @param  {object} nextState        new state object
  * @param  {string} action           actionID 
  * @param  {object} data             data sent with the action
  * @param  {string} actionIdentifier state and action combined to make a unique string
 */

	function _transitionTo(nextState, action, data) {
		_cancelled = false;
		_transitionCompleted = false;

		if (isCancelled()) {
			return false;
		}

		if (_currentState) {
			var previousState = _currentState;
			if (_options.history) {
				_history.push(previousState.name);
			}
		}

		_currentState = nextState;

		if (action) {
			_stateChangedHandler(action, data);
		} else {
			_transitionCompleted = true;
			FSM.log('State transition Completed! Current State :: ' + _currentState.name);
			_commonDispatcher.stateChanged.dispatch(_currentState);
		}
	}

	/**
  * If states have queued up
  * loop through and action all states in the queue until
  * none remain
  */
	function _processActionQueue() {
		if (_actionQueue.length > 0) {
			var stateEvent = _actionQueue.shift();

			if (!_currentState.getTarget(stateEvent.action)) {
				_processActionQueue();
			} else {}FSM.action(stateEvent.action, stateEvent.data);

			return false;
		}

		FSM.log('State transition Completed! Current State :: ' + _currentState.name);
		_commonDispatcher.stateChanged.dispatch(_currentState);
	}

	/**
  * start FSM 
  * set the initial state
  */
	FSM.start = function () {
		if (!_initial) {
			return FSM.log('ERROR - FSM must have an initial state set');
		}
		_transitionTo(_initial, null);
		return this;
	};

	/**
  * return the action history
  * @return {aray} 
  */
	FSM.getHistory = function () {
		return _history;
	};

	/**
  * DO ACTION
  * do action and change the current state if
  * the action is available and allowed
  * @param  {string} action to carry out
  * @param  {object} data to send with the state
  */
	FSM.action = function (action, data) {
		if (!_currentState) {
			return FSM.log('ERROR : You may need to start the fsm first');
		}

		/* if transitioning, queue up next action */
		if (!_transitionCompleted && _options.qtransitions) {
			FSM.log('transition in progress, adding action *' + action + ' to queue');

			/* store the action data */
			var actionStore = { action: action, data: data };

			if (_options.limitq) {
				_actionQueue[0] = actionStore;
			} else {
				_actionQueue[_actionQueue.length] = actionStore;
			}
			return false;
		}

		var target = _currentState.getTarget(action),
		    newState = _states[target],
		    _actionId = _currentState.id(action);

		/* if a new target can be found, change the current state */
		if (newState) {
			FSM.log('Changing state :: ' + _currentState.name + ' >>> ' + newState.name);
			_transitionTo(newState, _actionId, data);
		} else {
			FSM.error('State name ::: ' + _currentState.name + ' OR Action: ' + action + ' is not available');
		}
	};

	/**
  * cancel the current transition
  */
	FSM.cancel = function () {
		_cancelled = true;
	};

	/**
  * transition completed
  * called externally once all processes have completed
  */
	FSM.transitionComplete = function () {
		_transitionCompleted = true;
		_processActionQueue();
	};

	/**
  * add a new state to the FSM
  * @param {object}  state - FSM STATE
  * @param {Boolean} isInitial
  */
	FSM.addState = function (state, isInitial) {

		if (!_states || _states[state.name]) {
			return null;
		}

		_states[state.name] = state;
		if (isInitial) {
			_initial = state;
		}
		return state;
	};

	/**
  * initialise - pass in setup options
  * @param  {object} options 
  */
	FSM.init = function (options) {
		_utilsDefault2['default'](_options, options);
		FSM.initLogger(_options.debug);
		FSM.log('initiated');
	};

	/**
  * create states and transitions based on config data passed in
  * if states are an array, loop and assign data
  * to new state objects
  * @param  {array/object} config - [{ name, transitions, initial }]
  */
	FSM.create = function (config) {
		var _this = this;

		if (config instanceof Array) {
			config.forEach(function (item) {
				_this.create(item);
			}, this);
			return this;
		}
		var initial = _states.length === 0 || config.initial,
		    state = new FSM.State(config.name, initial),
		    stateTransitions = config.stateTransitions || [];

		stateTransitions.forEach(function (transition) {
			state.addTransition(transition.action, transition.target, transition._id);
		});

		FSM.addState(state, initial);
	};

	/**
  * return the current state
  * @return {object} FSM state
  */
	FSM.getCurrentState = function () {
		return _currentState;
	};

	/**
  * dispose the state machin 
  */
	FSM.dispose = function () {
		_states = null;
	};

	/* sets a statesChanged method instead of using a signal */
	Object.defineProperty(FSM, 'stateChangedMethod', { set: function set(method) {
			_stateChangedHandler = method;
		} });

	/****************************** [ Create FSM State] ******************************/

	/**
  * FSM state class
  * @param {string} name state name
  */
	FSM.State = function (name, initial) {
		this._transitions = {}; // available transitions
		this._name = name; // name              	      	
		this._data = {}; // data to assosciate with the action
		this._initial = initial;
	};

	FSM.State.prototype = {

		_fetchTransition: function _fetchTransition(action, method) {
			if (this._transitions[action]) {
				return this._transitions[action][method];
			}
			return false;
		},

		/**
   * add the available trasitions for each state
   * @param {string} action e.g.'GOTOHOME'
   * @param {string} target e.g. 'HOME'
   */
		addTransition: function addTransition(action, target, actionIdnentifier) {
			if (this._transitions[action]) {
				return false;
			}
			this._transitions[action] = { target: target, _id: actionIdnentifier };
		},

		getActionId: function getActionId(action) {
			return this._fetchTransition(action, '_id');
		},
		getTarget: function getTarget(action) {
			return this._fetchTransition(action, 'target');
		}
	};

	/**
  * create getters for the state 
  *  - name
  *  - transitions
  *  - data
  */
	Object.defineProperty(FSM.State.prototype, 'name', { get: function get() {
			return this._name;
		} });
	Object.defineProperty(FSM.State.prototype, 'transitions', { get: function get() {
			return this._transitions;
		} });
	Object.defineProperty(FSM.State.prototype, 'data', { get: function get() {
			return this._data;
		} });
	Object.defineProperty(FSM.State.prototype, 'initial', { get: function get() {
			return this._initial;
		} });
	Object.defineProperty(FSM.State.prototype, 'id', { get: function get() {
			return this.getActionId;
		} });
})();

exports['default'] = FSM;
module.exports = exports['default'];


},{"../common/dispatcher":5,"../common/logger.js":6,"../utils/default":14,"../utils/mixin":18}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _commonLoggerJs = require('../common/logger.js');

var _commonLoggerJs2 = _interopRequireDefault(_commonLoggerJs);

var _utilsDefault = require('../utils/default');

var _utilsDefault2 = _interopRequireDefault(_utilsDefault);

var _utilsMixin = require('../utils/mixin');

var _utilsMixin2 = _interopRequireDefault(_utilsMixin);

/* dispatcher signals */

var _commonDispatcher = require('../common/dispatcher');

/* promises */

var _commonPromiseFacade = require('../common/promiseFacade');

/* create class and extend logger */
var TransitionController = _utilsMixin2['default']({ name: 'TransitionController' }, _commonLoggerJs2['default']);

(function () {
	var _tranistionComplete = null,
	    _options = { // default options
		debug: false,
		transitions: null
	};

	/**
  * transition the views, find the transition module if it 
  * exists then pass in the linked views, data and settings
  * 
  * @param  {onject} transitionObj  - contains {transitionType, views, currentViewID, nextViewID}
  * @param  {array} viewsToDispose  - array to store the views passed to each module to dispatch on transition completed
  * @return {array} promises from Deferred 
  */
	function _transitionViews(transitionObj) {
		if (!transitionObj) {
			return TransitionController.error('transition is not defined');
		}
		var transitionModule = _options.transitions[transitionObj.transitionType];

		if (transitionModule) {

			var deferred = _commonPromiseFacade.Deferred(),
			    views = transitionObj.views,
			    currentViewRef = transitionObj.currentViewID,
			    nextViewRef = transitionObj.nextViewID;

			/* individual transition completed */
			deferred.promise.then(function () {
				_commonDispatcher.transitionComplete.dispatch(transitionObj);
				TransitionController.log(transitionObj.transitionType + ' -- completed');
			});

			if (transitionModule.initialize) {
				transitionModule.initialize(views, transitionObj.data, deferred, currentViewRef, nextViewRef);
			}

			_commonDispatcher.transitionStarted.dispatch(transitionObj);
			TransitionController.log(transitionObj.transitionType + ' -- started');
			transitionModule.animate(views, deferred, currentViewRef, nextViewRef);

			return deferred.promise;
		} else {
			TransitionController.error(transitionObj.transitionType + ' does NOT exist');
		}
	}

	function _prepareAndStart(transitions) {
		var initialTransiion = transitions.shift(0),
		    transitionsLength = transitions.length;

		var deferredTransitions = [],
		    i = 0,
		    transitionObj = undefined;

		// get the first transition to prevent looping unnecessarily
		deferredTransitions.push(_transitionViews(initialTransiion));

		while (i < transitionsLength) {
			transitionObj = transitions[i];
			deferredTransitions[deferredTransitions.length] = _transitionViews(transitionObj);

			++i;
		}

		// listen for completed modules
		_commonPromiseFacade.all(deferredTransitions).then(function () {
			TransitionController.log('transition queue empty ---- all transitions completed');

			_tranistionComplete();
			_commonDispatcher.allTransitionCompleted.dispatch();
		}, TransitionController.error);
	}

	/**
  * remove a module by name from the dictionary 
  * of modules if they exist
  * 
  * @param  {string} moduleName [
  * @return {object} TransitionController
  */
	TransitionController.removeModule = function (moduleName) {
		if (!moduleName) {
			return false;
		}

		if (moduleName instanceof Array) {
			moduleName.forEach(function (module) {
				this.removeModule(module);
			}, this);
			return this;
		}

		if (_options.transitions[moduleName]) {
			delete _options.transitions[moduleName];
		}
		return this;
	};

	/**
  * Add module by name 
  * @param {string/array} moduleName [description]
  * @param {object} module - transition module class
  * @return {object} TransitionController
  */
	TransitionController.addModule = function (moduleName, module) {
		if (!moduleName) {
			return false;
		}
		if (moduleName instanceof Array) {

			moduleName.forEach(function (moduleData) {
				var key = Object.keys(moduleData)[0];
				this.addModule(key, moduleData[key]);
			}, this);

			return this;
		}

		if (_options.transitions[moduleName]) {
			return false;
		}
		_options.transitions[moduleName] = module;

		return this;
	};

	/**
  * start processing the requested transition
  * @param  {array/object} - transition objects or array of ytransition objects
  */
	TransitionController.processTransition = function (transitions) {
		_commonDispatcher.allTransitionsStarted.dispatch(transitions);

		// prepare and start the transitions
		TransitionController.log('-- start transitioning views --');
		_prepareAndStart(transitions);
	};

	/**
  * init the transition controller
  * @param  {object} options - options to override defaults
  */
	TransitionController.init = function (options) {
		// get transitions from init options
		_utilsDefault2['default'](_options, options);

		TransitionController.initLogger(_options.debug);
		TransitionController.log('initiated');
	};

	/**
  * link external methid to change the transition completedx state
  */
	Object.defineProperty(TransitionController, 'transitionCompleted', { set: function set(method) {
			_tranistionComplete = method;
		} });
})();

exports['default'] = TransitionController;
module.exports = exports['default'];


},{"../common/dispatcher":5,"../common/logger.js":6,"../common/promiseFacade":7,"../utils/default":14,"../utils/mixin":18}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _commonLoggerJs = require('../common/logger.js');

var _commonLoggerJs2 = _interopRequireDefault(_commonLoggerJs);

var _utilsDefault = require('../utils/default');

var _utilsDefault2 = _interopRequireDefault(_utilsDefault);

var _utilsMixin = require('../utils/mixin');

var _utilsMixin2 = _interopRequireDefault(_utilsMixin);

var _commonPromiseFacade = require('../common/promiseFacade');

/* create class and extend logger */
var TVM = _utilsMixin2['default']({ name: 'TransitionViewManager' }, _commonLoggerJs2['default']);

(function () {

	var _viewsReadyMethod = null,
	    viewCache = {},
	   

	// options with defaults
	_options = {
		config: null,
		viewManager: null,
		debug: false,
		useCache: false
	};

	/**
  * loop through all transition modules and prepare the
  * views requested by the config
  * 
  * @param  {object} actionData containing all transition types and views required
  * @param  {object} paramData sent with the action
  * @return {object} promises array and pepared views array
  */
	function _prepareViews(actionData, paramData) {
		var linkedTranssModules = actionData.linkedVTransModules,
		    // look into slice speed over creating new array
		ViewsModuleLength = linkedTranssModules.length,
		    promises = [],
		    preparedViews = [],
		    actionDataClone = null,
		    viewCache = {},
		    i = 0,
		    viewsModuleObject = undefined;

		while (i < ViewsModuleLength) {
			viewsModuleObject = linkedTranssModules[i];
			actionDataClone = _cloneViewState(actionData, viewsModuleObject, paramData);
			preparedViews[preparedViews.length] = _fetchViews(viewsModuleObject.views, actionDataClone, promises, viewCache);

			++i;
		}

		viewCache = null;
		return { promises: promises, preparedViews: preparedViews };
	}

	/**
  * loop through and fetch all the requested views, use viewReady
  * and collect a promise for each to allow the view to build up and perform 
  * its preperation tasks if required
  * 
  * @param  {array} views - string references
  * @param  {object} actionDataClone - cloned data as to not override config
  * @param  {array} promises - collect all view promises
  * @param  {object} viewCache - prevents views from being instantiated and requested more than once
  * @return {object} populated actionDataClone data object
  */
	function _fetchViews(viewsToPrepare, actionDataClone, promises, viewCache) {
		var views = viewsToPrepare,
		    viewManager = _options.viewManager,
		    length = views.length,
		    currentViewID = actionDataClone.currentViewID,
		    nextViewID = actionDataClone.nextViewID;

		var i = 0,
		    _deferred = undefined,
		    view = undefined,
		    foundView = undefined,
		    parsedRef = undefined,
		    viewRef = undefined;

		while (i < length) {
			viewRef = views[i];

			if (viewRef) {
				foundView = viewCache[viewRef];

				if (!foundView) {
					// cache the view instance for reuse if needed
					foundView = viewCache[viewRef] = viewManager.fetchView(viewRef);
					_deferred = _commonPromiseFacade.Deferred();
					promises[promises.length] = _deferred.promise;

					if (!foundView) {
						return TVM.error(viewRef + ' is undefined');
					}

					if (foundView.prepareView) {
						foundView.prepareView(_deferred);
					} else {
						_deferred.resolve();
					}
				}

				view = foundView;

				/* change ref to current view or next view to allow general transitions */
				parsedRef = _viewRef(viewRef, [currentViewID, nextViewID]);
				if (parsedRef) {
					actionDataClone.views[parsedRef] = view;
				}
				actionDataClone.views[viewRef] = view;
			}

			++i;
		}

		return actionDataClone;
	}

	/**
  * convert view named references to either current view
  * or next view if the ID's match
  * Makes it easier to access and build generic use cases
  * 
  * @param  {string} ref current View ID
  * @param  {array} comparisonViews - currentView and nextView string IDS
  * @return {string} - new IDS if matched
  */
	function _viewRef(ref, comparisonViews) {
		var index = comparisonViews.indexOf(ref);
		return index === -1 ? null : ['currentView', 'nextView'][index];
	}

	/**
  * return cached views based on action type
  * @param  {array} cached - previously prepared views
  * @param  {object} data - action data passed through with action
  * @return {array} - cached views
  */
	function _getCached(cached, data) {
		if (!data) {
			return cached;
		}

		var i = -1,
		    len = cached.length;
		while (++i < len) {
			cached[i].data = data;
		}
		return cached;
	}

	/**
  * clone the action data object
  * fast clone and prevents the config references to be
  * oweriden by instances or other settings
  * @param  {object} actionData passed in from the config
  * @param  {object} transitionObject - action data transition
  * @param  {object} paramData sent with the action
  * @return {object} new object with an instance or reference from the params
  */
	function _cloneViewState(actionData, transitionObject, paramData) {
		return {
			data: paramData,
			currentViewID: actionData.currentView, // optional
			nextViewID: actionData.nextView, // optional
			views: {},
			transitionType: transitionObject.transitionType
		};
	}

	/**
  * processViews - start preparing the views
  * Find views by their action ID in the config
  * 
  * @param  {object|string} actionID 
  * @param  {object} data  passed by the action
  */
	TVM.processViews = function (actionID, data) {
		if (!_options.config) {
			return TVM.error('A Data Config object must be set via: ViewManager.create');
		}
		if (!actionID) {
			return TVM.error('processViews *actionID is undefined');
		}

		if (_options.useCache && viewCache[actionID]) {
			_viewsReadyMethod(_getCached(viewCache[actionID], data));
			return false;
		}

		var actionData = _options.config[actionID];
		if (actionData) {
			(function () {

				var processedAction = _prepareViews(actionData, data),
				    parsedActionData = processedAction.preparedViews,
				    pendingPromises = processedAction.promises;

				viewCache[actionID] = parsedActionData.slice(0);

				// parse the views and wait for them to finish preparing themselves
				_commonPromiseFacade.all(pendingPromises).then(function () {
					TVM.log('Views loaded and ready for ----- ' + actionID);

					//* views are ready, dispatch them *//
					_viewsReadyMethod(parsedActionData);
				}, TVM.error);
			})();
		} else {
			TVM.error('processViews *actionData is undefined');
		}
	};

	/**
  * Create the TransitionViewManager
  * parse the passed in settings
  * @param  {object} options
  */
	TVM.create = function (options) {
		_utilsDefault2['default'](_options, options);
		TVM.initLogger(_options.debug);
		TVM.log('initiated');
	};

	/**
  * dispose of the TransitionViewManager and 
  * all its components
  */
	TVM.dispose = function () {
		_options = null;
		viewCache = null;
	};

	/**
  * link external methid to local
  */
	Object.defineProperty(TVM, 'viewsReady', { set: function set(method) {
			_viewsReadyMethod = method;
		} });
})();

exports['default'] = TVM;
module.exports = exports['default'];


},{"../common/logger.js":6,"../common/promiseFacade":7,"../utils/default":14,"../utils/mixin":18}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _coreFsm = require('./core/fsm');

var _coreFsm2 = _interopRequireDefault(_coreFsm);

var _coreTransitionViewManager = require('./core/transitionViewManager');

var _coreTransitionViewManager2 = _interopRequireDefault(_coreTransitionViewManager);

var _coreTransitionController = require('./core/transitionController');

var _coreTransitionController2 = _interopRequireDefault(_coreTransitionController);

var _coreDefaultViewManager = require('./core/defaultViewManager');

var _coreDefaultViewManager2 = _interopRequireDefault(_coreDefaultViewManager);

var _parsersDataParser = require('./parsers/dataParser');

var _parsersDataParser2 = _interopRequireDefault(_parsersDataParser);

var _commonLogger = require('./common/logger');

var _commonLogger2 = _interopRequireDefault(_commonLogger);

var _utilsMixin = require('./utils/mixin');

var _utilsMixin2 = _interopRequireDefault(_utilsMixin);

var _utilsPick = require('./utils/pick');

var _utilsPick2 = _interopRequireDefault(_utilsPick);

var _commonDispatcher = require('./common/dispatcher');

var _commonDispatcher2 = _interopRequireDefault(_commonDispatcher);

/* fsm config pluck keys */
var fsmKeys = ['history', 'limitq', 'qtransitions', 'debug'];
/* tvm config pluck keys */
var tvmKeys = ['viewManager', 'views', 'useCache', 'debug'];
/* tc config pluck keys */
var tcKeys = ['transitions', 'debug'];
/* this config pluck keys */
var indexKeys = ['debug', 'views', 'viewManager'];

/**
 * ransition manager - Transition component facad wrapper
 * @type {Object}
 */
var TransitionManager = {};

(function () {
	/* private Logger */
	var Log = _utilsMixin2['default']({ name: 'TransitionManager' }, _commonLogger2['default']);

	TransitionManager.init = function (config) {
		var parsedData = _parsersDataParser2['default'].parseData(config.data);

		/* FSM setup */
		_coreFsm2['default'].init(_utilsMixin2['default'](_utilsPick2['default'](config, fsmKeys), config.fsm));
		_coreFsm2['default'].create(parsedData.fsmConfig);

		/* Transition View Manager setup */
		config.viewManager = config.viewManager || _coreDefaultViewManager2['default'].init(_utilsPick2['default'](config, indexKeys));
		var tvmConfig = _utilsMixin2['default']({ config: parsedData.TVMConfig }, _utilsPick2['default'](config, tvmKeys), config.tvm);
		_coreTransitionViewManager2['default'].create(tvmConfig);

		/* Transition Controller setup */
		_coreTransitionController2['default'].init(_utilsMixin2['default'](_utilsPick2['default'](config, tcKeys), config.tc));

		/*** Connect each module ***/
		_coreFsm2['default'].stateChangedMethod = _coreTransitionViewManager2['default'].processViews;
		_coreTransitionViewManager2['default'].viewsReady = _coreTransitionController2['default'].processTransition;
		_coreTransitionController2['default'].transitionCompleted = _coreFsm2['default'].transitionComplete;

		Log.initLogger(config.debug);
		Log.log('initiated');
	};

	/**
  * start the transition-manager
  * transitions to the initial state
  */
	TransitionManager.start = function () {
		_coreFsm2['default'].start();
	};

	/**
  * 	Getters for the Transition Manager Components
  *  - action - declare action to start 
  *  - currentState - get current state
  *  - cancel - cancel fsm transition
  *  - addTransition - add a transition component
  *  - removeTransition - remove transition
  *  - history - action history
  */

	Object.defineProperty(TransitionManager, 'action', { get: function get() {
			return _coreFsm2['default'].action;
		} });
	Object.defineProperty(TransitionManager, 'currentState', { get: function get() {
			return _coreFsm2['default'].getCurrentState;
		} });
	Object.defineProperty(TransitionManager, 'cancel', { get: function get() {
			return _coreFsm2['default'].cancel;
		} });
	Object.defineProperty(TransitionManager, 'addTransition', { get: function get() {
			return _coreTransitionController2['default'].addModule;
		} });
	Object.defineProperty(TransitionManager, 'removeTransition', { get: function get() {
			return _coreTransitionController2['default'].removeModule;
		} });
	Object.defineProperty(TransitionManager, 'getHistory', { get: function get() {
			return _coreFsm2['default'].getHistory;
		} });

	/**
  * Signals
  * - fsm state changed 
  * - tc transition started
  * - tc allTransitionStarted
  */
	Object.defineProperty(TransitionManager, 'onStateChanged', { get: function get() {
			return _commonDispatcher2['default'].stateChanged;
		} });
	Object.defineProperty(TransitionManager, 'onTransitionStarted', { get: function get() {
			return _commonDispatcher2['default'].transitionStarted;
		} });
	Object.defineProperty(TransitionManager, 'onAllTransitionStarted', { get: function get() {
			return _commonDispatcher2['default'].transitionsStarted;
		} });
	Object.defineProperty(TransitionManager, 'onAllTransitionCompleted', { get: function get() {
			return _commonDispatcher2['default'].allTransitionCompleted;
		} });
	Object.defineProperty(TransitionManager, 'transitionComplete', { get: function get() {
			return _commonDispatcher2['default'].transitionComplete;
		} });
})();

exports['default'] = TransitionManager;

module.exports = { 'boom': 'test' };
module.exports = exports['default'];


},{"./common/dispatcher":5,"./common/logger":6,"./core/defaultViewManager":8,"./core/fsm":9,"./core/transitionController":10,"./core/transitionViewManager":11,"./parsers/dataParser":13,"./utils/mixin":18,"./utils/pick":19}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utilsForIn = require('../utils/forIn');

var _utilsForIn2 = _interopRequireDefault(_utilsForIn);

var _utilsUnique = require('../utils/unique');

var _utilsUnique2 = _interopRequireDefault(_utilsUnique);

var AppDataParser = {};

(function () {
	/**
  * extract the actual transition data for the state
  * @param  {object} configState - state data
  * @return {array} transition array - FSM
  */
	function _extractActions(opts) {
		// main properties
		var data = opts.data,
		    configState = opts.stateData,
		    stateView = opts.stateView,
		    stateName = opts.stateName;

		// new defined properties
		var stateTransitions = [],
		    viewData = opts.viewData,
		    appDataView = undefined,
		    action = undefined,
		    statePrefix = undefined;

		_utilsForIn2['default'](configState.actions, function (prop, actionName) {

			statePrefix = stateName + '->' + actionName;
			appDataView = data[prop.target].view;

			// Return action data for FSM
			action = {
				action: actionName,
				target: prop.target,
				_id: statePrefix
			};

			// return ViewData for View manager and append all views
			viewData[statePrefix] = {
				currentView: stateView,
				nextView: appDataView,
				linkedVTransModules: _extractTransitions(prop, stateView, appDataView),
				name: actionName
			};

			// // assign fsm action to state
			stateTransitions[stateTransitions.length] = action;
		});

		return { stateTransitions: stateTransitions, viewData: viewData };
	}

	/**
  * extract transition information
  * and extract data if transition information is
  * an array of transitions
  * @param  {onbject} prop     
  * @param  {string} stateView - id of state view
  * @param  {string} nextView  - id of view this transition goes to
  * @return {array} array of transitions fot this action
  */
	function _extractTransitions(prop, stateView, nextView) {
		var groupedTransitions = [];
		if (prop.transitions) {
			// if more transitions exist, add them
			groupedTransitions = prop.transitions.map(function (transitionObject) {
				return transitionObject;
			});
		}
		prop.views = _utilsUnique2['default'](prop.views, [stateView, nextView]);
		groupedTransitions.unshift({ transitionType: prop.transitionType, views: prop.views });
		return groupedTransitions;
	}

	/**
  * Extract only the FSM data from the config file
  * create states
  * @param  {object} data 
  * @return {object} fsm formatted config
  */
	AppDataParser.parseData = function (data) {
		if (!data) {
			throw new Error('*Data Object is undefined!');return false;
		}

		var config = [],
		    viewData = {},
		    extracted = undefined,
		    state = undefined;

		_utilsForIn2['default'](data, function (stateData, stateName) {
			extracted = _extractActions({
				data: data,
				stateData: stateData,
				viewData: viewData,
				stateView: stateData.view,
				stateName: stateName
			});

			state = {
				name: stateName,
				initial: stateData.initial,
				stateTransitions: extracted.stateTransitions
			};

			config[config.length] = state;
		});

		return { fsmConfig: config, TVMConfig: extracted.viewData };
	};
})();

exports['default'] = AppDataParser;
module.exports = exports['default'];


},{"../utils/forIn":15,"../utils/unique":21}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
'use strict';

/**
 * replace target object properties with the overwrite
 * object properties if they have been set
 * @param  {object} target    - object to overwrite
 * @param  {object} overwrite - object with new properies and values
 * @return {object} 
 */
function defaultProps(target, overwrite) {
  overwrite = overwrite || {};
  for (var prop in overwrite) {
    if (target.hasOwnProperty(prop) && _isValid(overwrite[prop])) {
      target[prop] = overwrite[prop];
    }
  }
  return target;
}

/**
 * check to see if a property is valid
 * not null or undefined
 * @param  {object}  prop 
 * @return {Boolean} 
 */
function _isValid(prop) {
  return prop !== undefined && prop !== null;
}

exports['default'] = defaultProps;
module.exports = exports['default'];


},{}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var _hasDontEnumBug, _dontEnums;

function checkDontEnum() {
    _dontEnums = ['toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'constructor'];

    _hasDontEnumBug = true;

    for (var key in { 'toString': null }) {
        _hasDontEnumBug = false;
    }
};

/**
 * Similar to Array/forEach but works over object properties and fixes Don't
 * Enum bug on IE.
 * based on: http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
 */
function forIn(obj, fn, thisObj) {
    var key,
        i = 0;
    // no need to check if argument is a real object that way we can use
    // it for arrays, functions, date, etc.

    //post-pone check till needed
    if (_hasDontEnumBug == null) {
        checkDontEnum();
    }

    for (key in obj) {
        if (exec(fn, obj, key, thisObj) === false) {
            break;
        }
    }

    if (_hasDontEnumBug) {
        while (key = _dontEnums[i++]) {
            // since we aren't using hasOwn check we need to make sure the
            // property was overwritten
            if (obj[key] !== Object.prototype[key]) {
                if (exec(fn, obj, key, thisObj) === false) {
                    break;
                }
            }
        };
    }
}

function exec(fn, obj, key, thisObj) {
    return fn.call(thisObj, obj[key], key, obj);
}

exports['default'] = forIn;
module.exports = exports['default'];


},{}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _hasOwn = require('./hasOwn');

var _hasOwn2 = _interopRequireDefault(_hasOwn);

var _forIn = require('./forIn');

var _forIn2 = _interopRequireDefault(_forIn);

/**
 * Similar to Array/forEach but works over object properties and fixes Don't
 * Enum bug on IE.
 * based on: http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
 */
function forOwn(obj, fn, thisObj) {
    _forIn2['default'](obj, function (val, key) {
        if (_hasOwn2['default'](obj, key)) {
            return fn.call(thisObj, obj[key], key, obj);
        }
    });
}

exports['default'] = forOwn;
module.exports = exports['default'];


},{"./forIn":15,"./hasOwn":17}],17:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

/**
 * Safer Object.hasOwnProperty
 */
function hasOwn(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}

exports["default"] = hasOwn;
module.exports = exports["default"];


},{}],18:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _forOwn = require('./forOwn');

var _forOwn2 = _interopRequireDefault(_forOwn);

function mixin(target, objects) {
    var i = 0,
        n = arguments.length,
        obj;
    while (++i < n) {
        obj = arguments[i];
        if (obj != null) {
            _forOwn2['default'](obj, copyProp, target);
        }
    }
    return target;
}

function copyProp(val, key) {
    this[key] = val;
}

exports['default'] = mixin;
module.exports = exports['default'];


},{"./forOwn":16}],19:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var slice = require('./slice');

/**
 * Return a copy of the object, filtered to only have values for the whitelisted keys.
 */
function pick(obj, var_keys) {
    var keys = typeof arguments[1] !== 'string' ? arguments[1] : slice(arguments, 1),
        out = {},
        i = 0,
        key;
    while (key = keys[i++]) {
        out[key] = obj[key];
    }
    return out;
}

exports['default'] = pick;
module.exports = exports['default'];


},{"./slice":20}],20:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * Create slice of source array or array-like object
 */
function slice(arr, start, end) {
    var len = arr.length;

    if (start == null) {
        start = 0;
    } else if (start < 0) {
        start = Math.max(len + start, 0);
    } else {
        start = Math.min(start, len);
    }

    if (end == null) {
        end = len;
    } else if (end < 0) {
        end = Math.max(len + end, 0);
    } else {
        end = Math.min(end, len);
    }

    var result = [];
    while (start < end) {
        result.push(arr[start++]);
    }

    return result;
}

exports["default"] = slice;
module.exports = exports["default"];


},{}],21:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});
'use strict';

/**
 * join two arrays and prevent duplication
 * @param  {array} target 
 * @param  {array} arrays 
 * @return {array} 
 */
function unique(target, arrays) {
	target = target || [];
	var combined = target.concat(arrays);
	target = [];

	var len = combined.length,
	    i = -1,
	    ObjRef;

	while (++i < len) {
		ObjRef = combined[i];
		if (target.indexOf(ObjRef) === -1 && ObjRef !== '' & ObjRef !== (null || undefined)) {
			target[target.length] = ObjRef;
		}
	}
	return target;
}

exports['default'] = unique;
module.exports = exports['default'];


},{}],22:[function(require,module,exports){
'use strict';

module.exports = {

	'STATE_INITIAL': {
		// view 			: '',
		initial: true,

		actions: {
			'ACTION_INIT_HOME': {
				transitionType: 'SlideInInitial',
				target: 'STATE_HOME',

				transitions: [{
					transitionType: 'LogoSlide',
					views: ['logoView']
				}]
			},
			'ACTION_INIT_ABOUT': {
				transitionType: 'SlideInInitial',
				target: 'STATE_ABOUT'
			},
			'ACTION_INIT_CONTACT': {
				transitionType: 'SlideInInitial',
				target: 'STATE_CONTACT'
			}
		}
	},

	'STATE_HOME': {
		view: 'homeView',
		// initial 		: true,

		actions: {
			'ACTION_ABOUT': {
				target: 'STATE_ABOUT',
				transitionType: 'SlideInOut',
				views: ['aboutView'],

				transitions: [{
					transitionType: 'LogoSlide',
					views: ['logoView']
				}]

			},

			'ACTION_CONTACT': {
				target: 'STATE_CONTACT',
				transitionType: 'SlideInOut',
				views: ['contactView'],

				transitions: [{
					transitionType: 'LogoSlide',
					views: ['logoView']
				}]
			}
		}
	},

	'STATE_ABOUT': {
		view: 'aboutView',

		actions: {
			'ACTION_HOME': {
				target: 'STATE_HOME',
				transitionType: 'SlideInOut',
				views: ['homeView', 'logoView']

				// transitions : [
				// 	{
				// 		transitionType  : 'LogoSlide',
				// 		views 			: [ 'logoView' ]
				// 	}
				// ]
			},

			'ACTION_CONTACT': {
				target: 'STATE_CONTACT',
				transitionType: 'SlideInOut',
				// views 			: [ 'contactView' ]

				transitions: [{
					transitionType: 'LogoSlide',
					views: ['logoView']
				}]
			} }
	},

	'STATE_CONTACT': {
		view: 'contactView',

		actions: {

			'ACTION_HOME': {
				target: 'STATE_HOME',
				transitionType: 'SlideInOut',
				views: ['homeView'],

				transitions: [{
					transitionType: 'LogoSlide',
					views: ['logoView']
				}]
			},

			'ACTION_ABOUT': {
				target: 'STATE_ABOUT',
				transitionType: 'SlideInOut',
				views: ['aboutView'],
				transitions: [{
					transitionType: 'LogoSlide',
					views: ['logoView']
				}]
			}
		}

	}
};


},{}],23:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _srcIndexJs = require('../src/index.js');

var _srcIndexJs2 = _interopRequireDefault(_srcIndexJs);

var _data = require('./data');

var _data2 = _interopRequireDefault(_data);

// import React from 'react';

console.log('init ', window.innerWidth);

// init();
//

// function init()
// {

// 	var CommentBox = React.createClass({

// 	  componentDidMount : function()
// 	  {
// 	  	console.log('mounting')
// 	  	this.props.hello = 'world';
// 	  },

// 	  viewReady : function()
// 	  {

// 	  },

// 	  render: function() {
// 	    return (
// 	      <div ref="myInput">
// 	        Hello, world! I am a boom.
// 	      </div>
// 	    );
// 	  }
// 	});

// 	var rendered = <CommentBox />;

// 	React.render(
// 	  rendered,
// 	  document.getElementById('content')
// 	);

// 	console.log('created view ', rendered );

// }

// // React.render(
// //   <viewOne />,
// //   document.getElementById('content')
// // );

_srcIndexJs2['default'].init({

	data: _data2['default'],
	debug: true,

	views: {
		homeView: getView('homeView'),
		aboutView: getView('aboutView'),
		contactView: getView('contactView'),
		logoView: getView('logoView')
	},

	transitions: {
		SlideInInitial: getTransition('SlideInInitial', 2000),
		SlideInOut: getTransition('SlideInOut', 2000),
		LogoSlide: getTransition('LogoSlide', 2000)
	} });

_srcIndexJs2['default'].start();

_srcIndexJs2['default'].action('ACTION_INIT_ABOUT');
_srcIndexJs2['default'].action('ACTION_HOME');
// // main.action('ACTION_ABOUT');
// // main.action('ACTION_HOME');
// // main.action('ACTION_CONTACT');
// // main.action('ACTION_HOME');

function getView(name, delay) {
	return {
		id: name,

		viewReady: function viewReady(promise) {

			// promise.resolve('not ready yet');

			setTimeout(function () {
				promise.resolve();
			}, delay || 0);
			// console.log('cehcking ready :: ', promise );
		}
	};
}

function getTransition(name, delay) {
	return {
		initialize: function initialize(views, data, deferred) {
			console.log('Transition ', views);

			// deferred.resolve()
			setTimeout(function () {
				deferred.resolve();
			}, delay || 0);
		},
		animate: function animate() {}
	};
}

// tc : {
// 	debug : true
// },
// fsm : {
// 	debug : true
// }

// console.log('started animating ' );


},{"../src/index.js":12,"./data":22}]},{},[23])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2VzNi1wcm9taXNlL2Rpc3QvZXM2LXByb21pc2UuanMiLCJub2RlX21vZHVsZXMvc2lnbmFscy9kaXN0L3NpZ25hbHMuanMiLCIvVXNlcnMvdGFsd29vbGYvZGV2ZWxvcGVyL3dlYlJvb3QvdHJhbnNpdGlvbi1tYW5hZ2VyL3NyYy9jb21tb24vTG9nZ2VyLmpzIiwiL1VzZXJzL3RhbHdvb2xmL2RldmVsb3Blci93ZWJSb290L3RyYW5zaXRpb24tbWFuYWdlci9zcmMvY29tbW9uL2Rpc3BhdGNoZXIuanMiLCIvVXNlcnMvdGFsd29vbGYvZGV2ZWxvcGVyL3dlYlJvb3QvdHJhbnNpdGlvbi1tYW5hZ2VyL3NyYy9jb21tb24vbG9nZ2VyLmpzIiwiL1VzZXJzL3RhbHdvb2xmL2RldmVsb3Blci93ZWJSb290L3RyYW5zaXRpb24tbWFuYWdlci9zcmMvY29tbW9uL3Byb21pc2VGYWNhZGUuanMiLCIvVXNlcnMvdGFsd29vbGYvZGV2ZWxvcGVyL3dlYlJvb3QvdHJhbnNpdGlvbi1tYW5hZ2VyL3NyYy9jb3JlL2RlZmF1bHRWaWV3TWFuYWdlci5qcyIsIi9Vc2Vycy90YWx3b29sZi9kZXZlbG9wZXIvd2ViUm9vdC90cmFuc2l0aW9uLW1hbmFnZXIvc3JjL2NvcmUvZnNtLmpzIiwiL1VzZXJzL3RhbHdvb2xmL2RldmVsb3Blci93ZWJSb290L3RyYW5zaXRpb24tbWFuYWdlci9zcmMvY29yZS90cmFuc2l0aW9uQ29udHJvbGxlci5qcyIsIi9Vc2Vycy90YWx3b29sZi9kZXZlbG9wZXIvd2ViUm9vdC90cmFuc2l0aW9uLW1hbmFnZXIvc3JjL2NvcmUvdHJhbnNpdGlvblZpZXdNYW5hZ2VyLmpzIiwiL1VzZXJzL3RhbHdvb2xmL2RldmVsb3Blci93ZWJSb290L3RyYW5zaXRpb24tbWFuYWdlci9zcmMvaW5kZXguanMiLCIvVXNlcnMvdGFsd29vbGYvZGV2ZWxvcGVyL3dlYlJvb3QvdHJhbnNpdGlvbi1tYW5hZ2VyL3NyYy9wYXJzZXJzL2RhdGFQYXJzZXIuanMiLCIvVXNlcnMvdGFsd29vbGYvZGV2ZWxvcGVyL3dlYlJvb3QvdHJhbnNpdGlvbi1tYW5hZ2VyL3NyYy91dGlscy9kZWZhdWx0LmpzIiwiL1VzZXJzL3RhbHdvb2xmL2RldmVsb3Blci93ZWJSb290L3RyYW5zaXRpb24tbWFuYWdlci9zcmMvdXRpbHMvZm9ySW4uanMiLCIvVXNlcnMvdGFsd29vbGYvZGV2ZWxvcGVyL3dlYlJvb3QvdHJhbnNpdGlvbi1tYW5hZ2VyL3NyYy91dGlscy9mb3JPd24uanMiLCIvVXNlcnMvdGFsd29vbGYvZGV2ZWxvcGVyL3dlYlJvb3QvdHJhbnNpdGlvbi1tYW5hZ2VyL3NyYy91dGlscy9oYXNPd24uanMiLCIvVXNlcnMvdGFsd29vbGYvZGV2ZWxvcGVyL3dlYlJvb3QvdHJhbnNpdGlvbi1tYW5hZ2VyL3NyYy91dGlscy9taXhpbi5qcyIsIi9Vc2Vycy90YWx3b29sZi9kZXZlbG9wZXIvd2ViUm9vdC90cmFuc2l0aW9uLW1hbmFnZXIvc3JjL3V0aWxzL3BpY2suanMiLCIvVXNlcnMvdGFsd29vbGYvZGV2ZWxvcGVyL3dlYlJvb3QvdHJhbnNpdGlvbi1tYW5hZ2VyL3NyYy91dGlscy9zbGljZS5qcyIsIi9Vc2Vycy90YWx3b29sZi9kZXZlbG9wZXIvd2ViUm9vdC90cmFuc2l0aW9uLW1hbmFnZXIvc3JjL3V0aWxzL3VuaXF1ZS5qcyIsIi9Vc2Vycy90YWx3b29sZi9kZXZlbG9wZXIvd2ViUm9vdC90cmFuc2l0aW9uLW1hbmFnZXIvdGVzdC9kYXRhLmpzIiwiL1VzZXJzL3RhbHdvb2xmL2RldmVsb3Blci93ZWJSb290L3RyYW5zaXRpb24tbWFuYWdlci90ZXN0L3Rlc3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDMUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDNzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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RUFBRSxJQUFJOztBQUVWLEVBQUUsU0FBUyxFQUFFLFNBQVMsU0FBUyxDQUFDLE9BQU8sRUFBRTtBQUN6QztBQUNBOztHQUVHLFVBQVUsQ0FBQyxZQUFZO0lBQ3RCLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUN0QixJQUFJLEVBQUUsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDOztHQUVmO0VBQ0QsQ0FBQztBQUNILENBQUM7O0FBRUQsU0FBUyxhQUFhLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtDQUNuQyxPQUFPO0VBQ04sVUFBVSxFQUFFLFNBQVMsVUFBVSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO0FBQ3pELEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDckM7O0dBRUcsVUFBVSxDQUFDLFlBQVk7SUFDdEIsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ25CLEVBQUUsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO0dBQ2Y7RUFDRCxPQUFPLEVBQUUsU0FBUyxPQUFPLEdBQUcsRUFBRTtFQUM5QixDQUFDO0FBQ0gsQ0FBQzs7QUFFRCxTQUFTO0FBQ1QsZ0JBQWdCO0FBQ2hCLEtBQUs7QUFDTCxVQUFVO0FBQ1YsZ0JBQWdCO0FBQ2hCLElBQUk7O0FBRUosc0NBQXNDO0FBQ3RDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmICghZHJhaW5pbmcpIHtcbiAgICAgICAgc2V0VGltZW91dChkcmFpblF1ZXVlLCAwKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIvKiFcbiAqIEBvdmVydmlldyBlczYtcHJvbWlzZSAtIGEgdGlueSBpbXBsZW1lbnRhdGlvbiBvZiBQcm9taXNlcy9BKy5cbiAqIEBjb3B5cmlnaHQgQ29weXJpZ2h0IChjKSAyMDE0IFllaHVkYSBLYXR6LCBUb20gRGFsZSwgU3RlZmFuIFBlbm5lciBhbmQgY29udHJpYnV0b3JzIChDb252ZXJzaW9uIHRvIEVTNiBBUEkgYnkgSmFrZSBBcmNoaWJhbGQpXG4gKiBAbGljZW5zZSAgIExpY2Vuc2VkIHVuZGVyIE1JVCBsaWNlbnNlXG4gKiAgICAgICAgICAgIFNlZSBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vamFrZWFyY2hpYmFsZC9lczYtcHJvbWlzZS9tYXN0ZXIvTElDRU5TRVxuICogQHZlcnNpb24gICAyLjEuMVxuICovXG5cbihmdW5jdGlvbigpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkdXRpbHMkJG9iamVjdE9yRnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuIHR5cGVvZiB4ID09PSAnZnVuY3Rpb24nIHx8ICh0eXBlb2YgeCA9PT0gJ29iamVjdCcgJiYgeCAhPT0gbnVsbCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc0Z1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiB0eXBlb2YgeCA9PT0gJ2Z1bmN0aW9uJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzTWF5YmVUaGVuYWJsZSh4KSB7XG4gICAgICByZXR1cm4gdHlwZW9mIHggPT09ICdvYmplY3QnICYmIHggIT09IG51bGw7XG4gICAgfVxuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSR1dGlscyQkX2lzQXJyYXk7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkdXRpbHMkJF9pc0FycmF5ID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4KSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSR1dGlscyQkX2lzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuICAgIH1cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzQXJyYXkgPSBsaWIkZXM2JHByb21pc2UkdXRpbHMkJF9pc0FycmF5O1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkbGVuID0gMDtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJHRvU3RyaW5nID0ge30udG9TdHJpbmc7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR2ZXJ0eE5leHQ7XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJGFzYXAoY2FsbGJhY2ssIGFyZykge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHF1ZXVlW2xpYiRlczYkcHJvbWlzZSRhc2FwJCRsZW5dID0gY2FsbGJhY2s7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWVbbGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbiArIDFdID0gYXJnO1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbiArPSAyO1xuICAgICAgaWYgKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRsZW4gPT09IDIpIHtcbiAgICAgICAgLy8gSWYgbGVuIGlzIDIsIHRoYXQgbWVhbnMgdGhhdCB3ZSBuZWVkIHRvIHNjaGVkdWxlIGFuIGFzeW5jIGZsdXNoLlxuICAgICAgICAvLyBJZiBhZGRpdGlvbmFsIGNhbGxiYWNrcyBhcmUgcXVldWVkIGJlZm9yZSB0aGUgcXVldWUgaXMgZmx1c2hlZCwgdGhleVxuICAgICAgICAvLyB3aWxsIGJlIHByb2Nlc3NlZCBieSB0aGlzIGZsdXNoIHRoYXQgd2UgYXJlIHNjaGVkdWxpbmcuXG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRzY2hlZHVsZUZsdXNoKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRkZWZhdWx0ID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJGFzYXA7XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJGJyb3dzZXJXaW5kb3cgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpID8gd2luZG93IDogdW5kZWZpbmVkO1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkYnJvd3Nlckdsb2JhbCA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRicm93c2VyV2luZG93IHx8IHt9O1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkYnJvd3Nlckdsb2JhbC5NdXRhdGlvbk9ic2VydmVyIHx8IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRicm93c2VyR2xvYmFsLldlYktpdE11dGF0aW9uT2JzZXJ2ZXI7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRpc05vZGUgPSB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYge30udG9TdHJpbmcuY2FsbChwcm9jZXNzKSA9PT0gJ1tvYmplY3QgcHJvY2Vzc10nO1xuXG4gICAgLy8gdGVzdCBmb3Igd2ViIHdvcmtlciBidXQgbm90IGluIElFMTBcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJGlzV29ya2VyID0gdHlwZW9mIFVpbnQ4Q2xhbXBlZEFycmF5ICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgdHlwZW9mIGltcG9ydFNjcmlwdHMgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICB0eXBlb2YgTWVzc2FnZUNoYW5uZWwgIT09ICd1bmRlZmluZWQnO1xuXG4gICAgLy8gbm9kZVxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VOZXh0VGljaygpIHtcbiAgICAgIHZhciBuZXh0VGljayA9IHByb2Nlc3MubmV4dFRpY2s7XG4gICAgICAvLyBub2RlIHZlcnNpb24gMC4xMC54IGRpc3BsYXlzIGEgZGVwcmVjYXRpb24gd2FybmluZyB3aGVuIG5leHRUaWNrIGlzIHVzZWQgcmVjdXJzaXZlbHlcbiAgICAgIC8vIHNldEltbWVkaWF0ZSBzaG91bGQgYmUgdXNlZCBpbnN0ZWFkIGluc3RlYWRcbiAgICAgIHZhciB2ZXJzaW9uID0gcHJvY2Vzcy52ZXJzaW9ucy5ub2RlLm1hdGNoKC9eKD86KFxcZCspXFwuKT8oPzooXFxkKylcXC4pPyhcXCp8XFxkKykkLyk7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh2ZXJzaW9uKSAmJiB2ZXJzaW9uWzFdID09PSAnMCcgJiYgdmVyc2lvblsyXSA9PT0gJzEwJykge1xuICAgICAgICBuZXh0VGljayA9IHNldEltbWVkaWF0ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgbmV4dFRpY2sobGliJGVzNiRwcm9taXNlJGFzYXAkJGZsdXNoKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gdmVydHhcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlVmVydHhUaW1lcigpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHZlcnR4TmV4dChsaWIkZXM2JHByb21pc2UkYXNhcCQkZmx1c2gpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTXV0YXRpb25PYnNlcnZlcigpIHtcbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIHZhciBvYnNlcnZlciA9IG5ldyBsaWIkZXM2JHByb21pc2UkYXNhcCQkQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIobGliJGVzNiRwcm9taXNlJGFzYXAkJGZsdXNoKTtcbiAgICAgIHZhciBub2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJycpO1xuICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShub2RlLCB7IGNoYXJhY3RlckRhdGE6IHRydWUgfSk7XG5cbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgbm9kZS5kYXRhID0gKGl0ZXJhdGlvbnMgPSArK2l0ZXJhdGlvbnMgJSAyKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gd2ViIHdvcmtlclxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VNZXNzYWdlQ2hhbm5lbCgpIHtcbiAgICAgIHZhciBjaGFubmVsID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG4gICAgICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRmbHVzaDtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNoYW5uZWwucG9ydDIucG9zdE1lc3NhZ2UoMCk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VTZXRUaW1lb3V0KCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBzZXRUaW1lb3V0KGxpYiRlczYkcHJvbWlzZSRhc2FwJCRmbHVzaCwgMSk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWUgPSBuZXcgQXJyYXkoMTAwMCk7XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJGZsdXNoKCkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaWIkZXM2JHByb21pc2UkYXNhcCQkbGVuOyBpKz0yKSB7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRxdWV1ZVtpXTtcbiAgICAgICAgdmFyIGFyZyA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRxdWV1ZVtpKzFdO1xuXG4gICAgICAgIGNhbGxiYWNrKGFyZyk7XG5cbiAgICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHF1ZXVlW2ldID0gdW5kZWZpbmVkO1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWVbaSsxXSA9IHVuZGVmaW5lZDtcbiAgICAgIH1cblxuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbiA9IDA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJGF0dGVtcHRWZXJ0ZXgoKSB7XG4gICAgICB0cnkge1xuICAgICAgICB2YXIgciA9IHJlcXVpcmU7XG4gICAgICAgIHZhciB2ZXJ0eCA9IHIoJ3ZlcnR4Jyk7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR2ZXJ0eE5leHQgPSB2ZXJ0eC5ydW5Pbkxvb3AgfHwgdmVydHgucnVuT25Db250ZXh0O1xuICAgICAgICByZXR1cm4gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVZlcnR4VGltZXIoKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICByZXR1cm4gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVNldFRpbWVvdXQoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2g7XG4gICAgLy8gRGVjaWRlIHdoYXQgYXN5bmMgbWV0aG9kIHRvIHVzZSB0byB0cmlnZ2VyaW5nIHByb2Nlc3Npbmcgb2YgcXVldWVkIGNhbGxiYWNrczpcbiAgICBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJGlzTm9kZSkge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2ggPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTmV4dFRpY2soKTtcbiAgICB9IGVsc2UgaWYgKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRCcm93c2VyTXV0YXRpb25PYnNlcnZlcikge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2ggPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTXV0YXRpb25PYnNlcnZlcigpO1xuICAgIH0gZWxzZSBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJGlzV29ya2VyKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2NoZWR1bGVGbHVzaCA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VNZXNzYWdlQ2hhbm5lbCgpO1xuICAgIH0gZWxzZSBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJGJyb3dzZXJXaW5kb3cgPT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgcmVxdWlyZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2ggPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXR0ZW1wdFZlcnRleCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2NoZWR1bGVGbHVzaCA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VTZXRUaW1lb3V0KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbm9vcCgpIHt9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUEVORElORyAgID0gdm9pZCAwO1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRGVUxGSUxMRUQgPSAxO1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRSRUpFQ1RFRCAgPSAyO1xuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEdFVF9USEVOX0VSUk9SID0gbmV3IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEVycm9yT2JqZWN0KCk7XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRzZWxmRnVsbGZpbGxtZW50KCkge1xuICAgICAgcmV0dXJuIG5ldyBUeXBlRXJyb3IoXCJZb3UgY2Fubm90IHJlc29sdmUgYSBwcm9taXNlIHdpdGggaXRzZWxmXCIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGNhbm5vdFJldHVybk93bigpIHtcbiAgICAgIHJldHVybiBuZXcgVHlwZUVycm9yKCdBIHByb21pc2VzIGNhbGxiYWNrIGNhbm5vdCByZXR1cm4gdGhhdCBzYW1lIHByb21pc2UuJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZ2V0VGhlbihwcm9taXNlKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gcHJvbWlzZS50aGVuO1xuICAgICAgfSBjYXRjaChlcnJvcikge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRHRVRfVEhFTl9FUlJPUi5lcnJvciA9IGVycm9yO1xuICAgICAgICByZXR1cm4gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkR0VUX1RIRU5fRVJST1I7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkdHJ5VGhlbih0aGVuLCB2YWx1ZSwgZnVsZmlsbG1lbnRIYW5kbGVyLCByZWplY3Rpb25IYW5kbGVyKSB7XG4gICAgICB0cnkge1xuICAgICAgICB0aGVuLmNhbGwodmFsdWUsIGZ1bGZpbGxtZW50SGFuZGxlciwgcmVqZWN0aW9uSGFuZGxlcik7XG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgcmV0dXJuIGU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaGFuZGxlRm9yZWlnblRoZW5hYmxlKHByb21pc2UsIHRoZW5hYmxlLCB0aGVuKSB7XG4gICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJGRlZmF1bHQoZnVuY3Rpb24ocHJvbWlzZSkge1xuICAgICAgICB2YXIgc2VhbGVkID0gZmFsc2U7XG4gICAgICAgIHZhciBlcnJvciA9IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHRyeVRoZW4odGhlbiwgdGhlbmFibGUsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgaWYgKHNlYWxlZCkgeyByZXR1cm47IH1cbiAgICAgICAgICBzZWFsZWQgPSB0cnVlO1xuICAgICAgICAgIGlmICh0aGVuYWJsZSAhPT0gdmFsdWUpIHtcbiAgICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xuICAgICAgICAgIGlmIChzZWFsZWQpIHsgcmV0dXJuOyB9XG4gICAgICAgICAgc2VhbGVkID0gdHJ1ZTtcblxuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCByZWFzb24pO1xuICAgICAgICB9LCAnU2V0dGxlOiAnICsgKHByb21pc2UuX2xhYmVsIHx8ICcgdW5rbm93biBwcm9taXNlJykpO1xuXG4gICAgICAgIGlmICghc2VhbGVkICYmIGVycm9yKSB7XG4gICAgICAgICAgc2VhbGVkID0gdHJ1ZTtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgZXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9LCBwcm9taXNlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRoYW5kbGVPd25UaGVuYWJsZShwcm9taXNlLCB0aGVuYWJsZSkge1xuICAgICAgaWYgKHRoZW5hYmxlLl9zdGF0ZSA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRlVMRklMTEVEKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgdGhlbmFibGUuX3Jlc3VsdCk7XG4gICAgICB9IGVsc2UgaWYgKHRoZW5hYmxlLl9zdGF0ZSA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHRoZW5hYmxlLl9yZXN1bHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkc3Vic2NyaWJlKHRoZW5hYmxlLCB1bmRlZmluZWQsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCByZWFzb24pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRoYW5kbGVNYXliZVRoZW5hYmxlKHByb21pc2UsIG1heWJlVGhlbmFibGUpIHtcbiAgICAgIGlmIChtYXliZVRoZW5hYmxlLmNvbnN0cnVjdG9yID09PSBwcm9taXNlLmNvbnN0cnVjdG9yKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGhhbmRsZU93blRoZW5hYmxlKHByb21pc2UsIG1heWJlVGhlbmFibGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHRoZW4gPSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRnZXRUaGVuKG1heWJlVGhlbmFibGUpO1xuXG4gICAgICAgIGlmICh0aGVuID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRHRVRfVEhFTl9FUlJPUikge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRHRVRfVEhFTl9FUlJPUi5lcnJvcik7XG4gICAgICAgIH0gZWxzZSBpZiAodGhlbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCBtYXliZVRoZW5hYmxlKTtcbiAgICAgICAgfSBlbHNlIGlmIChsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzRnVuY3Rpb24odGhlbikpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRoYW5kbGVGb3JlaWduVGhlbmFibGUocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSwgdGhlbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCBtYXliZVRoZW5hYmxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlc29sdmUocHJvbWlzZSwgdmFsdWUpIHtcbiAgICAgIGlmIChwcm9taXNlID09PSB2YWx1ZSkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkc2VsZkZ1bGxmaWxsbWVudCgpKTtcbiAgICAgIH0gZWxzZSBpZiAobGliJGVzNiRwcm9taXNlJHV0aWxzJCRvYmplY3RPckZ1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRoYW5kbGVNYXliZVRoZW5hYmxlKHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHB1Ymxpc2hSZWplY3Rpb24ocHJvbWlzZSkge1xuICAgICAgaWYgKHByb21pc2UuX29uZXJyb3IpIHtcbiAgICAgICAgcHJvbWlzZS5fb25lcnJvcihwcm9taXNlLl9yZXN1bHQpO1xuICAgICAgfVxuXG4gICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRwdWJsaXNoKHByb21pc2UpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpIHtcbiAgICAgIGlmIChwcm9taXNlLl9zdGF0ZSAhPT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUEVORElORykgeyByZXR1cm47IH1cblxuICAgICAgcHJvbWlzZS5fcmVzdWx0ID0gdmFsdWU7XG4gICAgICBwcm9taXNlLl9zdGF0ZSA9IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRDtcblxuICAgICAgaWYgKHByb21pc2UuX3N1YnNjcmliZXJzLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkZGVmYXVsdChsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRwdWJsaXNoLCBwcm9taXNlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgcmVhc29uKSB7XG4gICAgICBpZiAocHJvbWlzZS5fc3RhdGUgIT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBFTkRJTkcpIHsgcmV0dXJuOyB9XG4gICAgICBwcm9taXNlLl9zdGF0ZSA9IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVEO1xuICAgICAgcHJvbWlzZS5fcmVzdWx0ID0gcmVhc29uO1xuXG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkZGVmYXVsdChsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRwdWJsaXNoUmVqZWN0aW9uLCBwcm9taXNlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRzdWJzY3JpYmUocGFyZW50LCBjaGlsZCwgb25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pIHtcbiAgICAgIHZhciBzdWJzY3JpYmVycyA9IHBhcmVudC5fc3Vic2NyaWJlcnM7XG4gICAgICB2YXIgbGVuZ3RoID0gc3Vic2NyaWJlcnMubGVuZ3RoO1xuXG4gICAgICBwYXJlbnQuX29uZXJyb3IgPSBudWxsO1xuXG4gICAgICBzdWJzY3JpYmVyc1tsZW5ndGhdID0gY2hpbGQ7XG4gICAgICBzdWJzY3JpYmVyc1tsZW5ndGggKyBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRGVUxGSUxMRURdID0gb25GdWxmaWxsbWVudDtcbiAgICAgIHN1YnNjcmliZXJzW2xlbmd0aCArIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVEXSAgPSBvblJlamVjdGlvbjtcblxuICAgICAgaWYgKGxlbmd0aCA9PT0gMCAmJiBwYXJlbnQuX3N0YXRlKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRkZWZhdWx0KGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHB1Ymxpc2gsIHBhcmVudCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcHVibGlzaChwcm9taXNlKSB7XG4gICAgICB2YXIgc3Vic2NyaWJlcnMgPSBwcm9taXNlLl9zdWJzY3JpYmVycztcbiAgICAgIHZhciBzZXR0bGVkID0gcHJvbWlzZS5fc3RhdGU7XG5cbiAgICAgIGlmIChzdWJzY3JpYmVycy5sZW5ndGggPT09IDApIHsgcmV0dXJuOyB9XG5cbiAgICAgIHZhciBjaGlsZCwgY2FsbGJhY2ssIGRldGFpbCA9IHByb21pc2UuX3Jlc3VsdDtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdWJzY3JpYmVycy5sZW5ndGg7IGkgKz0gMykge1xuICAgICAgICBjaGlsZCA9IHN1YnNjcmliZXJzW2ldO1xuICAgICAgICBjYWxsYmFjayA9IHN1YnNjcmliZXJzW2kgKyBzZXR0bGVkXTtcblxuICAgICAgICBpZiAoY2hpbGQpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRpbnZva2VDYWxsYmFjayhzZXR0bGVkLCBjaGlsZCwgY2FsbGJhY2ssIGRldGFpbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2FsbGJhY2soZGV0YWlsKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBwcm9taXNlLl9zdWJzY3JpYmVycy5sZW5ndGggPSAwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEVycm9yT2JqZWN0KCkge1xuICAgICAgdGhpcy5lcnJvciA9IG51bGw7XG4gICAgfVxuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFRSWV9DQVRDSF9FUlJPUiA9IG5ldyBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRFcnJvck9iamVjdCgpO1xuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkdHJ5Q2F0Y2goY2FsbGJhY2ssIGRldGFpbCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGRldGFpbCk7XG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkVFJZX0NBVENIX0VSUk9SLmVycm9yID0gZTtcbiAgICAgICAgcmV0dXJuIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFRSWV9DQVRDSF9FUlJPUjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRpbnZva2VDYWxsYmFjayhzZXR0bGVkLCBwcm9taXNlLCBjYWxsYmFjaywgZGV0YWlsKSB7XG4gICAgICB2YXIgaGFzQ2FsbGJhY2sgPSBsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzRnVuY3Rpb24oY2FsbGJhY2spLFxuICAgICAgICAgIHZhbHVlLCBlcnJvciwgc3VjY2VlZGVkLCBmYWlsZWQ7XG5cbiAgICAgIGlmIChoYXNDYWxsYmFjaykge1xuICAgICAgICB2YWx1ZSA9IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHRyeUNhdGNoKGNhbGxiYWNrLCBkZXRhaWwpO1xuXG4gICAgICAgIGlmICh2YWx1ZSA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkVFJZX0NBVENIX0VSUk9SKSB7XG4gICAgICAgICAgZmFpbGVkID0gdHJ1ZTtcbiAgICAgICAgICBlcnJvciA9IHZhbHVlLmVycm9yO1xuICAgICAgICAgIHZhbHVlID0gbnVsbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdWNjZWVkZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb21pc2UgPT09IHZhbHVlKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGNhbm5vdFJldHVybk93bigpKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWUgPSBkZXRhaWw7XG4gICAgICAgIHN1Y2NlZWRlZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChwcm9taXNlLl9zdGF0ZSAhPT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUEVORElORykge1xuICAgICAgICAvLyBub29wXG4gICAgICB9IGVsc2UgaWYgKGhhc0NhbGxiYWNrICYmIHN1Y2NlZWRlZCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH0gZWxzZSBpZiAoZmFpbGVkKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCBlcnJvcik7XG4gICAgICB9IGVsc2UgaWYgKHNldHRsZWQgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH0gZWxzZSBpZiAoc2V0dGxlZCA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRpbml0aWFsaXplUHJvbWlzZShwcm9taXNlLCByZXNvbHZlcikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzb2x2ZXIoZnVuY3Rpb24gcmVzb2x2ZVByb21pc2UodmFsdWUpe1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgICB9LCBmdW5jdGlvbiByZWplY3RQcm9taXNlKHJlYXNvbikge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCByZWFzb24pO1xuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJEVudW1lcmF0b3IoQ29uc3RydWN0b3IsIGlucHV0KSB7XG4gICAgICB2YXIgZW51bWVyYXRvciA9IHRoaXM7XG5cbiAgICAgIGVudW1lcmF0b3IuX2luc3RhbmNlQ29uc3RydWN0b3IgPSBDb25zdHJ1Y3RvcjtcbiAgICAgIGVudW1lcmF0b3IucHJvbWlzZSA9IG5ldyBDb25zdHJ1Y3RvcihsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKTtcblxuICAgICAgaWYgKGVudW1lcmF0b3IuX3ZhbGlkYXRlSW5wdXQoaW5wdXQpKSB7XG4gICAgICAgIGVudW1lcmF0b3IuX2lucHV0ICAgICA9IGlucHV0O1xuICAgICAgICBlbnVtZXJhdG9yLmxlbmd0aCAgICAgPSBpbnB1dC5sZW5ndGg7XG4gICAgICAgIGVudW1lcmF0b3IuX3JlbWFpbmluZyA9IGlucHV0Lmxlbmd0aDtcblxuICAgICAgICBlbnVtZXJhdG9yLl9pbml0KCk7XG5cbiAgICAgICAgaWYgKGVudW1lcmF0b3IubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChlbnVtZXJhdG9yLnByb21pc2UsIGVudW1lcmF0b3IuX3Jlc3VsdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZW51bWVyYXRvci5sZW5ndGggPSBlbnVtZXJhdG9yLmxlbmd0aCB8fCAwO1xuICAgICAgICAgIGVudW1lcmF0b3IuX2VudW1lcmF0ZSgpO1xuICAgICAgICAgIGlmIChlbnVtZXJhdG9yLl9yZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwoZW51bWVyYXRvci5wcm9taXNlLCBlbnVtZXJhdG9yLl9yZXN1bHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KGVudW1lcmF0b3IucHJvbWlzZSwgZW51bWVyYXRvci5fdmFsaWRhdGlvbkVycm9yKCkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yLnByb3RvdHlwZS5fdmFsaWRhdGVJbnB1dCA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICByZXR1cm4gbGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc0FycmF5KGlucHV0KTtcbiAgICB9O1xuXG4gICAgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJEVudW1lcmF0b3IucHJvdG90eXBlLl92YWxpZGF0aW9uRXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgRXJyb3IoJ0FycmF5IE1ldGhvZHMgbXVzdCBiZSBwcm92aWRlZCBhbiBBcnJheScpO1xuICAgIH07XG5cbiAgICBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvci5wcm90b3R5cGUuX2luaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX3Jlc3VsdCA9IG5ldyBBcnJheSh0aGlzLmxlbmd0aCk7XG4gICAgfTtcblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkZGVmYXVsdCA9IGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yO1xuXG4gICAgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJEVudW1lcmF0b3IucHJvdG90eXBlLl9lbnVtZXJhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBlbnVtZXJhdG9yID0gdGhpcztcblxuICAgICAgdmFyIGxlbmd0aCAgPSBlbnVtZXJhdG9yLmxlbmd0aDtcbiAgICAgIHZhciBwcm9taXNlID0gZW51bWVyYXRvci5wcm9taXNlO1xuICAgICAgdmFyIGlucHV0ICAgPSBlbnVtZXJhdG9yLl9pbnB1dDtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IHByb21pc2UuX3N0YXRlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HICYmIGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBlbnVtZXJhdG9yLl9lYWNoRW50cnkoaW5wdXRbaV0sIGkpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvci5wcm90b3R5cGUuX2VhY2hFbnRyeSA9IGZ1bmN0aW9uKGVudHJ5LCBpKSB7XG4gICAgICB2YXIgZW51bWVyYXRvciA9IHRoaXM7XG4gICAgICB2YXIgYyA9IGVudW1lcmF0b3IuX2luc3RhbmNlQ29uc3RydWN0b3I7XG5cbiAgICAgIGlmIChsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzTWF5YmVUaGVuYWJsZShlbnRyeSkpIHtcbiAgICAgICAgaWYgKGVudHJ5LmNvbnN0cnVjdG9yID09PSBjICYmIGVudHJ5Ll9zdGF0ZSAhPT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUEVORElORykge1xuICAgICAgICAgIGVudHJ5Ll9vbmVycm9yID0gbnVsbDtcbiAgICAgICAgICBlbnVtZXJhdG9yLl9zZXR0bGVkQXQoZW50cnkuX3N0YXRlLCBpLCBlbnRyeS5fcmVzdWx0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbnVtZXJhdG9yLl93aWxsU2V0dGxlQXQoYy5yZXNvbHZlKGVudHJ5KSwgaSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVudW1lcmF0b3IuX3JlbWFpbmluZy0tO1xuICAgICAgICBlbnVtZXJhdG9yLl9yZXN1bHRbaV0gPSBlbnRyeTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJEVudW1lcmF0b3IucHJvdG90eXBlLl9zZXR0bGVkQXQgPSBmdW5jdGlvbihzdGF0ZSwgaSwgdmFsdWUpIHtcbiAgICAgIHZhciBlbnVtZXJhdG9yID0gdGhpcztcbiAgICAgIHZhciBwcm9taXNlID0gZW51bWVyYXRvci5wcm9taXNlO1xuXG4gICAgICBpZiAocHJvbWlzZS5fc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBFTkRJTkcpIHtcbiAgICAgICAgZW51bWVyYXRvci5fcmVtYWluaW5nLS07XG5cbiAgICAgICAgaWYgKHN0YXRlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRSRUpFQ1RFRCkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCB2YWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZW51bWVyYXRvci5fcmVzdWx0W2ldID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGVudW1lcmF0b3IuX3JlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIGVudW1lcmF0b3IuX3Jlc3VsdCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yLnByb3RvdHlwZS5fd2lsbFNldHRsZUF0ID0gZnVuY3Rpb24ocHJvbWlzZSwgaSkge1xuICAgICAgdmFyIGVudW1lcmF0b3IgPSB0aGlzO1xuXG4gICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRzdWJzY3JpYmUocHJvbWlzZSwgdW5kZWZpbmVkLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBlbnVtZXJhdG9yLl9zZXR0bGVkQXQobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRlVMRklMTEVELCBpLCB2YWx1ZSk7XG4gICAgICB9LCBmdW5jdGlvbihyZWFzb24pIHtcbiAgICAgICAgZW51bWVyYXRvci5fc2V0dGxlZEF0KGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVELCBpLCByZWFzb24pO1xuICAgICAgfSk7XG4gICAgfTtcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRhbGwkJGFsbChlbnRyaWVzKSB7XG4gICAgICByZXR1cm4gbmV3IGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRkZWZhdWx0KHRoaXMsIGVudHJpZXMpLnByb21pc2U7XG4gICAgfVxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRhbGwkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRhbGwkJGFsbDtcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyYWNlJCRyYWNlKGVudHJpZXMpIHtcbiAgICAgIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gICAgICB2YXIgQ29uc3RydWN0b3IgPSB0aGlzO1xuXG4gICAgICB2YXIgcHJvbWlzZSA9IG5ldyBDb25zdHJ1Y3RvcihsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKTtcblxuICAgICAgaWYgKCFsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzQXJyYXkoZW50cmllcykpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIG5ldyBUeXBlRXJyb3IoJ1lvdSBtdXN0IHBhc3MgYW4gYXJyYXkgdG8gcmFjZS4nKSk7XG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgfVxuXG4gICAgICB2YXIgbGVuZ3RoID0gZW50cmllcy5sZW5ndGg7XG5cbiAgICAgIGZ1bmN0aW9uIG9uRnVsZmlsbG1lbnQodmFsdWUpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIG9uUmVqZWN0aW9uKHJlYXNvbikge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgICAgIH1cblxuICAgICAgZm9yICh2YXIgaSA9IDA7IHByb21pc2UuX3N0YXRlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HICYmIGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRzdWJzY3JpYmUoQ29uc3RydWN0b3IucmVzb2x2ZShlbnRyaWVzW2ldKSwgdW5kZWZpbmVkLCBvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH1cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmFjZSQkZGVmYXVsdCA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJhY2UkJHJhY2U7XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVzb2x2ZSQkcmVzb2x2ZShvYmplY3QpIHtcbiAgICAgIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gICAgICB2YXIgQ29uc3RydWN0b3IgPSB0aGlzO1xuXG4gICAgICBpZiAob2JqZWN0ICYmIHR5cGVvZiBvYmplY3QgPT09ICdvYmplY3QnICYmIG9iamVjdC5jb25zdHJ1Y3RvciA9PT0gQ29uc3RydWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICAgIH1cblxuICAgICAgdmFyIHByb21pc2UgPSBuZXcgQ29uc3RydWN0b3IobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbm9vcCk7XG4gICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZXNvbHZlKHByb21pc2UsIG9iamVjdCk7XG4gICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlc29sdmUkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZXNvbHZlJCRyZXNvbHZlO1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlamVjdCQkcmVqZWN0KHJlYXNvbikge1xuICAgICAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgICAgIHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG4gICAgICB2YXIgcHJvbWlzZSA9IG5ldyBDb25zdHJ1Y3RvcihsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKTtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCByZWFzb24pO1xuICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZWplY3QkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZWplY3QkJHJlamVjdDtcblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkY291bnRlciA9IDA7XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkbmVlZHNSZXNvbHZlcigpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1lvdSBtdXN0IHBhc3MgYSByZXNvbHZlciBmdW5jdGlvbiBhcyB0aGUgZmlyc3QgYXJndW1lbnQgdG8gdGhlIHByb21pc2UgY29uc3RydWN0b3InKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkbmVlZHNOZXcoKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRmFpbGVkIHRvIGNvbnN0cnVjdCAnUHJvbWlzZSc6IFBsZWFzZSB1c2UgdGhlICduZXcnIG9wZXJhdG9yLCB0aGlzIG9iamVjdCBjb25zdHJ1Y3RvciBjYW5ub3QgYmUgY2FsbGVkIGFzIGEgZnVuY3Rpb24uXCIpO1xuICAgIH1cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkZGVmYXVsdCA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlO1xuICAgIC8qKlxuICAgICAgUHJvbWlzZSBvYmplY3RzIHJlcHJlc2VudCB0aGUgZXZlbnR1YWwgcmVzdWx0IG9mIGFuIGFzeW5jaHJvbm91cyBvcGVyYXRpb24uIFRoZVxuICAgICAgcHJpbWFyeSB3YXkgb2YgaW50ZXJhY3Rpbmcgd2l0aCBhIHByb21pc2UgaXMgdGhyb3VnaCBpdHMgYHRoZW5gIG1ldGhvZCwgd2hpY2hcbiAgICAgIHJlZ2lzdGVycyBjYWxsYmFja3MgdG8gcmVjZWl2ZSBlaXRoZXIgYSBwcm9taXNl4oCZcyBldmVudHVhbCB2YWx1ZSBvciB0aGUgcmVhc29uXG4gICAgICB3aHkgdGhlIHByb21pc2UgY2Fubm90IGJlIGZ1bGZpbGxlZC5cblxuICAgICAgVGVybWlub2xvZ3lcbiAgICAgIC0tLS0tLS0tLS0tXG5cbiAgICAgIC0gYHByb21pc2VgIGlzIGFuIG9iamVjdCBvciBmdW5jdGlvbiB3aXRoIGEgYHRoZW5gIG1ldGhvZCB3aG9zZSBiZWhhdmlvciBjb25mb3JtcyB0byB0aGlzIHNwZWNpZmljYXRpb24uXG4gICAgICAtIGB0aGVuYWJsZWAgaXMgYW4gb2JqZWN0IG9yIGZ1bmN0aW9uIHRoYXQgZGVmaW5lcyBhIGB0aGVuYCBtZXRob2QuXG4gICAgICAtIGB2YWx1ZWAgaXMgYW55IGxlZ2FsIEphdmFTY3JpcHQgdmFsdWUgKGluY2x1ZGluZyB1bmRlZmluZWQsIGEgdGhlbmFibGUsIG9yIGEgcHJvbWlzZSkuXG4gICAgICAtIGBleGNlcHRpb25gIGlzIGEgdmFsdWUgdGhhdCBpcyB0aHJvd24gdXNpbmcgdGhlIHRocm93IHN0YXRlbWVudC5cbiAgICAgIC0gYHJlYXNvbmAgaXMgYSB2YWx1ZSB0aGF0IGluZGljYXRlcyB3aHkgYSBwcm9taXNlIHdhcyByZWplY3RlZC5cbiAgICAgIC0gYHNldHRsZWRgIHRoZSBmaW5hbCByZXN0aW5nIHN0YXRlIG9mIGEgcHJvbWlzZSwgZnVsZmlsbGVkIG9yIHJlamVjdGVkLlxuXG4gICAgICBBIHByb21pc2UgY2FuIGJlIGluIG9uZSBvZiB0aHJlZSBzdGF0ZXM6IHBlbmRpbmcsIGZ1bGZpbGxlZCwgb3IgcmVqZWN0ZWQuXG5cbiAgICAgIFByb21pc2VzIHRoYXQgYXJlIGZ1bGZpbGxlZCBoYXZlIGEgZnVsZmlsbG1lbnQgdmFsdWUgYW5kIGFyZSBpbiB0aGUgZnVsZmlsbGVkXG4gICAgICBzdGF0ZS4gIFByb21pc2VzIHRoYXQgYXJlIHJlamVjdGVkIGhhdmUgYSByZWplY3Rpb24gcmVhc29uIGFuZCBhcmUgaW4gdGhlXG4gICAgICByZWplY3RlZCBzdGF0ZS4gIEEgZnVsZmlsbG1lbnQgdmFsdWUgaXMgbmV2ZXIgYSB0aGVuYWJsZS5cblxuICAgICAgUHJvbWlzZXMgY2FuIGFsc28gYmUgc2FpZCB0byAqcmVzb2x2ZSogYSB2YWx1ZS4gIElmIHRoaXMgdmFsdWUgaXMgYWxzbyBhXG4gICAgICBwcm9taXNlLCB0aGVuIHRoZSBvcmlnaW5hbCBwcm9taXNlJ3Mgc2V0dGxlZCBzdGF0ZSB3aWxsIG1hdGNoIHRoZSB2YWx1ZSdzXG4gICAgICBzZXR0bGVkIHN0YXRlLiAgU28gYSBwcm9taXNlIHRoYXQgKnJlc29sdmVzKiBhIHByb21pc2UgdGhhdCByZWplY3RzIHdpbGxcbiAgICAgIGl0c2VsZiByZWplY3QsIGFuZCBhIHByb21pc2UgdGhhdCAqcmVzb2x2ZXMqIGEgcHJvbWlzZSB0aGF0IGZ1bGZpbGxzIHdpbGxcbiAgICAgIGl0c2VsZiBmdWxmaWxsLlxuXG5cbiAgICAgIEJhc2ljIFVzYWdlOlxuICAgICAgLS0tLS0tLS0tLS0tXG5cbiAgICAgIGBgYGpzXG4gICAgICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAvLyBvbiBzdWNjZXNzXG4gICAgICAgIHJlc29sdmUodmFsdWUpO1xuXG4gICAgICAgIC8vIG9uIGZhaWx1cmVcbiAgICAgICAgcmVqZWN0KHJlYXNvbik7XG4gICAgICB9KTtcblxuICAgICAgcHJvbWlzZS50aGVuKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIC8vIG9uIGZ1bGZpbGxtZW50XG4gICAgICB9LCBmdW5jdGlvbihyZWFzb24pIHtcbiAgICAgICAgLy8gb24gcmVqZWN0aW9uXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBBZHZhbmNlZCBVc2FnZTpcbiAgICAgIC0tLS0tLS0tLS0tLS0tLVxuXG4gICAgICBQcm9taXNlcyBzaGluZSB3aGVuIGFic3RyYWN0aW5nIGF3YXkgYXN5bmNocm9ub3VzIGludGVyYWN0aW9ucyBzdWNoIGFzXG4gICAgICBgWE1MSHR0cFJlcXVlc3Rgcy5cblxuICAgICAgYGBganNcbiAgICAgIGZ1bmN0aW9uIGdldEpTT04odXJsKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuICAgICAgICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgICAgICAgIHhoci5vcGVuKCdHRVQnLCB1cmwpO1xuICAgICAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBoYW5kbGVyO1xuICAgICAgICAgIHhoci5yZXNwb25zZVR5cGUgPSAnanNvbic7XG4gICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ0FjY2VwdCcsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgeGhyLnNlbmQoKTtcblxuICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZXIoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5yZWFkeVN0YXRlID09PSB0aGlzLkRPTkUpIHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHRoaXMucmVzcG9uc2UpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoJ2dldEpTT046IGAnICsgdXJsICsgJ2AgZmFpbGVkIHdpdGggc3RhdHVzOiBbJyArIHRoaXMuc3RhdHVzICsgJ10nKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgZ2V0SlNPTignL3Bvc3RzLmpzb24nKS50aGVuKGZ1bmN0aW9uKGpzb24pIHtcbiAgICAgICAgLy8gb24gZnVsZmlsbG1lbnRcbiAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xuICAgICAgICAvLyBvbiByZWplY3Rpb25cbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIFVubGlrZSBjYWxsYmFja3MsIHByb21pc2VzIGFyZSBncmVhdCBjb21wb3NhYmxlIHByaW1pdGl2ZXMuXG5cbiAgICAgIGBgYGpzXG4gICAgICBQcm9taXNlLmFsbChbXG4gICAgICAgIGdldEpTT04oJy9wb3N0cycpLFxuICAgICAgICBnZXRKU09OKCcvY29tbWVudHMnKVxuICAgICAgXSkudGhlbihmdW5jdGlvbih2YWx1ZXMpe1xuICAgICAgICB2YWx1ZXNbMF0gLy8gPT4gcG9zdHNKU09OXG4gICAgICAgIHZhbHVlc1sxXSAvLyA9PiBjb21tZW50c0pTT05cblxuICAgICAgICByZXR1cm4gdmFsdWVzO1xuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQGNsYXNzIFByb21pc2VcbiAgICAgIEBwYXJhbSB7ZnVuY3Rpb259IHJlc29sdmVyXG4gICAgICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gICAgICBAY29uc3RydWN0b3JcbiAgICAqL1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlKHJlc29sdmVyKSB7XG4gICAgICB0aGlzLl9pZCA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRjb3VudGVyKys7XG4gICAgICB0aGlzLl9zdGF0ZSA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMuX3Jlc3VsdCA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMuX3N1YnNjcmliZXJzID0gW107XG5cbiAgICAgIGlmIChsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wICE9PSByZXNvbHZlcikge1xuICAgICAgICBpZiAoIWxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNGdW5jdGlvbihyZXNvbHZlcikpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkbmVlZHNSZXNvbHZlcigpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlKSkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRuZWVkc05ldygpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaW5pdGlhbGl6ZVByb21pc2UodGhpcywgcmVzb2x2ZXIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLmFsbCA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJGFsbCQkZGVmYXVsdDtcbiAgICBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZS5yYWNlID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmFjZSQkZGVmYXVsdDtcbiAgICBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZS5yZXNvbHZlID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVzb2x2ZSQkZGVmYXVsdDtcbiAgICBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZS5yZWplY3QgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZWplY3QkJGRlZmF1bHQ7XG5cbiAgICBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZS5wcm90b3R5cGUgPSB7XG4gICAgICBjb25zdHJ1Y3RvcjogbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UsXG5cbiAgICAvKipcbiAgICAgIFRoZSBwcmltYXJ5IHdheSBvZiBpbnRlcmFjdGluZyB3aXRoIGEgcHJvbWlzZSBpcyB0aHJvdWdoIGl0cyBgdGhlbmAgbWV0aG9kLFxuICAgICAgd2hpY2ggcmVnaXN0ZXJzIGNhbGxiYWNrcyB0byByZWNlaXZlIGVpdGhlciBhIHByb21pc2UncyBldmVudHVhbCB2YWx1ZSBvciB0aGVcbiAgICAgIHJlYXNvbiB3aHkgdGhlIHByb21pc2UgY2Fubm90IGJlIGZ1bGZpbGxlZC5cblxuICAgICAgYGBganNcbiAgICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbih1c2VyKXtcbiAgICAgICAgLy8gdXNlciBpcyBhdmFpbGFibGVcbiAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgICAgIC8vIHVzZXIgaXMgdW5hdmFpbGFibGUsIGFuZCB5b3UgYXJlIGdpdmVuIHRoZSByZWFzb24gd2h5XG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBDaGFpbmluZ1xuICAgICAgLS0tLS0tLS1cblxuICAgICAgVGhlIHJldHVybiB2YWx1ZSBvZiBgdGhlbmAgaXMgaXRzZWxmIGEgcHJvbWlzZS4gIFRoaXMgc2Vjb25kLCAnZG93bnN0cmVhbSdcbiAgICAgIHByb21pc2UgaXMgcmVzb2x2ZWQgd2l0aCB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBmaXJzdCBwcm9taXNlJ3MgZnVsZmlsbG1lbnRcbiAgICAgIG9yIHJlamVjdGlvbiBoYW5kbGVyLCBvciByZWplY3RlZCBpZiB0aGUgaGFuZGxlciB0aHJvd3MgYW4gZXhjZXB0aW9uLlxuXG4gICAgICBgYGBqc1xuICAgICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgIHJldHVybiB1c2VyLm5hbWU7XG4gICAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIHJldHVybiAnZGVmYXVsdCBuYW1lJztcbiAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHVzZXJOYW1lKSB7XG4gICAgICAgIC8vIElmIGBmaW5kVXNlcmAgZnVsZmlsbGVkLCBgdXNlck5hbWVgIHdpbGwgYmUgdGhlIHVzZXIncyBuYW1lLCBvdGhlcndpc2UgaXRcbiAgICAgICAgLy8gd2lsbCBiZSBgJ2RlZmF1bHQgbmFtZSdgXG4gICAgICB9KTtcblxuICAgICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRm91bmQgdXNlciwgYnV0IHN0aWxsIHVuaGFwcHknKTtcbiAgICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdgZmluZFVzZXJgIHJlamVjdGVkIGFuZCB3ZSdyZSB1bmhhcHB5Jyk7XG4gICAgICB9KS50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAvLyBuZXZlciByZWFjaGVkXG4gICAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIC8vIGlmIGBmaW5kVXNlcmAgZnVsZmlsbGVkLCBgcmVhc29uYCB3aWxsIGJlICdGb3VuZCB1c2VyLCBidXQgc3RpbGwgdW5oYXBweScuXG4gICAgICAgIC8vIElmIGBmaW5kVXNlcmAgcmVqZWN0ZWQsIGByZWFzb25gIHdpbGwgYmUgJ2BmaW5kVXNlcmAgcmVqZWN0ZWQgYW5kIHdlJ3JlIHVuaGFwcHknLlxuICAgICAgfSk7XG4gICAgICBgYGBcbiAgICAgIElmIHRoZSBkb3duc3RyZWFtIHByb21pc2UgZG9lcyBub3Qgc3BlY2lmeSBhIHJlamVjdGlvbiBoYW5kbGVyLCByZWplY3Rpb24gcmVhc29ucyB3aWxsIGJlIHByb3BhZ2F0ZWQgZnVydGhlciBkb3duc3RyZWFtLlxuXG4gICAgICBgYGBqc1xuICAgICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgIHRocm93IG5ldyBQZWRhZ29naWNhbEV4Y2VwdGlvbignVXBzdHJlYW0gZXJyb3InKTtcbiAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIC8vIG5ldmVyIHJlYWNoZWRcbiAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIC8vIG5ldmVyIHJlYWNoZWRcbiAgICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgLy8gVGhlIGBQZWRnYWdvY2lhbEV4Y2VwdGlvbmAgaXMgcHJvcGFnYXRlZCBhbGwgdGhlIHdheSBkb3duIHRvIGhlcmVcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIEFzc2ltaWxhdGlvblxuICAgICAgLS0tLS0tLS0tLS0tXG5cbiAgICAgIFNvbWV0aW1lcyB0aGUgdmFsdWUgeW91IHdhbnQgdG8gcHJvcGFnYXRlIHRvIGEgZG93bnN0cmVhbSBwcm9taXNlIGNhbiBvbmx5IGJlXG4gICAgICByZXRyaWV2ZWQgYXN5bmNocm9ub3VzbHkuIFRoaXMgY2FuIGJlIGFjaGlldmVkIGJ5IHJldHVybmluZyBhIHByb21pc2UgaW4gdGhlXG4gICAgICBmdWxmaWxsbWVudCBvciByZWplY3Rpb24gaGFuZGxlci4gVGhlIGRvd25zdHJlYW0gcHJvbWlzZSB3aWxsIHRoZW4gYmUgcGVuZGluZ1xuICAgICAgdW50aWwgdGhlIHJldHVybmVkIHByb21pc2UgaXMgc2V0dGxlZC4gVGhpcyBpcyBjYWxsZWQgKmFzc2ltaWxhdGlvbiouXG5cbiAgICAgIGBgYGpzXG4gICAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbmRDb21tZW50c0J5QXV0aG9yKHVzZXIpO1xuICAgICAgfSkudGhlbihmdW5jdGlvbiAoY29tbWVudHMpIHtcbiAgICAgICAgLy8gVGhlIHVzZXIncyBjb21tZW50cyBhcmUgbm93IGF2YWlsYWJsZVxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgSWYgdGhlIGFzc2ltbGlhdGVkIHByb21pc2UgcmVqZWN0cywgdGhlbiB0aGUgZG93bnN0cmVhbSBwcm9taXNlIHdpbGwgYWxzbyByZWplY3QuXG5cbiAgICAgIGBgYGpzXG4gICAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbmRDb21tZW50c0J5QXV0aG9yKHVzZXIpO1xuICAgICAgfSkudGhlbihmdW5jdGlvbiAoY29tbWVudHMpIHtcbiAgICAgICAgLy8gSWYgYGZpbmRDb21tZW50c0J5QXV0aG9yYCBmdWxmaWxscywgd2UnbGwgaGF2ZSB0aGUgdmFsdWUgaGVyZVxuICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICAvLyBJZiBgZmluZENvbW1lbnRzQnlBdXRob3JgIHJlamVjdHMsIHdlJ2xsIGhhdmUgdGhlIHJlYXNvbiBoZXJlXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBTaW1wbGUgRXhhbXBsZVxuICAgICAgLS0tLS0tLS0tLS0tLS1cblxuICAgICAgU3luY2hyb25vdXMgRXhhbXBsZVxuXG4gICAgICBgYGBqYXZhc2NyaXB0XG4gICAgICB2YXIgcmVzdWx0O1xuXG4gICAgICB0cnkge1xuICAgICAgICByZXN1bHQgPSBmaW5kUmVzdWx0KCk7XG4gICAgICAgIC8vIHN1Y2Nlc3NcbiAgICAgIH0gY2F0Y2gocmVhc29uKSB7XG4gICAgICAgIC8vIGZhaWx1cmVcbiAgICAgIH1cbiAgICAgIGBgYFxuXG4gICAgICBFcnJiYWNrIEV4YW1wbGVcblxuICAgICAgYGBganNcbiAgICAgIGZpbmRSZXN1bHQoZnVuY3Rpb24ocmVzdWx0LCBlcnIpe1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgLy8gZmFpbHVyZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIHN1Y2Nlc3NcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgUHJvbWlzZSBFeGFtcGxlO1xuXG4gICAgICBgYGBqYXZhc2NyaXB0XG4gICAgICBmaW5kUmVzdWx0KCkudGhlbihmdW5jdGlvbihyZXN1bHQpe1xuICAgICAgICAvLyBzdWNjZXNzXG4gICAgICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgICAgICAvLyBmYWlsdXJlXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBBZHZhbmNlZCBFeGFtcGxlXG4gICAgICAtLS0tLS0tLS0tLS0tLVxuXG4gICAgICBTeW5jaHJvbm91cyBFeGFtcGxlXG5cbiAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgIHZhciBhdXRob3IsIGJvb2tzO1xuXG4gICAgICB0cnkge1xuICAgICAgICBhdXRob3IgPSBmaW5kQXV0aG9yKCk7XG4gICAgICAgIGJvb2tzICA9IGZpbmRCb29rc0J5QXV0aG9yKGF1dGhvcik7XG4gICAgICAgIC8vIHN1Y2Nlc3NcbiAgICAgIH0gY2F0Y2gocmVhc29uKSB7XG4gICAgICAgIC8vIGZhaWx1cmVcbiAgICAgIH1cbiAgICAgIGBgYFxuXG4gICAgICBFcnJiYWNrIEV4YW1wbGVcblxuICAgICAgYGBganNcblxuICAgICAgZnVuY3Rpb24gZm91bmRCb29rcyhib29rcykge1xuXG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGZhaWx1cmUocmVhc29uKSB7XG5cbiAgICAgIH1cblxuICAgICAgZmluZEF1dGhvcihmdW5jdGlvbihhdXRob3IsIGVycil7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICBmYWlsdXJlKGVycik7XG4gICAgICAgICAgLy8gZmFpbHVyZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBmaW5kQm9vb2tzQnlBdXRob3IoYXV0aG9yLCBmdW5jdGlvbihib29rcywgZXJyKSB7XG4gICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBmYWlsdXJlKGVycik7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgIGZvdW5kQm9va3MoYm9va3MpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2gocmVhc29uKSB7XG4gICAgICAgICAgICAgICAgICBmYWlsdXJlKHJlYXNvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGNhdGNoKGVycm9yKSB7XG4gICAgICAgICAgICBmYWlsdXJlKGVycik7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIHN1Y2Nlc3NcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgUHJvbWlzZSBFeGFtcGxlO1xuXG4gICAgICBgYGBqYXZhc2NyaXB0XG4gICAgICBmaW5kQXV0aG9yKCkuXG4gICAgICAgIHRoZW4oZmluZEJvb2tzQnlBdXRob3IpLlxuICAgICAgICB0aGVuKGZ1bmN0aW9uKGJvb2tzKXtcbiAgICAgICAgICAvLyBmb3VuZCBib29rc1xuICAgICAgfSkuY2F0Y2goZnVuY3Rpb24ocmVhc29uKXtcbiAgICAgICAgLy8gc29tZXRoaW5nIHdlbnQgd3JvbmdcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIEBtZXRob2QgdGhlblxuICAgICAgQHBhcmFtIHtGdW5jdGlvbn0gb25GdWxmaWxsZWRcbiAgICAgIEBwYXJhbSB7RnVuY3Rpb259IG9uUmVqZWN0ZWRcbiAgICAgIFVzZWZ1bCBmb3IgdG9vbGluZy5cbiAgICAgIEByZXR1cm4ge1Byb21pc2V9XG4gICAgKi9cbiAgICAgIHRoZW46IGZ1bmN0aW9uKG9uRnVsZmlsbG1lbnQsIG9uUmVqZWN0aW9uKSB7XG4gICAgICAgIHZhciBwYXJlbnQgPSB0aGlzO1xuICAgICAgICB2YXIgc3RhdGUgPSBwYXJlbnQuX3N0YXRlO1xuXG4gICAgICAgIGlmIChzdGF0ZSA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRlVMRklMTEVEICYmICFvbkZ1bGZpbGxtZW50IHx8IHN0YXRlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRSRUpFQ1RFRCAmJiAhb25SZWplY3Rpb24pIHtcbiAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjaGlsZCA9IG5ldyB0aGlzLmNvbnN0cnVjdG9yKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG5vb3ApO1xuICAgICAgICB2YXIgcmVzdWx0ID0gcGFyZW50Ll9yZXN1bHQ7XG5cbiAgICAgICAgaWYgKHN0YXRlKSB7XG4gICAgICAgICAgdmFyIGNhbGxiYWNrID0gYXJndW1lbnRzW3N0YXRlIC0gMV07XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJGRlZmF1bHQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGludm9rZUNhbGxiYWNrKHN0YXRlLCBjaGlsZCwgY2FsbGJhY2ssIHJlc3VsdCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkc3Vic2NyaWJlKHBhcmVudCwgY2hpbGQsIG9uRnVsZmlsbG1lbnQsIG9uUmVqZWN0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjaGlsZDtcbiAgICAgIH0sXG5cbiAgICAvKipcbiAgICAgIGBjYXRjaGAgaXMgc2ltcGx5IHN1Z2FyIGZvciBgdGhlbih1bmRlZmluZWQsIG9uUmVqZWN0aW9uKWAgd2hpY2ggbWFrZXMgaXQgdGhlIHNhbWVcbiAgICAgIGFzIHRoZSBjYXRjaCBibG9jayBvZiBhIHRyeS9jYXRjaCBzdGF0ZW1lbnQuXG5cbiAgICAgIGBgYGpzXG4gICAgICBmdW5jdGlvbiBmaW5kQXV0aG9yKCl7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY291bGRuJ3QgZmluZCB0aGF0IGF1dGhvcicpO1xuICAgICAgfVxuXG4gICAgICAvLyBzeW5jaHJvbm91c1xuICAgICAgdHJ5IHtcbiAgICAgICAgZmluZEF1dGhvcigpO1xuICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgLy8gc29tZXRoaW5nIHdlbnQgd3JvbmdcbiAgICAgIH1cblxuICAgICAgLy8gYXN5bmMgd2l0aCBwcm9taXNlc1xuICAgICAgZmluZEF1dGhvcigpLmNhdGNoKGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgICAgIC8vIHNvbWV0aGluZyB3ZW50IHdyb25nXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBAbWV0aG9kIGNhdGNoXG4gICAgICBAcGFyYW0ge0Z1bmN0aW9ufSBvblJlamVjdGlvblxuICAgICAgVXNlZnVsIGZvciB0b29saW5nLlxuICAgICAgQHJldHVybiB7UHJvbWlzZX1cbiAgICAqL1xuICAgICAgJ2NhdGNoJzogZnVuY3Rpb24ob25SZWplY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGhlbihudWxsLCBvblJlamVjdGlvbik7XG4gICAgICB9XG4gICAgfTtcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkcG9seWZpbGwkJHBvbHlmaWxsKCkge1xuICAgICAgdmFyIGxvY2FsO1xuXG4gICAgICBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICBsb2NhbCA9IGdsb2JhbDtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgbG9jYWwgPSBzZWxmO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBsb2NhbCA9IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3BvbHlmaWxsIGZhaWxlZCBiZWNhdXNlIGdsb2JhbCBvYmplY3QgaXMgdW5hdmFpbGFibGUgaW4gdGhpcyBlbnZpcm9ubWVudCcpO1xuICAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIFAgPSBsb2NhbC5Qcm9taXNlO1xuXG4gICAgICBpZiAoUCAmJiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoUC5yZXNvbHZlKCkpID09PSAnW29iamVjdCBQcm9taXNlXScgJiYgIVAuY2FzdCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGxvY2FsLlByb21pc2UgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkZGVmYXVsdDtcbiAgICB9XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRwb2x5ZmlsbCQkZGVmYXVsdCA9IGxpYiRlczYkcHJvbWlzZSRwb2x5ZmlsbCQkcG9seWZpbGw7XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHVtZCQkRVM2UHJvbWlzZSA9IHtcbiAgICAgICdQcm9taXNlJzogbGliJGVzNiRwcm9taXNlJHByb21pc2UkJGRlZmF1bHQsXG4gICAgICAncG9seWZpbGwnOiBsaWIkZXM2JHByb21pc2UkcG9seWZpbGwkJGRlZmF1bHRcbiAgICB9O1xuXG4gICAgLyogZ2xvYmFsIGRlZmluZTp0cnVlIG1vZHVsZTp0cnVlIHdpbmRvdzogdHJ1ZSAqL1xuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZVsnYW1kJ10pIHtcbiAgICAgIGRlZmluZShmdW5jdGlvbigpIHsgcmV0dXJuIGxpYiRlczYkcHJvbWlzZSR1bWQkJEVTNlByb21pc2U7IH0pO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlWydleHBvcnRzJ10pIHtcbiAgICAgIG1vZHVsZVsnZXhwb3J0cyddID0gbGliJGVzNiRwcm9taXNlJHVtZCQkRVM2UHJvbWlzZTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGlzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgdGhpc1snRVM2UHJvbWlzZSddID0gbGliJGVzNiRwcm9taXNlJHVtZCQkRVM2UHJvbWlzZTtcbiAgICB9XG5cbiAgICBsaWIkZXM2JHByb21pc2UkcG9seWZpbGwkJGRlZmF1bHQoKTtcbn0pLmNhbGwodGhpcyk7XG5cbiIsIi8qanNsaW50IG9uZXZhcjp0cnVlLCB1bmRlZjp0cnVlLCBuZXdjYXA6dHJ1ZSwgcmVnZXhwOnRydWUsIGJpdHdpc2U6dHJ1ZSwgbWF4ZXJyOjUwLCBpbmRlbnQ6NCwgd2hpdGU6ZmFsc2UsIG5vbWVuOmZhbHNlLCBwbHVzcGx1czpmYWxzZSAqL1xuLypnbG9iYWwgZGVmaW5lOmZhbHNlLCByZXF1aXJlOmZhbHNlLCBleHBvcnRzOmZhbHNlLCBtb2R1bGU6ZmFsc2UsIHNpZ25hbHM6ZmFsc2UgKi9cblxuLyoqIEBsaWNlbnNlXG4gKiBKUyBTaWduYWxzIDxodHRwOi8vbWlsbGVybWVkZWlyb3MuZ2l0aHViLmNvbS9qcy1zaWduYWxzLz5cbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZVxuICogQXV0aG9yOiBNaWxsZXIgTWVkZWlyb3NcbiAqIFZlcnNpb246IDEuMC4wIC0gQnVpbGQ6IDI2OCAoMjAxMi8xMS8yOSAwNTo0OCBQTSlcbiAqL1xuXG4oZnVuY3Rpb24oZ2xvYmFsKXtcblxuICAgIC8vIFNpZ25hbEJpbmRpbmcgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgLyoqXG4gICAgICogT2JqZWN0IHRoYXQgcmVwcmVzZW50cyBhIGJpbmRpbmcgYmV0d2VlbiBhIFNpZ25hbCBhbmQgYSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAgICAgKiA8YnIgLz4tIDxzdHJvbmc+VGhpcyBpcyBhbiBpbnRlcm5hbCBjb25zdHJ1Y3RvciBhbmQgc2hvdWxkbid0IGJlIGNhbGxlZCBieSByZWd1bGFyIHVzZXJzLjwvc3Ryb25nPlxuICAgICAqIDxiciAvPi0gaW5zcGlyZWQgYnkgSm9hIEViZXJ0IEFTMyBTaWduYWxCaW5kaW5nIGFuZCBSb2JlcnQgUGVubmVyJ3MgU2xvdCBjbGFzc2VzLlxuICAgICAqIEBhdXRob3IgTWlsbGVyIE1lZGVpcm9zXG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICogQGludGVybmFsXG4gICAgICogQG5hbWUgU2lnbmFsQmluZGluZ1xuICAgICAqIEBwYXJhbSB7U2lnbmFsfSBzaWduYWwgUmVmZXJlbmNlIHRvIFNpZ25hbCBvYmplY3QgdGhhdCBsaXN0ZW5lciBpcyBjdXJyZW50bHkgYm91bmQgdG8uXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgSGFuZGxlciBmdW5jdGlvbiBib3VuZCB0byB0aGUgc2lnbmFsLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNPbmNlIElmIGJpbmRpbmcgc2hvdWxkIGJlIGV4ZWN1dGVkIGp1c3Qgb25jZS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2xpc3RlbmVyQ29udGV4dF0gQ29udGV4dCBvbiB3aGljaCBsaXN0ZW5lciB3aWxsIGJlIGV4ZWN1dGVkIChvYmplY3QgdGhhdCBzaG91bGQgcmVwcmVzZW50IHRoZSBgdGhpc2AgdmFyaWFibGUgaW5zaWRlIGxpc3RlbmVyIGZ1bmN0aW9uKS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW3ByaW9yaXR5XSBUaGUgcHJpb3JpdHkgbGV2ZWwgb2YgdGhlIGV2ZW50IGxpc3RlbmVyLiAoZGVmYXVsdCA9IDApLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIFNpZ25hbEJpbmRpbmcoc2lnbmFsLCBsaXN0ZW5lciwgaXNPbmNlLCBsaXN0ZW5lckNvbnRleHQsIHByaW9yaXR5KSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEhhbmRsZXIgZnVuY3Rpb24gYm91bmQgdG8gdGhlIHNpZ25hbC5cbiAgICAgICAgICogQHR5cGUgRnVuY3Rpb25cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2xpc3RlbmVyID0gbGlzdGVuZXI7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElmIGJpbmRpbmcgc2hvdWxkIGJlIGV4ZWN1dGVkIGp1c3Qgb25jZS5cbiAgICAgICAgICogQHR5cGUgYm9vbGVhblxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5faXNPbmNlID0gaXNPbmNlO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb250ZXh0IG9uIHdoaWNoIGxpc3RlbmVyIHdpbGwgYmUgZXhlY3V0ZWQgKG9iamVjdCB0aGF0IHNob3VsZCByZXByZXNlbnQgdGhlIGB0aGlzYCB2YXJpYWJsZSBpbnNpZGUgbGlzdGVuZXIgZnVuY3Rpb24pLlxuICAgICAgICAgKiBAbWVtYmVyT2YgU2lnbmFsQmluZGluZy5wcm90b3R5cGVcbiAgICAgICAgICogQG5hbWUgY29udGV4dFxuICAgICAgICAgKiBAdHlwZSBPYmplY3R8dW5kZWZpbmVkfG51bGxcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuY29udGV4dCA9IGxpc3RlbmVyQ29udGV4dDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVmZXJlbmNlIHRvIFNpZ25hbCBvYmplY3QgdGhhdCBsaXN0ZW5lciBpcyBjdXJyZW50bHkgYm91bmQgdG8uXG4gICAgICAgICAqIEB0eXBlIFNpZ25hbFxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fc2lnbmFsID0gc2lnbmFsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMaXN0ZW5lciBwcmlvcml0eVxuICAgICAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX3ByaW9yaXR5ID0gcHJpb3JpdHkgfHwgMDtcbiAgICB9XG5cbiAgICBTaWduYWxCaW5kaW5nLnByb3RvdHlwZSA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSWYgYmluZGluZyBpcyBhY3RpdmUgYW5kIHNob3VsZCBiZSBleGVjdXRlZC5cbiAgICAgICAgICogQHR5cGUgYm9vbGVhblxuICAgICAgICAgKi9cbiAgICAgICAgYWN0aXZlIDogdHJ1ZSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGVmYXVsdCBwYXJhbWV0ZXJzIHBhc3NlZCB0byBsaXN0ZW5lciBkdXJpbmcgYFNpZ25hbC5kaXNwYXRjaGAgYW5kIGBTaWduYWxCaW5kaW5nLmV4ZWN1dGVgLiAoY3VycmllZCBwYXJhbWV0ZXJzKVxuICAgICAgICAgKiBAdHlwZSBBcnJheXxudWxsXG4gICAgICAgICAqL1xuICAgICAgICBwYXJhbXMgOiBudWxsLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYWxsIGxpc3RlbmVyIHBhc3NpbmcgYXJiaXRyYXJ5IHBhcmFtZXRlcnMuXG4gICAgICAgICAqIDxwPklmIGJpbmRpbmcgd2FzIGFkZGVkIHVzaW5nIGBTaWduYWwuYWRkT25jZSgpYCBpdCB3aWxsIGJlIGF1dG9tYXRpY2FsbHkgcmVtb3ZlZCBmcm9tIHNpZ25hbCBkaXNwYXRjaCBxdWV1ZSwgdGhpcyBtZXRob2QgaXMgdXNlZCBpbnRlcm5hbGx5IGZvciB0aGUgc2lnbmFsIGRpc3BhdGNoLjwvcD5cbiAgICAgICAgICogQHBhcmFtIHtBcnJheX0gW3BhcmFtc0Fycl0gQXJyYXkgb2YgcGFyYW1ldGVycyB0aGF0IHNob3VsZCBiZSBwYXNzZWQgdG8gdGhlIGxpc3RlbmVyXG4gICAgICAgICAqIEByZXR1cm4geyp9IFZhbHVlIHJldHVybmVkIGJ5IHRoZSBsaXN0ZW5lci5cbiAgICAgICAgICovXG4gICAgICAgIGV4ZWN1dGUgOiBmdW5jdGlvbiAocGFyYW1zQXJyKSB7XG4gICAgICAgICAgICB2YXIgaGFuZGxlclJldHVybiwgcGFyYW1zO1xuICAgICAgICAgICAgaWYgKHRoaXMuYWN0aXZlICYmICEhdGhpcy5fbGlzdGVuZXIpIHtcbiAgICAgICAgICAgICAgICBwYXJhbXMgPSB0aGlzLnBhcmFtcz8gdGhpcy5wYXJhbXMuY29uY2F0KHBhcmFtc0FycikgOiBwYXJhbXNBcnI7XG4gICAgICAgICAgICAgICAgaGFuZGxlclJldHVybiA9IHRoaXMuX2xpc3RlbmVyLmFwcGx5KHRoaXMuY29udGV4dCwgcGFyYW1zKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5faXNPbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGV0YWNoKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGhhbmRsZXJSZXR1cm47XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERldGFjaCBiaW5kaW5nIGZyb20gc2lnbmFsLlxuICAgICAgICAgKiAtIGFsaWFzIHRvOiBteVNpZ25hbC5yZW1vdmUobXlCaW5kaW5nLmdldExpc3RlbmVyKCkpO1xuICAgICAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbnxudWxsfSBIYW5kbGVyIGZ1bmN0aW9uIGJvdW5kIHRvIHRoZSBzaWduYWwgb3IgYG51bGxgIGlmIGJpbmRpbmcgd2FzIHByZXZpb3VzbHkgZGV0YWNoZWQuXG4gICAgICAgICAqL1xuICAgICAgICBkZXRhY2ggOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pc0JvdW5kKCk/IHRoaXMuX3NpZ25hbC5yZW1vdmUodGhpcy5fbGlzdGVuZXIsIHRoaXMuY29udGV4dCkgOiBudWxsO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcmV0dXJuIHtCb29sZWFufSBgdHJ1ZWAgaWYgYmluZGluZyBpcyBzdGlsbCBib3VuZCB0byB0aGUgc2lnbmFsIGFuZCBoYXZlIGEgbGlzdGVuZXIuXG4gICAgICAgICAqL1xuICAgICAgICBpc0JvdW5kIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICghIXRoaXMuX3NpZ25hbCAmJiAhIXRoaXMuX2xpc3RlbmVyKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHJldHVybiB7Ym9vbGVhbn0gSWYgU2lnbmFsQmluZGluZyB3aWxsIG9ubHkgYmUgZXhlY3V0ZWQgb25jZS5cbiAgICAgICAgICovXG4gICAgICAgIGlzT25jZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pc09uY2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBIYW5kbGVyIGZ1bmN0aW9uIGJvdW5kIHRvIHRoZSBzaWduYWwuXG4gICAgICAgICAqL1xuICAgICAgICBnZXRMaXN0ZW5lciA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9saXN0ZW5lcjtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHJldHVybiB7U2lnbmFsfSBTaWduYWwgdGhhdCBsaXN0ZW5lciBpcyBjdXJyZW50bHkgYm91bmQgdG8uXG4gICAgICAgICAqL1xuICAgICAgICBnZXRTaWduYWwgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fc2lnbmFsO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZWxldGUgaW5zdGFuY2UgcHJvcGVydGllc1xuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgX2Rlc3Ryb3kgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fc2lnbmFsO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2xpc3RlbmVyO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuY29udGV4dDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHJldHVybiB7c3RyaW5nfSBTdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIG9iamVjdC5cbiAgICAgICAgICovXG4gICAgICAgIHRvU3RyaW5nIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICdbU2lnbmFsQmluZGluZyBpc09uY2U6JyArIHRoaXMuX2lzT25jZSArJywgaXNCb3VuZDonKyB0aGlzLmlzQm91bmQoKSArJywgYWN0aXZlOicgKyB0aGlzLmFjdGl2ZSArICddJztcbiAgICAgICAgfVxuXG4gICAgfTtcblxuXG4vKmdsb2JhbCBTaWduYWxCaW5kaW5nOmZhbHNlKi9cblxuICAgIC8vIFNpZ25hbCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgZnVuY3Rpb24gdmFsaWRhdGVMaXN0ZW5lcihsaXN0ZW5lciwgZm5OYW1lKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciggJ2xpc3RlbmVyIGlzIGEgcmVxdWlyZWQgcGFyYW0gb2Yge2ZufSgpIGFuZCBzaG91bGQgYmUgYSBGdW5jdGlvbi4nLnJlcGxhY2UoJ3tmbn0nLCBmbk5hbWUpICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDdXN0b20gZXZlbnQgYnJvYWRjYXN0ZXJcbiAgICAgKiA8YnIgLz4tIGluc3BpcmVkIGJ5IFJvYmVydCBQZW5uZXIncyBBUzMgU2lnbmFscy5cbiAgICAgKiBAbmFtZSBTaWduYWxcbiAgICAgKiBAYXV0aG9yIE1pbGxlciBNZWRlaXJvc1xuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIFNpZ25hbCgpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIEFycmF5LjxTaWduYWxCaW5kaW5nPlxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fYmluZGluZ3MgPSBbXTtcbiAgICAgICAgdGhpcy5fcHJldlBhcmFtcyA9IG51bGw7XG5cbiAgICAgICAgLy8gZW5mb3JjZSBkaXNwYXRjaCB0byBhd2F5cyB3b3JrIG9uIHNhbWUgY29udGV4dCAoIzQ3KVxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2ggPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgU2lnbmFsLnByb3RvdHlwZS5kaXNwYXRjaC5hcHBseShzZWxmLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIFNpZ25hbC5wcm90b3R5cGUgPSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNpZ25hbHMgVmVyc2lvbiBOdW1iZXJcbiAgICAgICAgICogQHR5cGUgU3RyaW5nXG4gICAgICAgICAqIEBjb25zdFxuICAgICAgICAgKi9cbiAgICAgICAgVkVSU0lPTiA6ICcxLjAuMCcsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElmIFNpZ25hbCBzaG91bGQga2VlcCByZWNvcmQgb2YgcHJldmlvdXNseSBkaXNwYXRjaGVkIHBhcmFtZXRlcnMgYW5kXG4gICAgICAgICAqIGF1dG9tYXRpY2FsbHkgZXhlY3V0ZSBsaXN0ZW5lciBkdXJpbmcgYGFkZCgpYC9gYWRkT25jZSgpYCBpZiBTaWduYWwgd2FzXG4gICAgICAgICAqIGFscmVhZHkgZGlzcGF0Y2hlZCBiZWZvcmUuXG4gICAgICAgICAqIEB0eXBlIGJvb2xlYW5cbiAgICAgICAgICovXG4gICAgICAgIG1lbW9yaXplIDogZmFsc2UsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIGJvb2xlYW5cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIF9zaG91bGRQcm9wYWdhdGUgOiB0cnVlLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJZiBTaWduYWwgaXMgYWN0aXZlIGFuZCBzaG91bGQgYnJvYWRjYXN0IGV2ZW50cy5cbiAgICAgICAgICogPHA+PHN0cm9uZz5JTVBPUlRBTlQ6PC9zdHJvbmc+IFNldHRpbmcgdGhpcyBwcm9wZXJ0eSBkdXJpbmcgYSBkaXNwYXRjaCB3aWxsIG9ubHkgYWZmZWN0IHRoZSBuZXh0IGRpc3BhdGNoLCBpZiB5b3Ugd2FudCB0byBzdG9wIHRoZSBwcm9wYWdhdGlvbiBvZiBhIHNpZ25hbCB1c2UgYGhhbHQoKWAgaW5zdGVhZC48L3A+XG4gICAgICAgICAqIEB0eXBlIGJvb2xlYW5cbiAgICAgICAgICovXG4gICAgICAgIGFjdGl2ZSA6IHRydWUsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyXG4gICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNPbmNlXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbbGlzdGVuZXJDb250ZXh0XVxuICAgICAgICAgKiBAcGFyYW0ge051bWJlcn0gW3ByaW9yaXR5XVxuICAgICAgICAgKiBAcmV0dXJuIHtTaWduYWxCaW5kaW5nfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgX3JlZ2lzdGVyTGlzdGVuZXIgOiBmdW5jdGlvbiAobGlzdGVuZXIsIGlzT25jZSwgbGlzdGVuZXJDb250ZXh0LCBwcmlvcml0eSkge1xuXG4gICAgICAgICAgICB2YXIgcHJldkluZGV4ID0gdGhpcy5faW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVyLCBsaXN0ZW5lckNvbnRleHQpLFxuICAgICAgICAgICAgICAgIGJpbmRpbmc7XG5cbiAgICAgICAgICAgIGlmIChwcmV2SW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgYmluZGluZyA9IHRoaXMuX2JpbmRpbmdzW3ByZXZJbmRleF07XG4gICAgICAgICAgICAgICAgaWYgKGJpbmRpbmcuaXNPbmNlKCkgIT09IGlzT25jZSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBjYW5ub3QgYWRkJysgKGlzT25jZT8gJycgOiAnT25jZScpICsnKCkgdGhlbiBhZGQnKyAoIWlzT25jZT8gJycgOiAnT25jZScpICsnKCkgdGhlIHNhbWUgbGlzdGVuZXIgd2l0aG91dCByZW1vdmluZyB0aGUgcmVsYXRpb25zaGlwIGZpcnN0LicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYmluZGluZyA9IG5ldyBTaWduYWxCaW5kaW5nKHRoaXMsIGxpc3RlbmVyLCBpc09uY2UsIGxpc3RlbmVyQ29udGV4dCwgcHJpb3JpdHkpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2FkZEJpbmRpbmcoYmluZGluZyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKHRoaXMubWVtb3JpemUgJiYgdGhpcy5fcHJldlBhcmFtcyl7XG4gICAgICAgICAgICAgICAgYmluZGluZy5leGVjdXRlKHRoaXMuX3ByZXZQYXJhbXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gYmluZGluZztcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHBhcmFtIHtTaWduYWxCaW5kaW5nfSBiaW5kaW5nXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICBfYWRkQmluZGluZyA6IGZ1bmN0aW9uIChiaW5kaW5nKSB7XG4gICAgICAgICAgICAvL3NpbXBsaWZpZWQgaW5zZXJ0aW9uIHNvcnRcbiAgICAgICAgICAgIHZhciBuID0gdGhpcy5fYmluZGluZ3MubGVuZ3RoO1xuICAgICAgICAgICAgZG8geyAtLW47IH0gd2hpbGUgKHRoaXMuX2JpbmRpbmdzW25dICYmIGJpbmRpbmcuX3ByaW9yaXR5IDw9IHRoaXMuX2JpbmRpbmdzW25dLl9wcmlvcml0eSk7XG4gICAgICAgICAgICB0aGlzLl9iaW5kaW5ncy5zcGxpY2UobiArIDEsIDAsIGJpbmRpbmcpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lclxuICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICBfaW5kZXhPZkxpc3RlbmVyIDogZnVuY3Rpb24gKGxpc3RlbmVyLCBjb250ZXh0KSB7XG4gICAgICAgICAgICB2YXIgbiA9IHRoaXMuX2JpbmRpbmdzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBjdXI7XG4gICAgICAgICAgICB3aGlsZSAobi0tKSB7XG4gICAgICAgICAgICAgICAgY3VyID0gdGhpcy5fYmluZGluZ3Nbbl07XG4gICAgICAgICAgICAgICAgaWYgKGN1ci5fbGlzdGVuZXIgPT09IGxpc3RlbmVyICYmIGN1ci5jb250ZXh0ID09PSBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2hlY2sgaWYgbGlzdGVuZXIgd2FzIGF0dGFjaGVkIHRvIFNpZ25hbC5cbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXJcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XVxuICAgICAgICAgKiBAcmV0dXJuIHtib29sZWFufSBpZiBTaWduYWwgaGFzIHRoZSBzcGVjaWZpZWQgbGlzdGVuZXIuXG4gICAgICAgICAqL1xuICAgICAgICBoYXMgOiBmdW5jdGlvbiAobGlzdGVuZXIsIGNvbnRleHQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pbmRleE9mTGlzdGVuZXIobGlzdGVuZXIsIGNvbnRleHQpICE9PSAtMTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQWRkIGEgbGlzdGVuZXIgdG8gdGhlIHNpZ25hbC5cbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgU2lnbmFsIGhhbmRsZXIgZnVuY3Rpb24uXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbbGlzdGVuZXJDb250ZXh0XSBDb250ZXh0IG9uIHdoaWNoIGxpc3RlbmVyIHdpbGwgYmUgZXhlY3V0ZWQgKG9iamVjdCB0aGF0IHNob3VsZCByZXByZXNlbnQgdGhlIGB0aGlzYCB2YXJpYWJsZSBpbnNpZGUgbGlzdGVuZXIgZnVuY3Rpb24pLlxuICAgICAgICAgKiBAcGFyYW0ge051bWJlcn0gW3ByaW9yaXR5XSBUaGUgcHJpb3JpdHkgbGV2ZWwgb2YgdGhlIGV2ZW50IGxpc3RlbmVyLiBMaXN0ZW5lcnMgd2l0aCBoaWdoZXIgcHJpb3JpdHkgd2lsbCBiZSBleGVjdXRlZCBiZWZvcmUgbGlzdGVuZXJzIHdpdGggbG93ZXIgcHJpb3JpdHkuIExpc3RlbmVycyB3aXRoIHNhbWUgcHJpb3JpdHkgbGV2ZWwgd2lsbCBiZSBleGVjdXRlZCBhdCB0aGUgc2FtZSBvcmRlciBhcyB0aGV5IHdlcmUgYWRkZWQuIChkZWZhdWx0ID0gMClcbiAgICAgICAgICogQHJldHVybiB7U2lnbmFsQmluZGluZ30gQW4gT2JqZWN0IHJlcHJlc2VudGluZyB0aGUgYmluZGluZyBiZXR3ZWVuIHRoZSBTaWduYWwgYW5kIGxpc3RlbmVyLlxuICAgICAgICAgKi9cbiAgICAgICAgYWRkIDogZnVuY3Rpb24gKGxpc3RlbmVyLCBsaXN0ZW5lckNvbnRleHQsIHByaW9yaXR5KSB7XG4gICAgICAgICAgICB2YWxpZGF0ZUxpc3RlbmVyKGxpc3RlbmVyLCAnYWRkJyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVnaXN0ZXJMaXN0ZW5lcihsaXN0ZW5lciwgZmFsc2UsIGxpc3RlbmVyQ29udGV4dCwgcHJpb3JpdHkpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBZGQgbGlzdGVuZXIgdG8gdGhlIHNpZ25hbCB0aGF0IHNob3VsZCBiZSByZW1vdmVkIGFmdGVyIGZpcnN0IGV4ZWN1dGlvbiAod2lsbCBiZSBleGVjdXRlZCBvbmx5IG9uY2UpLlxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBTaWduYWwgaGFuZGxlciBmdW5jdGlvbi5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IFtsaXN0ZW5lckNvbnRleHRdIENvbnRleHQgb24gd2hpY2ggbGlzdGVuZXIgd2lsbCBiZSBleGVjdXRlZCAob2JqZWN0IHRoYXQgc2hvdWxkIHJlcHJlc2VudCB0aGUgYHRoaXNgIHZhcmlhYmxlIGluc2lkZSBsaXN0ZW5lciBmdW5jdGlvbikuXG4gICAgICAgICAqIEBwYXJhbSB7TnVtYmVyfSBbcHJpb3JpdHldIFRoZSBwcmlvcml0eSBsZXZlbCBvZiB0aGUgZXZlbnQgbGlzdGVuZXIuIExpc3RlbmVycyB3aXRoIGhpZ2hlciBwcmlvcml0eSB3aWxsIGJlIGV4ZWN1dGVkIGJlZm9yZSBsaXN0ZW5lcnMgd2l0aCBsb3dlciBwcmlvcml0eS4gTGlzdGVuZXJzIHdpdGggc2FtZSBwcmlvcml0eSBsZXZlbCB3aWxsIGJlIGV4ZWN1dGVkIGF0IHRoZSBzYW1lIG9yZGVyIGFzIHRoZXkgd2VyZSBhZGRlZC4gKGRlZmF1bHQgPSAwKVxuICAgICAgICAgKiBAcmV0dXJuIHtTaWduYWxCaW5kaW5nfSBBbiBPYmplY3QgcmVwcmVzZW50aW5nIHRoZSBiaW5kaW5nIGJldHdlZW4gdGhlIFNpZ25hbCBhbmQgbGlzdGVuZXIuXG4gICAgICAgICAqL1xuICAgICAgICBhZGRPbmNlIDogZnVuY3Rpb24gKGxpc3RlbmVyLCBsaXN0ZW5lckNvbnRleHQsIHByaW9yaXR5KSB7XG4gICAgICAgICAgICB2YWxpZGF0ZUxpc3RlbmVyKGxpc3RlbmVyLCAnYWRkT25jZScpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JlZ2lzdGVyTGlzdGVuZXIobGlzdGVuZXIsIHRydWUsIGxpc3RlbmVyQ29udGV4dCwgcHJpb3JpdHkpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmUgYSBzaW5nbGUgbGlzdGVuZXIgZnJvbSB0aGUgZGlzcGF0Y2ggcXVldWUuXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIEhhbmRsZXIgZnVuY3Rpb24gdGhhdCBzaG91bGQgYmUgcmVtb3ZlZC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSBFeGVjdXRpb24gY29udGV4dCAoc2luY2UgeW91IGNhbiBhZGQgdGhlIHNhbWUgaGFuZGxlciBtdWx0aXBsZSB0aW1lcyBpZiBleGVjdXRpbmcgaW4gYSBkaWZmZXJlbnQgY29udGV4dCkuXG4gICAgICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBMaXN0ZW5lciBoYW5kbGVyIGZ1bmN0aW9uLlxuICAgICAgICAgKi9cbiAgICAgICAgcmVtb3ZlIDogZnVuY3Rpb24gKGxpc3RlbmVyLCBjb250ZXh0KSB7XG4gICAgICAgICAgICB2YWxpZGF0ZUxpc3RlbmVyKGxpc3RlbmVyLCAncmVtb3ZlJyk7XG5cbiAgICAgICAgICAgIHZhciBpID0gdGhpcy5faW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVyLCBjb250ZXh0KTtcbiAgICAgICAgICAgIGlmIChpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2JpbmRpbmdzW2ldLl9kZXN0cm95KCk7IC8vbm8gcmVhc29uIHRvIGEgU2lnbmFsQmluZGluZyBleGlzdCBpZiBpdCBpc24ndCBhdHRhY2hlZCB0byBhIHNpZ25hbFxuICAgICAgICAgICAgICAgIHRoaXMuX2JpbmRpbmdzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBsaXN0ZW5lcjtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlIGFsbCBsaXN0ZW5lcnMgZnJvbSB0aGUgU2lnbmFsLlxuICAgICAgICAgKi9cbiAgICAgICAgcmVtb3ZlQWxsIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG4gPSB0aGlzLl9iaW5kaW5ncy5sZW5ndGg7XG4gICAgICAgICAgICB3aGlsZSAobi0tKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYmluZGluZ3Nbbl0uX2Rlc3Ryb3koKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2JpbmRpbmdzLmxlbmd0aCA9IDA7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEByZXR1cm4ge251bWJlcn0gTnVtYmVyIG9mIGxpc3RlbmVycyBhdHRhY2hlZCB0byB0aGUgU2lnbmFsLlxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0TnVtTGlzdGVuZXJzIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2JpbmRpbmdzLmxlbmd0aDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU3RvcCBwcm9wYWdhdGlvbiBvZiB0aGUgZXZlbnQsIGJsb2NraW5nIHRoZSBkaXNwYXRjaCB0byBuZXh0IGxpc3RlbmVycyBvbiB0aGUgcXVldWUuXG4gICAgICAgICAqIDxwPjxzdHJvbmc+SU1QT1JUQU5UOjwvc3Ryb25nPiBzaG91bGQgYmUgY2FsbGVkIG9ubHkgZHVyaW5nIHNpZ25hbCBkaXNwYXRjaCwgY2FsbGluZyBpdCBiZWZvcmUvYWZ0ZXIgZGlzcGF0Y2ggd29uJ3QgYWZmZWN0IHNpZ25hbCBicm9hZGNhc3QuPC9wPlxuICAgICAgICAgKiBAc2VlIFNpZ25hbC5wcm90b3R5cGUuZGlzYWJsZVxuICAgICAgICAgKi9cbiAgICAgICAgaGFsdCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX3Nob3VsZFByb3BhZ2F0ZSA9IGZhbHNlO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEaXNwYXRjaC9Ccm9hZGNhc3QgU2lnbmFsIHRvIGFsbCBsaXN0ZW5lcnMgYWRkZWQgdG8gdGhlIHF1ZXVlLlxuICAgICAgICAgKiBAcGFyYW0gey4uLip9IFtwYXJhbXNdIFBhcmFtZXRlcnMgdGhhdCBzaG91bGQgYmUgcGFzc2VkIHRvIGVhY2ggaGFuZGxlci5cbiAgICAgICAgICovXG4gICAgICAgIGRpc3BhdGNoIDogZnVuY3Rpb24gKHBhcmFtcykge1xuICAgICAgICAgICAgaWYgKCEgdGhpcy5hY3RpdmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBwYXJhbXNBcnIgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLFxuICAgICAgICAgICAgICAgIG4gPSB0aGlzLl9iaW5kaW5ncy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgYmluZGluZ3M7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLm1lbW9yaXplKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJldlBhcmFtcyA9IHBhcmFtc0FycjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCEgbikge1xuICAgICAgICAgICAgICAgIC8vc2hvdWxkIGNvbWUgYWZ0ZXIgbWVtb3JpemVcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGJpbmRpbmdzID0gdGhpcy5fYmluZGluZ3Muc2xpY2UoKTsgLy9jbG9uZSBhcnJheSBpbiBjYXNlIGFkZC9yZW1vdmUgaXRlbXMgZHVyaW5nIGRpc3BhdGNoXG4gICAgICAgICAgICB0aGlzLl9zaG91bGRQcm9wYWdhdGUgPSB0cnVlOyAvL2luIGNhc2UgYGhhbHRgIHdhcyBjYWxsZWQgYmVmb3JlIGRpc3BhdGNoIG9yIGR1cmluZyB0aGUgcHJldmlvdXMgZGlzcGF0Y2guXG5cbiAgICAgICAgICAgIC8vZXhlY3V0ZSBhbGwgY2FsbGJhY2tzIHVudGlsIGVuZCBvZiB0aGUgbGlzdCBvciB1bnRpbCBhIGNhbGxiYWNrIHJldHVybnMgYGZhbHNlYCBvciBzdG9wcyBwcm9wYWdhdGlvblxuICAgICAgICAgICAgLy9yZXZlcnNlIGxvb3Agc2luY2UgbGlzdGVuZXJzIHdpdGggaGlnaGVyIHByaW9yaXR5IHdpbGwgYmUgYWRkZWQgYXQgdGhlIGVuZCBvZiB0aGUgbGlzdFxuICAgICAgICAgICAgZG8geyBuLS07IH0gd2hpbGUgKGJpbmRpbmdzW25dICYmIHRoaXMuX3Nob3VsZFByb3BhZ2F0ZSAmJiBiaW5kaW5nc1tuXS5leGVjdXRlKHBhcmFtc0FycikgIT09IGZhbHNlKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogRm9yZ2V0IG1lbW9yaXplZCBhcmd1bWVudHMuXG4gICAgICAgICAqIEBzZWUgU2lnbmFsLm1lbW9yaXplXG4gICAgICAgICAqL1xuICAgICAgICBmb3JnZXQgOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdGhpcy5fcHJldlBhcmFtcyA9IG51bGw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZSBhbGwgYmluZGluZ3MgZnJvbSBzaWduYWwgYW5kIGRlc3Ryb3kgYW55IHJlZmVyZW5jZSB0byBleHRlcm5hbCBvYmplY3RzIChkZXN0cm95IFNpZ25hbCBvYmplY3QpLlxuICAgICAgICAgKiA8cD48c3Ryb25nPklNUE9SVEFOVDo8L3N0cm9uZz4gY2FsbGluZyBhbnkgbWV0aG9kIG9uIHRoZSBzaWduYWwgaW5zdGFuY2UgYWZ0ZXIgY2FsbGluZyBkaXNwb3NlIHdpbGwgdGhyb3cgZXJyb3JzLjwvcD5cbiAgICAgICAgICovXG4gICAgICAgIGRpc3Bvc2UgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUFsbCgpO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2JpbmRpbmdzO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX3ByZXZQYXJhbXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEByZXR1cm4ge3N0cmluZ30gU3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBvYmplY3QuXG4gICAgICAgICAqL1xuICAgICAgICB0b1N0cmluZyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAnW1NpZ25hbCBhY3RpdmU6JysgdGhpcy5hY3RpdmUgKycgbnVtTGlzdGVuZXJzOicrIHRoaXMuZ2V0TnVtTGlzdGVuZXJzKCkgKyddJztcbiAgICAgICAgfVxuXG4gICAgfTtcblxuXG4gICAgLy8gTmFtZXNwYWNlIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICAvKipcbiAgICAgKiBTaWduYWxzIG5hbWVzcGFjZVxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKiBAbmFtZSBzaWduYWxzXG4gICAgICovXG4gICAgdmFyIHNpZ25hbHMgPSBTaWduYWw7XG5cbiAgICAvKipcbiAgICAgKiBDdXN0b20gZXZlbnQgYnJvYWRjYXN0ZXJcbiAgICAgKiBAc2VlIFNpZ25hbFxuICAgICAqL1xuICAgIC8vIGFsaWFzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSAoc2VlICNnaC00NClcbiAgICBzaWduYWxzLlNpZ25hbCA9IFNpZ25hbDtcblxuXG5cbiAgICAvL2V4cG9ydHMgdG8gbXVsdGlwbGUgZW52aXJvbm1lbnRzXG4gICAgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKXsgLy9BTURcbiAgICAgICAgZGVmaW5lKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHNpZ25hbHM7IH0pO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpeyAvL25vZGVcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBzaWduYWxzO1xuICAgIH0gZWxzZSB7IC8vYnJvd3NlclxuICAgICAgICAvL3VzZSBzdHJpbmcgYmVjYXVzZSBvZiBHb29nbGUgY2xvc3VyZSBjb21waWxlciBBRFZBTkNFRF9NT0RFXG4gICAgICAgIC8qanNsaW50IHN1Yjp0cnVlICovXG4gICAgICAgIGdsb2JhbFsnc2lnbmFscyddID0gc2lnbmFscztcbiAgICB9XG5cbn0odGhpcykpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7XG5cdHZhbHVlOiB0cnVlXG59KTtcblxuLyoqXG4gKiBMb2dnZXIgQ2xhc3NcbiAqIEByZXR1cm4ge29iamVjdH0gTG9nZ2VyXG4gKi9cblxuZXhwb3J0c1snZGVmYXVsdCddID0gKGZ1bmN0aW9uICgpIHtcblxuXHRyZXR1cm4ge1xuXG5cdFx0LyogdG9nZ2xlIGFjdGl2ZSBzdGF0ZSAqL1xuXHRcdGVuYWJsZWQ6IHRydWUsXG5cblx0XHRpbml0TG9nZ2VyOiBmdW5jdGlvbiBpbml0TG9nZ2VyKGFjdGl2ZSkge1xuXHRcdFx0dGhpcy5lbmFibGVkID0gYWN0aXZlO1xuXHRcdH0sXG5cblx0XHRzZXRTdGF0ZTogZnVuY3Rpb24gc2V0U3RhdGUoYWN0aXZlKSB7XG5cdFx0XHR0aGlzLmVuYWJsZWQgPSBhY3RpdmU7XG5cdFx0fSxcblxuXHRcdGxvZzogZnVuY3Rpb24gbG9nKG1zZykge1xuXHRcdFx0aWYgKHRoaXMuZW5hYmxlZCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnOjo6OiAnICsgdGhpcy5uYW1lICsgJyA6Ojo6IFsgJyArIG1zZyArICcgXSAnKTtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0ZXJyb3I6IGZ1bmN0aW9uIGVycm9yKG1zZykge1xuXHRcdFx0aWYgKHRoaXMuZW5hYmxlZCkge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKCc6Ojo6ICcgKyB0aGlzLm5hbWUgKyAnIDo6OjogKioqKiogRVJST1IgKioqKiogLSBbICcgKyBtc2cgKyAnIF0gJyk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xufSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSWk5VmMyVnljeTkwWVd4M2IyOXNaaTlrWlhabGJHOXdaWEl2ZDJWaVVtOXZkQzkwY21GdWMybDBhVzl1TFcxaGJtRm5aWEl2YzNKakwyTnZiVzF2Ymk5TWIyZG5aWEl1YW5NaVhTd2libUZ0WlhNaU9sdGRMQ0p0WVhCd2FXNW5jeUk2SWpzN096czdPenM3T3pzN2NVSkJTMlVzUTBGQlF5eFpRVUZYT3p0QlFVVXhRaXhSUVVGUE96czdRVUZIVGl4VFFVRlBMRVZCUVVrc1NVRkJTVHM3UVVGRlppeFpRVUZWTEVWQlFVRXNiMEpCUVVVc1RVRkJUU3hGUVVGSE8wRkJRM0JDTEU5QlFVa3NRMEZCUXl4UFFVRlBMRWRCUVVrc1RVRkJUU3hEUVVGRE8wZEJRM1pDT3p0QlFVVkVMRlZCUVZFc1JVRkJRU3hyUWtGQlJTeE5RVUZOTEVWQlFVYzdRVUZEYkVJc1QwRkJTU3hEUVVGRExFOUJRVThzUjBGQlJ5eE5RVUZOTEVOQlFVTTdSMEZEZEVJN08wRkJSVVFzUzBGQlJ5eEZRVUZCTEdGQlFVVXNSMEZCUnl4RlFVRkhPMEZCUTFZc1QwRkJTU3hKUVVGSkxFTkJRVU1zVDBGQlR5eEZRVUZGTzBGQlEycENMRmRCUVU4c1EwRkJReXhIUVVGSExFTkJRVWNzVDBGQlR5eEhRVUZGTEVsQlFVa3NRMEZCUXl4SlFVRkpMRWRCUVVVc1ZVRkJWU3hIUVVGSExFZEJRVWNzUjBGQlJ5eExRVUZMTEVOQlFVTXNRMEZCUXp0SlFVTTFSRHRIUVVORU96dEJRVVZFTEU5QlFVc3NSVUZCUXl4bFFVRkZMRWRCUVVjc1JVRkJSenRCUVVOaUxFOUJRVWtzU1VGQlNTeERRVUZETEU5QlFVOHNSVUZCUlR0QlFVTnFRaXhYUVVGUExFTkJRVU1zUzBGQlN5eERRVUZETEU5QlFVOHNSMEZCUlN4SlFVRkpMRU5CUVVNc1NVRkJTU3hIUVVGRkxEaENRVUU0UWl4SFFVRkhMRWRCUVVjc1IwRkJSeXhMUVVGTExFTkJRVU1zUTBGQlF6dEpRVU5vUmp0SFFVTkVPMFZCUTBRc1EwRkJRVHREUVVWRUxFTkJRVUVzUlVGQlJ5SXNJbVpwYkdVaU9pSXZWWE5sY25NdmRHRnNkMjl2YkdZdlpHVjJaV3h2Y0dWeUwzZGxZbEp2YjNRdmRISmhibk5wZEdsdmJpMXRZVzVoWjJWeUwzTnlZeTlqYjIxdGIyNHZURzluWjJWeUxtcHpJaXdpYzI5MWNtTmxjME52Ym5SbGJuUWlPbHNpWEc0dktpcGNiaUFxSUV4dloyZGxjaUJEYkdGemMxeHVJQ29nUUhKbGRIVnliaUI3YjJKcVpXTjBmU0JNYjJkblpYSmNiaUFxTDF4dVpYaHdiM0owSUdSbFptRjFiSFFnS0daMWJtTjBhVzl1S0NrZ2UxeHVYSFJjYmx4MGNtVjBkWEp1SUh0Y2JseHVYSFJjZEM4cUlIUnZaMmRzWlNCaFkzUnBkbVVnYzNSaGRHVWdLaTljYmx4MFhIUmxibUZpYkdWa0lGeDBPaUIwY25WbExGeHVYRzVjZEZ4MGFXNXBkRXh2WjJkbGNpZ2dZV04wYVhabElDa2dlMXh1WEhSY2RGeDBkR2hwY3k1bGJtRmliR1ZrSUQwZ0lHRmpkR2wyWlR0Y2JseDBYSFI5TEZ4dVhHNWNkRngwYzJWMFUzUmhkR1VvSUdGamRHbDJaU0FwSUh0Y2JseDBYSFJjZEhSb2FYTXVaVzVoWW14bFpDQTlJR0ZqZEdsMlpUdGNibHgwWEhSOUxGeHVYRzVjZEZ4MGJHOW5LQ0J0YzJjZ0tTQjdYRzVjZEZ4MFhIUnBaaWdnZEdocGN5NWxibUZpYkdWa0lDbDdYRzVjZEZ4MFhIUmNkR052Ym5OdmJHVXViRzluS0NBZ0p6bzZPam9nSnlzZ2RHaHBjeTV1WVcxbElDc25JRG82T2pvZ1d5QW5JQ3NnYlhObklDc2dKeUJkSUNjcE8xeHVYSFJjZEZ4MGZWeHVYSFJjZEgwc1hHNWNibHgwWEhSbGNuSnZjaUFvSUcxelp5QXBJSHRjYmx4MFhIUmNkR2xtS0NCMGFHbHpMbVZ1WVdKc1pXUWdLWHRjYmx4MFhIUmNkRngwWTI5dWMyOXNaUzVsY25KdmNpZ25Pam82T2lBbkt5QjBhR2x6TG01aGJXVWdLeWNnT2pvNk9pQXFLaW9xS2lCRlVsSlBVaUFxS2lvcUtpQXRJRnNnSnlBcklHMXpaeUFySUNjZ1hTQW5LVHRjYmx4MFhIUmNkSDFjYmx4MFhIUjlYRzVjZEgxY2JseHVmU2tvS1R0Y2JseHVJbDE5IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX3NpZ25hbHMgPSByZXF1aXJlKCdzaWduYWxzJyk7XG5cbnZhciBfc2lnbmFsczIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9zaWduYWxzKTtcblxuLyoqXG4gKiBleHBvcnQgYXBwbGljYXRpb24gXG4gKiBzaWduYWxzIGVhY2ggb25lIGZvciBkaWZmZXJlbnQgYXBwIHN0YXRlc1xuICovXG52YXIgc3RhdGVDaGFuZ2VkID0gbmV3IF9zaWduYWxzMlsnZGVmYXVsdCddKCk7XG5leHBvcnRzLnN0YXRlQ2hhbmdlZCA9IHN0YXRlQ2hhbmdlZDtcbnZhciB0cmFuc2l0aW9uU3RhcnRlZCA9IG5ldyBfc2lnbmFsczJbJ2RlZmF1bHQnXSgpO1xuZXhwb3J0cy50cmFuc2l0aW9uU3RhcnRlZCA9IHRyYW5zaXRpb25TdGFydGVkO1xudmFyIHRyYW5zaXRpb25Db21wbGV0ZSA9IG5ldyBfc2lnbmFsczJbJ2RlZmF1bHQnXSgpO1xuZXhwb3J0cy50cmFuc2l0aW9uQ29tcGxldGUgPSB0cmFuc2l0aW9uQ29tcGxldGU7XG52YXIgYWxsVHJhbnNpdGlvbnNTdGFydGVkID0gbmV3IF9zaWduYWxzMlsnZGVmYXVsdCddKCk7XG5leHBvcnRzLmFsbFRyYW5zaXRpb25zU3RhcnRlZCA9IGFsbFRyYW5zaXRpb25zU3RhcnRlZDtcbnZhciBhbGxUcmFuc2l0aW9uQ29tcGxldGVkID0gbmV3IF9zaWduYWxzMlsnZGVmYXVsdCddKCk7XG5leHBvcnRzLmFsbFRyYW5zaXRpb25Db21wbGV0ZWQgPSBhbGxUcmFuc2l0aW9uQ29tcGxldGVkO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYklpOVZjMlZ5Y3k5MFlXeDNiMjlzWmk5a1pYWmxiRzl3WlhJdmQyVmlVbTl2ZEM5MGNtRnVjMmwwYVc5dUxXMWhibUZuWlhJdmMzSmpMMk52YlcxdmJpOWthWE53WVhSamFHVnlMbXB6SWwwc0ltNWhiV1Z6SWpwYlhTd2liV0Z3Y0dsdVozTWlPaUk3T3pzN096czdPM1ZDUVVGdFFpeFRRVUZUT3pzN096czdPenRCUVUxeVFpeEpRVUZOTEZsQlFWa3NSMEZCVHl3d1FrRkJXU3hEUVVGRE8xRkJRV2hETEZsQlFWa3NSMEZCV2l4WlFVRlpPMEZCUTJ4Q0xFbEJRVTBzYVVKQlFXbENMRWRCUVUwc01FSkJRVmtzUTBGQlF6dFJRVUZ3UXl4cFFrRkJhVUlzUjBGQmFrSXNhVUpCUVdsQ08wRkJRM1pDTEVsQlFVMHNhMEpCUVd0Q0xFZEJRVThzTUVKQlFWa3NRMEZCUXp0UlFVRjBReXhyUWtGQmEwSXNSMEZCYkVJc2EwSkJRV3RDTzBGQlEzaENMRWxCUVUwc2NVSkJRWEZDTEVkQlFVa3NNRUpCUVZrc1EwRkJRenRSUVVGMFF5eHhRa0ZCY1VJc1IwRkJja0lzY1VKQlFYRkNPMEZCUXpOQ0xFbEJRVTBzYzBKQlFYTkNMRWRCUVVjc01FSkJRVmtzUTBGQlF6dFJRVUYwUXl4elFrRkJjMElzUjBGQmRFSXNjMEpCUVhOQ0lpd2labWxzWlNJNklpOVZjMlZ5Y3k5MFlXeDNiMjlzWmk5a1pYWmxiRzl3WlhJdmQyVmlVbTl2ZEM5MGNtRnVjMmwwYVc5dUxXMWhibUZuWlhJdmMzSmpMMk52YlcxdmJpOWthWE53WVhSamFHVnlMbXB6SWl3aWMyOTFjbU5sYzBOdmJuUmxiblFpT2xzaWFXMXdiM0owSUZOcFoyNWhiQ0JtY205dElDZHphV2R1WVd4ekp6dGNibHh1THlvcVhHNGdLaUJsZUhCdmNuUWdZWEJ3YkdsallYUnBiMjRnWEc0Z0tpQnphV2R1WVd4eklHVmhZMmdnYjI1bElHWnZjaUJrYVdabVpYSmxiblFnWVhCd0lITjBZWFJsYzF4dUlDb3ZYRzVsZUhCdmNuUWdZMjl1YzNRZ2MzUmhkR1ZEYUdGdVoyVmtJRngwWEhRZ1hIUTlJRzVsZHlCVGFXZHVZV3dvS1R0Y2JtVjRjRzl5ZENCamIyNXpkQ0IwY21GdWMybDBhVzl1VTNSaGNuUmxaQ0FnSUZ4MFBTQnVaWGNnVTJsbmJtRnNLQ2s3WEc1bGVIQnZjblFnWTI5dWMzUWdkSEpoYm5OcGRHbHZia052YlhCc1pYUmxJQ0FnSUNBOUlHNWxkeUJUYVdkdVlXd29LVHRjYm1WNGNHOXlkQ0JqYjI1emRDQmhiR3hVY21GdWMybDBhVzl1YzFOMFlYSjBaV1FnSUQwZ2JtVjNJRk5wWjI1aGJDZ3BPMXh1Wlhod2IzSjBJR052Ym5OMElHRnNiRlJ5WVc1emFYUnBiMjVEYjIxd2JHVjBaV1FnUFNCdVpYY2dVMmxuYm1Gc0tDazdYRzVjYmlKZGZRPT0iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHtcblx0dmFsdWU6IHRydWVcbn0pO1xuXG4vKipcbiAqIExvZ2dlciBDbGFzc1xuICogQHJldHVybiB7b2JqZWN0fSBMb2dnZXJcbiAqL1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSAoZnVuY3Rpb24gKCkge1xuXG5cdHJldHVybiB7XG5cblx0XHQvKiB0b2dnbGUgYWN0aXZlIHN0YXRlICovXG5cdFx0ZW5hYmxlZDogdHJ1ZSxcblxuXHRcdGluaXRMb2dnZXI6IGZ1bmN0aW9uIGluaXRMb2dnZXIoYWN0aXZlKSB7XG5cdFx0XHR0aGlzLmVuYWJsZWQgPSBhY3RpdmU7XG5cdFx0fSxcblxuXHRcdHNldFN0YXRlOiBmdW5jdGlvbiBzZXRTdGF0ZShhY3RpdmUpIHtcblx0XHRcdHRoaXMuZW5hYmxlZCA9IGFjdGl2ZTtcblx0XHR9LFxuXG5cdFx0bG9nOiBmdW5jdGlvbiBsb2cobXNnKSB7XG5cdFx0XHRpZiAodGhpcy5lbmFibGVkKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCc6Ojo6ICcgKyB0aGlzLm5hbWUgKyAnIDo6OjogWyAnICsgbXNnICsgJyBdICcpO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHRlcnJvcjogZnVuY3Rpb24gZXJyb3IobXNnKSB7XG5cdFx0XHRpZiAodGhpcy5lbmFibGVkKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoJzo6OjogJyArIHRoaXMubmFtZSArICcgOjo6OiAqKioqKiBFUlJPUiAqKioqKiAtIFsgJyArIG1zZyArICcgXSAnKTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG59KSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJaTlWYzJWeWN5OTBZV3gzYjI5c1ppOWtaWFpsYkc5d1pYSXZkMlZpVW05dmRDOTBjbUZ1YzJsMGFXOXVMVzFoYm1GblpYSXZjM0pqTDJOdmJXMXZiaTlzYjJkblpYSXVhbk1pWFN3aWJtRnRaWE1pT2x0ZExDSnRZWEJ3YVc1bmN5STZJanM3T3pzN096czdPenM3Y1VKQlMyVXNRMEZCUXl4WlFVRlhPenRCUVVVeFFpeFJRVUZQT3pzN1FVRkhUaXhUUVVGUExFVkJRVWtzU1VGQlNUczdRVUZGWml4WlFVRlZMRVZCUVVFc2IwSkJRVVVzVFVGQlRTeEZRVUZITzBGQlEzQkNMRTlCUVVrc1EwRkJReXhQUVVGUExFZEJRVWtzVFVGQlRTeERRVUZETzBkQlEzWkNPenRCUVVWRUxGVkJRVkVzUlVGQlFTeHJRa0ZCUlN4TlFVRk5MRVZCUVVjN1FVRkRiRUlzVDBGQlNTeERRVUZETEU5QlFVOHNSMEZCUnl4TlFVRk5MRU5CUVVNN1IwRkRkRUk3TzBGQlJVUXNTMEZCUnl4RlFVRkJMR0ZCUVVVc1IwRkJSeXhGUVVGSE8wRkJRMVlzVDBGQlNTeEpRVUZKTEVOQlFVTXNUMEZCVHl4RlFVRkZPMEZCUTJwQ0xGZEJRVThzUTBGQlF5eEhRVUZITEVOQlFVY3NUMEZCVHl4SFFVRkZMRWxCUVVrc1EwRkJReXhKUVVGSkxFZEJRVVVzVlVGQlZTeEhRVUZITEVkQlFVY3NSMEZCUnl4TFFVRkxMRU5CUVVNc1EwRkJRenRKUVVNMVJEdEhRVU5FT3p0QlFVVkVMRTlCUVVzc1JVRkJReXhsUVVGRkxFZEJRVWNzUlVGQlJ6dEJRVU5pTEU5QlFVa3NTVUZCU1N4RFFVRkRMRTlCUVU4c1JVRkJSVHRCUVVOcVFpeFhRVUZQTEVOQlFVTXNTMEZCU3l4RFFVRkRMRTlCUVU4c1IwRkJSU3hKUVVGSkxFTkJRVU1zU1VGQlNTeEhRVUZGTERoQ1FVRTRRaXhIUVVGSExFZEJRVWNzUjBGQlJ5eExRVUZMTEVOQlFVTXNRMEZCUXp0SlFVTm9SanRIUVVORU8wVkJRMFFzUTBGQlFUdERRVVZFTEVOQlFVRXNSVUZCUnlJc0ltWnBiR1VpT2lJdlZYTmxjbk12ZEdGc2QyOXZiR1l2WkdWMlpXeHZjR1Z5TDNkbFlsSnZiM1F2ZEhKaGJuTnBkR2x2YmkxdFlXNWhaMlZ5TDNOeVl5OWpiMjF0YjI0dmJHOW5aMlZ5TG1weklpd2ljMjkxY21ObGMwTnZiblJsYm5RaU9sc2lYRzR2S2lwY2JpQXFJRXh2WjJkbGNpQkRiR0Z6YzF4dUlDb2dRSEpsZEhWeWJpQjdiMkpxWldOMGZTQk1iMmRuWlhKY2JpQXFMMXh1Wlhod2IzSjBJR1JsWm1GMWJIUWdLR1oxYm1OMGFXOXVLQ2tnZTF4dVhIUmNibHgwY21WMGRYSnVJSHRjYmx4dVhIUmNkQzhxSUhSdloyZHNaU0JoWTNScGRtVWdjM1JoZEdVZ0tpOWNibHgwWEhSbGJtRmliR1ZrSUZ4ME9pQjBjblZsTEZ4dVhHNWNkRngwYVc1cGRFeHZaMmRsY2lnZ1lXTjBhWFpsSUNrZ2UxeHVYSFJjZEZ4MGRHaHBjeTVsYm1GaWJHVmtJRDBnSUdGamRHbDJaVHRjYmx4MFhIUjlMRnh1WEc1Y2RGeDBjMlYwVTNSaGRHVW9JR0ZqZEdsMlpTQXBJSHRjYmx4MFhIUmNkSFJvYVhNdVpXNWhZbXhsWkNBOUlHRmpkR2wyWlR0Y2JseDBYSFI5TEZ4dVhHNWNkRngwYkc5bktDQnRjMmNnS1NCN1hHNWNkRngwWEhScFppZ2dkR2hwY3k1bGJtRmliR1ZrSUNsN1hHNWNkRngwWEhSY2RHTnZibk52YkdVdWJHOW5LQ0FnSnpvNk9qb2dKeXNnZEdocGN5NXVZVzFsSUNzbklEbzZPam9nV3lBbklDc2diWE5uSUNzZ0p5QmRJQ2NwTzF4dVhIUmNkRngwZlZ4dVhIUmNkSDBzWEc1Y2JseDBYSFJsY25KdmNpQW9JRzF6WnlBcElIdGNibHgwWEhSY2RHbG1LQ0IwYUdsekxtVnVZV0pzWldRZ0tYdGNibHgwWEhSY2RGeDBZMjl1YzI5c1pTNWxjbkp2Y2lnbk9qbzZPaUFuS3lCMGFHbHpMbTVoYldVZ0t5Y2dPam82T2lBcUtpb3FLaUJGVWxKUFVpQXFLaW9xS2lBdElGc2dKeUFySUcxelp5QXJJQ2NnWFNBbktUdGNibHgwWEhSY2RIMWNibHgwWEhSOVhHNWNkSDFjYmx4dWZTa29LVHRjYmx4dUlsMTkiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHtcblx0dmFsdWU6IHRydWVcbn0pO1xuXG4vKipcbiAqIERlZmZlciB0aGUgcHJvbWlzZSBcbiAqIEByZXR1cm4ge29iamVjdH0geyByZXNvbHZlIDogZnVuY3Rpb24sIHJlamVjdCA6IGZ1bmN0aW9uIH1cbiAqL1xuZXhwb3J0cy5EZWZlcnJlZCA9IERlZmVycmVkO1xuXG4vKipcbiAqIGNyZWF0ZSBhIGZhY2FkIGZvciBlczYtcHJvbWlzZSBhbGxcbiAqIG92cnJpZGRlbiBmYWNhZCB0byBkaXNwbGF5IGVycm9yIGxvZ3MgZm9yIGRldmVsb3BtZW50IFxuICogZHVlIHRvIGVzNi1wcm9taXNlIGVycm9yIHN1cHByZXNzaW9uIGlzc3VlXG4gKiBAcGFyYW0gIHthcnJheX0gICBwcm9taXNlcyBcbiAqIEByZXR1cm4ge2Z1bmN0aW9ufSBcbiAqL1xuZXhwb3J0cy5hbGwgPSBhbGw7XG5cbnZhciBfZXM2UHJvbWlzZSA9IHJlcXVpcmUoJ2VzNi1wcm9taXNlJyk7XG5cbi8qKlxuICogUHJvbWlzZSBmYWNhZCBvYmplY3RcbiAqIGNyZWF0ZXMgYSBmYWNhZCBmb3IgYXBwbGljYXRpb24gcHJvbWlzZXMsIFxuICogZGV0YXRjaGVzIGZlb20gdGhlIGxpYnJhcnkgYmVpbmcgdXNlZCB0byBzZXJ2ZSBwcm9taXNlcyB0byB0aGUgYXBwXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG52YXIgUHJvbWlzZUZhY2FkZSA9IHt9O1xuZnVuY3Rpb24gRGVmZXJyZWQoKSB7XG5cdHZhciByZXN1bHQgPSB7fTtcblx0cmVzdWx0LnByb21pc2UgPSBuZXcgX2VzNlByb21pc2UuUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdFx0cmVzdWx0LnJlc29sdmUgPSByZXNvbHZlO1xuXHRcdHJlc3VsdC5yZWplY3QgPSByZWplY3Q7XG5cdH0pO1xuXHRyZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBhbGwoKSB7XG5cdHZhciBfYXJndW1lbnRzID0gYXJndW1lbnRzO1xuXG5cdHZhciBleHRlcm5hbEVycm9yID0gdW5kZWZpbmVkLFxuXHQgICAgZXJyb3IgPSBmdW5jdGlvbiBlcnJvcihlKSB7XG5cdFx0Y29uc29sZS5lcnJvcignIC0tLSBQUk9NSVNFIENBVUdIVCBFUlJPUiAtLS0gJywgX2FyZ3VtZW50c1swXS5zdGFjaywgZSk7XG5cdFx0aWYgKGV4dGVybmFsRXJyb3IpIHtcblx0XHRcdGV4dGVybmFsRXJyb3IoJ2VzNi1wcm9taXNlIGFsbCBlcnJvciAnLCBfYXJndW1lbnRzWzBdLnN0YWNrLCBlKTtcblx0XHR9O1xuXHR9O1xuXG5cdHJldHVybiAoZnVuY3Rpb24gKCkge1xuXHRcdHZhciBhbGwgPSBfZXM2UHJvbWlzZS5Qcm9taXNlLmFsbChfYXJndW1lbnRzWzBdKTtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dGhlbjogZnVuY3Rpb24gdGhlbigpIHtcblx0XHRcdFx0ZXh0ZXJuYWxFcnJvciA9IGFyZ3VtZW50c1sxXTtcblx0XHRcdFx0YWxsLnRoZW4oYXJndW1lbnRzWzBdKVsnY2F0Y2gnXShlcnJvcik7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSkoYXJndW1lbnRzKTtcbn1cblxuLyoqXG4gKiByZXR1cm4gb2JqZWN0IGdldHRlcnNcbiAqIFxuICogLSBhbGwgLSBjaGVja3MgdG8gc2VlIGlmIGFsbCBwcm9taXNlcyBoYXMgY29tcGxldGVkIGJlZm9yZSBjb250aW51aW5nXG4gKiAtIFByb21pc2UgLSByZXR1cm5zIGEgUHJvbWlzZVxuICogLSBEZWZlcnJlZCAtIHJldHVybnMgYW4gdW4gcmVzb2x2ZWQgcHJvbWlzZSBhbmQgYW4gb2JqZWN0IHdpdGggdGhlIHJlc29sdmUgYW5kIHJlamVjdCBmdW5jdGlvbnNcbiAqIEByZXR1cm4ge2Z1bmN0aW9ufSAgIFtkZXNjcmlwdGlvbl1cbiAqL1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KFByb21pc2VGYWNhZGUsICdhbGwnLCB7IGdldDogZnVuY3Rpb24gZ2V0KCkge1xuXHRcdHJldHVybiBhbGw7XG5cdH0gfSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoUHJvbWlzZUZhY2FkZSwgJ1Byb21pc2UnLCB7IGdldDogZnVuY3Rpb24gZ2V0KCkge1xuXHRcdHJldHVybiBfZXM2UHJvbWlzZS5Qcm9taXNlO1xuXHR9IH0pO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KFByb21pc2VGYWNhZGUsICdEZWZlcnJlZCcsIHsgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG5cdFx0cmV0dXJuIERlZmVycmVkO1xuXHR9IH0pO1xuXG4vKiBleHBvcnQgZGVmYXVsdHMgKi9cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IFByb21pc2VGYWNhZGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSWk5VmMyVnljeTkwWVd4M2IyOXNaaTlrWlhabGJHOXdaWEl2ZDJWaVVtOXZkQzkwY21GdWMybDBhVzl1TFcxaGJtRm5aWEl2YzNKakwyTnZiVzF2Ymk5d2NtOXRhWE5sUm1GallXUmxMbXB6SWwwc0ltNWhiV1Z6SWpwYlhTd2liV0Z3Y0dsdVozTWlPaUk3T3pzN096czdPenM3VVVGblFtZENMRkZCUVZFc1IwRkJVaXhSUVVGUk96czdPenM3T3pzN1VVRnJRbElzUjBGQlJ5eEhRVUZJTEVkQlFVYzdPekJDUVdwRFJ5eGhRVUZoT3pzN096czdPenRCUVZGdVF5eEpRVUZKTEdGQlFXRXNSMEZCUnl4RlFVRkZMRU5CUVVNN1FVRlBhRUlzVTBGQlV5eFJRVUZSTEVkQlEzaENPMEZCUTBNc1MwRkJTU3hOUVVGTkxFZEJRVWNzUlVGQlJTeERRVUZETzBGQlEyaENMRTlCUVUwc1EwRkJReXhQUVVGUExFZEJRVWNzWjBKQmJFSldMRTlCUVU4c1EwRnJRbVVzVlVGQlJTeFBRVUZQTEVWQlFVVXNUVUZCVFN4RlFVTTVRenRCUVVORExGRkJRVTBzUTBGQlF5eFBRVUZQTEVkQlFVY3NUMEZCVHl4RFFVRkRPMEZCUTNwQ0xGRkJRVTBzUTBGQlF5eE5RVUZOTEVkQlFVa3NUVUZCVFN4RFFVRkRPMFZCUTNoQ0xFTkJRVU1zUTBGQlF6dEJRVU5JTEZGQlFVOHNUVUZCVFN4RFFVRkRPME5CUTJRN08wRkJVMDBzVTBGQlV5eEhRVUZITEVkQlFVYzdPenRCUVVWeVFpeExRVUZKTEdGQlFXRXNXVUZCUVR0TFFVTm9RaXhMUVVGTExFZEJRVWNzVTBGQlVpeExRVUZMTEVOQlFVa3NRMEZCUXl4RlFVRkxPMEZCUTJRc1UwRkJUeXhEUVVGRExFdEJRVXNzUTBGQlJTeG5RMEZCWjBNc1JVRkJSU3hYUVVGVkxFTkJRVU1zUTBGQlF5eERRVUZETEV0QlFVc3NSVUZCUlN4RFFVRkRMRU5CUVVVc1EwRkJRenRCUVVONlJTeE5RVUZITEdGQlFXRXNSVUZCUXp0QlFVRkZMR2RDUVVGaExFTkJRVU1zZDBKQlFYZENMRVZCUVVVc1YwRkJWU3hEUVVGRExFTkJRVU1zUTBGQlF5eExRVUZMTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1IwRkJSU3hEUVVGRE8wVkJRM0pHTEVOQlFVTTdPMEZCUlVnc1VVRkJUeXhEUVVGQkxGbEJRVTA3UVVGRFdpeE5RVUZKTEVkQlFVY3NSMEZCUnl4WlFURkRTaXhQUVVGUExFTkJNRU5MTEVkQlFVY3NRMEZCUlN4WFFVRlZMRU5CUVVNc1EwRkJReXhEUVVGRkxFTkJRVU03UVVGRGRFTXNVMEZCVHp0QlFVTk9MRTlCUVVrc1JVRkJReXhuUWtGQlJ6dEJRVU5RTEdsQ1FVRmhMRWRCUVVrc1UwRkJVeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzBGQlF6bENMRTlCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zVTBGQlV5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRk5CUVUwc1EwRkJSU3hMUVVGTExFTkJRVVVzUTBGQlF6dEpRVU4wUXp0SFFVTkVMRU5CUVVNN1JVRkRSaXhEUVVGQkxFTkJRVU1zVTBGQlV5eERRVUZETEVOQlFVTTdRMEZEWWpzN096czdPenM3T3p0QlFWZEVMRTFCUVUwc1EwRkJReXhqUVVGakxFTkJRVVVzWVVGQllTeEZRVUZGTEV0QlFVc3NSVUZCUlN4RlFVRkZMRWRCUVVjc1JVRkJSeXhsUVVGWE8wRkJRVVVzVTBGQlR5eEhRVUZITEVOQlFVTTdSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJRenRCUVVOdVJpeE5RVUZOTEVOQlFVTXNZMEZCWXl4RFFVRkZMR0ZCUVdFc1JVRkJSU3hUUVVGVExFVkJRVVVzUlVGQlJTeEhRVUZITEVWQlFVY3NaVUZCVnp0QlFVRkZMSEZDUVRsRU9VUXNUMEZCVHl4RFFUaEVjMFU3UlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXp0QlFVTXpSaXhOUVVGTkxFTkJRVU1zWTBGQll5eERRVUZGTEdGQlFXRXNSVUZCUlN4VlFVRlZMRVZCUVVVc1JVRkJSU3hIUVVGSExFVkJRVWNzWlVGQlZ6dEJRVUZGTEZOQlFVOHNVVUZCVVN4RFFVRkRPMFZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU03T3p0eFFrRkhPVVVzWVVGQllTSXNJbVpwYkdVaU9pSXZWWE5sY25NdmRHRnNkMjl2YkdZdlpHVjJaV3h2Y0dWeUwzZGxZbEp2YjNRdmRISmhibk5wZEdsdmJpMXRZVzVoWjJWeUwzTnlZeTlqYjIxdGIyNHZjSEp2YldselpVWmhZMkZrWlM1cWN5SXNJbk52ZFhKalpYTkRiMjUwWlc1MElqcGJJbHh1YVcxd2IzSjBJSHRRY205dGFYTmxmU0JtY205dElDZGxjell0Y0hKdmJXbHpaU2M3WEc1Y2JpOHFLbHh1SUNvZ1VISnZiV2x6WlNCbVlXTmhaQ0J2WW1wbFkzUmNiaUFxSUdOeVpXRjBaWE1nWVNCbVlXTmhaQ0JtYjNJZ1lYQndiR2xqWVhScGIyNGdjSEp2YldselpYTXNJRnh1SUNvZ1pHVjBZWFJqYUdWeklHWmxiMjBnZEdobElHeHBZbkpoY25rZ1ltVnBibWNnZFhObFpDQjBieUJ6WlhKMlpTQndjbTl0YVhObGN5QjBieUIwYUdVZ1lYQndYRzRnS2lCQWRIbHdaU0I3VDJKcVpXTjBmVnh1SUNvdlhHNXNaWFFnVUhKdmJXbHpaVVpoWTJGa1pTQTlJSHQ5TzF4dVhHNWNiaThxS2x4dUlDb2dSR1ZtWm1WeUlIUm9aU0J3Y205dGFYTmxJRnh1SUNvZ1FISmxkSFZ5YmlCN2IySnFaV04wZlNCN0lISmxjMjlzZG1VZ09pQm1kVzVqZEdsdmJpd2djbVZxWldOMElEb2dablZ1WTNScGIyNGdmVnh1SUNvdlhHNWxlSEJ2Y25RZ1puVnVZM1JwYjI0Z1JHVm1aWEp5WldRb0tWeHVlMXh1WEhSc1pYUWdjbVZ6ZFd4MElEMGdlMzA3WEc1Y2RISmxjM1ZzZEM1d2NtOXRhWE5sSUQwZ2JtVjNJRkJ5YjIxcGMyVW9LQ0J5WlhOdmJIWmxMQ0J5WldwbFkzUWdLU0E5UGx4dVhIUjdYRzVjZEZ4MGNtVnpkV3gwTG5KbGMyOXNkbVVnUFNCeVpYTnZiSFpsTzF4dVhIUmNkSEpsYzNWc2RDNXlaV3BsWTNRZ0lEMGdjbVZxWldOME8xeHVYSFI5S1R0Y2JseDBjbVYwZFhKdUlISmxjM1ZzZER0Y2JuMWNibHh1THlvcVhHNGdLaUJqY21WaGRHVWdZU0JtWVdOaFpDQm1iM0lnWlhNMkxYQnliMjFwYzJVZ1lXeHNYRzRnS2lCdmRuSnlhV1JrWlc0Z1ptRmpZV1FnZEc4Z1pHbHpjR3hoZVNCbGNuSnZjaUJzYjJkeklHWnZjaUJrWlhabGJHOXdiV1Z1ZENCY2JpQXFJR1IxWlNCMGJ5Qmxjell0Y0hKdmJXbHpaU0JsY25KdmNpQnpkWEJ3Y21WemMybHZiaUJwYzNOMVpWeHVJQ29nUUhCaGNtRnRJQ0I3WVhKeVlYbDlJQ0FnY0hKdmJXbHpaWE1nWEc0Z0tpQkFjbVYwZFhKdUlIdG1kVzVqZEdsdmJuMGdYRzRnS2k5Y2JtVjRjRzl5ZENCbWRXNWpkR2x2YmlCaGJHd29LU0I3WEc1Y2JseDBiR1YwSUdWNGRHVnlibUZzUlhKeWIzSXNYRzVjZEZ4MFpYSnliM0lnUFNBb1pTa2dQVDRnZXlCY2JseDBYSFJjZEdOdmJuTnZiR1V1WlhKeWIzSW9JQ2NnTFMwdElGQlNUMDFKVTBVZ1EwRlZSMGhVSUVWU1VrOVNJQzB0TFNBbkxDQmhjbWQxYldWdWRITmJNRjB1YzNSaFkyc3NJR1VnS1RzZ1hHNWNkRngwWEhScFppaGxlSFJsY201aGJFVnljbTl5S1hzZ1pYaDBaWEp1WVd4RmNuSnZjaWduWlhNMkxYQnliMjFwYzJVZ1lXeHNJR1Z5Y205eUlDY3NJR0Z5WjNWdFpXNTBjMXN3WFM1emRHRmpheXdnWlNrN0lIMDdYRzVjZEZ4MGZUdGNibHgwWEhSY2JseDBjbVYwZFhKdUlDZ3BJRDArSUh0Y2JseDBYSFJzWlhRZ1lXeHNJRDBnVUhKdmJXbHpaUzVoYkd3b0lHRnlaM1Z0Wlc1MGMxc3dYU0FwTzF4dVhIUmNkSEpsZEhWeWJpQjdYRzVjZEZ4MFhIUjBhR1Z1SUNncElIdGNibHgwWEhSY2RGeDBaWGgwWlhKdVlXeEZjbkp2Y2lBOUlDQmhjbWQxYldWdWRITmJNVjA3WEc1Y2RGeDBYSFJjZEdGc2JDNTBhR1Z1S0dGeVozVnRaVzUwYzFzd1hTa3VZMkYwWTJnb0lHVnljbTl5SUNrN1hHNWNkRngwWEhSOVhHNWNkRngwZlR0Y2JseDBmU2hoY21kMWJXVnVkSE1wTzF4dWZWeHVYRzVjYmk4cUtseHVJQ29nY21WMGRYSnVJRzlpYW1WamRDQm5aWFIwWlhKelhHNGdLaUJjYmlBcUlDMGdZV3hzSUMwZ1kyaGxZMnR6SUhSdklITmxaU0JwWmlCaGJHd2djSEp2YldselpYTWdhR0Z6SUdOdmJYQnNaWFJsWkNCaVpXWnZjbVVnWTI5dWRHbHVkV2x1WjF4dUlDb2dMU0JRY205dGFYTmxJQzBnY21WMGRYSnVjeUJoSUZCeWIyMXBjMlZjYmlBcUlDMGdSR1ZtWlhKeVpXUWdMU0J5WlhSMWNtNXpJR0Z1SUhWdUlISmxjMjlzZG1Wa0lIQnliMjFwYzJVZ1lXNWtJR0Z1SUc5aWFtVmpkQ0IzYVhSb0lIUm9aU0J5WlhOdmJIWmxJR0Z1WkNCeVpXcGxZM1FnWm5WdVkzUnBiMjV6WEc0Z0tpQkFjbVYwZFhKdUlIdG1kVzVqZEdsdmJuMGdJQ0JiWkdWelkzSnBjSFJwYjI1ZFhHNGdLaTljYms5aWFtVmpkQzVrWldacGJtVlFjbTl3WlhKMGVTZ2dVSEp2YldselpVWmhZMkZrWlN3Z0oyRnNiQ2NzSUhzZ1oyVjBJRG9nWm5WdVkzUnBiMjRvS1NCN0lISmxkSFZ5YmlCaGJHdzdJSDBnZlNrN1hHNVBZbXBsWTNRdVpHVm1hVzVsVUhKdmNHVnlkSGtvSUZCeWIyMXBjMlZHWVdOaFpHVXNJQ2RRY205dGFYTmxKeXdnZXlCblpYUWdPaUJtZFc1amRHbHZiaWdwSUhzZ2NtVjBkWEp1SUZCeWIyMXBjMlU3SUgwZ2ZTazdYRzVQWW1wbFkzUXVaR1ZtYVc1bFVISnZjR1Z5ZEhrb0lGQnliMjFwYzJWR1lXTmhaR1VzSUNkRVpXWmxjbkpsWkNjc0lIc2daMlYwSURvZ1puVnVZM1JwYjI0b0tTQjdJSEpsZEhWeWJpQkVaV1psY25KbFpEc2dmU0I5S1R0Y2JseHVMeW9nWlhod2IzSjBJR1JsWm1GMWJIUnpJQ292WEc1bGVIQnZjblFnWkdWbVlYVnNkQ0JRY205dGFYTmxSbUZqWVdSbE8xeHVJbDE5IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX3V0aWxzTWl4aW4gPSByZXF1aXJlKCcuLi91dGlscy9taXhpbicpO1xuXG52YXIgX3V0aWxzTWl4aW4yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXRpbHNNaXhpbik7XG5cbnZhciBfY29tbW9uTG9nZ2VyID0gcmVxdWlyZSgnLi4vY29tbW9uL0xvZ2dlcicpO1xuXG52YXIgX2NvbW1vbkxvZ2dlcjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9jb21tb25Mb2dnZXIpO1xuXG52YXIgZGVmYXVsdFZpZXdNYW5hZ2VyID0gX3V0aWxzTWl4aW4yWydkZWZhdWx0J10oeyBuYW1lOiAnRGVmYXVsdFZpZXdNYW5hZ2VyJyB9LCBfY29tbW9uTG9nZ2VyMlsnZGVmYXVsdCddKTtcblxuLyogdmlld3MgKi9cbnZhciB2aWV3cyA9IHt9O1xuXG4vKipcbiAqIGluaXRpYWxpemUgdGhlIGRlZmF1bHQgdmlldyBtYW5hZ2VyXG4gKiBVc2VkIGlmIGEgdmlldyBtYW5hZ2VyIGhhcyBub3QgYmVlbiBzZXRcbiAqIEBwYXJhbSAge29iamVjdH0gb3B0aW9uc1xuICovXG5kZWZhdWx0Vmlld01hbmFnZXIuaW5pdCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gIHZpZXdzID0gb3B0aW9ucy52aWV3cztcbiAgZGVmYXVsdFZpZXdNYW5hZ2VyLmluaXRMb2dnZXIob3B0aW9ucy5kZWJ1Zyk7XG5cbiAgZGVmYXVsdFZpZXdNYW5hZ2VyLmxvZygnaW5pdGlhdGVkJyk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBmZXRjaCB2aWV3XG4gKiBAcGFyYW0gIHtzdHJpbmd9IHZpZXdSZWYgXG4gKiBAcmV0dXJuIHtvYmplY3R9IHJlcXVlc3RlZCB2aWV3XG4gKi9cbmRlZmF1bHRWaWV3TWFuYWdlci5mZXRjaFZpZXcgPSBmdW5jdGlvbiAodmlld1JlZikge1xuICBpZiAodmlld3Nbdmlld1JlZl0pIHtcbiAgICByZXR1cm4gdmlld3Nbdmlld1JlZl07XG4gIH1cbn07XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IGRlZmF1bHRWaWV3TWFuYWdlcjtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYklpOVZjMlZ5Y3k5MFlXeDNiMjlzWmk5a1pYWmxiRzl3WlhJdmQyVmlVbTl2ZEM5MGNtRnVjMmwwYVc5dUxXMWhibUZuWlhJdmMzSmpMMk52Y21VdlpHVm1ZWFZzZEZacFpYZE5ZVzVoWjJWeUxtcHpJbDBzSW01aGJXVnpJanBiWFN3aWJXRndjR2x1WjNNaU9pSTdPenM3T3pzN096QkNRVU50UWl4blFrRkJaMEk3T3pzN05FSkJRMllzYTBKQlFXdENPenM3TzBGQlIzUkRMRWxCUVUwc2EwSkJRV3RDTEVkQlFVY3NkMEpCUVU4c1JVRkJSU3hKUVVGSkxFVkJRVWNzYjBKQlFXOUNMRVZCUVVVc05FSkJRVlVzUTBGQlF6czdPMEZCU1RWRkxFbEJRVWtzUzBGQlN5eEhRVUZITEVWQlFVVXNRMEZCUXpzN096czdPenRCUVU5bUxHdENRVUZyUWl4RFFVRkRMRWxCUVVrc1IwRkJSeXhWUVVGVkxFOUJRVThzUlVGRE0wTTdRVUZEUXl4UFFVRkxMRWRCUVVjc1QwRkJUeXhEUVVGRExFdEJRVXNzUTBGQlF6dEJRVU4wUWl4dlFrRkJhMElzUTBGQlF5eFZRVUZWTEVOQlFVVXNUMEZCVHl4RFFVRkRMRXRCUVVzc1EwRkJSU3hEUVVGRE96dEJRVVV2UXl4dlFrRkJhMElzUTBGQlF5eEhRVUZITEVOQlFVTXNWMEZCVnl4RFFVRkRMRU5CUVVNN1FVRkRjRU1zVTBGQlR5eEpRVUZKTEVOQlFVTTdRMEZEV2l4RFFVRkRPenM3T3pzN08wRkJUMFlzYTBKQlFXdENMRU5CUVVNc1UwRkJVeXhIUVVGSExGVkJRVlVzVDBGQlR5eEZRVU5vUkR0QlFVTkRMRTFCUVVrc1MwRkJTeXhEUVVGRkxFOUJRVThzUTBGQlJTeEZRVUZITzBGQlEzUkNMRmRCUVU4c1MwRkJTeXhEUVVGRkxFOUJRVThzUTBGQlJTeERRVUZETzBkQlEzaENPME5CUTBRc1EwRkJRenM3Y1VKQlIyRXNhMEpCUVd0Q0lpd2labWxzWlNJNklpOVZjMlZ5Y3k5MFlXeDNiMjlzWmk5a1pYWmxiRzl3WlhJdmQyVmlVbTl2ZEM5MGNtRnVjMmwwYVc5dUxXMWhibUZuWlhJdmMzSmpMMk52Y21VdlpHVm1ZWFZzZEZacFpYZE5ZVzVoWjJWeUxtcHpJaXdpYzI5MWNtTmxjME52Ym5SbGJuUWlPbHNpWEc1cGJYQnZjblFnYldsNGFXNGdYSFJtY205dElDY3VMaTkxZEdsc2N5OXRhWGhwYmljN1hHNXBiWEJ2Y25RZ1RHOW5aMlZ5SUZ4MFpuSnZiU0FuTGk0dlkyOXRiVzl1TDB4dloyZGxjaWM3WEc1Y2JseHVZMjl1YzNRZ1pHVm1ZWFZzZEZacFpYZE5ZVzVoWjJWeUlEMGdiV2w0YVc0b0lIc2dibUZ0WlNBNklDZEVaV1poZFd4MFZtbGxkMDFoYm1GblpYSW5JSDBzSUV4dloyZGxjaUFwTzF4dVhHNWNiaThxSUhacFpYZHpJQ292WEc1c1pYUWdkbWxsZDNNZ1BTQjdmVHRjYmx4dUx5b3FYRzRnS2lCcGJtbDBhV0ZzYVhwbElIUm9aU0JrWldaaGRXeDBJSFpwWlhjZ2JXRnVZV2RsY2x4dUlDb2dWWE5sWkNCcFppQmhJSFpwWlhjZ2JXRnVZV2RsY2lCb1lYTWdibTkwSUdKbFpXNGdjMlYwWEc0Z0tpQkFjR0Z5WVcwZ0lIdHZZbXBsWTNSOUlHOXdkR2x2Ym5OY2JpQXFMMXh1WkdWbVlYVnNkRlpwWlhkTllXNWhaMlZ5TG1sdWFYUWdQU0JtZFc1amRHbHZiaWdnYjNCMGFXOXVjeUFwWEc1N1hHNWNkSFpwWlhkeklEMGdiM0IwYVc5dWN5NTJhV1YzY3p0Y2JseDBaR1ZtWVhWc2RGWnBaWGROWVc1aFoyVnlMbWx1YVhSTWIyZG5aWElvSUc5d2RHbHZibk11WkdWaWRXY2dLVHRjYmx4dVhIUmtaV1poZFd4MFZtbGxkMDFoYm1GblpYSXViRzluS0NkcGJtbDBhV0YwWldRbktUdGNibHgwY21WMGRYSnVJSFJvYVhNN1hHNTlPMXh1WEc0dktpcGNiaUFxSUdabGRHTm9JSFpwWlhkY2JpQXFJRUJ3WVhKaGJTQWdlM04wY21sdVozMGdkbWxsZDFKbFppQmNiaUFxSUVCeVpYUjFjbTRnZTI5aWFtVmpkSDBnY21WeGRXVnpkR1ZrSUhacFpYZGNiaUFxTDF4dVpHVm1ZWFZzZEZacFpYZE5ZVzVoWjJWeUxtWmxkR05vVm1sbGR5QTlJR1oxYm1OMGFXOXVLQ0IyYVdWM1VtVm1JQ2xjYm50Y2JseDBhV1lvSUhacFpYZHpXeUIyYVdWM1VtVm1JRjBnS1NCN1hHNWNkRngwY21WMGRYSnVJSFpwWlhkeld5QjJhV1YzVW1WbUlGMDdYRzVjZEgxY2JuMDdYRzVjYmx4dVpYaHdiM0owSUdSbFptRjFiSFFnWkdWbVlYVnNkRlpwWlhkTllXNWhaMlZ5T3lKZGZRPT0iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHtcblx0dmFsdWU6IHRydWVcbn0pO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfY29tbW9uTG9nZ2VySnMgPSByZXF1aXJlKCcuLi9jb21tb24vbG9nZ2VyLmpzJyk7XG5cbnZhciBfY29tbW9uTG9nZ2VySnMyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfY29tbW9uTG9nZ2VySnMpO1xuXG52YXIgX2NvbW1vbkRpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi9jb21tb24vZGlzcGF0Y2hlcicpO1xuXG52YXIgX3V0aWxzRGVmYXVsdCA9IHJlcXVpcmUoJy4uL3V0aWxzL2RlZmF1bHQnKTtcblxudmFyIF91dGlsc0RlZmF1bHQyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXRpbHNEZWZhdWx0KTtcblxudmFyIF91dGlsc01peGluID0gcmVxdWlyZSgnLi4vdXRpbHMvbWl4aW4nKTtcblxudmFyIF91dGlsc01peGluMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3V0aWxzTWl4aW4pO1xuXG4vKiBjcmVhdGUgY2xhc3MgYW5kIGV4dGVuZCBsb2dnZXIgKi9cbnZhciBGU00gPSBfdXRpbHNNaXhpbjJbJ2RlZmF1bHQnXSh7IG5hbWU6ICdTdGF0ZU1hY2hpbmUnIH0sIF9jb21tb25Mb2dnZXJKczJbJ2RlZmF1bHQnXSk7XG5cbihmdW5jdGlvbiAoKSB7XG5cdHZhciBfc3RhdGVzID0ge30sXG5cdCAgICBfY3VycmVudFN0YXRlID0gbnVsbCxcblx0ICAgIF9pbml0aWFsID0gbnVsbCxcblx0ICAgIF9hY3Rpb25RdWV1ZSA9IFtdLFxuXHQgICAgX2hpc3RvcnkgPSBbXSxcblx0ICAgIF9jYW5jZWxsZWQgPSBmYWxzZSxcblx0ICAgIF90cmFuc2l0aW9uQ29tcGxldGVkID0gdHJ1ZSxcblx0ICAgIF9zdGF0ZUNoYW5nZWRIYW5kbGVyID0gbnVsbCxcblx0ICAgIF9vcHRpb25zID0ge1xuXHRcdGhpc3Rvcnk6IGZhbHNlLFxuXHRcdGxpbWl0cTogdHJ1ZSxcblx0XHRxdHJhbnNpdGlvbnM6IHRydWUsXG5cdFx0ZGVidWc6IGZhbHNlXG5cdH07XG5cblx0LyoqXG4gICogY2hlY2sgdG8gc2UgaWYgdGggYW5pbWF0aW9uIGhhcyBjYW5jZWxsZWQgaW4gXG4gICogYmV0d2VlbiBzdGF0ZSB0cmFuc2l0aW9uc1xuICAqIEByZXR1cm4ge0Jvb2xlYW59IGNhbmNlbGxlZFxuICovXG5cdGZ1bmN0aW9uIGlzQ2FuY2VsbGVkKCkge1xuXHRcdGlmIChfY2FuY2VsbGVkKSB7XG5cdFx0XHRfdHJhbnNpdGlvbkNvbXBsZXRlZCA9IHRydWU7XG5cdFx0XHRfY2FuY2VsbGVkID0gZmFsc2U7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0LyoqXG4gICogdHJhbnNpdGlvbiB0byB0aGUgbmV4dCBzdGF0ZVxuICAqIEBwYXJhbSAge29iamVjdH0gbmV4dFN0YXRlICAgICAgICBuZXcgc3RhdGUgb2JqZWN0XG4gICogQHBhcmFtICB7c3RyaW5nfSBhY3Rpb24gICAgICAgICAgIGFjdGlvbklEIFxuICAqIEBwYXJhbSAge29iamVjdH0gZGF0YSAgICAgICAgICAgICBkYXRhIHNlbnQgd2l0aCB0aGUgYWN0aW9uXG4gICogQHBhcmFtICB7c3RyaW5nfSBhY3Rpb25JZGVudGlmaWVyIHN0YXRlIGFuZCBhY3Rpb24gY29tYmluZWQgdG8gbWFrZSBhIHVuaXF1ZSBzdHJpbmdcbiAqL1xuXG5cdGZ1bmN0aW9uIF90cmFuc2l0aW9uVG8obmV4dFN0YXRlLCBhY3Rpb24sIGRhdGEpIHtcblx0XHRfY2FuY2VsbGVkID0gZmFsc2U7XG5cdFx0X3RyYW5zaXRpb25Db21wbGV0ZWQgPSBmYWxzZTtcblxuXHRcdGlmIChpc0NhbmNlbGxlZCgpKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0aWYgKF9jdXJyZW50U3RhdGUpIHtcblx0XHRcdHZhciBwcmV2aW91c1N0YXRlID0gX2N1cnJlbnRTdGF0ZTtcblx0XHRcdGlmIChfb3B0aW9ucy5oaXN0b3J5KSB7XG5cdFx0XHRcdF9oaXN0b3J5LnB1c2gocHJldmlvdXNTdGF0ZS5uYW1lKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRfY3VycmVudFN0YXRlID0gbmV4dFN0YXRlO1xuXG5cdFx0aWYgKGFjdGlvbikge1xuXHRcdFx0X3N0YXRlQ2hhbmdlZEhhbmRsZXIoYWN0aW9uLCBkYXRhKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0X3RyYW5zaXRpb25Db21wbGV0ZWQgPSB0cnVlO1xuXHRcdFx0RlNNLmxvZygnU3RhdGUgdHJhbnNpdGlvbiBDb21wbGV0ZWQhIEN1cnJlbnQgU3RhdGUgOjogJyArIF9jdXJyZW50U3RhdGUubmFtZSk7XG5cdFx0XHRfY29tbW9uRGlzcGF0Y2hlci5zdGF0ZUNoYW5nZWQuZGlzcGF0Y2goX2N1cnJlbnRTdGF0ZSk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG4gICogSWYgc3RhdGVzIGhhdmUgcXVldWVkIHVwXG4gICogbG9vcCB0aHJvdWdoIGFuZCBhY3Rpb24gYWxsIHN0YXRlcyBpbiB0aGUgcXVldWUgdW50aWxcbiAgKiBub25lIHJlbWFpblxuICAqL1xuXHRmdW5jdGlvbiBfcHJvY2Vzc0FjdGlvblF1ZXVlKCkge1xuXHRcdGlmIChfYWN0aW9uUXVldWUubGVuZ3RoID4gMCkge1xuXHRcdFx0dmFyIHN0YXRlRXZlbnQgPSBfYWN0aW9uUXVldWUuc2hpZnQoKTtcblxuXHRcdFx0aWYgKCFfY3VycmVudFN0YXRlLmdldFRhcmdldChzdGF0ZUV2ZW50LmFjdGlvbikpIHtcblx0XHRcdFx0X3Byb2Nlc3NBY3Rpb25RdWV1ZSgpO1xuXHRcdFx0fSBlbHNlIHt9RlNNLmFjdGlvbihzdGF0ZUV2ZW50LmFjdGlvbiwgc3RhdGVFdmVudC5kYXRhKTtcblxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdEZTTS5sb2coJ1N0YXRlIHRyYW5zaXRpb24gQ29tcGxldGVkISBDdXJyZW50IFN0YXRlIDo6ICcgKyBfY3VycmVudFN0YXRlLm5hbWUpO1xuXHRcdF9jb21tb25EaXNwYXRjaGVyLnN0YXRlQ2hhbmdlZC5kaXNwYXRjaChfY3VycmVudFN0YXRlKTtcblx0fVxuXG5cdC8qKlxuICAqIHN0YXJ0IEZTTSBcbiAgKiBzZXQgdGhlIGluaXRpYWwgc3RhdGVcbiAgKi9cblx0RlNNLnN0YXJ0ID0gZnVuY3Rpb24gKCkge1xuXHRcdGlmICghX2luaXRpYWwpIHtcblx0XHRcdHJldHVybiBGU00ubG9nKCdFUlJPUiAtIEZTTSBtdXN0IGhhdmUgYW4gaW5pdGlhbCBzdGF0ZSBzZXQnKTtcblx0XHR9XG5cdFx0X3RyYW5zaXRpb25UbyhfaW5pdGlhbCwgbnVsbCk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG4gICogcmV0dXJuIHRoZSBhY3Rpb24gaGlzdG9yeVxuICAqIEByZXR1cm4ge2FyYXl9IFxuICAqL1xuXHRGU00uZ2V0SGlzdG9yeSA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gX2hpc3Rvcnk7XG5cdH07XG5cblx0LyoqXG4gICogRE8gQUNUSU9OXG4gICogZG8gYWN0aW9uIGFuZCBjaGFuZ2UgdGhlIGN1cnJlbnQgc3RhdGUgaWZcbiAgKiB0aGUgYWN0aW9uIGlzIGF2YWlsYWJsZSBhbmQgYWxsb3dlZFxuICAqIEBwYXJhbSAge3N0cmluZ30gYWN0aW9uIHRvIGNhcnJ5IG91dFxuICAqIEBwYXJhbSAge29iamVjdH0gZGF0YSB0byBzZW5kIHdpdGggdGhlIHN0YXRlXG4gICovXG5cdEZTTS5hY3Rpb24gPSBmdW5jdGlvbiAoYWN0aW9uLCBkYXRhKSB7XG5cdFx0aWYgKCFfY3VycmVudFN0YXRlKSB7XG5cdFx0XHRyZXR1cm4gRlNNLmxvZygnRVJST1IgOiBZb3UgbWF5IG5lZWQgdG8gc3RhcnQgdGhlIGZzbSBmaXJzdCcpO1xuXHRcdH1cblxuXHRcdC8qIGlmIHRyYW5zaXRpb25pbmcsIHF1ZXVlIHVwIG5leHQgYWN0aW9uICovXG5cdFx0aWYgKCFfdHJhbnNpdGlvbkNvbXBsZXRlZCAmJiBfb3B0aW9ucy5xdHJhbnNpdGlvbnMpIHtcblx0XHRcdEZTTS5sb2coJ3RyYW5zaXRpb24gaW4gcHJvZ3Jlc3MsIGFkZGluZyBhY3Rpb24gKicgKyBhY3Rpb24gKyAnIHRvIHF1ZXVlJyk7XG5cblx0XHRcdC8qIHN0b3JlIHRoZSBhY3Rpb24gZGF0YSAqL1xuXHRcdFx0dmFyIGFjdGlvblN0b3JlID0geyBhY3Rpb246IGFjdGlvbiwgZGF0YTogZGF0YSB9O1xuXG5cdFx0XHRpZiAoX29wdGlvbnMubGltaXRxKSB7XG5cdFx0XHRcdF9hY3Rpb25RdWV1ZVswXSA9IGFjdGlvblN0b3JlO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0X2FjdGlvblF1ZXVlW19hY3Rpb25RdWV1ZS5sZW5ndGhdID0gYWN0aW9uU3RvcmU7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0dmFyIHRhcmdldCA9IF9jdXJyZW50U3RhdGUuZ2V0VGFyZ2V0KGFjdGlvbiksXG5cdFx0ICAgIG5ld1N0YXRlID0gX3N0YXRlc1t0YXJnZXRdLFxuXHRcdCAgICBfYWN0aW9uSWQgPSBfY3VycmVudFN0YXRlLmlkKGFjdGlvbik7XG5cblx0XHQvKiBpZiBhIG5ldyB0YXJnZXQgY2FuIGJlIGZvdW5kLCBjaGFuZ2UgdGhlIGN1cnJlbnQgc3RhdGUgKi9cblx0XHRpZiAobmV3U3RhdGUpIHtcblx0XHRcdEZTTS5sb2coJ0NoYW5naW5nIHN0YXRlIDo6ICcgKyBfY3VycmVudFN0YXRlLm5hbWUgKyAnID4+PiAnICsgbmV3U3RhdGUubmFtZSk7XG5cdFx0XHRfdHJhbnNpdGlvblRvKG5ld1N0YXRlLCBfYWN0aW9uSWQsIGRhdGEpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRGU00uZXJyb3IoJ1N0YXRlIG5hbWUgOjo6ICcgKyBfY3VycmVudFN0YXRlLm5hbWUgKyAnIE9SIEFjdGlvbjogJyArIGFjdGlvbiArICcgaXMgbm90IGF2YWlsYWJsZScpO1xuXHRcdH1cblx0fTtcblxuXHQvKipcbiAgKiBjYW5jZWwgdGhlIGN1cnJlbnQgdHJhbnNpdGlvblxuICAqL1xuXHRGU00uY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuXHRcdF9jYW5jZWxsZWQgPSB0cnVlO1xuXHR9O1xuXG5cdC8qKlxuICAqIHRyYW5zaXRpb24gY29tcGxldGVkXG4gICogY2FsbGVkIGV4dGVybmFsbHkgb25jZSBhbGwgcHJvY2Vzc2VzIGhhdmUgY29tcGxldGVkXG4gICovXG5cdEZTTS50cmFuc2l0aW9uQ29tcGxldGUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0X3RyYW5zaXRpb25Db21wbGV0ZWQgPSB0cnVlO1xuXHRcdF9wcm9jZXNzQWN0aW9uUXVldWUoKTtcblx0fTtcblxuXHQvKipcbiAgKiBhZGQgYSBuZXcgc3RhdGUgdG8gdGhlIEZTTVxuICAqIEBwYXJhbSB7b2JqZWN0fSAgc3RhdGUgLSBGU00gU1RBVEVcbiAgKiBAcGFyYW0ge0Jvb2xlYW59IGlzSW5pdGlhbFxuICAqL1xuXHRGU00uYWRkU3RhdGUgPSBmdW5jdGlvbiAoc3RhdGUsIGlzSW5pdGlhbCkge1xuXG5cdFx0aWYgKCFfc3RhdGVzIHx8IF9zdGF0ZXNbc3RhdGUubmFtZV0pIHtcblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH1cblxuXHRcdF9zdGF0ZXNbc3RhdGUubmFtZV0gPSBzdGF0ZTtcblx0XHRpZiAoaXNJbml0aWFsKSB7XG5cdFx0XHRfaW5pdGlhbCA9IHN0YXRlO1xuXHRcdH1cblx0XHRyZXR1cm4gc3RhdGU7XG5cdH07XG5cblx0LyoqXG4gICogaW5pdGlhbGlzZSAtIHBhc3MgaW4gc2V0dXAgb3B0aW9uc1xuICAqIEBwYXJhbSAge29iamVjdH0gb3B0aW9ucyBcbiAgKi9cblx0RlNNLmluaXQgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuXHRcdF91dGlsc0RlZmF1bHQyWydkZWZhdWx0J10oX29wdGlvbnMsIG9wdGlvbnMpO1xuXHRcdEZTTS5pbml0TG9nZ2VyKF9vcHRpb25zLmRlYnVnKTtcblx0XHRGU00ubG9nKCdpbml0aWF0ZWQnKTtcblx0fTtcblxuXHQvKipcbiAgKiBjcmVhdGUgc3RhdGVzIGFuZCB0cmFuc2l0aW9ucyBiYXNlZCBvbiBjb25maWcgZGF0YSBwYXNzZWQgaW5cbiAgKiBpZiBzdGF0ZXMgYXJlIGFuIGFycmF5LCBsb29wIGFuZCBhc3NpZ24gZGF0YVxuICAqIHRvIG5ldyBzdGF0ZSBvYmplY3RzXG4gICogQHBhcmFtICB7YXJyYXkvb2JqZWN0fSBjb25maWcgLSBbeyBuYW1lLCB0cmFuc2l0aW9ucywgaW5pdGlhbCB9XVxuICAqL1xuXHRGU00uY3JlYXRlID0gZnVuY3Rpb24gKGNvbmZpZykge1xuXHRcdHZhciBfdGhpcyA9IHRoaXM7XG5cblx0XHRpZiAoY29uZmlnIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0XHRcdGNvbmZpZy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG5cdFx0XHRcdF90aGlzLmNyZWF0ZShpdGVtKTtcblx0XHRcdH0sIHRoaXMpO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHRcdHZhciBpbml0aWFsID0gX3N0YXRlcy5sZW5ndGggPT09IDAgfHwgY29uZmlnLmluaXRpYWwsXG5cdFx0ICAgIHN0YXRlID0gbmV3IEZTTS5TdGF0ZShjb25maWcubmFtZSwgaW5pdGlhbCksXG5cdFx0ICAgIHN0YXRlVHJhbnNpdGlvbnMgPSBjb25maWcuc3RhdGVUcmFuc2l0aW9ucyB8fCBbXTtcblxuXHRcdHN0YXRlVHJhbnNpdGlvbnMuZm9yRWFjaChmdW5jdGlvbiAodHJhbnNpdGlvbikge1xuXHRcdFx0c3RhdGUuYWRkVHJhbnNpdGlvbih0cmFuc2l0aW9uLmFjdGlvbiwgdHJhbnNpdGlvbi50YXJnZXQsIHRyYW5zaXRpb24uX2lkKTtcblx0XHR9KTtcblxuXHRcdEZTTS5hZGRTdGF0ZShzdGF0ZSwgaW5pdGlhbCk7XG5cdH07XG5cblx0LyoqXG4gICogcmV0dXJuIHRoZSBjdXJyZW50IHN0YXRlXG4gICogQHJldHVybiB7b2JqZWN0fSBGU00gc3RhdGVcbiAgKi9cblx0RlNNLmdldEN1cnJlbnRTdGF0ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gX2N1cnJlbnRTdGF0ZTtcblx0fTtcblxuXHQvKipcbiAgKiBkaXNwb3NlIHRoZSBzdGF0ZSBtYWNoaW4gXG4gICovXG5cdEZTTS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuXHRcdF9zdGF0ZXMgPSBudWxsO1xuXHR9O1xuXG5cdC8qIHNldHMgYSBzdGF0ZXNDaGFuZ2VkIG1ldGhvZCBpbnN0ZWFkIG9mIHVzaW5nIGEgc2lnbmFsICovXG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShGU00sICdzdGF0ZUNoYW5nZWRNZXRob2QnLCB7IHNldDogZnVuY3Rpb24gc2V0KG1ldGhvZCkge1xuXHRcdFx0X3N0YXRlQ2hhbmdlZEhhbmRsZXIgPSBtZXRob2Q7XG5cdFx0fSB9KTtcblxuXHQvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqIFsgQ3JlYXRlIEZTTSBTdGF0ZV0gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdC8qKlxuICAqIEZTTSBzdGF0ZSBjbGFzc1xuICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHN0YXRlIG5hbWVcbiAgKi9cblx0RlNNLlN0YXRlID0gZnVuY3Rpb24gKG5hbWUsIGluaXRpYWwpIHtcblx0XHR0aGlzLl90cmFuc2l0aW9ucyA9IHt9OyAvLyBhdmFpbGFibGUgdHJhbnNpdGlvbnNcblx0XHR0aGlzLl9uYW1lID0gbmFtZTsgLy8gbmFtZSAgICAgICAgICAgICAgXHQgICAgICBcdFxuXHRcdHRoaXMuX2RhdGEgPSB7fTsgLy8gZGF0YSB0byBhc3Nvc2NpYXRlIHdpdGggdGhlIGFjdGlvblxuXHRcdHRoaXMuX2luaXRpYWwgPSBpbml0aWFsO1xuXHR9O1xuXG5cdEZTTS5TdGF0ZS5wcm90b3R5cGUgPSB7XG5cblx0XHRfZmV0Y2hUcmFuc2l0aW9uOiBmdW5jdGlvbiBfZmV0Y2hUcmFuc2l0aW9uKGFjdGlvbiwgbWV0aG9kKSB7XG5cdFx0XHRpZiAodGhpcy5fdHJhbnNpdGlvbnNbYWN0aW9uXSkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5fdHJhbnNpdGlvbnNbYWN0aW9uXVttZXRob2RdO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH0sXG5cblx0XHQvKipcbiAgICogYWRkIHRoZSBhdmFpbGFibGUgdHJhc2l0aW9ucyBmb3IgZWFjaCBzdGF0ZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gYWN0aW9uIGUuZy4nR09UT0hPTUUnXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YXJnZXQgZS5nLiAnSE9NRSdcbiAgICovXG5cdFx0YWRkVHJhbnNpdGlvbjogZnVuY3Rpb24gYWRkVHJhbnNpdGlvbihhY3Rpb24sIHRhcmdldCwgYWN0aW9uSWRuZW50aWZpZXIpIHtcblx0XHRcdGlmICh0aGlzLl90cmFuc2l0aW9uc1thY3Rpb25dKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHRcdHRoaXMuX3RyYW5zaXRpb25zW2FjdGlvbl0gPSB7IHRhcmdldDogdGFyZ2V0LCBfaWQ6IGFjdGlvbklkbmVudGlmaWVyIH07XG5cdFx0fSxcblxuXHRcdGdldEFjdGlvbklkOiBmdW5jdGlvbiBnZXRBY3Rpb25JZChhY3Rpb24pIHtcblx0XHRcdHJldHVybiB0aGlzLl9mZXRjaFRyYW5zaXRpb24oYWN0aW9uLCAnX2lkJyk7XG5cdFx0fSxcblx0XHRnZXRUYXJnZXQ6IGZ1bmN0aW9uIGdldFRhcmdldChhY3Rpb24pIHtcblx0XHRcdHJldHVybiB0aGlzLl9mZXRjaFRyYW5zaXRpb24oYWN0aW9uLCAndGFyZ2V0Jyk7XG5cdFx0fVxuXHR9O1xuXG5cdC8qKlxuICAqIGNyZWF0ZSBnZXR0ZXJzIGZvciB0aGUgc3RhdGUgXG4gICogIC0gbmFtZVxuICAqICAtIHRyYW5zaXRpb25zXG4gICogIC0gZGF0YVxuICAqL1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoRlNNLlN0YXRlLnByb3RvdHlwZSwgJ25hbWUnLCB7IGdldDogZnVuY3Rpb24gZ2V0KCkge1xuXHRcdFx0cmV0dXJuIHRoaXMuX25hbWU7XG5cdFx0fSB9KTtcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KEZTTS5TdGF0ZS5wcm90b3R5cGUsICd0cmFuc2l0aW9ucycsIHsgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fdHJhbnNpdGlvbnM7XG5cdFx0fSB9KTtcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KEZTTS5TdGF0ZS5wcm90b3R5cGUsICdkYXRhJywgeyBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcblx0XHRcdHJldHVybiB0aGlzLl9kYXRhO1xuXHRcdH0gfSk7XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShGU00uU3RhdGUucHJvdG90eXBlLCAnaW5pdGlhbCcsIHsgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5faW5pdGlhbDtcblx0XHR9IH0pO1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoRlNNLlN0YXRlLnByb3RvdHlwZSwgJ2lkJywgeyBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcblx0XHRcdHJldHVybiB0aGlzLmdldEFjdGlvbklkO1xuXHRcdH0gfSk7XG59KSgpO1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBGU007XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJaTlWYzJWeWN5OTBZV3gzYjI5c1ppOWtaWFpsYkc5d1pYSXZkMlZpVW05dmRDOTBjbUZ1YzJsMGFXOXVMVzFoYm1GblpYSXZjM0pqTDJOdmNtVXZabk50TG1weklsMHNJbTVoYldWeklqcGJYU3dpYldGd2NHbHVaM01pT2lJN096czdPenM3T3poQ1FVTnpRaXh4UWtGQmNVSTdPenM3WjBOQlEyWXNjMEpCUVhOQ096czBRa0ZEZGtJc2EwSkJRV3RDT3pzN096QkNRVU4yUWl4blFrRkJaMEk3T3pzN08wRkJSM1JETEVsQlFVMHNSMEZCUnl4SFFVRkhMSGRDUVVGTkxFVkJRVVVzU1VGQlNTeEZRVUZITEdOQlFXTXNSVUZCUlN3NFFrRkJWU3hEUVVGRE96dEJRVVYwUkN4RFFVRkRMRmxCUTBRN1FVRkRReXhMUVVGTExFOUJRVThzUjBGQlR5eEZRVUZGTzB0QlEyNUNMR0ZCUVdFc1IwRkJUU3hKUVVGSk8wdEJRM1pDTEZGQlFWRXNSMEZCVHl4SlFVRkpPMHRCUTI1Q0xGbEJRVmtzUjBGQlRTeEZRVUZGTzB0QlEzQkNMRkZCUVZFc1IwRkJUeXhGUVVGRk8wdEJRMnBDTEZWQlFWVXNSMEZCVHl4TFFVRkxPMHRCUTNSQ0xHOUNRVUZ2UWl4SFFVRkpMRWxCUVVrN1MwRkROVUlzYjBKQlFXOUNMRWRCUVUwc1NVRkJTVHRMUVVVNVFpeFJRVUZSTEVkQlFVYzdRVUZEVml4VFFVRlBMRVZCUVVzc1MwRkJTenRCUVVOcVFpeFJRVUZOTEVWQlFVOHNTVUZCU1R0QlFVTnFRaXhqUVVGWkxFVkJRVWNzU1VGQlNUdEJRVU51UWl4UFFVRkxMRVZCUVU4c1MwRkJTenRGUVVOcVFpeERRVUZET3pzN096czdPMEZCVVVvc1ZVRkJVeXhYUVVGWExFZEJRVWM3UVVGRGRFSXNUVUZCUnl4VlFVRlZMRVZCUVVVN1FVRkRaQ3gxUWtGQmIwSXNSMEZCUnl4SlFVRkpMRU5CUVVNN1FVRkROVUlzWVVGQlZTeEhRVUZQTEV0QlFVc3NRMEZCUXp0QlFVTjJRaXhWUVVGUExFbEJRVWtzUTBGQlF6dEhRVU5hTzBGQlEwUXNVMEZCVHl4TFFVRkxMRU5CUVVNN1JVRkRZanM3T3pzN096czdPenRCUVZkRUxGVkJRVk1zWVVGQllTeERRVUZGTEZOQlFWTXNSVUZCUlN4TlFVRk5MRVZCUVVVc1NVRkJTU3hGUVVNdlF6dEJRVU5ETEZsQlFWVXNSMEZCVHl4TFFVRkxMRU5CUVVNN1FVRkRka0lzYzBKQlFXOUNMRWRCUVVrc1MwRkJTeXhEUVVGRE96dEJRVVU1UWl4TlFVRkpMRmRCUVZjc1JVRkJSU3hGUVVGSE8wRkJRVVVzVlVGQlR5eExRVUZMTEVOQlFVTTdSMEZCUlRzN1FVRkZja01zVFVGQlNTeGhRVUZoTEVWQlFVYzdRVUZEYmtJc1QwRkJTU3hoUVVGaExFZEJRVWNzWVVGQllTeERRVUZETzBGQlEyeERMRTlCUVVjc1VVRkJVU3hEUVVGRExFOUJRVThzUlVGQlF6dEJRVUZGTEZsQlFWRXNRMEZCUXl4SlFVRkpMRU5CUVVNc1lVRkJZU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzBsQlFVVTdSMEZETVVRN08wRkJSVVFzWlVGQllTeEhRVUZITEZOQlFWTXNRMEZCUXpzN1FVRkZNVUlzVFVGQlNTeE5RVUZOTEVWQlFVYzdRVUZEV2l4MVFrRkJiMElzUTBGQlJTeE5RVUZOTEVWQlFVVXNTVUZCU1N4RFFVRkZMRU5CUVVNN1IwRkRja01zVFVGQlRUdEJRVU5PTEhWQ1FVRnZRaXhIUVVGSExFbEJRVWtzUTBGQlF6dEJRVU0xUWl4TlFVRkhMRU5CUVVNc1IwRkJSeXhEUVVGRExDdERRVUVyUXl4SFFVRkhMR0ZCUVdFc1EwRkJReXhKUVVGSkxFTkJRVVVzUTBGQlF6dEJRVU12UlN4eFFrRndSVXNzV1VGQldTeERRVzlGU2l4UlFVRlJMRU5CUVVNc1lVRkJZU3hEUVVGRExFTkJRVU03UjBGRGNrTTdSVUZEUkRzN096czdPenRCUVU5RUxGVkJRVk1zYlVKQlFXMUNMRWRCUXpWQ08wRkJRME1zVFVGQlNTeFpRVUZaTEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1JVRkJSenRCUVVNM1FpeFBRVUZKTEZWQlFWVXNSMEZCUnl4WlFVRlpMRU5CUVVNc1MwRkJTeXhGUVVGRkxFTkJRVU03TzBGQlJYUkRMRTlCUVVjc1EwRkJReXhoUVVGaExFTkJRVU1zVTBGQlV5eERRVUZETEZWQlFWVXNRMEZCUXl4TlFVRk5MRU5CUVVNc1JVRkJSVHRCUVVNdlF5eDFRa0ZCYlVJc1JVRkJSU3hEUVVGRE8wbEJRM1JDTEUxQlEwa3NSVUZEU2l4QlFVRkRMRWRCUVVjc1EwRkJReXhOUVVGTkxFTkJRVVVzVlVGQlZTeERRVUZETEUxQlFVMHNSVUZCUlN4VlFVRlZMRU5CUVVNc1NVRkJTU3hEUVVGRkxFTkJRVU03TzBGQlJXNUVMRlZCUVU4c1MwRkJTeXhEUVVGRE8wZEJRMkk3TzBGQlJVUXNTMEZCUnl4RFFVRkRMRWRCUVVjc1EwRkJReXdyUTBGQkswTXNSMEZCUnl4aFFVRmhMRU5CUVVNc1NVRkJTU3hEUVVGRkxFTkJRVU03UVVGREwwVXNiMEpCTlVaTkxGbEJRVmtzUTBFMFJrd3NVVUZCVVN4RFFVRkRMR0ZCUVdFc1EwRkJReXhEUVVGRE8wVkJRM0pET3pzN096czdRVUZOUkN4SlFVRkhMRU5CUVVNc1MwRkJTeXhIUVVGSExGbEJRMW83UVVGRFF5eE5RVUZITEVOQlFVTXNVVUZCVVN4RlFVRkZPMEZCUVVVc1ZVRkJUeXhIUVVGSExFTkJRVU1zUjBGQlJ5eERRVUZETERSRFFVRTBReXhEUVVGRExFTkJRVU03UjBGQlJUdEJRVU12UlN4bFFVRmhMRU5CUVVVc1VVRkJVU3hGUVVGRkxFbEJRVWtzUTBGQlJTeERRVUZETzBGQlEyaERMRk5CUVU4c1NVRkJTU3hEUVVGRE8wVkJRMW9zUTBGQlF6czdPenM3TzBGQlRVWXNTVUZCUnl4RFFVRkRMRlZCUVZVc1IwRkJSeXhaUVVGWE8wRkJRek5DTEZOQlFVOHNVVUZCVVN4RFFVRkRPMFZCUTJoQ0xFTkJRVUU3T3pzN096czdPenRCUVZORUxFbEJRVWNzUTBGQlF5eE5RVUZOTEVkQlFVY3NWVUZCVlN4TlFVRk5MRVZCUVVVc1NVRkJTU3hGUVVOdVF6dEJRVU5ETEUxQlFVa3NRMEZCUXl4aFFVRmhMRVZCUVVVN1FVRkJSU3hWUVVGUExFZEJRVWNzUTBGQlF5eEhRVUZITEVOQlFVVXNOa05CUVRaRExFTkJRVVVzUTBGQlF6dEhRVUZGT3pzN1FVRkhlRVlzVFVGQlJ5eERRVUZETEc5Q1FVRnZRaXhKUVVGSkxGRkJRVkVzUTBGQlF5eFpRVUZaTEVWQlFVVTdRVUZEYkVRc1RVRkJSeXhEUVVGRExFZEJRVWNzUTBGQlF5eDVRMEZCZVVNc1IwRkJReXhOUVVGTkxFZEJRVU1zVjBGQlZ5eERRVUZETEVOQlFVTTdPenRCUVVkMFJTeFBRVUZKTEZkQlFWY3NSMEZCUnl4RlFVRkZMRTFCUVUwc1JVRkJSeXhOUVVGTkxFVkJRVVVzU1VGQlNTeEZRVUZITEVsQlFVa3NSVUZCUlN4RFFVRkRPenRCUVVWdVJDeFBRVUZKTEZGQlFWRXNRMEZCUXl4TlFVRk5MRVZCUVVjN1FVRkRja0lzWjBKQlFWa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhYUVVGWExFTkJRVU03U1VGRE9VSXNUVUZEU1R0QlFVTktMR2RDUVVGWkxFTkJRVU1zV1VGQldTeERRVUZETEUxQlFVMHNRMEZCUXl4SFFVRkhMRmRCUVZjc1EwRkJRenRKUVVOb1JEdEJRVU5FTEZWQlFVOHNTMEZCU3l4RFFVRkRPMGRCUTJJN08wRkJSVVFzVFVGQlR5eE5RVUZOTEVkQlFVc3NZVUZCWVN4RFFVRkRMRk5CUVZNc1EwRkJSU3hOUVVGTkxFTkJRVVU3VFVGRGFrUXNVVUZCVVN4SFFVRkpMRTlCUVU4c1EwRkJSU3hOUVVGTkxFTkJRVVU3VFVGRE4wSXNVMEZCVXl4SFFVRkpMR0ZCUVdFc1EwRkJReXhGUVVGRkxFTkJRVVVzVFVGQlRTeERRVUZGTEVOQlFVTTdPenRCUVVjeFF5eE5RVUZKTEZGQlFWRXNSVUZCUnp0QlFVTmtMRTFCUVVjc1EwRkJReXhIUVVGSExFTkJRVU1zYjBKQlFXOUNMRWRCUVVjc1lVRkJZU3hEUVVGRExFbEJRVWtzUjBGQlJ5eFBRVUZQTEVkQlFVY3NVVUZCVVN4RFFVRkRMRWxCUVVrc1EwRkJSU3hEUVVGRE8wRkJRemxGTEdkQ1FVRmhMRU5CUVVVc1VVRkJVU3hGUVVGRkxGTkJRVk1zUlVGQlJTeEpRVUZKTEVOQlFVVXNRMEZCUXp0SFFVTXpReXhOUVVOSk8wRkJRMG9zVFVGQlJ5eERRVUZETEV0QlFVc3NRMEZCUlN4cFFrRkJhVUlzUjBGQlJ5eGhRVUZoTEVOQlFVTXNTVUZCU1N4SFFVRkhMR05CUVdNc1IwRkJSeXhOUVVGTkxFZEJRVWNzYlVKQlFXMUNMRU5CUVVVc1EwRkJRenRIUVVOd1J6dEZRVU5FTEVOQlFVTTdPenM3TzBGQlMwWXNTVUZCUnl4RFFVRkRMRTFCUVUwc1IwRkJSeXhaUVVGWE8wRkJRVVVzV1VGQlZTeEhRVUZITEVsQlFVa3NRMEZCUXp0RlFVRkZMRU5CUVVNN096czdPenRCUVU4dlF5eEpRVUZITEVOQlFVTXNhMEpCUVd0Q0xFZEJRVWNzV1VGQlZ6dEJRVU51UXl4elFrRkJiMElzUjBGQlJ5eEpRVUZKTEVOQlFVTTdRVUZETlVJc2NVSkJRVzFDTEVWQlFVVXNRMEZCUXp0RlFVTjBRaXhEUVVGRE96czdPenM3TzBGQlQwWXNTVUZCUnl4RFFVRkRMRkZCUVZFc1IwRkJSeXhWUVVGVkxFdEJRVXNzUlVGQlJTeFRRVUZUTEVWQlFVYzdPMEZCUlRORExFMUJRVWtzUTBGQlF5eFBRVUZQTEVsQlFVa3NUMEZCVHl4RFFVRkZMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVVVzUlVGQlJ6dEJRVU4yUXl4VlFVRlBMRWxCUVVrc1EwRkJRenRIUVVOYU96dEJRVVZFTEZOQlFVOHNRMEZCUlN4TFFVRkxMRU5CUVVNc1NVRkJTU3hEUVVGRkxFZEJRVWNzUzBGQlN5eERRVUZETzBGQlF6bENMRTFCUVVrc1UwRkJVeXhGUVVGSE8wRkJRVVVzVjBGQlVTeEhRVUZITEV0QlFVc3NRMEZCUXp0SFFVRkZPMEZCUTNKRExGTkJRVThzUzBGQlN5eERRVUZETzBWQlEySXNRMEZCUXpzN096czdPMEZCVFVZc1NVRkJSeXhEUVVGRExFbEJRVWtzUjBGQlJ5eFZRVUZWTEU5QlFVOHNSVUZETlVJN1FVRkRReXcwUWtGQll5eFJRVUZSTEVWQlFVVXNUMEZCVHl4RFFVRkZMRU5CUVVNN1FVRkRiRU1zUzBGQlJ5eERRVUZETEZWQlFWVXNRMEZCUlN4UlFVRlJMRU5CUVVNc1MwRkJTeXhEUVVGRkxFTkJRVU03UVVGRGFrTXNTMEZCUnl4RFFVRkRMRWRCUVVjc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF6dEZRVU55UWl4RFFVRkRPenM3T3pzN096dEJRVkZHTEVsQlFVY3NRMEZCUXl4TlFVRk5MRWRCUVVjc1ZVRkJWU3hOUVVGTkxFVkJRemRDT3pzN1FVRkRReXhOUVVGSkxFMUJRVTBzV1VGQldTeExRVUZMTEVWQlFVYzdRVUZETjBJc1UwRkJUU3hEUVVGRExFOUJRVThzUTBGQlJTeFZRVUZGTEVsQlFVa3NSVUZCVFR0QlFVRkZMRlZCUVVzc1RVRkJUU3hEUVVGRkxFbEJRVWtzUTBGQlJTeERRVUZETzBsQlFVVXNSVUZCUlN4SlFVRkpMRU5CUVVVc1EwRkJRenRCUVVNM1JDeFZRVUZQTEVsQlFVa3NRMEZCUXp0SFFVTmFPMEZCUTBRc1RVRkJTU3hQUVVGUExFZEJRVThzVDBGQlR5eERRVUZETEUxQlFVMHNTMEZCU3l4RFFVRkRMRWxCUVVrc1RVRkJUU3hEUVVGRExFOUJRVThzUVVGQlF6dE5RVU40UkN4TFFVRkxMRWRCUVZFc1NVRkJTU3hIUVVGSExFTkJRVU1zUzBGQlN5eERRVUZGTEUxQlFVMHNRMEZCUXl4SlFVRkpMRVZCUVVVc1QwRkJUeXhEUVVGRk8wMUJRMnhFTEdkQ1FVRm5RaXhIUVVGTkxFMUJRVTBzUTBGQlF5eG5Ra0ZCWjBJc1NVRkJTU3hGUVVGRkxFTkJRVU03TzBGQlJYSkVMR3RDUVVGblFpeERRVUZETEU5QlFVOHNRMEZCUlN4VlFVRkRMRlZCUVZVc1JVRkJTenRCUVVONlF5eFJRVUZMTEVOQlFVTXNZVUZCWVN4RFFVRkZMRlZCUVZVc1EwRkJReXhOUVVGTkxFVkJRVVVzVlVGQlZTeERRVUZETEUxQlFVMHNSVUZCUlN4VlFVRlZMRU5CUVVNc1IwRkJSeXhEUVVGRkxFTkJRVU03UjBGRE5VVXNRMEZCUXl4RFFVRkRPenRCUVVWSUxFdEJRVWNzUTBGQlF5eFJRVUZSTEVOQlFVVXNTMEZCU3l4RlFVRkZMRTlCUVU4c1EwRkJSU3hEUVVGRE8wVkJReTlDTEVOQlFVTTdPenM3T3p0QlFVMUdMRWxCUVVjc1EwRkJReXhsUVVGbExFZEJRVWNzV1VGQlZ6dEJRVUZGTEZOQlFVOHNZVUZCWVN4RFFVRkRPMFZCUVVVc1EwRkJRenM3T3pzN1FVRkxNMFFzU1VGQlJ5eERRVUZETEU5QlFVOHNSMEZCUnl4WlFVRlhPMEZCUTNoQ0xGTkJRVThzUjBGQlJ5eEpRVUZKTEVOQlFVTTdSVUZEWml4RFFVRkRPenM3UVVGSFJpeFBRVUZOTEVOQlFVTXNZMEZCWXl4RFFVRkZMRWRCUVVjc1JVRkJSU3h2UWtGQmIwSXNSVUZCUlN4RlFVRkZMRWRCUVVjc1JVRkJSU3hoUVVGVkxFMUJRVTBzUlVGQlJ6dEJRVUZGTEhWQ1FVRnZRaXhIUVVGSExFMUJRVTBzUTBGQlF6dEhRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRPenM3T3pzN096dEJRVk5zU0N4SlFVRkhMRU5CUVVNc1MwRkJTeXhIUVVGSExGVkJRVlVzU1VGQlNTeEZRVUZGTEU5QlFVOHNSVUZEYmtNN1FVRkRReXhOUVVGSkxFTkJRVU1zV1VGQldTeEhRVUZKTEVWQlFVVXNRMEZCUXp0QlFVTjRRaXhOUVVGSkxFTkJRVU1zUzBGQlN5eEhRVUZOTEVsQlFVa3NRMEZCUXp0QlFVTnlRaXhOUVVGSkxFTkJRVU1zUzBGQlN5eEhRVUZOTEVWQlFVVXNRMEZCUXp0QlFVTnVRaXhOUVVGSkxFTkJRVU1zVVVGQlVTeEhRVUZOTEU5QlFVOHNRMEZCUXp0RlFVTXpRaXhEUVVGRE96dEJRVVZHTEVsQlFVY3NRMEZCUXl4TFFVRkxMRU5CUVVNc1UwRkJVeXhIUVVGSE96dEJRVVZ5UWl4clFrRkJaMElzUlVGQlJ5d3dRa0ZCVlN4TlFVRk5MRVZCUVVVc1RVRkJUU3hGUVVGSE8wRkJRemRETEU5QlFVa3NTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJSU3hOUVVGTkxFTkJRVVVzUlVGQlJ6dEJRVU5xUXl4WFFVRlBMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVVVzVFVGQlRTeERRVUZGTEVOQlFVVXNUVUZCVFN4RFFVRkZMRU5CUVVNN1NVRkROME03UVVGRFJDeFZRVUZQTEV0QlFVc3NRMEZCUXp0SFFVTmlPenM3T3pzN08wRkJUMFFzWlVGQllTeEZRVUZITEhWQ1FVRlZMRTFCUVUwc1JVRkJSU3hOUVVGTkxFVkJRVVVzYVVKQlFXbENMRVZCUVVjN1FVRkROMFFzVDBGQlNTeEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkZMRTFCUVUwc1EwRkJSU3hGUVVGSE8wRkJRVVVzVjBGQlR5eExRVUZMTEVOQlFVTTdTVUZCUlR0QlFVTnVSQ3hQUVVGSkxFTkJRVU1zV1VGQldTeERRVUZGTEUxQlFVMHNRMEZCUlN4SFFVRkhMRVZCUVVVc1RVRkJUU3hGUVVGSExFMUJRVTBzUlVGQlJTeEhRVUZITEVWQlFVY3NhVUpCUVdsQ0xFVkJRVVVzUTBGQlF6dEhRVU16UlRzN1FVRkZSQ3hoUVVGWExFVkJRVWNzY1VKQlFWVXNUVUZCVFN4RlFVRkhPMEZCUVVVc1ZVRkJUeXhKUVVGSkxFTkJRVU1zWjBKQlFXZENMRU5CUVVVc1RVRkJUU3hGUVVGRkxFdEJRVXNzUTBGQlJTeERRVUZETzBkQlFVVTdRVUZEYmtZc1YwRkJVeXhGUVVGTExHMUNRVUZWTEUxQlFVMHNSVUZCUnp0QlFVRkZMRlZCUVU4c1NVRkJTU3hEUVVGRExHZENRVUZuUWl4RFFVRkZMRTFCUVUwc1JVRkJSU3hSUVVGUkxFTkJRVVVzUTBGQlF6dEhRVUZGTzBWQlEzUkdMRU5CUVVNN096czdPenM3TzBGQlVVWXNUMEZCVFN4RFFVRkRMR05CUVdNc1EwRkJReXhIUVVGSExFTkJRVU1zUzBGQlN5eERRVUZETEZOQlFWTXNSVUZCUlN4TlFVRk5MRVZCUVVzc1JVRkJSU3hIUVVGSExFVkJRVVVzWlVGQlZ6dEJRVUZGTEZWQlFVOHNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJRenRIUVVGRkxFVkJRVU1zUTBGQlJTeERRVUZETzBGQlEyeEhMRTlCUVUwc1EwRkJReXhqUVVGakxFTkJRVU1zUjBGQlJ5eERRVUZETEV0QlFVc3NRMEZCUXl4VFFVRlRMRVZCUVVVc1lVRkJZU3hGUVVGSExFVkJRVVVzUjBGQlJ5eEZRVUZGTEdWQlFWYzdRVUZCUlN4VlFVRlBMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU03UjBGQlJTeEZRVUZETEVOQlFVVXNRMEZCUXp0QlFVTTVSeXhQUVVGTkxFTkJRVU1zWTBGQll5eERRVUZETEVkQlFVY3NRMEZCUXl4TFFVRkxMRU5CUVVNc1UwRkJVeXhGUVVGRkxFMUJRVTBzUlVGQlN5eEZRVUZGTEVkQlFVY3NSVUZCUlN4bFFVRlhPMEZCUVVVc1ZVRkJUeXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETzBkQlFVVXNSVUZCUXl4RFFVRkZMRU5CUVVNN1FVRkRiRWNzVDBGQlRTeERRVUZETEdOQlFXTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1MwRkJTeXhEUVVGRExGTkJRVk1zUlVGQlJTeFRRVUZUTEVWQlFVa3NSVUZCUlN4SFFVRkhMRVZCUVVVc1pVRkJWenRCUVVGRkxGVkJRVThzU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXp0SFFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRE8wRkJRM1pITEU5QlFVMHNRMEZCUXl4alFVRmpMRU5CUVVNc1IwRkJSeXhEUVVGRExFdEJRVXNzUTBGQlF5eFRRVUZUTEVWQlFVVXNTVUZCU1N4RlFVRkxMRVZCUVVVc1IwRkJSeXhGUVVGRkxHVkJRVmM3UVVGQlJTeFZRVUZQTEVsQlFVa3NRMEZCUXl4WFFVRlhMRU5CUVVNN1IwRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF6dERRVVYwUnl4RFFVRkJMRVZCUVVjc1EwRkJRenM3Y1VKQlJWVXNSMEZCUnlJc0ltWnBiR1VpT2lJdlZYTmxjbk12ZEdGc2QyOXZiR1l2WkdWMlpXeHZjR1Z5TDNkbFlsSnZiM1F2ZEhKaGJuTnBkR2x2YmkxdFlXNWhaMlZ5TDNOeVl5OWpiM0psTDJaemJTNXFjeUlzSW5OdmRYSmpaWE5EYjI1MFpXNTBJanBiSWx4dWFXMXdiM0owSUd4dloyZGxjaUJjZEZ4MFhIUm1jbTl0SUNjdUxpOWpiMjF0YjI0dmJHOW5aMlZ5TG1wekp6dGNibWx0Y0c5eWRDQjdjM1JoZEdWRGFHRnVaMlZrZlNCY2RHWnliMjBnSnk0dUwyTnZiVzF2Ymk5a2FYTndZWFJqYUdWeUp6dGNibWx0Y0c5eWRDQmtaV1poZFd4MFVISnZjSE1nSUZ4MFpuSnZiU0FuTGk0dmRYUnBiSE12WkdWbVlYVnNkQ2M3WEc1cGJYQnZjblFnYldsNGFXNWNkRngwSUNCY2RHWnliMjBnSnk0dUwzVjBhV3h6TDIxcGVHbHVKenRjYmx4dUx5b2dZM0psWVhSbElHTnNZWE56SUdGdVpDQmxlSFJsYm1RZ2JHOW5aMlZ5SUNvdlhHNWpiMjV6ZENCR1UwMGdQU0J0YVhocGJpaDdJRzVoYldVZ09pQW5VM1JoZEdWTllXTm9hVzVsSnlCOUxDQnNiMmRuWlhJZ0tUdGNibHh1S0daMWJtTjBhVzl1S0NsY2JudGNkRnh1WEhSc1pYUWdYSFJmYzNSaGRHVnpJRngwWEhSY2RGeDBQU0I3ZlN4Y2JseDBYSFJjZEY5amRYSnlaVzUwVTNSaGRHVWdYSFJjZEZ4MFBTQnVkV3hzTEZ4dVhIUmNkRngwWDJsdWFYUnBZV3dnWEhSY2RGeDBYSFE5SUc1MWJHd3NYRzVjZEZ4MFhIUmZZV04wYVc5dVVYVmxkV1VnWEhSY2RGeDBQU0JiWFN4Y2JseDBYSFJjZEY5b2FYTjBiM0o1SUZ4MFhIUmNkRngwUFNCYlhTeGNibHgwWEhSY2RGOWpZVzVqWld4c1pXUWdYSFJjZEZ4MFhIUTlJR1poYkhObExGeHVYSFJjZEZ4MFgzUnlZVzV6YVhScGIyNURiMjF3YkdWMFpXUWdYSFE5SUhSeWRXVXNYRzVjZEZ4MFhIUmZjM1JoZEdWRGFHRnVaMlZrU0dGdVpHeGxjaUFnSUNBOUlHNTFiR3dzWEc1Y2JseDBYSFJjZEY5dmNIUnBiMjV6SUQwZ2UxeHVYSFJjZEZ4MFhIUm9hWE4wYjNKNUlGeDBYSFE2SUdaaGJITmxMRnh1WEhSY2RGeDBYSFJzYVcxcGRIRWdYSFFnWEhSY2REb2dkSEoxWlN4Y2JseDBYSFJjZEZ4MGNYUnlZVzV6YVhScGIyNXpYSFE2SUhSeWRXVXNYRzVjZEZ4MFhIUmNkR1JsWW5WbklGeDBJRngwWEhRNklHWmhiSE5sWEc1Y2RGeDBYSFI5TzF4dVhHNWNibHgwTHlvcVhHNWNkQ0FxSUdOb1pXTnJJSFJ2SUhObElHbG1JSFJvSUdGdWFXMWhkR2x2YmlCb1lYTWdZMkZ1WTJWc2JHVmtJR2x1SUZ4dVhIUWdLaUJpWlhSM1pXVnVJSE4wWVhSbElIUnlZVzV6YVhScGIyNXpYRzVjZENBcUlFQnlaWFIxY200Z2UwSnZiMnhsWVc1OUlHTmhibU5sYkd4bFpGeHVYSFFxTDF4dVhIUm1kVzVqZEdsdmJpQnBjME5oYm1ObGJHeGxaQ2dwSUh0Y2JseDBYSFJwWmloZlkyRnVZMlZzYkdWa0tTQjdYRzVjZEZ4MFhIUmZkSEpoYm5OcGRHbHZia052YlhCc1pYUmxaQ0E5SUhSeWRXVTdYRzVjZEZ4MFhIUmZZMkZ1WTJWc2JHVmtJRngwWEhSY2RDQTlJR1poYkhObE8xeHVYSFJjZEZ4MGNtVjBkWEp1SUhSeWRXVTdYRzVjZEZ4MGZWeHVYSFJjZEhKbGRIVnliaUJtWVd4elpUdGNibHgwZlZ4dVhHNWNibHgwTHlvcVhHNWNkQ0FxSUhSeVlXNXphWFJwYjI0Z2RHOGdkR2hsSUc1bGVIUWdjM1JoZEdWY2JseDBJQ29nUUhCaGNtRnRJQ0I3YjJKcVpXTjBmU0J1WlhoMFUzUmhkR1VnSUNBZ0lDQWdJRzVsZHlCemRHRjBaU0J2WW1wbFkzUmNibHgwSUNvZ1FIQmhjbUZ0SUNCN2MzUnlhVzVuZlNCaFkzUnBiMjRnSUNBZ0lDQWdJQ0FnSUdGamRHbHZia2xFSUZ4dVhIUWdLaUJBY0dGeVlXMGdJSHR2WW1wbFkzUjlJR1JoZEdFZ0lDQWdJQ0FnSUNBZ0lDQWdaR0YwWVNCelpXNTBJSGRwZEdnZ2RHaGxJR0ZqZEdsdmJseHVYSFFnS2lCQWNHRnlZVzBnSUh0emRISnBibWQ5SUdGamRHbHZia2xrWlc1MGFXWnBaWElnYzNSaGRHVWdZVzVrSUdGamRHbHZiaUJqYjIxaWFXNWxaQ0IwYnlCdFlXdGxJR0VnZFc1cGNYVmxJSE4wY21sdVoxeHVYSFFxTDF4dVhHNWNkR1oxYm1OMGFXOXVJRjkwY21GdWMybDBhVzl1Vkc4b0lHNWxlSFJUZEdGMFpTd2dZV04wYVc5dUxDQmtZWFJoSUNsY2JseDBlMXh1WEhSY2RGOWpZVzVqWld4c1pXUWdYSFJjZEZ4MFhIUTlJR1poYkhObE8xeHVYSFJjZEY5MGNtRnVjMmwwYVc5dVEyOXRjR3hsZEdWa0lGeDBQU0JtWVd4elpUdGNibHh1WEhSY2RHbG1LQ0JwYzBOaGJtTmxiR3hsWkNncElDa2dleUJ5WlhSMWNtNGdabUZzYzJVN0lIMWNibHh1WEhSY2RHbG1LQ0JmWTNWeWNtVnVkRk4wWVhSbElDa2dlMXh1WEhSY2RGeDBiR1YwSUhCeVpYWnBiM1Z6VTNSaGRHVWdQU0JmWTNWeWNtVnVkRk4wWVhSbE8xeHVYSFJjZEZ4MGFXWW9YMjl3ZEdsdmJuTXVhR2x6ZEc5eWVTbDdJRjlvYVhOMGIzSjVMbkIxYzJnb2NISmxkbWx2ZFhOVGRHRjBaUzV1WVcxbEtUc2dmVnh1WEhSY2RIMWNibHgwWEhSY2JseDBYSFJmWTNWeWNtVnVkRk4wWVhSbElEMGdibVY0ZEZOMFlYUmxPMXh1WEc1Y2RGeDBhV1lvSUdGamRHbHZiaUFwSUh0Y2JseDBYSFJjZEY5emRHRjBaVU5vWVc1blpXUklZVzVrYkdWeUtDQmhZM1JwYjI0c0lHUmhkR0VnS1RzZ1hHNWNkRngwZlNCbGJITmxJSHRjYmx4MFhIUmNkRjkwY21GdWMybDBhVzl1UTI5dGNHeGxkR1ZrSUQwZ2RISjFaVHRjYmx4MFhIUmNkRVpUVFM1c2IyY29KMU4wWVhSbElIUnlZVzV6YVhScGIyNGdRMjl0Y0d4bGRHVmtJU0JEZFhKeVpXNTBJRk4wWVhSbElEbzZJQ2NnS3lCZlkzVnljbVZ1ZEZOMFlYUmxMbTVoYldVZ0tUdGNibHgwWEhSY2RITjBZWFJsUTJoaGJtZGxaQzVrYVhOd1lYUmphQ2hmWTNWeWNtVnVkRk4wWVhSbEtUdGNibHgwWEhSOVhHNWNkSDFjYmx4dVhIUXZLaXBjYmx4MElDb2dTV1lnYzNSaGRHVnpJR2hoZG1VZ2NYVmxkV1ZrSUhWd1hHNWNkQ0FxSUd4dmIzQWdkR2h5YjNWbmFDQmhibVFnWVdOMGFXOXVJR0ZzYkNCemRHRjBaWE1nYVc0Z2RHaGxJSEYxWlhWbElIVnVkR2xzWEc1Y2RDQXFJRzV2Ym1VZ2NtVnRZV2x1WEc1Y2RDQXFMMXh1WEhSbWRXNWpkR2x2YmlCZmNISnZZMlZ6YzBGamRHbHZibEYxWlhWbEtDbGNibHgwZTF4MFhHNWNkRngwYVdZb0lGOWhZM1JwYjI1UmRXVjFaUzVzWlc1bmRHZ2dQaUF3SUNrZ2UxeHVYSFJjZEZ4MGRtRnlJSE4wWVhSbFJYWmxiblFnUFNCZllXTjBhVzl1VVhWbGRXVXVjMmhwWm5Rb0tUdGNibHgwWEhSY2RGeHVYSFJjZEZ4MGFXWW9JVjlqZFhKeVpXNTBVM1JoZEdVdVoyVjBWR0Z5WjJWMEtITjBZWFJsUlhabGJuUXVZV04wYVc5dUtTa2dlMXh1WEhSY2RGeDBYSFJmY0hKdlkyVnpjMEZqZEdsdmJsRjFaWFZsS0NrN1hHNWNkRngwWEhSOUlGeHVYSFJjZEZ4MFpXeHpaU0I3WEc1Y2RGeDBYSFI5WEhSR1UwMHVZV04wYVc5dUtDQnpkR0YwWlVWMlpXNTBMbUZqZEdsdmJpd2djM1JoZEdWRmRtVnVkQzVrWVhSaElDazdYRzVjYmx4MFhIUmNkSEpsZEhWeWJpQm1ZV3h6WlR0Y2JseDBYSFI5WEc1Y2JseDBYSFJHVTAwdWJHOW5LQ2RUZEdGMFpTQjBjbUZ1YzJsMGFXOXVJRU52YlhCc1pYUmxaQ0VnUTNWeWNtVnVkQ0JUZEdGMFpTQTZPaUFuSUNzZ1gyTjFjbkpsYm5SVGRHRjBaUzV1WVcxbElDazdYRzVjZEZ4MGMzUmhkR1ZEYUdGdVoyVmtMbVJwYzNCaGRHTm9LRjlqZFhKeVpXNTBVM1JoZEdVcE8xeHVYSFI5WEc1Y2JseDBMeW9xWEc1Y2RDQXFJSE4wWVhKMElFWlRUU0JjYmx4MElDb2djMlYwSUhSb1pTQnBibWwwYVdGc0lITjBZWFJsWEc1Y2RDQXFMMXh1WEhSR1UwMHVjM1JoY25RZ1BTQm1kVzVqZEdsdmJpZ2dJQ2xjYmx4MGUxeHVYSFJjZEdsbUtDRmZhVzVwZEdsaGJDa2dleUJ5WlhSMWNtNGdSbE5OTG14dlp5Z25SVkpTVDFJZ0xTQkdVMDBnYlhWemRDQm9ZWFpsSUdGdUlHbHVhWFJwWVd3Z2MzUmhkR1VnYzJWMEp5azdJSDFjYmx4MFhIUmZkSEpoYm5OcGRHbHZibFJ2S0NCZmFXNXBkR2xoYkN3Z2JuVnNiQ0FwTzF4dVhIUmNkSEpsZEhWeWJpQjBhR2x6TzF4dVhIUjlPMXh1WEc1Y2RDOHFLbHh1WEhRZ0tpQnlaWFIxY200Z2RHaGxJR0ZqZEdsdmJpQm9hWE4wYjNKNVhHNWNkQ0FxSUVCeVpYUjFjbTRnZTJGeVlYbDlJRnh1WEhRZ0tpOWNibHgwUmxOTkxtZGxkRWhwYzNSdmNua2dQU0JtZFc1amRHbHZiaWdwSUh0Y2JseDBYSFJ5WlhSMWNtNGdYMmhwYzNSdmNuazdYRzVjZEgxY2JseHVYSFF2S2lwY2JseDBJQ29nUkU4Z1FVTlVTVTlPWEc1Y2RDQXFJR1J2SUdGamRHbHZiaUJoYm1RZ1kyaGhibWRsSUhSb1pTQmpkWEp5Wlc1MElITjBZWFJsSUdsbVhHNWNkQ0FxSUhSb1pTQmhZM1JwYjI0Z2FYTWdZWFpoYVd4aFlteGxJR0Z1WkNCaGJHeHZkMlZrWEc1Y2RDQXFJRUJ3WVhKaGJTQWdlM04wY21sdVozMGdZV04wYVc5dUlIUnZJR05oY25KNUlHOTFkRnh1WEhRZ0tpQkFjR0Z5WVcwZ0lIdHZZbXBsWTNSOUlHUmhkR0VnZEc4Z2MyVnVaQ0IzYVhSb0lIUm9aU0J6ZEdGMFpWeHVYSFFnS2k5Y2JseDBSbE5OTG1GamRHbHZiaUE5SUdaMWJtTjBhVzl1S0NCaFkzUnBiMjRzSUdSaGRHRWdLVnh1WEhSN1hHNWNkRngwYVdZb0lDRmZZM1Z5Y21WdWRGTjBZWFJsSUNsN0lISmxkSFZ5YmlCR1UwMHViRzluS0NBblJWSlNUMUlnT2lCWmIzVWdiV0Y1SUc1bFpXUWdkRzhnYzNSaGNuUWdkR2hsSUdaemJTQm1hWEp6ZENjZ0tUc2dmVnh1WEhSY2RGeHVYSFJjZEM4cUlHbG1JSFJ5WVc1emFYUnBiMjVwYm1jc0lIRjFaWFZsSUhWd0lHNWxlSFFnWVdOMGFXOXVJQ292WEc1Y2RGeDBhV1lvSVY5MGNtRnVjMmwwYVc5dVEyOXRjR3hsZEdWa0lDWW1JRjl2Y0hScGIyNXpMbkYwY21GdWMybDBhVzl1Y3lrZ2V5QmNibHgwWEhSY2RFWlRUUzVzYjJjb0ozUnlZVzV6YVhScGIyNGdhVzRnY0hKdlozSmxjM01zSUdGa1pHbHVaeUJoWTNScGIyNGdLaWNyWVdOMGFXOXVLeWNnZEc4Z2NYVmxkV1VuS1R0Y2JseHVYSFJjZEZ4MEx5b2djM1J2Y21VZ2RHaGxJR0ZqZEdsdmJpQmtZWFJoSUNvdlhHNWNkRngwWEhSc1pYUWdZV04wYVc5dVUzUnZjbVVnUFNCN0lHRmpkR2x2YmlBNklHRmpkR2x2Yml3Z1pHRjBZU0E2SUdSaGRHRWdmVHRjYmx4dVhIUmNkRngwYVdZb0lGOXZjSFJwYjI1ekxteHBiV2wwY1NBcElIdGNibHgwWEhSY2RGeDBYMkZqZEdsdmJsRjFaWFZsV3pCZElEMGdZV04wYVc5dVUzUnZjbVU3WEc1Y2RGeDBYSFI5SUZ4dVhIUmNkRngwWld4elpTQjdYRzVjZEZ4MFhIUmNkRjloWTNScGIyNVJkV1YxWlZ0ZllXTjBhVzl1VVhWbGRXVXViR1Z1WjNSb1hTQTlJR0ZqZEdsdmJsTjBiM0psTzF4dVhIUmNkRngwZlZ4dVhIUmNkRngwY21WMGRYSnVJR1poYkhObE8xeHVYSFJjZEgxY2JseHVYSFJjZEdOdmJuTjBJRngwZEdGeVoyVjBJRngwWEhROUlGOWpkWEp5Wlc1MFUzUmhkR1V1WjJWMFZHRnlaMlYwS0NCaFkzUnBiMjRnS1N4Y2JseDBYSFJjZEZ4MGJtVjNVM1JoZEdVZ1hIUTlJRjl6ZEdGMFpYTmJJSFJoY21kbGRDQmRMRnh1WEhSY2RGeDBYSFJmWVdOMGFXOXVTV1FnWEhROUlGOWpkWEp5Wlc1MFUzUmhkR1V1YVdRb0lHRmpkR2x2YmlBcE8xeHVYRzVjZEZ4MEx5b2dhV1lnWVNCdVpYY2dkR0Z5WjJWMElHTmhiaUJpWlNCbWIzVnVaQ3dnWTJoaGJtZGxJSFJvWlNCamRYSnlaVzUwSUhOMFlYUmxJQ292WEc1Y2RGeDBhV1lvSUc1bGQxTjBZWFJsSUNrZ2UxeHVYSFJjZEZ4MFJsTk5MbXh2WnlnblEyaGhibWRwYm1jZ2MzUmhkR1VnT2pvZ0p5QXJJRjlqZFhKeVpXNTBVM1JoZEdVdWJtRnRaU0FySUNjZ1BqNCtJQ2NnS3lCdVpYZFRkR0YwWlM1dVlXMWxJQ2s3WEc1Y2RGeDBYSFJmZEhKaGJuTnBkR2x2YmxSdktDQnVaWGRUZEdGMFpTd2dYMkZqZEdsdmJrbGtMQ0JrWVhSaElDazdYRzVjZEZ4MGZWeHVYSFJjZEdWc2MyVWdlMXh1WEhSY2RGeDBSbE5OTG1WeWNtOXlLQ0FuVTNSaGRHVWdibUZ0WlNBNk9qb2dKeUFySUY5amRYSnlaVzUwVTNSaGRHVXVibUZ0WlNBcklDY2dUMUlnUVdOMGFXOXVPaUFuSUNzZ1lXTjBhVzl1SUNzZ0p5QnBjeUJ1YjNRZ1lYWmhhV3hoWW14bEp5QXBPMXh1WEhSY2RIMWNibHgwZlR0Y2JseHVYSFF2S2lwY2JseDBJQ29nWTJGdVkyVnNJSFJvWlNCamRYSnlaVzUwSUhSeVlXNXphWFJwYjI1Y2JseDBJQ292WEc1Y2RFWlRUUzVqWVc1alpXd2dQU0JtZFc1amRHbHZiaWdwSUhzZ1gyTmhibU5sYkd4bFpDQTlJSFJ5ZFdVN0lIMDdYRzVjYmx4dVhIUXZLaXBjYmx4MElDb2dkSEpoYm5OcGRHbHZiaUJqYjIxd2JHVjBaV1JjYmx4MElDb2dZMkZzYkdWa0lHVjRkR1Z5Ym1Gc2JIa2diMjVqWlNCaGJHd2djSEp2WTJWemMyVnpJR2hoZG1VZ1kyOXRjR3hsZEdWa1hHNWNkQ0FxTDF4dVhIUkdVMDB1ZEhKaGJuTnBkR2x2YmtOdmJYQnNaWFJsSUQwZ1puVnVZM1JwYjI0b0tTQjdYRzVjZEZ4MFgzUnlZVzV6YVhScGIyNURiMjF3YkdWMFpXUWdQU0IwY25WbE8xeHVYSFJjZEY5d2NtOWpaWE56UVdOMGFXOXVVWFZsZFdVb0tUdGNibHgwZlR0Y2JseHVYSFF2S2lwY2JseDBJQ29nWVdSa0lHRWdibVYzSUhOMFlYUmxJSFJ2SUhSb1pTQkdVMDFjYmx4MElDb2dRSEJoY21GdElIdHZZbXBsWTNSOUlDQnpkR0YwWlNBdElFWlRUU0JUVkVGVVJWeHVYSFFnS2lCQWNHRnlZVzBnZTBKdmIyeGxZVzU5SUdselNXNXBkR2xoYkZ4dVhIUWdLaTljYmx4MFJsTk5MbUZrWkZOMFlYUmxJRDBnWm5WdVkzUnBiMjRvSUhOMFlYUmxMQ0JwYzBsdWFYUnBZV3dnS1NCN1hHNWNibHgwWEhScFppZ2dJVjl6ZEdGMFpYTWdmSHdnWDNOMFlYUmxjMXNnYzNSaGRHVXVibUZ0WlNCZElDa2dlMXh1WEhSY2RGeDBjbVYwZFhKdUlHNTFiR3c3WEc1Y2RGeDBmVnh1WEhSY2RGeHVYSFJjZEY5emRHRjBaWE5iSUhOMFlYUmxMbTVoYldVZ1hTQTlJSE4wWVhSbE8xeHVYSFJjZEdsbUtDQnBjMGx1YVhScFlXd2dLU0I3SUY5cGJtbDBhV0ZzSUQwZ2MzUmhkR1U3SUgxY2JseDBYSFJ5WlhSMWNtNGdjM1JoZEdVN1hHNWNkSDA3WEc1Y2JseDBMeW9xWEc1Y2RDQXFJR2x1YVhScFlXeHBjMlVnTFNCd1lYTnpJR2x1SUhObGRIVndJRzl3ZEdsdmJuTmNibHgwSUNvZ1FIQmhjbUZ0SUNCN2IySnFaV04wZlNCdmNIUnBiMjV6SUZ4dVhIUWdLaTljYmx4MFJsTk5MbWx1YVhRZ1BTQm1kVzVqZEdsdmJpZ2diM0IwYVc5dWN5QXBYRzVjZEh0Y2JseDBYSFJrWldaaGRXeDBVSEp2Y0hNb0lGOXZjSFJwYjI1ekxDQnZjSFJwYjI1eklDazdYRzVjZEZ4MFJsTk5MbWx1YVhSTWIyZG5aWElvSUY5dmNIUnBiMjV6TG1SbFluVm5JQ2s3WEc1Y2RGeDBSbE5OTG14dlp5Z25hVzVwZEdsaGRHVmtKeWs3WEc1Y2RIMDdYRzVjYmx4MEx5b3FYRzVjZENBcUlHTnlaV0YwWlNCemRHRjBaWE1nWVc1a0lIUnlZVzV6YVhScGIyNXpJR0poYzJWa0lHOXVJR052Ym1acFp5QmtZWFJoSUhCaGMzTmxaQ0JwYmx4dVhIUWdLaUJwWmlCemRHRjBaWE1nWVhKbElHRnVJR0Z5Y21GNUxDQnNiMjl3SUdGdVpDQmhjM05wWjI0Z1pHRjBZVnh1WEhRZ0tpQjBieUJ1WlhjZ2MzUmhkR1VnYjJKcVpXTjBjMXh1WEhRZ0tpQkFjR0Z5WVcwZ0lIdGhjbkpoZVM5dlltcGxZM1I5SUdOdmJtWnBaeUF0SUZ0N0lHNWhiV1VzSUhSeVlXNXphWFJwYjI1ekxDQnBibWwwYVdGc0lIMWRYRzVjZENBcUwxeHVYSFJHVTAwdVkzSmxZWFJsSUQwZ1puVnVZM1JwYjI0b0lHTnZibVpwWnlBcFhHNWNkSHRjYmx4MFhIUnBaaWdnWTI5dVptbG5JR2x1YzNSaGJtTmxiMllnUVhKeVlYa2dLU0I3WEc1Y2RGeDBYSFJqYjI1bWFXY3VabTl5UldGamFDZ2dLQ0JwZEdWdElDa2dQVDRnZXlCMGFHbHpMbU55WldGMFpTZ2dhWFJsYlNBcE95QjlMQ0IwYUdseklDazdYRzVjZEZ4MFhIUnlaWFIxY200Z2RHaHBjenRjYmx4MFhIUjlYRzVjZEZ4MGJHVjBJR2x1YVhScFlXd2dYSFJjZEZ4MFBTQW9YM04wWVhSbGN5NXNaVzVuZEdnZ1BUMDlJREFnZkh3Z1kyOXVabWxuTG1sdWFYUnBZV3dwTEZ4dVhIUmNkRngwYzNSaGRHVWdJRngwWEhSY2RGeDBQU0J1WlhjZ1JsTk5MbE4wWVhSbEtDQmpiMjVtYVdjdWJtRnRaU3dnYVc1cGRHbGhiQ0FwTEZ4dVhIUmNkRngwYzNSaGRHVlVjbUZ1YzJsMGFXOXVjeUFnSUNBOUlHTnZibVpwWnk1emRHRjBaVlJ5WVc1emFYUnBiMjV6SUh4OElGdGRPMXh1WEc1Y2RGeDBjM1JoZEdWVWNtRnVjMmwwYVc5dWN5NW1iM0pGWVdOb0tDQW9kSEpoYm5OcGRHbHZiaWtnUFQ0Z2UxeHVYSFJjZEZ4MGMzUmhkR1V1WVdSa1ZISmhibk5wZEdsdmJpZ2dkSEpoYm5OcGRHbHZiaTVoWTNScGIyNHNJSFJ5WVc1emFYUnBiMjR1ZEdGeVoyVjBMQ0IwY21GdWMybDBhVzl1TGw5cFpDQXBPMXh1WEhSY2RIMHBPMXgwWEc1Y2JseDBYSFJHVTAwdVlXUmtVM1JoZEdVb0lITjBZWFJsTENCcGJtbDBhV0ZzSUNrN1hHNWNkSDA3WEc1Y2RGeHVYSFF2S2lwY2JseDBJQ29nY21WMGRYSnVJSFJvWlNCamRYSnlaVzUwSUhOMFlYUmxYRzVjZENBcUlFQnlaWFIxY200Z2UyOWlhbVZqZEgwZ1JsTk5JSE4wWVhSbFhHNWNkQ0FxTDF4dVhIUkdVMDB1WjJWMFEzVnljbVZ1ZEZOMFlYUmxJRDBnWm5WdVkzUnBiMjRvS1NCN0lISmxkSFZ5YmlCZlkzVnljbVZ1ZEZOMFlYUmxPeUI5TzF4dVhHNWNkQzhxS2x4dVhIUWdLaUJrYVhOd2IzTmxJSFJvWlNCemRHRjBaU0J0WVdOb2FXNGdYRzVjZENBcUwxeHVYSFJHVTAwdVpHbHpjRzl6WlNBOUlHWjFibU4wYVc5dUtDa2dlMXh1WEhSY2RGOXpkR0YwWlhNZ1BTQnVkV3hzTzF4dVhIUjlPMXh1WEhSY2JseDBMeW9nYzJWMGN5QmhJSE4wWVhSbGMwTm9ZVzVuWldRZ2JXVjBhRzlrSUdsdWMzUmxZV1FnYjJZZ2RYTnBibWNnWVNCemFXZHVZV3dnS2k5Y2JseDBUMkpxWldOMExtUmxabWx1WlZCeWIzQmxjblI1S0NCR1UwMHNJQ2R6ZEdGMFpVTm9ZVzVuWldSTlpYUm9iMlFuTENCN0lITmxkRG9nWm5WdVkzUnBiMjRvSUcxbGRHaHZaQ0FwSUhzZ1gzTjBZWFJsUTJoaGJtZGxaRWhoYm1Sc1pYSWdQU0J0WlhSb2IyUTdJSDBnZlNrN1hHNWNibHh1WEhRdktpb3FLaW9xS2lvcUtpb3FLaW9xS2lvcUtpb3FLaW9xS2lvcUtpb3FJRnNnUTNKbFlYUmxJRVpUVFNCVGRHRjBaVjBnS2lvcUtpb3FLaW9xS2lvcUtpb3FLaW9xS2lvcUtpb3FLaW9xS2lvcUwxeHVYRzVjZEM4cUtseHVYSFFnS2lCR1UwMGdjM1JoZEdVZ1kyeGhjM05jYmx4MElDb2dRSEJoY21GdElIdHpkSEpwYm1kOUlHNWhiV1VnYzNSaGRHVWdibUZ0WlZ4dVhIUWdLaTljYmx4MFJsTk5MbE4wWVhSbElEMGdablZ1WTNScGIyNG9JRzVoYldVc0lHbHVhWFJwWVd3Z0tWeHVYSFI3WEc1Y2RGeDBkR2hwY3k1ZmRISmhibk5wZEdsdmJuTWdYSFE5SUh0OU95QmNkQzh2SUdGMllXbHNZV0pzWlNCMGNtRnVjMmwwYVc5dWMxeHVYSFJjZEhSb2FYTXVYMjVoYldVZ1hIUmNkRngwUFNCdVlXMWxPeUF2THlCdVlXMWxJQ0FnSUNBZ0lDQWdJQ0FnSUNCY2RDQWdJQ0FnSUZ4MFhHNWNkRngwZEdocGN5NWZaR0YwWVNCY2RGeDBYSFE5SUh0OU95QWdJQzh2SUdSaGRHRWdkRzhnWVhOemIzTmphV0YwWlNCM2FYUm9JSFJvWlNCaFkzUnBiMjVjYmx4MFhIUjBhR2x6TGw5cGJtbDBhV0ZzSUNCY2RGeDBQU0JwYm1sMGFXRnNPMXh1WEhSOU8xeHVYRzVjZEVaVFRTNVRkR0YwWlM1d2NtOTBiM1I1Y0dVZ1BTQjdYRzVjYmx4MFhIUmZabVYwWTJoVWNtRnVjMmwwYVc5dUlEb2dablZ1WTNScGIyNG9JR0ZqZEdsdmJpd2diV1YwYUc5a0lDa2dlMXh1WEhSY2RGeDBhV1lvSUhSb2FYTXVYM1J5WVc1emFYUnBiMjV6V3lCaFkzUnBiMjRnWFNBcElIdGNibHgwWEhSY2RGeDBjbVYwZFhKdUlIUm9hWE11WDNSeVlXNXphWFJwYjI1eld5QmhZM1JwYjI0Z1hWc2diV1YwYUc5a0lGMDdYRzVjZEZ4MFhIUjlYRzVjZEZ4MFhIUnlaWFIxY200Z1ptRnNjMlU3WEc1Y2RGeDBmU3hjYmx4dVhIUmNkQzhxS2x4dVhIUmNkQ0FxSUdGa1pDQjBhR1VnWVhaaGFXeGhZbXhsSUhSeVlYTnBkR2x2Ym5NZ1ptOXlJR1ZoWTJnZ2MzUmhkR1ZjYmx4MFhIUWdLaUJBY0dGeVlXMGdlM04wY21sdVozMGdZV04wYVc5dUlHVXVaeTRuUjA5VVQwaFBUVVVuWEc1Y2RGeDBJQ29nUUhCaGNtRnRJSHR6ZEhKcGJtZDlJSFJoY21kbGRDQmxMbWN1SUNkSVQwMUZKMXh1WEhSY2RDQXFMMXh1WEhSY2RHRmtaRlJ5WVc1emFYUnBiMjRnT2lCbWRXNWpkR2x2YmlnZ1lXTjBhVzl1TENCMFlYSm5aWFFzSUdGamRHbHZia2xrYm1WdWRHbG1hV1Z5SUNrZ2UxeHVYSFJjZEZ4MGFXWW9JSFJvYVhNdVgzUnlZVzV6YVhScGIyNXpXeUJoWTNScGIyNGdYU0FwSUhzZ2NtVjBkWEp1SUdaaGJITmxPeUI5WEc1Y2RGeDBYSFIwYUdsekxsOTBjbUZ1YzJsMGFXOXVjMXNnWVdOMGFXOXVJRjBnUFNCN0lIUmhjbWRsZENBNklIUmhjbWRsZEN3Z1gybGtJRG9nWVdOMGFXOXVTV1J1Wlc1MGFXWnBaWElnZlR0Y2JseDBYSFI5TEZ4dVhHNWNkRngwWjJWMFFXTjBhVzl1U1dRZ09pQm1kVzVqZEdsdmJpZ2dZV04wYVc5dUlDa2dleUJ5WlhSMWNtNGdkR2hwY3k1ZlptVjBZMmhVY21GdWMybDBhVzl1S0NCaFkzUnBiMjRzSUNkZmFXUW5JQ2s3SUgwc1hHNWNkRngwWjJWMFZHRnlaMlYwSUNBZ09pQm1kVzVqZEdsdmJpZ2dZV04wYVc5dUlDa2dleUJ5WlhSMWNtNGdkR2hwY3k1ZlptVjBZMmhVY21GdWMybDBhVzl1S0NCaFkzUnBiMjRzSUNkMFlYSm5aWFFuSUNrN0lIMWNibHgwZlR0Y2JseHVYSFF2S2lwY2JseDBJQ29nWTNKbFlYUmxJR2RsZEhSbGNuTWdabTl5SUhSb1pTQnpkR0YwWlNCY2JseDBJQ29nSUMwZ2JtRnRaVnh1WEhRZ0tpQWdMU0IwY21GdWMybDBhVzl1YzF4dVhIUWdLaUFnTFNCa1lYUmhYRzVjZENBcUwxeHVYSFJQWW1wbFkzUXVaR1ZtYVc1bFVISnZjR1Z5ZEhrb1JsTk5MbE4wWVhSbExuQnliM1J2ZEhsd1pTd2dKMjVoYldVbkxDQmNkRngwWEhSN0lHZGxkRG9nWm5WdVkzUnBiMjRvS1NCN0lISmxkSFZ5YmlCMGFHbHpMbDl1WVcxbE95QjlmU0FwTzF4dVhIUlBZbXBsWTNRdVpHVm1hVzVsVUhKdmNHVnlkSGtvUmxOTkxsTjBZWFJsTG5CeWIzUnZkSGx3WlN3Z0ozUnlZVzV6YVhScGIyNXpKeXdnWEhSN0lHZGxkRG9nWm5WdVkzUnBiMjRvS1NCN0lISmxkSFZ5YmlCMGFHbHpMbDkwY21GdWMybDBhVzl1Y3pzZ2ZYMGdLVHRjYmx4MFQySnFaV04wTG1SbFptbHVaVkJ5YjNCbGNuUjVLRVpUVFM1VGRHRjBaUzV3Y205MGIzUjVjR1VzSUNka1lYUmhKeXdnWEhSY2RGeDBleUJuWlhRNklHWjFibU4wYVc5dUtDa2dleUJ5WlhSMWNtNGdkR2hwY3k1ZlpHRjBZVHNnZlgwZ0tUdGNibHgwVDJKcVpXTjBMbVJsWm1sdVpWQnliM0JsY25SNUtFWlRUUzVUZEdGMFpTNXdjbTkwYjNSNWNHVXNJQ2RwYm1sMGFXRnNKeXdnWEhSY2RIc2daMlYwT2lCbWRXNWpkR2x2YmlncElIc2djbVYwZFhKdUlIUm9hWE11WDJsdWFYUnBZV3c3SUgwZ2ZTazdYRzVjZEU5aWFtVmpkQzVrWldacGJtVlFjbTl3WlhKMGVTaEdVMDB1VTNSaGRHVXVjSEp2ZEc5MGVYQmxMQ0FuYVdRbkxDQmNkRngwWEhSN0lHZGxkRG9nWm5WdVkzUnBiMjRvS1NCN0lISmxkSFZ5YmlCMGFHbHpMbWRsZEVGamRHbHZia2xrT3lCOUlIMHBPMXh1WEc1OUtTZ3BPMXh1WEc1bGVIQnZjblFnWkdWbVlYVnNkQ0JHVTAwN1hHNWNibHh1SWwxOSIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywge1xuXHR2YWx1ZTogdHJ1ZVxufSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF9jb21tb25Mb2dnZXJKcyA9IHJlcXVpcmUoJy4uL2NvbW1vbi9sb2dnZXIuanMnKTtcblxudmFyIF9jb21tb25Mb2dnZXJKczIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9jb21tb25Mb2dnZXJKcyk7XG5cbnZhciBfdXRpbHNEZWZhdWx0ID0gcmVxdWlyZSgnLi4vdXRpbHMvZGVmYXVsdCcpO1xuXG52YXIgX3V0aWxzRGVmYXVsdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91dGlsc0RlZmF1bHQpO1xuXG52YXIgX3V0aWxzTWl4aW4gPSByZXF1aXJlKCcuLi91dGlscy9taXhpbicpO1xuXG52YXIgX3V0aWxzTWl4aW4yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXRpbHNNaXhpbik7XG5cbi8qIGRpc3BhdGNoZXIgc2lnbmFscyAqL1xuXG52YXIgX2NvbW1vbkRpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi9jb21tb24vZGlzcGF0Y2hlcicpO1xuXG4vKiBwcm9taXNlcyAqL1xuXG52YXIgX2NvbW1vblByb21pc2VGYWNhZGUgPSByZXF1aXJlKCcuLi9jb21tb24vcHJvbWlzZUZhY2FkZScpO1xuXG4vKiBjcmVhdGUgY2xhc3MgYW5kIGV4dGVuZCBsb2dnZXIgKi9cbnZhciBUcmFuc2l0aW9uQ29udHJvbGxlciA9IF91dGlsc01peGluMlsnZGVmYXVsdCddKHsgbmFtZTogJ1RyYW5zaXRpb25Db250cm9sbGVyJyB9LCBfY29tbW9uTG9nZ2VySnMyWydkZWZhdWx0J10pO1xuXG4oZnVuY3Rpb24gKCkge1xuXHR2YXIgX3RyYW5pc3Rpb25Db21wbGV0ZSA9IG51bGwsXG5cdCAgICBfb3B0aW9ucyA9IHsgLy8gZGVmYXVsdCBvcHRpb25zXG5cdFx0ZGVidWc6IGZhbHNlLFxuXHRcdHRyYW5zaXRpb25zOiBudWxsXG5cdH07XG5cblx0LyoqXG4gICogdHJhbnNpdGlvbiB0aGUgdmlld3MsIGZpbmQgdGhlIHRyYW5zaXRpb24gbW9kdWxlIGlmIGl0IFxuICAqIGV4aXN0cyB0aGVuIHBhc3MgaW4gdGhlIGxpbmtlZCB2aWV3cywgZGF0YSBhbmQgc2V0dGluZ3NcbiAgKiBcbiAgKiBAcGFyYW0gIHtvbmplY3R9IHRyYW5zaXRpb25PYmogIC0gY29udGFpbnMge3RyYW5zaXRpb25UeXBlLCB2aWV3cywgY3VycmVudFZpZXdJRCwgbmV4dFZpZXdJRH1cbiAgKiBAcGFyYW0gIHthcnJheX0gdmlld3NUb0Rpc3Bvc2UgIC0gYXJyYXkgdG8gc3RvcmUgdGhlIHZpZXdzIHBhc3NlZCB0byBlYWNoIG1vZHVsZSB0byBkaXNwYXRjaCBvbiB0cmFuc2l0aW9uIGNvbXBsZXRlZFxuICAqIEByZXR1cm4ge2FycmF5fSBwcm9taXNlcyBmcm9tIERlZmVycmVkIFxuICAqL1xuXHRmdW5jdGlvbiBfdHJhbnNpdGlvblZpZXdzKHRyYW5zaXRpb25PYmopIHtcblx0XHRpZiAoIXRyYW5zaXRpb25PYmopIHtcblx0XHRcdHJldHVybiBUcmFuc2l0aW9uQ29udHJvbGxlci5lcnJvcigndHJhbnNpdGlvbiBpcyBub3QgZGVmaW5lZCcpO1xuXHRcdH1cblx0XHR2YXIgdHJhbnNpdGlvbk1vZHVsZSA9IF9vcHRpb25zLnRyYW5zaXRpb25zW3RyYW5zaXRpb25PYmoudHJhbnNpdGlvblR5cGVdO1xuXG5cdFx0aWYgKHRyYW5zaXRpb25Nb2R1bGUpIHtcblxuXHRcdFx0dmFyIGRlZmVycmVkID0gX2NvbW1vblByb21pc2VGYWNhZGUuRGVmZXJyZWQoKSxcblx0XHRcdCAgICB2aWV3cyA9IHRyYW5zaXRpb25PYmoudmlld3MsXG5cdFx0XHQgICAgY3VycmVudFZpZXdSZWYgPSB0cmFuc2l0aW9uT2JqLmN1cnJlbnRWaWV3SUQsXG5cdFx0XHQgICAgbmV4dFZpZXdSZWYgPSB0cmFuc2l0aW9uT2JqLm5leHRWaWV3SUQ7XG5cblx0XHRcdC8qIGluZGl2aWR1YWwgdHJhbnNpdGlvbiBjb21wbGV0ZWQgKi9cblx0XHRcdGRlZmVycmVkLnByb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdF9jb21tb25EaXNwYXRjaGVyLnRyYW5zaXRpb25Db21wbGV0ZS5kaXNwYXRjaCh0cmFuc2l0aW9uT2JqKTtcblx0XHRcdFx0VHJhbnNpdGlvbkNvbnRyb2xsZXIubG9nKHRyYW5zaXRpb25PYmoudHJhbnNpdGlvblR5cGUgKyAnIC0tIGNvbXBsZXRlZCcpO1xuXHRcdFx0fSk7XG5cblx0XHRcdGlmICh0cmFuc2l0aW9uTW9kdWxlLmluaXRpYWxpemUpIHtcblx0XHRcdFx0dHJhbnNpdGlvbk1vZHVsZS5pbml0aWFsaXplKHZpZXdzLCB0cmFuc2l0aW9uT2JqLmRhdGEsIGRlZmVycmVkLCBjdXJyZW50Vmlld1JlZiwgbmV4dFZpZXdSZWYpO1xuXHRcdFx0fVxuXG5cdFx0XHRfY29tbW9uRGlzcGF0Y2hlci50cmFuc2l0aW9uU3RhcnRlZC5kaXNwYXRjaCh0cmFuc2l0aW9uT2JqKTtcblx0XHRcdFRyYW5zaXRpb25Db250cm9sbGVyLmxvZyh0cmFuc2l0aW9uT2JqLnRyYW5zaXRpb25UeXBlICsgJyAtLSBzdGFydGVkJyk7XG5cdFx0XHR0cmFuc2l0aW9uTW9kdWxlLmFuaW1hdGUodmlld3MsIGRlZmVycmVkLCBjdXJyZW50Vmlld1JlZiwgbmV4dFZpZXdSZWYpO1xuXG5cdFx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0VHJhbnNpdGlvbkNvbnRyb2xsZXIuZXJyb3IodHJhbnNpdGlvbk9iai50cmFuc2l0aW9uVHlwZSArICcgZG9lcyBOT1QgZXhpc3QnKTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBfcHJlcGFyZUFuZFN0YXJ0KHRyYW5zaXRpb25zKSB7XG5cdFx0dmFyIGluaXRpYWxUcmFuc2lpb24gPSB0cmFuc2l0aW9ucy5zaGlmdCgwKSxcblx0XHQgICAgdHJhbnNpdGlvbnNMZW5ndGggPSB0cmFuc2l0aW9ucy5sZW5ndGg7XG5cblx0XHR2YXIgZGVmZXJyZWRUcmFuc2l0aW9ucyA9IFtdLFxuXHRcdCAgICBpID0gMCxcblx0XHQgICAgdHJhbnNpdGlvbk9iaiA9IHVuZGVmaW5lZDtcblxuXHRcdC8vIGdldCB0aGUgZmlyc3QgdHJhbnNpdGlvbiB0byBwcmV2ZW50IGxvb3BpbmcgdW5uZWNlc3NhcmlseVxuXHRcdGRlZmVycmVkVHJhbnNpdGlvbnMucHVzaChfdHJhbnNpdGlvblZpZXdzKGluaXRpYWxUcmFuc2lpb24pKTtcblxuXHRcdHdoaWxlIChpIDwgdHJhbnNpdGlvbnNMZW5ndGgpIHtcblx0XHRcdHRyYW5zaXRpb25PYmogPSB0cmFuc2l0aW9uc1tpXTtcblx0XHRcdGRlZmVycmVkVHJhbnNpdGlvbnNbZGVmZXJyZWRUcmFuc2l0aW9ucy5sZW5ndGhdID0gX3RyYW5zaXRpb25WaWV3cyh0cmFuc2l0aW9uT2JqKTtcblxuXHRcdFx0KytpO1xuXHRcdH1cblxuXHRcdC8vIGxpc3RlbiBmb3IgY29tcGxldGVkIG1vZHVsZXNcblx0XHRfY29tbW9uUHJvbWlzZUZhY2FkZS5hbGwoZGVmZXJyZWRUcmFuc2l0aW9ucykudGhlbihmdW5jdGlvbiAoKSB7XG5cdFx0XHRUcmFuc2l0aW9uQ29udHJvbGxlci5sb2coJ3RyYW5zaXRpb24gcXVldWUgZW1wdHkgLS0tLSBhbGwgdHJhbnNpdGlvbnMgY29tcGxldGVkJyk7XG5cblx0XHRcdF90cmFuaXN0aW9uQ29tcGxldGUoKTtcblx0XHRcdF9jb21tb25EaXNwYXRjaGVyLmFsbFRyYW5zaXRpb25Db21wbGV0ZWQuZGlzcGF0Y2goKTtcblx0XHR9LCBUcmFuc2l0aW9uQ29udHJvbGxlci5lcnJvcik7XG5cdH1cblxuXHQvKipcbiAgKiByZW1vdmUgYSBtb2R1bGUgYnkgbmFtZSBmcm9tIHRoZSBkaWN0aW9uYXJ5IFxuICAqIG9mIG1vZHVsZXMgaWYgdGhleSBleGlzdFxuICAqIFxuICAqIEBwYXJhbSAge3N0cmluZ30gbW9kdWxlTmFtZSBbXG4gICogQHJldHVybiB7b2JqZWN0fSBUcmFuc2l0aW9uQ29udHJvbGxlclxuICAqL1xuXHRUcmFuc2l0aW9uQ29udHJvbGxlci5yZW1vdmVNb2R1bGUgPSBmdW5jdGlvbiAobW9kdWxlTmFtZSkge1xuXHRcdGlmICghbW9kdWxlTmFtZSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdGlmIChtb2R1bGVOYW1lIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0XHRcdG1vZHVsZU5hbWUuZm9yRWFjaChmdW5jdGlvbiAobW9kdWxlKSB7XG5cdFx0XHRcdHRoaXMucmVtb3ZlTW9kdWxlKG1vZHVsZSk7XG5cdFx0XHR9LCB0aGlzKTtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblxuXHRcdGlmIChfb3B0aW9ucy50cmFuc2l0aW9uc1ttb2R1bGVOYW1lXSkge1xuXHRcdFx0ZGVsZXRlIF9vcHRpb25zLnRyYW5zaXRpb25zW21vZHVsZU5hbWVdO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcbiAgKiBBZGQgbW9kdWxlIGJ5IG5hbWUgXG4gICogQHBhcmFtIHtzdHJpbmcvYXJyYXl9IG1vZHVsZU5hbWUgW2Rlc2NyaXB0aW9uXVxuICAqIEBwYXJhbSB7b2JqZWN0fSBtb2R1bGUgLSB0cmFuc2l0aW9uIG1vZHVsZSBjbGFzc1xuICAqIEByZXR1cm4ge29iamVjdH0gVHJhbnNpdGlvbkNvbnRyb2xsZXJcbiAgKi9cblx0VHJhbnNpdGlvbkNvbnRyb2xsZXIuYWRkTW9kdWxlID0gZnVuY3Rpb24gKG1vZHVsZU5hbWUsIG1vZHVsZSkge1xuXHRcdGlmICghbW9kdWxlTmFtZSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0XHRpZiAobW9kdWxlTmFtZSBpbnN0YW5jZW9mIEFycmF5KSB7XG5cblx0XHRcdG1vZHVsZU5hbWUuZm9yRWFjaChmdW5jdGlvbiAobW9kdWxlRGF0YSkge1xuXHRcdFx0XHR2YXIga2V5ID0gT2JqZWN0LmtleXMobW9kdWxlRGF0YSlbMF07XG5cdFx0XHRcdHRoaXMuYWRkTW9kdWxlKGtleSwgbW9kdWxlRGF0YVtrZXldKTtcblx0XHRcdH0sIHRoaXMpO1xuXG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cblx0XHRpZiAoX29wdGlvbnMudHJhbnNpdGlvbnNbbW9kdWxlTmFtZV0pIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdFx0X29wdGlvbnMudHJhbnNpdGlvbnNbbW9kdWxlTmFtZV0gPSBtb2R1bGU7XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcbiAgKiBzdGFydCBwcm9jZXNzaW5nIHRoZSByZXF1ZXN0ZWQgdHJhbnNpdGlvblxuICAqIEBwYXJhbSAge2FycmF5L29iamVjdH0gLSB0cmFuc2l0aW9uIG9iamVjdHMgb3IgYXJyYXkgb2YgeXRyYW5zaXRpb24gb2JqZWN0c1xuICAqL1xuXHRUcmFuc2l0aW9uQ29udHJvbGxlci5wcm9jZXNzVHJhbnNpdGlvbiA9IGZ1bmN0aW9uICh0cmFuc2l0aW9ucykge1xuXHRcdF9jb21tb25EaXNwYXRjaGVyLmFsbFRyYW5zaXRpb25zU3RhcnRlZC5kaXNwYXRjaCh0cmFuc2l0aW9ucyk7XG5cblx0XHQvLyBwcmVwYXJlIGFuZCBzdGFydCB0aGUgdHJhbnNpdGlvbnNcblx0XHRUcmFuc2l0aW9uQ29udHJvbGxlci5sb2coJy0tIHN0YXJ0IHRyYW5zaXRpb25pbmcgdmlld3MgLS0nKTtcblx0XHRfcHJlcGFyZUFuZFN0YXJ0KHRyYW5zaXRpb25zKTtcblx0fTtcblxuXHQvKipcbiAgKiBpbml0IHRoZSB0cmFuc2l0aW9uIGNvbnRyb2xsZXJcbiAgKiBAcGFyYW0gIHtvYmplY3R9IG9wdGlvbnMgLSBvcHRpb25zIHRvIG92ZXJyaWRlIGRlZmF1bHRzXG4gICovXG5cdFRyYW5zaXRpb25Db250cm9sbGVyLmluaXQgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuXHRcdC8vIGdldCB0cmFuc2l0aW9ucyBmcm9tIGluaXQgb3B0aW9uc1xuXHRcdF91dGlsc0RlZmF1bHQyWydkZWZhdWx0J10oX29wdGlvbnMsIG9wdGlvbnMpO1xuXG5cdFx0VHJhbnNpdGlvbkNvbnRyb2xsZXIuaW5pdExvZ2dlcihfb3B0aW9ucy5kZWJ1Zyk7XG5cdFx0VHJhbnNpdGlvbkNvbnRyb2xsZXIubG9nKCdpbml0aWF0ZWQnKTtcblx0fTtcblxuXHQvKipcbiAgKiBsaW5rIGV4dGVybmFsIG1ldGhpZCB0byBjaGFuZ2UgdGhlIHRyYW5zaXRpb24gY29tcGxldGVkeCBzdGF0ZVxuICAqL1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoVHJhbnNpdGlvbkNvbnRyb2xsZXIsICd0cmFuc2l0aW9uQ29tcGxldGVkJywgeyBzZXQ6IGZ1bmN0aW9uIHNldChtZXRob2QpIHtcblx0XHRcdF90cmFuaXN0aW9uQ29tcGxldGUgPSBtZXRob2Q7XG5cdFx0fSB9KTtcbn0pKCk7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IFRyYW5zaXRpb25Db250cm9sbGVyO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSWk5VmMyVnljeTkwWVd4M2IyOXNaaTlrWlhabGJHOXdaWEl2ZDJWaVVtOXZkQzkwY21GdWMybDBhVzl1TFcxaGJtRm5aWEl2YzNKakwyTnZjbVV2ZEhKaGJuTnBkR2x2YmtOdmJuUnliMnhzWlhJdWFuTWlYU3dpYm1GdFpYTWlPbHRkTENKdFlYQndhVzVuY3lJNklqczdPenM3T3pzN09FSkJRM1ZDTEhGQ1FVRnhRanM3T3pzMFFrRkRha0lzYTBKQlFXdENPenM3T3pCQ1FVTjJRaXhuUWtGQlowSTdPenM3T3p0blEwRlJMMElzYzBKQlFYTkNPenM3TzIxRFFVMTBRaXg1UWtGQmVVSTdPenRCUVVsb1F5eEpRVUZOTEc5Q1FVRnZRaXhIUVVGSExIZENRVUZOTEVWQlFVVXNTVUZCU1N4RlFVRkhMSE5DUVVGelFpeEZRVUZGTERoQ1FVRlZMRU5CUVVNN08wRkJSeTlGTEVOQlFVTXNXVUZEUkR0QlFVTkRMRXRCUVVrc2JVSkJRVzFDTEVkQlFVY3NTVUZCU1R0TFFVVTNRaXhSUVVGUkxFZEJRVWM3UVVGRFZpeFBRVUZMTEVWQlFWRXNTMEZCU3p0QlFVTnNRaXhoUVVGWExFVkJRVXNzU1VGQlNUdEZRVU53UWl4RFFVRkRPenM3T3pzN096czdPMEZCVlVnc1ZVRkJVeXhuUWtGQlowSXNRMEZCUlN4aFFVRmhMRVZCUTNoRE8wRkJRME1zVFVGQlNTeERRVUZETEdGQlFXRXNSVUZCUlR0QlFVRkZMRlZCUVU4c2IwSkJRVzlDTEVOQlFVTXNTMEZCU3l4RFFVRkRMREpDUVVFeVFpeERRVUZETEVOQlFVTTdSMEZCUlR0QlFVTjJSaXhOUVVGTkxHZENRVUZuUWl4SFFVRkhMRkZCUVZFc1EwRkJReXhYUVVGWExFTkJRVVVzWVVGQllTeERRVUZETEdOQlFXTXNRMEZCUlN4RFFVRkRPenRCUVVVNVJTeE5RVUZKTEdkQ1FVRm5RaXhGUVVGSk96dEJRVVYyUWl4UFFVRlBMRkZCUVZFc1IwRkJTeXh4UWtGb1EzUkNMRkZCUVZFc1JVRm5RM2RDTzA5QlF6VkNMRXRCUVVzc1IwRkJUU3hoUVVGaExFTkJRVU1zUzBGQlN6dFBRVU01UWl4alFVRmpMRWRCUVVrc1lVRkJZU3hEUVVGRExHRkJRV0U3VDBGRE4wTXNWMEZCVnl4SFFVRkpMR0ZCUVdFc1EwRkJReXhWUVVGVkxFTkJRVU03T3p0QlFVY3hReXhYUVVGUkxFTkJRVU1zVDBGQlR5eERRVUZETEVsQlFVa3NRMEZCUlN4WlFVRk5PMEZCUXpWQ0xITkNRV2hFU0N4clFrRkJhMElzUTBGblJFa3NVVUZCVVN4RFFVRkZMR0ZCUVdFc1EwRkJSU3hEUVVGRE8wRkJRemRETEhkQ1FVRnZRaXhEUVVGRExFZEJRVWNzUTBGQlJTeGhRVUZoTEVOQlFVTXNZMEZCWXl4SFFVRkZMR1ZCUVdVc1EwRkJReXhEUVVGRE8wbEJRM3BGTEVOQlFVTXNRMEZCUXpzN1FVRkZTQ3hQUVVGSkxHZENRVUZuUWl4RFFVRkRMRlZCUVZVc1JVRkJSVHRCUVVOb1F5eHZRa0ZCWjBJc1EwRkJReXhWUVVGVkxFTkJRVVVzUzBGQlN5eEZRVUZGTEdGQlFXRXNRMEZCUXl4SlFVRkpMRVZCUVVVc1VVRkJVU3hGUVVGRkxHTkJRV01zUlVGQlJTeFhRVUZYTEVOQlFVVXNRMEZCUXp0SlFVTm9SenM3UVVGRlJDeHhRa0YwUkVZc2FVSkJRV2xDTEVOQmMwUkhMRkZCUVZFc1EwRkJSU3hoUVVGaExFTkJRVVVzUTBGQlF6dEJRVU0xUXl4MVFrRkJiMElzUTBGQlF5eEhRVUZITEVOQlFVVXNZVUZCWVN4RFFVRkRMR05CUVdNc1IwRkJSU3hoUVVGaExFTkJRVU1zUTBGQlF6dEJRVU4yUlN4dFFrRkJaMElzUTBGQlF5eFBRVUZQTEVOQlFVVXNTMEZCU3l4RlFVRkZMRkZCUVZFc1JVRkJSU3hqUVVGakxFVkJRVVVzVjBGQlZ5eERRVUZGTEVOQlFVTTdPMEZCUlhwRkxGVkJRVThzVVVGQlVTeERRVUZETEU5QlFVOHNRMEZCUXp0SFFVTjRRaXhOUVVOSk8wRkJRMG9zZFVKQlFXOUNMRU5CUVVNc1MwRkJTeXhEUVVGRExHRkJRV0VzUTBGQlF5eGpRVUZqTEVkQlFVY3NhVUpCUVdsQ0xFTkJRVVVzUTBGQlF6dEhRVU01UlR0RlFVTkVPenRCUVVkRUxGVkJRVk1zWjBKQlFXZENMRU5CUVVVc1YwRkJWeXhGUVVOMFF6dEJRVU5ETEUxQlFVOHNaMEpCUVdkQ0xFZEJRVWtzVjBGQlZ5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNN1RVRkROME1zYVVKQlFXbENMRWRCUVVrc1YwRkJWeXhEUVVGRExFMUJRVTBzUTBGQlF6czdRVUZGTVVNc1RVRkJTeXh0UWtGQmJVSXNSMEZCUnl4RlFVRkZPMDFCUXpOQ0xFTkJRVU1zUjBGQlVTeERRVUZETzAxQlExWXNZVUZCWVN4WlFVRkJMRU5CUVVNN096dEJRVWRvUWl4eFFrRkJiVUlzUTBGQlF5eEpRVUZKTEVOQlFVVXNaMEpCUVdkQ0xFTkJRVVVzWjBKQlFXZENMRU5CUVVVc1EwRkJSU3hEUVVGRE96dEJRVVZxUlN4VFFVRlBMRU5CUVVNc1IwRkJSeXhwUWtGQmFVSXNSVUZETlVJN1FVRkRReXhuUWtGQllTeEhRVUZKTEZkQlFWY3NRMEZCUlN4RFFVRkRMRU5CUVVVc1EwRkJRenRCUVVOc1F5eHpRa0ZCYlVJc1EwRkJSU3h0UWtGQmJVSXNRMEZCUXl4TlFVRk5MRU5CUVVVc1IwRkJSeXhuUWtGQlowSXNRMEZCUlN4aFFVRmhMRU5CUVVVc1EwRkJRenM3UVVGRmRFWXNTMEZCUlN4RFFVRkRMRU5CUVVNN1IwRkRTanM3TzBGQlIwUXNkVUpCYWtaRUxFZEJRVWNzUTBGcFJrY3NiVUpCUVcxQ0xFTkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVVXNXVUZCVFR0QlFVTjBReXgxUWtGQmIwSXNRMEZCUXl4SFFVRkhMRU5CUVVNc2RVUkJRWFZFTEVOQlFVTXNRMEZCUXpzN1FVRkZiRVlzYzBKQlFXMUNMRVZCUVVVc1EwRkJRenRCUVVOMFFpeHhRa0UxUmtZc2MwSkJRWE5DTEVOQk5FWkhMRkZCUVZFc1JVRkJSU3hEUVVGRE8wZEJSV3hETEVWQlFVVXNiMEpCUVc5Q0xFTkJRVU1zUzBGQlN5eERRVUZGTEVOQlFVTTdSVUZGYUVNN096czdPenM3T3p0QlFWTkVMSEZDUVVGdlFpeERRVUZETEZsQlFWa3NSMEZCUnl4VlFVRlZMRlZCUVZVc1JVRkRlRVE3UVVGRFF5eE5RVUZKTEVOQlFVTXNWVUZCVlN4RlFVRkhPMEZCUVVVc1ZVRkJUeXhMUVVGTExFTkJRVU03UjBGQlJUczdRVUZGYmtNc1RVRkJTU3hWUVVGVkxGbEJRVmtzUzBGQlN5eEZRVUZITzBGQlEycERMR0ZCUVZVc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlV5eE5RVUZOTEVWQlFVVTdRVUZEYmtNc1VVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlJTeE5RVUZOTEVOQlFVVXNRMEZCUXp0SlFVTTFRaXhGUVVGRkxFbEJRVWtzUTBGQlJTeERRVUZETzBGQlExWXNWVUZCVHl4SlFVRkpMRU5CUVVNN1IwRkRXanM3UVVGRlJDeE5RVUZMTEZGQlFWRXNRMEZCUXl4WFFVRlhMRU5CUVVVc1ZVRkJWU3hEUVVGRkxFVkJRVWM3UVVGRGVrTXNWVUZCVHl4UlFVRlJMRU5CUVVNc1YwRkJWeXhEUVVGRkxGVkJRVlVzUTBGQlJTeERRVUZETzBkQlF6RkRPMEZCUTBRc1UwRkJUeXhKUVVGSkxFTkJRVU03UlVGRFdpeERRVUZET3pzN096czdPenRCUVZGR0xIRkNRVUZ2UWl4RFFVRkRMRk5CUVZNc1IwRkJSeXhWUVVGVkxGVkJRVlVzUlVGQlJTeE5RVUZOTEVWQlF6ZEVPMEZCUTBNc1RVRkJTU3hEUVVGRExGVkJRVlVzUlVGQlJ6dEJRVUZGTEZWQlFVOHNTMEZCU3l4RFFVRkRPMGRCUVVVN1FVRkRia01zVFVGQlNTeFZRVUZWTEZsQlFWa3NTMEZCU3l4RlFVRkhPenRCUVVWcVF5eGhRVUZWTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVZNc1ZVRkJWU3hGUVVGRk8wRkJRM1pETEZGQlFVa3NSMEZCUnl4SFFVRkhMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU1zVlVGQlZTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1FVRkRja01zVVVGQlNTeERRVUZETEZOQlFWTXNRMEZCUlN4SFFVRkhMRVZCUVVjc1ZVRkJWU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZGTEVOQlFVTTdTVUZEZUVNc1JVRkJSU3hKUVVGSkxFTkJRVVVzUTBGQlF6czdRVUZGVml4VlFVRlBMRWxCUVVrc1EwRkJRenRIUVVOYU96dEJRVVZFTEUxQlFVa3NVVUZCVVN4RFFVRkRMRmRCUVZjc1EwRkJSU3hWUVVGVkxFTkJRVVVzUlVGQlJ6dEJRVUZGTEZWQlFVOHNTMEZCU3l4RFFVRkRPMGRCUVVVN1FVRkRNVVFzVlVGQlVTeERRVUZETEZkQlFWY3NRMEZCUlN4VlFVRlZMRU5CUVVVc1IwRkJSeXhOUVVGTkxFTkJRVU03TzBGQlJUVkRMRk5CUVU4c1NVRkJTU3hEUVVGRE8wVkJRMW9zUTBGQlF6czdPenM3TzBGQlQwWXNjVUpCUVc5Q0xFTkJRVU1zYVVKQlFXbENMRWRCUVVjc1ZVRkJWU3hYUVVGWExFVkJRemxFTzBGQlEwTXNiMEpCZUVwRUxIRkNRVUZ4UWl4RFFYZEtSU3hSUVVGUkxFTkJRVVVzVjBGQlZ5eERRVUZGTEVOQlFVTTdPenRCUVVjNVF5eHpRa0ZCYjBJc1EwRkJReXhIUVVGSExFTkJRVU1zYVVOQlFXbERMRU5CUVVNc1EwRkJRenRCUVVNMVJDeHJRa0ZCWjBJc1EwRkJSU3hYUVVGWExFTkJRVVVzUTBGQlF6dEZRVU5vUXl4RFFVRkRPenM3T3pzN1FVRlBSaXh4UWtGQmIwSXNRMEZCUXl4SlFVRkpMRWRCUVVjc1ZVRkJWU3hQUVVGUExFVkJRemRET3p0QlFVVkRMRFJDUVVGakxGRkJRVkVzUlVGQlJTeFBRVUZQTEVOQlFVVXNRMEZCUXpzN1FVRkZiRU1zYzBKQlFXOUNMRU5CUVVNc1ZVRkJWU3hEUVVGRkxGRkJRVkVzUTBGQlF5eExRVUZMTEVOQlFVVXNRMEZCUXp0QlFVTnNSQ3h6UWtGQmIwSXNRMEZCUXl4SFFVRkhMRU5CUVVNc1YwRkJWeXhEUVVGRExFTkJRVU03UlVGRGRFTXNRMEZCUXpzN096czdRVUZMUml4UFFVRk5MRU5CUVVNc1kwRkJZeXhEUVVGRExHOUNRVUZ2UWl4RlFVRkZMSEZDUVVGeFFpeEZRVUZGTEVWQlFVVXNSMEZCUnl4RlFVRkJMR0ZCUVVVc1RVRkJUU3hGUVVGSE8wRkJRVVVzYzBKQlFXMUNMRWRCUVVjc1RVRkJUU3hEUVVGRE8wZEJRVVVzUlVGQlJ5eERRVUZETEVOQlFVTTdRMEZKZWtnc1EwRkJRU3hGUVVGSExFTkJRVU03TzNGQ1FVbFZMRzlDUVVGdlFpSXNJbVpwYkdVaU9pSXZWWE5sY25NdmRHRnNkMjl2YkdZdlpHVjJaV3h2Y0dWeUwzZGxZbEp2YjNRdmRISmhibk5wZEdsdmJpMXRZVzVoWjJWeUwzTnlZeTlqYjNKbEwzUnlZVzV6YVhScGIyNURiMjUwY205c2JHVnlMbXB6SWl3aWMyOTFjbU5sYzBOdmJuUmxiblFpT2xzaVhHNXBiWEJ2Y25RZ2JHOW5aMlZ5SUNCY2RGeDBYSFJtY205dElDY3VMaTlqYjIxdGIyNHZiRzluWjJWeUxtcHpKenRjYm1sdGNHOXlkQ0JrWldaaGRXeDBVSEp2Y0hNZ0lGeDBabkp2YlNBbkxpNHZkWFJwYkhNdlpHVm1ZWFZzZENjN1hHNXBiWEJ2Y25RZ2JXbDRhVzVjZEZ4MElDQmNkR1p5YjIwZ0p5NHVMM1YwYVd4ekwyMXBlR2x1Snp0Y2JseHVMeW9nWkdsemNHRjBZMmhsY2lCemFXZHVZV3h6SUNvdlhHNXBiWEJ2Y25RZ2UxeHVYSFIwY21GdWMybDBhVzl1UTI5dGNHeGxkR1VzWEc1Y2RHRnNiRlJ5WVc1emFYUnBiMjVEYjIxd2JHVjBaV1FzWEc1Y2RIUnlZVzV6YVhScGIyNVRkR0Z5ZEdWa0xGeHVYSFJoYkd4VWNtRnVjMmwwYVc5dWMxTjBZWEowWldSY2JuMGdabkp2YlNBbkxpNHZZMjl0Ylc5dUwyUnBjM0JoZEdOb1pYSW5PMXh1WEc0dktpQndjbTl0YVhObGN5QXFMMXh1YVcxd2IzSjBJSHNnWEc1Y2RHRnNiQ3hjYmx4MFJHVm1aWEp5WldRc1hHNTlJR1p5YjIwZ0p5NHVMMk52YlcxdmJpOXdjbTl0YVhObFJtRmpZV1JsSnp0Y2JseHVYRzR2S2lCamNtVmhkR1VnWTJ4aGMzTWdZVzVrSUdWNGRHVnVaQ0JzYjJkblpYSWdLaTljYm1OdmJuTjBJRlJ5WVc1emFYUnBiMjVEYjI1MGNtOXNiR1Z5SUQwZ2JXbDRhVzRvZXlCdVlXMWxJRG9nSjFSeVlXNXphWFJwYjI1RGIyNTBjbTlzYkdWeUp5QjlJQ3dnYkc5bloyVnlLVHRjYmx4dVhHNG9ablZ1WTNScGIyNG9LVnh1ZTF4MFhHNWNkR3hsZENCZmRISmhibWx6ZEdsdmJrTnZiWEJzWlhSbElEMGdiblZzYkN4Y2JseHVYSFJjZEY5dmNIUnBiMjV6SUQwZ2V5QXZMeUJrWldaaGRXeDBJRzl3ZEdsdmJuTmNibHgwWEhSY2RHUmxZblZuSUZ4MElGeDBYSFJjZERvZ1ptRnNjMlVzWEc1Y2RGeDBYSFIwY21GdWMybDBhVzl1Y3lCY2RGeDBPaUJ1ZFd4c1hHNWNkRngwZlR0Y2JseHVYSFF2S2lwY2JseDBJQ29nZEhKaGJuTnBkR2x2YmlCMGFHVWdkbWxsZDNNc0lHWnBibVFnZEdobElIUnlZVzV6YVhScGIyNGdiVzlrZFd4bElHbG1JR2wwSUZ4dVhIUWdLaUJsZUdsemRITWdkR2hsYmlCd1lYTnpJR2x1SUhSb1pTQnNhVzVyWldRZ2RtbGxkM01zSUdSaGRHRWdZVzVrSUhObGRIUnBibWR6WEc1Y2RDQXFJRnh1WEhRZ0tpQkFjR0Z5WVcwZ0lIdHZibXBsWTNSOUlIUnlZVzV6YVhScGIyNVBZbW9nSUMwZ1kyOXVkR0ZwYm5NZ2UzUnlZVzV6YVhScGIyNVVlWEJsTENCMmFXVjNjeXdnWTNWeWNtVnVkRlpwWlhkSlJDd2dibVY0ZEZacFpYZEpSSDFjYmx4MElDb2dRSEJoY21GdElDQjdZWEp5WVhsOUlIWnBaWGR6Vkc5RWFYTndiM05sSUNBdElHRnljbUY1SUhSdklITjBiM0psSUhSb1pTQjJhV1YzY3lCd1lYTnpaV1FnZEc4Z1pXRmphQ0J0YjJSMWJHVWdkRzhnWkdsemNHRjBZMmdnYjI0Z2RISmhibk5wZEdsdmJpQmpiMjF3YkdWMFpXUmNibHgwSUNvZ1FISmxkSFZ5YmlCN1lYSnlZWGw5SUhCeWIyMXBjMlZ6SUdaeWIyMGdSR1ZtWlhKeVpXUWdYRzVjZENBcUwxeHVYSFJtZFc1amRHbHZiaUJmZEhKaGJuTnBkR2x2YmxacFpYZHpLQ0IwY21GdWMybDBhVzl1VDJKcUlDbGNibHgwZTF4dVhIUmNkR2xtS0NBaGRISmhibk5wZEdsdmJrOWlhaUFwZXlCeVpYUjFjbTRnVkhKaGJuTnBkR2x2YmtOdmJuUnliMnhzWlhJdVpYSnliM0lvSjNSeVlXNXphWFJwYjI0Z2FYTWdibTkwSUdSbFptbHVaV1FuS1RzZ2ZWeHVYSFJjZEdOdmJuTjBJSFJ5WVc1emFYUnBiMjVOYjJSMWJHVWdQU0JmYjNCMGFXOXVjeTUwY21GdWMybDBhVzl1YzFzZ2RISmhibk5wZEdsdmJrOWlhaTUwY21GdWMybDBhVzl1Vkhsd1pTQmRPMXh1WEhSY2RGeHVYSFJjZEdsbUtDQjBjbUZ1YzJsMGFXOXVUVzlrZFd4bElDa2dJSHRjYmx4dVhIUmNkRngwWTI5dWMzUWdYSFJrWldabGNuSmxaQ0JjZEZ4MFBTQkVaV1psY25KbFpDZ3BMRnh1WEhSY2RGeDBYSFJjZEhacFpYZHpJRngwWEhSY2REMGdkSEpoYm5OcGRHbHZiazlpYWk1MmFXVjNjeXhjYmx4MFhIUmNkRngwWEhSamRYSnlaVzUwVm1sbGQxSmxaaUJjZEQwZ2RISmhibk5wZEdsdmJrOWlhaTVqZFhKeVpXNTBWbWxsZDBsRUxGeHVYSFJjZEZ4MFhIUmNkRzVsZUhSV2FXVjNVbVZtSUZ4MFBTQjBjbUZ1YzJsMGFXOXVUMkpxTG01bGVIUldhV1YzU1VRN1hHNWNibHgwWEhSY2RDOHFJR2x1WkdsMmFXUjFZV3dnZEhKaGJuTnBkR2x2YmlCamIyMXdiR1YwWldRZ0tpOWNibHgwWEhSY2RHUmxabVZ5Y21Wa0xuQnliMjFwYzJVdWRHaGxiaWdnS0NrZ1BUNGdlMXh1WEhSY2RGeDBYSFIwY21GdWMybDBhVzl1UTI5dGNHeGxkR1V1WkdsemNHRjBZMmdvSUhSeVlXNXphWFJwYjI1UFltb2dLVHRjYmx4MFhIUmNkRngwVkhKaGJuTnBkR2x2YmtOdmJuUnliMnhzWlhJdWJHOW5LQ0IwY21GdWMybDBhVzl1VDJKcUxuUnlZVzV6YVhScGIyNVVlWEJsSUNzbklDMHRJR052YlhCc1pYUmxaQ2NwTzF4dVhIUmNkRngwZlNrN1hHNWNibHgwWEhSY2RHbG1LQ0IwY21GdWMybDBhVzl1VFc5a2RXeGxMbWx1YVhScFlXeHBlbVVnS1h0Y2JseDBYSFJjZEZ4MGRISmhibk5wZEdsdmJrMXZaSFZzWlM1cGJtbDBhV0ZzYVhwbEtDQjJhV1YzY3l3Z2RISmhibk5wZEdsdmJrOWlhaTVrWVhSaExDQmtaV1psY25KbFpDd2dZM1Z5Y21WdWRGWnBaWGRTWldZc0lHNWxlSFJXYVdWM1VtVm1JQ2s3WEc1Y2RGeDBYSFI5WEc1Y2JseDBYSFJjZEhSeVlXNXphWFJwYjI1VGRHRnlkR1ZrTG1ScGMzQmhkR05vS0NCMGNtRnVjMmwwYVc5dVQySnFJQ2s3WEc1Y2RGeDBYSFJVY21GdWMybDBhVzl1UTI5dWRISnZiR3hsY2k1c2IyY29JSFJ5WVc1emFYUnBiMjVQWW1vdWRISmhibk5wZEdsdmJsUjVjR1VnS3ljZ0xTMGdjM1JoY25SbFpDY3BPMXh1WEhSY2RGeDBkSEpoYm5OcGRHbHZiazF2WkhWc1pTNWhibWx0WVhSbEtDQjJhV1YzY3l3Z1pHVm1aWEp5WldRc0lHTjFjbkpsYm5SV2FXVjNVbVZtTENCdVpYaDBWbWxsZDFKbFppQXBPMXh1WEhSY2RGeDBYRzVjZEZ4MFhIUnlaWFIxY200Z1pHVm1aWEp5WldRdWNISnZiV2x6WlR0Y2JseDBYSFI5WEc1Y2RGeDBaV3h6WlNCN1hHNWNkRngwWEhSVWNtRnVjMmwwYVc5dVEyOXVkSEp2Ykd4bGNpNWxjbkp2Y2loMGNtRnVjMmwwYVc5dVQySnFMblJ5WVc1emFYUnBiMjVVZVhCbElDc2dKeUJrYjJWeklFNVBWQ0JsZUdsemRDY2dLVHRjYmx4MFhIUjlYRzVjZEgxY2JseHVYRzVjZEdaMWJtTjBhVzl1SUY5d2NtVndZWEpsUVc1a1UzUmhjblFvSUhSeVlXNXphWFJwYjI1eklDbGNibHgwZTF4dVhIUmNkR052Ym5OMElGeDBhVzVwZEdsaGJGUnlZVzV6YVdsdmJpQmNkRDBnZEhKaGJuTnBkR2x2Ym5NdWMyaHBablFvTUNrc1hHNWNkRngwWEhSY2RIUnlZVzV6YVhScGIyNXpUR1Z1WjNSb0lGeDBQU0IwY21GdWMybDBhVzl1Y3k1c1pXNW5kR2c3WEc1Y2RGeDBYRzVjZEZ4MGJHVjBJRngwWkdWbVpYSnlaV1JVY21GdWMybDBhVzl1Y3lBOUlGdGRMRnh1WEhSY2RGeDBYSFJwSUZ4MFhIUmNkRngwWEhROUlEQXNYRzVjZEZ4MFhIUmNkSFJ5WVc1emFYUnBiMjVQWW1vN1hHNWNibHgwWEhRdkx5Qm5aWFFnZEdobElHWnBjbk4wSUhSeVlXNXphWFJwYjI0Z2RHOGdjSEpsZG1WdWRDQnNiMjl3YVc1bklIVnVibVZqWlhOellYSnBiSGxjYmx4MFhIUmtaV1psY25KbFpGUnlZVzV6YVhScGIyNXpMbkIxYzJnb0lGOTBjbUZ1YzJsMGFXOXVWbWxsZDNNb0lHbHVhWFJwWVd4VWNtRnVjMmxwYjI0Z0tTQXBPMXh1WEc1Y2RGeDBkMmhwYkdVb0lHa2dQQ0IwY21GdWMybDBhVzl1YzB4bGJtZDBhQ0FwWEc1Y2RGeDBlMXh1WEhSY2RGeDBkSEpoYm5OcGRHbHZiazlpYWlCY2REMGdkSEpoYm5OcGRHbHZibk5iSUdrZ1hUdGNibHgwWEhSY2RHUmxabVZ5Y21Wa1ZISmhibk5wZEdsdmJuTmJJR1JsWm1WeWNtVmtWSEpoYm5OcGRHbHZibk11YkdWdVozUm9JRjBnUFNCZmRISmhibk5wZEdsdmJsWnBaWGR6S0NCMGNtRnVjMmwwYVc5dVQySnFJQ2s3WEc1Y2JseDBYSFJjZENzcmFUdGNibHgwWEhSOVhHNWNibHgwWEhRdkx5QnNhWE4wWlc0Z1ptOXlJR052YlhCc1pYUmxaQ0J0YjJSMWJHVnpYRzVjZEZ4MFlXeHNLQ0JrWldabGNuSmxaRlJ5WVc1emFYUnBiMjV6SUNrdWRHaGxiaWdnS0NrZ1BUNGdlMXh1WEhSY2RGeDBWSEpoYm5OcGRHbHZia052Ym5SeWIyeHNaWEl1Ykc5bktDZDBjbUZ1YzJsMGFXOXVJSEYxWlhWbElHVnRjSFI1SUMwdExTMGdZV3hzSUhSeVlXNXphWFJwYjI1eklHTnZiWEJzWlhSbFpDY3BPMXh1WEc1Y2RGeDBYSFJmZEhKaGJtbHpkR2x2YmtOdmJYQnNaWFJsS0NrN1hHNWNkRngwWEhSaGJHeFVjbUZ1YzJsMGFXOXVRMjl0Y0d4bGRHVmtMbVJwYzNCaGRHTm9LQ2s3WEc1Y2JseDBYSFI5TENCVWNtRnVjMmwwYVc5dVEyOXVkSEp2Ykd4bGNpNWxjbkp2Y2lBcE8xeHVYRzVjZEgxY2JseHVYSFF2S2lwY2JseDBJQ29nY21WdGIzWmxJR0VnYlc5a2RXeGxJR0o1SUc1aGJXVWdabkp2YlNCMGFHVWdaR2xqZEdsdmJtRnllU0JjYmx4MElDb2diMllnYlc5a2RXeGxjeUJwWmlCMGFHVjVJR1Y0YVhOMFhHNWNkQ0FxSUZ4dVhIUWdLaUJBY0dGeVlXMGdJSHR6ZEhKcGJtZDlJRzF2WkhWc1pVNWhiV1VnVzF4dVhIUWdLaUJBY21WMGRYSnVJSHR2WW1wbFkzUjlJRlJ5WVc1emFYUnBiMjVEYjI1MGNtOXNiR1Z5WEc1Y2RDQXFMMXh1WEhSVWNtRnVjMmwwYVc5dVEyOXVkSEp2Ykd4bGNpNXlaVzF2ZG1WTmIyUjFiR1VnUFNCbWRXNWpkR2x2YmlnZ2JXOWtkV3hsVG1GdFpTQXBYRzVjZEh0Y2JseDBYSFJwWmlnZ0lXMXZaSFZzWlU1aGJXVWdLU0I3SUhKbGRIVnliaUJtWVd4elpUc2dmVnh1WEc1Y2RGeDBhV1lvSUcxdlpIVnNaVTVoYldVZ2FXNXpkR0Z1WTJWdlppQkJjbkpoZVNBcElIdGNibHgwWEhSY2RHMXZaSFZzWlU1aGJXVXVabTl5UldGamFDaG1kVzVqZEdsdmJpaHRiMlIxYkdVcElIdGNibHgwWEhSY2RGeDBkR2hwY3k1eVpXMXZkbVZOYjJSMWJHVW9JRzF2WkhWc1pTQXBPMXh1WEhSY2RGeDBmU3dnZEdocGN5QXBPMXh1WEhSY2RGeDBjbVYwZFhKdUlIUm9hWE03WEc1Y2RGeDBmVnh1WEhSY2RGeHVYSFJjZEdsbUtDQWdYMjl3ZEdsdmJuTXVkSEpoYm5OcGRHbHZibk5iSUcxdlpIVnNaVTVoYldVZ1hTQXBJSHRjYmx4MFhIUmNkR1JsYkdWMFpTQmZiM0IwYVc5dWN5NTBjbUZ1YzJsMGFXOXVjMXNnYlc5a2RXeGxUbUZ0WlNCZE8xeHVYSFJjZEgxY2JseDBYSFJ5WlhSMWNtNGdkR2hwY3p0Y2JseDBmVHRjYmx4dVhIUXZLaXBjYmx4MElDb2dRV1JrSUcxdlpIVnNaU0JpZVNCdVlXMWxJRnh1WEhRZ0tpQkFjR0Z5WVcwZ2UzTjBjbWx1Wnk5aGNuSmhlWDBnYlc5a2RXeGxUbUZ0WlNCYlpHVnpZM0pwY0hScGIyNWRYRzVjZENBcUlFQndZWEpoYlNCN2IySnFaV04wZlNCdGIyUjFiR1VnTFNCMGNtRnVjMmwwYVc5dUlHMXZaSFZzWlNCamJHRnpjMXh1WEhRZ0tpQkFjbVYwZFhKdUlIdHZZbXBsWTNSOUlGUnlZVzV6YVhScGIyNURiMjUwY205c2JHVnlYRzVjZENBcUwxeHVYSFJVY21GdWMybDBhVzl1UTI5dWRISnZiR3hsY2k1aFpHUk5iMlIxYkdVZ1BTQm1kVzVqZEdsdmJpZ2diVzlrZFd4bFRtRnRaU3dnYlc5a2RXeGxJQ2xjYmx4MGUxeHVYSFJjZEdsbUtDQWhiVzlrZFd4bFRtRnRaU0FwSUhzZ2NtVjBkWEp1SUdaaGJITmxPeUI5WEc1Y2RGeDBhV1lvSUcxdlpIVnNaVTVoYldVZ2FXNXpkR0Z1WTJWdlppQkJjbkpoZVNBcElIdGNibHgwWEhSY2RGeHVYSFJjZEZ4MGJXOWtkV3hsVG1GdFpTNW1iM0pGWVdOb0tHWjFibU4wYVc5dUtHMXZaSFZzWlVSaGRHRXBJSHRjYmx4MFhIUmNkRngwYkdWMElHdGxlU0E5SUU5aWFtVmpkQzVyWlhsektHMXZaSFZzWlVSaGRHRXBXekJkTzF4dVhIUmNkRngwWEhSMGFHbHpMbUZrWkUxdlpIVnNaU2dnYTJWNUlDd2diVzlrZFd4bFJHRjBZVnRyWlhsZElDazdYRzVjZEZ4MFhIUjlMQ0IwYUdseklDazdYRzVjYmx4MFhIUmNkSEpsZEhWeWJpQjBhR2x6TzF4dVhIUmNkSDFjYmx4dVhIUmNkR2xtS0NCZmIzQjBhVzl1Y3k1MGNtRnVjMmwwYVc5dWMxc2diVzlrZFd4bFRtRnRaU0JkSUNrZ2V5QnlaWFIxY200Z1ptRnNjMlU3SUgxY2JseDBYSFJmYjNCMGFXOXVjeTUwY21GdWMybDBhVzl1YzFzZ2JXOWtkV3hsVG1GdFpTQmRJRDBnYlc5a2RXeGxPMXh1WEc1Y2RGeDBjbVYwZFhKdUlIUm9hWE03WEc1Y2RIMDdYRzVjYmx4dVhIUXZLaXBjYmx4MElDb2djM1JoY25RZ2NISnZZMlZ6YzJsdVp5QjBhR1VnY21WeGRXVnpkR1ZrSUhSeVlXNXphWFJwYjI1Y2JseDBJQ29nUUhCaGNtRnRJQ0I3WVhKeVlYa3ZiMkpxWldOMGZTQXRJSFJ5WVc1emFYUnBiMjRnYjJKcVpXTjBjeUJ2Y2lCaGNuSmhlU0J2WmlCNWRISmhibk5wZEdsdmJpQnZZbXBsWTNSelhHNWNkQ0FxTDF4dVhIUlVjbUZ1YzJsMGFXOXVRMjl1ZEhKdmJHeGxjaTV3Y205alpYTnpWSEpoYm5OcGRHbHZiaUE5SUdaMWJtTjBhVzl1S0NCMGNtRnVjMmwwYVc5dWN5QXBYRzVjZEh0Y2JseDBYSFJoYkd4VWNtRnVjMmwwYVc5dWMxTjBZWEowWldRdVpHbHpjR0YwWTJnb0lIUnlZVzV6YVhScGIyNXpJQ2s3WEc1Y2JseDBYSFF2THlCd2NtVndZWEpsSUdGdVpDQnpkR0Z5ZENCMGFHVWdkSEpoYm5OcGRHbHZibk5jYmx4MFhIUlVjbUZ1YzJsMGFXOXVRMjl1ZEhKdmJHeGxjaTVzYjJjb0p5MHRJSE4wWVhKMElIUnlZVzV6YVhScGIyNXBibWNnZG1sbGQzTWdMUzBuS1R0Y2JseDBYSFJmY0hKbGNHRnlaVUZ1WkZOMFlYSjBLQ0IwY21GdWMybDBhVzl1Y3lBcE8xeHVYSFI5TzF4dVhHNWNibHgwTHlvcVhHNWNkQ0FxSUdsdWFYUWdkR2hsSUhSeVlXNXphWFJwYjI0Z1kyOXVkSEp2Ykd4bGNseHVYSFFnS2lCQWNHRnlZVzBnSUh0dlltcGxZM1I5SUc5d2RHbHZibk1nTFNCdmNIUnBiMjV6SUhSdklHOTJaWEp5YVdSbElHUmxabUYxYkhSelhHNWNkQ0FxTDF4dVhIUlVjbUZ1YzJsMGFXOXVRMjl1ZEhKdmJHeGxjaTVwYm1sMElEMGdablZ1WTNScGIyNG9JRzl3ZEdsdmJuTWdLVnh1WEhSN1hHNWNkRngwTHk4Z1oyVjBJSFJ5WVc1emFYUnBiMjV6SUdaeWIyMGdhVzVwZENCdmNIUnBiMjV6WEc1Y2RGeDBaR1ZtWVhWc2RGQnliM0J6S0NCZmIzQjBhVzl1Y3l3Z2IzQjBhVzl1Y3lBcE8xeHVYRzVjZEZ4MFZISmhibk5wZEdsdmJrTnZiblJ5YjJ4c1pYSXVhVzVwZEV4dloyZGxjaWdnWDI5d2RHbHZibk11WkdWaWRXY2dLVHRjYmx4MFhIUlVjbUZ1YzJsMGFXOXVRMjl1ZEhKdmJHeGxjaTVzYjJjb0oybHVhWFJwWVhSbFpDY3BPMXh1WEhSOU8xeHVYRzVjZEM4cUtseHVYSFFnS2lCc2FXNXJJR1Y0ZEdWeWJtRnNJRzFsZEdocFpDQjBieUJqYUdGdVoyVWdkR2hsSUhSeVlXNXphWFJwYjI0Z1kyOXRjR3hsZEdWa2VDQnpkR0YwWlZ4dVhIUWdLaTljYmx4MFQySnFaV04wTG1SbFptbHVaVkJ5YjNCbGNuUjVLRlJ5WVc1emFYUnBiMjVEYjI1MGNtOXNiR1Z5TENBbmRISmhibk5wZEdsdmJrTnZiWEJzWlhSbFpDY3NJSHNnYzJWMEtDQnRaWFJvYjJRZ0tTQjdJRjkwY21GdWFYTjBhVzl1UTI5dGNHeGxkR1VnUFNCdFpYUm9iMlE3SUgwZ0lIMHBPMXh1WEc1Y2JseHVmU2tvS1R0Y2JseHVYRzVjYm1WNGNHOXlkQ0JrWldaaGRXeDBJRlJ5WVc1emFYUnBiMjVEYjI1MGNtOXNiR1Z5T3lKZGZRPT0iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHtcblx0dmFsdWU6IHRydWVcbn0pO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfY29tbW9uTG9nZ2VySnMgPSByZXF1aXJlKCcuLi9jb21tb24vbG9nZ2VyLmpzJyk7XG5cbnZhciBfY29tbW9uTG9nZ2VySnMyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfY29tbW9uTG9nZ2VySnMpO1xuXG52YXIgX3V0aWxzRGVmYXVsdCA9IHJlcXVpcmUoJy4uL3V0aWxzL2RlZmF1bHQnKTtcblxudmFyIF91dGlsc0RlZmF1bHQyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXRpbHNEZWZhdWx0KTtcblxudmFyIF91dGlsc01peGluID0gcmVxdWlyZSgnLi4vdXRpbHMvbWl4aW4nKTtcblxudmFyIF91dGlsc01peGluMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3V0aWxzTWl4aW4pO1xuXG52YXIgX2NvbW1vblByb21pc2VGYWNhZGUgPSByZXF1aXJlKCcuLi9jb21tb24vcHJvbWlzZUZhY2FkZScpO1xuXG4vKiBjcmVhdGUgY2xhc3MgYW5kIGV4dGVuZCBsb2dnZXIgKi9cbnZhciBUVk0gPSBfdXRpbHNNaXhpbjJbJ2RlZmF1bHQnXSh7IG5hbWU6ICdUcmFuc2l0aW9uVmlld01hbmFnZXInIH0sIF9jb21tb25Mb2dnZXJKczJbJ2RlZmF1bHQnXSk7XG5cbihmdW5jdGlvbiAoKSB7XG5cblx0dmFyIF92aWV3c1JlYWR5TWV0aG9kID0gbnVsbCxcblx0ICAgIHZpZXdDYWNoZSA9IHt9LFxuXHQgICBcblxuXHQvLyBvcHRpb25zIHdpdGggZGVmYXVsdHNcblx0X29wdGlvbnMgPSB7XG5cdFx0Y29uZmlnOiBudWxsLFxuXHRcdHZpZXdNYW5hZ2VyOiBudWxsLFxuXHRcdGRlYnVnOiBmYWxzZSxcblx0XHR1c2VDYWNoZTogZmFsc2Vcblx0fTtcblxuXHQvKipcbiAgKiBsb29wIHRocm91Z2ggYWxsIHRyYW5zaXRpb24gbW9kdWxlcyBhbmQgcHJlcGFyZSB0aGVcbiAgKiB2aWV3cyByZXF1ZXN0ZWQgYnkgdGhlIGNvbmZpZ1xuICAqIFxuICAqIEBwYXJhbSAge29iamVjdH0gYWN0aW9uRGF0YSBjb250YWluaW5nIGFsbCB0cmFuc2l0aW9uIHR5cGVzIGFuZCB2aWV3cyByZXF1aXJlZFxuICAqIEBwYXJhbSAge29iamVjdH0gcGFyYW1EYXRhIHNlbnQgd2l0aCB0aGUgYWN0aW9uXG4gICogQHJldHVybiB7b2JqZWN0fSBwcm9taXNlcyBhcnJheSBhbmQgcGVwYXJlZCB2aWV3cyBhcnJheVxuICAqL1xuXHRmdW5jdGlvbiBfcHJlcGFyZVZpZXdzKGFjdGlvbkRhdGEsIHBhcmFtRGF0YSkge1xuXHRcdHZhciBsaW5rZWRUcmFuc3NNb2R1bGVzID0gYWN0aW9uRGF0YS5saW5rZWRWVHJhbnNNb2R1bGVzLFxuXHRcdCAgICAvLyBsb29rIGludG8gc2xpY2Ugc3BlZWQgb3ZlciBjcmVhdGluZyBuZXcgYXJyYXlcblx0XHRWaWV3c01vZHVsZUxlbmd0aCA9IGxpbmtlZFRyYW5zc01vZHVsZXMubGVuZ3RoLFxuXHRcdCAgICBwcm9taXNlcyA9IFtdLFxuXHRcdCAgICBwcmVwYXJlZFZpZXdzID0gW10sXG5cdFx0ICAgIGFjdGlvbkRhdGFDbG9uZSA9IG51bGwsXG5cdFx0ICAgIHZpZXdDYWNoZSA9IHt9LFxuXHRcdCAgICBpID0gMCxcblx0XHQgICAgdmlld3NNb2R1bGVPYmplY3QgPSB1bmRlZmluZWQ7XG5cblx0XHR3aGlsZSAoaSA8IFZpZXdzTW9kdWxlTGVuZ3RoKSB7XG5cdFx0XHR2aWV3c01vZHVsZU9iamVjdCA9IGxpbmtlZFRyYW5zc01vZHVsZXNbaV07XG5cdFx0XHRhY3Rpb25EYXRhQ2xvbmUgPSBfY2xvbmVWaWV3U3RhdGUoYWN0aW9uRGF0YSwgdmlld3NNb2R1bGVPYmplY3QsIHBhcmFtRGF0YSk7XG5cdFx0XHRwcmVwYXJlZFZpZXdzW3ByZXBhcmVkVmlld3MubGVuZ3RoXSA9IF9mZXRjaFZpZXdzKHZpZXdzTW9kdWxlT2JqZWN0LnZpZXdzLCBhY3Rpb25EYXRhQ2xvbmUsIHByb21pc2VzLCB2aWV3Q2FjaGUpO1xuXG5cdFx0XHQrK2k7XG5cdFx0fVxuXG5cdFx0dmlld0NhY2hlID0gbnVsbDtcblx0XHRyZXR1cm4geyBwcm9taXNlczogcHJvbWlzZXMsIHByZXBhcmVkVmlld3M6IHByZXBhcmVkVmlld3MgfTtcblx0fVxuXG5cdC8qKlxuICAqIGxvb3AgdGhyb3VnaCBhbmQgZmV0Y2ggYWxsIHRoZSByZXF1ZXN0ZWQgdmlld3MsIHVzZSB2aWV3UmVhZHlcbiAgKiBhbmQgY29sbGVjdCBhIHByb21pc2UgZm9yIGVhY2ggdG8gYWxsb3cgdGhlIHZpZXcgdG8gYnVpbGQgdXAgYW5kIHBlcmZvcm0gXG4gICogaXRzIHByZXBlcmF0aW9uIHRhc2tzIGlmIHJlcXVpcmVkXG4gICogXG4gICogQHBhcmFtICB7YXJyYXl9IHZpZXdzIC0gc3RyaW5nIHJlZmVyZW5jZXNcbiAgKiBAcGFyYW0gIHtvYmplY3R9IGFjdGlvbkRhdGFDbG9uZSAtIGNsb25lZCBkYXRhIGFzIHRvIG5vdCBvdmVycmlkZSBjb25maWdcbiAgKiBAcGFyYW0gIHthcnJheX0gcHJvbWlzZXMgLSBjb2xsZWN0IGFsbCB2aWV3IHByb21pc2VzXG4gICogQHBhcmFtICB7b2JqZWN0fSB2aWV3Q2FjaGUgLSBwcmV2ZW50cyB2aWV3cyBmcm9tIGJlaW5nIGluc3RhbnRpYXRlZCBhbmQgcmVxdWVzdGVkIG1vcmUgdGhhbiBvbmNlXG4gICogQHJldHVybiB7b2JqZWN0fSBwb3B1bGF0ZWQgYWN0aW9uRGF0YUNsb25lIGRhdGEgb2JqZWN0XG4gICovXG5cdGZ1bmN0aW9uIF9mZXRjaFZpZXdzKHZpZXdzVG9QcmVwYXJlLCBhY3Rpb25EYXRhQ2xvbmUsIHByb21pc2VzLCB2aWV3Q2FjaGUpIHtcblx0XHR2YXIgdmlld3MgPSB2aWV3c1RvUHJlcGFyZSxcblx0XHQgICAgdmlld01hbmFnZXIgPSBfb3B0aW9ucy52aWV3TWFuYWdlcixcblx0XHQgICAgbGVuZ3RoID0gdmlld3MubGVuZ3RoLFxuXHRcdCAgICBjdXJyZW50Vmlld0lEID0gYWN0aW9uRGF0YUNsb25lLmN1cnJlbnRWaWV3SUQsXG5cdFx0ICAgIG5leHRWaWV3SUQgPSBhY3Rpb25EYXRhQ2xvbmUubmV4dFZpZXdJRDtcblxuXHRcdHZhciBpID0gMCxcblx0XHQgICAgX2RlZmVycmVkID0gdW5kZWZpbmVkLFxuXHRcdCAgICB2aWV3ID0gdW5kZWZpbmVkLFxuXHRcdCAgICBmb3VuZFZpZXcgPSB1bmRlZmluZWQsXG5cdFx0ICAgIHBhcnNlZFJlZiA9IHVuZGVmaW5lZCxcblx0XHQgICAgdmlld1JlZiA9IHVuZGVmaW5lZDtcblxuXHRcdHdoaWxlIChpIDwgbGVuZ3RoKSB7XG5cdFx0XHR2aWV3UmVmID0gdmlld3NbaV07XG5cblx0XHRcdGlmICh2aWV3UmVmKSB7XG5cdFx0XHRcdGZvdW5kVmlldyA9IHZpZXdDYWNoZVt2aWV3UmVmXTtcblxuXHRcdFx0XHRpZiAoIWZvdW5kVmlldykge1xuXHRcdFx0XHRcdC8vIGNhY2hlIHRoZSB2aWV3IGluc3RhbmNlIGZvciByZXVzZSBpZiBuZWVkZWRcblx0XHRcdFx0XHRmb3VuZFZpZXcgPSB2aWV3Q2FjaGVbdmlld1JlZl0gPSB2aWV3TWFuYWdlci5mZXRjaFZpZXcodmlld1JlZik7XG5cdFx0XHRcdFx0X2RlZmVycmVkID0gX2NvbW1vblByb21pc2VGYWNhZGUuRGVmZXJyZWQoKTtcblx0XHRcdFx0XHRwcm9taXNlc1twcm9taXNlcy5sZW5ndGhdID0gX2RlZmVycmVkLnByb21pc2U7XG5cblx0XHRcdFx0XHRpZiAoIWZvdW5kVmlldykge1xuXHRcdFx0XHRcdFx0cmV0dXJuIFRWTS5lcnJvcih2aWV3UmVmICsgJyBpcyB1bmRlZmluZWQnKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoZm91bmRWaWV3LnByZXBhcmVWaWV3KSB7XG5cdFx0XHRcdFx0XHRmb3VuZFZpZXcucHJlcGFyZVZpZXcoX2RlZmVycmVkKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0X2RlZmVycmVkLnJlc29sdmUoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2aWV3ID0gZm91bmRWaWV3O1xuXG5cdFx0XHRcdC8qIGNoYW5nZSByZWYgdG8gY3VycmVudCB2aWV3IG9yIG5leHQgdmlldyB0byBhbGxvdyBnZW5lcmFsIHRyYW5zaXRpb25zICovXG5cdFx0XHRcdHBhcnNlZFJlZiA9IF92aWV3UmVmKHZpZXdSZWYsIFtjdXJyZW50Vmlld0lELCBuZXh0Vmlld0lEXSk7XG5cdFx0XHRcdGlmIChwYXJzZWRSZWYpIHtcblx0XHRcdFx0XHRhY3Rpb25EYXRhQ2xvbmUudmlld3NbcGFyc2VkUmVmXSA9IHZpZXc7XG5cdFx0XHRcdH1cblx0XHRcdFx0YWN0aW9uRGF0YUNsb25lLnZpZXdzW3ZpZXdSZWZdID0gdmlldztcblx0XHRcdH1cblxuXHRcdFx0KytpO1xuXHRcdH1cblxuXHRcdHJldHVybiBhY3Rpb25EYXRhQ2xvbmU7XG5cdH1cblxuXHQvKipcbiAgKiBjb252ZXJ0IHZpZXcgbmFtZWQgcmVmZXJlbmNlcyB0byBlaXRoZXIgY3VycmVudCB2aWV3XG4gICogb3IgbmV4dCB2aWV3IGlmIHRoZSBJRCdzIG1hdGNoXG4gICogTWFrZXMgaXQgZWFzaWVyIHRvIGFjY2VzcyBhbmQgYnVpbGQgZ2VuZXJpYyB1c2UgY2FzZXNcbiAgKiBcbiAgKiBAcGFyYW0gIHtzdHJpbmd9IHJlZiBjdXJyZW50IFZpZXcgSURcbiAgKiBAcGFyYW0gIHthcnJheX0gY29tcGFyaXNvblZpZXdzIC0gY3VycmVudFZpZXcgYW5kIG5leHRWaWV3IHN0cmluZyBJRFNcbiAgKiBAcmV0dXJuIHtzdHJpbmd9IC0gbmV3IElEUyBpZiBtYXRjaGVkXG4gICovXG5cdGZ1bmN0aW9uIF92aWV3UmVmKHJlZiwgY29tcGFyaXNvblZpZXdzKSB7XG5cdFx0dmFyIGluZGV4ID0gY29tcGFyaXNvblZpZXdzLmluZGV4T2YocmVmKTtcblx0XHRyZXR1cm4gaW5kZXggPT09IC0xID8gbnVsbCA6IFsnY3VycmVudFZpZXcnLCAnbmV4dFZpZXcnXVtpbmRleF07XG5cdH1cblxuXHQvKipcbiAgKiByZXR1cm4gY2FjaGVkIHZpZXdzIGJhc2VkIG9uIGFjdGlvbiB0eXBlXG4gICogQHBhcmFtICB7YXJyYXl9IGNhY2hlZCAtIHByZXZpb3VzbHkgcHJlcGFyZWQgdmlld3NcbiAgKiBAcGFyYW0gIHtvYmplY3R9IGRhdGEgLSBhY3Rpb24gZGF0YSBwYXNzZWQgdGhyb3VnaCB3aXRoIGFjdGlvblxuICAqIEByZXR1cm4ge2FycmF5fSAtIGNhY2hlZCB2aWV3c1xuICAqL1xuXHRmdW5jdGlvbiBfZ2V0Q2FjaGVkKGNhY2hlZCwgZGF0YSkge1xuXHRcdGlmICghZGF0YSkge1xuXHRcdFx0cmV0dXJuIGNhY2hlZDtcblx0XHR9XG5cblx0XHR2YXIgaSA9IC0xLFxuXHRcdCAgICBsZW4gPSBjYWNoZWQubGVuZ3RoO1xuXHRcdHdoaWxlICgrK2kgPCBsZW4pIHtcblx0XHRcdGNhY2hlZFtpXS5kYXRhID0gZGF0YTtcblx0XHR9XG5cdFx0cmV0dXJuIGNhY2hlZDtcblx0fVxuXG5cdC8qKlxuICAqIGNsb25lIHRoZSBhY3Rpb24gZGF0YSBvYmplY3RcbiAgKiBmYXN0IGNsb25lIGFuZCBwcmV2ZW50cyB0aGUgY29uZmlnIHJlZmVyZW5jZXMgdG8gYmVcbiAgKiBvd2VyaWRlbiBieSBpbnN0YW5jZXMgb3Igb3RoZXIgc2V0dGluZ3NcbiAgKiBAcGFyYW0gIHtvYmplY3R9IGFjdGlvbkRhdGEgcGFzc2VkIGluIGZyb20gdGhlIGNvbmZpZ1xuICAqIEBwYXJhbSAge29iamVjdH0gdHJhbnNpdGlvbk9iamVjdCAtIGFjdGlvbiBkYXRhIHRyYW5zaXRpb25cbiAgKiBAcGFyYW0gIHtvYmplY3R9IHBhcmFtRGF0YSBzZW50IHdpdGggdGhlIGFjdGlvblxuICAqIEByZXR1cm4ge29iamVjdH0gbmV3IG9iamVjdCB3aXRoIGFuIGluc3RhbmNlIG9yIHJlZmVyZW5jZSBmcm9tIHRoZSBwYXJhbXNcbiAgKi9cblx0ZnVuY3Rpb24gX2Nsb25lVmlld1N0YXRlKGFjdGlvbkRhdGEsIHRyYW5zaXRpb25PYmplY3QsIHBhcmFtRGF0YSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRkYXRhOiBwYXJhbURhdGEsXG5cdFx0XHRjdXJyZW50Vmlld0lEOiBhY3Rpb25EYXRhLmN1cnJlbnRWaWV3LCAvLyBvcHRpb25hbFxuXHRcdFx0bmV4dFZpZXdJRDogYWN0aW9uRGF0YS5uZXh0VmlldywgLy8gb3B0aW9uYWxcblx0XHRcdHZpZXdzOiB7fSxcblx0XHRcdHRyYW5zaXRpb25UeXBlOiB0cmFuc2l0aW9uT2JqZWN0LnRyYW5zaXRpb25UeXBlXG5cdFx0fTtcblx0fVxuXG5cdC8qKlxuICAqIHByb2Nlc3NWaWV3cyAtIHN0YXJ0IHByZXBhcmluZyB0aGUgdmlld3NcbiAgKiBGaW5kIHZpZXdzIGJ5IHRoZWlyIGFjdGlvbiBJRCBpbiB0aGUgY29uZmlnXG4gICogXG4gICogQHBhcmFtICB7b2JqZWN0fHN0cmluZ30gYWN0aW9uSUQgXG4gICogQHBhcmFtICB7b2JqZWN0fSBkYXRhICBwYXNzZWQgYnkgdGhlIGFjdGlvblxuICAqL1xuXHRUVk0ucHJvY2Vzc1ZpZXdzID0gZnVuY3Rpb24gKGFjdGlvbklELCBkYXRhKSB7XG5cdFx0aWYgKCFfb3B0aW9ucy5jb25maWcpIHtcblx0XHRcdHJldHVybiBUVk0uZXJyb3IoJ0EgRGF0YSBDb25maWcgb2JqZWN0IG11c3QgYmUgc2V0IHZpYTogVmlld01hbmFnZXIuY3JlYXRlJyk7XG5cdFx0fVxuXHRcdGlmICghYWN0aW9uSUQpIHtcblx0XHRcdHJldHVybiBUVk0uZXJyb3IoJ3Byb2Nlc3NWaWV3cyAqYWN0aW9uSUQgaXMgdW5kZWZpbmVkJyk7XG5cdFx0fVxuXG5cdFx0aWYgKF9vcHRpb25zLnVzZUNhY2hlICYmIHZpZXdDYWNoZVthY3Rpb25JRF0pIHtcblx0XHRcdF92aWV3c1JlYWR5TWV0aG9kKF9nZXRDYWNoZWQodmlld0NhY2hlW2FjdGlvbklEXSwgZGF0YSkpO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdHZhciBhY3Rpb25EYXRhID0gX29wdGlvbnMuY29uZmlnW2FjdGlvbklEXTtcblx0XHRpZiAoYWN0aW9uRGF0YSkge1xuXHRcdFx0KGZ1bmN0aW9uICgpIHtcblxuXHRcdFx0XHR2YXIgcHJvY2Vzc2VkQWN0aW9uID0gX3ByZXBhcmVWaWV3cyhhY3Rpb25EYXRhLCBkYXRhKSxcblx0XHRcdFx0ICAgIHBhcnNlZEFjdGlvbkRhdGEgPSBwcm9jZXNzZWRBY3Rpb24ucHJlcGFyZWRWaWV3cyxcblx0XHRcdFx0ICAgIHBlbmRpbmdQcm9taXNlcyA9IHByb2Nlc3NlZEFjdGlvbi5wcm9taXNlcztcblxuXHRcdFx0XHR2aWV3Q2FjaGVbYWN0aW9uSURdID0gcGFyc2VkQWN0aW9uRGF0YS5zbGljZSgwKTtcblxuXHRcdFx0XHQvLyBwYXJzZSB0aGUgdmlld3MgYW5kIHdhaXQgZm9yIHRoZW0gdG8gZmluaXNoIHByZXBhcmluZyB0aGVtc2VsdmVzXG5cdFx0XHRcdF9jb21tb25Qcm9taXNlRmFjYWRlLmFsbChwZW5kaW5nUHJvbWlzZXMpLnRoZW4oZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFRWTS5sb2coJ1ZpZXdzIGxvYWRlZCBhbmQgcmVhZHkgZm9yIC0tLS0tICcgKyBhY3Rpb25JRCk7XG5cblx0XHRcdFx0XHQvLyogdmlld3MgYXJlIHJlYWR5LCBkaXNwYXRjaCB0aGVtICovL1xuXHRcdFx0XHRcdF92aWV3c1JlYWR5TWV0aG9kKHBhcnNlZEFjdGlvbkRhdGEpO1xuXHRcdFx0XHR9LCBUVk0uZXJyb3IpO1xuXHRcdFx0fSkoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0VFZNLmVycm9yKCdwcm9jZXNzVmlld3MgKmFjdGlvbkRhdGEgaXMgdW5kZWZpbmVkJyk7XG5cdFx0fVxuXHR9O1xuXG5cdC8qKlxuICAqIENyZWF0ZSB0aGUgVHJhbnNpdGlvblZpZXdNYW5hZ2VyXG4gICogcGFyc2UgdGhlIHBhc3NlZCBpbiBzZXR0aW5nc1xuICAqIEBwYXJhbSAge29iamVjdH0gb3B0aW9uc1xuICAqL1xuXHRUVk0uY3JlYXRlID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcblx0XHRfdXRpbHNEZWZhdWx0MlsnZGVmYXVsdCddKF9vcHRpb25zLCBvcHRpb25zKTtcblx0XHRUVk0uaW5pdExvZ2dlcihfb3B0aW9ucy5kZWJ1Zyk7XG5cdFx0VFZNLmxvZygnaW5pdGlhdGVkJyk7XG5cdH07XG5cblx0LyoqXG4gICogZGlzcG9zZSBvZiB0aGUgVHJhbnNpdGlvblZpZXdNYW5hZ2VyIGFuZCBcbiAgKiBhbGwgaXRzIGNvbXBvbmVudHNcbiAgKi9cblx0VFZNLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG5cdFx0X29wdGlvbnMgPSBudWxsO1xuXHRcdHZpZXdDYWNoZSA9IG51bGw7XG5cdH07XG5cblx0LyoqXG4gICogbGluayBleHRlcm5hbCBtZXRoaWQgdG8gbG9jYWxcbiAgKi9cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KFRWTSwgJ3ZpZXdzUmVhZHknLCB7IHNldDogZnVuY3Rpb24gc2V0KG1ldGhvZCkge1xuXHRcdFx0X3ZpZXdzUmVhZHlNZXRob2QgPSBtZXRob2Q7XG5cdFx0fSB9KTtcbn0pKCk7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IFRWTTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYklpOVZjMlZ5Y3k5MFlXeDNiMjlzWmk5a1pYWmxiRzl3WlhJdmQyVmlVbTl2ZEM5MGNtRnVjMmwwYVc5dUxXMWhibUZuWlhJdmMzSmpMMk52Y21VdmRISmhibk5wZEdsdmJsWnBaWGROWVc1aFoyVnlMbXB6SWwwc0ltNWhiV1Z6SWpwYlhTd2liV0Z3Y0dsdVozTWlPaUk3T3pzN096czdPemhDUVVOMVFpeHhRa0ZCY1VJN096czdORUpCUTJwQ0xHdENRVUZyUWpzN096c3dRa0ZEZGtJc1owSkJRV2RDT3pzN08yMURRVXN2UWl4NVFrRkJlVUk3T3p0QlFVZG9ReXhKUVVGTkxFZEJRVWNzUjBGQlJ5eDNRa0ZCVFN4RlFVRkZMRWxCUVVrc1JVRkJSeXgxUWtGQmRVSXNSVUZCUlN3NFFrRkJWU3hEUVVGRE96dEJRVVV2UkN4RFFVRkRMRmxCUVZVN08wRkJSVllzUzBGQlNTeHBRa0ZCYVVJc1IwRkJSeXhKUVVGSk8wdEJRek5DTEZOQlFWTXNSMEZCVHl4RlFVRkZPenM3TzBGQlIyNUNMRk5CUVZFc1IwRkJUenRCUVVOa0xGRkJRVTBzUlVGQlR5eEpRVUZKTzBGQlEycENMR0ZCUVZjc1JVRkJTeXhKUVVGSk8wRkJRM0JDTEU5QlFVc3NSVUZCVHl4TFFVRkxPMEZCUTJwQ0xGVkJRVkVzUlVGQlRTeExRVUZMTzBWQlEyNUNMRU5CUVVNN096czdPenM3T3pzN1FVRlZSaXhWUVVGVExHRkJRV0VzUTBGQlJTeFZRVUZWTEVWQlFVVXNVMEZCVXl4RlFVTTNRenRCUVVORExFMUJRVWtzYlVKQlFXMUNMRWRCUVVjc1ZVRkJWU3hEUVVGRExHMUNRVUZ0UWpzN1FVRkRkRVFzYlVKQlFXbENMRWRCUVVrc2JVSkJRVzFDTEVOQlFVTXNUVUZCVFR0TlFVTXZReXhSUVVGUkxFZEJRVTBzUlVGQlJUdE5RVU5vUWl4aFFVRmhMRWRCUVVzc1JVRkJSVHROUVVOd1FpeGxRVUZsTEVkQlFVa3NTVUZCU1R0TlFVTjJRaXhUUVVGVExFZEJRVTBzUlVGQlJUdE5RVU5xUWl4RFFVRkRMRWRCUVZFc1EwRkJRenROUVVOV0xHbENRVUZwUWl4WlFVRkJMRU5CUVVNN08wRkJSV3hDTEZOQlFVOHNRMEZCUXl4SFFVRkhMR2xDUVVGcFFpeEZRVUZITzBGQlF6bENMRzlDUVVGcFFpeEhRVUZWTEcxQ1FVRnRRaXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzBGQlEyeEVMR3RDUVVGbExFZEJRVlVzWlVGQlpTeERRVUZGTEZWQlFWVXNSVUZCUlN4cFFrRkJhVUlzUlVGQlJTeFRRVUZUTEVOQlFVVXNRMEZCUXp0QlFVTnlSaXhuUWtGQllTeERRVUZGTEdGQlFXRXNRMEZCUXl4TlFVRk5MRU5CUVVVc1IwRkJSeXhYUVVGWExFTkJRVVVzYVVKQlFXbENMRU5CUVVNc1MwRkJTeXhGUVVGRkxHVkJRV1VzUlVGQlJTeFJRVUZSTEVWQlFVVXNVMEZCVXl4RFFVRkRMRU5CUVVNN08wRkJSWEJJTEV0QlFVVXNRMEZCUXl4RFFVRkRPMGRCUTBvN08wRkJSVVFzVjBGQlV5eEhRVUZITEVsQlFVa3NRMEZCUXp0QlFVTnFRaXhUUVVGUExFVkJRVVVzVVVGQlVTeEZRVUZITEZGQlFWRXNSVUZCUlN4aFFVRmhMRVZCUVVjc1lVRkJZU3hGUVVGRkxFTkJRVU03UlVGRGFFVTdPenM3T3pzN096czdPenM3UVVGaFJDeFZRVUZUTEZkQlFWY3NRMEZCUlN4alFVRmpMRVZCUVVVc1pVRkJaU3hGUVVGRkxGRkJRVkVzUlVGQlJTeFRRVUZUTEVWQlF6RkZPMEZCUTBNc1RVRkJUU3hMUVVGTExFZEJRVXNzWTBGQll6dE5RVU16UWl4WFFVRlhMRWRCUVVrc1VVRkJVU3hEUVVGRExGZEJRVmM3VFVGRGJrTXNUVUZCVFN4SFFVRkxMRXRCUVVzc1EwRkJReXhOUVVGTk8wMUJRM1pDTEdGQlFXRXNSMEZCUnl4bFFVRmxMRU5CUVVNc1lVRkJZVHROUVVNM1F5eFZRVUZWTEVkQlFVa3NaVUZCWlN4RFFVRkRMRlZCUVZVc1EwRkJRenM3UVVGRk5VTXNUVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJRenROUVVOU0xGTkJRVk1zV1VGQlFUdE5RVU5VTEVsQlFVa3NXVUZCUVR0TlFVTktMRk5CUVZNc1dVRkJRVHROUVVOVUxGTkJRVk1zV1VGQlFUdE5RVU5VTEU5QlFVOHNXVUZCUVN4RFFVRkRPenRCUVVWVUxGTkJRVThzUTBGQlF5eEhRVUZITEUxQlFVMHNSVUZEYWtJN1FVRkRReXhWUVVGUExFZEJRVWNzUzBGQlN5eERRVUZGTEVOQlFVTXNRMEZCUlN4RFFVRkRPenRCUVVWeVFpeFBRVUZITEU5QlFVOHNSVUZEVmp0QlFVTkRMR0ZCUVZNc1IwRkJSeXhUUVVGVExFTkJRVVVzVDBGQlR5eERRVUZGTEVOQlFVTTdPMEZCUldwRExGRkJRVWNzUTBGQlF5eFRRVUZUTEVWQlFVVTdPMEZCUTJRc1kwRkJVeXhIUVVGSExGTkJRVk1zUTBGQlJTeFBRVUZQTEVOQlFVVXNSMEZCUnl4WFFVRlhMRU5CUVVNc1UwRkJVeXhEUVVGRkxFOUJRVThzUTBGQlJTeERRVUZETzBGQlEzQkZMR05CUVZNc1IwRkJSeXh4UWtGMFJtaENMRkZCUVZFc1JVRnpSbXRDTEVOQlFVTTdRVUZEZGtJc1lVRkJVU3hEUVVGRkxGRkJRVkVzUTBGQlF5eE5RVUZOTEVOQlFVVXNSMEZCUnl4VFFVRlRMRU5CUVVNc1QwRkJUeXhEUVVGRE96dEJRVVZvUkN4VFFVRkpMRU5CUVVNc1UwRkJVeXhGUVVGRk8wRkJRVVVzWVVGQlR5eEhRVUZITEVOQlFVTXNTMEZCU3l4RFFVRkZMRTlCUVU4c1IwRkJReXhsUVVGbExFTkJRVVVzUTBGQlF6dE5RVUZGT3p0QlFVVm9SU3hUUVVGSkxGTkJRVk1zUTBGQlF5eFhRVUZYTEVWQlFVVTdRVUZCUlN4bFFVRlRMRU5CUVVNc1YwRkJWeXhEUVVGRkxGTkJRVk1zUTBGQlJTeERRVUZETzAxQlFVVXNUVUZETjBRN1FVRkJSU3hsUVVGVExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTTdUVUZCUlR0TFFVTTNRanM3UVVGRlJDeFJRVUZKTEVkQlFVY3NVMEZCVXl4RFFVRkRPenM3UVVGSGFrSXNZVUZCVXl4SFFVRkhMRkZCUVZFc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlJTeGhRVUZoTEVWQlFVVXNWVUZCVlN4RFFVRkZMRU5CUVVNc1EwRkJRenRCUVVNM1JDeFJRVUZKTEZOQlFWTXNSVUZCUnp0QlFVTm1MRzlDUVVGbExFTkJRVU1zUzBGQlN5eERRVUZGTEZOQlFWTXNRMEZCUlN4SFFVRkhMRWxCUVVrc1EwRkJRenRMUVVNeFF6dEJRVU5FTEcxQ1FVRmxMRU5CUVVNc1MwRkJTeXhEUVVGRkxFOUJRVThzUTBGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXp0SlFVTjRRenM3UVVGRlJDeExRVUZGTEVOQlFVTXNRMEZCUXp0SFFVTktPenRCUVVWRUxGTkJRVThzWlVGQlpTeERRVUZETzBWQlEzWkNPenM3T3pzN096czdPenRCUVZkRUxGVkJRVk1zVVVGQlVTeERRVUZGTEVkQlFVY3NSVUZCUlN4bFFVRmxMRVZCUVVjN1FVRkRlRU1zVFVGQlNTeExRVUZMTEVkQlFVY3NaVUZCWlN4RFFVRkRMRTlCUVU4c1EwRkJSU3hIUVVGSExFTkJRVVVzUTBGQlF6dEJRVU14UXl4VFFVRlBMRUZCUVVNc1MwRkJTeXhMUVVGTExFTkJRVU1zUTBGQlF5eEhRVUZKTEVsQlFVa3NSMEZCUnl4RFFVRkRMR0ZCUVdFc1JVRkJSU3hWUVVGVkxFTkJRVU1zUTBGQlJTeExRVUZMTEVOQlFVVXNRMEZCUXp0RlFVTjBSVHM3T3pzN096czdRVUZUUkN4VlFVRlRMRlZCUVZVc1EwRkJSU3hOUVVGTkxFVkJRVVVzU1VGQlNTeEZRVU5xUXp0QlFVTkRMRTFCUVVrc1EwRkJReXhKUVVGSkxFVkJRVVU3UVVGQlJTeFZRVUZQTEUxQlFVMHNRMEZCUXp0SFFVRkZPenRCUVVVM1FpeE5RVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1RVRkJSU3hIUVVGSExFZEJRVWNzVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXp0QlFVTXhRaXhUUVVGUExFVkJRVVVzUTBGQlF5eEhRVUZITEVkQlFVY3NSVUZCUlR0QlFVTmtMRk5CUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEVkQlFVY3NTVUZCU1N4RFFVRkRPMGRCUTNwQ08wRkJRMFFzVTBGQlR5eE5RVUZOTEVOQlFVTTdSVUZEY0VJN096czdPenM3T3pzN08wRkJWMFFzVlVGQlV5eGxRVUZsTEVOQlFVVXNWVUZCVlN4RlFVRkZMR2RDUVVGblFpeEZRVUZGTEZOQlFWTXNSVUZCUnp0QlFVTnNSU3hUUVVGUE8wRkJRMUFzVDBGQlNTeEZRVUZOTEZOQlFWTTdRVUZEYmtJc1owSkJRV0VzUlVGQlNTeFZRVUZWTEVOQlFVTXNWMEZCVnp0QlFVTjBReXhoUVVGVkxFVkJRVXNzVlVGQlZTeERRVUZETEZGQlFWRTdRVUZEYkVNc1VVRkJTeXhGUVVGTkxFVkJRVVU3UVVGRFlpeHBRa0ZCWXl4RlFVRkpMR2RDUVVGblFpeERRVUZETEdOQlFXTTdSMEZEYWtRc1EwRkJRenRGUVVOSU96czdPenM3T3pzN1FVRlRSQ3hKUVVGSExFTkJRVU1zV1VGQldTeEhRVUZITEZWQlFWVXNVVUZCVVN4RlFVRkZMRWxCUVVrc1JVRkRNME03UVVGRFF5eE5RVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRTFCUVUwc1JVRkJTVHRCUVVGRkxGVkJRVThzUjBGQlJ5eERRVUZETEV0QlFVc3NRMEZCUXl3d1JFRkJNRVFzUTBGQlJTeERRVUZETzBkQlFVVTdRVUZETVVjc1RVRkJTU3hEUVVGRExGRkJRVkVzUlVGQlN6dEJRVUZGTEZWQlFVOHNSMEZCUnl4RFFVRkRMRXRCUVVzc1EwRkJReXh4UTBGQmNVTXNRMEZCUlN4RFFVRkRPMGRCUVVjN08wRkJSMmhHTEUxQlFVY3NVVUZCVVN4RFFVRkRMRkZCUVZFc1NVRkJTU3hUUVVGVExFTkJRVVVzVVVGQlVTeERRVUZGTEVWQlFVYzdRVUZETDBNc2IwSkJRV2xDTEVOQlFVVXNWVUZCVlN4RFFVRkZMRk5CUVZNc1EwRkJSU3hSUVVGUkxFTkJRVVVzUlVGQlJTeEpRVUZKTEVOQlFVVXNRMEZCUlN4RFFVRkRPMEZCUXk5RUxGVkJRVThzUzBGQlN5eERRVUZETzBkQlEySTdPMEZCUlVRc1RVRkJUU3hWUVVGVkxFZEJRVWtzVVVGQlVTeERRVUZETEUxQlFVMHNRMEZCUlN4UlFVRlJMRU5CUVVVc1EwRkJRenRCUVVOb1JDeE5RVUZKTEZWQlFWVXNSVUZCUnpzN08wRkJSV2hDTEZGQlFVa3NaVUZCWlN4SFFVRk5MR0ZCUVdFc1EwRkJSU3hWUVVGVkxFVkJRVVVzU1VGQlNTeERRVUZGTzFGQlEzcEVMR2RDUVVGblFpeEhRVUZOTEdWQlFXVXNRMEZCUXl4aFFVRmhPMUZCUTI1RUxHVkJRV1VzUjBGQlRTeGxRVUZsTEVOQlFVTXNVVUZCVVN4RFFVRkRPenRCUVVVNVF5eGhRVUZUTEVOQlFVVXNVVUZCVVN4RFFVRkZMRWRCUVVjc1owSkJRV2RDTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE96czdRVUZIYmtRc2VVSkJMMHhHTEVkQlFVY3NRMEVyVEVrc1pVRkJaU3hEUVVGRkxFTkJRVU1zU1VGQlNTeERRVUZGTEZsQlFVMDdRVUZEYkVNc1VVRkJSeXhEUVVGRExFZEJRVWNzUTBGQlF5eHRRMEZCYlVNc1IwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF6czdPMEZCUjNSRUxITkNRVUZwUWl4RFFVRkZMR2RDUVVGblFpeERRVUZGTEVOQlFVTTdTMEZGZEVNc1JVRkJSU3hIUVVGSExFTkJRVU1zUzBGQlN5eERRVUZGTEVOQlFVTTdPMGRCUldZc1RVRkJUVHRCUVVOT0xFMUJRVWNzUTBGQlF5eExRVUZMTEVOQlFVTXNkVU5CUVhWRExFTkJRVU1zUTBGQlF6dEhRVU51UkR0RlFVTkVMRU5CUVVNN096czdPenM3UVVGUFJpeEpRVUZITEVOQlFVTXNUVUZCVFN4SFFVRkhMRlZCUVZVc1QwRkJUeXhGUVVNNVFqdEJRVU5ETERSQ1FVRmpMRkZCUVZFc1JVRkJSU3hQUVVGUExFTkJRVVVzUTBGQlF6dEJRVU5zUXl4TFFVRkhMRU5CUVVNc1ZVRkJWU3hEUVVGRkxGRkJRVkVzUTBGQlF5eExRVUZMTEVOQlFVVXNRMEZCUXp0QlFVTnFReXhMUVVGSExFTkJRVU1zUjBGQlJ5eERRVUZETEZkQlFWY3NRMEZCUXl4RFFVRkRPMFZCUTNKQ0xFTkJRVU03T3pzN096dEJRVTlHTEVsQlFVY3NRMEZCUXl4UFFVRlBMRWRCUVVjc1dVRkJWenRCUVVONFFpeFZRVUZSTEVkQlFVa3NTVUZCU1N4RFFVRkRPMEZCUTJwQ0xGZEJRVk1zUjBGQlJ5eEpRVUZKTEVOQlFVTTdSVUZEYWtJc1EwRkJRenM3T3pzN1FVRkxSaXhQUVVGTkxFTkJRVU1zWTBGQll5eERRVUZETEVkQlFVY3NSVUZCUlN4WlFVRlpMRVZCUVVVc1JVRkJSU3hIUVVGSExFVkJRVUVzWVVGQlJTeE5RVUZOTEVWQlFVYzdRVUZCUlN4dlFrRkJhVUlzUjBGQlJ5eE5RVUZOTEVOQlFVTTdSMEZCUlN4RlFVRkhMRU5CUVVNc1EwRkJRenREUVVjM1JpeERRVUZCTEVWQlFVY3NRMEZCUXpzN2NVSkJTVlVzUjBGQlJ5SXNJbVpwYkdVaU9pSXZWWE5sY25NdmRHRnNkMjl2YkdZdlpHVjJaV3h2Y0dWeUwzZGxZbEp2YjNRdmRISmhibk5wZEdsdmJpMXRZVzVoWjJWeUwzTnlZeTlqYjNKbEwzUnlZVzV6YVhScGIyNVdhV1YzVFdGdVlXZGxjaTVxY3lJc0luTnZkWEpqWlhORGIyNTBaVzUwSWpwYklseHVhVzF3YjNKMElHeHZaMmRsY2lBZ1hIUmNkRngwWm5KdmJTQW5MaTR2WTI5dGJXOXVMMnh2WjJkbGNpNXFjeWM3WEc1cGJYQnZjblFnWkdWbVlYVnNkRkJ5YjNCeklDQmNkR1p5YjIwZ0p5NHVMM1YwYVd4ekwyUmxabUYxYkhRbk8xeHVhVzF3YjNKMElHMXBlR2x1WEhSY2RDQWdYSFJtY205dElDY3VMaTkxZEdsc2N5OXRhWGhwYmljN1hHNWNibWx0Y0c5eWRDQjdJRnh1WEhSaGJHd3NYRzVjZEVSbFptVnljbVZrSUZ4dWZTQm1jbTl0SUNjdUxpOWpiMjF0YjI0dmNISnZiV2x6WlVaaFkyRmtaU2M3WEc1Y2JpOHFJR055WldGMFpTQmpiR0Z6Y3lCaGJtUWdaWGgwWlc1a0lHeHZaMmRsY2lBcUwxeHVZMjl1YzNRZ1ZGWk5JRDBnYldsNGFXNG9leUJ1WVcxbElEb2dKMVJ5WVc1emFYUnBiMjVXYVdWM1RXRnVZV2RsY2ljZ2ZTd2diRzluWjJWeUlDazdYRzVjYmlobWRXNWpkR2x2YmlncGUxeHVYRzVjZEd4bGRDQmZkbWxsZDNOU1pXRmtlVTFsZEdodlpDQTlJRzUxYkd3c1hHNWNkRngwZG1sbGQwTmhZMmhsSUZ4MFhIUWdJRDBnZTMwc1hHNWNibHgwTHk4Z2IzQjBhVzl1Y3lCM2FYUm9JR1JsWm1GMWJIUnpYRzVjZEY5dmNIUnBiMjV6SUZ4MFhIUmNkRngwUFNCN1hHNWNkRngwWTI5dVptbG5JQ0JjZEZ4MFhIUTZJRzUxYkd3c1hHNWNkRngwZG1sbGQwMWhibUZuWlhJZ1hIUmNkRG9nYm5Wc2JDeGNibHgwWEhSa1pXSjFaeUJjZEZ4MFhIUmNkRG9nWm1Gc2MyVXNYRzVjZEZ4MGRYTmxRMkZqYUdVZ1hIUmNkRngwT2lCbVlXeHpaVnh1WEhSOU8xeHVYRzVjZEM4cUtseHVYSFFnS2lCc2IyOXdJSFJvY205MVoyZ2dZV3hzSUhSeVlXNXphWFJwYjI0Z2JXOWtkV3hsY3lCaGJtUWdjSEpsY0dGeVpTQjBhR1ZjYmx4MElDb2dkbWxsZDNNZ2NtVnhkV1Z6ZEdWa0lHSjVJSFJvWlNCamIyNW1hV2RjYmx4MElDb2dYRzVjZENBcUlFQndZWEpoYlNBZ2UyOWlhbVZqZEgwZ1lXTjBhVzl1UkdGMFlTQmpiMjUwWVdsdWFXNW5JR0ZzYkNCMGNtRnVjMmwwYVc5dUlIUjVjR1Z6SUdGdVpDQjJhV1YzY3lCeVpYRjFhWEpsWkZ4dVhIUWdLaUJBY0dGeVlXMGdJSHR2WW1wbFkzUjlJSEJoY21GdFJHRjBZU0J6Wlc1MElIZHBkR2dnZEdobElHRmpkR2x2Ymx4dVhIUWdLaUJBY21WMGRYSnVJSHR2WW1wbFkzUjlJSEJ5YjIxcGMyVnpJR0Z5Y21GNUlHRnVaQ0J3WlhCaGNtVmtJSFpwWlhkeklHRnljbUY1WEc1Y2RDQXFMMXh1WEhSbWRXNWpkR2x2YmlCZmNISmxjR0Z5WlZacFpYZHpLQ0JoWTNScGIyNUVZWFJoTENCd1lYSmhiVVJoZEdFZ0tWeHVYSFI3WEc1Y2RGeDBiR1YwSUd4cGJtdGxaRlJ5WVc1emMwMXZaSFZzWlhNZ1BTQmhZM1JwYjI1RVlYUmhMbXhwYm10bFpGWlVjbUZ1YzAxdlpIVnNaWE1zSUM4dklHeHZiMnNnYVc1MGJ5QnpiR2xqWlNCemNHVmxaQ0J2ZG1WeUlHTnlaV0YwYVc1bklHNWxkeUJoY25KaGVWeHVYSFJjZENCY2RGWnBaWGR6VFc5a2RXeGxUR1Z1WjNSb0lGeDBQU0JzYVc1clpXUlVjbUZ1YzNOTmIyUjFiR1Z6TG14bGJtZDBhQ3hjYmx4MFhIUWdYSFJ3Y205dGFYTmxjeUJjZEZ4MFhIUTlJRnRkTEZ4dVhIUmNkQ0JjZEhCeVpYQmhjbVZrVm1sbGQzTWdYSFJjZEQwZ1cxMHNYRzVjZEZ4MElGeDBZV04wYVc5dVJHRjBZVU5zYjI1bElGeDBQU0J1ZFd4c0xGeHVYSFJjZENCY2RIWnBaWGREWVdOb1pTQmNkRngwWEhROUlIdDlMRnh1WEhSY2RDQmNkR2tnWEhSY2RGeDBYSFJjZEQwZ01DeGNibHgwWEhRZ1hIUjJhV1YzYzAxdlpIVnNaVTlpYW1WamREdGNibHh1WEhRZ1hIUmNkSGRvYVd4bEtDQnBJRHdnVm1sbGQzTk5iMlIxYkdWTVpXNW5kR2dnS1NCN1hHNGdYSFJjZEZ4MFhIUjJhV1YzYzAxdlpIVnNaVTlpYW1WamRDQmNkRngwWEhSY2RGeDBJQ0E5SUd4cGJtdGxaRlJ5WVc1emMwMXZaSFZzWlhOYmFWMDdYRzVjZENCY2RGeDBYSFJoWTNScGIyNUVZWFJoUTJ4dmJtVWdYSFJjZEZ4MFhIUmNkQ0FnUFNCZlkyeHZibVZXYVdWM1UzUmhkR1VvSUdGamRHbHZia1JoZEdFc0lIWnBaWGR6VFc5a2RXeGxUMkpxWldOMExDQndZWEpoYlVSaGRHRWdLVHNnWEc1Y2RDQmNkRngwWEhSd2NtVndZWEpsWkZacFpYZHpXeUJ3Y21Wd1lYSmxaRlpwWlhkekxteGxibWQwYUNCZElEMGdYMlpsZEdOb1ZtbGxkM01vSUhacFpYZHpUVzlrZFd4bFQySnFaV04wTG5acFpYZHpMQ0JoWTNScGIyNUVZWFJoUTJ4dmJtVXNJSEJ5YjIxcGMyVnpMQ0IyYVdWM1EyRmphR1VwTzF4dVhIUWdYSFJjZEZ4MFhHNWNkQ0JjZEZ4MFhIUXJLMms3WEc1Y2RDQmNkRngwZlZ4dVhHNWNkQ0JjZEZ4MGRtbGxkME5oWTJobElEMGdiblZzYkR0Y2JseDBYSFFnWEhSeVpYUjFjbTRnZXlCd2NtOXRhWE5sY3lBNklIQnliMjFwYzJWekxDQndjbVZ3WVhKbFpGWnBaWGR6SURvZ2NISmxjR0Z5WldSV2FXVjNjeUI5TzF4dVhIUjlYRzVjYmx4MEx5b3FYRzVjZENBcUlHeHZiM0FnZEdoeWIzVm5hQ0JoYm1RZ1ptVjBZMmdnWVd4c0lIUm9aU0J5WlhGMVpYTjBaV1FnZG1sbGQzTXNJSFZ6WlNCMmFXVjNVbVZoWkhsY2JseDBJQ29nWVc1a0lHTnZiR3hsWTNRZ1lTQndjbTl0YVhObElHWnZjaUJsWVdOb0lIUnZJR0ZzYkc5M0lIUm9aU0IyYVdWM0lIUnZJR0oxYVd4a0lIVndJR0Z1WkNCd1pYSm1iM0p0SUZ4dVhIUWdLaUJwZEhNZ2NISmxjR1Z5WVhScGIyNGdkR0Z6YTNNZ2FXWWdjbVZ4ZFdseVpXUmNibHgwSUNvZ1hHNWNkQ0FxSUVCd1lYSmhiU0FnZTJGeWNtRjVmU0IyYVdWM2N5QXRJSE4wY21sdVp5QnlaV1psY21WdVkyVnpYRzVjZENBcUlFQndZWEpoYlNBZ2UyOWlhbVZqZEgwZ1lXTjBhVzl1UkdGMFlVTnNiMjVsSUMwZ1kyeHZibVZrSUdSaGRHRWdZWE1nZEc4Z2JtOTBJRzkyWlhKeWFXUmxJR052Ym1acFoxeHVYSFFnS2lCQWNHRnlZVzBnSUh0aGNuSmhlWDBnY0hKdmJXbHpaWE1nTFNCamIyeHNaV04wSUdGc2JDQjJhV1YzSUhCeWIyMXBjMlZ6WEc1Y2RDQXFJRUJ3WVhKaGJTQWdlMjlpYW1WamRIMGdkbWxsZDBOaFkyaGxJQzBnY0hKbGRtVnVkSE1nZG1sbGQzTWdabkp2YlNCaVpXbHVaeUJwYm5OMFlXNTBhV0YwWldRZ1lXNWtJSEpsY1hWbGMzUmxaQ0J0YjNKbElIUm9ZVzRnYjI1alpWeHVYSFFnS2lCQWNtVjBkWEp1SUh0dlltcGxZM1I5SUhCdmNIVnNZWFJsWkNCaFkzUnBiMjVFWVhSaFEyeHZibVVnWkdGMFlTQnZZbXBsWTNSY2JseDBJQ292WEc1Y2RHWjFibU4wYVc5dUlGOW1aWFJqYUZacFpYZHpLQ0IyYVdWM2MxUnZVSEpsY0dGeVpTd2dZV04wYVc5dVJHRjBZVU5zYjI1bExDQndjbTl0YVhObGN5d2dkbWxsZDBOaFkyaGxJQ2xjYmx4MGUxeHVYSFJjZEdOdmJuTjBJSFpwWlhkeklGeDBYSFE5SUhacFpYZHpWRzlRY21Wd1lYSmxMRnh1WEhSY2RGeDBJQ0IyYVdWM1RXRnVZV2RsY2lCY2REMGdYMjl3ZEdsdmJuTXVkbWxsZDAxaGJtRm5aWElzWEc1Y2RGeDBYSFFnSUd4bGJtZDBhQ0JjZEZ4MFBTQjJhV1YzY3k1c1pXNW5kR2dzWEc1Y2RGeDBYSFFnSUdOMWNuSmxiblJXYVdWM1NVUWdQU0JoWTNScGIyNUVZWFJoUTJ4dmJtVXVZM1Z5Y21WdWRGWnBaWGRKUkN4Y2JseDBYSFJjZENBZ2JtVjRkRlpwWlhkSlJDQmNkRDBnWVdOMGFXOXVSR0YwWVVOc2IyNWxMbTVsZUhSV2FXVjNTVVE3WEc1Y2JseDBYSFJzWlhRZ2FTQTlJREFzWEc1Y2RGeDBYSFJmWkdWbVpYSnlaV1FzWEc1Y2RGeDBYSFIyYVdWM0xGeHVYSFJjZEZ4MFptOTFibVJXYVdWM0xGeHVYSFJjZEZ4MGNHRnljMlZrVW1WbUxGeHVYSFJjZEZ4MGRtbGxkMUpsWmp0Y2JseHVYSFJjZEhkb2FXeGxLQ0JwSUR3Z2JHVnVaM1JvSUNsY2JseDBYSFI3WEc1Y2RGeDBYSFIyYVdWM1VtVm1JRDBnZG1sbGQzTmJJR2tnWFR0Y2JseHVYSFJjZEZ4MGFXWW9kbWxsZDFKbFppbGNibHgwWEhSY2RIdGNibHgwWEhSY2RGeDBabTkxYm1SV2FXVjNJRDBnZG1sbGQwTmhZMmhsV3lCMmFXVjNVbVZtSUYwN1hHNWNibHgwWEhSY2RGeDBhV1lvSVdadmRXNWtWbWxsZHlrZ2V5QXZMeUJqWVdOb1pTQjBhR1VnZG1sbGR5QnBibk4wWVc1alpTQm1iM0lnY21WMWMyVWdhV1lnYm1WbFpHVmtYRzVjZEZ4MFhIUmNkRngwWm05MWJtUldhV1YzSUQwZ2RtbGxkME5oWTJobFd5QjJhV1YzVW1WbUlGMGdQU0IyYVdWM1RXRnVZV2RsY2k1bVpYUmphRlpwWlhjb0lIWnBaWGRTWldZZ0tUdGNibHgwWEhSY2RGeDBYSFJmWkdWbVpYSnlaV1FnUFNCRVpXWmxjbkpsWkNncE8xeHVYSFJjZEZ4MFhIUmNkSEJ5YjIxcGMyVnpXeUJ3Y205dGFYTmxjeTVzWlc1bmRHZ2dYU0E5SUY5a1pXWmxjbkpsWkM1d2NtOXRhWE5sTzF4dVhHNWNkRngwWEhSY2RGeDBhV1lvSUNGbWIzVnVaRlpwWlhjZ0tYc2djbVYwZFhKdUlGUldUUzVsY25KdmNpZ2dkbWxsZDFKbFppc25JR2x6SUhWdVpHVm1hVzVsWkNjZ0tUc2dmVnh1WEc1Y2RGeDBYSFJjZEZ4MGFXWW9JR1p2ZFc1a1ZtbGxkeTV3Y21Wd1lYSmxWbWxsZHlBcGV5Qm1iM1Z1WkZacFpYY3VjSEpsY0dGeVpWWnBaWGNvSUY5a1pXWmxjbkpsWkNBcE95QjlYRzVjZEZ4MFhIUmNkRngwWld4elpTQjdJRjlrWldabGNuSmxaQzV5WlhOdmJIWmxLQ2s3SUgxY2JseDBYSFJjZEZ4MGZWeHVYRzVjZEZ4MFhIUmNkSFpwWlhjZ1BTQm1iM1Z1WkZacFpYYzdYRzVjYmx4MFhIUmNkRngwTHlvZ1kyaGhibWRsSUhKbFppQjBieUJqZFhKeVpXNTBJSFpwWlhjZ2IzSWdibVY0ZENCMmFXVjNJSFJ2SUdGc2JHOTNJR2RsYm1WeVlXd2dkSEpoYm5OcGRHbHZibk1nS2k5Y2JseDBYSFJjZEZ4MGNHRnljMlZrVW1WbUlEMGdYM1pwWlhkU1pXWW9kbWxsZDFKbFppd2dXeUJqZFhKeVpXNTBWbWxsZDBsRUxDQnVaWGgwVm1sbGQwbEVJRjBwTzF4dVhIUmNkRngwWEhScFppZ2djR0Z5YzJWa1VtVm1JQ2tnZTF4dVhIUmNkRngwWEhSY2RHRmpkR2x2YmtSaGRHRkRiRzl1WlM1MmFXVjNjMXNnY0dGeWMyVmtVbVZtSUYwZ1BTQjJhV1YzTzF4dVhIUmNkRngwWEhSOVhHNWNkRngwWEhSY2RHRmpkR2x2YmtSaGRHRkRiRzl1WlM1MmFXVjNjMXNnZG1sbGQxSmxaaUJkSUQwZ2RtbGxkenRjYmx4MFhIUmNkSDFjYmx4dVhIUmNkRngwS3l0cE8xeHVYSFJjZEgxY2JseDBYSFJjYmx4MFhIUnlaWFIxY200Z1lXTjBhVzl1UkdGMFlVTnNiMjVsTzF4dVhIUjlYRzVjYmx4MEx5b3FYRzVjZENBcUlHTnZiblpsY25RZ2RtbGxkeUJ1WVcxbFpDQnlaV1psY21WdVkyVnpJSFJ2SUdWcGRHaGxjaUJqZFhKeVpXNTBJSFpwWlhkY2JseDBJQ29nYjNJZ2JtVjRkQ0IyYVdWM0lHbG1JSFJvWlNCSlJDZHpJRzFoZEdOb1hHNWNkQ0FxSUUxaGEyVnpJR2wwSUdWaGMybGxjaUIwYnlCaFkyTmxjM01nWVc1a0lHSjFhV3hrSUdkbGJtVnlhV01nZFhObElHTmhjMlZ6WEc1Y2RDQXFJRnh1WEhRZ0tpQkFjR0Z5WVcwZ0lIdHpkSEpwYm1kOUlISmxaaUJqZFhKeVpXNTBJRlpwWlhjZ1NVUmNibHgwSUNvZ1FIQmhjbUZ0SUNCN1lYSnlZWGw5SUdOdmJYQmhjbWx6YjI1V2FXVjNjeUF0SUdOMWNuSmxiblJXYVdWM0lHRnVaQ0J1WlhoMFZtbGxkeUJ6ZEhKcGJtY2dTVVJUWEc1Y2RDQXFJRUJ5WlhSMWNtNGdlM04wY21sdVozMGdMU0J1WlhjZ1NVUlRJR2xtSUcxaGRHTm9aV1JjYmx4MElDb3ZYRzVjZEdaMWJtTjBhVzl1SUY5MmFXVjNVbVZtS0NCeVpXWXNJR052YlhCaGNtbHpiMjVXYVdWM2N5QXBJSHRjYmx4MElGeDBkbUZ5SUdsdVpHVjRJRDBnWTI5dGNHRnlhWE52YmxacFpYZHpMbWx1WkdWNFQyWW9JSEpsWmlBcE8xeHVYSFFnWEhSY2RISmxkSFZ5YmlBb2FXNWtaWGdnUFQwOUlDMHhJQ2svSUc1MWJHd2dPaUJiSjJOMWNuSmxiblJXYVdWM0p5d2dKMjVsZUhSV2FXVjNKMTFiSUdsdVpHVjRJRjA3WEc1Y2RIMWNibHh1WEc1Y2RDOHFLbHh1WEhRZ0tpQnlaWFIxY200Z1kyRmphR1ZrSUhacFpYZHpJR0poYzJWa0lHOXVJR0ZqZEdsdmJpQjBlWEJsWEc1Y2RDQXFJRUJ3WVhKaGJTQWdlMkZ5Y21GNWZTQmpZV05vWldRZ0xTQndjbVYyYVc5MWMyeDVJSEJ5WlhCaGNtVmtJSFpwWlhkelhHNWNkQ0FxSUVCd1lYSmhiU0FnZTI5aWFtVmpkSDBnWkdGMFlTQXRJR0ZqZEdsdmJpQmtZWFJoSUhCaGMzTmxaQ0IwYUhKdmRXZG9JSGRwZEdnZ1lXTjBhVzl1WEc1Y2RDQXFJRUJ5WlhSMWNtNGdlMkZ5Y21GNWZTQXRJR05oWTJobFpDQjJhV1YzYzF4dVhIUWdLaTljYmx4MFpuVnVZM1JwYjI0Z1gyZGxkRU5oWTJobFpDZ2dZMkZqYUdWa0xDQmtZWFJoSUNsY2JseDBlMXh1WEhSY2RHbG1LQ0FoWkdGMFlTQXBleUJ5WlhSMWNtNGdZMkZqYUdWa095QjlYRzVjYmx4MFhIUnNaWFFnYVNBOUlDMHhMQ0JzWlc0Z1BTQmpZV05vWldRdWJHVnVaM1JvTzF4dUlDQWdJQ0FnSUNCM2FHbHNaU0FvS3l0cElEd2diR1Z1S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqWVdOb1pXUmJhVjB1WkdGMFlTQTlJR1JoZEdFN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHTmhZMmhsWkR0Y2JseDBmVnh1WEc1Y2RDOHFLbHh1WEhRZ0tpQmpiRzl1WlNCMGFHVWdZV04wYVc5dUlHUmhkR0VnYjJKcVpXTjBYRzVjZENBcUlHWmhjM1FnWTJ4dmJtVWdZVzVrSUhCeVpYWmxiblJ6SUhSb1pTQmpiMjVtYVdjZ2NtVm1aWEpsYm1ObGN5QjBieUJpWlZ4dVhIUWdLaUJ2ZDJWeWFXUmxiaUJpZVNCcGJuTjBZVzVqWlhNZ2IzSWdiM1JvWlhJZ2MyVjBkR2x1WjNOY2JseDBJQ29nUUhCaGNtRnRJQ0I3YjJKcVpXTjBmU0JoWTNScGIyNUVZWFJoSUhCaGMzTmxaQ0JwYmlCbWNtOXRJSFJvWlNCamIyNW1hV2RjYmx4MElDb2dRSEJoY21GdElDQjdiMkpxWldOMGZTQjBjbUZ1YzJsMGFXOXVUMkpxWldOMElDMGdZV04wYVc5dUlHUmhkR0VnZEhKaGJuTnBkR2x2Ymx4dVhIUWdLaUJBY0dGeVlXMGdJSHR2WW1wbFkzUjlJSEJoY21GdFJHRjBZU0J6Wlc1MElIZHBkR2dnZEdobElHRmpkR2x2Ymx4dVhIUWdLaUJBY21WMGRYSnVJSHR2WW1wbFkzUjlJRzVsZHlCdlltcGxZM1FnZDJsMGFDQmhiaUJwYm5OMFlXNWpaU0J2Y2lCeVpXWmxjbVZ1WTJVZ1puSnZiU0IwYUdVZ2NHRnlZVzF6WEc1Y2RDQXFMMXh1WEhSbWRXNWpkR2x2YmlCZlkyeHZibVZXYVdWM1UzUmhkR1VvSUdGamRHbHZia1JoZEdFc0lIUnlZVzV6YVhScGIyNVBZbXBsWTNRc0lIQmhjbUZ0UkdGMFlTQXBJSHRjYmx4MElGeDBjbVYwZFhKdUlIdGNibHgwWEhSY2RHUmhkR0VnWEhSY2RGeDBPaUJ3WVhKaGJVUmhkR0VzWEc1Y2RGeDBYSFJqZFhKeVpXNTBWbWxsZDBsRUlGeDBPaUJoWTNScGIyNUVZWFJoTG1OMWNuSmxiblJXYVdWM0xDQXZMeUJ2Y0hScGIyNWhiRnh1WEhSY2RDQmNkRzVsZUhSV2FXVjNTVVFnWEhSY2REb2dZV04wYVc5dVJHRjBZUzV1WlhoMFZtbGxkeXdnWEhRZ0lDOHZJRzl3ZEdsdmJtRnNYRzVjZEZ4MElGeDBkbWxsZDNNZ1hIUmNkRngwT2lCN2ZTeGNibHgwWEhRZ1hIUjBjbUZ1YzJsMGFXOXVWSGx3WlNBZ09pQjBjbUZ1YzJsMGFXOXVUMkpxWldOMExuUnlZVzV6YVhScGIyNVVlWEJsWEc1Y2RDQmNkSDA3WEc1Y2RIMWNibHh1WEhRdktpcGNibHgwSUNvZ2NISnZZMlZ6YzFacFpYZHpJQzBnYzNSaGNuUWdjSEpsY0dGeWFXNW5JSFJvWlNCMmFXVjNjMXh1WEhRZ0tpQkdhVzVrSUhacFpYZHpJR0o1SUhSb1pXbHlJR0ZqZEdsdmJpQkpSQ0JwYmlCMGFHVWdZMjl1Wm1sblhHNWNkQ0FxSUZ4dVhIUWdLaUJBY0dGeVlXMGdJSHR2WW1wbFkzUjhjM1J5YVc1bmZTQmhZM1JwYjI1SlJDQmNibHgwSUNvZ1FIQmhjbUZ0SUNCN2IySnFaV04wZlNCa1lYUmhJQ0J3WVhOelpXUWdZbmtnZEdobElHRmpkR2x2Ymx4dVhIUWdLaTljYmx4MFZGWk5MbkJ5YjJObGMzTldhV1YzY3lBOUlHWjFibU4wYVc5dUtDQmhZM1JwYjI1SlJDd2daR0YwWVNBcFhHNWNkSHRjYmx4MFhIUnBaaWdnSVY5dmNIUnBiMjV6TG1OdmJtWnBaeUFwSUNCN0lISmxkSFZ5YmlCVVZrMHVaWEp5YjNJb0owRWdSR0YwWVNCRGIyNW1hV2NnYjJKcVpXTjBJRzExYzNRZ1ltVWdjMlYwSUhacFlUb2dWbWxsZDAxaGJtRm5aWEl1WTNKbFlYUmxKeUFwT3lCOVhHNWNkRngwYVdZb0lDRmhZM1JwYjI1SlJDQXBYSFJjZEZ4MGV5QnlaWFIxY200Z1ZGWk5MbVZ5Y205eUtDZHdjbTlqWlhOelZtbGxkM01nS21GamRHbHZia2xFSUdseklIVnVaR1ZtYVc1bFpDY2dLVHNnSUgxY2JseHVYRzVjZEZ4MGFXWW9YMjl3ZEdsdmJuTXVkWE5sUTJGamFHVWdKaVlnZG1sbGQwTmhZMmhsV3lCaFkzUnBiMjVKUkNCZElDa2dlMXh1WEhSY2RGeDBYM1pwWlhkelVtVmhaSGxOWlhSb2IyUW9JRjluWlhSRFlXTm9aV1FvSUhacFpYZERZV05vWlZzZ1lXTjBhVzl1U1VRZ1hTd2daR0YwWVNBcElDazdYRzVjZEZ4MFhIUnlaWFIxY200Z1ptRnNjMlU3WEc1Y2RGeDBmVnh1WEc1Y2RGeDBZMjl1YzNRZ1lXTjBhVzl1UkdGMFlTQWdQU0JmYjNCMGFXOXVjeTVqYjI1bWFXZGJJR0ZqZEdsdmJrbEVJRjA3WEc1Y2RGeDBhV1lvSUdGamRHbHZia1JoZEdFZ0tTQjdYRzVjYmx4MFhIUmNkR3hsZENCd2NtOWpaWE56WldSQlkzUnBiMjRnWEhRZ0lEMGdYM0J5WlhCaGNtVldhV1YzY3lnZ1lXTjBhVzl1UkdGMFlTd2daR0YwWVNBcExGeHVYSFJjZEZ4MFhIUndZWEp6WldSQlkzUnBiMjVFWVhSaElGeDBJQ0E5SUhCeWIyTmxjM05sWkVGamRHbHZiaTV3Y21Wd1lYSmxaRlpwWlhkekxGeHVYSFJjZEZ4MFhIUndaVzVrYVc1blVISnZiV2x6WlhNZ1hIUWdJRDBnY0hKdlkyVnpjMlZrUVdOMGFXOXVMbkJ5YjIxcGMyVnpPMXh1WEc1Y2RGeDBYSFJjZEhacFpYZERZV05vWlZzZ1lXTjBhVzl1U1VRZ1hTQTlJSEJoY25ObFpFRmpkR2x2YmtSaGRHRXVjMnhwWTJVb01DazdYRzVjYmx4MFhIUmNkQzh2SUhCaGNuTmxJSFJvWlNCMmFXVjNjeUJoYm1RZ2QyRnBkQ0JtYjNJZ2RHaGxiU0IwYnlCbWFXNXBjMmdnY0hKbGNHRnlhVzVuSUhSb1pXMXpaV3gyWlhOY2JseDBYSFJjZEdGc2JDZ2djR1Z1WkdsdVoxQnliMjFwYzJWeklDa3VkR2hsYmlnZ0tDa2dQVDRnZXlCY2JseDBYSFJjZEZ4MFZGWk5MbXh2WnlnblZtbGxkM01nYkc5aFpHVmtJR0Z1WkNCeVpXRmtlU0JtYjNJZ0xTMHRMUzBnSnl0aFkzUnBiMjVKUkNrN1hHNWNibHgwWEhSY2RGeDBMeThxSUhacFpYZHpJR0Z5WlNCeVpXRmtlU3dnWkdsemNHRjBZMmdnZEdobGJTQXFMeTljYmx4MFhIUmNkRngwWDNacFpYZHpVbVZoWkhsTlpYUm9iMlFvSUhCaGNuTmxaRUZqZEdsdmJrUmhkR0VnS1R0Y2JseHVYSFJjZEZ4MGZTd2dWRlpOTG1WeWNtOXlJQ2s3WEc1Y2JseDBYSFI5SUdWc2MyVWdlMXh1WEhSY2RGeDBWRlpOTG1WeWNtOXlLQ2R3Y205alpYTnpWbWxsZDNNZ0ttRmpkR2x2YmtSaGRHRWdhWE1nZFc1a1pXWnBibVZrSnlrN1hHNWNkRngwZlZ4dVhIUjlPMXh1WEc1Y2RDOHFLbHh1WEhRZ0tpQkRjbVZoZEdVZ2RHaGxJRlJ5WVc1emFYUnBiMjVXYVdWM1RXRnVZV2RsY2x4dVhIUWdLaUJ3WVhKelpTQjBhR1VnY0dGemMyVmtJR2x1SUhObGRIUnBibWR6WEc1Y2RDQXFJRUJ3WVhKaGJTQWdlMjlpYW1WamRIMGdiM0IwYVc5dWMxeHVYSFFnS2k5Y2JseDBWRlpOTG1OeVpXRjBaU0E5SUdaMWJtTjBhVzl1S0NCdmNIUnBiMjV6SUNsY2JseDBlMXgwWEc1Y2RGeDBaR1ZtWVhWc2RGQnliM0J6S0NCZmIzQjBhVzl1Y3l3Z2IzQjBhVzl1Y3lBcE8xeHVYSFJjZEZSV1RTNXBibWwwVEc5bloyVnlLQ0JmYjNCMGFXOXVjeTVrWldKMVp5QXBPMXh1WEhSY2RGUldUUzVzYjJjb0oybHVhWFJwWVhSbFpDY3BPMXh1WEhSOU8xeHVYRzVjYmx4MEx5b3FYRzVjZENBcUlHUnBjM0J2YzJVZ2IyWWdkR2hsSUZSeVlXNXphWFJwYjI1V2FXVjNUV0Z1WVdkbGNpQmhibVFnWEc1Y2RDQXFJR0ZzYkNCcGRITWdZMjl0Y0c5dVpXNTBjMXh1WEhRZ0tpOWNibHgwVkZaTkxtUnBjM0J2YzJVZ1BTQm1kVzVqZEdsdmJpZ3BJSHRjYmx4MFhIUmZiM0IwYVc5dWN5QWdQU0J1ZFd4c08xeHVYSFJjZEhacFpYZERZV05vWlNBOUlHNTFiR3c3WEc1Y2RIMDdYRzVjYmx4MEx5b3FYRzVjZENBcUlHeHBibXNnWlhoMFpYSnVZV3dnYldWMGFHbGtJSFJ2SUd4dlkyRnNYRzVjZENBcUwxeHVYSFJQWW1wbFkzUXVaR1ZtYVc1bFVISnZjR1Z5ZEhrb1ZGWk5MQ0FuZG1sbGQzTlNaV0ZrZVNjc0lIc2djMlYwS0NCdFpYUm9iMlFnS1NCN0lGOTJhV1YzYzFKbFlXUjVUV1YwYUc5a0lEMGdiV1YwYUc5a095QjlJQ0I5S1R0Y2JseHVYRzU5S1NncE8xeHVYRzVjYmx4dVpYaHdiM0owSUdSbFptRjFiSFFnVkZaTk8xeHVYRzRpWFgwPSIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywge1xuXHR2YWx1ZTogdHJ1ZVxufSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF9jb3JlRnNtID0gcmVxdWlyZSgnLi9jb3JlL2ZzbScpO1xuXG52YXIgX2NvcmVGc20yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfY29yZUZzbSk7XG5cbnZhciBfY29yZVRyYW5zaXRpb25WaWV3TWFuYWdlciA9IHJlcXVpcmUoJy4vY29yZS90cmFuc2l0aW9uVmlld01hbmFnZXInKTtcblxudmFyIF9jb3JlVHJhbnNpdGlvblZpZXdNYW5hZ2VyMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2NvcmVUcmFuc2l0aW9uVmlld01hbmFnZXIpO1xuXG52YXIgX2NvcmVUcmFuc2l0aW9uQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vY29yZS90cmFuc2l0aW9uQ29udHJvbGxlcicpO1xuXG52YXIgX2NvcmVUcmFuc2l0aW9uQ29udHJvbGxlcjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9jb3JlVHJhbnNpdGlvbkNvbnRyb2xsZXIpO1xuXG52YXIgX2NvcmVEZWZhdWx0Vmlld01hbmFnZXIgPSByZXF1aXJlKCcuL2NvcmUvZGVmYXVsdFZpZXdNYW5hZ2VyJyk7XG5cbnZhciBfY29yZURlZmF1bHRWaWV3TWFuYWdlcjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9jb3JlRGVmYXVsdFZpZXdNYW5hZ2VyKTtcblxudmFyIF9wYXJzZXJzRGF0YVBhcnNlciA9IHJlcXVpcmUoJy4vcGFyc2Vycy9kYXRhUGFyc2VyJyk7XG5cbnZhciBfcGFyc2Vyc0RhdGFQYXJzZXIyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcGFyc2Vyc0RhdGFQYXJzZXIpO1xuXG52YXIgX2NvbW1vbkxvZ2dlciA9IHJlcXVpcmUoJy4vY29tbW9uL2xvZ2dlcicpO1xuXG52YXIgX2NvbW1vbkxvZ2dlcjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9jb21tb25Mb2dnZXIpO1xuXG52YXIgX3V0aWxzTWl4aW4gPSByZXF1aXJlKCcuL3V0aWxzL21peGluJyk7XG5cbnZhciBfdXRpbHNNaXhpbjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91dGlsc01peGluKTtcblxudmFyIF91dGlsc1BpY2sgPSByZXF1aXJlKCcuL3V0aWxzL3BpY2snKTtcblxudmFyIF91dGlsc1BpY2syID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXRpbHNQaWNrKTtcblxudmFyIF9jb21tb25EaXNwYXRjaGVyID0gcmVxdWlyZSgnLi9jb21tb24vZGlzcGF0Y2hlcicpO1xuXG52YXIgX2NvbW1vbkRpc3BhdGNoZXIyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfY29tbW9uRGlzcGF0Y2hlcik7XG5cbi8qIGZzbSBjb25maWcgcGx1Y2sga2V5cyAqL1xudmFyIGZzbUtleXMgPSBbJ2hpc3RvcnknLCAnbGltaXRxJywgJ3F0cmFuc2l0aW9ucycsICdkZWJ1ZyddO1xuLyogdHZtIGNvbmZpZyBwbHVjayBrZXlzICovXG52YXIgdHZtS2V5cyA9IFsndmlld01hbmFnZXInLCAndmlld3MnLCAndXNlQ2FjaGUnLCAnZGVidWcnXTtcbi8qIHRjIGNvbmZpZyBwbHVjayBrZXlzICovXG52YXIgdGNLZXlzID0gWyd0cmFuc2l0aW9ucycsICdkZWJ1ZyddO1xuLyogdGhpcyBjb25maWcgcGx1Y2sga2V5cyAqL1xudmFyIGluZGV4S2V5cyA9IFsnZGVidWcnLCAndmlld3MnLCAndmlld01hbmFnZXInXTtcblxuLyoqXG4gKiByYW5zaXRpb24gbWFuYWdlciAtIFRyYW5zaXRpb24gY29tcG9uZW50IGZhY2FkIHdyYXBwZXJcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbnZhciBUcmFuc2l0aW9uTWFuYWdlciA9IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXHQvKiBwcml2YXRlIExvZ2dlciAqL1xuXHR2YXIgTG9nID0gX3V0aWxzTWl4aW4yWydkZWZhdWx0J10oeyBuYW1lOiAnVHJhbnNpdGlvbk1hbmFnZXInIH0sIF9jb21tb25Mb2dnZXIyWydkZWZhdWx0J10pO1xuXG5cdFRyYW5zaXRpb25NYW5hZ2VyLmluaXQgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG5cdFx0dmFyIHBhcnNlZERhdGEgPSBfcGFyc2Vyc0RhdGFQYXJzZXIyWydkZWZhdWx0J10ucGFyc2VEYXRhKGNvbmZpZy5kYXRhKTtcblxuXHRcdC8qIEZTTSBzZXR1cCAqL1xuXHRcdF9jb3JlRnNtMlsnZGVmYXVsdCddLmluaXQoX3V0aWxzTWl4aW4yWydkZWZhdWx0J10oX3V0aWxzUGljazJbJ2RlZmF1bHQnXShjb25maWcsIGZzbUtleXMpLCBjb25maWcuZnNtKSk7XG5cdFx0X2NvcmVGc20yWydkZWZhdWx0J10uY3JlYXRlKHBhcnNlZERhdGEuZnNtQ29uZmlnKTtcblxuXHRcdC8qIFRyYW5zaXRpb24gVmlldyBNYW5hZ2VyIHNldHVwICovXG5cdFx0Y29uZmlnLnZpZXdNYW5hZ2VyID0gY29uZmlnLnZpZXdNYW5hZ2VyIHx8IF9jb3JlRGVmYXVsdFZpZXdNYW5hZ2VyMlsnZGVmYXVsdCddLmluaXQoX3V0aWxzUGljazJbJ2RlZmF1bHQnXShjb25maWcsIGluZGV4S2V5cykpO1xuXHRcdHZhciB0dm1Db25maWcgPSBfdXRpbHNNaXhpbjJbJ2RlZmF1bHQnXSh7IGNvbmZpZzogcGFyc2VkRGF0YS5UVk1Db25maWcgfSwgX3V0aWxzUGljazJbJ2RlZmF1bHQnXShjb25maWcsIHR2bUtleXMpLCBjb25maWcudHZtKTtcblx0XHRfY29yZVRyYW5zaXRpb25WaWV3TWFuYWdlcjJbJ2RlZmF1bHQnXS5jcmVhdGUodHZtQ29uZmlnKTtcblxuXHRcdC8qIFRyYW5zaXRpb24gQ29udHJvbGxlciBzZXR1cCAqL1xuXHRcdF9jb3JlVHJhbnNpdGlvbkNvbnRyb2xsZXIyWydkZWZhdWx0J10uaW5pdChfdXRpbHNNaXhpbjJbJ2RlZmF1bHQnXShfdXRpbHNQaWNrMlsnZGVmYXVsdCddKGNvbmZpZywgdGNLZXlzKSwgY29uZmlnLnRjKSk7XG5cblx0XHQvKioqIENvbm5lY3QgZWFjaCBtb2R1bGUgKioqL1xuXHRcdF9jb3JlRnNtMlsnZGVmYXVsdCddLnN0YXRlQ2hhbmdlZE1ldGhvZCA9IF9jb3JlVHJhbnNpdGlvblZpZXdNYW5hZ2VyMlsnZGVmYXVsdCddLnByb2Nlc3NWaWV3cztcblx0XHRfY29yZVRyYW5zaXRpb25WaWV3TWFuYWdlcjJbJ2RlZmF1bHQnXS52aWV3c1JlYWR5ID0gX2NvcmVUcmFuc2l0aW9uQ29udHJvbGxlcjJbJ2RlZmF1bHQnXS5wcm9jZXNzVHJhbnNpdGlvbjtcblx0XHRfY29yZVRyYW5zaXRpb25Db250cm9sbGVyMlsnZGVmYXVsdCddLnRyYW5zaXRpb25Db21wbGV0ZWQgPSBfY29yZUZzbTJbJ2RlZmF1bHQnXS50cmFuc2l0aW9uQ29tcGxldGU7XG5cblx0XHRMb2cuaW5pdExvZ2dlcihjb25maWcuZGVidWcpO1xuXHRcdExvZy5sb2coJ2luaXRpYXRlZCcpO1xuXHR9O1xuXG5cdC8qKlxuICAqIHN0YXJ0IHRoZSB0cmFuc2l0aW9uLW1hbmFnZXJcbiAgKiB0cmFuc2l0aW9ucyB0byB0aGUgaW5pdGlhbCBzdGF0ZVxuICAqL1xuXHRUcmFuc2l0aW9uTWFuYWdlci5zdGFydCA9IGZ1bmN0aW9uICgpIHtcblx0XHRfY29yZUZzbTJbJ2RlZmF1bHQnXS5zdGFydCgpO1xuXHR9O1xuXG5cdC8qKlxuICAqIFx0R2V0dGVycyBmb3IgdGhlIFRyYW5zaXRpb24gTWFuYWdlciBDb21wb25lbnRzXG4gICogIC0gYWN0aW9uIC0gZGVjbGFyZSBhY3Rpb24gdG8gc3RhcnQgXG4gICogIC0gY3VycmVudFN0YXRlIC0gZ2V0IGN1cnJlbnQgc3RhdGVcbiAgKiAgLSBjYW5jZWwgLSBjYW5jZWwgZnNtIHRyYW5zaXRpb25cbiAgKiAgLSBhZGRUcmFuc2l0aW9uIC0gYWRkIGEgdHJhbnNpdGlvbiBjb21wb25lbnRcbiAgKiAgLSByZW1vdmVUcmFuc2l0aW9uIC0gcmVtb3ZlIHRyYW5zaXRpb25cbiAgKiAgLSBoaXN0b3J5IC0gYWN0aW9uIGhpc3RvcnlcbiAgKi9cblxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoVHJhbnNpdGlvbk1hbmFnZXIsICdhY3Rpb24nLCB7IGdldDogZnVuY3Rpb24gZ2V0KCkge1xuXHRcdFx0cmV0dXJuIF9jb3JlRnNtMlsnZGVmYXVsdCddLmFjdGlvbjtcblx0XHR9IH0pO1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoVHJhbnNpdGlvbk1hbmFnZXIsICdjdXJyZW50U3RhdGUnLCB7IGdldDogZnVuY3Rpb24gZ2V0KCkge1xuXHRcdFx0cmV0dXJuIF9jb3JlRnNtMlsnZGVmYXVsdCddLmdldEN1cnJlbnRTdGF0ZTtcblx0XHR9IH0pO1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoVHJhbnNpdGlvbk1hbmFnZXIsICdjYW5jZWwnLCB7IGdldDogZnVuY3Rpb24gZ2V0KCkge1xuXHRcdFx0cmV0dXJuIF9jb3JlRnNtMlsnZGVmYXVsdCddLmNhbmNlbDtcblx0XHR9IH0pO1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoVHJhbnNpdGlvbk1hbmFnZXIsICdhZGRUcmFuc2l0aW9uJywgeyBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcblx0XHRcdHJldHVybiBfY29yZVRyYW5zaXRpb25Db250cm9sbGVyMlsnZGVmYXVsdCddLmFkZE1vZHVsZTtcblx0XHR9IH0pO1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoVHJhbnNpdGlvbk1hbmFnZXIsICdyZW1vdmVUcmFuc2l0aW9uJywgeyBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcblx0XHRcdHJldHVybiBfY29yZVRyYW5zaXRpb25Db250cm9sbGVyMlsnZGVmYXVsdCddLnJlbW92ZU1vZHVsZTtcblx0XHR9IH0pO1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoVHJhbnNpdGlvbk1hbmFnZXIsICdnZXRIaXN0b3J5JywgeyBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcblx0XHRcdHJldHVybiBfY29yZUZzbTJbJ2RlZmF1bHQnXS5nZXRIaXN0b3J5O1xuXHRcdH0gfSk7XG5cblx0LyoqXG4gICogU2lnbmFsc1xuICAqIC0gZnNtIHN0YXRlIGNoYW5nZWQgXG4gICogLSB0YyB0cmFuc2l0aW9uIHN0YXJ0ZWRcbiAgKiAtIHRjIGFsbFRyYW5zaXRpb25TdGFydGVkXG4gICovXG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShUcmFuc2l0aW9uTWFuYWdlciwgJ29uU3RhdGVDaGFuZ2VkJywgeyBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcblx0XHRcdHJldHVybiBfY29tbW9uRGlzcGF0Y2hlcjJbJ2RlZmF1bHQnXS5zdGF0ZUNoYW5nZWQ7XG5cdFx0fSB9KTtcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KFRyYW5zaXRpb25NYW5hZ2VyLCAnb25UcmFuc2l0aW9uU3RhcnRlZCcsIHsgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG5cdFx0XHRyZXR1cm4gX2NvbW1vbkRpc3BhdGNoZXIyWydkZWZhdWx0J10udHJhbnNpdGlvblN0YXJ0ZWQ7XG5cdFx0fSB9KTtcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KFRyYW5zaXRpb25NYW5hZ2VyLCAnb25BbGxUcmFuc2l0aW9uU3RhcnRlZCcsIHsgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG5cdFx0XHRyZXR1cm4gX2NvbW1vbkRpc3BhdGNoZXIyWydkZWZhdWx0J10udHJhbnNpdGlvbnNTdGFydGVkO1xuXHRcdH0gfSk7XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShUcmFuc2l0aW9uTWFuYWdlciwgJ29uQWxsVHJhbnNpdGlvbkNvbXBsZXRlZCcsIHsgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG5cdFx0XHRyZXR1cm4gX2NvbW1vbkRpc3BhdGNoZXIyWydkZWZhdWx0J10uYWxsVHJhbnNpdGlvbkNvbXBsZXRlZDtcblx0XHR9IH0pO1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoVHJhbnNpdGlvbk1hbmFnZXIsICd0cmFuc2l0aW9uQ29tcGxldGUnLCB7IGdldDogZnVuY3Rpb24gZ2V0KCkge1xuXHRcdFx0cmV0dXJuIF9jb21tb25EaXNwYXRjaGVyMlsnZGVmYXVsdCddLnRyYW5zaXRpb25Db21wbGV0ZTtcblx0XHR9IH0pO1xufSkoKTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gVHJhbnNpdGlvbk1hbmFnZXI7XG5cbm1vZHVsZS5leHBvcnRzID0geyAnYm9vbSc6ICd0ZXN0JyB9O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSWk5VmMyVnljeTkwWVd4M2IyOXNaaTlrWlhabGJHOXdaWEl2ZDJWaVVtOXZkQzkwY21GdWMybDBhVzl1TFcxaGJtRm5aWEl2YzNKakwybHVaR1Y0TG1weklsMHNJbTVoYldWeklqcGJYU3dpYldGd2NHbHVaM01pT2lJN096czdPenM3TzNWQ1FVRnRRaXhaUVVGWk96czdPM2xEUVVOYUxEaENRVUU0UWpzN096dDNRMEZETDBJc05rSkJRVFpDT3pzN08zTkRRVU40UWl3eVFrRkJNa0k3T3pzN2FVTkJRemRDTEhOQ1FVRnpRanM3T3pzMFFrRkRkRUlzYVVKQlFXbENPenM3T3pCQ1FVVnNRaXhsUVVGbE96czdPM2xDUVVOa0xHTkJRV003T3pzN1owTkJRMWdzY1VKQlFYRkNPenM3T3p0QlFVazNReXhKUVVGTkxFOUJRVThzUjBGQlJ5eERRVU5tTEZOQlFWTXNSVUZEVkN4UlFVRlJMRVZCUTFJc1kwRkJZeXhGUVVOa0xFOUJRVThzUTBGRFVDeERRVUZET3p0QlFVVkdMRWxCUVUwc1QwRkJUeXhIUVVGSExFTkJRMllzWVVGQllTeEZRVU5pTEU5QlFVOHNSVUZEVUN4VlFVRlZMRVZCUTFZc1QwRkJUeXhEUVVOUUxFTkJRVU03TzBGQlJVWXNTVUZCVFN4TlFVRk5MRWRCUVVjc1EwRkRaQ3hoUVVGaExFVkJRMklzVDBGQlR5eERRVU5RTEVOQlFVTTdPMEZCUlVZc1NVRkJUU3hUUVVGVExFZEJRVWNzUTBGRGFrSXNUMEZCVHl4RlFVTlFMRTlCUVU4c1JVRkRVQ3hoUVVGaExFTkJRMklzUTBGQlFUczdPenM3TzBGQlQwUXNTVUZCU1N4cFFrRkJhVUlzUjBGQlJ5eEZRVUZGTEVOQlFVTTdPMEZCUlROQ0xFTkJRVU1zV1VGRFJEczdRVUZGUXl4TFFVRk5MRWRCUVVjc1IwRkJSeXgzUWtGQlRTeEZRVUZGTEVsQlFVa3NSVUZCUnl4dFFrRkJiVUlzUlVGQlJTdzBRa0ZCVlN4RFFVRkRPenRCUVVVelJDeHJRa0ZCYVVJc1EwRkJReXhKUVVGSkxFZEJRVWNzVlVGQlZTeE5RVUZOTEVWQlEzcERPMEZCUTBNc1RVRkJTU3hWUVVGVkxFZEJRVWNzSzBKQlFVOHNVMEZCVXl4RFFVRkRMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6czdPMEZCUnk5RExIVkNRVUZKTEVsQlFVa3NRMEZCUlN4M1FrRkJUeXgxUWtGQlRTeE5RVUZOTEVWQlFVVXNUMEZCVHl4RFFVRkZMRVZCUVVVc1RVRkJUU3hEUVVGRExFZEJRVWNzUTBGQlJTeERRVUZGTEVOQlFVTTdRVUZEZWtRc2RVSkJRVWtzVFVGQlRTeERRVUZGTEZWQlFWVXNRMEZCUXl4VFFVRlRMRU5CUVVVc1EwRkJRenM3TzBGQlIyNURMRkZCUVUwc1EwRkJReXhYUVVGWExFZEJRVWtzVFVGQlRTeERRVUZETEZkQlFWY3NTVUZCU1N4dlEwRkJWU3hKUVVGSkxFTkJRVVVzZFVKQlFVMHNUVUZCVFN4RlFVRkZMRk5CUVZNc1EwRkJSU3hEUVVGRkxFTkJRVU03UVVGRGVFWXNUVUZCU1N4VFFVRlRMRWRCUVUwc2QwSkJRVThzUlVGQlJTeE5RVUZOTEVWQlFVY3NWVUZCVlN4RFFVRkRMRk5CUVZNc1JVRkJSU3hGUVVGRkxIVkNRVUZOTEUxQlFVMHNSVUZCUlN4UFFVRlBMRU5CUVVVc1JVRkJSU3hOUVVGTkxFTkJRVU1zUjBGQlJ5eERRVUZGTEVOQlFVTTdRVUZEYmtjc2VVTkJRVWtzVFVGQlRTeERRVUZGTEZOQlFWTXNRMEZCUlN4RFFVRkRPenM3UVVGSGVFSXNkME5CUVVjc1NVRkJTU3hEUVVGRkxIZENRVUZQTEhWQ1FVRk5MRTFCUVUwc1JVRkJSU3hOUVVGTkxFTkJRVVVzUlVGQlJTeE5RVUZOTEVOQlFVTXNSVUZCUlN4RFFVRkZMRU5CUVVVc1EwRkJRenM3TzBGQlIzUkVMSFZDUVVGSkxHdENRVUZyUWl4SFFVRkpMSFZEUVVGSkxGbEJRVmtzUTBGQlF6dEJRVU16UXl4NVEwRkJTU3hWUVVGVkxFZEJRVTBzYzBOQlFVY3NhVUpCUVdsQ0xFTkJRVU03UVVGRGVrTXNkME5CUVVjc2JVSkJRVzFDTEVkQlFVa3NjVUpCUVVrc2EwSkJRV3RDTEVOQlFVTTdPMEZCUldwRUxFdEJRVWNzUTBGQlF5eFZRVUZWTEVOQlFVVXNUVUZCVFN4RFFVRkRMRXRCUVVzc1EwRkJSU3hEUVVGRE8wRkJReTlDTEV0QlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVVc1YwRkJWeXhEUVVGRkxFTkJRVU03UlVGRmRrSXNRMEZCUVRzN096czdPMEZCVFVRc2EwSkJRV2xDTEVOQlFVTXNTMEZCU3l4SFFVRkhMRmxCUVZjN1FVRkRjRU1zZFVKQlFVa3NTMEZCU3l4RlFVRkZMRU5CUVVNN1JVRkRXaXhEUVVGQk96czdPenM3T3pzN096czdRVUZaUkN4UFFVRk5MRU5CUVVNc1kwRkJZeXhEUVVGRkxHbENRVUZwUWl4RlFVRkZMRkZCUVZFc1JVRkJSU3hGUVVGRkxFZEJRVWNzUlVGQlJ5eGxRVUZYTzBGQlFVVXNWVUZCVHl4eFFrRkJTU3hOUVVGTkxFTkJRVU03UjBGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXp0QlFVTnFSeXhQUVVGTkxFTkJRVU1zWTBGQll5eERRVUZGTEdsQ1FVRnBRaXhGUVVGRkxHTkJRV01zUlVGQlJTeEZRVUZGTEVkQlFVY3NSVUZCUnl4bFFVRlhPMEZCUVVVc1ZVRkJUeXh4UWtGQlNTeGxRVUZsTEVOQlFVTTdSMEZCUlN4RlFVRkZMRU5CUVVNc1EwRkJRenRCUVVOb1NDeFBRVUZOTEVOQlFVTXNZMEZCWXl4RFFVRkZMR2xDUVVGcFFpeEZRVUZGTEZGQlFWRXNSVUZCUlN4RlFVRkZMRWRCUVVjc1JVRkJSeXhsUVVGWE8wRkJRVVVzVlVGQlR5eHhRa0ZCU1N4TlFVRk5MRU5CUVVNN1IwRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF6dEJRVU5xUnl4UFFVRk5MRU5CUVVNc1kwRkJZeXhEUVVGRkxHbENRVUZwUWl4RlFVRkZMR1ZCUVdVc1JVRkJSU3hGUVVGRkxFZEJRVWNzUlVGQlJ5eGxRVUZYTzBGQlFVVXNWVUZCVHl4elEwRkJSeXhUUVVGVExFTkJRVU03UjBGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXp0QlFVTXhSeXhQUVVGTkxFTkJRVU1zWTBGQll5eERRVUZGTEdsQ1FVRnBRaXhGUVVGRkxHdENRVUZyUWl4RlFVRkZMRVZCUVVVc1IwRkJSeXhGUVVGSExHVkJRVmM3UVVGQlJTeFZRVUZQTEhORFFVRkhMRmxCUVZrc1EwRkJRenRIUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETzBGQlEyaElMRTlCUVUwc1EwRkJReXhqUVVGakxFTkJRVVVzYVVKQlFXbENMRVZCUVVVc1dVRkJXU3hGUVVGRkxFVkJRVVVzUjBGQlJ5eEZRVUZITEdWQlFWYzdRVUZCUlN4VlFVRlBMSEZDUVVGSkxGVkJRVlVzUTBGQlF6dEhRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRPenM3T3pzN096dEJRVk40Unl4UFFVRk5MRU5CUVVNc1kwRkJZeXhEUVVGRkxHbENRVUZwUWl4RlFVRkZMR2RDUVVGblFpeEZRVUZGTEVWQlFVVXNSMEZCUnl4RlFVRkhMR1ZCUVZjN1FVRkJSU3hWUVVGUExEaENRVUZYTEZsQlFWa3NRMEZCUXp0SFFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRE8wRkJRM1JJTEU5QlFVMHNRMEZCUXl4alFVRmpMRU5CUVVVc2FVSkJRV2xDTEVWQlFVVXNjVUpCUVhGQ0xFVkJRVVVzUlVGQlJTeEhRVUZITEVWQlFVY3NaVUZCVnp0QlFVRkZMRlZCUVU4c09FSkJRVmNzYVVKQlFXbENMRU5CUVVNN1IwRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF6dEJRVU5vU1N4UFFVRk5MRU5CUVVNc1kwRkJZeXhEUVVGRkxHbENRVUZwUWl4RlFVRkZMSGRDUVVGM1FpeEZRVUZGTEVWQlFVVXNSMEZCUnl4RlFVRkhMR1ZCUVZjN1FVRkJSU3hWUVVGUExEaENRVUZYTEd0Q1FVRnJRaXhEUVVGRE8wZEJRVVVzUlVGQlJTeERRVUZETEVOQlFVTTdRVUZEY0Vrc1QwRkJUU3hEUVVGRExHTkJRV01zUTBGQlJTeHBRa0ZCYVVJc1JVRkJSU3d3UWtGQk1FSXNSVUZCUlN4RlFVRkZMRWRCUVVjc1JVRkJSeXhsUVVGWE8wRkJRVVVzVlVGQlR5dzRRa0ZCVnl4elFrRkJjMElzUTBGQlF6dEhRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRPMEZCUXpGSkxFOUJRVTBzUTBGQlF5eGpRVUZqTEVOQlFVVXNhVUpCUVdsQ0xFVkJRVVVzYjBKQlFXOUNMRVZCUVVVc1JVRkJSU3hIUVVGSExFVkJRVWNzWlVGQlZ6dEJRVUZGTEZWQlFVOHNPRUpCUVZjc2EwSkJRV3RDTEVOQlFVTTdSMEZCUlN4RlFVRkZMRU5CUVVNc1EwRkJRenREUVVWcVNTeERRVUZCTEVWQlFVY3NRMEZCUXpzN2NVSkJSVlVzYVVKQlFXbENPenRCUVVOb1F5eE5RVUZOTEVOQlFVTXNUMEZCVHl4SFFVRkhMRVZCUVVVc1RVRkJUU3hGUVVGSExFMUJRVTBzUlVGQlJTeERRVUZESWl3aVptbHNaU0k2SWk5VmMyVnljeTkwWVd4M2IyOXNaaTlrWlhabGJHOXdaWEl2ZDJWaVVtOXZkQzkwY21GdWMybDBhVzl1TFcxaGJtRm5aWEl2YzNKakwybHVaR1Y0TG1weklpd2ljMjkxY21ObGMwTnZiblJsYm5RaU9sc2lhVzF3YjNKMElHWnpiU0JjZEZ4MFhIUm1jbTl0SUNjdUwyTnZjbVV2Wm5OdEp6dGNibWx0Y0c5eWRDQjBkbTBnWEhSY2RGeDBabkp2YlNBbkxpOWpiM0psTDNSeVlXNXphWFJwYjI1V2FXVjNUV0Z1WVdkbGNpYzdYRzVwYlhCdmNuUWdkR01nWEhSY2RGeDBabkp2YlNBbkxpOWpiM0psTDNSeVlXNXphWFJwYjI1RGIyNTBjbTlzYkdWeUp6dGNibWx0Y0c5eWRDQmtaV1poZFd4MFZtMGdYSFJtY205dElDY3VMMk52Y21VdlpHVm1ZWFZzZEZacFpYZE5ZVzVoWjJWeUp6dGNibWx0Y0c5eWRDQndZWEp6WlhJZ1hIUmNkR1p5YjIwZ0p5NHZjR0Z5YzJWeWN5OWtZWFJoVUdGeWMyVnlKenRjYm1sdGNHOXlkQ0JNYjJkblpYSWdYSFJjZEdaeWIyMGdKeTR2WTI5dGJXOXVMMnh2WjJkbGNpYzdYRzVjYm1sdGNHOXlkQ0J0YVhocGJpQmNkRngwWm5KdmJTQW5MaTkxZEdsc2N5OXRhWGhwYmljN1hHNXBiWEJ2Y25RZ2NHbGphMXgwWEhRZ0lGeDBabkp2YlNBbkxpOTFkR2xzY3k5d2FXTnJKenRjYm1sdGNHOXlkQ0JrYVhOd1lYUmphR1Z5SUZ4MFpuSnZiU0FuTGk5amIyMXRiMjR2WkdsemNHRjBZMmhsY2ljN1hHNWNibHh1THlvZ1puTnRJR052Ym1acFp5QndiSFZqYXlCclpYbHpJQ292WEc1amIyNXpkQ0JtYzIxTFpYbHpJRDBnVzF4dVhIUW5hR2x6ZEc5eWVTY3NYRzVjZENkc2FXMXBkSEVuTEZ4dVhIUW5jWFJ5WVc1emFYUnBiMjV6Snl4Y2JseDBKMlJsWW5WbkoxeHVYVHRjYmk4cUlIUjJiU0JqYjI1bWFXY2djR3gxWTJzZ2EyVjVjeUFxTDF4dVkyOXVjM1FnZEhadFMyVjVjeUE5SUZ0Y2JseDBKM1pwWlhkTllXNWhaMlZ5Snl4Y2JseDBKM1pwWlhkekp5eGNibHgwSjNWelpVTmhZMmhsSnl4Y2JseDBKMlJsWW5WbkoxeHVYVHRjYmk4cUlIUmpJR052Ym1acFp5QndiSFZqYXlCclpYbHpJQ292WEc1amIyNXpkQ0IwWTB0bGVYTWdQU0JiWEc1Y2RDZDBjbUZ1YzJsMGFXOXVjeWNzWEc1Y2RDZGtaV0oxWnlkY2JsMDdYRzR2S2lCMGFHbHpJR052Ym1acFp5QndiSFZqYXlCclpYbHpJQ292WEc1amIyNXpkQ0JwYm1SbGVFdGxlWE1nUFNCYlhHNWNkQ2RrWldKMVp5Y3NYRzVjZENkMmFXVjNjeWNzWEc1Y2RDZDJhV1YzVFdGdVlXZGxjaWRjYmwxY2JseHVYRzR2S2lwY2JpQXFJSEpoYm5OcGRHbHZiaUJ0WVc1aFoyVnlJQzBnVkhKaGJuTnBkR2x2YmlCamIyMXdiMjVsYm5RZ1ptRmpZV1FnZDNKaGNIQmxjbHh1SUNvZ1FIUjVjR1VnZTA5aWFtVmpkSDFjYmlBcUwxeHVkbUZ5SUZSeVlXNXphWFJwYjI1TllXNWhaMlZ5SUQwZ2UzMDdYRzVjYmlobWRXNWpkR2x2YmlncFhHNTdYSFJjYmx4MEx5b2djSEpwZG1GMFpTQk1iMmRuWlhJZ0tpOWNibHgwWTI5dWMzUWdURzluSUQwZ2JXbDRhVzRvZXlCdVlXMWxJRG9nSjFSeVlXNXphWFJwYjI1TllXNWhaMlZ5SnlCOUxDQk1iMmRuWlhJZ0tUdGNibHh1WEhSVWNtRnVjMmwwYVc5dVRXRnVZV2RsY2k1cGJtbDBJRDBnWm5WdVkzUnBiMjRvSUdOdmJtWnBaeUFwWEc1Y2RIdGNibHgwWEhSc1pYUWdjR0Z5YzJWa1JHRjBZU0E5SUhCaGNuTmxjaTV3WVhKelpVUmhkR0VvWTI5dVptbG5MbVJoZEdFcE8xeHVYRzVjZEZ4MEx5b2dSbE5OSUhObGRIVndJQ292WEc1Y2RGeDBabk50TG1sdWFYUW9JRzFwZUdsdUtDQndhV05yS0NCamIyNW1hV2NzSUdaemJVdGxlWE1nS1N3Z1kyOXVabWxuTG1aemJTQXBJQ2s3WEc1Y2RGeDBabk50TG1OeVpXRjBaU2dnY0dGeWMyVmtSR0YwWVM1bWMyMURiMjVtYVdjZ0tUdGNibHh1WEhSY2RDOHFJRlJ5WVc1emFYUnBiMjRnVm1sbGR5Qk5ZVzVoWjJWeUlITmxkSFZ3SUNvdlhHNWNkRngwWTI5dVptbG5MblpwWlhkTllXNWhaMlZ5SUZ4MFBTQmpiMjVtYVdjdWRtbGxkMDFoYm1GblpYSWdmSHdnWkdWbVlYVnNkRlp0TG1sdWFYUW9JSEJwWTJzb0lHTnZibVpwWnl3Z2FXNWtaWGhMWlhseklDa2dLVHRjYmx4MFhIUnNaWFFnZEhadFEyOXVabWxuSUZ4MFhIUTlJQ0J0YVhocGJpZ2dleUJqYjI1bWFXY2dPaUJ3WVhKelpXUkVZWFJoTGxSV1RVTnZibVpwWnlCOUxDQndhV05yS0NCamIyNW1hV2NzSUhSMmJVdGxlWE1nS1N3Z1kyOXVabWxuTG5SMmJTQXBPMXh1WEhSY2RIUjJiUzVqY21WaGRHVW9JSFIyYlVOdmJtWnBaeUFwTzF4dVhHNWNkRngwTHlvZ1ZISmhibk5wZEdsdmJpQkRiMjUwY205c2JHVnlJSE5sZEhWd0lDb3ZYRzVjZEZ4MGRHTXVhVzVwZENnZ2JXbDRhVzRvSUhCcFkyc29JR052Ym1acFp5d2dkR05MWlhseklDa3NJR052Ym1acFp5NTBZeUFwSUNrN1hHNWNibHgwWEhRdktpb3FJRU52Ym01bFkzUWdaV0ZqYUNCdGIyUjFiR1VnS2lvcUwxeHVYSFJjZEdaemJTNXpkR0YwWlVOb1lXNW5aV1JOWlhSb2IyUWdJRDBnZEhadExuQnliMk5sYzNOV2FXVjNjenRjYmx4MFhIUjBkbTB1ZG1sbGQzTlNaV0ZrZVNCY2RGeDBYSFE5SUhSakxuQnliMk5sYzNOVWNtRnVjMmwwYVc5dU8xeHVYSFJjZEhSakxuUnlZVzV6YVhScGIyNURiMjF3YkdWMFpXUWdJRDBnWm5OdExuUnlZVzV6YVhScGIyNURiMjF3YkdWMFpUdGNibHh1WEhSY2RFeHZaeTVwYm1sMFRHOW5aMlZ5S0NCamIyNW1hV2N1WkdWaWRXY2dLVHRjYmx4MFhIUk1iMmN1Ykc5bktDQW5hVzVwZEdsaGRHVmtKeUFwTzF4dVhIUmNkRnh1WEhSOVhIUmNibHh1WEhRdktpcGNibHgwSUNvZ2MzUmhjblFnZEdobElIUnlZVzV6YVhScGIyNHRiV0Z1WVdkbGNseHVYSFFnS2lCMGNtRnVjMmwwYVc5dWN5QjBieUIwYUdVZ2FXNXBkR2xoYkNCemRHRjBaVnh1WEhRZ0tpOWNibHgwVkhKaGJuTnBkR2x2YmsxaGJtRm5aWEl1YzNSaGNuUWdQU0JtZFc1amRHbHZiaWdwSUh0Y2JseDBYSFJtYzIwdWMzUmhjblFvS1R0Y2JseDBmVnh1WEc1Y2RDOHFLbHh1WEhRZ0tpQmNkRWRsZEhSbGNuTWdabTl5SUhSb1pTQlVjbUZ1YzJsMGFXOXVJRTFoYm1GblpYSWdRMjl0Y0c5dVpXNTBjMXh1WEhRZ0tpQWdMU0JoWTNScGIyNGdMU0JrWldOc1lYSmxJR0ZqZEdsdmJpQjBieUJ6ZEdGeWRDQmNibHgwSUNvZ0lDMGdZM1Z5Y21WdWRGTjBZWFJsSUMwZ1oyVjBJR04xY25KbGJuUWdjM1JoZEdWY2JseDBJQ29nSUMwZ1kyRnVZMlZzSUMwZ1kyRnVZMlZzSUdaemJTQjBjbUZ1YzJsMGFXOXVYRzVjZENBcUlDQXRJR0ZrWkZSeVlXNXphWFJwYjI0Z0xTQmhaR1FnWVNCMGNtRnVjMmwwYVc5dUlHTnZiWEJ2Ym1WdWRGeHVYSFFnS2lBZ0xTQnlaVzF2ZG1WVWNtRnVjMmwwYVc5dUlDMGdjbVZ0YjNabElIUnlZVzV6YVhScGIyNWNibHgwSUNvZ0lDMGdhR2x6ZEc5eWVTQXRJR0ZqZEdsdmJpQm9hWE4wYjNKNVhHNWNkQ0FxTDF4dVhHNWNkRTlpYW1WamRDNWtaV1pwYm1WUWNtOXdaWEowZVNnZ1ZISmhibk5wZEdsdmJrMWhibUZuWlhJc0lDZGhZM1JwYjI0bkxDQjdJR2RsZENBNklHWjFibU4wYVc5dUtDa2dleUJ5WlhSMWNtNGdabk50TG1GamRHbHZianNnZlNCOUtUdGNibHgwVDJKcVpXTjBMbVJsWm1sdVpWQnliM0JsY25SNUtDQlVjbUZ1YzJsMGFXOXVUV0Z1WVdkbGNpd2dKMk4xY25KbGJuUlRkR0YwWlNjc0lIc2daMlYwSURvZ1puVnVZM1JwYjI0b0tTQjdJSEpsZEhWeWJpQm1jMjB1WjJWMFEzVnljbVZ1ZEZOMFlYUmxPeUI5SUgwcE8xeHVYSFJQWW1wbFkzUXVaR1ZtYVc1bFVISnZjR1Z5ZEhrb0lGUnlZVzV6YVhScGIyNU5ZVzVoWjJWeUxDQW5ZMkZ1WTJWc0p5d2dleUJuWlhRZ09pQm1kVzVqZEdsdmJpZ3BJSHNnY21WMGRYSnVJR1p6YlM1allXNWpaV3c3SUgwZ2ZTazdYRzVjZEU5aWFtVmpkQzVrWldacGJtVlFjbTl3WlhKMGVTZ2dWSEpoYm5OcGRHbHZiazFoYm1GblpYSXNJQ2RoWkdSVWNtRnVjMmwwYVc5dUp5d2dleUJuWlhRZ09pQm1kVzVqZEdsdmJpZ3BJSHNnY21WMGRYSnVJSFJqTG1Ga1pFMXZaSFZzWlRzZ2ZTQjlLVHRjYmx4MFQySnFaV04wTG1SbFptbHVaVkJ5YjNCbGNuUjVLQ0JVY21GdWMybDBhVzl1VFdGdVlXZGxjaXdnSjNKbGJXOTJaVlJ5WVc1emFYUnBiMjRuTENCN0lHZGxkQ0E2SUdaMWJtTjBhVzl1S0NrZ2V5QnlaWFIxY200Z2RHTXVjbVZ0YjNabFRXOWtkV3hsT3lCOUlIMHBPMXh1WEhSUFltcGxZM1F1WkdWbWFXNWxVSEp2Y0dWeWRIa29JRlJ5WVc1emFYUnBiMjVOWVc1aFoyVnlMQ0FuWjJWMFNHbHpkRzl5ZVNjc0lIc2daMlYwSURvZ1puVnVZM1JwYjI0b0tTQjdJSEpsZEhWeWJpQm1jMjB1WjJWMFNHbHpkRzl5ZVRzZ2ZTQjlLVHRjYmx4MFhHNWNkQ0JjYmx4MElDOHFLbHh1WEhRZ0lDb2dVMmxuYm1Gc2MxeHVYSFFnSUNvZ0xTQm1jMjBnYzNSaGRHVWdZMmhoYm1kbFpDQmNibHgwSUNBcUlDMGdkR01nZEhKaGJuTnBkR2x2YmlCemRHRnlkR1ZrWEc1Y2RDQWdLaUF0SUhSaklHRnNiRlJ5WVc1emFYUnBiMjVUZEdGeWRHVmtYRzVjZENBZ0tpOWNibHgwSUU5aWFtVmpkQzVrWldacGJtVlFjbTl3WlhKMGVTZ2dWSEpoYm5OcGRHbHZiazFoYm1GblpYSXNJQ2R2YmxOMFlYUmxRMmhoYm1kbFpDY3NJSHNnWjJWMElEb2dablZ1WTNScGIyNG9LU0I3SUhKbGRIVnliaUJrYVhOd1lYUmphR1Z5TG5OMFlYUmxRMmhoYm1kbFpEc2dmU0I5S1R0Y2JseDBJRTlpYW1WamRDNWtaV1pwYm1WUWNtOXdaWEowZVNnZ1ZISmhibk5wZEdsdmJrMWhibUZuWlhJc0lDZHZibFJ5WVc1emFYUnBiMjVUZEdGeWRHVmtKeXdnZXlCblpYUWdPaUJtZFc1amRHbHZiaWdwSUhzZ2NtVjBkWEp1SUdScGMzQmhkR05vWlhJdWRISmhibk5wZEdsdmJsTjBZWEowWldRN0lIMGdmU2s3WEc1Y2RDQlBZbXBsWTNRdVpHVm1hVzVsVUhKdmNHVnlkSGtvSUZSeVlXNXphWFJwYjI1TllXNWhaMlZ5TENBbmIyNUJiR3hVY21GdWMybDBhVzl1VTNSaGNuUmxaQ2NzSUhzZ1oyVjBJRG9nWm5WdVkzUnBiMjRvS1NCN0lISmxkSFZ5YmlCa2FYTndZWFJqYUdWeUxuUnlZVzV6YVhScGIyNXpVM1JoY25SbFpEc2dmU0I5S1R0Y2JseDBJRTlpYW1WamRDNWtaV1pwYm1WUWNtOXdaWEowZVNnZ1ZISmhibk5wZEdsdmJrMWhibUZuWlhJc0lDZHZia0ZzYkZSeVlXNXphWFJwYjI1RGIyMXdiR1YwWldRbkxDQjdJR2RsZENBNklHWjFibU4wYVc5dUtDa2dleUJ5WlhSMWNtNGdaR2x6Y0dGMFkyaGxjaTVoYkd4VWNtRnVjMmwwYVc5dVEyOXRjR3hsZEdWa095QjlJSDBwTzF4dVhIUWdUMkpxWldOMExtUmxabWx1WlZCeWIzQmxjblI1S0NCVWNtRnVjMmwwYVc5dVRXRnVZV2RsY2l3Z0ozUnlZVzV6YVhScGIyNURiMjF3YkdWMFpTY3NJSHNnWjJWMElEb2dablZ1WTNScGIyNG9LU0I3SUhKbGRIVnliaUJrYVhOd1lYUmphR1Z5TG5SeVlXNXphWFJwYjI1RGIyMXdiR1YwWlRzZ2ZTQjlLVHRjYmx4dWZTa29LVHRjYmx4dVpYaHdiM0owSUdSbFptRjFiSFFnVkhKaGJuTnBkR2x2YmsxaGJtRm5aWEk3WEc1dGIyUjFiR1V1Wlhod2IzSjBjeUE5SUhzZ0oySnZiMjBuSURvZ0ozUmxjM1FuSUgwN1hHNGlYWDA9IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7XG5cdHZhbHVlOiB0cnVlXG59KTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX3V0aWxzRm9ySW4gPSByZXF1aXJlKCcuLi91dGlscy9mb3JJbicpO1xuXG52YXIgX3V0aWxzRm9ySW4yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXRpbHNGb3JJbik7XG5cbnZhciBfdXRpbHNVbmlxdWUgPSByZXF1aXJlKCcuLi91dGlscy91bmlxdWUnKTtcblxudmFyIF91dGlsc1VuaXF1ZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91dGlsc1VuaXF1ZSk7XG5cbnZhciBBcHBEYXRhUGFyc2VyID0ge307XG5cbihmdW5jdGlvbiAoKSB7XG5cdC8qKlxuICAqIGV4dHJhY3QgdGhlIGFjdHVhbCB0cmFuc2l0aW9uIGRhdGEgZm9yIHRoZSBzdGF0ZVxuICAqIEBwYXJhbSAge29iamVjdH0gY29uZmlnU3RhdGUgLSBzdGF0ZSBkYXRhXG4gICogQHJldHVybiB7YXJyYXl9IHRyYW5zaXRpb24gYXJyYXkgLSBGU01cbiAgKi9cblx0ZnVuY3Rpb24gX2V4dHJhY3RBY3Rpb25zKG9wdHMpIHtcblx0XHQvLyBtYWluIHByb3BlcnRpZXNcblx0XHR2YXIgZGF0YSA9IG9wdHMuZGF0YSxcblx0XHQgICAgY29uZmlnU3RhdGUgPSBvcHRzLnN0YXRlRGF0YSxcblx0XHQgICAgc3RhdGVWaWV3ID0gb3B0cy5zdGF0ZVZpZXcsXG5cdFx0ICAgIHN0YXRlTmFtZSA9IG9wdHMuc3RhdGVOYW1lO1xuXG5cdFx0Ly8gbmV3IGRlZmluZWQgcHJvcGVydGllc1xuXHRcdHZhciBzdGF0ZVRyYW5zaXRpb25zID0gW10sXG5cdFx0ICAgIHZpZXdEYXRhID0gb3B0cy52aWV3RGF0YSxcblx0XHQgICAgYXBwRGF0YVZpZXcgPSB1bmRlZmluZWQsXG5cdFx0ICAgIGFjdGlvbiA9IHVuZGVmaW5lZCxcblx0XHQgICAgc3RhdGVQcmVmaXggPSB1bmRlZmluZWQ7XG5cblx0XHRfdXRpbHNGb3JJbjJbJ2RlZmF1bHQnXShjb25maWdTdGF0ZS5hY3Rpb25zLCBmdW5jdGlvbiAocHJvcCwgYWN0aW9uTmFtZSkge1xuXG5cdFx0XHRzdGF0ZVByZWZpeCA9IHN0YXRlTmFtZSArICctPicgKyBhY3Rpb25OYW1lO1xuXHRcdFx0YXBwRGF0YVZpZXcgPSBkYXRhW3Byb3AudGFyZ2V0XS52aWV3O1xuXG5cdFx0XHQvLyBSZXR1cm4gYWN0aW9uIGRhdGEgZm9yIEZTTVxuXHRcdFx0YWN0aW9uID0ge1xuXHRcdFx0XHRhY3Rpb246IGFjdGlvbk5hbWUsXG5cdFx0XHRcdHRhcmdldDogcHJvcC50YXJnZXQsXG5cdFx0XHRcdF9pZDogc3RhdGVQcmVmaXhcblx0XHRcdH07XG5cblx0XHRcdC8vIHJldHVybiBWaWV3RGF0YSBmb3IgVmlldyBtYW5hZ2VyIGFuZCBhcHBlbmQgYWxsIHZpZXdzXG5cdFx0XHR2aWV3RGF0YVtzdGF0ZVByZWZpeF0gPSB7XG5cdFx0XHRcdGN1cnJlbnRWaWV3OiBzdGF0ZVZpZXcsXG5cdFx0XHRcdG5leHRWaWV3OiBhcHBEYXRhVmlldyxcblx0XHRcdFx0bGlua2VkVlRyYW5zTW9kdWxlczogX2V4dHJhY3RUcmFuc2l0aW9ucyhwcm9wLCBzdGF0ZVZpZXcsIGFwcERhdGFWaWV3KSxcblx0XHRcdFx0bmFtZTogYWN0aW9uTmFtZVxuXHRcdFx0fTtcblxuXHRcdFx0Ly8gLy8gYXNzaWduIGZzbSBhY3Rpb24gdG8gc3RhdGVcblx0XHRcdHN0YXRlVHJhbnNpdGlvbnNbc3RhdGVUcmFuc2l0aW9ucy5sZW5ndGhdID0gYWN0aW9uO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHsgc3RhdGVUcmFuc2l0aW9uczogc3RhdGVUcmFuc2l0aW9ucywgdmlld0RhdGE6IHZpZXdEYXRhIH07XG5cdH1cblxuXHQvKipcbiAgKiBleHRyYWN0IHRyYW5zaXRpb24gaW5mb3JtYXRpb25cbiAgKiBhbmQgZXh0cmFjdCBkYXRhIGlmIHRyYW5zaXRpb24gaW5mb3JtYXRpb24gaXNcbiAgKiBhbiBhcnJheSBvZiB0cmFuc2l0aW9uc1xuICAqIEBwYXJhbSAge29uYmplY3R9IHByb3AgICAgIFxuICAqIEBwYXJhbSAge3N0cmluZ30gc3RhdGVWaWV3IC0gaWQgb2Ygc3RhdGUgdmlld1xuICAqIEBwYXJhbSAge3N0cmluZ30gbmV4dFZpZXcgIC0gaWQgb2YgdmlldyB0aGlzIHRyYW5zaXRpb24gZ29lcyB0b1xuICAqIEByZXR1cm4ge2FycmF5fSBhcnJheSBvZiB0cmFuc2l0aW9ucyBmb3QgdGhpcyBhY3Rpb25cbiAgKi9cblx0ZnVuY3Rpb24gX2V4dHJhY3RUcmFuc2l0aW9ucyhwcm9wLCBzdGF0ZVZpZXcsIG5leHRWaWV3KSB7XG5cdFx0dmFyIGdyb3VwZWRUcmFuc2l0aW9ucyA9IFtdO1xuXHRcdGlmIChwcm9wLnRyYW5zaXRpb25zKSB7XG5cdFx0XHQvLyBpZiBtb3JlIHRyYW5zaXRpb25zIGV4aXN0LCBhZGQgdGhlbVxuXHRcdFx0Z3JvdXBlZFRyYW5zaXRpb25zID0gcHJvcC50cmFuc2l0aW9ucy5tYXAoZnVuY3Rpb24gKHRyYW5zaXRpb25PYmplY3QpIHtcblx0XHRcdFx0cmV0dXJuIHRyYW5zaXRpb25PYmplY3Q7XG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0cHJvcC52aWV3cyA9IF91dGlsc1VuaXF1ZTJbJ2RlZmF1bHQnXShwcm9wLnZpZXdzLCBbc3RhdGVWaWV3LCBuZXh0Vmlld10pO1xuXHRcdGdyb3VwZWRUcmFuc2l0aW9ucy51bnNoaWZ0KHsgdHJhbnNpdGlvblR5cGU6IHByb3AudHJhbnNpdGlvblR5cGUsIHZpZXdzOiBwcm9wLnZpZXdzIH0pO1xuXHRcdHJldHVybiBncm91cGVkVHJhbnNpdGlvbnM7XG5cdH1cblxuXHQvKipcbiAgKiBFeHRyYWN0IG9ubHkgdGhlIEZTTSBkYXRhIGZyb20gdGhlIGNvbmZpZyBmaWxlXG4gICogY3JlYXRlIHN0YXRlc1xuICAqIEBwYXJhbSAge29iamVjdH0gZGF0YSBcbiAgKiBAcmV0dXJuIHtvYmplY3R9IGZzbSBmb3JtYXR0ZWQgY29uZmlnXG4gICovXG5cdEFwcERhdGFQYXJzZXIucGFyc2VEYXRhID0gZnVuY3Rpb24gKGRhdGEpIHtcblx0XHRpZiAoIWRhdGEpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignKkRhdGEgT2JqZWN0IGlzIHVuZGVmaW5lZCEnKTtyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0dmFyIGNvbmZpZyA9IFtdLFxuXHRcdCAgICB2aWV3RGF0YSA9IHt9LFxuXHRcdCAgICBleHRyYWN0ZWQgPSB1bmRlZmluZWQsXG5cdFx0ICAgIHN0YXRlID0gdW5kZWZpbmVkO1xuXG5cdFx0X3V0aWxzRm9ySW4yWydkZWZhdWx0J10oZGF0YSwgZnVuY3Rpb24gKHN0YXRlRGF0YSwgc3RhdGVOYW1lKSB7XG5cdFx0XHRleHRyYWN0ZWQgPSBfZXh0cmFjdEFjdGlvbnMoe1xuXHRcdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0XHRzdGF0ZURhdGE6IHN0YXRlRGF0YSxcblx0XHRcdFx0dmlld0RhdGE6IHZpZXdEYXRhLFxuXHRcdFx0XHRzdGF0ZVZpZXc6IHN0YXRlRGF0YS52aWV3LFxuXHRcdFx0XHRzdGF0ZU5hbWU6IHN0YXRlTmFtZVxuXHRcdFx0fSk7XG5cblx0XHRcdHN0YXRlID0ge1xuXHRcdFx0XHRuYW1lOiBzdGF0ZU5hbWUsXG5cdFx0XHRcdGluaXRpYWw6IHN0YXRlRGF0YS5pbml0aWFsLFxuXHRcdFx0XHRzdGF0ZVRyYW5zaXRpb25zOiBleHRyYWN0ZWQuc3RhdGVUcmFuc2l0aW9uc1xuXHRcdFx0fTtcblxuXHRcdFx0Y29uZmlnW2NvbmZpZy5sZW5ndGhdID0gc3RhdGU7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4geyBmc21Db25maWc6IGNvbmZpZywgVFZNQ29uZmlnOiBleHRyYWN0ZWQudmlld0RhdGEgfTtcblx0fTtcbn0pKCk7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IEFwcERhdGFQYXJzZXI7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJaTlWYzJWeWN5OTBZV3gzYjI5c1ppOWtaWFpsYkc5d1pYSXZkMlZpVW05dmRDOTBjbUZ1YzJsMGFXOXVMVzFoYm1GblpYSXZjM0pqTDNCaGNuTmxjbk12WkdGMFlWQmhjbk5sY2k1cWN5SmRMQ0p1WVcxbGN5STZXMTBzSW0xaGNIQnBibWR6SWpvaU96czdPenM3T3pzd1FrRkJiVUlzWjBKQlFXZENPenM3T3pKQ1FVTm9RaXhwUWtGQmFVSTdPenM3UVVGSGNFTXNTVUZCVFN4aFFVRmhMRWRCUVVjc1JVRkJSU3hEUVVGRE96dEJRVVY2UWl4RFFVRkRMRmxCUTBRN096czdPenRCUVUxRExGVkJRVk1zWlVGQlpTeERRVUZGTEVsQlFVa3NSVUZET1VJN08wRkJSVU1zVFVGQlR5eEpRVUZKTEVkQlFVc3NTVUZCU1N4RFFVRkRMRWxCUVVrN1RVRkRka0lzVjBGQlZ5eEhRVUZITEVsQlFVa3NRMEZCUXl4VFFVRlRPMDFCUXpWQ0xGTkJRVk1zUjBGQlNTeEpRVUZKTEVOQlFVTXNVMEZCVXp0TlFVTXpRaXhUUVVGVExFZEJRVXNzU1VGQlNTeERRVUZETEZOQlFWTXNRMEZCUXpzN08wRkJSeTlDTEUxQlFVa3NaMEpCUVdkQ0xFZEJRVWNzUlVGQlJUdE5RVU40UWl4UlFVRlJMRWRCUVUwc1NVRkJTU3hEUVVGRExGRkJRVkU3VFVGRE0wSXNWMEZCVnl4WlFVRkJPMDFCUTFnc1RVRkJUU3haUVVGQk8wMUJRMDRzVjBGQlZ5eFpRVUZCTEVOQlFVTTdPMEZCUldJc01FSkJRVkVzVjBGQlZ5eERRVUZETEU5QlFVOHNSVUZCUlN4VlFVRkZMRWxCUVVrc1JVRkJSU3hWUVVGVkxFVkJRVTA3TzBGQlJYQkVMR05CUVZjc1IwRkJTU3hUUVVGVExFZEJRVVVzU1VGQlNTeEhRVUZGTEZWQlFWVXNRVUZCUXl4RFFVRkRPMEZCUXpWRExHTkJRVmNzUjBGQlJ5eEpRVUZKTEVOQlFVVXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJSU3hEUVVGRExFbEJRVWtzUTBGQlF6czdPMEZCUjNaRExGTkJRVTBzUjBGQlJ6dEJRVU5TTEZWQlFVMHNSVUZCU3l4VlFVRlZPMEZCUTNKQ0xGVkJRVTBzUlVGQlN5eEpRVUZKTEVOQlFVTXNUVUZCVFR0QlFVTjBRaXhQUVVGSExFVkJRVXNzVjBGQlZ6dEpRVU51UWl4RFFVRkRPenM3UVVGSFJpeFhRVUZSTEVOQlFVVXNWMEZCVnl4RFFVRkZMRWRCUVVjN1FVRkRla0lzWlVGQlZ5eEZRVUZMTEZOQlFWTTdRVUZEZWtJc1dVRkJVU3hGUVVGTkxGZEJRVmM3UVVGRGVrSXNkVUpCUVcxQ0xFVkJRVWNzYlVKQlFXMUNMRU5CUVVVc1NVRkJTU3hGUVVGRkxGTkJRVk1zUlVGQlJTeFhRVUZYTEVOQlFVVTdRVUZEZWtVc1VVRkJTU3hGUVVGUkxGVkJRVlU3U1VGRGRFSXNRMEZCUXpzN08wRkJSMFlzYlVKQlFXZENMRU5CUVVVc1owSkJRV2RDTEVOQlFVTXNUVUZCVFN4RFFVRkZMRWRCUVVjc1RVRkJUU3hEUVVGRE8wZEJRM0pFTEVOQlFVTXNRMEZCUXpzN1FVRkZTQ3hUUVVGUExFVkJRVVVzWjBKQlFXZENMRVZCUVVjc1owSkJRV2RDTEVWQlFVVXNVVUZCVVN4RlFVRkhMRkZCUVZFc1JVRkJSU3hEUVVGRE8wVkJRM0JGT3pzN096czdPenM3T3p0QlFWZEVMRlZCUVZNc2JVSkJRVzFDTEVOQlFVVXNTVUZCU1N4RlFVRkZMRk5CUVZNc1JVRkJSU3hSUVVGUkxFVkJRM1pFTzBGQlEwTXNUVUZCU1N4clFrRkJhMElzUjBGQlJ5eEZRVUZGTEVOQlFVTTdRVUZETlVJc1RVRkJTU3hKUVVGSkxFTkJRVU1zVjBGQlZ5eEZRVUZIT3p0QlFVTnlRaXh4UWtGQmEwSXNSMEZCUnl4SlFVRkpMRU5CUVVNc1YwRkJWeXhEUVVGRExFZEJRVWNzUTBGQlJTeFZRVUZGTEdkQ1FVRm5RaXhGUVVGTk8wRkJRMnhGTEZkQlFVOHNaMEpCUVdkQ0xFTkJRVU03U1VGRGVFSXNRMEZCUXl4RFFVRkRPMGRCUTBvN1FVRkRSQ3hOUVVGSkxFTkJRVU1zUzBGQlN5eEhRVUZITEhsQ1FVRlJMRWxCUVVrc1EwRkJReXhMUVVGTExFVkJRVVVzUTBGQlJTeFRRVUZUTEVWQlFVVXNVVUZCVVN4RFFVRkZMRU5CUVVVc1EwRkJRenRCUVVNelJDeHZRa0ZCYTBJc1EwRkJReXhQUVVGUExFTkJRVVVzUlVGQlJTeGpRVUZqTEVWQlFVY3NTVUZCU1N4RFFVRkRMR05CUVdNc1JVRkJSU3hMUVVGTExFVkJRVWNzU1VGQlNTeERRVUZETEV0QlFVc3NSVUZCUlN4RFFVRkZMRU5CUVVNN1FVRkRNMFlzVTBGQlR5eHJRa0ZCYTBJc1EwRkJRenRGUVVNeFFqczdPenM3T3pzN1FVRlRSQ3hqUVVGaExFTkJRVU1zVTBGQlV5eEhRVUZITEZWQlFWVXNTVUZCU1N4RlFVTjRRenRCUVVORExFMUJRVWtzUTBGQlF5eEpRVUZKTEVWQlFVVTdRVUZCUlN4VFFVRk5MRWxCUVVrc1MwRkJTeXhEUVVGRExEUkNRVUUwUWl4RFFVRkRMRU5CUVVNc1FVRkJReXhQUVVGUExFdEJRVXNzUTBGQlF6dEhRVUZGT3p0QlFVVXpSU3hOUVVGSkxFMUJRVTBzUjBGQlN5eEZRVUZGTzAxQlEyaENMRkZCUVZFc1IwRkJSeXhGUVVGRk8wMUJRMklzVTBGQlV5eFpRVUZCTzAxQlExUXNTMEZCU3l4WlFVRkJMRU5CUVVNN08wRkJSVkFzTUVKQlFWRXNTVUZCU1N4RlFVRkZMRlZCUVVVc1UwRkJVeXhGUVVGRkxGTkJRVk1zUlVGRGNFTTdRVUZEUXl4WlFVRlRMRWRCUVVjc1pVRkJaU3hEUVVGRE8wRkJRek5DTEZGQlFVa3NSVUZCVFN4SlFVRkpPMEZCUTJRc1lVRkJVeXhGUVVGTExGTkJRVk03UVVGRGRrSXNXVUZCVVN4RlFVRkxMRkZCUVZFN1FVRkRja0lzWVVGQlV5eEZRVUZMTEZOQlFWTXNRMEZCUXl4SlFVRkpPMEZCUXpWQ0xHRkJRVk1zUlVGQlN5eFRRVUZUTzBsQlEzWkNMRU5CUVVNc1EwRkJRenM3UVVGRlNDeFJRVUZMTEVkQlFVYzdRVUZEVUN4UlFVRkpMRVZCUVU4c1UwRkJVenRCUVVOd1FpeFhRVUZQTEVWQlFVMHNVMEZCVXl4RFFVRkRMRTlCUVU4N1FVRkRPVUlzYjBKQlFXZENMRVZCUVVrc1UwRkJVeXhEUVVGRExHZENRVUZuUWp0SlFVTTVReXhEUVVGRE96dEJRVVZHTEZOQlFVMHNRMEZCUlN4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRkxFZEJRVWNzUzBGQlN5eERRVUZETzBkQlEyaERMRU5CUVVNc1EwRkJRenM3UVVGRlNDeFRRVUZQTEVWQlFVVXNVMEZCVXl4RlFVRkhMRTFCUVUwc1JVRkJSU3hUUVVGVExFVkJRVWNzVTBGQlV5eERRVUZETEZGQlFWRXNSVUZCUlN4RFFVRkRPMFZCUXpsRUxFTkJRVU03UTBGRlJpeERRVUZCTEVWQlFVY3NRMEZCUXpzN2NVSkJSVlVzWVVGQllTSXNJbVpwYkdVaU9pSXZWWE5sY25NdmRHRnNkMjl2YkdZdlpHVjJaV3h2Y0dWeUwzZGxZbEp2YjNRdmRISmhibk5wZEdsdmJpMXRZVzVoWjJWeUwzTnlZeTl3WVhKelpYSnpMMlJoZEdGUVlYSnpaWEl1YW5NaUxDSnpiM1Z5WTJWelEyOXVkR1Z1ZENJNld5SnBiWEJ2Y25RZ1ptOXlaV2x1SUdaeWIyMGdKeTR1TDNWMGFXeHpMMlp2Y2tsdUp6dGNibWx0Y0c5eWRDQjFibWx4ZFdVZ1puSnZiU0FuTGk0dmRYUnBiSE12ZFc1cGNYVmxKenRjYmx4dVhHNWpiMjV6ZENCQmNIQkVZWFJoVUdGeWMyVnlJRDBnZTMwN1hHNWNiaWhtZFc1amRHbHZiaWdwWEc1N1hIUmNibHgwTHlvcVhHNWNkQ0FxSUdWNGRISmhZM1FnZEdobElHRmpkSFZoYkNCMGNtRnVjMmwwYVc5dUlHUmhkR0VnWm05eUlIUm9aU0J6ZEdGMFpWeHVYSFFnS2lCQWNHRnlZVzBnSUh0dlltcGxZM1I5SUdOdmJtWnBaMU4wWVhSbElDMGdjM1JoZEdVZ1pHRjBZVnh1WEhRZ0tpQkFjbVYwZFhKdUlIdGhjbkpoZVgwZ2RISmhibk5wZEdsdmJpQmhjbkpoZVNBdElFWlRUVnh1WEhRZ0tpOWNibHgwWm5WdVkzUnBiMjRnWDJWNGRISmhZM1JCWTNScGIyNXpLQ0J2Y0hSeklDbGNibHgwZTF4dVhIUmNkQzh2SUcxaGFXNGdjSEp2Y0dWeWRHbGxjMXh1WEhSY2RHTnZibk4wSUZ4MFpHRjBZU0JjZEZ4MFBTQnZjSFJ6TG1SaGRHRXNYRzVjZEZ4MFhIUmNkR052Ym1acFoxTjBZWFJsSUQwZ2IzQjBjeTV6ZEdGMFpVUmhkR0VzWEc1Y2RGeDBYSFJjZEhOMFlYUmxWbWxsZHlCY2REMGdiM0IwY3k1emRHRjBaVlpwWlhjc1hHNWNkRngwWEhSY2RITjBZWFJsVG1GdFpTQWdYSFE5SUc5d2RITXVjM1JoZEdWT1lXMWxPMXh1WEc1Y2RGeDBMeThnYm1WM0lHUmxabWx1WldRZ2NISnZjR1Z5ZEdsbGMxeHVYSFJjZEd4bGRDQnpkR0YwWlZSeVlXNXphWFJwYjI1eklEMGdXMTBzWEc1Y2RGeDBYSFIyYVdWM1JHRjBZU0JjZEZ4MElEMGdiM0IwY3k1MmFXVjNSR0YwWVN4Y2JseDBYSFJjZEdGd2NFUmhkR0ZXYVdWM0xGeHVYSFJjZEZ4MFlXTjBhVzl1TEZ4dVhIUmNkRngwYzNSaGRHVlFjbVZtYVhnN1hHNWNibHgwWEhSbWIzSmxhVzRvSUdOdmJtWnBaMU4wWVhSbExtRmpkR2x2Ym5Nc0lDZ2djSEp2Y0N3Z1lXTjBhVzl1VG1GdFpTQXBJRDArSUh0Y2JseHVYSFJjZEZ4MGMzUmhkR1ZRY21WbWFYZ2dQU0FvYzNSaGRHVk9ZVzFsS3lBbkxUNG5JQ3RoWTNScGIyNU9ZVzFsS1R0Y2JseDBYSFJjZEdGd2NFUmhkR0ZXYVdWM0lEMGdaR0YwWVZzZ2NISnZjQzUwWVhKblpYUWdYUzUyYVdWM08xeHVYRzVjZEZ4MFhIUXZMeUJTWlhSMWNtNGdZV04wYVc5dUlHUmhkR0VnWm05eUlFWlRUVnh1WEhSY2RGeDBZV04wYVc5dUlEMGdlMXh1WEhSY2RGeDBYSFJoWTNScGIyNGdYSFJjZERvZ1lXTjBhVzl1VG1GdFpTeGNibHgwWEhSY2RGeDBkR0Z5WjJWMElGeDBYSFE2SUhCeWIzQXVkR0Z5WjJWMExGeHVYSFJjZEZ4MFhIUmZhV1FnWEhSY2REb2djM1JoZEdWUWNtVm1hWGhjYmx4MFhIUmNkSDA3WEc1Y2JseDBYSFJjZEM4dklISmxkSFZ5YmlCV2FXVjNSR0YwWVNCbWIzSWdWbWxsZHlCdFlXNWhaMlZ5SUdGdVpDQmhjSEJsYm1RZ1lXeHNJSFpwWlhkelhHNWNkRngwWEhSMmFXVjNSR0YwWVZzZ2MzUmhkR1ZRY21WbWFYZ2dYU0E5SUh0Y2JseDBYSFJjZEZ4MFkzVnljbVZ1ZEZacFpYY2dYSFJjZERvZ2MzUmhkR1ZXYVdWM0xGeHVYSFJjZEZ4MFhIUnVaWGgwVm1sbGR5QmNkRngwWEhRNklHRndjRVJoZEdGV2FXVjNMRnh1WEhSY2RGeDBYSFJzYVc1clpXUldWSEpoYm5OTmIyUjFiR1Z6SURvZ1gyVjRkSEpoWTNSVWNtRnVjMmwwYVc5dWN5Z2djSEp2Y0N3Z2MzUmhkR1ZXYVdWM0xDQmhjSEJFWVhSaFZtbGxkeUFwTEZ4dVhIUmNkRngwWEhSdVlXMWxJQ0JjZEZ4MFhIUmNkRG9nWVdOMGFXOXVUbUZ0WlZ4dVhIUmNkRngwZlR0Y2JseHVYSFJjZEZ4MEx5OGdMeThnWVhOemFXZHVJR1p6YlNCaFkzUnBiMjRnZEc4Z2MzUmhkR1ZjYmx4MFhIUmNkSE4wWVhSbFZISmhibk5wZEdsdmJuTmJJSE4wWVhSbFZISmhibk5wZEdsdmJuTXViR1Z1WjNSb0lGMGdQU0JoWTNScGIyNDdYRzVjZEZ4MGZTazdYRzVjYmx4MFhIUnlaWFIxY200Z2V5QnpkR0YwWlZSeVlXNXphWFJwYjI1eklEb2djM1JoZEdWVWNtRnVjMmwwYVc5dWN5d2dkbWxsZDBSaGRHRWdPaUIyYVdWM1JHRjBZU0I5TzF4dVhIUjlYRzVjYmx4MEx5b3FYRzVjZENBcUlHVjRkSEpoWTNRZ2RISmhibk5wZEdsdmJpQnBibVp2Y20xaGRHbHZibHh1WEhRZ0tpQmhibVFnWlhoMGNtRmpkQ0JrWVhSaElHbG1JSFJ5WVc1emFYUnBiMjRnYVc1bWIzSnRZWFJwYjI0Z2FYTmNibHgwSUNvZ1lXNGdZWEp5WVhrZ2IyWWdkSEpoYm5OcGRHbHZibk5jYmx4MElDb2dRSEJoY21GdElDQjdiMjVpYW1WamRIMGdjSEp2Y0NBZ0lDQWdYRzVjZENBcUlFQndZWEpoYlNBZ2UzTjBjbWx1WjMwZ2MzUmhkR1ZXYVdWM0lDMGdhV1FnYjJZZ2MzUmhkR1VnZG1sbGQxeHVYSFFnS2lCQWNHRnlZVzBnSUh0emRISnBibWQ5SUc1bGVIUldhV1YzSUNBdElHbGtJRzltSUhacFpYY2dkR2hwY3lCMGNtRnVjMmwwYVc5dUlHZHZaWE1nZEc5Y2JseDBJQ29nUUhKbGRIVnliaUI3WVhKeVlYbDlJR0Z5Y21GNUlHOW1JSFJ5WVc1emFYUnBiMjV6SUdadmRDQjBhR2x6SUdGamRHbHZibHh1WEhRZ0tpOWNibHgwWm5WdVkzUnBiMjRnWDJWNGRISmhZM1JVY21GdWMybDBhVzl1Y3lnZ2NISnZjQ3dnYzNSaGRHVldhV1YzTENCdVpYaDBWbWxsZHlBcFhHNWNkSHRjYmx4MFhIUjJZWElnWjNKdmRYQmxaRlJ5WVc1emFYUnBiMjV6SUQwZ1cxMDdYRzVjZEZ4MGFXWW9JSEJ5YjNBdWRISmhibk5wZEdsdmJuTWdLU0I3SUM4dklHbG1JRzF2Y21VZ2RISmhibk5wZEdsdmJuTWdaWGhwYzNRc0lHRmtaQ0IwYUdWdFhHNWNkRngwSUZ4MFozSnZkWEJsWkZSeVlXNXphWFJwYjI1eklEMGdjSEp2Y0M1MGNtRnVjMmwwYVc5dWN5NXRZWEFvSUNnZ2RISmhibk5wZEdsdmJrOWlhbVZqZENBcElEMCtJSHNnWEc1Y2RGeDBJRngwWEhSeVpYUjFjbTRnZEhKaGJuTnBkR2x2Yms5aWFtVmpkRHNnWEc1Y2RGeDBJRngwZlNrN1hHNWNkRngwZlZ4dVhIUmNkSEJ5YjNBdWRtbGxkM01nUFNCMWJtbHhkV1VvSUhCeWIzQXVkbWxsZDNNc0lGc2djM1JoZEdWV2FXVjNMQ0J1WlhoMFZtbGxkeUJkSUNrN1hHNWNkRngwWjNKdmRYQmxaRlJ5WVc1emFYUnBiMjV6TG5WdWMyaHBablFvSUhzZ2RISmhibk5wZEdsdmJsUjVjR1VnT2lCd2NtOXdMblJ5WVc1emFYUnBiMjVVZVhCbExDQjJhV1YzY3lBNklIQnliM0F1ZG1sbGQzTWdmU0FwTzF4dVhIUmNkSEpsZEhWeWJpQm5jbTkxY0dWa1ZISmhibk5wZEdsdmJuTTdYRzVjZEgxY2JseHVYRzVjZEM4cUtseHVYSFFnS2lCRmVIUnlZV04wSUc5dWJIa2dkR2hsSUVaVFRTQmtZWFJoSUdaeWIyMGdkR2hsSUdOdmJtWnBaeUJtYVd4bFhHNWNkQ0FxSUdOeVpXRjBaU0J6ZEdGMFpYTmNibHgwSUNvZ1FIQmhjbUZ0SUNCN2IySnFaV04wZlNCa1lYUmhJRnh1WEhRZ0tpQkFjbVYwZFhKdUlIdHZZbXBsWTNSOUlHWnpiU0JtYjNKdFlYUjBaV1FnWTI5dVptbG5YRzVjZENBcUwxeHVYSFJCY0hCRVlYUmhVR0Z5YzJWeUxuQmhjbk5sUkdGMFlTQTlJR1oxYm1OMGFXOXVLQ0JrWVhSaElDbGNibHgwZTF4dVhIUmNkR2xtS0NBaFpHRjBZU0FwZXlCMGFISnZkeUJ1WlhjZ1JYSnliM0lvSnlwRVlYUmhJRTlpYW1WamRDQnBjeUIxYm1SbFptbHVaV1FoSnlrN0lISmxkSFZ5YmlCbVlXeHpaVHNnZlZ4dVhHNWNkRngwYkdWMElHTnZibVpwWnlCY2RGeDBQU0JiWFN4Y2JseDBYSFJjZEhacFpYZEVZWFJoWEhROUlIdDlMRnh1WEhSY2RGeDBaWGgwY21GamRHVmtMRnh1WEhSY2RGeDBjM1JoZEdVN1hHNWNibHgwWEhSbWIzSmxhVzRvSUdSaGRHRXNJQ2dnYzNSaGRHVkVZWFJoTENCemRHRjBaVTVoYldVZ0tTQTlQbHh1WEhSY2RIdGNibHgwWEhSY2RHVjRkSEpoWTNSbFpDQTlJRjlsZUhSeVlXTjBRV04wYVc5dWN5aDdYRzVjZEZ4MFhIUmNkR1JoZEdFZ1hIUmNkRngwT2lCa1lYUmhMQ0JjYmx4MFhIUmNkRngwYzNSaGRHVkVZWFJoSUZ4MFhIUTZJSE4wWVhSbFJHRjBZU3dnWEc1Y2RGeDBYSFJjZEhacFpYZEVZWFJoSUZ4MFhIUTZJSFpwWlhkRVlYUmhMQ0JjYmx4MFhIUmNkRngwYzNSaGRHVldhV1YzSUZ4MFhIUTZJSE4wWVhSbFJHRjBZUzUyYVdWM0xGeHVYSFJjZEZ4MFhIUnpkR0YwWlU1aGJXVWdYSFJjZERvZ2MzUmhkR1ZPWVcxbFhHNWNkRngwWEhSOUtUdGNibHh1WEhSY2RGeDBjM1JoZEdVZ1BTQjdYRzVjZEZ4MFhIUmNkRzVoYldVZ1hIUmNkRngwWEhRNklITjBZWFJsVG1GdFpTeGNibHgwWEhSY2RGeDBhVzVwZEdsaGJDQmNkRngwWEhRNklITjBZWFJsUkdGMFlTNXBibWwwYVdGc0xGeHVYSFJjZEZ4MFhIUnpkR0YwWlZSeVlXNXphWFJwYjI1eklGeDBPaUJsZUhSeVlXTjBaV1F1YzNSaGRHVlVjbUZ1YzJsMGFXOXVjMXh1WEhSY2RGeDBmVHRjYmx4dVhIUmNkRngwWTI5dVptbG5XeUJqYjI1bWFXY3ViR1Z1WjNSb0lGMGdQU0J6ZEdGMFpUdGNibHgwWEhSOUtUdGNibHh1WEhSY2RISmxkSFZ5YmlCN0lHWnpiVU52Ym1acFp5QTZJR052Ym1acFp5d2dWRlpOUTI5dVptbG5JRG9nWlhoMGNtRmpkR1ZrTG5acFpYZEVZWFJoSUgwN1hHNWNkSDA3WEc1Y2JuMHBLQ2s3WEc1Y2JtVjRjRzl5ZENCa1pXWmhkV3gwSUVGd2NFUmhkR0ZRWVhKelpYSTdYRzVjYmlKZGZRPT0iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIHJlcGxhY2UgdGFyZ2V0IG9iamVjdCBwcm9wZXJ0aWVzIHdpdGggdGhlIG92ZXJ3cml0ZVxuICogb2JqZWN0IHByb3BlcnRpZXMgaWYgdGhleSBoYXZlIGJlZW4gc2V0XG4gKiBAcGFyYW0gIHtvYmplY3R9IHRhcmdldCAgICAtIG9iamVjdCB0byBvdmVyd3JpdGVcbiAqIEBwYXJhbSAge29iamVjdH0gb3ZlcndyaXRlIC0gb2JqZWN0IHdpdGggbmV3IHByb3BlcmllcyBhbmQgdmFsdWVzXG4gKiBAcmV0dXJuIHtvYmplY3R9IFxuICovXG5mdW5jdGlvbiBkZWZhdWx0UHJvcHModGFyZ2V0LCBvdmVyd3JpdGUpIHtcbiAgb3ZlcndyaXRlID0gb3ZlcndyaXRlIHx8IHt9O1xuICBmb3IgKHZhciBwcm9wIGluIG92ZXJ3cml0ZSkge1xuICAgIGlmICh0YXJnZXQuaGFzT3duUHJvcGVydHkocHJvcCkgJiYgX2lzVmFsaWQob3ZlcndyaXRlW3Byb3BdKSkge1xuICAgICAgdGFyZ2V0W3Byb3BdID0gb3ZlcndyaXRlW3Byb3BdO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdGFyZ2V0O1xufVxuXG4vKipcbiAqIGNoZWNrIHRvIHNlZSBpZiBhIHByb3BlcnR5IGlzIHZhbGlkXG4gKiBub3QgbnVsbCBvciB1bmRlZmluZWRcbiAqIEBwYXJhbSAge29iamVjdH0gIHByb3AgXG4gKiBAcmV0dXJuIHtCb29sZWFufSBcbiAqL1xuZnVuY3Rpb24gX2lzVmFsaWQocHJvcCkge1xuICByZXR1cm4gcHJvcCAhPT0gdW5kZWZpbmVkICYmIHByb3AgIT09IG51bGw7XG59XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IGRlZmF1bHRQcm9wcztcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYklpOVZjMlZ5Y3k5MFlXeDNiMjlzWmk5a1pYWmxiRzl3WlhJdmQyVmlVbTl2ZEM5MGNtRnVjMmwwYVc5dUxXMWhibUZuWlhJdmMzSmpMM1YwYVd4ekwyUmxabUYxYkhRdWFuTWlYU3dpYm1GdFpYTWlPbHRkTENKdFlYQndhVzVuY3lJNklqczdPenM3UVVGQlFTeFpRVUZaTEVOQlFVTTdPenM3T3pzN096dEJRVlZpTEZOQlFWTXNXVUZCV1N4RFFVRkZMRTFCUVUwc1JVRkJSU3hUUVVGVExFVkJRM2hETzBGQlEwTXNWMEZCVXl4SFFVRkhMRk5CUVZNc1NVRkJTU3hGUVVGRkxFTkJRVU03UVVGRE5VSXNUMEZCU3l4SlFVRkpMRWxCUVVrc1NVRkJTU3hUUVVGVExFVkJRVWM3UVVGRE5VSXNVVUZCU1N4TlFVRk5MRU5CUVVNc1kwRkJZeXhEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEZGQlFWRXNRMEZCUlN4VFFVRlRMRU5CUVVVc1NVRkJTU3hEUVVGRkxFTkJRVVVzUlVGQlJ6dEJRVU5zUlN4WlFVRk5MRU5CUVVVc1NVRkJTU3hEUVVGRkxFZEJRVWNzVTBGQlV5eERRVUZGTEVsQlFVa3NRMEZCUlN4RFFVRkRPMHRCUTI1RE8wZEJRMFE3UVVGRFJDeFRRVUZQTEUxQlFVMHNRMEZCUXp0RFFVTmtPenM3T3pzN096dEJRVkZFTEZOQlFWTXNVVUZCVVN4RFFVRkZMRWxCUVVrc1JVRkJSenRCUVVONlFpeFRRVUZUTEVsQlFVa3NTMEZCU3l4VFFVRlRMRWxCUVVrc1NVRkJTU3hMUVVGTExFbEJRVWtzUTBGQlJ6dERRVU12UXpzN2NVSkJTV01zV1VGQldTSXNJbVpwYkdVaU9pSXZWWE5sY25NdmRHRnNkMjl2YkdZdlpHVjJaV3h2Y0dWeUwzZGxZbEp2YjNRdmRISmhibk5wZEdsdmJpMXRZVzVoWjJWeUwzTnlZeTkxZEdsc2N5OWtaV1poZFd4MExtcHpJaXdpYzI5MWNtTmxjME52Ym5SbGJuUWlPbHNpSjNWelpTQnpkSEpwWTNRbk8xeHVYRzVjYmk4cUtseHVJQ29nY21Wd2JHRmpaU0IwWVhKblpYUWdiMkpxWldOMElIQnliM0JsY25ScFpYTWdkMmwwYUNCMGFHVWdiM1psY25keWFYUmxYRzRnS2lCdlltcGxZM1FnY0hKdmNHVnlkR2xsY3lCcFppQjBhR1Y1SUdoaGRtVWdZbVZsYmlCelpYUmNiaUFxSUVCd1lYSmhiU0FnZTI5aWFtVmpkSDBnZEdGeVoyVjBJQ0FnSUMwZ2IySnFaV04wSUhSdklHOTJaWEozY21sMFpWeHVJQ29nUUhCaGNtRnRJQ0I3YjJKcVpXTjBmU0J2ZG1WeWQzSnBkR1VnTFNCdlltcGxZM1FnZDJsMGFDQnVaWGNnY0hKdmNHVnlhV1Z6SUdGdVpDQjJZV3gxWlhOY2JpQXFJRUJ5WlhSMWNtNGdlMjlpYW1WamRIMGdYRzRnS2k5Y2JtWjFibU4wYVc5dUlHUmxabUYxYkhSUWNtOXdjeWdnZEdGeVoyVjBMQ0J2ZG1WeWQzSnBkR1VnS1NCY2JudGNibHgwYjNabGNuZHlhWFJsSUQwZ2IzWmxjbmR5YVhSbElIeDhJSHQ5TzF4dVhIUm1iM0lvSUhaaGNpQndjbTl3SUdsdUlHOTJaWEozY21sMFpTQXBJSHRjYmx4MFhIUnBaaWdnZEdGeVoyVjBMbWhoYzA5M2JsQnliM0JsY25SNUtIQnliM0FwSUNZbUlGOXBjMVpoYkdsa0tDQnZkbVZ5ZDNKcGRHVmJJSEJ5YjNBZ1hTQXBJQ2tnZTF4dVhIUmNkRngwZEdGeVoyVjBXeUJ3Y205d0lGMGdQU0J2ZG1WeWQzSnBkR1ZiSUhCeWIzQWdYVHRjYmx4MFhIUjlYRzVjZEgxY2JseDBjbVYwZFhKdUlIUmhjbWRsZER0Y2JuMWNibHh1THlvcVhHNGdLaUJqYUdWamF5QjBieUJ6WldVZ2FXWWdZU0J3Y205d1pYSjBlU0JwY3lCMllXeHBaRnh1SUNvZ2JtOTBJRzUxYkd3Z2IzSWdkVzVrWldacGJtVmtYRzRnS2lCQWNHRnlZVzBnSUh0dlltcGxZM1I5SUNCd2NtOXdJRnh1SUNvZ1FISmxkSFZ5YmlCN1FtOXZiR1ZoYm4wZ1hHNGdLaTljYm1aMWJtTjBhVzl1SUY5cGMxWmhiR2xrS0NCd2NtOXdJQ2tnZTF4dVhIUnlaWFIxY200Z0tDQndjbTl3SUNFOVBTQjFibVJsWm1sdVpXUWdKaVlnY0hKdmNDQWhQVDBnYm5Wc2JDQXBPMXh1ZlZ4dVhHNWNibHh1Wlhod2IzSjBJR1JsWm1GMWJIUWdaR1ZtWVhWc2RGQnliM0J6T3lKZGZRPT0iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHtcbiAgICB2YWx1ZTogdHJ1ZVxufSk7XG52YXIgX2hhc0RvbnRFbnVtQnVnLCBfZG9udEVudW1zO1xuXG5mdW5jdGlvbiBjaGVja0RvbnRFbnVtKCkge1xuICAgIF9kb250RW51bXMgPSBbJ3RvU3RyaW5nJywgJ3RvTG9jYWxlU3RyaW5nJywgJ3ZhbHVlT2YnLCAnaGFzT3duUHJvcGVydHknLCAnaXNQcm90b3R5cGVPZicsICdwcm9wZXJ0eUlzRW51bWVyYWJsZScsICdjb25zdHJ1Y3RvciddO1xuXG4gICAgX2hhc0RvbnRFbnVtQnVnID0gdHJ1ZTtcblxuICAgIGZvciAodmFyIGtleSBpbiB7ICd0b1N0cmluZyc6IG51bGwgfSkge1xuICAgICAgICBfaGFzRG9udEVudW1CdWcgPSBmYWxzZTtcbiAgICB9XG59O1xuXG4vKipcbiAqIFNpbWlsYXIgdG8gQXJyYXkvZm9yRWFjaCBidXQgd29ya3Mgb3ZlciBvYmplY3QgcHJvcGVydGllcyBhbmQgZml4ZXMgRG9uJ3RcbiAqIEVudW0gYnVnIG9uIElFLlxuICogYmFzZWQgb246IGh0dHA6Ly93aGF0dGhlaGVhZHNhaWQuY29tLzIwMTAvMTAvYS1zYWZlci1vYmplY3Qta2V5cy1jb21wYXRpYmlsaXR5LWltcGxlbWVudGF0aW9uXG4gKi9cbmZ1bmN0aW9uIGZvckluKG9iaiwgZm4sIHRoaXNPYmopIHtcbiAgICB2YXIga2V5LFxuICAgICAgICBpID0gMDtcbiAgICAvLyBubyBuZWVkIHRvIGNoZWNrIGlmIGFyZ3VtZW50IGlzIGEgcmVhbCBvYmplY3QgdGhhdCB3YXkgd2UgY2FuIHVzZVxuICAgIC8vIGl0IGZvciBhcnJheXMsIGZ1bmN0aW9ucywgZGF0ZSwgZXRjLlxuXG4gICAgLy9wb3N0LXBvbmUgY2hlY2sgdGlsbCBuZWVkZWRcbiAgICBpZiAoX2hhc0RvbnRFbnVtQnVnID09IG51bGwpIHtcbiAgICAgICAgY2hlY2tEb250RW51bSgpO1xuICAgIH1cblxuICAgIGZvciAoa2V5IGluIG9iaikge1xuICAgICAgICBpZiAoZXhlYyhmbiwgb2JqLCBrZXksIHRoaXNPYmopID09PSBmYWxzZSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoX2hhc0RvbnRFbnVtQnVnKSB7XG4gICAgICAgIHdoaWxlIChrZXkgPSBfZG9udEVudW1zW2krK10pIHtcbiAgICAgICAgICAgIC8vIHNpbmNlIHdlIGFyZW4ndCB1c2luZyBoYXNPd24gY2hlY2sgd2UgbmVlZCB0byBtYWtlIHN1cmUgdGhlXG4gICAgICAgICAgICAvLyBwcm9wZXJ0eSB3YXMgb3ZlcndyaXR0ZW5cbiAgICAgICAgICAgIGlmIChvYmpba2V5XSAhPT0gT2JqZWN0LnByb3RvdHlwZVtrZXldKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV4ZWMoZm4sIG9iaiwga2V5LCB0aGlzT2JqKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZXhlYyhmbiwgb2JqLCBrZXksIHRoaXNPYmopIHtcbiAgICByZXR1cm4gZm4uY2FsbCh0aGlzT2JqLCBvYmpba2V5XSwga2V5LCBvYmopO1xufVxuXG5leHBvcnRzWydkZWZhdWx0J10gPSBmb3JJbjtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYklpOVZjMlZ5Y3k5MFlXeDNiMjlzWmk5a1pYWmxiRzl3WlhJdmQyVmlVbTl2ZEM5MGNtRnVjMmwwYVc5dUxXMWhibUZuWlhJdmMzSmpMM1YwYVd4ekwyWnZja2x1TG1weklsMHNJbTVoYldWeklqcGJYU3dpYldGd2NHbHVaM01pT2lJN096czdPMEZCUVVNc1NVRkJTU3hsUVVGbExFVkJRMW9zVlVGQlZTeERRVUZET3p0QlFVVm1MRk5CUVZNc1lVRkJZU3hIUVVGSE8wRkJRM0pDTEdOQlFWVXNSMEZCUnl4RFFVTk1MRlZCUVZVc1JVRkRWaXhuUWtGQlowSXNSVUZEYUVJc1UwRkJVeXhGUVVOVUxHZENRVUZuUWl4RlFVTm9RaXhsUVVGbExFVkJRMllzYzBKQlFYTkNMRVZCUTNSQ0xHRkJRV0VzUTBGRGFFSXNRMEZCUXpzN1FVRkZUaXh0UWtGQlpTeEhRVUZITEVsQlFVa3NRMEZCUXpzN1FVRkZka0lzVTBGQlN5eEpRVUZKTEVkQlFVY3NTVUZCU1N4RlFVRkRMRlZCUVZVc1JVRkJSU3hKUVVGSkxFVkJRVU1zUlVGQlJUdEJRVU5vUXl4MVFrRkJaU3hIUVVGSExFdEJRVXNzUTBGQlF6dExRVU16UWp0RFFVTktMRU5CUVVNN096czdPenM3UVVGUFJpeFRRVUZUTEV0QlFVc3NRMEZCUXl4SFFVRkhMRVZCUVVVc1JVRkJSU3hGUVVGRkxFOUJRVThzUlVGQlF6dEJRVU0xUWl4UlFVRkpMRWRCUVVjN1VVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZET3pzN096dEJRVXRtTEZGQlFVa3NaVUZCWlN4SlFVRkpMRWxCUVVrc1JVRkJSVHRCUVVGRkxIRkNRVUZoTEVWQlFVVXNRMEZCUXp0TFFVRkZPenRCUVVWcVJDeFRRVUZMTEVkQlFVY3NTVUZCU1N4SFFVRkhMRVZCUVVVN1FVRkRZaXhaUVVGSkxFbEJRVWtzUTBGQlF5eEZRVUZGTEVWQlFVVXNSMEZCUnl4RlFVRkZMRWRCUVVjc1JVRkJSU3hQUVVGUExFTkJRVU1zUzBGQlN5eExRVUZMTEVWQlFVVTdRVUZEZGtNc2EwSkJRVTA3VTBGRFZEdExRVU5LT3p0QlFVVkVMRkZCUVVrc1pVRkJaU3hGUVVGRk8wRkJRMnBDTEdWQlFVOHNSMEZCUnl4SFFVRkhMRlZCUVZVc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGT3pzN1FVRkhNVUlzWjBKQlFVa3NSMEZCUnl4RFFVRkRMRWRCUVVjc1EwRkJReXhMUVVGTExFMUJRVTBzUTBGQlF5eFRRVUZUTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVN1FVRkRjRU1zYjBKQlFVa3NTVUZCU1N4RFFVRkRMRVZCUVVVc1JVRkJSU3hIUVVGSExFVkJRVVVzUjBGQlJ5eEZRVUZGTEU5QlFVOHNRMEZCUXl4TFFVRkxMRXRCUVVzc1JVRkJSVHRCUVVOMlF5d3dRa0ZCVFR0cFFrRkRWRHRoUVVOS08xTkJRMG9zUTBGQlF6dExRVU5NTzBOQlEwbzdPMEZCUlVRc1UwRkJVeXhKUVVGSkxFTkJRVU1zUlVGQlJTeEZRVUZGTEVkQlFVY3NSVUZCUlN4SFFVRkhMRVZCUVVVc1QwRkJUeXhGUVVGRE8wRkJRMmhETEZkQlFVOHNSVUZCUlN4RFFVRkRMRWxCUVVrc1EwRkJReXhQUVVGUExFVkJRVVVzUjBGQlJ5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRWRCUVVjc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF6dERRVU12UXpzN2NVSkJSVlVzUzBGQlN5SXNJbVpwYkdVaU9pSXZWWE5sY25NdmRHRnNkMjl2YkdZdlpHVjJaV3h2Y0dWeUwzZGxZbEp2YjNRdmRISmhibk5wZEdsdmJpMXRZVzVoWjJWeUwzTnlZeTkxZEdsc2N5OW1iM0pKYmk1cWN5SXNJbk52ZFhKalpYTkRiMjUwWlc1MElqcGJJaUIyWVhJZ1gyaGhjMFJ2Ym5SRmJuVnRRblZuTEZ4dUlDQWdJQ0FnSUNCZlpHOXVkRVZ1ZFcxek8xeHVYRzRnSUNBZ1puVnVZM1JwYjI0Z1kyaGxZMnRFYjI1MFJXNTFiU2dwSUh0Y2JpQWdJQ0FnSUNBZ1gyUnZiblJGYm5WdGN5QTlJRnRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FuZEc5VGRISnBibWNuTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNkMGIweHZZMkZzWlZOMGNtbHVaeWNzWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSjNaaGJIVmxUMlluTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNkb1lYTlBkMjVRY205d1pYSjBlU2NzWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSjJselVISnZkRzkwZVhCbFQyWW5MRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ2R3Y205d1pYSjBlVWx6Ulc1MWJXVnlZV0pzWlNjc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0oyTnZibk4wY25WamRHOXlKMXh1SUNBZ0lDQWdJQ0FnSUNBZ1hUdGNibHh1SUNBZ0lDQWdJQ0JmYUdGelJHOXVkRVZ1ZFcxQ2RXY2dQU0IwY25WbE8xeHVYRzRnSUNBZ0lDQWdJR1p2Y2lBb2RtRnlJR3RsZVNCcGJpQjdKM1J2VTNSeWFXNW5Kem9nYm5Wc2JIMHBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lGOW9ZWE5FYjI1MFJXNTFiVUoxWnlBOUlHWmhiSE5sTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnZlR0Y2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGTnBiV2xzWVhJZ2RHOGdRWEp5WVhrdlptOXlSV0ZqYUNCaWRYUWdkMjl5YTNNZ2IzWmxjaUJ2WW1wbFkzUWdjSEp2Y0dWeWRHbGxjeUJoYm1RZ1ptbDRaWE1nUkc5dUozUmNiaUFnSUNBZ0tpQkZiblZ0SUdKMVp5QnZiaUJKUlM1Y2JpQWdJQ0FnS2lCaVlYTmxaQ0J2YmpvZ2FIUjBjRG92TDNkb1lYUjBhR1ZvWldGa2MyRnBaQzVqYjIwdk1qQXhNQzh4TUM5aExYTmhabVZ5TFc5aWFtVmpkQzFyWlhsekxXTnZiWEJoZEdsaWFXeHBkSGt0YVcxd2JHVnRaVzUwWVhScGIyNWNiaUFnSUNBZ0tpOWNiaUFnSUNCbWRXNWpkR2x2YmlCbWIzSkpiaWh2WW1vc0lHWnVMQ0IwYUdselQySnFLWHRjYmlBZ0lDQWdJQ0FnZG1GeUlHdGxlU3dnYVNBOUlEQTdYRzRnSUNBZ0lDQWdJQzh2SUc1dklHNWxaV1FnZEc4Z1kyaGxZMnNnYVdZZ1lYSm5kVzFsYm5RZ2FYTWdZU0J5WldGc0lHOWlhbVZqZENCMGFHRjBJSGRoZVNCM1pTQmpZVzRnZFhObFhHNGdJQ0FnSUNBZ0lDOHZJR2wwSUdadmNpQmhjbkpoZVhNc0lHWjFibU4wYVc5dWN5d2daR0YwWlN3Z1pYUmpMbHh1WEc0Z0lDQWdJQ0FnSUM4dmNHOXpkQzF3YjI1bElHTm9aV05ySUhScGJHd2dibVZsWkdWa1hHNGdJQ0FnSUNBZ0lHbG1JQ2hmYUdGelJHOXVkRVZ1ZFcxQ2RXY2dQVDBnYm5Wc2JDa2dleUJqYUdWamEwUnZiblJGYm5WdEtDazdJSDFjYmx4dUlDQWdJQ0FnSUNCbWIzSWdLR3RsZVNCcGJpQnZZbW9wSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNobGVHVmpLR1p1TENCdlltb3NJR3RsZVN3Z2RHaHBjMDlpYWlrZ1BUMDlJR1poYkhObEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZbkpsWVdzN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQnBaaUFvWDJoaGMwUnZiblJGYm5WdFFuVm5LU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjNhR2xzWlNBb2EyVjVJRDBnWDJSdmJuUkZiblZ0YzF0cEt5dGRLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z2MybHVZMlVnZDJVZ1lYSmxiaWQwSUhWemFXNW5JR2hoYzA5M2JpQmphR1ZqYXlCM1pTQnVaV1ZrSUhSdklHMWhhMlVnYzNWeVpTQjBhR1ZjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0F2THlCd2NtOXdaWEowZVNCM1lYTWdiM1psY25keWFYUjBaVzVjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2IySnFXMnRsZVYwZ0lUMDlJRTlpYW1WamRDNXdjbTkwYjNSNWNHVmJhMlY1WFNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb1pYaGxZeWhtYml3Z2IySnFMQ0JyWlhrc0lIUm9hWE5QWW1vcElEMDlQU0JtWVd4elpTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZbkpsWVdzN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdmVnh1WEc0Z0lDQWdablZ1WTNScGIyNGdaWGhsWXlobWJpd2diMkpxTENCclpYa3NJSFJvYVhOUFltb3BlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdabTR1WTJGc2JDaDBhR2x6VDJKcUxDQnZZbXBiYTJWNVhTd2dhMlY1TENCdlltb3BPMXh1SUNBZ0lIMWNibHh1Wlhod2IzSjBJR1JsWm1GMWJIUWdabTl5U1c0N1hHNWNibHh1SWwxOSIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX2hhc093biA9IHJlcXVpcmUoJy4vaGFzT3duJyk7XG5cbnZhciBfaGFzT3duMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2hhc093bik7XG5cbnZhciBfZm9ySW4gPSByZXF1aXJlKCcuL2ZvckluJyk7XG5cbnZhciBfZm9ySW4yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZm9ySW4pO1xuXG4vKipcbiAqIFNpbWlsYXIgdG8gQXJyYXkvZm9yRWFjaCBidXQgd29ya3Mgb3ZlciBvYmplY3QgcHJvcGVydGllcyBhbmQgZml4ZXMgRG9uJ3RcbiAqIEVudW0gYnVnIG9uIElFLlxuICogYmFzZWQgb246IGh0dHA6Ly93aGF0dGhlaGVhZHNhaWQuY29tLzIwMTAvMTAvYS1zYWZlci1vYmplY3Qta2V5cy1jb21wYXRpYmlsaXR5LWltcGxlbWVudGF0aW9uXG4gKi9cbmZ1bmN0aW9uIGZvck93bihvYmosIGZuLCB0aGlzT2JqKSB7XG4gICAgX2ZvckluMlsnZGVmYXVsdCddKG9iaiwgZnVuY3Rpb24gKHZhbCwga2V5KSB7XG4gICAgICAgIGlmIChfaGFzT3duMlsnZGVmYXVsdCddKG9iaiwga2V5KSkge1xuICAgICAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpc09iaiwgb2JqW2tleV0sIGtleSwgb2JqKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5leHBvcnRzWydkZWZhdWx0J10gPSBmb3JPd247XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJaTlWYzJWeWN5OTBZV3gzYjI5c1ppOWtaWFpsYkc5d1pYSXZkMlZpVW05dmRDOTBjbUZ1YzJsMGFXOXVMVzFoYm1GblpYSXZjM0pqTDNWMGFXeHpMMlp2Y2s5M2JpNXFjeUpkTENKdVlXMWxjeUk2VzEwc0ltMWhjSEJwYm1keklqb2lPenM3T3pzN096dHpRa0ZCYlVJc1ZVRkJWVHM3T3p0eFFrRkRXQ3hUUVVGVE96czdPenM3T3pzN1FVRlBka0lzVTBGQlV5eE5RVUZOTEVOQlFVTXNSMEZCUnl4RlFVRkZMRVZCUVVVc1JVRkJSU3hQUVVGUExFVkJRVU03UVVGRE4wSXNkVUpCUVUwc1IwRkJSeXhGUVVGRkxGVkJRVk1zUjBGQlJ5eEZRVUZGTEVkQlFVY3NSVUZCUXp0QlFVTjZRaXhaUVVGSkxHOUNRVUZQTEVkQlFVY3NSVUZCUlN4SFFVRkhMRU5CUVVNc1JVRkJSVHRCUVVOc1FpeHRRa0ZCVHl4RlFVRkZMRU5CUVVNc1NVRkJTU3hEUVVGRExFOUJRVThzUlVGQlJTeEhRVUZITEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1IwRkJSeXhGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETzFOQlF5OURPMHRCUTBvc1EwRkJReXhEUVVGRE8wTkJRMDQ3TzNGQ1FVVlZMRTFCUVUwaUxDSm1hV3hsSWpvaUwxVnpaWEp6TDNSaGJIZHZiMnhtTDJSbGRtVnNiM0JsY2k5M1pXSlNiMjkwTDNSeVlXNXphWFJwYjI0dGJXRnVZV2RsY2k5emNtTXZkWFJwYkhNdlptOXlUM2R1TG1weklpd2ljMjkxY21ObGMwTnZiblJsYm5RaU9sc2lhVzF3YjNKMElHaGhjMDkzYmlCbWNtOXRJQ2N1TDJoaGMwOTNiaWM3WEc1cGJYQnZjblFnWm05eVNXNGdabkp2YlNBbkxpOW1iM0pKYmljN1hHNWNiaUFnSUNBdktpcGNiaUFnSUNBZ0tpQlRhVzFwYkdGeUlIUnZJRUZ5Y21GNUwyWnZja1ZoWTJnZ1luVjBJSGR2Y210eklHOTJaWElnYjJKcVpXTjBJSEJ5YjNCbGNuUnBaWE1nWVc1a0lHWnBlR1Z6SUVSdmJpZDBYRzRnSUNBZ0lDb2dSVzUxYlNCaWRXY2diMjRnU1VVdVhHNGdJQ0FnSUNvZ1ltRnpaV1FnYjI0NklHaDBkSEE2THk5M2FHRjBkR2hsYUdWaFpITmhhV1F1WTI5dEx6SXdNVEF2TVRBdllTMXpZV1psY2kxdlltcGxZM1F0YTJWNWN5MWpiMjF3WVhScFltbHNhWFI1TFdsdGNHeGxiV1Z1ZEdGMGFXOXVYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1puVnVZM1JwYjI0Z1ptOXlUM2R1S0c5aWFpd2dabTRzSUhSb2FYTlBZbW9wZTF4dUlDQWdJQ0FnSUNCbWIzSkpiaWh2WW1vc0lHWjFibU4wYVc5dUtIWmhiQ3dnYTJWNUtYdGNiaUFnSUNBZ0lDQWdJQ0FnSUdsbUlDaG9ZWE5QZDI0b2IySnFMQ0JyWlhrcEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjbVYwZFhKdUlHWnVMbU5oYkd3b2RHaHBjMDlpYWl3Z2IySnFXMnRsZVYwc0lHdGxlU3dnYjJKcUtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ2ZTazdYRzRnSUNBZ2ZWeHVYRzVsZUhCdmNuUWdaR1ZtWVhWc2RDQm1iM0pQZDI0N1hHNGlYWDA9IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcblxuLyoqXG4gKiBTYWZlciBPYmplY3QuaGFzT3duUHJvcGVydHlcbiAqL1xuZnVuY3Rpb24gaGFzT3duKG9iaiwgcHJvcCkge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBoYXNPd247XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbXCJkZWZhdWx0XCJdO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYklpOVZjMlZ5Y3k5MFlXeDNiMjlzWmk5a1pYWmxiRzl3WlhJdmQyVmlVbTl2ZEM5MGNtRnVjMmwwYVc5dUxXMWhibUZuWlhJdmMzSmpMM1YwYVd4ekwyaGhjMDkzYmk1cWN5SmRMQ0p1WVcxbGN5STZXMTBzSW0xaGNIQnBibWR6SWpvaU96czdPenM3T3pzN1FVRkxTeXhUUVVGVExFMUJRVTBzUTBGQlF5eEhRVUZITEVWQlFVVXNTVUZCU1N4RlFVRkRPMEZCUTNSQ0xGZEJRVThzVFVGQlRTeERRVUZETEZOQlFWTXNRMEZCUXl4alFVRmpMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0RFFVTXhSRHM3Y1VKQlJXRXNUVUZCVFNJc0ltWnBiR1VpT2lJdlZYTmxjbk12ZEdGc2QyOXZiR1l2WkdWMlpXeHZjR1Z5TDNkbFlsSnZiM1F2ZEhKaGJuTnBkR2x2YmkxdFlXNWhaMlZ5TDNOeVl5OTFkR2xzY3k5b1lYTlBkMjR1YW5NaUxDSnpiM1Z5WTJWelEyOXVkR1Z1ZENJNld5SmNibHh1SUNBZ0lDOHFLbHh1SUNBZ0lDQXFJRk5oWm1WeUlFOWlhbVZqZEM1b1lYTlBkMjVRY205d1pYSjBlVnh1SUNBZ0lDQXFMMXh1SUNBZ0lDQm1kVzVqZEdsdmJpQm9ZWE5QZDI0b2IySnFMQ0J3Y205d0tYdGNiaUFnSUNBZ0lDQWdJSEpsZEhWeWJpQlBZbXBsWTNRdWNISnZkRzkwZVhCbExtaGhjMDkzYmxCeWIzQmxjblI1TG1OaGJHd29iMkpxTENCd2NtOXdLVHRjYmlBZ0lDQWdmVnh1WEc0Z0lDQWdaWGh3YjNKMElHUmxabUYxYkhRZ2FHRnpUM2R1TzF4dVhHNWNiaUpkZlE9PSIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX2Zvck93biA9IHJlcXVpcmUoJy4vZm9yT3duJyk7XG5cbnZhciBfZm9yT3duMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2Zvck93bik7XG5cbmZ1bmN0aW9uIG1peGluKHRhcmdldCwgb2JqZWN0cykge1xuICAgIHZhciBpID0gMCxcbiAgICAgICAgbiA9IGFyZ3VtZW50cy5sZW5ndGgsXG4gICAgICAgIG9iajtcbiAgICB3aGlsZSAoKytpIDwgbikge1xuICAgICAgICBvYmogPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGlmIChvYmogIT0gbnVsbCkge1xuICAgICAgICAgICAgX2Zvck93bjJbJ2RlZmF1bHQnXShvYmosIGNvcHlQcm9wLCB0YXJnZXQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0YXJnZXQ7XG59XG5cbmZ1bmN0aW9uIGNvcHlQcm9wKHZhbCwga2V5KSB7XG4gICAgdGhpc1trZXldID0gdmFsO1xufVxuXG5leHBvcnRzWydkZWZhdWx0J10gPSBtaXhpbjtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYklpOVZjMlZ5Y3k5MFlXeDNiMjlzWmk5a1pYWmxiRzl3WlhJdmQyVmlVbTl2ZEM5MGNtRnVjMmwwYVc5dUxXMWhibUZuWlhJdmMzSmpMM1YwYVd4ekwyMXBlR2x1TG1weklsMHNJbTVoYldWeklqcGJYU3dpYldGd2NHbHVaM01pT2lJN096czdPenM3TzNOQ1FVTnRRaXhWUVVGVk96czdPMEZCUlRkQ0xGTkJRVk1zUzBGQlN5eERRVUZGTEUxQlFVMHNSVUZCUlN4UFFVRlBMRVZCUVVjN1FVRkRha01zVVVGQlNTeERRVUZETEVkQlFVY3NRMEZCUXp0UlFVTk9MRU5CUVVNc1IwRkJSeXhUUVVGVExFTkJRVU1zVFVGQlRUdFJRVU53UWl4SFFVRkhMRU5CUVVNN1FVRkRTaXhYUVVGTkxFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUXp0QlFVTldMRmRCUVVjc1IwRkJSeXhUUVVGVExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdRVUZEYmtJc1dVRkJTU3hIUVVGSExFbEJRVWtzU1VGQlNTeEZRVUZGTzBGQlEySXNaME5CUVU4c1IwRkJSeXhGUVVGRkxGRkJRVkVzUlVGQlJTeE5RVUZOTEVOQlFVTXNRMEZCUXp0VFFVTnFRenRMUVVOS08wRkJRMFFzVjBGQlR5eE5RVUZOTEVOQlFVTTdRMEZEYWtJN08wRkJSVVFzVTBGQlV5eFJRVUZSTEVOQlFVTXNSMEZCUnl4RlFVRkZMRWRCUVVjc1JVRkJRenRCUVVOMlFpeFJRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1IwRkJSeXhEUVVGRE8wTkJRMjVDT3p0eFFrRkZZeXhMUVVGTElpd2labWxzWlNJNklpOVZjMlZ5Y3k5MFlXeDNiMjlzWmk5a1pYWmxiRzl3WlhJdmQyVmlVbTl2ZEM5MGNtRnVjMmwwYVc5dUxXMWhibUZuWlhJdmMzSmpMM1YwYVd4ekwyMXBlR2x1TG1weklpd2ljMjkxY21ObGMwTnZiblJsYm5RaU9sc2lYRzVwYlhCdmNuUWdabTl5VDNkdUlHWnliMjBnSnk0dlptOXlUM2R1Snp0Y2JseHVablZ1WTNScGIyNGdiV2w0YVc0b0lIUmhjbWRsZEN3Z2IySnFaV04wY3lBcElIdGNibHgwZG1GeUlHa2dQU0F3TEZ4dUlDQWdJRzRnUFNCaGNtZDFiV1Z1ZEhNdWJHVnVaM1JvTEZ4dUlDQWdJRzlpYWp0Y2JpQWdJQ0IzYUdsc1pTZ3JLMmtnUENCdUtYdGNiaUFnSUNBZ0lDQWdiMkpxSUQwZ1lYSm5kVzFsYm5SelcybGRPMXh1SUNBZ0lDQWdJQ0JwWmlBb2IySnFJQ0U5SUc1MWJHd3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHWnZjazkzYmlodlltb3NJR052Y0hsUWNtOXdMQ0IwWVhKblpYUXBPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdmVnh1SUNBZ0lISmxkSFZ5YmlCMFlYSm5aWFE3WEc1OVhHNWNibVoxYm1OMGFXOXVJR052Y0hsUWNtOXdLSFpoYkN3Z2EyVjVLWHRjYmlBZ0lDQjBhR2x6VzJ0bGVWMGdQU0IyWVd3N1hHNTlYRzVjYm1WNGNHOXlkQ0JrWldaaGRXeDBJRzFwZUdsdU95SmRmUT09IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7XG4gICAgdmFsdWU6IHRydWVcbn0pO1xudmFyIHNsaWNlID0gcmVxdWlyZSgnLi9zbGljZScpO1xuXG4vKipcbiAqIFJldHVybiBhIGNvcHkgb2YgdGhlIG9iamVjdCwgZmlsdGVyZWQgdG8gb25seSBoYXZlIHZhbHVlcyBmb3IgdGhlIHdoaXRlbGlzdGVkIGtleXMuXG4gKi9cbmZ1bmN0aW9uIHBpY2sob2JqLCB2YXJfa2V5cykge1xuICAgIHZhciBrZXlzID0gdHlwZW9mIGFyZ3VtZW50c1sxXSAhPT0gJ3N0cmluZycgPyBhcmd1bWVudHNbMV0gOiBzbGljZShhcmd1bWVudHMsIDEpLFxuICAgICAgICBvdXQgPSB7fSxcbiAgICAgICAgaSA9IDAsXG4gICAgICAgIGtleTtcbiAgICB3aGlsZSAoa2V5ID0ga2V5c1tpKytdKSB7XG4gICAgICAgIG91dFtrZXldID0gb2JqW2tleV07XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG59XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHBpY2s7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJaTlWYzJWeWN5OTBZV3gzYjI5c1ppOWtaWFpsYkc5d1pYSXZkMlZpVW05dmRDOTBjbUZ1YzJsMGFXOXVMVzFoYm1GblpYSXZjM0pqTDNWMGFXeHpMM0JwWTJzdWFuTWlYU3dpYm1GdFpYTWlPbHRkTENKdFlYQndhVzVuY3lJNklqczdPenM3UVVGQlFTeEpRVUZKTEV0QlFVc3NSMEZCUnl4UFFVRlBMRU5CUVVNc1UwRkJVeXhEUVVGRExFTkJRVU03T3pzN08wRkJTek5DTEZOQlFWTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1JVRkJSU3hSUVVGUkxFVkJRVU03UVVGRGVFSXNVVUZCU1N4SlFVRkpMRWRCUVVjc1QwRkJUeXhUUVVGVExFTkJRVU1zUTBGQlF5eERRVUZETEV0QlFVc3NVVUZCVVN4SFFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNVMEZCVXl4RlFVRkZMRU5CUVVNc1EwRkJRenRSUVVNelJTeEhRVUZITEVkQlFVY3NSVUZCUlR0UlFVTlNMRU5CUVVNc1IwRkJSeXhEUVVGRE8xRkJRVVVzUjBGQlJ5eERRVUZETzBGQlEyWXNWMEZCVHl4SFFVRkhMRWRCUVVjc1NVRkJTU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVTdRVUZEY0VJc1YwRkJSeXhEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRMUVVOMlFqdEJRVU5FTEZkQlFVOHNSMEZCUnl4RFFVRkRPME5CUTJRN08zRkNRVVZWTEVsQlFVa2lMQ0ptYVd4bElqb2lMMVZ6WlhKekwzUmhiSGR2YjJ4bUwyUmxkbVZzYjNCbGNpOTNaV0pTYjI5MEwzUnlZVzV6YVhScGIyNHRiV0Z1WVdkbGNpOXpjbU12ZFhScGJITXZjR2xqYXk1cWN5SXNJbk52ZFhKalpYTkRiMjUwWlc1MElqcGJJblpoY2lCemJHbGpaU0E5SUhKbGNYVnBjbVVvSnk0dmMyeHBZMlVuS1R0Y2JseHVJQ0FnSUM4cUtseHVJQ0FnSUNBcUlGSmxkSFZ5YmlCaElHTnZjSGtnYjJZZ2RHaGxJRzlpYW1WamRDd2dabWxzZEdWeVpXUWdkRzhnYjI1c2VTQm9ZWFpsSUhaaGJIVmxjeUJtYjNJZ2RHaGxJSGRvYVhSbGJHbHpkR1ZrSUd0bGVYTXVYRzRnSUNBZ0lDb3ZYRzRnSUNBZ1puVnVZM1JwYjI0Z2NHbGpheWh2WW1vc0lIWmhjbDlyWlhsektYdGNiaUFnSUNBZ0lDQWdkbUZ5SUd0bGVYTWdQU0IwZVhCbGIyWWdZWEpuZFcxbGJuUnpXekZkSUNFOVBTQW5jM1J5YVc1bkp6OGdZWEpuZFcxbGJuUnpXekZkSURvZ2MyeHBZMlVvWVhKbmRXMWxiblJ6TENBeEtTeGNiaUFnSUNBZ0lDQWdJQ0FnSUc5MWRDQTlJSHQ5TEZ4dUlDQWdJQ0FnSUNBZ0lDQWdhU0E5SURBc0lHdGxlVHRjYmlBZ0lDQWdJQ0FnZDJocGJHVWdLR3RsZVNBOUlHdGxlWE5iYVNzclhTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2IzVjBXMnRsZVYwZ1BTQnZZbXBiYTJWNVhUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdiM1YwTzF4dUlDQWdJSDFjYmx4dVpYaHdiM0owSUdSbFptRjFiSFFnY0dsamF6c2lYWDA9IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcbi8qKlxuICogQ3JlYXRlIHNsaWNlIG9mIHNvdXJjZSBhcnJheSBvciBhcnJheS1saWtlIG9iamVjdFxuICovXG5mdW5jdGlvbiBzbGljZShhcnIsIHN0YXJ0LCBlbmQpIHtcbiAgICB2YXIgbGVuID0gYXJyLmxlbmd0aDtcblxuICAgIGlmIChzdGFydCA9PSBudWxsKSB7XG4gICAgICAgIHN0YXJ0ID0gMDtcbiAgICB9IGVsc2UgaWYgKHN0YXJ0IDwgMCkge1xuICAgICAgICBzdGFydCA9IE1hdGgubWF4KGxlbiArIHN0YXJ0LCAwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzdGFydCA9IE1hdGgubWluKHN0YXJ0LCBsZW4pO1xuICAgIH1cblxuICAgIGlmIChlbmQgPT0gbnVsbCkge1xuICAgICAgICBlbmQgPSBsZW47XG4gICAgfSBlbHNlIGlmIChlbmQgPCAwKSB7XG4gICAgICAgIGVuZCA9IE1hdGgubWF4KGxlbiArIGVuZCwgMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZW5kID0gTWF0aC5taW4oZW5kLCBsZW4pO1xuICAgIH1cblxuICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICB3aGlsZSAoc3RhcnQgPCBlbmQpIHtcbiAgICAgICAgcmVzdWx0LnB1c2goYXJyW3N0YXJ0KytdKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHNsaWNlO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzW1wiZGVmYXVsdFwiXTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJaTlWYzJWeWN5OTBZV3gzYjI5c1ppOWtaWFpsYkc5d1pYSXZkMlZpVW05dmRDOTBjbUZ1YzJsMGFXOXVMVzFoYm1GblpYSXZjM0pqTDNWMGFXeHpMM05zYVdObExtcHpJbDBzSW01aGJXVnpJanBiWFN3aWJXRndjR2x1WjNNaU9pSTdPenM3T3pzN08wRkJSMGtzVTBGQlV5eExRVUZMTEVOQlFVTXNSMEZCUnl4RlFVRkZMRXRCUVVzc1JVRkJSU3hIUVVGSExFVkJRVU03UVVGRE0wSXNVVUZCU1N4SFFVRkhMRWRCUVVjc1IwRkJSeXhEUVVGRExFMUJRVTBzUTBGQlF6czdRVUZGY2tJc1VVRkJTU3hMUVVGTExFbEJRVWtzU1VGQlNTeEZRVUZGTzBGQlEyWXNZVUZCU3l4SFFVRkhMRU5CUVVNc1EwRkJRenRMUVVOaUxFMUJRVTBzU1VGQlNTeExRVUZMTEVkQlFVY3NRMEZCUXl4RlFVRkZPMEZCUTJ4Q0xHRkJRVXNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1IwRkJSeXhMUVVGTExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdTMEZEY0VNc1RVRkJUVHRCUVVOSUxHRkJRVXNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRXRCUVVzc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF6dExRVU5vUXpzN1FVRkZSQ3hSUVVGSkxFZEJRVWNzU1VGQlNTeEpRVUZKTEVWQlFVVTdRVUZEWWl4WFFVRkhMRWRCUVVjc1IwRkJSeXhEUVVGRE8wdEJRMklzVFVGQlRTeEpRVUZKTEVkQlFVY3NSMEZCUnl4RFFVRkRMRVZCUVVVN1FVRkRhRUlzVjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhIUVVGSExFZEJRVWNzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0TFFVTm9ReXhOUVVGTk8wRkJRMGdzVjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETzB0QlF6VkNPenRCUVVWRUxGRkJRVWtzVFVGQlRTeEhRVUZITEVWQlFVVXNRMEZCUXp0QlFVTm9RaXhYUVVGUExFdEJRVXNzUjBGQlJ5eEhRVUZITEVWQlFVVTdRVUZEYUVJc1kwRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNTMEZCU3l4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8wdEJRemRDT3p0QlFVVkVMRmRCUVU4c1RVRkJUU3hEUVVGRE8wTkJRMnBDT3p0eFFrRkZWU3hMUVVGTElpd2labWxzWlNJNklpOVZjMlZ5Y3k5MFlXeDNiMjlzWmk5a1pYWmxiRzl3WlhJdmQyVmlVbTl2ZEM5MGNtRnVjMmwwYVc5dUxXMWhibUZuWlhJdmMzSmpMM1YwYVd4ekwzTnNhV05sTG1weklpd2ljMjkxY21ObGMwTnZiblJsYm5RaU9sc2lJQ0FnSUM4cUtseHVJQ0FnSUNBcUlFTnlaV0YwWlNCemJHbGpaU0J2WmlCemIzVnlZMlVnWVhKeVlYa2diM0lnWVhKeVlYa3RiR2xyWlNCdlltcGxZM1JjYmlBZ0lDQWdLaTljYmlBZ0lDQm1kVzVqZEdsdmJpQnpiR2xqWlNoaGNuSXNJSE4wWVhKMExDQmxibVFwZTF4dUlDQWdJQ0FnSUNCMllYSWdiR1Z1SUQwZ1lYSnlMbXhsYm1kMGFEdGNibHh1SUNBZ0lDQWdJQ0JwWmlBb2MzUmhjblFnUFQwZ2JuVnNiQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdjM1JoY25RZ1BTQXdPMXh1SUNBZ0lDQWdJQ0I5SUdWc2MyVWdhV1lnS0hOMFlYSjBJRHdnTUNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnYzNSaGNuUWdQU0JOWVhSb0xtMWhlQ2hzWlc0Z0t5QnpkR0Z5ZEN3Z01DazdYRzRnSUNBZ0lDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCemRHRnlkQ0E5SUUxaGRHZ3ViV2x1S0hOMFlYSjBMQ0JzWlc0cE8xeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnYVdZZ0tHVnVaQ0E5UFNCdWRXeHNLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmxibVFnUFNCc1pXNDdYRzRnSUNBZ0lDQWdJSDBnWld4elpTQnBaaUFvWlc1a0lEd2dNQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdaVzVrSUQwZ1RXRjBhQzV0WVhnb2JHVnVJQ3NnWlc1a0xDQXdLVHRjYmlBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHVnVaQ0E5SUUxaGRHZ3ViV2x1S0dWdVpDd2diR1Z1S1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJSFpoY2lCeVpYTjFiSFFnUFNCYlhUdGNiaUFnSUNBZ0lDQWdkMmhwYkdVZ0tITjBZWEowSUR3Z1pXNWtLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaWE4xYkhRdWNIVnphQ2hoY25KYmMzUmhjblFySzEwcE8xeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSEpsYzNWc2REdGNiaUFnSUNCOVhHNWNibVY0Y0c5eWRDQmtaV1poZFd4MElITnNhV05sT3lKZGZRPT0iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHtcblx0dmFsdWU6IHRydWVcbn0pO1xuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIGpvaW4gdHdvIGFycmF5cyBhbmQgcHJldmVudCBkdXBsaWNhdGlvblxuICogQHBhcmFtICB7YXJyYXl9IHRhcmdldCBcbiAqIEBwYXJhbSAge2FycmF5fSBhcnJheXMgXG4gKiBAcmV0dXJuIHthcnJheX0gXG4gKi9cbmZ1bmN0aW9uIHVuaXF1ZSh0YXJnZXQsIGFycmF5cykge1xuXHR0YXJnZXQgPSB0YXJnZXQgfHwgW107XG5cdHZhciBjb21iaW5lZCA9IHRhcmdldC5jb25jYXQoYXJyYXlzKTtcblx0dGFyZ2V0ID0gW107XG5cblx0dmFyIGxlbiA9IGNvbWJpbmVkLmxlbmd0aCxcblx0ICAgIGkgPSAtMSxcblx0ICAgIE9ialJlZjtcblxuXHR3aGlsZSAoKytpIDwgbGVuKSB7XG5cdFx0T2JqUmVmID0gY29tYmluZWRbaV07XG5cdFx0aWYgKHRhcmdldC5pbmRleE9mKE9ialJlZikgPT09IC0xICYmIE9ialJlZiAhPT0gJycgJiBPYmpSZWYgIT09IChudWxsIHx8IHVuZGVmaW5lZCkpIHtcblx0XHRcdHRhcmdldFt0YXJnZXQubGVuZ3RoXSA9IE9ialJlZjtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHRhcmdldDtcbn1cblxuZXhwb3J0c1snZGVmYXVsdCddID0gdW5pcXVlO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSWk5VmMyVnljeTkwWVd4M2IyOXNaaTlrWlhabGJHOXdaWEl2ZDJWaVVtOXZkQzkwY21GdWMybDBhVzl1TFcxaGJtRm5aWEl2YzNKakwzVjBhV3h6TDNWdWFYRjFaUzVxY3lKZExDSnVZVzFsY3lJNlcxMHNJbTFoY0hCcGJtZHpJam9pT3pzN096dEJRVUZCTEZsQlFWa3NRMEZCUXpzN096czdPenM3UVVGVFlpeFRRVUZUTEUxQlFVMHNRMEZCUlN4TlFVRk5MRVZCUVVVc1RVRkJUU3hGUVVNdlFqdEJRVU5ETEU5QlFVMHNSMEZCUnl4TlFVRk5MRWxCUVVrc1JVRkJSU3hEUVVGRE8wRkJRM1JDTEV0QlFVa3NVVUZCVVN4SFFVRkhMRTFCUVUwc1EwRkJReXhOUVVGTkxFTkJRVVVzVFVGQlRTeERRVUZGTEVOQlFVTTdRVUZEZEVNc1QwRkJUU3hIUVVGTExFVkJRVVVzUTBGQlF6czdRVUZGWml4TFFVRkpMRWRCUVVjc1IwRkJSeXhSUVVGUkxFTkJRVU1zVFVGQlRUdExRVU40UWl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8wdEJRMDRzVFVGQlRTeERRVUZET3p0QlFVVlFMRkZCUVUwc1JVRkJSU3hEUVVGRExFZEJRVWNzUjBGQlJ5eEZRVUZGTzBGQlEyaENMRkZCUVUwc1IwRkJSeXhSUVVGUkxFTkJRVVVzUTBGQlF5eERRVUZGTEVOQlFVTTdRVUZEZGtJc1RVRkJTU3hOUVVGTkxFTkJRVU1zVDBGQlR5eERRVUZGTEUxQlFVMHNRMEZCUlN4TFFVRkxMRU5CUVVNc1EwRkJReXhKUVVGSkxFMUJRVTBzUzBGQlN5eEZRVUZGTEVkQlFVY3NUVUZCVFN4TlFVRlBMRWxCUVVrc1NVRkJTU3hUUVVGVExFTkJRVUVzUVVGQlF5eEZRVUZITzBGQlEzaEdMRk5CUVUwc1EwRkJSU3hOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZGTEVkQlFVY3NUVUZCVFN4RFFVRkRPMGRCUTJwRE8wVkJRMFE3UVVGRFJDeFJRVUZQTEUxQlFVMHNRMEZCUXp0RFFVTm1PenR4UWtGRll5eE5RVUZOSWl3aVptbHNaU0k2SWk5VmMyVnljeTkwWVd4M2IyOXNaaTlrWlhabGJHOXdaWEl2ZDJWaVVtOXZkQzkwY21GdWMybDBhVzl1TFcxaGJtRm5aWEl2YzNKakwzVjBhV3h6TDNWdWFYRjFaUzVxY3lJc0luTnZkWEpqWlhORGIyNTBaVzUwSWpwYklpZDFjMlVnYzNSeWFXTjBKenRjYmx4dVhHNHZLaXBjYmlBcUlHcHZhVzRnZEhkdklHRnljbUY1Y3lCaGJtUWdjSEpsZG1WdWRDQmtkWEJzYVdOaGRHbHZibHh1SUNvZ1FIQmhjbUZ0SUNCN1lYSnlZWGw5SUhSaGNtZGxkQ0JjYmlBcUlFQndZWEpoYlNBZ2UyRnljbUY1ZlNCaGNuSmhlWE1nWEc0Z0tpQkFjbVYwZFhKdUlIdGhjbkpoZVgwZ1hHNGdLaTljYm1aMWJtTjBhVzl1SUhWdWFYRjFaU2dnZEdGeVoyVjBMQ0JoY25KaGVYTWdLVnh1ZTF4dVhIUjBZWEpuWlhRZ1BTQjBZWEpuWlhRZ2ZId2dXMTA3WEc1Y2RIWmhjaUJqYjIxaWFXNWxaQ0E5SUhSaGNtZGxkQzVqYjI1allYUW9JR0Z5Y21GNWN5QXBPMXh1WEhSY2RIUmhjbWRsZENCY2RDQTlJRnRkTzF4dVhHNWNkSFpoY2lCc1pXNGdQU0JqYjIxaWFXNWxaQzVzWlc1bmRHZ3NYRzVjZEZ4MGFTQTlJQzB4TEZ4dVhIUmNkRTlpYWxKbFpqdGNibHh1WEhSY2RIZG9hV3hsS0NzcmFTQThJR3hsYmlrZ2UxeHVYSFJjZEZ4MFQySnFVbVZtSUQwZ1kyOXRZbWx1WldSYklHa2dYVHRjYmx4MFhIUmNkR2xtS0NCMFlYSm5aWFF1YVc1a1pYaFBaaWdnVDJKcVVtVm1JQ2tnUFQwOUlDMHhJQ1ltSUU5aWFsSmxaaUFoUFQwZ0p5Y2dKaUJQWW1wU1pXWWdJVDA5SUNBb2JuVnNiQ0I4ZkNCMWJtUmxabWx1WldRcElDa2dlMXh1WEhSY2RGeDBYSFIwWVhKblpYUmJJSFJoY21kbGRDNXNaVzVuZEdnZ1hTQTlJRTlpYWxKbFpqdGNibHgwWEhSY2RIMWNibHgwWEhSOVhHNWNkRngwY21WMGRYSnVJSFJoY21kbGREdGNibjFjYmx4dVpYaHdiM0owSUdSbFptRjFiSFFnZFc1cGNYVmxPeUpkZlE9PSIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cblx0J1NUQVRFX0lOSVRJQUwnOiB7XG5cdFx0Ly8gdmlldyBcdFx0XHQ6ICcnLFxuXHRcdGluaXRpYWw6IHRydWUsXG5cblx0XHRhY3Rpb25zOiB7XG5cdFx0XHQnQUNUSU9OX0lOSVRfSE9NRSc6IHtcblx0XHRcdFx0dHJhbnNpdGlvblR5cGU6ICdTbGlkZUluSW5pdGlhbCcsXG5cdFx0XHRcdHRhcmdldDogJ1NUQVRFX0hPTUUnLFxuXG5cdFx0XHRcdHRyYW5zaXRpb25zOiBbe1xuXHRcdFx0XHRcdHRyYW5zaXRpb25UeXBlOiAnTG9nb1NsaWRlJyxcblx0XHRcdFx0XHR2aWV3czogWydsb2dvVmlldyddXG5cdFx0XHRcdH1dXG5cdFx0XHR9LFxuXHRcdFx0J0FDVElPTl9JTklUX0FCT1VUJzoge1xuXHRcdFx0XHR0cmFuc2l0aW9uVHlwZTogJ1NsaWRlSW5Jbml0aWFsJyxcblx0XHRcdFx0dGFyZ2V0OiAnU1RBVEVfQUJPVVQnXG5cdFx0XHR9LFxuXHRcdFx0J0FDVElPTl9JTklUX0NPTlRBQ1QnOiB7XG5cdFx0XHRcdHRyYW5zaXRpb25UeXBlOiAnU2xpZGVJbkluaXRpYWwnLFxuXHRcdFx0XHR0YXJnZXQ6ICdTVEFURV9DT05UQUNUJ1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXHQnU1RBVEVfSE9NRSc6IHtcblx0XHR2aWV3OiAnaG9tZVZpZXcnLFxuXHRcdC8vIGluaXRpYWwgXHRcdDogdHJ1ZSxcblxuXHRcdGFjdGlvbnM6IHtcblx0XHRcdCdBQ1RJT05fQUJPVVQnOiB7XG5cdFx0XHRcdHRhcmdldDogJ1NUQVRFX0FCT1VUJyxcblx0XHRcdFx0dHJhbnNpdGlvblR5cGU6ICdTbGlkZUluT3V0Jyxcblx0XHRcdFx0dmlld3M6IFsnYWJvdXRWaWV3J10sXG5cblx0XHRcdFx0dHJhbnNpdGlvbnM6IFt7XG5cdFx0XHRcdFx0dHJhbnNpdGlvblR5cGU6ICdMb2dvU2xpZGUnLFxuXHRcdFx0XHRcdHZpZXdzOiBbJ2xvZ29WaWV3J11cblx0XHRcdFx0fV1cblxuXHRcdFx0fSxcblxuXHRcdFx0J0FDVElPTl9DT05UQUNUJzoge1xuXHRcdFx0XHR0YXJnZXQ6ICdTVEFURV9DT05UQUNUJyxcblx0XHRcdFx0dHJhbnNpdGlvblR5cGU6ICdTbGlkZUluT3V0Jyxcblx0XHRcdFx0dmlld3M6IFsnY29udGFjdFZpZXcnXSxcblxuXHRcdFx0XHR0cmFuc2l0aW9uczogW3tcblx0XHRcdFx0XHR0cmFuc2l0aW9uVHlwZTogJ0xvZ29TbGlkZScsXG5cdFx0XHRcdFx0dmlld3M6IFsnbG9nb1ZpZXcnXVxuXHRcdFx0XHR9XVxuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXHQnU1RBVEVfQUJPVVQnOiB7XG5cdFx0dmlldzogJ2Fib3V0VmlldycsXG5cblx0XHRhY3Rpb25zOiB7XG5cdFx0XHQnQUNUSU9OX0hPTUUnOiB7XG5cdFx0XHRcdHRhcmdldDogJ1NUQVRFX0hPTUUnLFxuXHRcdFx0XHR0cmFuc2l0aW9uVHlwZTogJ1NsaWRlSW5PdXQnLFxuXHRcdFx0XHR2aWV3czogWydob21lVmlldycsICdsb2dvVmlldyddXG5cblx0XHRcdFx0Ly8gdHJhbnNpdGlvbnMgOiBbXG5cdFx0XHRcdC8vIFx0e1xuXHRcdFx0XHQvLyBcdFx0dHJhbnNpdGlvblR5cGUgIDogJ0xvZ29TbGlkZScsXG5cdFx0XHRcdC8vIFx0XHR2aWV3cyBcdFx0XHQ6IFsgJ2xvZ29WaWV3JyBdXG5cdFx0XHRcdC8vIFx0fVxuXHRcdFx0XHQvLyBdXG5cdFx0XHR9LFxuXG5cdFx0XHQnQUNUSU9OX0NPTlRBQ1QnOiB7XG5cdFx0XHRcdHRhcmdldDogJ1NUQVRFX0NPTlRBQ1QnLFxuXHRcdFx0XHR0cmFuc2l0aW9uVHlwZTogJ1NsaWRlSW5PdXQnLFxuXHRcdFx0XHQvLyB2aWV3cyBcdFx0XHQ6IFsgJ2NvbnRhY3RWaWV3JyBdXG5cblx0XHRcdFx0dHJhbnNpdGlvbnM6IFt7XG5cdFx0XHRcdFx0dHJhbnNpdGlvblR5cGU6ICdMb2dvU2xpZGUnLFxuXHRcdFx0XHRcdHZpZXdzOiBbJ2xvZ29WaWV3J11cblx0XHRcdFx0fV1cblx0XHRcdH0gfVxuXHR9LFxuXG5cdCdTVEFURV9DT05UQUNUJzoge1xuXHRcdHZpZXc6ICdjb250YWN0VmlldycsXG5cblx0XHRhY3Rpb25zOiB7XG5cblx0XHRcdCdBQ1RJT05fSE9NRSc6IHtcblx0XHRcdFx0dGFyZ2V0OiAnU1RBVEVfSE9NRScsXG5cdFx0XHRcdHRyYW5zaXRpb25UeXBlOiAnU2xpZGVJbk91dCcsXG5cdFx0XHRcdHZpZXdzOiBbJ2hvbWVWaWV3J10sXG5cblx0XHRcdFx0dHJhbnNpdGlvbnM6IFt7XG5cdFx0XHRcdFx0dHJhbnNpdGlvblR5cGU6ICdMb2dvU2xpZGUnLFxuXHRcdFx0XHRcdHZpZXdzOiBbJ2xvZ29WaWV3J11cblx0XHRcdFx0fV1cblx0XHRcdH0sXG5cblx0XHRcdCdBQ1RJT05fQUJPVVQnOiB7XG5cdFx0XHRcdHRhcmdldDogJ1NUQVRFX0FCT1VUJyxcblx0XHRcdFx0dHJhbnNpdGlvblR5cGU6ICdTbGlkZUluT3V0Jyxcblx0XHRcdFx0dmlld3M6IFsnYWJvdXRWaWV3J10sXG5cdFx0XHRcdHRyYW5zaXRpb25zOiBbe1xuXHRcdFx0XHRcdHRyYW5zaXRpb25UeXBlOiAnTG9nb1NsaWRlJyxcblx0XHRcdFx0XHR2aWV3czogWydsb2dvVmlldyddXG5cdFx0XHRcdH1dXG5cdFx0XHR9XG5cdFx0fVxuXG5cdH1cbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSWk5VmMyVnljeTkwWVd4M2IyOXNaaTlrWlhabGJHOXdaWEl2ZDJWaVVtOXZkQzkwY21GdWMybDBhVzl1TFcxaGJtRm5aWEl2ZEdWemRDOWtZWFJoTG1weklsMHNJbTVoYldWeklqcGJYU3dpYldGd2NHbHVaM01pT2lJN08wRkJRVUVzVFVGQlRTeERRVUZETEU5QlFVOHNSMEZCUnpzN1FVRkZhRUlzWjBKQlFXVXNSVUZCUnpzN1FVRkZha0lzVTBGQlR5eEZRVUZMTEVsQlFVazdPMEZCUldoQ0xGTkJRVThzUlVGQlJ6dEJRVU5VTEhGQ1FVRnJRaXhGUVVGSE8wRkJRM0JDTEd0Q1FVRmpMRVZCUVVjc1owSkJRV2RDTzBGQlEycERMRlZCUVUwc1JVRkJUU3haUVVGWk96dEJRVVY0UWl4bFFVRlhMRVZCUVVjc1EwRkRZanRCUVVORExHMUNRVUZqTEVWQlFVa3NWMEZCVnp0QlFVTTNRaXhWUVVGTExFVkJRVTBzUTBGQlJTeFZRVUZWTEVOQlFVYzdTMEZETVVJc1EwRkRSRHRKUVVORU8wRkJRMFFzYzBKQlFXMUNMRVZCUVVjN1FVRkRja0lzYTBKQlFXTXNSVUZCUnl4blFrRkJaMEk3UVVGRGFrTXNWVUZCVFN4RlFVRk5MR0ZCUVdFN1NVRkRla0k3UVVGRFJDeDNRa0ZCY1VJc1JVRkJSenRCUVVOMlFpeHJRa0ZCWXl4RlFVRkhMR2RDUVVGblFqdEJRVU5xUXl4VlFVRk5MRVZCUVUwc1pVRkJaVHRKUVVNelFqdEhRVU5FTzBWQlEwUTdPMEZCUjBRc1lVRkJXU3hGUVVGSE8wRkJRMlFzVFVGQlNTeEZRVUZOTEZWQlFWVTdPenRCUVVkd1FpeFRRVUZQTEVWQlFVYzdRVUZEVkN4cFFrRkJZeXhGUVVGSE8wRkJRMmhDTEZWQlFVMHNSVUZCVFN4aFFVRmhPMEZCUTNwQ0xHdENRVUZqTEVWQlFVY3NXVUZCV1R0QlFVTTNRaXhUUVVGTExFVkJRVTBzUTBGQlJTeFhRVUZYTEVOQlFVVTdPMEZCUlRGQ0xHVkJRVmNzUlVGQlJ5eERRVU5pTzBGQlEwTXNiVUpCUVdNc1JVRkJTU3hYUVVGWE8wRkJRemRDTEZWQlFVc3NSVUZCVFN4RFFVRkZMRlZCUVZVc1EwRkJSenRMUVVNeFFpeERRVVZFT3p0SlFVVkVPenRCUVVWRUxHMUNRVUZuUWl4RlFVRkhPMEZCUTJ4Q0xGVkJRVTBzUlVGQlRTeGxRVUZsTzBGQlF6TkNMR3RDUVVGakxFVkJRVWNzV1VGQldUdEJRVU0zUWl4VFFVRkxMRVZCUVUwc1EwRkJSU3hoUVVGaExFTkJRVVU3TzBGQlJUVkNMR1ZCUVZjc1JVRkJSeXhEUVVOaU8wRkJRME1zYlVKQlFXTXNSVUZCU1N4WFFVRlhPMEZCUXpkQ0xGVkJRVXNzUlVGQlRTeERRVUZGTEZWQlFWVXNRMEZCUlR0TFFVTjZRaXhEUVVORU8wbEJRMFE3UjBGRFJEdEZRVU5FT3p0QlFVVkVMR05CUVdFc1JVRkJSenRCUVVObUxFMUJRVWtzUlVGQlNTeFhRVUZYT3p0QlFVVnVRaXhUUVVGUExFVkJRVWM3UVVGRFZDeG5Ra0ZCWVN4RlFVRkhPMEZCUTJZc1ZVRkJUU3hGUVVGTkxGbEJRVms3UVVGRGVFSXNhMEpCUVdNc1JVRkJSeXhaUVVGWk8wRkJRemRDTEZOQlFVc3NSVUZCVFN4RFFVRkZMRlZCUVZVc1JVRkJSeXhWUVVGVkxFTkJRVVU3T3pzN096czdPMEZCUVVFc1NVRlJkRU03TzBGQlJVUXNiVUpCUVdkQ0xFVkJRVWM3UVVGRGJFSXNWVUZCVFN4RlFVRk5MR1ZCUVdVN1FVRkRNMElzYTBKQlFXTXNSVUZCUnl4WlFVRlpPenM3UVVGSE4wSXNaVUZCVnl4RlFVRkhMRU5CUTJJN1FVRkRReXh0UWtGQll5eEZRVUZKTEZkQlFWYzdRVUZETjBJc1ZVRkJTeXhGUVVGTkxFTkJRVVVzVlVGQlZTeERRVUZGTzB0QlEzcENMRU5CUTBRN1NVRkRSQ3hGUVVORU8wVkJRMFE3TzBGQlJVUXNaMEpCUVdVc1JVRkJSenRCUVVOcVFpeE5RVUZKTEVWQlFVa3NZVUZCWVRzN1FVRkZja0lzVTBGQlR5eEZRVUZIT3p0QlFVVlVMR2RDUVVGaExFVkJRVWM3UVVGRFppeFZRVUZOTEVWQlFVMHNXVUZCV1R0QlFVTjRRaXhyUWtGQll5eEZRVUZITEZsQlFWazdRVUZETjBJc1UwRkJTeXhGUVVGTkxFTkJRVVVzVlVGQlZTeERRVUZGT3p0QlFVVjZRaXhsUVVGWExFVkJRVWNzUTBGRFlqdEJRVU5ETEcxQ1FVRmpMRVZCUVVrc1YwRkJWenRCUVVNM1FpeFZRVUZMTEVWQlFVMHNRMEZCUlN4VlFVRlZMRU5CUVVVN1MwRkRla0lzUTBGRFJEdEpRVU5FT3p0QlFVVkVMR2xDUVVGakxFVkJRVWM3UVVGRGFFSXNWVUZCVFN4RlFVRk5MR0ZCUVdFN1FVRkRla0lzYTBKQlFXTXNSVUZCUnl4WlFVRlpPMEZCUXpkQ0xGTkJRVXNzUlVGQlRTeERRVUZGTEZkQlFWY3NRMEZCUlR0QlFVTXhRaXhsUVVGWExFVkJRVWNzUTBGRFlqdEJRVU5ETEcxQ1FVRmpMRVZCUVVrc1YwRkJWenRCUVVNM1FpeFZRVUZMTEVWQlFVMHNRMEZCUlN4VlFVRlZMRU5CUVVVN1MwRkRla0lzUTBGRFJEdEpRVU5FTzBkQlEwUTdPMFZCUjBRN1EwRkRSQ3hEUVVGQklpd2labWxzWlNJNklpOVZjMlZ5Y3k5MFlXeDNiMjlzWmk5a1pYWmxiRzl3WlhJdmQyVmlVbTl2ZEM5MGNtRnVjMmwwYVc5dUxXMWhibUZuWlhJdmRHVnpkQzlrWVhSaExtcHpJaXdpYzI5MWNtTmxjME52Ym5SbGJuUWlPbHNpYlc5a2RXeGxMbVY0Y0c5eWRITWdQU0I3WEc1Y2JseDBKMU5VUVZSRlgwbE9TVlJKUVV3bklEb2dlMXh1WEhSY2RDOHZJSFpwWlhjZ1hIUmNkRngwT2lBbkp5eGNibHgwWEhScGJtbDBhV0ZzSUZ4MFhIUTZJSFJ5ZFdVc1hHNWNibHgwWEhSaFkzUnBiMjV6SURvZ2V5QmNibHgwWEhSY2RDZEJRMVJKVDA1ZlNVNUpWRjlJVDAxRkp5QTZJSHRjYmx4MFhIUmNkRngwZEhKaGJuTnBkR2x2YmxSNWNHVmNkRG9nSjFOc2FXUmxTVzVKYm1sMGFXRnNKeXhjYmx4MFhIUmNkRngwZEdGeVoyVjBJRngwWEhSY2REb2dKMU5VUVZSRlgwaFBUVVVuTEZ4dVhHNWNkRngwWEhSY2RIUnlZVzV6YVhScGIyNXpJRG9nVzF4dVhIUmNkRngwWEhSY2RIdGNibHgwWEhSY2RGeDBYSFJjZEhSeVlXNXphWFJwYjI1VWVYQmxJQ0E2SUNkTWIyZHZVMnhwWkdVbkxGeHVYSFJjZEZ4MFhIUmNkRngwZG1sbGQzTWdYSFJjZEZ4ME9pQmJJQ2RzYjJkdlZtbGxkeWNzSUYxY2JseDBYSFJjZEZ4MFhIUjlYRzVjZEZ4MFhIUmNkRjFjYmx4MFhIUmNkSDBzWEc1Y2RGeDBYSFFuUVVOVVNVOU9YMGxPU1ZSZlFVSlBWVlFuSURvZ2UxeHVYSFJjZEZ4MFhIUjBjbUZ1YzJsMGFXOXVWSGx3WlZ4ME9pQW5VMnhwWkdWSmJrbHVhWFJwWVd3bkxGeHVYSFJjZEZ4MFhIUjBZWEpuWlhRZ1hIUmNkRngwT2lBblUxUkJWRVZmUVVKUFZWUW5YRzVjZEZ4MFhIUjlMRnh1WEhSY2RGeDBKMEZEVkVsUFRsOUpUa2xVWDBOUFRsUkJRMVFuSURvZ2UxeHVYSFJjZEZ4MFhIUjBjbUZ1YzJsMGFXOXVWSGx3WlZ4ME9pQW5VMnhwWkdWSmJrbHVhWFJwWVd3bkxGeHVYSFJjZEZ4MFhIUjBZWEpuWlhRZ1hIUmNkRngwT2lBblUxUkJWRVZmUTA5T1ZFRkRWQ2RjYmx4MFhIUmNkSDFjYmx4MFhIUjlYRzVjZEgwc1hHNWNibHh1WEhRblUxUkJWRVZmU0U5TlJTY2dPaUI3WEc1Y2RGeDBkbWxsZHlCY2RGeDBYSFE2SUNkb2IyMWxWbWxsZHljc1hHNWNkRngwTHk4Z2FXNXBkR2xoYkNCY2RGeDBPaUIwY25WbExGeHVYRzVjZEZ4MFlXTjBhVzl1Y3lBNklIdGNibHgwWEhSY2RDZEJRMVJKVDA1ZlFVSlBWVlFuSURvZ2UxeHVYSFJjZEZ4MFhIUjBZWEpuWlhRZ1hIUmNkRngwT2lBblUxUkJWRVZmUVVKUFZWUW5MRnh1WEhSY2RGeDBYSFIwY21GdWMybDBhVzl1Vkhsd1pWeDBPaUFuVTJ4cFpHVkpiazkxZENjc1hHNWNkRngwWEhSY2RIWnBaWGR6SUZ4MFhIUmNkRG9nV3lBbllXSnZkWFJXYVdWM0p5QmRMRnh1WEhSY2RGeDBYSFJjYmx4MFhIUmNkRngwZEhKaGJuTnBkR2x2Ym5NZ09pQmJYRzVjZEZ4MFhIUmNkRngwZTF4dVhIUmNkRngwWEhSY2RGeDBkSEpoYm5OcGRHbHZibFI1Y0dVZ0lEb2dKMHh2WjI5VGJHbGtaU2NzWEc1Y2RGeDBYSFJjZEZ4MFhIUjJhV1YzY3lCY2RGeDBYSFE2SUZzZ0oyeHZaMjlXYVdWM0p5d2dYVnh1WEhSY2RGeDBYSFJjZEgxY2JseDBYSFJjZEZ4MFhIUmNibHgwWEhSY2RGeDBYVnh1WEc1Y2RGeDBYSFI5TEZ4dVhHNWNkRngwWEhRblFVTlVTVTlPWDBOUFRsUkJRMVFuSURvZ2UxeHVYSFJjZEZ4MFhIUjBZWEpuWlhRZ1hIUmNkRngwT2lBblUxUkJWRVZmUTA5T1ZFRkRWQ2NzWEc1Y2RGeDBYSFJjZEhSeVlXNXphWFJwYjI1VWVYQmxYSFE2SUNkVGJHbGtaVWx1VDNWMEp5eGNibHgwWEhSY2RGeDBkbWxsZDNNZ1hIUmNkRngwT2lCYklDZGpiMjUwWVdOMFZtbGxkeWNnWFN4Y2JseHVYSFJjZEZ4MFhIUjBjbUZ1YzJsMGFXOXVjeUE2SUZ0Y2JseDBYSFJjZEZ4MFhIUjdYRzVjZEZ4MFhIUmNkRngwWEhSMGNtRnVjMmwwYVc5dVZIbHdaU0FnT2lBblRHOW5iMU5zYVdSbEp5eGNibHgwWEhSY2RGeDBYSFJjZEhacFpYZHpJRngwWEhSY2REb2dXeUFuYkc5bmIxWnBaWGNuSUYxY2JseDBYSFJjZEZ4MFhIUjlYRzVjZEZ4MFhIUmNkRjFjYmx4MFhIUmNkSDFjYmx4MFhIUjlYRzVjZEgwc1hHNWNibHgwSjFOVVFWUkZYMEZDVDFWVUp5QTZJSHRjYmx4MFhIUjJhV1YzSUZ4ME9pQW5ZV0p2ZFhSV2FXVjNKeXhjYmx4dVhIUmNkR0ZqZEdsdmJuTWdPaUI3WEc1Y2RGeDBYSFFuUVVOVVNVOU9YMGhQVFVVbklEb2dlMXh1WEhSY2RGeDBYSFIwWVhKblpYUWdYSFJjZEZ4ME9pQW5VMVJCVkVWZlNFOU5SU2NzWEc1Y2RGeDBYSFJjZEhSeVlXNXphWFJwYjI1VWVYQmxYSFE2SUNkVGJHbGtaVWx1VDNWMEp5eGNibHgwWEhSY2RGeDBkbWxsZDNNZ1hIUmNkRngwT2lCYklDZG9iMjFsVm1sbGR5Y3NJQ0FuYkc5bmIxWnBaWGNuSUYxY2JseDBYSFJjZEZ4MFhHNWNkRngwWEhSY2RDOHZJSFJ5WVc1emFYUnBiMjV6SURvZ1cxeHVYSFJjZEZ4MFhIUXZMeUJjZEh0Y2JseDBYSFJjZEZ4MEx5OGdYSFJjZEhSeVlXNXphWFJwYjI1VWVYQmxJQ0E2SUNkTWIyZHZVMnhwWkdVbkxGeHVYSFJjZEZ4MFhIUXZMeUJjZEZ4MGRtbGxkM01nWEhSY2RGeDBPaUJiSUNkc2IyZHZWbWxsZHljZ1hWeHVYSFJjZEZ4MFhIUXZMeUJjZEgxY2JseDBYSFJjZEZ4MEx5OGdYVnh1WEhSY2RGeDBmU3hjYmx4dVhIUmNkRngwSjBGRFZFbFBUbDlEVDA1VVFVTlVKeUE2SUh0Y2JseDBYSFJjZEZ4MGRHRnlaMlYwSUZ4MFhIUmNkRG9nSjFOVVFWUkZYME5QVGxSQlExUW5MRnh1WEhSY2RGeDBYSFIwY21GdWMybDBhVzl1Vkhsd1pWeDBPaUFuVTJ4cFpHVkpiazkxZENjc1hHNWNkRngwWEhSY2RDOHZJSFpwWlhkeklGeDBYSFJjZERvZ1d5QW5ZMjl1ZEdGamRGWnBaWGNuSUYxY2JseDBYSFJjZEZ4MFhHNWNkRngwWEhSY2RIUnlZVzV6YVhScGIyNXpJRG9nVzF4dVhIUmNkRngwWEhSY2RIdGNibHgwWEhSY2RGeDBYSFJjZEhSeVlXNXphWFJwYjI1VWVYQmxJQ0E2SUNkTWIyZHZVMnhwWkdVbkxGeHVYSFJjZEZ4MFhIUmNkRngwZG1sbGQzTWdYSFJjZEZ4ME9pQmJJQ2RzYjJkdlZtbGxkeWNnWFZ4dVhIUmNkRngwWEhSY2RIMWNibHgwWEhSY2RGeDBYVnh1WEhSY2RGeDBmU3hjYmx4MFhIUjlYRzVjZEgwc1hHNWNibHgwSjFOVVFWUkZYME5QVGxSQlExUW5JRG9nZTF4dVhIUmNkSFpwWlhjZ1hIUTZJQ2RqYjI1MFlXTjBWbWxsZHljc1hHNWNibHgwWEhSaFkzUnBiMjV6SURvZ2UxeHVYSFJjZEZ4MFhHNWNkRngwWEhRblFVTlVTVTlPWDBoUFRVVW5JRG9nZTF4dVhIUmNkRngwWEhSMFlYSm5aWFFnWEhSY2RGeDBPaUFuVTFSQlZFVmZTRTlOUlNjc1hHNWNkRngwWEhSY2RIUnlZVzV6YVhScGIyNVVlWEJsWEhRNklDZFRiR2xrWlVsdVQzVjBKeXhjYmx4MFhIUmNkRngwZG1sbGQzTWdYSFJjZEZ4ME9pQmJJQ2RvYjIxbFZtbGxkeWNnWFN4Y2JseHVYSFJjZEZ4MFhIUjBjbUZ1YzJsMGFXOXVjeUE2SUZ0Y2JseDBYSFJjZEZ4MFhIUjdYRzVjZEZ4MFhIUmNkRngwWEhSMGNtRnVjMmwwYVc5dVZIbHdaU0FnT2lBblRHOW5iMU5zYVdSbEp5eGNibHgwWEhSY2RGeDBYSFJjZEhacFpYZHpJRngwWEhSY2REb2dXeUFuYkc5bmIxWnBaWGNuSUYxY2JseDBYSFJjZEZ4MFhIUjlYRzVjZEZ4MFhIUmNkRjFjYmx4MFhIUmNkSDBzWEc1Y2JseDBYSFJjZENkQlExUkpUMDVmUVVKUFZWUW5JRG9nZTF4dVhIUmNkRngwWEhSMFlYSm5aWFFnWEhSY2RGeDBPaUFuVTFSQlZFVmZRVUpQVlZRbkxGeHVYSFJjZEZ4MFhIUjBjbUZ1YzJsMGFXOXVWSGx3WlZ4ME9pQW5VMnhwWkdWSmJrOTFkQ2NzWEc1Y2RGeDBYSFJjZEhacFpYZHpJRngwWEhSY2REb2dXeUFuWVdKdmRYUldhV1YzSnlCZExGeHVYSFJjZEZ4MFhIUjBjbUZ1YzJsMGFXOXVjeUE2SUZ0Y2JseDBYSFJjZEZ4MFhIUjdYRzVjZEZ4MFhIUmNkRngwWEhSMGNtRnVjMmwwYVc5dVZIbHdaU0FnT2lBblRHOW5iMU5zYVdSbEp5eGNibHgwWEhSY2RGeDBYSFJjZEhacFpYZHpJRngwWEhSY2REb2dXeUFuYkc5bmIxWnBaWGNuSUYxY2JseDBYSFJjZEZ4MFhIUjlYRzVjZEZ4MFhIUmNkRjFjYmx4MFhIUmNkSDFjYmx4MFhIUjlYRzVjYmx4MFhIUmNibHgwZlZ4dWZTSmRmUT09IiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfc3JjSW5kZXhKcyA9IHJlcXVpcmUoJy4uL3NyYy9pbmRleC5qcycpO1xuXG52YXIgX3NyY0luZGV4SnMyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfc3JjSW5kZXhKcyk7XG5cbnZhciBfZGF0YSA9IHJlcXVpcmUoJy4vZGF0YScpO1xuXG52YXIgX2RhdGEyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZGF0YSk7XG5cbi8vIGltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5cbmNvbnNvbGUubG9nKCdpbml0ICcsIHdpbmRvdy5pbm5lcldpZHRoKTtcblxuLy8gaW5pdCgpO1xuLy9cblxuLy8gZnVuY3Rpb24gaW5pdCgpXG4vLyB7XG5cbi8vIFx0dmFyIENvbW1lbnRCb3ggPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbi8vIFx0ICBjb21wb25lbnREaWRNb3VudCA6IGZ1bmN0aW9uKClcbi8vIFx0ICB7XG4vLyBcdCAgXHRjb25zb2xlLmxvZygnbW91bnRpbmcnKVxuLy8gXHQgIFx0dGhpcy5wcm9wcy5oZWxsbyA9ICd3b3JsZCc7XG4vLyBcdCAgfSxcblxuLy8gXHQgIHZpZXdSZWFkeSA6IGZ1bmN0aW9uKClcbi8vIFx0ICB7XG5cbi8vIFx0ICB9LFxuXG4vLyBcdCAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbi8vIFx0ICAgIHJldHVybiAoXG4vLyBcdCAgICAgIDxkaXYgcmVmPVwibXlJbnB1dFwiPlxuLy8gXHQgICAgICAgIEhlbGxvLCB3b3JsZCEgSSBhbSBhIGJvb20uXG4vLyBcdCAgICAgIDwvZGl2PlxuLy8gXHQgICAgKTtcbi8vIFx0ICB9XG4vLyBcdH0pO1xuXG4vLyBcdHZhciByZW5kZXJlZCA9IDxDb21tZW50Qm94IC8+O1xuXG4vLyBcdFJlYWN0LnJlbmRlcihcbi8vIFx0ICByZW5kZXJlZCxcbi8vIFx0ICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29udGVudCcpXG4vLyBcdCk7XG5cbi8vIFx0Y29uc29sZS5sb2coJ2NyZWF0ZWQgdmlldyAnLCByZW5kZXJlZCApO1xuXG4vLyB9XG5cbi8vIC8vIFJlYWN0LnJlbmRlcihcbi8vIC8vICAgPHZpZXdPbmUgLz4sXG4vLyAvLyAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb250ZW50Jylcbi8vIC8vICk7XG5cbl9zcmNJbmRleEpzMlsnZGVmYXVsdCddLmluaXQoe1xuXG5cdGRhdGE6IF9kYXRhMlsnZGVmYXVsdCddLFxuXHRkZWJ1ZzogdHJ1ZSxcblxuXHR2aWV3czoge1xuXHRcdGhvbWVWaWV3OiBnZXRWaWV3KCdob21lVmlldycpLFxuXHRcdGFib3V0VmlldzogZ2V0VmlldygnYWJvdXRWaWV3JyksXG5cdFx0Y29udGFjdFZpZXc6IGdldFZpZXcoJ2NvbnRhY3RWaWV3JyksXG5cdFx0bG9nb1ZpZXc6IGdldFZpZXcoJ2xvZ29WaWV3Jylcblx0fSxcblxuXHR0cmFuc2l0aW9uczoge1xuXHRcdFNsaWRlSW5Jbml0aWFsOiBnZXRUcmFuc2l0aW9uKCdTbGlkZUluSW5pdGlhbCcsIDIwMDApLFxuXHRcdFNsaWRlSW5PdXQ6IGdldFRyYW5zaXRpb24oJ1NsaWRlSW5PdXQnLCAyMDAwKSxcblx0XHRMb2dvU2xpZGU6IGdldFRyYW5zaXRpb24oJ0xvZ29TbGlkZScsIDIwMDApXG5cdH0gfSk7XG5cbl9zcmNJbmRleEpzMlsnZGVmYXVsdCddLnN0YXJ0KCk7XG5cbl9zcmNJbmRleEpzMlsnZGVmYXVsdCddLmFjdGlvbignQUNUSU9OX0lOSVRfQUJPVVQnKTtcbl9zcmNJbmRleEpzMlsnZGVmYXVsdCddLmFjdGlvbignQUNUSU9OX0hPTUUnKTtcbi8vIC8vIG1haW4uYWN0aW9uKCdBQ1RJT05fQUJPVVQnKTtcbi8vIC8vIG1haW4uYWN0aW9uKCdBQ1RJT05fSE9NRScpO1xuLy8gLy8gbWFpbi5hY3Rpb24oJ0FDVElPTl9DT05UQUNUJyk7XG4vLyAvLyBtYWluLmFjdGlvbignQUNUSU9OX0hPTUUnKTtcblxuZnVuY3Rpb24gZ2V0VmlldyhuYW1lLCBkZWxheSkge1xuXHRyZXR1cm4ge1xuXHRcdGlkOiBuYW1lLFxuXG5cdFx0dmlld1JlYWR5OiBmdW5jdGlvbiB2aWV3UmVhZHkocHJvbWlzZSkge1xuXG5cdFx0XHQvLyBwcm9taXNlLnJlc29sdmUoJ25vdCByZWFkeSB5ZXQnKTtcblxuXHRcdFx0c2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHByb21pc2UucmVzb2x2ZSgpO1xuXHRcdFx0fSwgZGVsYXkgfHwgMCk7XG5cdFx0XHQvLyBjb25zb2xlLmxvZygnY2VoY2tpbmcgcmVhZHkgOjogJywgcHJvbWlzZSApO1xuXHRcdH1cblx0fTtcbn1cblxuZnVuY3Rpb24gZ2V0VHJhbnNpdGlvbihuYW1lLCBkZWxheSkge1xuXHRyZXR1cm4ge1xuXHRcdGluaXRpYWxpemU6IGZ1bmN0aW9uIGluaXRpYWxpemUodmlld3MsIGRhdGEsIGRlZmVycmVkKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnVHJhbnNpdGlvbiAnLCB2aWV3cyk7XG5cblx0XHRcdC8vIGRlZmVycmVkLnJlc29sdmUoKVxuXHRcdFx0c2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdGRlZmVycmVkLnJlc29sdmUoKTtcblx0XHRcdH0sIGRlbGF5IHx8IDApO1xuXHRcdH0sXG5cdFx0YW5pbWF0ZTogZnVuY3Rpb24gYW5pbWF0ZSgpIHt9XG5cdH07XG59XG5cbi8vIHRjIDoge1xuLy8gXHRkZWJ1ZyA6IHRydWVcbi8vIH0sXG4vLyBmc20gOiB7XG4vLyBcdGRlYnVnIDogdHJ1ZVxuLy8gfVxuXG4vLyBjb25zb2xlLmxvZygnc3RhcnRlZCBhbmltYXRpbmcgJyApO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYklpOVZjMlZ5Y3k5MFlXeDNiMjlzWmk5a1pYWmxiRzl3WlhJdmQyVmlVbTl2ZEM5MGNtRnVjMmwwYVc5dUxXMWhibUZuWlhJdmRHVnpkQzkwWlhOMExtcHpJbDBzSW01aGJXVnpJanBiWFN3aWJXRndjR2x1WjNNaU9pSTdPenM3TUVKQlFXbENMR2xDUVVGcFFqczdPenR2UWtGRGFFSXNVVUZCVVRzN096czdPMEZCU3pGQ0xFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNUMEZCVHl4RlFVRkZMRTFCUVUwc1EwRkJReXhWUVVGVkxFTkJRVVVzUTBGQlF6czdPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN096dEJRV2xFZWtNc2QwSkJRVXNzU1VGQlNTeERRVUZET3p0QlFVVlVMRXRCUVVrc2JVSkJRVTg3UVVGRFdDeE5RVUZMTEVWQlFVY3NTVUZCU1RzN1FVRkZXaXhOUVVGTExFVkJRVWM3UVVGRFVDeFZRVUZSTEVWQlFVY3NUMEZCVHl4RFFVRkZMRlZCUVZVc1EwRkJSVHRCUVVOb1F5eFhRVUZUTEVWQlFVY3NUMEZCVHl4RFFVRkZMRmRCUVZjc1EwRkJSVHRCUVVOc1F5eGhRVUZYTEVWQlFVY3NUMEZCVHl4RFFVRkZMR0ZCUVdFc1EwRkJSVHRCUVVOMFF5eFZRVUZSTEVWQlFVY3NUMEZCVHl4RFFVRkZMRlZCUVZVc1EwRkJSVHRGUVVOb1F6czdRVUZGUkN4WlFVRlhMRVZCUVVjN1FVRkRZaXhuUWtGQll5eEZRVUZITEdGQlFXRXNRMEZCUXl4blFrRkJaMElzUlVGQlJTeEpRVUZKTEVOQlFVVTdRVUZEZGtRc1dVRkJWU3hGUVVGSExHRkJRV0VzUTBGQlF5eFpRVUZaTEVWQlFVVXNTVUZCU1N4RFFVRkRPMEZCUXpsRExGZEJRVk1zUlVGQlJ5eGhRVUZoTEVOQlFVTXNWMEZCVnl4RlFVRkZMRWxCUVVrc1EwRkJRenRGUVVNMVF5eEZRVkZFTEVOQlFVTXNRMEZCUVRzN1FVRkZSaXgzUWtGQlN5eExRVUZMTEVWQlFVVXNRMEZCUXpzN1FVRkZZaXgzUWtGQlN5eE5RVUZOTEVOQlFVTXNiVUpCUVcxQ0xFTkJRVU1zUTBGQlF6dEJRVU5xUXl4M1FrRkJTeXhOUVVGTkxFTkJRVU1zWVVGQllTeERRVUZETEVOQlFVTTdPenM3T3p0QlFVOHpRaXhUUVVGVExFOUJRVThzUTBGQlJTeEpRVUZKTEVWQlFVVXNTMEZCU3l4RlFVRkhPMEZCUXk5Q0xGRkJRVTg3UVVGRFRpeEpRVUZGTEVWQlFVY3NTVUZCU1RzN1FVRkZWQ3hYUVVGVExFVkJRVUVzYlVKQlFVVXNUMEZCVHl4RlFVRkhPenM3TzBGQlNYQkNMR0ZCUVZVc1EwRkJSU3haUVVGTE8wRkJRVVVzVjBGQlR5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkJPMGxCUVVVc1JVRkJSeXhMUVVGTExFbEJRVWtzUTBGQlF5eERRVUZGTEVOQlFVTTdPMGRCUlhSRU8wVkJRMFFzUTBGQlFUdERRVU5FT3p0QlFVVkVMRk5CUVZNc1lVRkJZU3hEUVVGRkxFbEJRVWtzUlVGQlJTeExRVUZMTEVWQlEyNURPMEZCUTBNc1VVRkJUenRCUVVOT0xGbEJRVlVzUlVGQlFTeHZRa0ZCUlN4TFFVRkxMRVZCUVVVc1NVRkJTU3hGUVVGRkxGRkJRVkVzUlVGQlJ6dEJRVU51UXl4VlFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExHRkJRV0VzUlVGQlJTeExRVUZMTEVOQlFVVXNRMEZCUXpzN08wRkJTMjVETEdGQlFWVXNRMEZCUlN4WlFVRkxPMEZCUVVVc1dVRkJVU3hEUVVGRExFOUJRVThzUlVGQlJTeERRVUZCTzBsQlFVVXNSVUZCUnl4TFFVRkxMRWxCUVVrc1EwRkJReXhEUVVGRkxFTkJRVU03UjBGRGRrUTdRVUZEUkN4VFFVRlBMRVZCUVVFc2JVSkJRMUFzUlVGRlF6dEZRVU5FTEVOQlFVRTdRMEZEUkNJc0ltWnBiR1VpT2lJdlZYTmxjbk12ZEdGc2QyOXZiR1l2WkdWMlpXeHZjR1Z5TDNkbFlsSnZiM1F2ZEhKaGJuTnBkR2x2YmkxdFlXNWhaMlZ5TDNSbGMzUXZkR1Z6ZEM1cWN5SXNJbk52ZFhKalpYTkRiMjUwWlc1MElqcGJJbWx0Y0c5eWRDQnRZV2x1SUdaeWIyMGdKeTR1TDNOeVl5OXBibVJsZUM1cWN5YzdYRzVwYlhCdmNuUWdaR0YwWVNBZ1puSnZiU0FuTGk5a1lYUmhKenRjYmk4dklHbHRjRzl5ZENCU1pXRmpkQ0JtY205dElDZHlaV0ZqZENjN1hHNWNibHh1WEc1amIyNXpiMnhsTG14dlp5Z25hVzVwZENBbkxDQjNhVzVrYjNjdWFXNXVaWEpYYVdSMGFDQXBPMXh1WEc0dkx5QnBibWwwS0NrN1hHNHZMeUJjYmx4dUx5OGdablZ1WTNScGIyNGdhVzVwZENncFhHNHZMeUI3WEc1Y2JpOHZJRngwZG1GeUlFTnZiVzFsYm5SQ2IzZ2dQU0JTWldGamRDNWpjbVZoZEdWRGJHRnpjeWg3WEc1Y2JpOHZJRngwSUNCamIyMXdiMjVsYm5SRWFXUk5iM1Z1ZENBNklHWjFibU4wYVc5dUtDbGNiaTh2SUZ4MElDQjdYRzR2THlCY2RDQWdYSFJqYjI1emIyeGxMbXh2WnlnbmJXOTFiblJwYm1jbktWeHVMeThnWEhRZ0lGeDBkR2hwY3k1d2NtOXdjeTVvWld4c2J5QTlJQ2QzYjNKc1pDYzdYRzR2THlCY2RDQWdmU3hjYmx4dUx5OGdYSFFnSUhacFpYZFNaV0ZrZVNBNklHWjFibU4wYVc5dUtDbGNiaTh2SUZ4MElDQjdYRzVjYmk4dklGeDBJQ0I5TEZ4dVhHNHZMeUJjZENBZ2NtVnVaR1Z5T2lCbWRXNWpkR2x2YmlncElIdGNiaTh2SUZ4MElDQWdJSEpsZEhWeWJpQW9YRzR2THlCY2RDQWdJQ0FnSUR4a2FYWWdjbVZtUFZ3aWJYbEpibkIxZEZ3aVBseHVMeThnWEhRZ0lDQWdJQ0FnSUVobGJHeHZMQ0IzYjNKc1pDRWdTU0JoYlNCaElHSnZiMjB1WEc0dkx5QmNkQ0FnSUNBZ0lEd3ZaR2wyUGx4dUx5OGdYSFFnSUNBZ0tUdGNiaTh2SUZ4MElDQjlYRzR2THlCY2RIMHBPMXh1WEc1Y2JpOHZJRngwZG1GeUlISmxibVJsY21Wa0lEMGdQRU52YlcxbGJuUkNiM2dnTHo0N1hHNWNiaTh2SUZ4MFVtVmhZM1F1Y21WdVpHVnlLRnh1THk4Z1hIUWdJSEpsYm1SbGNtVmtMRnh1THk4Z1hIUWdJR1J2WTNWdFpXNTBMbWRsZEVWc1pXMWxiblJDZVVsa0tDZGpiMjUwWlc1MEp5bGNiaTh2SUZ4MEtUdGNibHh1THk4Z1hIUmpiMjV6YjJ4bExteHZaeWduWTNKbFlYUmxaQ0IyYVdWM0lDY3NJSEpsYm1SbGNtVmtJQ2s3WEc1Y2RGeHVYRzR2THlCOVhHNWNiaTh2SUM4dklGSmxZV04wTG5KbGJtUmxjaWhjYmk4dklDOHZJQ0FnUEhacFpYZFBibVVnTHo0c1hHNHZMeUF2THlBZ0lHUnZZM1Z0Wlc1MExtZGxkRVZzWlcxbGJuUkNlVWxrS0NkamIyNTBaVzUwSnlsY2JpOHZJQzh2SUNrN1hHNWNibHh1YldGcGJpNXBibWwwS0h0Y2JseDBYRzVjZEdSaGRHRWdPaUJrWVhSaExGeHVYSFJrWldKMVp5QTZJSFJ5ZFdVc1hHNWNibHgwZG1sbGQzTWdPaUI3WEc1Y2RGeDBhRzl0WlZacFpYY2dPaUJuWlhSV2FXVjNLQ0FuYUc5dFpWWnBaWGNuSUNrc1hHNWNkRngwWVdKdmRYUldhV1YzSURvZ1oyVjBWbWxsZHlnZ0oyRmliM1YwVm1sbGR5Y2dLU3hjYmx4MFhIUmpiMjUwWVdOMFZtbGxkeUE2SUdkbGRGWnBaWGNvSUNkamIyNTBZV04wVm1sbGR5Y2dLU3hjYmx4MFhIUnNiMmR2Vm1sbGR5QTZJR2RsZEZacFpYY29JQ2RzYjJkdlZtbGxkeWNnS1Z4dVhIUjlMRnh1WEc1Y2RIUnlZVzV6YVhScGIyNXpJRG9nZTF4dVhIUmNkRk5zYVdSbFNXNUpibWwwYVdGc0lEb2daMlYwVkhKaGJuTnBkR2x2YmlnblUyeHBaR1ZKYmtsdWFYUnBZV3duTENBeU1EQXdJQ2tzWEc1Y2RGeDBVMnhwWkdWSmJrOTFkQ0E2SUdkbGRGUnlZVzV6YVhScGIyNG9KMU5zYVdSbFNXNVBkWFFuTENBeU1EQXdLU3hjYmx4MFhIUk1iMmR2VTJ4cFpHVWdPaUJuWlhSVWNtRnVjMmwwYVc5dUtDZE1iMmR2VTJ4cFpHVW5MQ0F5TURBd0tWeHVYSFI5TEZ4dVhIUXZMeUIwWXlBNklIdGNibHgwTHk4Z1hIUmtaV0oxWnlBNklIUnlkV1ZjYmx4MEx5OGdmU3hjYmx4MEx5OGdabk50SURvZ2UxeHVYSFF2THlCY2RHUmxZblZuSURvZ2RISjFaVnh1WEhRdkx5QjlYRzVjZEZ4dWZTbGNibHh1YldGcGJpNXpkR0Z5ZENncE8xeHVYRzV0WVdsdUxtRmpkR2x2YmlnblFVTlVTVTlPWDBsT1NWUmZRVUpQVlZRbktUdGNibTFoYVc0dVlXTjBhVzl1S0NkQlExUkpUMDVmU0U5TlJTY3BPMXh1THk4Z0x5OGdiV0ZwYmk1aFkzUnBiMjRvSjBGRFZFbFBUbDlCUWs5VlZDY3BPMXh1THk4Z0x5OGdiV0ZwYmk1aFkzUnBiMjRvSjBGRFZFbFBUbDlJVDAxRkp5azdYRzR2THlBdkx5QnRZV2x1TG1GamRHbHZiaWduUVVOVVNVOU9YME5QVGxSQlExUW5LVHRjYmk4dklDOHZJRzFoYVc0dVlXTjBhVzl1S0NkQlExUkpUMDVmU0U5TlJTY3BPMXh1WEc1Y2JtWjFibU4wYVc5dUlHZGxkRlpwWlhjb0lHNWhiV1VzSUdSbGJHRjVJQ2tnZTF4dVhIUnlaWFIxY200Z2UxeHVYSFJjZEdsa0lEb2dibUZ0WlN4Y2JseHVYSFJjZEhacFpYZFNaV0ZrZVNnZ2NISnZiV2x6WlNBcElIdGNibHgwWEhSY2RGeHVYSFJjZEZ4MEx5OGdjSEp2YldselpTNXlaWE52YkhabEtDZHViM1FnY21WaFpIa2dlV1YwSnlrN1hHNWNibHgwWEhSY2RITmxkRlJwYldWdmRYUW9JQ2dwUFQ0Z2V5QndjbTl0YVhObExuSmxjMjlzZG1Vb0tTQjlJQ3dnWkdWc1lYa2dmSHdnTUNBcE8xeHVYSFJjZEZ4MEx5OGdZMjl1YzI5c1pTNXNiMmNvSjJObGFHTnJhVzVuSUhKbFlXUjVJRG82SUNjc0lIQnliMjFwYzJVZ0tUdGNibHgwWEhSOVhHNWNkSDFjYm4xY2JseHVablZ1WTNScGIyNGdaMlYwVkhKaGJuTnBkR2x2YmlnZ2JtRnRaU3dnWkdWc1lYa2dLVnh1ZTF4dVhIUnlaWFIxY200Z2UxeHVYSFJjZEdsdWFYUnBZV3hwZW1Vb0lIWnBaWGR6TENCa1lYUmhMQ0JrWldabGNuSmxaQ0FwSUh0Y2JseDBYSFJjZEdOdmJuTnZiR1V1Ykc5bktDZFVjbUZ1YzJsMGFXOXVJQ2NzSUhacFpYZHpJQ2s3WEc1Y2JseHVYRzVjZEZ4MFhIUXZMeUJrWldabGNuSmxaQzV5WlhOdmJIWmxLQ2xjYmx4MFhIUmNkSE5sZEZScGJXVnZkWFFvSUNncFBUNGdleUJrWldabGNuSmxaQzV5WlhOdmJIWmxLQ2tnZlNBc0lHUmxiR0Y1SUh4OElEQWdLVHRjYmx4MFhIUjlMRnh1WEhSY2RHRnVhVzFoZEdVb0tWeHVYSFJjZEh0Y2JseDBYSFJjZEM4dklHTnZibk52YkdVdWJHOW5LQ2R6ZEdGeWRHVmtJR0Z1YVcxaGRHbHVaeUFuSUNrN1hHNWNkRngwZlZ4dVhIUjlYRzU5WEc1Y2JseHVYRzRpWFgwPSJdfQ==
