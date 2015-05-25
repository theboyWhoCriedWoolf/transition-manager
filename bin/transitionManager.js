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

},{"signals":3}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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
		}
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

},{"es6-promise":2}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utilsMixin = require('../utils/mixin');

var _utilsMixin2 = _interopRequireDefault(_utilsMixin);

var _commonLogger = require('../common/logger');

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

},{"../common/logger":5,"../utils/mixin":17}],8:[function(require,module,exports){
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

},{"../common/dispatcher":4,"../common/logger.js":5,"../utils/default":13,"../utils/mixin":17}],9:[function(require,module,exports){
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
			transitionModule.animate(views, transitionObj.data, deferred, currentViewRef, nextViewRef);

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

},{"../common/dispatcher":4,"../common/logger.js":5,"../common/promiseFacade":6,"../utils/default":13,"../utils/mixin":17}],10:[function(require,module,exports){
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

},{"../common/logger.js":5,"../common/promiseFacade":6,"../utils/default":13,"../utils/mixin":17}],11:[function(require,module,exports){
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

/* import signals */

var _commonDispatcher = require('./common/dispatcher');

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
			return _commonDispatcher.stateChanged;
		} });
	Object.defineProperty(TransitionManager, 'onTransitionStarted', { get: function get() {
			return _commonDispatcher.transitionStarted;
		} });
	Object.defineProperty(TransitionManager, 'onAllTransitionStarted', { get: function get() {
			return transitionsStarted;
		} });
	Object.defineProperty(TransitionManager, 'onAllTransitionCompleted', { get: function get() {
			return _commonDispatcher.allTransitionCompleted;
		} });
	Object.defineProperty(TransitionManager, 'onTransitionComplete', { get: function get() {
			return _commonDispatcher.transitionComplete;
		} });
})();

exports['default'] = TransitionManager;
module.exports = exports['default'];

},{"./common/dispatcher":4,"./common/logger":5,"./core/defaultViewManager":7,"./core/fsm":8,"./core/transitionController":9,"./core/transitionViewManager":10,"./parsers/dataParser":12,"./utils/mixin":17,"./utils/pick":18}],12:[function(require,module,exports){
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
			throw new Error('*Data Object is undefined!');
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

},{"../utils/forIn":14,"../utils/unique":20}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
/*jshint -W084 */
/*jshint unused:false*/

var _hasDontEnumBug, _dontEnums;

function checkDontEnum() {
    _dontEnums = ['toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'constructor'];

    _hasDontEnumBug = true;

    for (var key in { 'toString': null }) {
        _hasDontEnumBug = false;
    }
}

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
        }
    }
}

function exec(fn, obj, key, thisObj) {
    return fn.call(thisObj, obj[key], key, obj);
}

exports['default'] = forIn;
module.exports = exports['default'];

},{}],15:[function(require,module,exports){
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

},{"./forIn":14,"./hasOwn":16}],16:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*jshint unused:false*/

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

},{"./forOwn":15}],18:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
/*jshint -W084 */
/*jshint unused:false*/

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

},{"./slice":19}],19:[function(require,module,exports){
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

},{}],20:[function(require,module,exports){
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

},{}]},{},[11])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2VzNi1wcm9taXNlL2Rpc3QvZXM2LXByb21pc2UuanMiLCJub2RlX21vZHVsZXMvc2lnbmFscy9kaXN0L3NpZ25hbHMuanMiLCIvVXNlcnMvdGFsd29vbGYvZGV2ZWxvcGVyL3dlYlJvb3QvdHJhbnNpdGlvbi1tYW5hZ2VyL3NyYy9jb21tb24vZGlzcGF0Y2hlci5qcyIsIi9Vc2Vycy90YWx3b29sZi9kZXZlbG9wZXIvd2ViUm9vdC90cmFuc2l0aW9uLW1hbmFnZXIvc3JjL2NvbW1vbi9sb2dnZXIuanMiLCIvVXNlcnMvdGFsd29vbGYvZGV2ZWxvcGVyL3dlYlJvb3QvdHJhbnNpdGlvbi1tYW5hZ2VyL3NyYy9jb21tb24vcHJvbWlzZUZhY2FkZS5qcyIsIi9Vc2Vycy90YWx3b29sZi9kZXZlbG9wZXIvd2ViUm9vdC90cmFuc2l0aW9uLW1hbmFnZXIvc3JjL2NvcmUvZGVmYXVsdFZpZXdNYW5hZ2VyLmpzIiwiL1VzZXJzL3RhbHdvb2xmL2RldmVsb3Blci93ZWJSb290L3RyYW5zaXRpb24tbWFuYWdlci9zcmMvY29yZS9mc20uanMiLCIvVXNlcnMvdGFsd29vbGYvZGV2ZWxvcGVyL3dlYlJvb3QvdHJhbnNpdGlvbi1tYW5hZ2VyL3NyYy9jb3JlL3RyYW5zaXRpb25Db250cm9sbGVyLmpzIiwiL1VzZXJzL3RhbHdvb2xmL2RldmVsb3Blci93ZWJSb290L3RyYW5zaXRpb24tbWFuYWdlci9zcmMvY29yZS90cmFuc2l0aW9uVmlld01hbmFnZXIuanMiLCIvVXNlcnMvdGFsd29vbGYvZGV2ZWxvcGVyL3dlYlJvb3QvdHJhbnNpdGlvbi1tYW5hZ2VyL3NyYy9pbmRleC5qcyIsIi9Vc2Vycy90YWx3b29sZi9kZXZlbG9wZXIvd2ViUm9vdC90cmFuc2l0aW9uLW1hbmFnZXIvc3JjL3BhcnNlcnMvZGF0YVBhcnNlci5qcyIsIi9Vc2Vycy90YWx3b29sZi9kZXZlbG9wZXIvd2ViUm9vdC90cmFuc2l0aW9uLW1hbmFnZXIvc3JjL3V0aWxzL2RlZmF1bHQuanMiLCIvVXNlcnMvdGFsd29vbGYvZGV2ZWxvcGVyL3dlYlJvb3QvdHJhbnNpdGlvbi1tYW5hZ2VyL3NyYy91dGlscy9mb3JJbi5qcyIsIi9Vc2Vycy90YWx3b29sZi9kZXZlbG9wZXIvd2ViUm9vdC90cmFuc2l0aW9uLW1hbmFnZXIvc3JjL3V0aWxzL2Zvck93bi5qcyIsIi9Vc2Vycy90YWx3b29sZi9kZXZlbG9wZXIvd2ViUm9vdC90cmFuc2l0aW9uLW1hbmFnZXIvc3JjL3V0aWxzL2hhc093bi5qcyIsIi9Vc2Vycy90YWx3b29sZi9kZXZlbG9wZXIvd2ViUm9vdC90cmFuc2l0aW9uLW1hbmFnZXIvc3JjL3V0aWxzL21peGluLmpzIiwiL1VzZXJzL3RhbHdvb2xmL2RldmVsb3Blci93ZWJSb290L3RyYW5zaXRpb24tbWFuYWdlci9zcmMvdXRpbHMvcGljay5qcyIsIi9Vc2Vycy90YWx3b29sZi9kZXZlbG9wZXIvd2ViUm9vdC90cmFuc2l0aW9uLW1hbmFnZXIvc3JjL3V0aWxzL3NsaWNlLmpzIiwiL1VzZXJzL3RhbHdvb2xmL2RldmVsb3Blci93ZWJSb290L3RyYW5zaXRpb24tbWFuYWdlci9zcmMvdXRpbHMvdW5pcXVlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzc3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QUFNLEdBQUcsRUFBRSxDQUFDO0FBQ2hCLFdBQU8sS0FBSyxHQUFHLEdBQUcsRUFBRTtBQUNoQixjQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDN0I7O0FBRUQsV0FBTyxNQUFNLENBQUM7Q0FDakI7O3FCQUVVLEtBQUs7Ozs7Ozs7OztBQzlCcEIsWUFBWSxDQUFDOzs7Ozs7OztBQVNiLFNBQVMsTUFBTSxDQUFFLE1BQU0sRUFBRSxNQUFNLEVBQy9CO0FBQ0MsT0FBTSxHQUFHLE1BQU0sSUFBSSxFQUFFLENBQUM7QUFDdEIsS0FBSSxRQUFRLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBRSxNQUFNLENBQUUsQ0FBQztBQUN0QyxPQUFNLEdBQUssRUFBRSxDQUFDOztBQUVmLEtBQUksR0FBRyxHQUFHLFFBQVEsQ0FBQyxNQUFNO0tBQ3hCLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDTixNQUFNLENBQUM7O0FBRVAsUUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUU7QUFDaEIsUUFBTSxHQUFHLFFBQVEsQ0FBRSxDQUFDLENBQUUsQ0FBQztBQUN2QixNQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUUsTUFBTSxDQUFFLEtBQUssQ0FBQyxDQUFDLElBQUksTUFBTSxLQUFLLEVBQUUsR0FBRyxNQUFNLE1BQU8sSUFBSSxJQUFJLFNBQVMsQ0FBQSxBQUFDLEVBQUc7QUFDeEYsU0FBTSxDQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUUsR0FBRyxNQUFNLENBQUM7R0FDakM7RUFDRDtBQUNELFFBQU8sTUFBTSxDQUFDO0NBQ2Y7O3FCQUVjLE1BQU0iLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKCFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIi8qIVxuICogQG92ZXJ2aWV3IGVzNi1wcm9taXNlIC0gYSB0aW55IGltcGxlbWVudGF0aW9uIG9mIFByb21pc2VzL0ErLlxuICogQGNvcHlyaWdodCBDb3B5cmlnaHQgKGMpIDIwMTQgWWVodWRhIEthdHosIFRvbSBEYWxlLCBTdGVmYW4gUGVubmVyIGFuZCBjb250cmlidXRvcnMgKENvbnZlcnNpb24gdG8gRVM2IEFQSSBieSBKYWtlIEFyY2hpYmFsZClcbiAqIEBsaWNlbnNlICAgTGljZW5zZWQgdW5kZXIgTUlUIGxpY2Vuc2VcbiAqICAgICAgICAgICAgU2VlIGh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9qYWtlYXJjaGliYWxkL2VzNi1wcm9taXNlL21hc3Rlci9MSUNFTlNFXG4gKiBAdmVyc2lvbiAgIDIuMS4xXG4gKi9cblxuKGZ1bmN0aW9uKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSR1dGlscyQkb2JqZWN0T3JGdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gdHlwZW9mIHggPT09ICdmdW5jdGlvbicgfHwgKHR5cGVvZiB4ID09PSAnb2JqZWN0JyAmJiB4ICE9PSBudWxsKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzRnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuIHR5cGVvZiB4ID09PSAnZnVuY3Rpb24nO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNNYXliZVRoZW5hYmxlKHgpIHtcbiAgICAgIHJldHVybiB0eXBlb2YgeCA9PT0gJ29iamVjdCcgJiYgeCAhPT0gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHV0aWxzJCRfaXNBcnJheTtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkpIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSR1dGlscyQkX2lzQXJyYXkgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHgpID09PSAnW29iamVjdCBBcnJheV0nO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGliJGVzNiRwcm9taXNlJHV0aWxzJCRfaXNBcnJheSA9IEFycmF5LmlzQXJyYXk7XG4gICAgfVxuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNBcnJheSA9IGxpYiRlczYkcHJvbWlzZSR1dGlscyQkX2lzQXJyYXk7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRsZW4gPSAwO1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkdG9TdHJpbmcgPSB7fS50b1N0cmluZztcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJHZlcnR4TmV4dDtcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXNhcChjYWxsYmFjaywgYXJnKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWVbbGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbl0gPSBjYWxsYmFjaztcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRxdWV1ZVtsaWIkZXM2JHByb21pc2UkYXNhcCQkbGVuICsgMV0gPSBhcmc7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkbGVuICs9IDI7XG4gICAgICBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbiA9PT0gMikge1xuICAgICAgICAvLyBJZiBsZW4gaXMgMiwgdGhhdCBtZWFucyB0aGF0IHdlIG5lZWQgdG8gc2NoZWR1bGUgYW4gYXN5bmMgZmx1c2guXG4gICAgICAgIC8vIElmIGFkZGl0aW9uYWwgY2FsbGJhY2tzIGFyZSBxdWV1ZWQgYmVmb3JlIHRoZSBxdWV1ZSBpcyBmbHVzaGVkLCB0aGV5XG4gICAgICAgIC8vIHdpbGwgYmUgcHJvY2Vzc2VkIGJ5IHRoaXMgZmx1c2ggdGhhdCB3ZSBhcmUgc2NoZWR1bGluZy5cbiAgICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2goKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXNhcDtcblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkYnJvd3NlcldpbmRvdyA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykgPyB3aW5kb3cgOiB1bmRlZmluZWQ7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRicm93c2VyR2xvYmFsID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJGJyb3dzZXJXaW5kb3cgfHwge307XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRCcm93c2VyTXV0YXRpb25PYnNlcnZlciA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRicm93c2VyR2xvYmFsLk11dGF0aW9uT2JzZXJ2ZXIgfHwgbGliJGVzNiRwcm9taXNlJGFzYXAkJGJyb3dzZXJHbG9iYWwuV2ViS2l0TXV0YXRpb25PYnNlcnZlcjtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJGlzTm9kZSA9IHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiB7fS50b1N0cmluZy5jYWxsKHByb2Nlc3MpID09PSAnW29iamVjdCBwcm9jZXNzXSc7XG5cbiAgICAvLyB0ZXN0IGZvciB3ZWIgd29ya2VyIGJ1dCBub3QgaW4gSUUxMFxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkaXNXb3JrZXIgPSB0eXBlb2YgVWludDhDbGFtcGVkQXJyYXkgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICB0eXBlb2YgaW1wb3J0U2NyaXB0cyAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgIHR5cGVvZiBNZXNzYWdlQ2hhbm5lbCAhPT0gJ3VuZGVmaW5lZCc7XG5cbiAgICAvLyBub2RlXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZU5leHRUaWNrKCkge1xuICAgICAgdmFyIG5leHRUaWNrID0gcHJvY2Vzcy5uZXh0VGljaztcbiAgICAgIC8vIG5vZGUgdmVyc2lvbiAwLjEwLnggZGlzcGxheXMgYSBkZXByZWNhdGlvbiB3YXJuaW5nIHdoZW4gbmV4dFRpY2sgaXMgdXNlZCByZWN1cnNpdmVseVxuICAgICAgLy8gc2V0SW1tZWRpYXRlIHNob3VsZCBiZSB1c2VkIGluc3RlYWQgaW5zdGVhZFxuICAgICAgdmFyIHZlcnNpb24gPSBwcm9jZXNzLnZlcnNpb25zLm5vZGUubWF0Y2goL14oPzooXFxkKylcXC4pPyg/OihcXGQrKVxcLik/KFxcKnxcXGQrKSQvKTtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHZlcnNpb24pICYmIHZlcnNpb25bMV0gPT09ICcwJyAmJiB2ZXJzaW9uWzJdID09PSAnMTAnKSB7XG4gICAgICAgIG5leHRUaWNrID0gc2V0SW1tZWRpYXRlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBuZXh0VGljayhsaWIkZXM2JHByb21pc2UkYXNhcCQkZmx1c2gpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyB2ZXJ0eFxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VWZXJ0eFRpbWVyKCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkdmVydHhOZXh0KGxpYiRlczYkcHJvbWlzZSRhc2FwJCRmbHVzaCk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VNdXRhdGlvbk9ic2VydmVyKCkge1xuICAgICAgdmFyIGl0ZXJhdGlvbnMgPSAwO1xuICAgICAgdmFyIG9ic2VydmVyID0gbmV3IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRCcm93c2VyTXV0YXRpb25PYnNlcnZlcihsaWIkZXM2JHByb21pc2UkYXNhcCQkZmx1c2gpO1xuICAgICAgdmFyIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnJyk7XG4gICAgICBvYnNlcnZlci5vYnNlcnZlKG5vZGUsIHsgY2hhcmFjdGVyRGF0YTogdHJ1ZSB9KTtcblxuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBub2RlLmRhdGEgPSAoaXRlcmF0aW9ucyA9ICsraXRlcmF0aW9ucyAlIDIpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyB3ZWIgd29ya2VyXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZU1lc3NhZ2VDaGFubmVsKCkge1xuICAgICAgdmFyIGNoYW5uZWwgPSBuZXcgTWVzc2FnZUNoYW5uZWwoKTtcbiAgICAgIGNoYW5uZWwucG9ydDEub25tZXNzYWdlID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJGZsdXNoO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY2hhbm5lbC5wb3J0Mi5wb3N0TWVzc2FnZSgwKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVNldFRpbWVvdXQoKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHNldFRpbWVvdXQobGliJGVzNiRwcm9taXNlJGFzYXAkJGZsdXNoLCAxKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRxdWV1ZSA9IG5ldyBBcnJheSgxMDAwKTtcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkZmx1c2goKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRsZW47IGkrPTIpIHtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJHF1ZXVlW2ldO1xuICAgICAgICB2YXIgYXJnID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJHF1ZXVlW2krMV07XG5cbiAgICAgICAgY2FsbGJhY2soYXJnKTtcblxuICAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWVbaV0gPSB1bmRlZmluZWQ7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRxdWV1ZVtpKzFdID0gdW5kZWZpbmVkO1xuICAgICAgfVxuXG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkbGVuID0gMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXR0ZW1wdFZlcnRleCgpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHZhciByID0gcmVxdWlyZTtcbiAgICAgICAgdmFyIHZlcnR4ID0gcigndmVydHgnKTtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHZlcnR4TmV4dCA9IHZlcnR4LnJ1bk9uTG9vcCB8fCB2ZXJ0eC5ydW5PbkNvbnRleHQ7XG4gICAgICAgIHJldHVybiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlVmVydHhUaW1lcigpO1xuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIHJldHVybiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlU2V0VGltZW91dCgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2NoZWR1bGVGbHVzaDtcbiAgICAvLyBEZWNpZGUgd2hhdCBhc3luYyBtZXRob2QgdG8gdXNlIHRvIHRyaWdnZXJpbmcgcHJvY2Vzc2luZyBvZiBxdWV1ZWQgY2FsbGJhY2tzOlxuICAgIGlmIChsaWIkZXM2JHByb21pc2UkYXNhcCQkaXNOb2RlKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2NoZWR1bGVGbHVzaCA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VOZXh0VGljaygpO1xuICAgIH0gZWxzZSBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2NoZWR1bGVGbHVzaCA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VNdXRhdGlvbk9ic2VydmVyKCk7XG4gICAgfSBlbHNlIGlmIChsaWIkZXM2JHByb21pc2UkYXNhcCQkaXNXb3JrZXIpIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRzY2hlZHVsZUZsdXNoID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZU1lc3NhZ2VDaGFubmVsKCk7XG4gICAgfSBlbHNlIGlmIChsaWIkZXM2JHByb21pc2UkYXNhcCQkYnJvd3NlcldpbmRvdyA9PT0gdW5kZWZpbmVkICYmIHR5cGVvZiByZXF1aXJlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2NoZWR1bGVGbHVzaCA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhdHRlbXB0VmVydGV4KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRzY2hlZHVsZUZsdXNoID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVNldFRpbWVvdXQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKCkge31cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HICAgPSB2b2lkIDA7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRCA9IDE7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVEICA9IDI7XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkR0VUX1RIRU5fRVJST1IgPSBuZXcgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRXJyb3JPYmplY3QoKTtcblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHNlbGZGdWxsZmlsbG1lbnQoKSB7XG4gICAgICByZXR1cm4gbmV3IFR5cGVFcnJvcihcIllvdSBjYW5ub3QgcmVzb2x2ZSBhIHByb21pc2Ugd2l0aCBpdHNlbGZcIik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkY2Fubm90UmV0dXJuT3duKCkge1xuICAgICAgcmV0dXJuIG5ldyBUeXBlRXJyb3IoJ0EgcHJvbWlzZXMgY2FsbGJhY2sgY2Fubm90IHJldHVybiB0aGF0IHNhbWUgcHJvbWlzZS4nKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRnZXRUaGVuKHByb21pc2UpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBwcm9taXNlLnRoZW47XG4gICAgICB9IGNhdGNoKGVycm9yKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEdFVF9USEVOX0VSUk9SLmVycm9yID0gZXJyb3I7XG4gICAgICAgIHJldHVybiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRHRVRfVEhFTl9FUlJPUjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCR0cnlUaGVuKHRoZW4sIHZhbHVlLCBmdWxmaWxsbWVudEhhbmRsZXIsIHJlamVjdGlvbkhhbmRsZXIpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoZW4uY2FsbCh2YWx1ZSwgZnVsZmlsbG1lbnRIYW5kbGVyLCByZWplY3Rpb25IYW5kbGVyKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICByZXR1cm4gZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRoYW5kbGVGb3JlaWduVGhlbmFibGUocHJvbWlzZSwgdGhlbmFibGUsIHRoZW4pIHtcbiAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkZGVmYXVsdChmdW5jdGlvbihwcm9taXNlKSB7XG4gICAgICAgIHZhciBzZWFsZWQgPSBmYWxzZTtcbiAgICAgICAgdmFyIGVycm9yID0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkdHJ5VGhlbih0aGVuLCB0aGVuYWJsZSwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICBpZiAoc2VhbGVkKSB7IHJldHVybjsgfVxuICAgICAgICAgIHNlYWxlZCA9IHRydWU7XG4gICAgICAgICAgaWYgKHRoZW5hYmxlICE9PSB2YWx1ZSkge1xuICAgICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgICAgICAgaWYgKHNlYWxlZCkgeyByZXR1cm47IH1cbiAgICAgICAgICBzZWFsZWQgPSB0cnVlO1xuXG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gICAgICAgIH0sICdTZXR0bGU6ICcgKyAocHJvbWlzZS5fbGFiZWwgfHwgJyB1bmtub3duIHByb21pc2UnKSk7XG5cbiAgICAgICAgaWYgKCFzZWFsZWQgJiYgZXJyb3IpIHtcbiAgICAgICAgICBzZWFsZWQgPSB0cnVlO1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH0sIHByb21pc2UpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGhhbmRsZU93blRoZW5hYmxlKHByb21pc2UsIHRoZW5hYmxlKSB7XG4gICAgICBpZiAodGhlbmFibGUuX3N0YXRlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRGVUxGSUxMRUQpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCB0aGVuYWJsZS5fcmVzdWx0KTtcbiAgICAgIH0gZWxzZSBpZiAodGhlbmFibGUuX3N0YXRlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRSRUpFQ1RFRCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgdGhlbmFibGUuX3Jlc3VsdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRzdWJzY3JpYmUodGhlbmFibGUsIHVuZGVmaW5lZCwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGhhbmRsZU1heWJlVGhlbmFibGUocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSkge1xuICAgICAgaWYgKG1heWJlVGhlbmFibGUuY29uc3RydWN0b3IgPT09IHByb21pc2UuY29uc3RydWN0b3IpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaGFuZGxlT3duVGhlbmFibGUocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgdGhlbiA9IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGdldFRoZW4obWF5YmVUaGVuYWJsZSk7XG5cbiAgICAgICAgaWYgKHRoZW4gPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEdFVF9USEVOX0VSUk9SKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEdFVF9USEVOX0VSUk9SLmVycm9yKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIG1heWJlVGhlbmFibGUpO1xuICAgICAgICB9IGVsc2UgaWYgKGxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNGdW5jdGlvbih0aGVuKSkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGhhbmRsZUZvcmVpZ25UaGVuYWJsZShwcm9taXNlLCBtYXliZVRoZW5hYmxlLCB0aGVuKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIG1heWJlVGhlbmFibGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSkge1xuICAgICAgaWYgKHByb21pc2UgPT09IHZhbHVlKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRzZWxmRnVsbGZpbGxtZW50KCkpO1xuICAgICAgfSBlbHNlIGlmIChsaWIkZXM2JHByb21pc2UkdXRpbHMkJG9iamVjdE9yRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGhhbmRsZU1heWJlVGhlbmFibGUocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcHVibGlzaFJlamVjdGlvbihwcm9taXNlKSB7XG4gICAgICBpZiAocHJvbWlzZS5fb25lcnJvcikge1xuICAgICAgICBwcm9taXNlLl9vbmVycm9yKHByb21pc2UuX3Jlc3VsdCk7XG4gICAgICB9XG5cbiAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHB1Ymxpc2gocHJvbWlzZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCB2YWx1ZSkge1xuICAgICAgaWYgKHByb21pc2UuX3N0YXRlICE9PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HKSB7IHJldHVybjsgfVxuXG4gICAgICBwcm9taXNlLl9yZXN1bHQgPSB2YWx1ZTtcbiAgICAgIHByb21pc2UuX3N0YXRlID0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRlVMRklMTEVEO1xuXG4gICAgICBpZiAocHJvbWlzZS5fc3Vic2NyaWJlcnMubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRkZWZhdWx0KGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHB1Ymxpc2gsIHByb21pc2UpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCByZWFzb24pIHtcbiAgICAgIGlmIChwcm9taXNlLl9zdGF0ZSAhPT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUEVORElORykgeyByZXR1cm47IH1cbiAgICAgIHByb21pc2UuX3N0YXRlID0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQ7XG4gICAgICBwcm9taXNlLl9yZXN1bHQgPSByZWFzb247XG5cbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRkZWZhdWx0KGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHB1Ymxpc2hSZWplY3Rpb24sIHByb21pc2UpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHN1YnNjcmliZShwYXJlbnQsIGNoaWxkLCBvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbikge1xuICAgICAgdmFyIHN1YnNjcmliZXJzID0gcGFyZW50Ll9zdWJzY3JpYmVycztcbiAgICAgIHZhciBsZW5ndGggPSBzdWJzY3JpYmVycy5sZW5ndGg7XG5cbiAgICAgIHBhcmVudC5fb25lcnJvciA9IG51bGw7XG5cbiAgICAgIHN1YnNjcmliZXJzW2xlbmd0aF0gPSBjaGlsZDtcbiAgICAgIHN1YnNjcmliZXJzW2xlbmd0aCArIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRF0gPSBvbkZ1bGZpbGxtZW50O1xuICAgICAgc3Vic2NyaWJlcnNbbGVuZ3RoICsgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURURdICA9IG9uUmVqZWN0aW9uO1xuXG4gICAgICBpZiAobGVuZ3RoID09PSAwICYmIHBhcmVudC5fc3RhdGUpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJGRlZmF1bHQobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcHVibGlzaCwgcGFyZW50KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRwdWJsaXNoKHByb21pc2UpIHtcbiAgICAgIHZhciBzdWJzY3JpYmVycyA9IHByb21pc2UuX3N1YnNjcmliZXJzO1xuICAgICAgdmFyIHNldHRsZWQgPSBwcm9taXNlLl9zdGF0ZTtcblxuICAgICAgaWYgKHN1YnNjcmliZXJzLmxlbmd0aCA9PT0gMCkgeyByZXR1cm47IH1cblxuICAgICAgdmFyIGNoaWxkLCBjYWxsYmFjaywgZGV0YWlsID0gcHJvbWlzZS5fcmVzdWx0O1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN1YnNjcmliZXJzLmxlbmd0aDsgaSArPSAzKSB7XG4gICAgICAgIGNoaWxkID0gc3Vic2NyaWJlcnNbaV07XG4gICAgICAgIGNhbGxiYWNrID0gc3Vic2NyaWJlcnNbaSArIHNldHRsZWRdO1xuXG4gICAgICAgIGlmIChjaGlsZCkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGludm9rZUNhbGxiYWNrKHNldHRsZWQsIGNoaWxkLCBjYWxsYmFjaywgZGV0YWlsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjYWxsYmFjayhkZXRhaWwpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHByb21pc2UuX3N1YnNjcmliZXJzLmxlbmd0aCA9IDA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRXJyb3JPYmplY3QoKSB7XG4gICAgICB0aGlzLmVycm9yID0gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkVFJZX0NBVENIX0VSUk9SID0gbmV3IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEVycm9yT2JqZWN0KCk7XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCR0cnlDYXRjaChjYWxsYmFjaywgZGV0YWlsKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZGV0YWlsKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRUUllfQ0FUQ0hfRVJST1IuZXJyb3IgPSBlO1xuICAgICAgICByZXR1cm4gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkVFJZX0NBVENIX0VSUk9SO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGludm9rZUNhbGxiYWNrKHNldHRsZWQsIHByb21pc2UsIGNhbGxiYWNrLCBkZXRhaWwpIHtcbiAgICAgIHZhciBoYXNDYWxsYmFjayA9IGxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNGdW5jdGlvbihjYWxsYmFjayksXG4gICAgICAgICAgdmFsdWUsIGVycm9yLCBzdWNjZWVkZWQsIGZhaWxlZDtcblxuICAgICAgaWYgKGhhc0NhbGxiYWNrKSB7XG4gICAgICAgIHZhbHVlID0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkdHJ5Q2F0Y2goY2FsbGJhY2ssIGRldGFpbCk7XG5cbiAgICAgICAgaWYgKHZhbHVlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRUUllfQ0FUQ0hfRVJST1IpIHtcbiAgICAgICAgICBmYWlsZWQgPSB0cnVlO1xuICAgICAgICAgIGVycm9yID0gdmFsdWUuZXJyb3I7XG4gICAgICAgICAgdmFsdWUgPSBudWxsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN1Y2NlZWRlZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJvbWlzZSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkY2Fubm90UmV0dXJuT3duKCkpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWx1ZSA9IGRldGFpbDtcbiAgICAgICAgc3VjY2VlZGVkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHByb21pc2UuX3N0YXRlICE9PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HKSB7XG4gICAgICAgIC8vIG5vb3BcbiAgICAgIH0gZWxzZSBpZiAoaGFzQ2FsbGJhY2sgJiYgc3VjY2VlZGVkKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfSBlbHNlIGlmIChmYWlsZWQpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIGVycm9yKTtcbiAgICAgIH0gZWxzZSBpZiAoc2V0dGxlZCA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRlVMRklMTEVEKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfSBlbHNlIGlmIChzZXR0bGVkID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRSRUpFQ1RFRCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGluaXRpYWxpemVQcm9taXNlKHByb21pc2UsIHJlc29sdmVyKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXNvbHZlcihmdW5jdGlvbiByZXNvbHZlUHJvbWlzZSh2YWx1ZSl7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIHJlamVjdFByb21pc2UocmVhc29uKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCBlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvcihDb25zdHJ1Y3RvciwgaW5wdXQpIHtcbiAgICAgIHZhciBlbnVtZXJhdG9yID0gdGhpcztcblxuICAgICAgZW51bWVyYXRvci5faW5zdGFuY2VDb25zdHJ1Y3RvciA9IENvbnN0cnVjdG9yO1xuICAgICAgZW51bWVyYXRvci5wcm9taXNlID0gbmV3IENvbnN0cnVjdG9yKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG5vb3ApO1xuXG4gICAgICBpZiAoZW51bWVyYXRvci5fdmFsaWRhdGVJbnB1dChpbnB1dCkpIHtcbiAgICAgICAgZW51bWVyYXRvci5faW5wdXQgICAgID0gaW5wdXQ7XG4gICAgICAgIGVudW1lcmF0b3IubGVuZ3RoICAgICA9IGlucHV0Lmxlbmd0aDtcbiAgICAgICAgZW51bWVyYXRvci5fcmVtYWluaW5nID0gaW5wdXQubGVuZ3RoO1xuXG4gICAgICAgIGVudW1lcmF0b3IuX2luaXQoKTtcblxuICAgICAgICBpZiAoZW51bWVyYXRvci5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKGVudW1lcmF0b3IucHJvbWlzZSwgZW51bWVyYXRvci5fcmVzdWx0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbnVtZXJhdG9yLmxlbmd0aCA9IGVudW1lcmF0b3IubGVuZ3RoIHx8IDA7XG4gICAgICAgICAgZW51bWVyYXRvci5fZW51bWVyYXRlKCk7XG4gICAgICAgICAgaWYgKGVudW1lcmF0b3IuX3JlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChlbnVtZXJhdG9yLnByb21pc2UsIGVudW1lcmF0b3IuX3Jlc3VsdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QoZW51bWVyYXRvci5wcm9taXNlLCBlbnVtZXJhdG9yLl92YWxpZGF0aW9uRXJyb3IoKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJEVudW1lcmF0b3IucHJvdG90eXBlLl92YWxpZGF0ZUlucHV0ID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgIHJldHVybiBsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzQXJyYXkoaW5wdXQpO1xuICAgIH07XG5cbiAgICBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvci5wcm90b3R5cGUuX3ZhbGlkYXRpb25FcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBFcnJvcignQXJyYXkgTWV0aG9kcyBtdXN0IGJlIHByb3ZpZGVkIGFuIEFycmF5Jyk7XG4gICAgfTtcblxuICAgIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yLnByb3RvdHlwZS5faW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fcmVzdWx0ID0gbmV3IEFycmF5KHRoaXMubGVuZ3RoKTtcbiAgICB9O1xuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRkZWZhdWx0ID0gbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJEVudW1lcmF0b3I7XG5cbiAgICBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvci5wcm90b3R5cGUuX2VudW1lcmF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGVudW1lcmF0b3IgPSB0aGlzO1xuXG4gICAgICB2YXIgbGVuZ3RoICA9IGVudW1lcmF0b3IubGVuZ3RoO1xuICAgICAgdmFyIHByb21pc2UgPSBlbnVtZXJhdG9yLnByb21pc2U7XG4gICAgICB2YXIgaW5wdXQgICA9IGVudW1lcmF0b3IuX2lucHV0O1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgcHJvbWlzZS5fc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBFTkRJTkcgJiYgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGVudW1lcmF0b3IuX2VhY2hFbnRyeShpbnB1dFtpXSwgaSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yLnByb3RvdHlwZS5fZWFjaEVudHJ5ID0gZnVuY3Rpb24oZW50cnksIGkpIHtcbiAgICAgIHZhciBlbnVtZXJhdG9yID0gdGhpcztcbiAgICAgIHZhciBjID0gZW51bWVyYXRvci5faW5zdGFuY2VDb25zdHJ1Y3RvcjtcblxuICAgICAgaWYgKGxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNNYXliZVRoZW5hYmxlKGVudHJ5KSkge1xuICAgICAgICBpZiAoZW50cnkuY29uc3RydWN0b3IgPT09IGMgJiYgZW50cnkuX3N0YXRlICE9PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HKSB7XG4gICAgICAgICAgZW50cnkuX29uZXJyb3IgPSBudWxsO1xuICAgICAgICAgIGVudW1lcmF0b3IuX3NldHRsZWRBdChlbnRyeS5fc3RhdGUsIGksIGVudHJ5Ll9yZXN1bHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVudW1lcmF0b3IuX3dpbGxTZXR0bGVBdChjLnJlc29sdmUoZW50cnkpLCBpKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZW51bWVyYXRvci5fcmVtYWluaW5nLS07XG4gICAgICAgIGVudW1lcmF0b3IuX3Jlc3VsdFtpXSA9IGVudHJ5O1xuICAgICAgfVxuICAgIH07XG5cbiAgICBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvci5wcm90b3R5cGUuX3NldHRsZWRBdCA9IGZ1bmN0aW9uKHN0YXRlLCBpLCB2YWx1ZSkge1xuICAgICAgdmFyIGVudW1lcmF0b3IgPSB0aGlzO1xuICAgICAgdmFyIHByb21pc2UgPSBlbnVtZXJhdG9yLnByb21pc2U7XG5cbiAgICAgIGlmIChwcm9taXNlLl9zdGF0ZSA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUEVORElORykge1xuICAgICAgICBlbnVtZXJhdG9yLl9yZW1haW5pbmctLTtcblxuICAgICAgICBpZiAoc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVEKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbnVtZXJhdG9yLl9yZXN1bHRbaV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoZW51bWVyYXRvci5fcmVtYWluaW5nID09PSAwKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgZW51bWVyYXRvci5fcmVzdWx0KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJEVudW1lcmF0b3IucHJvdG90eXBlLl93aWxsU2V0dGxlQXQgPSBmdW5jdGlvbihwcm9taXNlLCBpKSB7XG4gICAgICB2YXIgZW51bWVyYXRvciA9IHRoaXM7XG5cbiAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHN1YnNjcmliZShwcm9taXNlLCB1bmRlZmluZWQsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIGVudW1lcmF0b3IuX3NldHRsZWRBdChsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRGVUxGSUxMRUQsIGksIHZhbHVlKTtcbiAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xuICAgICAgICBlbnVtZXJhdG9yLl9zZXR0bGVkQXQobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQsIGksIHJlYXNvbik7XG4gICAgICB9KTtcbiAgICB9O1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJGFsbCQkYWxsKGVudHJpZXMpIHtcbiAgICAgIHJldHVybiBuZXcgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJGRlZmF1bHQodGhpcywgZW50cmllcykucHJvbWlzZTtcbiAgICB9XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJGFsbCQkZGVmYXVsdCA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJGFsbCQkYWxsO1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJhY2UkJHJhY2UoZW50cmllcykge1xuICAgICAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgICAgIHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG5cbiAgICAgIHZhciBwcm9taXNlID0gbmV3IENvbnN0cnVjdG9yKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG5vb3ApO1xuXG4gICAgICBpZiAoIWxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNBcnJheShlbnRyaWVzKSkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgbmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhbiBhcnJheSB0byByYWNlLicpKTtcbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICB9XG5cbiAgICAgIHZhciBsZW5ndGggPSBlbnRyaWVzLmxlbmd0aDtcblxuICAgICAgZnVuY3Rpb24gb25GdWxmaWxsbWVudCh2YWx1ZSkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gb25SZWplY3Rpb24ocmVhc29uKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCByZWFzb24pO1xuICAgICAgfVxuXG4gICAgICBmb3IgKHZhciBpID0gMDsgcHJvbWlzZS5fc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBFTkRJTkcgJiYgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHN1YnNjcmliZShDb25zdHJ1Y3Rvci5yZXNvbHZlKGVudHJpZXNbaV0pLCB1bmRlZmluZWQsIG9uRnVsZmlsbG1lbnQsIG9uUmVqZWN0aW9uKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyYWNlJCRkZWZhdWx0ID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmFjZSQkcmFjZTtcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZXNvbHZlJCRyZXNvbHZlKG9iamVjdCkge1xuICAgICAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgICAgIHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG5cbiAgICAgIGlmIChvYmplY3QgJiYgdHlwZW9mIG9iamVjdCA9PT0gJ29iamVjdCcgJiYgb2JqZWN0LmNvbnN0cnVjdG9yID09PSBDb25zdHJ1Y3Rvcikge1xuICAgICAgICByZXR1cm4gb2JqZWN0O1xuICAgICAgfVxuXG4gICAgICB2YXIgcHJvbWlzZSA9IG5ldyBDb25zdHJ1Y3RvcihsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKTtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlc29sdmUocHJvbWlzZSwgb2JqZWN0KTtcbiAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH1cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVzb2x2ZSQkZGVmYXVsdCA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlc29sdmUkJHJlc29sdmU7XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVqZWN0JCRyZWplY3QocmVhc29uKSB7XG4gICAgICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICAgICAgdmFyIENvbnN0cnVjdG9yID0gdGhpcztcbiAgICAgIHZhciBwcm9taXNlID0gbmV3IENvbnN0cnVjdG9yKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG5vb3ApO1xuICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlamVjdCQkZGVmYXVsdCA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlamVjdCQkcmVqZWN0O1xuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRjb3VudGVyID0gMDtcblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRuZWVkc1Jlc29sdmVyKCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhIHJlc29sdmVyIGZ1bmN0aW9uIGFzIHRoZSBmaXJzdCBhcmd1bWVudCB0byB0aGUgcHJvbWlzZSBjb25zdHJ1Y3RvcicpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRuZWVkc05ldygpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJGYWlsZWQgdG8gY29uc3RydWN0ICdQcm9taXNlJzogUGxlYXNlIHVzZSB0aGUgJ25ldycgb3BlcmF0b3IsIHRoaXMgb2JqZWN0IGNvbnN0cnVjdG9yIGNhbm5vdCBiZSBjYWxsZWQgYXMgYSBmdW5jdGlvbi5cIik7XG4gICAgfVxuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRkZWZhdWx0ID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2U7XG4gICAgLyoqXG4gICAgICBQcm9taXNlIG9iamVjdHMgcmVwcmVzZW50IHRoZSBldmVudHVhbCByZXN1bHQgb2YgYW4gYXN5bmNocm9ub3VzIG9wZXJhdGlvbi4gVGhlXG4gICAgICBwcmltYXJ5IHdheSBvZiBpbnRlcmFjdGluZyB3aXRoIGEgcHJvbWlzZSBpcyB0aHJvdWdoIGl0cyBgdGhlbmAgbWV0aG9kLCB3aGljaFxuICAgICAgcmVnaXN0ZXJzIGNhbGxiYWNrcyB0byByZWNlaXZlIGVpdGhlciBhIHByb21pc2XigJlzIGV2ZW50dWFsIHZhbHVlIG9yIHRoZSByZWFzb25cbiAgICAgIHdoeSB0aGUgcHJvbWlzZSBjYW5ub3QgYmUgZnVsZmlsbGVkLlxuXG4gICAgICBUZXJtaW5vbG9neVxuICAgICAgLS0tLS0tLS0tLS1cblxuICAgICAgLSBgcHJvbWlzZWAgaXMgYW4gb2JqZWN0IG9yIGZ1bmN0aW9uIHdpdGggYSBgdGhlbmAgbWV0aG9kIHdob3NlIGJlaGF2aW9yIGNvbmZvcm1zIHRvIHRoaXMgc3BlY2lmaWNhdGlvbi5cbiAgICAgIC0gYHRoZW5hYmxlYCBpcyBhbiBvYmplY3Qgb3IgZnVuY3Rpb24gdGhhdCBkZWZpbmVzIGEgYHRoZW5gIG1ldGhvZC5cbiAgICAgIC0gYHZhbHVlYCBpcyBhbnkgbGVnYWwgSmF2YVNjcmlwdCB2YWx1ZSAoaW5jbHVkaW5nIHVuZGVmaW5lZCwgYSB0aGVuYWJsZSwgb3IgYSBwcm9taXNlKS5cbiAgICAgIC0gYGV4Y2VwdGlvbmAgaXMgYSB2YWx1ZSB0aGF0IGlzIHRocm93biB1c2luZyB0aGUgdGhyb3cgc3RhdGVtZW50LlxuICAgICAgLSBgcmVhc29uYCBpcyBhIHZhbHVlIHRoYXQgaW5kaWNhdGVzIHdoeSBhIHByb21pc2Ugd2FzIHJlamVjdGVkLlxuICAgICAgLSBgc2V0dGxlZGAgdGhlIGZpbmFsIHJlc3Rpbmcgc3RhdGUgb2YgYSBwcm9taXNlLCBmdWxmaWxsZWQgb3IgcmVqZWN0ZWQuXG5cbiAgICAgIEEgcHJvbWlzZSBjYW4gYmUgaW4gb25lIG9mIHRocmVlIHN0YXRlczogcGVuZGluZywgZnVsZmlsbGVkLCBvciByZWplY3RlZC5cblxuICAgICAgUHJvbWlzZXMgdGhhdCBhcmUgZnVsZmlsbGVkIGhhdmUgYSBmdWxmaWxsbWVudCB2YWx1ZSBhbmQgYXJlIGluIHRoZSBmdWxmaWxsZWRcbiAgICAgIHN0YXRlLiAgUHJvbWlzZXMgdGhhdCBhcmUgcmVqZWN0ZWQgaGF2ZSBhIHJlamVjdGlvbiByZWFzb24gYW5kIGFyZSBpbiB0aGVcbiAgICAgIHJlamVjdGVkIHN0YXRlLiAgQSBmdWxmaWxsbWVudCB2YWx1ZSBpcyBuZXZlciBhIHRoZW5hYmxlLlxuXG4gICAgICBQcm9taXNlcyBjYW4gYWxzbyBiZSBzYWlkIHRvICpyZXNvbHZlKiBhIHZhbHVlLiAgSWYgdGhpcyB2YWx1ZSBpcyBhbHNvIGFcbiAgICAgIHByb21pc2UsIHRoZW4gdGhlIG9yaWdpbmFsIHByb21pc2UncyBzZXR0bGVkIHN0YXRlIHdpbGwgbWF0Y2ggdGhlIHZhbHVlJ3NcbiAgICAgIHNldHRsZWQgc3RhdGUuICBTbyBhIHByb21pc2UgdGhhdCAqcmVzb2x2ZXMqIGEgcHJvbWlzZSB0aGF0IHJlamVjdHMgd2lsbFxuICAgICAgaXRzZWxmIHJlamVjdCwgYW5kIGEgcHJvbWlzZSB0aGF0ICpyZXNvbHZlcyogYSBwcm9taXNlIHRoYXQgZnVsZmlsbHMgd2lsbFxuICAgICAgaXRzZWxmIGZ1bGZpbGwuXG5cblxuICAgICAgQmFzaWMgVXNhZ2U6XG4gICAgICAtLS0tLS0tLS0tLS1cblxuICAgICAgYGBganNcbiAgICAgIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIC8vIG9uIHN1Y2Nlc3NcbiAgICAgICAgcmVzb2x2ZSh2YWx1ZSk7XG5cbiAgICAgICAgLy8gb24gZmFpbHVyZVxuICAgICAgICByZWplY3QocmVhc29uKTtcbiAgICAgIH0pO1xuXG4gICAgICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgLy8gb24gZnVsZmlsbG1lbnRcbiAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xuICAgICAgICAvLyBvbiByZWplY3Rpb25cbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIEFkdmFuY2VkIFVzYWdlOlxuICAgICAgLS0tLS0tLS0tLS0tLS0tXG5cbiAgICAgIFByb21pc2VzIHNoaW5lIHdoZW4gYWJzdHJhY3RpbmcgYXdheSBhc3luY2hyb25vdXMgaW50ZXJhY3Rpb25zIHN1Y2ggYXNcbiAgICAgIGBYTUxIdHRwUmVxdWVzdGBzLlxuXG4gICAgICBgYGBqc1xuICAgICAgZnVuY3Rpb24gZ2V0SlNPTih1cmwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgICAgICAgeGhyLm9wZW4oJ0dFVCcsIHVybCk7XG4gICAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGhhbmRsZXI7XG4gICAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9ICdqc29uJztcbiAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignQWNjZXB0JywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICB4aHIuc2VuZCgpO1xuXG4gICAgICAgICAgZnVuY3Rpb24gaGFuZGxlcigpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnJlYWR5U3RhdGUgPT09IHRoaXMuRE9ORSkge1xuICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUodGhpcy5yZXNwb25zZSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcignZ2V0SlNPTjogYCcgKyB1cmwgKyAnYCBmYWlsZWQgd2l0aCBzdGF0dXM6IFsnICsgdGhpcy5zdGF0dXMgKyAnXScpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBnZXRKU09OKCcvcG9zdHMuanNvbicpLnRoZW4oZnVuY3Rpb24oanNvbikge1xuICAgICAgICAvLyBvbiBmdWxmaWxsbWVudFxuICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgICAgIC8vIG9uIHJlamVjdGlvblxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgVW5saWtlIGNhbGxiYWNrcywgcHJvbWlzZXMgYXJlIGdyZWF0IGNvbXBvc2FibGUgcHJpbWl0aXZlcy5cblxuICAgICAgYGBganNcbiAgICAgIFByb21pc2UuYWxsKFtcbiAgICAgICAgZ2V0SlNPTignL3Bvc3RzJyksXG4gICAgICAgIGdldEpTT04oJy9jb21tZW50cycpXG4gICAgICBdKS50aGVuKGZ1bmN0aW9uKHZhbHVlcyl7XG4gICAgICAgIHZhbHVlc1swXSAvLyA9PiBwb3N0c0pTT05cbiAgICAgICAgdmFsdWVzWzFdIC8vID0+IGNvbW1lbnRzSlNPTlxuXG4gICAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBAY2xhc3MgUHJvbWlzZVxuICAgICAgQHBhcmFtIHtmdW5jdGlvbn0gcmVzb2x2ZXJcbiAgICAgIFVzZWZ1bCBmb3IgdG9vbGluZy5cbiAgICAgIEBjb25zdHJ1Y3RvclxuICAgICovXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UocmVzb2x2ZXIpIHtcbiAgICAgIHRoaXMuX2lkID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkJGNvdW50ZXIrKztcbiAgICAgIHRoaXMuX3N0YXRlID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5fcmVzdWx0ID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5fc3Vic2NyaWJlcnMgPSBbXTtcblxuICAgICAgaWYgKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG5vb3AgIT09IHJlc29sdmVyKSB7XG4gICAgICAgIGlmICghbGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc0Z1bmN0aW9uKHJlc29sdmVyKSkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRuZWVkc1Jlc29sdmVyKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UpKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJG5lZWRzTmV3KCk7XG4gICAgICAgIH1cblxuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRpbml0aWFsaXplUHJvbWlzZSh0aGlzLCByZXNvbHZlcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UuYWxsID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkYWxsJCRkZWZhdWx0O1xuICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLnJhY2UgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyYWNlJCRkZWZhdWx0O1xuICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLnJlc29sdmUgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZXNvbHZlJCRkZWZhdWx0O1xuICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLnJlamVjdCA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlamVjdCQkZGVmYXVsdDtcblxuICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLnByb3RvdHlwZSA9IHtcbiAgICAgIGNvbnN0cnVjdG9yOiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZSxcblxuICAgIC8qKlxuICAgICAgVGhlIHByaW1hcnkgd2F5IG9mIGludGVyYWN0aW5nIHdpdGggYSBwcm9taXNlIGlzIHRocm91Z2ggaXRzIGB0aGVuYCBtZXRob2QsXG4gICAgICB3aGljaCByZWdpc3RlcnMgY2FsbGJhY2tzIHRvIHJlY2VpdmUgZWl0aGVyIGEgcHJvbWlzZSdzIGV2ZW50dWFsIHZhbHVlIG9yIHRoZVxuICAgICAgcmVhc29uIHdoeSB0aGUgcHJvbWlzZSBjYW5ub3QgYmUgZnVsZmlsbGVkLlxuXG4gICAgICBgYGBqc1xuICAgICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uKHVzZXIpe1xuICAgICAgICAvLyB1c2VyIGlzIGF2YWlsYWJsZVxuICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKXtcbiAgICAgICAgLy8gdXNlciBpcyB1bmF2YWlsYWJsZSwgYW5kIHlvdSBhcmUgZ2l2ZW4gdGhlIHJlYXNvbiB3aHlcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIENoYWluaW5nXG4gICAgICAtLS0tLS0tLVxuXG4gICAgICBUaGUgcmV0dXJuIHZhbHVlIG9mIGB0aGVuYCBpcyBpdHNlbGYgYSBwcm9taXNlLiAgVGhpcyBzZWNvbmQsICdkb3duc3RyZWFtJ1xuICAgICAgcHJvbWlzZSBpcyByZXNvbHZlZCB3aXRoIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIGZpcnN0IHByb21pc2UncyBmdWxmaWxsbWVudFxuICAgICAgb3IgcmVqZWN0aW9uIGhhbmRsZXIsIG9yIHJlamVjdGVkIGlmIHRoZSBoYW5kbGVyIHRocm93cyBhbiBleGNlcHRpb24uXG5cbiAgICAgIGBgYGpzXG4gICAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgcmV0dXJuIHVzZXIubmFtZTtcbiAgICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgcmV0dXJuICdkZWZhdWx0IG5hbWUnO1xuICAgICAgfSkudGhlbihmdW5jdGlvbiAodXNlck5hbWUpIHtcbiAgICAgICAgLy8gSWYgYGZpbmRVc2VyYCBmdWxmaWxsZWQsIGB1c2VyTmFtZWAgd2lsbCBiZSB0aGUgdXNlcidzIG5hbWUsIG90aGVyd2lzZSBpdFxuICAgICAgICAvLyB3aWxsIGJlIGAnZGVmYXVsdCBuYW1lJ2BcbiAgICAgIH0pO1xuXG4gICAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGb3VuZCB1c2VyLCBidXQgc3RpbGwgdW5oYXBweScpO1xuICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2BmaW5kVXNlcmAgcmVqZWN0ZWQgYW5kIHdlJ3JlIHVuaGFwcHknKTtcbiAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIC8vIG5ldmVyIHJlYWNoZWRcbiAgICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgLy8gaWYgYGZpbmRVc2VyYCBmdWxmaWxsZWQsIGByZWFzb25gIHdpbGwgYmUgJ0ZvdW5kIHVzZXIsIGJ1dCBzdGlsbCB1bmhhcHB5Jy5cbiAgICAgICAgLy8gSWYgYGZpbmRVc2VyYCByZWplY3RlZCwgYHJlYXNvbmAgd2lsbCBiZSAnYGZpbmRVc2VyYCByZWplY3RlZCBhbmQgd2UncmUgdW5oYXBweScuXG4gICAgICB9KTtcbiAgICAgIGBgYFxuICAgICAgSWYgdGhlIGRvd25zdHJlYW0gcHJvbWlzZSBkb2VzIG5vdCBzcGVjaWZ5IGEgcmVqZWN0aW9uIGhhbmRsZXIsIHJlamVjdGlvbiByZWFzb25zIHdpbGwgYmUgcHJvcGFnYXRlZCBmdXJ0aGVyIGRvd25zdHJlYW0uXG5cbiAgICAgIGBgYGpzXG4gICAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFBlZGFnb2dpY2FsRXhjZXB0aW9uKCdVcHN0cmVhbSBlcnJvcicpO1xuICAgICAgfSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgLy8gbmV2ZXIgcmVhY2hlZFxuICAgICAgfSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgLy8gbmV2ZXIgcmVhY2hlZFxuICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICAvLyBUaGUgYFBlZGdhZ29jaWFsRXhjZXB0aW9uYCBpcyBwcm9wYWdhdGVkIGFsbCB0aGUgd2F5IGRvd24gdG8gaGVyZVxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQXNzaW1pbGF0aW9uXG4gICAgICAtLS0tLS0tLS0tLS1cblxuICAgICAgU29tZXRpbWVzIHRoZSB2YWx1ZSB5b3Ugd2FudCB0byBwcm9wYWdhdGUgdG8gYSBkb3duc3RyZWFtIHByb21pc2UgY2FuIG9ubHkgYmVcbiAgICAgIHJldHJpZXZlZCBhc3luY2hyb25vdXNseS4gVGhpcyBjYW4gYmUgYWNoaWV2ZWQgYnkgcmV0dXJuaW5nIGEgcHJvbWlzZSBpbiB0aGVcbiAgICAgIGZ1bGZpbGxtZW50IG9yIHJlamVjdGlvbiBoYW5kbGVyLiBUaGUgZG93bnN0cmVhbSBwcm9taXNlIHdpbGwgdGhlbiBiZSBwZW5kaW5nXG4gICAgICB1bnRpbCB0aGUgcmV0dXJuZWQgcHJvbWlzZSBpcyBzZXR0bGVkLiBUaGlzIGlzIGNhbGxlZCAqYXNzaW1pbGF0aW9uKi5cblxuICAgICAgYGBganNcbiAgICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICByZXR1cm4gZmluZENvbW1lbnRzQnlBdXRob3IodXNlcik7XG4gICAgICB9KS50aGVuKGZ1bmN0aW9uIChjb21tZW50cykge1xuICAgICAgICAvLyBUaGUgdXNlcidzIGNvbW1lbnRzIGFyZSBub3cgYXZhaWxhYmxlXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBJZiB0aGUgYXNzaW1saWF0ZWQgcHJvbWlzZSByZWplY3RzLCB0aGVuIHRoZSBkb3duc3RyZWFtIHByb21pc2Ugd2lsbCBhbHNvIHJlamVjdC5cblxuICAgICAgYGBganNcbiAgICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICByZXR1cm4gZmluZENvbW1lbnRzQnlBdXRob3IodXNlcik7XG4gICAgICB9KS50aGVuKGZ1bmN0aW9uIChjb21tZW50cykge1xuICAgICAgICAvLyBJZiBgZmluZENvbW1lbnRzQnlBdXRob3JgIGZ1bGZpbGxzLCB3ZSdsbCBoYXZlIHRoZSB2YWx1ZSBoZXJlXG4gICAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIC8vIElmIGBmaW5kQ29tbWVudHNCeUF1dGhvcmAgcmVqZWN0cywgd2UnbGwgaGF2ZSB0aGUgcmVhc29uIGhlcmVcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIFNpbXBsZSBFeGFtcGxlXG4gICAgICAtLS0tLS0tLS0tLS0tLVxuXG4gICAgICBTeW5jaHJvbm91cyBFeGFtcGxlXG5cbiAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgIHZhciByZXN1bHQ7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHJlc3VsdCA9IGZpbmRSZXN1bHQoKTtcbiAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgLy8gZmFpbHVyZVxuICAgICAgfVxuICAgICAgYGBgXG5cbiAgICAgIEVycmJhY2sgRXhhbXBsZVxuXG4gICAgICBgYGBqc1xuICAgICAgZmluZFJlc3VsdChmdW5jdGlvbihyZXN1bHQsIGVycil7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAvLyBmYWlsdXJlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBQcm9taXNlIEV4YW1wbGU7XG5cbiAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgIGZpbmRSZXN1bHQoKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCl7XG4gICAgICAgIC8vIHN1Y2Nlc3NcbiAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgICAgIC8vIGZhaWx1cmVcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIEFkdmFuY2VkIEV4YW1wbGVcbiAgICAgIC0tLS0tLS0tLS0tLS0tXG5cbiAgICAgIFN5bmNocm9ub3VzIEV4YW1wbGVcblxuICAgICAgYGBgamF2YXNjcmlwdFxuICAgICAgdmFyIGF1dGhvciwgYm9va3M7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF1dGhvciA9IGZpbmRBdXRob3IoKTtcbiAgICAgICAgYm9va3MgID0gZmluZEJvb2tzQnlBdXRob3IoYXV0aG9yKTtcbiAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgLy8gZmFpbHVyZVxuICAgICAgfVxuICAgICAgYGBgXG5cbiAgICAgIEVycmJhY2sgRXhhbXBsZVxuXG4gICAgICBgYGBqc1xuXG4gICAgICBmdW5jdGlvbiBmb3VuZEJvb2tzKGJvb2tzKSB7XG5cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gZmFpbHVyZShyZWFzb24pIHtcblxuICAgICAgfVxuXG4gICAgICBmaW5kQXV0aG9yKGZ1bmN0aW9uKGF1dGhvciwgZXJyKXtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIGZhaWx1cmUoZXJyKTtcbiAgICAgICAgICAvLyBmYWlsdXJlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZpbmRCb29va3NCeUF1dGhvcihhdXRob3IsIGZ1bmN0aW9uKGJvb2tzLCBlcnIpIHtcbiAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGZhaWx1cmUoZXJyKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgZm91bmRCb29rcyhib29rcyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgICAgICAgICAgIGZhaWx1cmUocmVhc29uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgICAgIGZhaWx1cmUoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBQcm9taXNlIEV4YW1wbGU7XG5cbiAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgIGZpbmRBdXRob3IoKS5cbiAgICAgICAgdGhlbihmaW5kQm9va3NCeUF1dGhvcikuXG4gICAgICAgIHRoZW4oZnVuY3Rpb24oYm9va3Mpe1xuICAgICAgICAgIC8vIGZvdW5kIGJvb2tzXG4gICAgICB9KS5jYXRjaChmdW5jdGlvbihyZWFzb24pe1xuICAgICAgICAvLyBzb21ldGhpbmcgd2VudCB3cm9uZ1xuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQG1ldGhvZCB0aGVuXG4gICAgICBAcGFyYW0ge0Z1bmN0aW9ufSBvbkZ1bGZpbGxlZFxuICAgICAgQHBhcmFtIHtGdW5jdGlvbn0gb25SZWplY3RlZFxuICAgICAgVXNlZnVsIGZvciB0b29saW5nLlxuICAgICAgQHJldHVybiB7UHJvbWlzZX1cbiAgICAqL1xuICAgICAgdGhlbjogZnVuY3Rpb24ob25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pIHtcbiAgICAgICAgdmFyIHBhcmVudCA9IHRoaXM7XG4gICAgICAgIHZhciBzdGF0ZSA9IHBhcmVudC5fc3RhdGU7XG5cbiAgICAgICAgaWYgKHN0YXRlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRGVUxGSUxMRUQgJiYgIW9uRnVsZmlsbG1lbnQgfHwgc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVEICYmICFvblJlamVjdGlvbikge1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNoaWxkID0gbmV3IHRoaXMuY29uc3RydWN0b3IobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbm9vcCk7XG4gICAgICAgIHZhciByZXN1bHQgPSBwYXJlbnQuX3Jlc3VsdDtcblxuICAgICAgICBpZiAoc3RhdGUpIHtcbiAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBhcmd1bWVudHNbc3RhdGUgLSAxXTtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkZGVmYXVsdChmdW5jdGlvbigpe1xuICAgICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaW52b2tlQ2FsbGJhY2soc3RhdGUsIGNoaWxkLCBjYWxsYmFjaywgcmVzdWx0KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRzdWJzY3JpYmUocGFyZW50LCBjaGlsZCwgb25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNoaWxkO1xuICAgICAgfSxcblxuICAgIC8qKlxuICAgICAgYGNhdGNoYCBpcyBzaW1wbHkgc3VnYXIgZm9yIGB0aGVuKHVuZGVmaW5lZCwgb25SZWplY3Rpb24pYCB3aGljaCBtYWtlcyBpdCB0aGUgc2FtZVxuICAgICAgYXMgdGhlIGNhdGNoIGJsb2NrIG9mIGEgdHJ5L2NhdGNoIHN0YXRlbWVudC5cblxuICAgICAgYGBganNcbiAgICAgIGZ1bmN0aW9uIGZpbmRBdXRob3IoKXtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZG4ndCBmaW5kIHRoYXQgYXV0aG9yJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIHN5bmNocm9ub3VzXG4gICAgICB0cnkge1xuICAgICAgICBmaW5kQXV0aG9yKCk7XG4gICAgICB9IGNhdGNoKHJlYXNvbikge1xuICAgICAgICAvLyBzb21ldGhpbmcgd2VudCB3cm9uZ1xuICAgICAgfVxuXG4gICAgICAvLyBhc3luYyB3aXRoIHByb21pc2VzXG4gICAgICBmaW5kQXV0aG9yKCkuY2F0Y2goZnVuY3Rpb24ocmVhc29uKXtcbiAgICAgICAgLy8gc29tZXRoaW5nIHdlbnQgd3JvbmdcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIEBtZXRob2QgY2F0Y2hcbiAgICAgIEBwYXJhbSB7RnVuY3Rpb259IG9uUmVqZWN0aW9uXG4gICAgICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gICAgICBAcmV0dXJuIHtQcm9taXNlfVxuICAgICovXG4gICAgICAnY2F0Y2gnOiBmdW5jdGlvbihvblJlamVjdGlvbikge1xuICAgICAgICByZXR1cm4gdGhpcy50aGVuKG51bGwsIG9uUmVqZWN0aW9uKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwb2x5ZmlsbCQkcG9seWZpbGwoKSB7XG4gICAgICB2YXIgbG9jYWw7XG5cbiAgICAgIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIGxvY2FsID0gZ2xvYmFsO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICBsb2NhbCA9IHNlbGY7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGxvY2FsID0gRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigncG9seWZpbGwgZmFpbGVkIGJlY2F1c2UgZ2xvYmFsIG9iamVjdCBpcyB1bmF2YWlsYWJsZSBpbiB0aGlzIGVudmlyb25tZW50Jyk7XG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgUCA9IGxvY2FsLlByb21pc2U7XG5cbiAgICAgIGlmIChQICYmIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChQLnJlc29sdmUoKSkgPT09ICdbb2JqZWN0IFByb21pc2VdJyAmJiAhUC5jYXN0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgbG9jYWwuUHJvbWlzZSA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRkZWZhdWx0O1xuICAgIH1cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHBvbHlmaWxsJCRkZWZhdWx0ID0gbGliJGVzNiRwcm9taXNlJHBvbHlmaWxsJCRwb2x5ZmlsbDtcblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkdW1kJCRFUzZQcm9taXNlID0ge1xuICAgICAgJ1Byb21pc2UnOiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkZGVmYXVsdCxcbiAgICAgICdwb2x5ZmlsbCc6IGxpYiRlczYkcHJvbWlzZSRwb2x5ZmlsbCQkZGVmYXVsdFxuICAgIH07XG5cbiAgICAvKiBnbG9iYWwgZGVmaW5lOnRydWUgbW9kdWxlOnRydWUgd2luZG93OiB0cnVlICovXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lWydhbWQnXSkge1xuICAgICAgZGVmaW5lKGZ1bmN0aW9uKCkgeyByZXR1cm4gbGliJGVzNiRwcm9taXNlJHVtZCQkRVM2UHJvbWlzZTsgfSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGVbJ2V4cG9ydHMnXSkge1xuICAgICAgbW9kdWxlWydleHBvcnRzJ10gPSBsaWIkZXM2JHByb21pc2UkdW1kJCRFUzZQcm9taXNlO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHRoaXMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aGlzWydFUzZQcm9taXNlJ10gPSBsaWIkZXM2JHByb21pc2UkdW1kJCRFUzZQcm9taXNlO1xuICAgIH1cblxuICAgIGxpYiRlczYkcHJvbWlzZSRwb2x5ZmlsbCQkZGVmYXVsdCgpO1xufSkuY2FsbCh0aGlzKTtcblxuIiwiLypqc2xpbnQgb25ldmFyOnRydWUsIHVuZGVmOnRydWUsIG5ld2NhcDp0cnVlLCByZWdleHA6dHJ1ZSwgYml0d2lzZTp0cnVlLCBtYXhlcnI6NTAsIGluZGVudDo0LCB3aGl0ZTpmYWxzZSwgbm9tZW46ZmFsc2UsIHBsdXNwbHVzOmZhbHNlICovXG4vKmdsb2JhbCBkZWZpbmU6ZmFsc2UsIHJlcXVpcmU6ZmFsc2UsIGV4cG9ydHM6ZmFsc2UsIG1vZHVsZTpmYWxzZSwgc2lnbmFsczpmYWxzZSAqL1xuXG4vKiogQGxpY2Vuc2VcbiAqIEpTIFNpZ25hbHMgPGh0dHA6Ly9taWxsZXJtZWRlaXJvcy5naXRodWIuY29tL2pzLXNpZ25hbHMvPlxuICogUmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlXG4gKiBBdXRob3I6IE1pbGxlciBNZWRlaXJvc1xuICogVmVyc2lvbjogMS4wLjAgLSBCdWlsZDogMjY4ICgyMDEyLzExLzI5IDA1OjQ4IFBNKVxuICovXG5cbihmdW5jdGlvbihnbG9iYWwpe1xuXG4gICAgLy8gU2lnbmFsQmluZGluZyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICAvKipcbiAgICAgKiBPYmplY3QgdGhhdCByZXByZXNlbnRzIGEgYmluZGluZyBiZXR3ZWVuIGEgU2lnbmFsIGFuZCBhIGxpc3RlbmVyIGZ1bmN0aW9uLlxuICAgICAqIDxiciAvPi0gPHN0cm9uZz5UaGlzIGlzIGFuIGludGVybmFsIGNvbnN0cnVjdG9yIGFuZCBzaG91bGRuJ3QgYmUgY2FsbGVkIGJ5IHJlZ3VsYXIgdXNlcnMuPC9zdHJvbmc+XG4gICAgICogPGJyIC8+LSBpbnNwaXJlZCBieSBKb2EgRWJlcnQgQVMzIFNpZ25hbEJpbmRpbmcgYW5kIFJvYmVydCBQZW5uZXIncyBTbG90IGNsYXNzZXMuXG4gICAgICogQGF1dGhvciBNaWxsZXIgTWVkZWlyb3NcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKiBAbmFtZSBTaWduYWxCaW5kaW5nXG4gICAgICogQHBhcmFtIHtTaWduYWx9IHNpZ25hbCBSZWZlcmVuY2UgdG8gU2lnbmFsIG9iamVjdCB0aGF0IGxpc3RlbmVyIGlzIGN1cnJlbnRseSBib3VuZCB0by5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBIYW5kbGVyIGZ1bmN0aW9uIGJvdW5kIHRvIHRoZSBzaWduYWwuXG4gICAgICogQHBhcmFtIHtib29sZWFufSBpc09uY2UgSWYgYmluZGluZyBzaG91bGQgYmUgZXhlY3V0ZWQganVzdCBvbmNlLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbbGlzdGVuZXJDb250ZXh0XSBDb250ZXh0IG9uIHdoaWNoIGxpc3RlbmVyIHdpbGwgYmUgZXhlY3V0ZWQgKG9iamVjdCB0aGF0IHNob3VsZCByZXByZXNlbnQgdGhlIGB0aGlzYCB2YXJpYWJsZSBpbnNpZGUgbGlzdGVuZXIgZnVuY3Rpb24pLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBbcHJpb3JpdHldIFRoZSBwcmlvcml0eSBsZXZlbCBvZiB0aGUgZXZlbnQgbGlzdGVuZXIuIChkZWZhdWx0ID0gMCkuXG4gICAgICovXG4gICAgZnVuY3Rpb24gU2lnbmFsQmluZGluZyhzaWduYWwsIGxpc3RlbmVyLCBpc09uY2UsIGxpc3RlbmVyQ29udGV4dCwgcHJpb3JpdHkpIHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSGFuZGxlciBmdW5jdGlvbiBib3VuZCB0byB0aGUgc2lnbmFsLlxuICAgICAgICAgKiBAdHlwZSBGdW5jdGlvblxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fbGlzdGVuZXIgPSBsaXN0ZW5lcjtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSWYgYmluZGluZyBzaG91bGQgYmUgZXhlY3V0ZWQganVzdCBvbmNlLlxuICAgICAgICAgKiBAdHlwZSBib29sZWFuXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9pc09uY2UgPSBpc09uY2U7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvbnRleHQgb24gd2hpY2ggbGlzdGVuZXIgd2lsbCBiZSBleGVjdXRlZCAob2JqZWN0IHRoYXQgc2hvdWxkIHJlcHJlc2VudCB0aGUgYHRoaXNgIHZhcmlhYmxlIGluc2lkZSBsaXN0ZW5lciBmdW5jdGlvbikuXG4gICAgICAgICAqIEBtZW1iZXJPZiBTaWduYWxCaW5kaW5nLnByb3RvdHlwZVxuICAgICAgICAgKiBAbmFtZSBjb250ZXh0XG4gICAgICAgICAqIEB0eXBlIE9iamVjdHx1bmRlZmluZWR8bnVsbFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jb250ZXh0ID0gbGlzdGVuZXJDb250ZXh0O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZWZlcmVuY2UgdG8gU2lnbmFsIG9iamVjdCB0aGF0IGxpc3RlbmVyIGlzIGN1cnJlbnRseSBib3VuZCB0by5cbiAgICAgICAgICogQHR5cGUgU2lnbmFsXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9zaWduYWwgPSBzaWduYWw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIExpc3RlbmVyIHByaW9yaXR5XG4gICAgICAgICAqIEB0eXBlIE51bWJlclxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fcHJpb3JpdHkgPSBwcmlvcml0eSB8fCAwO1xuICAgIH1cblxuICAgIFNpZ25hbEJpbmRpbmcucHJvdG90eXBlID0ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJZiBiaW5kaW5nIGlzIGFjdGl2ZSBhbmQgc2hvdWxkIGJlIGV4ZWN1dGVkLlxuICAgICAgICAgKiBAdHlwZSBib29sZWFuXG4gICAgICAgICAqL1xuICAgICAgICBhY3RpdmUgOiB0cnVlLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZWZhdWx0IHBhcmFtZXRlcnMgcGFzc2VkIHRvIGxpc3RlbmVyIGR1cmluZyBgU2lnbmFsLmRpc3BhdGNoYCBhbmQgYFNpZ25hbEJpbmRpbmcuZXhlY3V0ZWAuIChjdXJyaWVkIHBhcmFtZXRlcnMpXG4gICAgICAgICAqIEB0eXBlIEFycmF5fG51bGxcbiAgICAgICAgICovXG4gICAgICAgIHBhcmFtcyA6IG51bGwsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENhbGwgbGlzdGVuZXIgcGFzc2luZyBhcmJpdHJhcnkgcGFyYW1ldGVycy5cbiAgICAgICAgICogPHA+SWYgYmluZGluZyB3YXMgYWRkZWQgdXNpbmcgYFNpZ25hbC5hZGRPbmNlKClgIGl0IHdpbGwgYmUgYXV0b21hdGljYWxseSByZW1vdmVkIGZyb20gc2lnbmFsIGRpc3BhdGNoIHF1ZXVlLCB0aGlzIG1ldGhvZCBpcyB1c2VkIGludGVybmFsbHkgZm9yIHRoZSBzaWduYWwgZGlzcGF0Y2guPC9wPlxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5fSBbcGFyYW1zQXJyXSBBcnJheSBvZiBwYXJhbWV0ZXJzIHRoYXQgc2hvdWxkIGJlIHBhc3NlZCB0byB0aGUgbGlzdGVuZXJcbiAgICAgICAgICogQHJldHVybiB7Kn0gVmFsdWUgcmV0dXJuZWQgYnkgdGhlIGxpc3RlbmVyLlxuICAgICAgICAgKi9cbiAgICAgICAgZXhlY3V0ZSA6IGZ1bmN0aW9uIChwYXJhbXNBcnIpIHtcbiAgICAgICAgICAgIHZhciBoYW5kbGVyUmV0dXJuLCBwYXJhbXM7XG4gICAgICAgICAgICBpZiAodGhpcy5hY3RpdmUgJiYgISF0aGlzLl9saXN0ZW5lcikge1xuICAgICAgICAgICAgICAgIHBhcmFtcyA9IHRoaXMucGFyYW1zPyB0aGlzLnBhcmFtcy5jb25jYXQocGFyYW1zQXJyKSA6IHBhcmFtc0FycjtcbiAgICAgICAgICAgICAgICBoYW5kbGVyUmV0dXJuID0gdGhpcy5fbGlzdGVuZXIuYXBwbHkodGhpcy5jb250ZXh0LCBwYXJhbXMpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9pc09uY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kZXRhY2goKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaGFuZGxlclJldHVybjtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGV0YWNoIGJpbmRpbmcgZnJvbSBzaWduYWwuXG4gICAgICAgICAqIC0gYWxpYXMgdG86IG15U2lnbmFsLnJlbW92ZShteUJpbmRpbmcuZ2V0TGlzdGVuZXIoKSk7XG4gICAgICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufG51bGx9IEhhbmRsZXIgZnVuY3Rpb24gYm91bmQgdG8gdGhlIHNpZ25hbCBvciBgbnVsbGAgaWYgYmluZGluZyB3YXMgcHJldmlvdXNseSBkZXRhY2hlZC5cbiAgICAgICAgICovXG4gICAgICAgIGRldGFjaCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmlzQm91bmQoKT8gdGhpcy5fc2lnbmFsLnJlbW92ZSh0aGlzLl9saXN0ZW5lciwgdGhpcy5jb250ZXh0KSA6IG51bGw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IGB0cnVlYCBpZiBiaW5kaW5nIGlzIHN0aWxsIGJvdW5kIHRvIHRoZSBzaWduYWwgYW5kIGhhdmUgYSBsaXN0ZW5lci5cbiAgICAgICAgICovXG4gICAgICAgIGlzQm91bmQgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gKCEhdGhpcy5fc2lnbmFsICYmICEhdGhpcy5fbGlzdGVuZXIpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcmV0dXJuIHtib29sZWFufSBJZiBTaWduYWxCaW5kaW5nIHdpbGwgb25seSBiZSBleGVjdXRlZCBvbmNlLlxuICAgICAgICAgKi9cbiAgICAgICAgaXNPbmNlIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lzT25jZTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHJldHVybiB7RnVuY3Rpb259IEhhbmRsZXIgZnVuY3Rpb24gYm91bmQgdG8gdGhlIHNpZ25hbC5cbiAgICAgICAgICovXG4gICAgICAgIGdldExpc3RlbmVyIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xpc3RlbmVyO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcmV0dXJuIHtTaWduYWx9IFNpZ25hbCB0aGF0IGxpc3RlbmVyIGlzIGN1cnJlbnRseSBib3VuZCB0by5cbiAgICAgICAgICovXG4gICAgICAgIGdldFNpZ25hbCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9zaWduYWw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERlbGV0ZSBpbnN0YW5jZSBwcm9wZXJ0aWVzXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICBfZGVzdHJveSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9zaWduYWw7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fbGlzdGVuZXI7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5jb250ZXh0O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IFN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgb2JqZWN0LlxuICAgICAgICAgKi9cbiAgICAgICAgdG9TdHJpbmcgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1tTaWduYWxCaW5kaW5nIGlzT25jZTonICsgdGhpcy5faXNPbmNlICsnLCBpc0JvdW5kOicrIHRoaXMuaXNCb3VuZCgpICsnLCBhY3RpdmU6JyArIHRoaXMuYWN0aXZlICsgJ10nO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG5cbi8qZ2xvYmFsIFNpZ25hbEJpbmRpbmc6ZmFsc2UqL1xuXG4gICAgLy8gU2lnbmFsIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICBmdW5jdGlvbiB2YWxpZGF0ZUxpc3RlbmVyKGxpc3RlbmVyLCBmbk5hbWUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCAnbGlzdGVuZXIgaXMgYSByZXF1aXJlZCBwYXJhbSBvZiB7Zm59KCkgYW5kIHNob3VsZCBiZSBhIEZ1bmN0aW9uLicucmVwbGFjZSgne2ZufScsIGZuTmFtZSkgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEN1c3RvbSBldmVudCBicm9hZGNhc3RlclxuICAgICAqIDxiciAvPi0gaW5zcGlyZWQgYnkgUm9iZXJ0IFBlbm5lcidzIEFTMyBTaWduYWxzLlxuICAgICAqIEBuYW1lIFNpZ25hbFxuICAgICAqIEBhdXRob3IgTWlsbGVyIE1lZGVpcm9zXG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICovXG4gICAgZnVuY3Rpb24gU2lnbmFsKCkge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUgQXJyYXkuPFNpZ25hbEJpbmRpbmc+XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9iaW5kaW5ncyA9IFtdO1xuICAgICAgICB0aGlzLl9wcmV2UGFyYW1zID0gbnVsbDtcblxuICAgICAgICAvLyBlbmZvcmNlIGRpc3BhdGNoIHRvIGF3YXlzIHdvcmsgb24gc2FtZSBjb250ZXh0ICgjNDcpXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdGhpcy5kaXNwYXRjaCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBTaWduYWwucHJvdG90eXBlLmRpc3BhdGNoLmFwcGx5KHNlbGYsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgU2lnbmFsLnByb3RvdHlwZSA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2lnbmFscyBWZXJzaW9uIE51bWJlclxuICAgICAgICAgKiBAdHlwZSBTdHJpbmdcbiAgICAgICAgICogQGNvbnN0XG4gICAgICAgICAqL1xuICAgICAgICBWRVJTSU9OIDogJzEuMC4wJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogSWYgU2lnbmFsIHNob3VsZCBrZWVwIHJlY29yZCBvZiBwcmV2aW91c2x5IGRpc3BhdGNoZWQgcGFyYW1ldGVycyBhbmRcbiAgICAgICAgICogYXV0b21hdGljYWxseSBleGVjdXRlIGxpc3RlbmVyIGR1cmluZyBgYWRkKClgL2BhZGRPbmNlKClgIGlmIFNpZ25hbCB3YXNcbiAgICAgICAgICogYWxyZWFkeSBkaXNwYXRjaGVkIGJlZm9yZS5cbiAgICAgICAgICogQHR5cGUgYm9vbGVhblxuICAgICAgICAgKi9cbiAgICAgICAgbWVtb3JpemUgOiBmYWxzZSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUgYm9vbGVhblxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgX3Nob3VsZFByb3BhZ2F0ZSA6IHRydWUsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElmIFNpZ25hbCBpcyBhY3RpdmUgYW5kIHNob3VsZCBicm9hZGNhc3QgZXZlbnRzLlxuICAgICAgICAgKiA8cD48c3Ryb25nPklNUE9SVEFOVDo8L3N0cm9uZz4gU2V0dGluZyB0aGlzIHByb3BlcnR5IGR1cmluZyBhIGRpc3BhdGNoIHdpbGwgb25seSBhZmZlY3QgdGhlIG5leHQgZGlzcGF0Y2gsIGlmIHlvdSB3YW50IHRvIHN0b3AgdGhlIHByb3BhZ2F0aW9uIG9mIGEgc2lnbmFsIHVzZSBgaGFsdCgpYCBpbnN0ZWFkLjwvcD5cbiAgICAgICAgICogQHR5cGUgYm9vbGVhblxuICAgICAgICAgKi9cbiAgICAgICAgYWN0aXZlIDogdHJ1ZSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXJcbiAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBpc09uY2VcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IFtsaXN0ZW5lckNvbnRleHRdXG4gICAgICAgICAqIEBwYXJhbSB7TnVtYmVyfSBbcHJpb3JpdHldXG4gICAgICAgICAqIEByZXR1cm4ge1NpZ25hbEJpbmRpbmd9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICBfcmVnaXN0ZXJMaXN0ZW5lciA6IGZ1bmN0aW9uIChsaXN0ZW5lciwgaXNPbmNlLCBsaXN0ZW5lckNvbnRleHQsIHByaW9yaXR5KSB7XG5cbiAgICAgICAgICAgIHZhciBwcmV2SW5kZXggPSB0aGlzLl9pbmRleE9mTGlzdGVuZXIobGlzdGVuZXIsIGxpc3RlbmVyQ29udGV4dCksXG4gICAgICAgICAgICAgICAgYmluZGluZztcblxuICAgICAgICAgICAgaWYgKHByZXZJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBiaW5kaW5nID0gdGhpcy5fYmluZGluZ3NbcHJldkluZGV4XTtcbiAgICAgICAgICAgICAgICBpZiAoYmluZGluZy5pc09uY2UoKSAhPT0gaXNPbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignWW91IGNhbm5vdCBhZGQnKyAoaXNPbmNlPyAnJyA6ICdPbmNlJykgKycoKSB0aGVuIGFkZCcrICghaXNPbmNlPyAnJyA6ICdPbmNlJykgKycoKSB0aGUgc2FtZSBsaXN0ZW5lciB3aXRob3V0IHJlbW92aW5nIHRoZSByZWxhdGlvbnNoaXAgZmlyc3QuJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBiaW5kaW5nID0gbmV3IFNpZ25hbEJpbmRpbmcodGhpcywgbGlzdGVuZXIsIGlzT25jZSwgbGlzdGVuZXJDb250ZXh0LCBwcmlvcml0eSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fYWRkQmluZGluZyhiaW5kaW5nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYodGhpcy5tZW1vcml6ZSAmJiB0aGlzLl9wcmV2UGFyYW1zKXtcbiAgICAgICAgICAgICAgICBiaW5kaW5nLmV4ZWN1dGUodGhpcy5fcHJldlBhcmFtcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBiaW5kaW5nO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcGFyYW0ge1NpZ25hbEJpbmRpbmd9IGJpbmRpbmdcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIF9hZGRCaW5kaW5nIDogZnVuY3Rpb24gKGJpbmRpbmcpIHtcbiAgICAgICAgICAgIC8vc2ltcGxpZmllZCBpbnNlcnRpb24gc29ydFxuICAgICAgICAgICAgdmFyIG4gPSB0aGlzLl9iaW5kaW5ncy5sZW5ndGg7XG4gICAgICAgICAgICBkbyB7IC0tbjsgfSB3aGlsZSAodGhpcy5fYmluZGluZ3Nbbl0gJiYgYmluZGluZy5fcHJpb3JpdHkgPD0gdGhpcy5fYmluZGluZ3Nbbl0uX3ByaW9yaXR5KTtcbiAgICAgICAgICAgIHRoaXMuX2JpbmRpbmdzLnNwbGljZShuICsgMSwgMCwgYmluZGluZyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyXG4gICAgICAgICAqIEByZXR1cm4ge251bWJlcn1cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIF9pbmRleE9mTGlzdGVuZXIgOiBmdW5jdGlvbiAobGlzdGVuZXIsIGNvbnRleHQpIHtcbiAgICAgICAgICAgIHZhciBuID0gdGhpcy5fYmluZGluZ3MubGVuZ3RoLFxuICAgICAgICAgICAgICAgIGN1cjtcbiAgICAgICAgICAgIHdoaWxlIChuLS0pIHtcbiAgICAgICAgICAgICAgICBjdXIgPSB0aGlzLl9iaW5kaW5nc1tuXTtcbiAgICAgICAgICAgICAgICBpZiAoY3VyLl9saXN0ZW5lciA9PT0gbGlzdGVuZXIgJiYgY3VyLmNvbnRleHQgPT09IGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDaGVjayBpZiBsaXN0ZW5lciB3YXMgYXR0YWNoZWQgdG8gU2lnbmFsLlxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lclxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gW2NvbnRleHRdXG4gICAgICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IGlmIFNpZ25hbCBoYXMgdGhlIHNwZWNpZmllZCBsaXN0ZW5lci5cbiAgICAgICAgICovXG4gICAgICAgIGhhcyA6IGZ1bmN0aW9uIChsaXN0ZW5lciwgY29udGV4dCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2luZGV4T2ZMaXN0ZW5lcihsaXN0ZW5lciwgY29udGV4dCkgIT09IC0xO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBZGQgYSBsaXN0ZW5lciB0byB0aGUgc2lnbmFsLlxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBTaWduYWwgaGFuZGxlciBmdW5jdGlvbi5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IFtsaXN0ZW5lckNvbnRleHRdIENvbnRleHQgb24gd2hpY2ggbGlzdGVuZXIgd2lsbCBiZSBleGVjdXRlZCAob2JqZWN0IHRoYXQgc2hvdWxkIHJlcHJlc2VudCB0aGUgYHRoaXNgIHZhcmlhYmxlIGluc2lkZSBsaXN0ZW5lciBmdW5jdGlvbikuXG4gICAgICAgICAqIEBwYXJhbSB7TnVtYmVyfSBbcHJpb3JpdHldIFRoZSBwcmlvcml0eSBsZXZlbCBvZiB0aGUgZXZlbnQgbGlzdGVuZXIuIExpc3RlbmVycyB3aXRoIGhpZ2hlciBwcmlvcml0eSB3aWxsIGJlIGV4ZWN1dGVkIGJlZm9yZSBsaXN0ZW5lcnMgd2l0aCBsb3dlciBwcmlvcml0eS4gTGlzdGVuZXJzIHdpdGggc2FtZSBwcmlvcml0eSBsZXZlbCB3aWxsIGJlIGV4ZWN1dGVkIGF0IHRoZSBzYW1lIG9yZGVyIGFzIHRoZXkgd2VyZSBhZGRlZC4gKGRlZmF1bHQgPSAwKVxuICAgICAgICAgKiBAcmV0dXJuIHtTaWduYWxCaW5kaW5nfSBBbiBPYmplY3QgcmVwcmVzZW50aW5nIHRoZSBiaW5kaW5nIGJldHdlZW4gdGhlIFNpZ25hbCBhbmQgbGlzdGVuZXIuXG4gICAgICAgICAqL1xuICAgICAgICBhZGQgOiBmdW5jdGlvbiAobGlzdGVuZXIsIGxpc3RlbmVyQ29udGV4dCwgcHJpb3JpdHkpIHtcbiAgICAgICAgICAgIHZhbGlkYXRlTGlzdGVuZXIobGlzdGVuZXIsICdhZGQnKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZWdpc3Rlckxpc3RlbmVyKGxpc3RlbmVyLCBmYWxzZSwgbGlzdGVuZXJDb250ZXh0LCBwcmlvcml0eSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFkZCBsaXN0ZW5lciB0byB0aGUgc2lnbmFsIHRoYXQgc2hvdWxkIGJlIHJlbW92ZWQgYWZ0ZXIgZmlyc3QgZXhlY3V0aW9uICh3aWxsIGJlIGV4ZWN1dGVkIG9ubHkgb25jZSkuXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIFNpZ25hbCBoYW5kbGVyIGZ1bmN0aW9uLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gW2xpc3RlbmVyQ29udGV4dF0gQ29udGV4dCBvbiB3aGljaCBsaXN0ZW5lciB3aWxsIGJlIGV4ZWN1dGVkIChvYmplY3QgdGhhdCBzaG91bGQgcmVwcmVzZW50IHRoZSBgdGhpc2AgdmFyaWFibGUgaW5zaWRlIGxpc3RlbmVyIGZ1bmN0aW9uKS5cbiAgICAgICAgICogQHBhcmFtIHtOdW1iZXJ9IFtwcmlvcml0eV0gVGhlIHByaW9yaXR5IGxldmVsIG9mIHRoZSBldmVudCBsaXN0ZW5lci4gTGlzdGVuZXJzIHdpdGggaGlnaGVyIHByaW9yaXR5IHdpbGwgYmUgZXhlY3V0ZWQgYmVmb3JlIGxpc3RlbmVycyB3aXRoIGxvd2VyIHByaW9yaXR5LiBMaXN0ZW5lcnMgd2l0aCBzYW1lIHByaW9yaXR5IGxldmVsIHdpbGwgYmUgZXhlY3V0ZWQgYXQgdGhlIHNhbWUgb3JkZXIgYXMgdGhleSB3ZXJlIGFkZGVkLiAoZGVmYXVsdCA9IDApXG4gICAgICAgICAqIEByZXR1cm4ge1NpZ25hbEJpbmRpbmd9IEFuIE9iamVjdCByZXByZXNlbnRpbmcgdGhlIGJpbmRpbmcgYmV0d2VlbiB0aGUgU2lnbmFsIGFuZCBsaXN0ZW5lci5cbiAgICAgICAgICovXG4gICAgICAgIGFkZE9uY2UgOiBmdW5jdGlvbiAobGlzdGVuZXIsIGxpc3RlbmVyQ29udGV4dCwgcHJpb3JpdHkpIHtcbiAgICAgICAgICAgIHZhbGlkYXRlTGlzdGVuZXIobGlzdGVuZXIsICdhZGRPbmNlJyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVnaXN0ZXJMaXN0ZW5lcihsaXN0ZW5lciwgdHJ1ZSwgbGlzdGVuZXJDb250ZXh0LCBwcmlvcml0eSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZSBhIHNpbmdsZSBsaXN0ZW5lciBmcm9tIHRoZSBkaXNwYXRjaCBxdWV1ZS5cbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgSGFuZGxlciBmdW5jdGlvbiB0aGF0IHNob3VsZCBiZSByZW1vdmVkLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gW2NvbnRleHRdIEV4ZWN1dGlvbiBjb250ZXh0IChzaW5jZSB5b3UgY2FuIGFkZCB0aGUgc2FtZSBoYW5kbGVyIG11bHRpcGxlIHRpbWVzIGlmIGV4ZWN1dGluZyBpbiBhIGRpZmZlcmVudCBjb250ZXh0KS5cbiAgICAgICAgICogQHJldHVybiB7RnVuY3Rpb259IExpc3RlbmVyIGhhbmRsZXIgZnVuY3Rpb24uXG4gICAgICAgICAqL1xuICAgICAgICByZW1vdmUgOiBmdW5jdGlvbiAobGlzdGVuZXIsIGNvbnRleHQpIHtcbiAgICAgICAgICAgIHZhbGlkYXRlTGlzdGVuZXIobGlzdGVuZXIsICdyZW1vdmUnKTtcblxuICAgICAgICAgICAgdmFyIGkgPSB0aGlzLl9pbmRleE9mTGlzdGVuZXIobGlzdGVuZXIsIGNvbnRleHQpO1xuICAgICAgICAgICAgaWYgKGkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYmluZGluZ3NbaV0uX2Rlc3Ryb3koKTsgLy9ubyByZWFzb24gdG8gYSBTaWduYWxCaW5kaW5nIGV4aXN0IGlmIGl0IGlzbid0IGF0dGFjaGVkIHRvIGEgc2lnbmFsXG4gICAgICAgICAgICAgICAgdGhpcy5fYmluZGluZ3Muc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGxpc3RlbmVyO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmUgYWxsIGxpc3RlbmVycyBmcm9tIHRoZSBTaWduYWwuXG4gICAgICAgICAqL1xuICAgICAgICByZW1vdmVBbGwgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgbiA9IHRoaXMuX2JpbmRpbmdzLmxlbmd0aDtcbiAgICAgICAgICAgIHdoaWxlIChuLS0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9iaW5kaW5nc1tuXS5fZGVzdHJveSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fYmluZGluZ3MubGVuZ3RoID0gMDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHJldHVybiB7bnVtYmVyfSBOdW1iZXIgb2YgbGlzdGVuZXJzIGF0dGFjaGVkIHRvIHRoZSBTaWduYWwuXG4gICAgICAgICAqL1xuICAgICAgICBnZXROdW1MaXN0ZW5lcnMgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fYmluZGluZ3MubGVuZ3RoO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTdG9wIHByb3BhZ2F0aW9uIG9mIHRoZSBldmVudCwgYmxvY2tpbmcgdGhlIGRpc3BhdGNoIHRvIG5leHQgbGlzdGVuZXJzIG9uIHRoZSBxdWV1ZS5cbiAgICAgICAgICogPHA+PHN0cm9uZz5JTVBPUlRBTlQ6PC9zdHJvbmc+IHNob3VsZCBiZSBjYWxsZWQgb25seSBkdXJpbmcgc2lnbmFsIGRpc3BhdGNoLCBjYWxsaW5nIGl0IGJlZm9yZS9hZnRlciBkaXNwYXRjaCB3b24ndCBhZmZlY3Qgc2lnbmFsIGJyb2FkY2FzdC48L3A+XG4gICAgICAgICAqIEBzZWUgU2lnbmFsLnByb3RvdHlwZS5kaXNhYmxlXG4gICAgICAgICAqL1xuICAgICAgICBoYWx0IDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5fc2hvdWxkUHJvcGFnYXRlID0gZmFsc2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERpc3BhdGNoL0Jyb2FkY2FzdCBTaWduYWwgdG8gYWxsIGxpc3RlbmVycyBhZGRlZCB0byB0aGUgcXVldWUuXG4gICAgICAgICAqIEBwYXJhbSB7Li4uKn0gW3BhcmFtc10gUGFyYW1ldGVycyB0aGF0IHNob3VsZCBiZSBwYXNzZWQgdG8gZWFjaCBoYW5kbGVyLlxuICAgICAgICAgKi9cbiAgICAgICAgZGlzcGF0Y2ggOiBmdW5jdGlvbiAocGFyYW1zKSB7XG4gICAgICAgICAgICBpZiAoISB0aGlzLmFjdGl2ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHBhcmFtc0FyciA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyksXG4gICAgICAgICAgICAgICAgbiA9IHRoaXMuX2JpbmRpbmdzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBiaW5kaW5ncztcblxuICAgICAgICAgICAgaWYgKHRoaXMubWVtb3JpemUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wcmV2UGFyYW1zID0gcGFyYW1zQXJyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoISBuKSB7XG4gICAgICAgICAgICAgICAgLy9zaG91bGQgY29tZSBhZnRlciBtZW1vcml6ZVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYmluZGluZ3MgPSB0aGlzLl9iaW5kaW5ncy5zbGljZSgpOyAvL2Nsb25lIGFycmF5IGluIGNhc2UgYWRkL3JlbW92ZSBpdGVtcyBkdXJpbmcgZGlzcGF0Y2hcbiAgICAgICAgICAgIHRoaXMuX3Nob3VsZFByb3BhZ2F0ZSA9IHRydWU7IC8vaW4gY2FzZSBgaGFsdGAgd2FzIGNhbGxlZCBiZWZvcmUgZGlzcGF0Y2ggb3IgZHVyaW5nIHRoZSBwcmV2aW91cyBkaXNwYXRjaC5cblxuICAgICAgICAgICAgLy9leGVjdXRlIGFsbCBjYWxsYmFja3MgdW50aWwgZW5kIG9mIHRoZSBsaXN0IG9yIHVudGlsIGEgY2FsbGJhY2sgcmV0dXJucyBgZmFsc2VgIG9yIHN0b3BzIHByb3BhZ2F0aW9uXG4gICAgICAgICAgICAvL3JldmVyc2UgbG9vcCBzaW5jZSBsaXN0ZW5lcnMgd2l0aCBoaWdoZXIgcHJpb3JpdHkgd2lsbCBiZSBhZGRlZCBhdCB0aGUgZW5kIG9mIHRoZSBsaXN0XG4gICAgICAgICAgICBkbyB7IG4tLTsgfSB3aGlsZSAoYmluZGluZ3Nbbl0gJiYgdGhpcy5fc2hvdWxkUHJvcGFnYXRlICYmIGJpbmRpbmdzW25dLmV4ZWN1dGUocGFyYW1zQXJyKSAhPT0gZmFsc2UpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGb3JnZXQgbWVtb3JpemVkIGFyZ3VtZW50cy5cbiAgICAgICAgICogQHNlZSBTaWduYWwubWVtb3JpemVcbiAgICAgICAgICovXG4gICAgICAgIGZvcmdldCA6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB0aGlzLl9wcmV2UGFyYW1zID0gbnVsbDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlIGFsbCBiaW5kaW5ncyBmcm9tIHNpZ25hbCBhbmQgZGVzdHJveSBhbnkgcmVmZXJlbmNlIHRvIGV4dGVybmFsIG9iamVjdHMgKGRlc3Ryb3kgU2lnbmFsIG9iamVjdCkuXG4gICAgICAgICAqIDxwPjxzdHJvbmc+SU1QT1JUQU5UOjwvc3Ryb25nPiBjYWxsaW5nIGFueSBtZXRob2Qgb24gdGhlIHNpZ25hbCBpbnN0YW5jZSBhZnRlciBjYWxsaW5nIGRpc3Bvc2Ugd2lsbCB0aHJvdyBlcnJvcnMuPC9wPlxuICAgICAgICAgKi9cbiAgICAgICAgZGlzcG9zZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQWxsKCk7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fYmluZGluZ3M7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fcHJldlBhcmFtcztcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHJldHVybiB7c3RyaW5nfSBTdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIG9iamVjdC5cbiAgICAgICAgICovXG4gICAgICAgIHRvU3RyaW5nIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICdbU2lnbmFsIGFjdGl2ZTonKyB0aGlzLmFjdGl2ZSArJyBudW1MaXN0ZW5lcnM6JysgdGhpcy5nZXROdW1MaXN0ZW5lcnMoKSArJ10nO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG5cbiAgICAvLyBOYW1lc3BhY2UgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIC8qKlxuICAgICAqIFNpZ25hbHMgbmFtZXNwYWNlXG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqIEBuYW1lIHNpZ25hbHNcbiAgICAgKi9cbiAgICB2YXIgc2lnbmFscyA9IFNpZ25hbDtcblxuICAgIC8qKlxuICAgICAqIEN1c3RvbSBldmVudCBicm9hZGNhc3RlclxuICAgICAqIEBzZWUgU2lnbmFsXG4gICAgICovXG4gICAgLy8gYWxpYXMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IChzZWUgI2doLTQ0KVxuICAgIHNpZ25hbHMuU2lnbmFsID0gU2lnbmFsO1xuXG5cblxuICAgIC8vZXhwb3J0cyB0byBtdWx0aXBsZSBlbnZpcm9ubWVudHNcbiAgICBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpeyAvL0FNRFxuICAgICAgICBkZWZpbmUoZnVuY3Rpb24gKCkgeyByZXR1cm4gc2lnbmFsczsgfSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cyl7IC8vbm9kZVxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHNpZ25hbHM7XG4gICAgfSBlbHNlIHsgLy9icm93c2VyXG4gICAgICAgIC8vdXNlIHN0cmluZyBiZWNhdXNlIG9mIEdvb2dsZSBjbG9zdXJlIGNvbXBpbGVyIEFEVkFOQ0VEX01PREVcbiAgICAgICAgLypqc2xpbnQgc3ViOnRydWUgKi9cbiAgICAgICAgZ2xvYmFsWydzaWduYWxzJ10gPSBzaWduYWxzO1xuICAgIH1cblxufSh0aGlzKSk7XG4iLCJpbXBvcnQgU2lnbmFsIGZyb20gJ3NpZ25hbHMnO1xuXG4vKipcbiAqIGV4cG9ydCBhcHBsaWNhdGlvbiBcbiAqIHNpZ25hbHMgZWFjaCBvbmUgZm9yIGRpZmZlcmVudCBhcHAgc3RhdGVzXG4gKi9cbmV4cG9ydCBjb25zdCBzdGF0ZUNoYW5nZWQgXHRcdCBcdD0gbmV3IFNpZ25hbCgpO1xuZXhwb3J0IGNvbnN0IHRyYW5zaXRpb25TdGFydGVkICAgXHQ9IG5ldyBTaWduYWwoKTtcbmV4cG9ydCBjb25zdCB0cmFuc2l0aW9uQ29tcGxldGUgICAgID0gbmV3IFNpZ25hbCgpO1xuZXhwb3J0IGNvbnN0IGFsbFRyYW5zaXRpb25zU3RhcnRlZCAgPSBuZXcgU2lnbmFsKCk7XG5leHBvcnQgY29uc3QgYWxsVHJhbnNpdGlvbkNvbXBsZXRlZCA9IG5ldyBTaWduYWwoKTtcblxuIiwiXG4vKipcbiAqIExvZ2dlciBDbGFzc1xuICogQHJldHVybiB7b2JqZWN0fSBMb2dnZXJcbiAqL1xuZXhwb3J0IGRlZmF1bHQgKGZ1bmN0aW9uKCkge1xuXHRcblx0cmV0dXJuIHtcblxuXHRcdC8qIHRvZ2dsZSBhY3RpdmUgc3RhdGUgKi9cblx0XHRlbmFibGVkIFx0OiB0cnVlLFxuXG5cdFx0aW5pdExvZ2dlciggYWN0aXZlICkge1xuXHRcdFx0dGhpcy5lbmFibGVkID0gIGFjdGl2ZTtcblx0XHR9LFxuXG5cdFx0c2V0U3RhdGUoIGFjdGl2ZSApIHtcblx0XHRcdHRoaXMuZW5hYmxlZCA9IGFjdGl2ZTtcblx0XHR9LFxuXG5cdFx0bG9nKCBtc2cgKSB7XG5cdFx0XHRpZiggdGhpcy5lbmFibGVkICl7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCAgJzo6OjogJysgdGhpcy5uYW1lICsnIDo6OjogWyAnICsgbXNnICsgJyBdICcpO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHRlcnJvciAoIG1zZyApIHtcblx0XHRcdGlmKCB0aGlzLmVuYWJsZWQgKXtcblx0XHRcdFx0Y29uc29sZS5lcnJvcignOjo6OiAnKyB0aGlzLm5hbWUgKycgOjo6OiAqKioqKiBFUlJPUiAqKioqKiAtIFsgJyArIG1zZyArICcgXSAnKTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cbn0pKCk7XG5cbiIsImltcG9ydCB7UHJvbWlzZX0gZnJvbSAnZXM2LXByb21pc2UnO1xuXG4vKipcbiAqIFByb21pc2UgZmFjYWQgb2JqZWN0XG4gKiBjcmVhdGVzIGEgZmFjYWQgZm9yIGFwcGxpY2F0aW9uIHByb21pc2VzLCBcbiAqIGRldGF0Y2hlcyBmZW9tIHRoZSBsaWJyYXJ5IGJlaW5nIHVzZWQgdG8gc2VydmUgcHJvbWlzZXMgdG8gdGhlIGFwcFxuICogQHR5cGUge09iamVjdH1cbiAqL1xubGV0IFByb21pc2VGYWNhZGUgPSB7fTtcblxuXG4vKipcbiAqIERlZmZlciB0aGUgcHJvbWlzZSBcbiAqIEByZXR1cm4ge29iamVjdH0geyByZXNvbHZlIDogZnVuY3Rpb24sIHJlamVjdCA6IGZ1bmN0aW9uIH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIERlZmVycmVkKClcbntcblx0bGV0IHJlc3VsdCA9IHt9O1xuXHRyZXN1bHQucHJvbWlzZSA9IG5ldyBQcm9taXNlKCggcmVzb2x2ZSwgcmVqZWN0ICkgPT5cblx0e1xuXHRcdHJlc3VsdC5yZXNvbHZlID0gcmVzb2x2ZTtcblx0XHRyZXN1bHQucmVqZWN0ICA9IHJlamVjdDtcblx0fSk7XG5cdHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogY3JlYXRlIGEgZmFjYWQgZm9yIGVzNi1wcm9taXNlIGFsbFxuICogb3ZycmlkZGVuIGZhY2FkIHRvIGRpc3BsYXkgZXJyb3IgbG9ncyBmb3IgZGV2ZWxvcG1lbnQgXG4gKiBkdWUgdG8gZXM2LXByb21pc2UgZXJyb3Igc3VwcHJlc3Npb24gaXNzdWVcbiAqIEBwYXJhbSAge2FycmF5fSAgIHByb21pc2VzIFxuICogQHJldHVybiB7ZnVuY3Rpb259IFxuICovXG5leHBvcnQgZnVuY3Rpb24gYWxsKCkge1xuXG5cdGxldCBleHRlcm5hbEVycm9yLFxuXHRcdGVycm9yID0gKGUpID0+IHsgXG5cdFx0XHRjb25zb2xlLmVycm9yKCAnIC0tLSBQUk9NSVNFIENBVUdIVCBFUlJPUiAtLS0gJywgYXJndW1lbnRzWzBdLnN0YWNrLCBlICk7IFxuXHRcdFx0aWYoZXh0ZXJuYWxFcnJvcil7IGV4dGVybmFsRXJyb3IoJ2VzNi1wcm9taXNlIGFsbCBlcnJvciAnLCBhcmd1bWVudHNbMF0uc3RhY2ssIGUpOyB9XG5cdFx0fTtcblx0XHRcblx0cmV0dXJuICgpID0+IHtcblx0XHRsZXQgYWxsID0gUHJvbWlzZS5hbGwoIGFyZ3VtZW50c1swXSApO1xuXHRcdHJldHVybiB7XG5cdFx0XHR0aGVuICgpIHtcblx0XHRcdFx0ZXh0ZXJuYWxFcnJvciA9ICBhcmd1bWVudHNbMV07XG5cdFx0XHRcdGFsbC50aGVuKGFyZ3VtZW50c1swXSkuY2F0Y2goIGVycm9yICk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fShhcmd1bWVudHMpO1xufVxuXG5cbi8qKlxuICogcmV0dXJuIG9iamVjdCBnZXR0ZXJzXG4gKiBcbiAqIC0gYWxsIC0gY2hlY2tzIHRvIHNlZSBpZiBhbGwgcHJvbWlzZXMgaGFzIGNvbXBsZXRlZCBiZWZvcmUgY29udGludWluZ1xuICogLSBQcm9taXNlIC0gcmV0dXJucyBhIFByb21pc2VcbiAqIC0gRGVmZXJyZWQgLSByZXR1cm5zIGFuIHVuIHJlc29sdmVkIHByb21pc2UgYW5kIGFuIG9iamVjdCB3aXRoIHRoZSByZXNvbHZlIGFuZCByZWplY3QgZnVuY3Rpb25zXG4gKiBAcmV0dXJuIHtmdW5jdGlvbn0gICBbZGVzY3JpcHRpb25dXG4gKi9cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSggUHJvbWlzZUZhY2FkZSwgJ2FsbCcsIHsgZ2V0IDogZnVuY3Rpb24oKSB7IHJldHVybiBhbGw7IH0gfSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIFByb21pc2VGYWNhZGUsICdQcm9taXNlJywgeyBnZXQgOiBmdW5jdGlvbigpIHsgcmV0dXJuIFByb21pc2U7IH0gfSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIFByb21pc2VGYWNhZGUsICdEZWZlcnJlZCcsIHsgZ2V0IDogZnVuY3Rpb24oKSB7IHJldHVybiBEZWZlcnJlZDsgfSB9KTtcblxuLyogZXhwb3J0IGRlZmF1bHRzICovXG5leHBvcnQgZGVmYXVsdCBQcm9taXNlRmFjYWRlO1xuIiwiXG5pbXBvcnQgbWl4aW4gXHRmcm9tICcuLi91dGlscy9taXhpbic7XG5pbXBvcnQgTG9nZ2VyIFx0ZnJvbSAnLi4vY29tbW9uL2xvZ2dlcic7XG5cblxuY29uc3QgZGVmYXVsdFZpZXdNYW5hZ2VyID0gbWl4aW4oIHsgbmFtZSA6ICdEZWZhdWx0Vmlld01hbmFnZXInIH0sIExvZ2dlciApO1xuXG5cbi8qIHZpZXdzICovXG5sZXQgdmlld3MgPSB7fTtcblxuLyoqXG4gKiBpbml0aWFsaXplIHRoZSBkZWZhdWx0IHZpZXcgbWFuYWdlclxuICogVXNlZCBpZiBhIHZpZXcgbWFuYWdlciBoYXMgbm90IGJlZW4gc2V0XG4gKiBAcGFyYW0gIHtvYmplY3R9IG9wdGlvbnNcbiAqL1xuZGVmYXVsdFZpZXdNYW5hZ2VyLmluaXQgPSBmdW5jdGlvbiggb3B0aW9ucyApXG57XG5cdHZpZXdzID0gb3B0aW9ucy52aWV3cztcblx0ZGVmYXVsdFZpZXdNYW5hZ2VyLmluaXRMb2dnZXIoIG9wdGlvbnMuZGVidWcgKTtcblxuXHRkZWZhdWx0Vmlld01hbmFnZXIubG9nKCdpbml0aWF0ZWQnKTtcblx0cmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIGZldGNoIHZpZXdcbiAqIEBwYXJhbSAge3N0cmluZ30gdmlld1JlZiBcbiAqIEByZXR1cm4ge29iamVjdH0gcmVxdWVzdGVkIHZpZXdcbiAqL1xuZGVmYXVsdFZpZXdNYW5hZ2VyLmZldGNoVmlldyA9IGZ1bmN0aW9uKCB2aWV3UmVmIClcbntcblx0aWYoIHZpZXdzWyB2aWV3UmVmIF0gKSB7XG5cdFx0cmV0dXJuIHZpZXdzWyB2aWV3UmVmIF07XG5cdH1cbn07XG5cblxuZXhwb3J0IGRlZmF1bHQgZGVmYXVsdFZpZXdNYW5hZ2VyOyIsIlxuaW1wb3J0IGxvZ2dlciBcdFx0XHRmcm9tICcuLi9jb21tb24vbG9nZ2VyLmpzJztcbmltcG9ydCB7c3RhdGVDaGFuZ2VkfSBcdGZyb20gJy4uL2NvbW1vbi9kaXNwYXRjaGVyJztcbmltcG9ydCBkZWZhdWx0UHJvcHMgIFx0ZnJvbSAnLi4vdXRpbHMvZGVmYXVsdCc7XG5pbXBvcnQgbWl4aW5cdFx0ICBcdGZyb20gJy4uL3V0aWxzL21peGluJztcblxuLyogY3JlYXRlIGNsYXNzIGFuZCBleHRlbmQgbG9nZ2VyICovXG5jb25zdCBGU00gPSBtaXhpbih7IG5hbWUgOiAnU3RhdGVNYWNoaW5lJyB9LCBsb2dnZXIgKTtcblxuKGZ1bmN0aW9uKClcbntcdFxuXHRsZXQgXHRfc3RhdGVzIFx0XHRcdFx0PSB7fSxcblx0XHRcdF9jdXJyZW50U3RhdGUgXHRcdFx0PSBudWxsLFxuXHRcdFx0X2luaXRpYWwgXHRcdFx0XHQ9IG51bGwsXG5cdFx0XHRfYWN0aW9uUXVldWUgXHRcdFx0PSBbXSxcblx0XHRcdF9oaXN0b3J5IFx0XHRcdFx0PSBbXSxcblx0XHRcdF9jYW5jZWxsZWQgXHRcdFx0XHQ9IGZhbHNlLFxuXHRcdFx0X3RyYW5zaXRpb25Db21wbGV0ZWQgXHQ9IHRydWUsXG5cdFx0XHRfc3RhdGVDaGFuZ2VkSGFuZGxlciAgICA9IG51bGwsXG5cblx0XHRcdF9vcHRpb25zID0ge1xuXHRcdFx0XHRoaXN0b3J5IFx0XHQ6IGZhbHNlLFxuXHRcdFx0XHRsaW1pdHEgXHQgXHRcdDogdHJ1ZSxcblx0XHRcdFx0cXRyYW5zaXRpb25zXHQ6IHRydWUsXG5cdFx0XHRcdGRlYnVnIFx0IFx0XHQ6IGZhbHNlXG5cdFx0XHR9O1xuXG5cblx0LyoqXG5cdCAqIGNoZWNrIHRvIHNlIGlmIHRoIGFuaW1hdGlvbiBoYXMgY2FuY2VsbGVkIGluIFxuXHQgKiBiZXR3ZWVuIHN0YXRlIHRyYW5zaXRpb25zXG5cdCAqIEByZXR1cm4ge0Jvb2xlYW59IGNhbmNlbGxlZFxuXHQqL1xuXHRmdW5jdGlvbiBpc0NhbmNlbGxlZCgpIHtcblx0XHRpZihfY2FuY2VsbGVkKSB7XG5cdFx0XHRfdHJhbnNpdGlvbkNvbXBsZXRlZCA9IHRydWU7XG5cdFx0XHRfY2FuY2VsbGVkIFx0XHRcdCA9IGZhbHNlO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cblx0LyoqXG5cdCAqIHRyYW5zaXRpb24gdG8gdGhlIG5leHQgc3RhdGVcblx0ICogQHBhcmFtICB7b2JqZWN0fSBuZXh0U3RhdGUgICAgICAgIG5ldyBzdGF0ZSBvYmplY3Rcblx0ICogQHBhcmFtICB7c3RyaW5nfSBhY3Rpb24gICAgICAgICAgIGFjdGlvbklEIFxuXHQgKiBAcGFyYW0gIHtvYmplY3R9IGRhdGEgICAgICAgICAgICAgZGF0YSBzZW50IHdpdGggdGhlIGFjdGlvblxuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IGFjdGlvbklkZW50aWZpZXIgc3RhdGUgYW5kIGFjdGlvbiBjb21iaW5lZCB0byBtYWtlIGEgdW5pcXVlIHN0cmluZ1xuXHQqL1xuXG5cdGZ1bmN0aW9uIF90cmFuc2l0aW9uVG8oIG5leHRTdGF0ZSwgYWN0aW9uLCBkYXRhIClcblx0e1xuXHRcdF9jYW5jZWxsZWQgXHRcdFx0XHQ9IGZhbHNlO1xuXHRcdF90cmFuc2l0aW9uQ29tcGxldGVkIFx0PSBmYWxzZTtcblxuXHRcdGlmKCBpc0NhbmNlbGxlZCgpICkgeyByZXR1cm4gZmFsc2U7IH1cblxuXHRcdGlmKCBfY3VycmVudFN0YXRlICkge1xuXHRcdFx0bGV0IHByZXZpb3VzU3RhdGUgPSBfY3VycmVudFN0YXRlO1xuXHRcdFx0aWYoX29wdGlvbnMuaGlzdG9yeSl7IF9oaXN0b3J5LnB1c2gocHJldmlvdXNTdGF0ZS5uYW1lKTsgfVxuXHRcdH1cblx0XHRcblx0XHRfY3VycmVudFN0YXRlID0gbmV4dFN0YXRlO1xuXG5cdFx0aWYoIGFjdGlvbiApIHtcblx0XHRcdF9zdGF0ZUNoYW5nZWRIYW5kbGVyKCBhY3Rpb24sIGRhdGEgKTsgXG5cdFx0fSBlbHNlIHtcblx0XHRcdF90cmFuc2l0aW9uQ29tcGxldGVkID0gdHJ1ZTtcblx0XHRcdEZTTS5sb2coJ1N0YXRlIHRyYW5zaXRpb24gQ29tcGxldGVkISBDdXJyZW50IFN0YXRlIDo6ICcgKyBfY3VycmVudFN0YXRlLm5hbWUgKTtcblx0XHRcdHN0YXRlQ2hhbmdlZC5kaXNwYXRjaChfY3VycmVudFN0YXRlKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogSWYgc3RhdGVzIGhhdmUgcXVldWVkIHVwXG5cdCAqIGxvb3AgdGhyb3VnaCBhbmQgYWN0aW9uIGFsbCBzdGF0ZXMgaW4gdGhlIHF1ZXVlIHVudGlsXG5cdCAqIG5vbmUgcmVtYWluXG5cdCAqL1xuXHRmdW5jdGlvbiBfcHJvY2Vzc0FjdGlvblF1ZXVlKClcblx0e1x0XG5cdFx0aWYoIF9hY3Rpb25RdWV1ZS5sZW5ndGggPiAwICkge1xuXHRcdFx0dmFyIHN0YXRlRXZlbnQgPSBfYWN0aW9uUXVldWUuc2hpZnQoKTtcblx0XHRcdFxuXHRcdFx0aWYoIV9jdXJyZW50U3RhdGUuZ2V0VGFyZ2V0KHN0YXRlRXZlbnQuYWN0aW9uKSkge1xuXHRcdFx0XHRfcHJvY2Vzc0FjdGlvblF1ZXVlKCk7XG5cdFx0XHR9IFxuXHRcdFx0ZWxzZSB7XG5cdFx0XHR9XHRGU00uYWN0aW9uKCBzdGF0ZUV2ZW50LmFjdGlvbiwgc3RhdGVFdmVudC5kYXRhICk7XG5cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRGU00ubG9nKCdTdGF0ZSB0cmFuc2l0aW9uIENvbXBsZXRlZCEgQ3VycmVudCBTdGF0ZSA6OiAnICsgX2N1cnJlbnRTdGF0ZS5uYW1lICk7XG5cdFx0c3RhdGVDaGFuZ2VkLmRpc3BhdGNoKF9jdXJyZW50U3RhdGUpO1xuXHR9XG5cblx0LyoqXG5cdCAqIHN0YXJ0IEZTTSBcblx0ICogc2V0IHRoZSBpbml0aWFsIHN0YXRlXG5cdCAqL1xuXHRGU00uc3RhcnQgPSBmdW5jdGlvbiggIClcblx0e1xuXHRcdGlmKCFfaW5pdGlhbCkgeyByZXR1cm4gRlNNLmxvZygnRVJST1IgLSBGU00gbXVzdCBoYXZlIGFuIGluaXRpYWwgc3RhdGUgc2V0Jyk7IH1cblx0XHRfdHJhbnNpdGlvblRvKCBfaW5pdGlhbCwgbnVsbCApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiByZXR1cm4gdGhlIGFjdGlvbiBoaXN0b3J5XG5cdCAqIEByZXR1cm4ge2FyYXl9IFxuXHQgKi9cblx0RlNNLmdldEhpc3RvcnkgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gX2hpc3Rvcnk7XG5cdH07XG5cblx0LyoqXG5cdCAqIERPIEFDVElPTlxuXHQgKiBkbyBhY3Rpb24gYW5kIGNoYW5nZSB0aGUgY3VycmVudCBzdGF0ZSBpZlxuXHQgKiB0aGUgYWN0aW9uIGlzIGF2YWlsYWJsZSBhbmQgYWxsb3dlZFxuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IGFjdGlvbiB0byBjYXJyeSBvdXRcblx0ICogQHBhcmFtICB7b2JqZWN0fSBkYXRhIHRvIHNlbmQgd2l0aCB0aGUgc3RhdGVcblx0ICovXG5cdEZTTS5hY3Rpb24gPSBmdW5jdGlvbiggYWN0aW9uLCBkYXRhIClcblx0e1xuXHRcdGlmKCAhX2N1cnJlbnRTdGF0ZSApeyByZXR1cm4gRlNNLmxvZyggJ0VSUk9SIDogWW91IG1heSBuZWVkIHRvIHN0YXJ0IHRoZSBmc20gZmlyc3QnICk7IH1cblx0XHRcblx0XHQvKiBpZiB0cmFuc2l0aW9uaW5nLCBxdWV1ZSB1cCBuZXh0IGFjdGlvbiAqL1xuXHRcdGlmKCFfdHJhbnNpdGlvbkNvbXBsZXRlZCAmJiBfb3B0aW9ucy5xdHJhbnNpdGlvbnMpIHsgXG5cdFx0XHRGU00ubG9nKCd0cmFuc2l0aW9uIGluIHByb2dyZXNzLCBhZGRpbmcgYWN0aW9uIConK2FjdGlvbisnIHRvIHF1ZXVlJyk7XG5cblx0XHRcdC8qIHN0b3JlIHRoZSBhY3Rpb24gZGF0YSAqL1xuXHRcdFx0bGV0IGFjdGlvblN0b3JlID0geyBhY3Rpb24gOiBhY3Rpb24sIGRhdGEgOiBkYXRhIH07XG5cblx0XHRcdGlmKCBfb3B0aW9ucy5saW1pdHEgKSB7XG5cdFx0XHRcdF9hY3Rpb25RdWV1ZVswXSA9IGFjdGlvblN0b3JlO1xuXHRcdFx0fSBcblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRfYWN0aW9uUXVldWVbX2FjdGlvblF1ZXVlLmxlbmd0aF0gPSBhY3Rpb25TdG9yZTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRjb25zdCBcdHRhcmdldCBcdFx0PSBfY3VycmVudFN0YXRlLmdldFRhcmdldCggYWN0aW9uICksXG5cdFx0XHRcdG5ld1N0YXRlIFx0PSBfc3RhdGVzWyB0YXJnZXQgXSxcblx0XHRcdFx0X2FjdGlvbklkIFx0PSBfY3VycmVudFN0YXRlLmlkKCBhY3Rpb24gKTtcblxuXHRcdC8qIGlmIGEgbmV3IHRhcmdldCBjYW4gYmUgZm91bmQsIGNoYW5nZSB0aGUgY3VycmVudCBzdGF0ZSAqL1xuXHRcdGlmKCBuZXdTdGF0ZSApIHtcblx0XHRcdEZTTS5sb2coJ0NoYW5naW5nIHN0YXRlIDo6ICcgKyBfY3VycmVudFN0YXRlLm5hbWUgKyAnID4+PiAnICsgbmV3U3RhdGUubmFtZSApO1xuXHRcdFx0X3RyYW5zaXRpb25UbyggbmV3U3RhdGUsIF9hY3Rpb25JZCwgZGF0YSApO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdEZTTS5lcnJvciggJ1N0YXRlIG5hbWUgOjo6ICcgKyBfY3VycmVudFN0YXRlLm5hbWUgKyAnIE9SIEFjdGlvbjogJyArIGFjdGlvbiArICcgaXMgbm90IGF2YWlsYWJsZScgKTtcblx0XHR9XG5cdH07XG5cblx0LyoqXG5cdCAqIGNhbmNlbCB0aGUgY3VycmVudCB0cmFuc2l0aW9uXG5cdCAqL1xuXHRGU00uY2FuY2VsID0gZnVuY3Rpb24oKSB7IF9jYW5jZWxsZWQgPSB0cnVlOyB9O1xuXG5cblx0LyoqXG5cdCAqIHRyYW5zaXRpb24gY29tcGxldGVkXG5cdCAqIGNhbGxlZCBleHRlcm5hbGx5IG9uY2UgYWxsIHByb2Nlc3NlcyBoYXZlIGNvbXBsZXRlZFxuXHQgKi9cblx0RlNNLnRyYW5zaXRpb25Db21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdF90cmFuc2l0aW9uQ29tcGxldGVkID0gdHJ1ZTtcblx0XHRfcHJvY2Vzc0FjdGlvblF1ZXVlKCk7XG5cdH07XG5cblx0LyoqXG5cdCAqIGFkZCBhIG5ldyBzdGF0ZSB0byB0aGUgRlNNXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSAgc3RhdGUgLSBGU00gU1RBVEVcblx0ICogQHBhcmFtIHtCb29sZWFufSBpc0luaXRpYWxcblx0ICovXG5cdEZTTS5hZGRTdGF0ZSA9IGZ1bmN0aW9uKCBzdGF0ZSwgaXNJbml0aWFsICkge1xuXG5cdFx0aWYoICFfc3RhdGVzIHx8IF9zdGF0ZXNbIHN0YXRlLm5hbWUgXSApIHtcblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH1cblx0XHRcblx0XHRfc3RhdGVzWyBzdGF0ZS5uYW1lIF0gPSBzdGF0ZTtcblx0XHRpZiggaXNJbml0aWFsICkgeyBfaW5pdGlhbCA9IHN0YXRlOyB9XG5cdFx0cmV0dXJuIHN0YXRlO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBpbml0aWFsaXNlIC0gcGFzcyBpbiBzZXR1cCBvcHRpb25zXG5cdCAqIEBwYXJhbSAge29iamVjdH0gb3B0aW9ucyBcblx0ICovXG5cdEZTTS5pbml0ID0gZnVuY3Rpb24oIG9wdGlvbnMgKVxuXHR7XG5cdFx0ZGVmYXVsdFByb3BzKCBfb3B0aW9ucywgb3B0aW9ucyApO1xuXHRcdEZTTS5pbml0TG9nZ2VyKCBfb3B0aW9ucy5kZWJ1ZyApO1xuXHRcdEZTTS5sb2coJ2luaXRpYXRlZCcpO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBjcmVhdGUgc3RhdGVzIGFuZCB0cmFuc2l0aW9ucyBiYXNlZCBvbiBjb25maWcgZGF0YSBwYXNzZWQgaW5cblx0ICogaWYgc3RhdGVzIGFyZSBhbiBhcnJheSwgbG9vcCBhbmQgYXNzaWduIGRhdGFcblx0ICogdG8gbmV3IHN0YXRlIG9iamVjdHNcblx0ICogQHBhcmFtICB7YXJyYXkvb2JqZWN0fSBjb25maWcgLSBbeyBuYW1lLCB0cmFuc2l0aW9ucywgaW5pdGlhbCB9XVxuXHQgKi9cblx0RlNNLmNyZWF0ZSA9IGZ1bmN0aW9uKCBjb25maWcgKVxuXHR7XG5cdFx0aWYoIGNvbmZpZyBpbnN0YW5jZW9mIEFycmF5ICkge1xuXHRcdFx0Y29uZmlnLmZvckVhY2goICggaXRlbSApID0+IHsgdGhpcy5jcmVhdGUoIGl0ZW0gKTsgfSwgdGhpcyApO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHRcdGxldCBpbml0aWFsIFx0XHRcdD0gKF9zdGF0ZXMubGVuZ3RoID09PSAwIHx8IGNvbmZpZy5pbml0aWFsKSxcblx0XHRcdHN0YXRlICBcdFx0XHRcdD0gbmV3IEZTTS5TdGF0ZSggY29uZmlnLm5hbWUsIGluaXRpYWwgKSxcblx0XHRcdHN0YXRlVHJhbnNpdGlvbnMgICAgPSBjb25maWcuc3RhdGVUcmFuc2l0aW9ucyB8fCBbXTtcblxuXHRcdHN0YXRlVHJhbnNpdGlvbnMuZm9yRWFjaCggKHRyYW5zaXRpb24pID0+IHtcblx0XHRcdHN0YXRlLmFkZFRyYW5zaXRpb24oIHRyYW5zaXRpb24uYWN0aW9uLCB0cmFuc2l0aW9uLnRhcmdldCwgdHJhbnNpdGlvbi5faWQgKTtcblx0XHR9KTtcdFxuXG5cdFx0RlNNLmFkZFN0YXRlKCBzdGF0ZSwgaW5pdGlhbCApO1xuXHR9O1xuXHRcblx0LyoqXG5cdCAqIHJldHVybiB0aGUgY3VycmVudCBzdGF0ZVxuXHQgKiBAcmV0dXJuIHtvYmplY3R9IEZTTSBzdGF0ZVxuXHQgKi9cblx0RlNNLmdldEN1cnJlbnRTdGF0ZSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gX2N1cnJlbnRTdGF0ZTsgfTtcblxuXHQvKipcblx0ICogZGlzcG9zZSB0aGUgc3RhdGUgbWFjaGluIFxuXHQgKi9cblx0RlNNLmRpc3Bvc2UgPSBmdW5jdGlvbigpIHtcblx0XHRfc3RhdGVzID0gbnVsbDtcblx0fTtcblx0XG5cdC8qIHNldHMgYSBzdGF0ZXNDaGFuZ2VkIG1ldGhvZCBpbnN0ZWFkIG9mIHVzaW5nIGEgc2lnbmFsICovXG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggRlNNLCAnc3RhdGVDaGFuZ2VkTWV0aG9kJywgeyBzZXQ6IGZ1bmN0aW9uKCBtZXRob2QgKSB7IF9zdGF0ZUNoYW5nZWRIYW5kbGVyID0gbWV0aG9kOyB9IH0pO1xuXG5cblx0LyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiBbIENyZWF0ZSBGU00gU3RhdGVdICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQvKipcblx0ICogRlNNIHN0YXRlIGNsYXNzXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHN0YXRlIG5hbWVcblx0ICovXG5cdEZTTS5TdGF0ZSA9IGZ1bmN0aW9uKCBuYW1lLCBpbml0aWFsIClcblx0e1xuXHRcdHRoaXMuX3RyYW5zaXRpb25zIFx0PSB7fTsgXHQvLyBhdmFpbGFibGUgdHJhbnNpdGlvbnNcblx0XHR0aGlzLl9uYW1lIFx0XHRcdD0gbmFtZTsgLy8gbmFtZSAgICAgICAgICAgICAgXHQgICAgICBcdFxuXHRcdHRoaXMuX2RhdGEgXHRcdFx0PSB7fTsgICAvLyBkYXRhIHRvIGFzc29zY2lhdGUgd2l0aCB0aGUgYWN0aW9uXG5cdFx0dGhpcy5faW5pdGlhbCAgXHRcdD0gaW5pdGlhbDtcblx0fTtcblxuXHRGU00uU3RhdGUucHJvdG90eXBlID0ge1xuXG5cdFx0X2ZldGNoVHJhbnNpdGlvbiA6IGZ1bmN0aW9uKCBhY3Rpb24sIG1ldGhvZCApIHtcblx0XHRcdGlmKCB0aGlzLl90cmFuc2l0aW9uc1sgYWN0aW9uIF0gKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLl90cmFuc2l0aW9uc1sgYWN0aW9uIF1bIG1ldGhvZCBdO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH0sXG5cblx0XHQvKipcblx0XHQgKiBhZGQgdGhlIGF2YWlsYWJsZSB0cmFzaXRpb25zIGZvciBlYWNoIHN0YXRlXG5cdFx0ICogQHBhcmFtIHtzdHJpbmd9IGFjdGlvbiBlLmcuJ0dPVE9IT01FJ1xuXHRcdCAqIEBwYXJhbSB7c3RyaW5nfSB0YXJnZXQgZS5nLiAnSE9NRSdcblx0XHQgKi9cblx0XHRhZGRUcmFuc2l0aW9uIDogZnVuY3Rpb24oIGFjdGlvbiwgdGFyZ2V0LCBhY3Rpb25JZG5lbnRpZmllciApIHtcblx0XHRcdGlmKCB0aGlzLl90cmFuc2l0aW9uc1sgYWN0aW9uIF0gKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0dGhpcy5fdHJhbnNpdGlvbnNbIGFjdGlvbiBdID0geyB0YXJnZXQgOiB0YXJnZXQsIF9pZCA6IGFjdGlvbklkbmVudGlmaWVyIH07XG5cdFx0fSxcblxuXHRcdGdldEFjdGlvbklkIDogZnVuY3Rpb24oIGFjdGlvbiApIHsgcmV0dXJuIHRoaXMuX2ZldGNoVHJhbnNpdGlvbiggYWN0aW9uLCAnX2lkJyApOyB9LFxuXHRcdGdldFRhcmdldCAgIDogZnVuY3Rpb24oIGFjdGlvbiApIHsgcmV0dXJuIHRoaXMuX2ZldGNoVHJhbnNpdGlvbiggYWN0aW9uLCAndGFyZ2V0JyApOyB9XG5cdH07XG5cblx0LyoqXG5cdCAqIGNyZWF0ZSBnZXR0ZXJzIGZvciB0aGUgc3RhdGUgXG5cdCAqICAtIG5hbWVcblx0ICogIC0gdHJhbnNpdGlvbnNcblx0ICogIC0gZGF0YVxuXHQgKi9cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KEZTTS5TdGF0ZS5wcm90b3R5cGUsICduYW1lJywgXHRcdFx0eyBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5fbmFtZTsgfX0gKTtcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KEZTTS5TdGF0ZS5wcm90b3R5cGUsICd0cmFuc2l0aW9ucycsIFx0eyBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5fdHJhbnNpdGlvbnM7IH19ICk7XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShGU00uU3RhdGUucHJvdG90eXBlLCAnZGF0YScsIFx0XHRcdHsgZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMuX2RhdGE7IH19ICk7XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShGU00uU3RhdGUucHJvdG90eXBlLCAnaW5pdGlhbCcsIFx0XHR7IGdldDogZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLl9pbml0aWFsOyB9IH0pO1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoRlNNLlN0YXRlLnByb3RvdHlwZSwgJ2lkJywgXHRcdFx0eyBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5nZXRBY3Rpb25JZDsgfSB9KTtcblxufSkoKTtcblxuZXhwb3J0IGRlZmF1bHQgRlNNO1xuXG5cbiIsIlxuaW1wb3J0IGxvZ2dlciAgXHRcdFx0ZnJvbSAnLi4vY29tbW9uL2xvZ2dlci5qcyc7XG5pbXBvcnQgZGVmYXVsdFByb3BzICBcdGZyb20gJy4uL3V0aWxzL2RlZmF1bHQnO1xuaW1wb3J0IG1peGluXHRcdCAgXHRmcm9tICcuLi91dGlscy9taXhpbic7XG5cbi8qIGRpc3BhdGNoZXIgc2lnbmFscyAqL1xuaW1wb3J0IHtcblx0dHJhbnNpdGlvbkNvbXBsZXRlLFxuXHRhbGxUcmFuc2l0aW9uQ29tcGxldGVkLFxuXHR0cmFuc2l0aW9uU3RhcnRlZCxcblx0YWxsVHJhbnNpdGlvbnNTdGFydGVkXG59IGZyb20gJy4uL2NvbW1vbi9kaXNwYXRjaGVyJztcblxuLyogcHJvbWlzZXMgKi9cbmltcG9ydCB7IFxuXHRhbGwsXG5cdERlZmVycmVkLFxufSBmcm9tICcuLi9jb21tb24vcHJvbWlzZUZhY2FkZSc7XG5cblxuLyogY3JlYXRlIGNsYXNzIGFuZCBleHRlbmQgbG9nZ2VyICovXG5jb25zdCBUcmFuc2l0aW9uQ29udHJvbGxlciA9IG1peGluKHsgbmFtZSA6ICdUcmFuc2l0aW9uQ29udHJvbGxlcicgfSAsIGxvZ2dlcik7XG5cblxuKGZ1bmN0aW9uKClcbntcdFxuXHRsZXQgX3RyYW5pc3Rpb25Db21wbGV0ZSA9IG51bGwsXG5cblx0XHRfb3B0aW9ucyA9IHsgLy8gZGVmYXVsdCBvcHRpb25zXG5cdFx0XHRkZWJ1ZyBcdCBcdFx0XHQ6IGZhbHNlLFxuXHRcdFx0dHJhbnNpdGlvbnMgXHRcdDogbnVsbFxuXHRcdH07XG5cblx0LyoqXG5cdCAqIHRyYW5zaXRpb24gdGhlIHZpZXdzLCBmaW5kIHRoZSB0cmFuc2l0aW9uIG1vZHVsZSBpZiBpdCBcblx0ICogZXhpc3RzIHRoZW4gcGFzcyBpbiB0aGUgbGlua2VkIHZpZXdzLCBkYXRhIGFuZCBzZXR0aW5nc1xuXHQgKiBcblx0ICogQHBhcmFtICB7b25qZWN0fSB0cmFuc2l0aW9uT2JqICAtIGNvbnRhaW5zIHt0cmFuc2l0aW9uVHlwZSwgdmlld3MsIGN1cnJlbnRWaWV3SUQsIG5leHRWaWV3SUR9XG5cdCAqIEBwYXJhbSAge2FycmF5fSB2aWV3c1RvRGlzcG9zZSAgLSBhcnJheSB0byBzdG9yZSB0aGUgdmlld3MgcGFzc2VkIHRvIGVhY2ggbW9kdWxlIHRvIGRpc3BhdGNoIG9uIHRyYW5zaXRpb24gY29tcGxldGVkXG5cdCAqIEByZXR1cm4ge2FycmF5fSBwcm9taXNlcyBmcm9tIERlZmVycmVkIFxuXHQgKi9cblx0ZnVuY3Rpb24gX3RyYW5zaXRpb25WaWV3cyggdHJhbnNpdGlvbk9iaiApXG5cdHtcblx0XHRpZiggIXRyYW5zaXRpb25PYmogKXsgcmV0dXJuIFRyYW5zaXRpb25Db250cm9sbGVyLmVycm9yKCd0cmFuc2l0aW9uIGlzIG5vdCBkZWZpbmVkJyk7IH1cblx0XHRjb25zdCB0cmFuc2l0aW9uTW9kdWxlID0gX29wdGlvbnMudHJhbnNpdGlvbnNbIHRyYW5zaXRpb25PYmoudHJhbnNpdGlvblR5cGUgXTtcblx0XHRcblx0XHRpZiggdHJhbnNpdGlvbk1vZHVsZSApICB7XG5cblx0XHRcdGNvbnN0IFx0ZGVmZXJyZWQgXHRcdD0gRGVmZXJyZWQoKSxcblx0XHRcdFx0XHR2aWV3cyBcdFx0XHQ9IHRyYW5zaXRpb25PYmoudmlld3MsXG5cdFx0XHRcdFx0Y3VycmVudFZpZXdSZWYgXHQ9IHRyYW5zaXRpb25PYmouY3VycmVudFZpZXdJRCxcblx0XHRcdFx0XHRuZXh0Vmlld1JlZiBcdD0gdHJhbnNpdGlvbk9iai5uZXh0Vmlld0lEO1xuXG5cdFx0XHQvKiBpbmRpdmlkdWFsIHRyYW5zaXRpb24gY29tcGxldGVkICovXG5cdFx0XHRkZWZlcnJlZC5wcm9taXNlLnRoZW4oICgpID0+IHtcblx0XHRcdFx0dHJhbnNpdGlvbkNvbXBsZXRlLmRpc3BhdGNoKCB0cmFuc2l0aW9uT2JqICk7XG5cdFx0XHRcdFRyYW5zaXRpb25Db250cm9sbGVyLmxvZyggdHJhbnNpdGlvbk9iai50cmFuc2l0aW9uVHlwZSArJyAtLSBjb21wbGV0ZWQnKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRpZiggdHJhbnNpdGlvbk1vZHVsZS5pbml0aWFsaXplICl7XG5cdFx0XHRcdHRyYW5zaXRpb25Nb2R1bGUuaW5pdGlhbGl6ZSggdmlld3MsIHRyYW5zaXRpb25PYmouZGF0YSwgZGVmZXJyZWQsIGN1cnJlbnRWaWV3UmVmLCBuZXh0Vmlld1JlZiApO1xuXHRcdFx0fVxuXG5cdFx0XHR0cmFuc2l0aW9uU3RhcnRlZC5kaXNwYXRjaCggdHJhbnNpdGlvbk9iaiApO1xuXHRcdFx0VHJhbnNpdGlvbkNvbnRyb2xsZXIubG9nKCB0cmFuc2l0aW9uT2JqLnRyYW5zaXRpb25UeXBlICsnIC0tIHN0YXJ0ZWQnKTtcblx0XHRcdHRyYW5zaXRpb25Nb2R1bGUuYW5pbWF0ZSggdmlld3MsIHRyYW5zaXRpb25PYmouZGF0YSwgZGVmZXJyZWQsIGN1cnJlbnRWaWV3UmVmLCBuZXh0Vmlld1JlZiApO1xuXHRcdFx0XG5cdFx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRUcmFuc2l0aW9uQ29udHJvbGxlci5lcnJvcih0cmFuc2l0aW9uT2JqLnRyYW5zaXRpb25UeXBlICsgJyBkb2VzIE5PVCBleGlzdCcgKTtcblx0XHR9XG5cdH1cblxuXG5cdGZ1bmN0aW9uIF9wcmVwYXJlQW5kU3RhcnQoIHRyYW5zaXRpb25zIClcblx0e1xuXHRcdGNvbnN0IFx0aW5pdGlhbFRyYW5zaWlvbiBcdD0gdHJhbnNpdGlvbnMuc2hpZnQoMCksXG5cdFx0XHRcdHRyYW5zaXRpb25zTGVuZ3RoIFx0PSB0cmFuc2l0aW9ucy5sZW5ndGg7XG5cdFx0XG5cdFx0bGV0IFx0ZGVmZXJyZWRUcmFuc2l0aW9ucyA9IFtdLFxuXHRcdFx0XHRpIFx0XHRcdFx0XHQ9IDAsXG5cdFx0XHRcdHRyYW5zaXRpb25PYmo7XG5cblx0XHQvLyBnZXQgdGhlIGZpcnN0IHRyYW5zaXRpb24gdG8gcHJldmVudCBsb29waW5nIHVubmVjZXNzYXJpbHlcblx0XHRkZWZlcnJlZFRyYW5zaXRpb25zLnB1c2goIF90cmFuc2l0aW9uVmlld3MoIGluaXRpYWxUcmFuc2lpb24gKSApO1xuXG5cdFx0d2hpbGUoIGkgPCB0cmFuc2l0aW9uc0xlbmd0aCApXG5cdFx0e1xuXHRcdFx0dHJhbnNpdGlvbk9iaiBcdD0gdHJhbnNpdGlvbnNbIGkgXTtcblx0XHRcdGRlZmVycmVkVHJhbnNpdGlvbnNbIGRlZmVycmVkVHJhbnNpdGlvbnMubGVuZ3RoIF0gPSBfdHJhbnNpdGlvblZpZXdzKCB0cmFuc2l0aW9uT2JqICk7XG5cblx0XHRcdCsraTtcblx0XHR9XG5cblx0XHQvLyBsaXN0ZW4gZm9yIGNvbXBsZXRlZCBtb2R1bGVzXG5cdFx0YWxsKCBkZWZlcnJlZFRyYW5zaXRpb25zICkudGhlbiggKCkgPT4ge1xuXHRcdFx0VHJhbnNpdGlvbkNvbnRyb2xsZXIubG9nKCd0cmFuc2l0aW9uIHF1ZXVlIGVtcHR5IC0tLS0gYWxsIHRyYW5zaXRpb25zIGNvbXBsZXRlZCcpO1xuXG5cdFx0XHRfdHJhbmlzdGlvbkNvbXBsZXRlKCk7XG5cdFx0XHRhbGxUcmFuc2l0aW9uQ29tcGxldGVkLmRpc3BhdGNoKCk7XG5cblx0XHR9LCBUcmFuc2l0aW9uQ29udHJvbGxlci5lcnJvciApO1xuXG5cdH1cblxuXHQvKipcblx0ICogcmVtb3ZlIGEgbW9kdWxlIGJ5IG5hbWUgZnJvbSB0aGUgZGljdGlvbmFyeSBcblx0ICogb2YgbW9kdWxlcyBpZiB0aGV5IGV4aXN0XG5cdCAqIFxuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IG1vZHVsZU5hbWUgW1xuXHQgKiBAcmV0dXJuIHtvYmplY3R9IFRyYW5zaXRpb25Db250cm9sbGVyXG5cdCAqL1xuXHRUcmFuc2l0aW9uQ29udHJvbGxlci5yZW1vdmVNb2R1bGUgPSBmdW5jdGlvbiggbW9kdWxlTmFtZSApXG5cdHtcblx0XHRpZiggIW1vZHVsZU5hbWUgKSB7IHJldHVybiBmYWxzZTsgfVxuXG5cdFx0aWYoIG1vZHVsZU5hbWUgaW5zdGFuY2VvZiBBcnJheSApIHtcblx0XHRcdG1vZHVsZU5hbWUuZm9yRWFjaChmdW5jdGlvbihtb2R1bGUpIHtcblx0XHRcdFx0dGhpcy5yZW1vdmVNb2R1bGUoIG1vZHVsZSApO1xuXHRcdFx0fSwgdGhpcyApO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHRcdFxuXHRcdGlmKCAgX29wdGlvbnMudHJhbnNpdGlvbnNbIG1vZHVsZU5hbWUgXSApIHtcblx0XHRcdGRlbGV0ZSBfb3B0aW9ucy50cmFuc2l0aW9uc1sgbW9kdWxlTmFtZSBdO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogQWRkIG1vZHVsZSBieSBuYW1lIFxuXHQgKiBAcGFyYW0ge3N0cmluZy9hcnJheX0gbW9kdWxlTmFtZSBbZGVzY3JpcHRpb25dXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBtb2R1bGUgLSB0cmFuc2l0aW9uIG1vZHVsZSBjbGFzc1xuXHQgKiBAcmV0dXJuIHtvYmplY3R9IFRyYW5zaXRpb25Db250cm9sbGVyXG5cdCAqL1xuXHRUcmFuc2l0aW9uQ29udHJvbGxlci5hZGRNb2R1bGUgPSBmdW5jdGlvbiggbW9kdWxlTmFtZSwgbW9kdWxlIClcblx0e1xuXHRcdGlmKCAhbW9kdWxlTmFtZSApIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0aWYoIG1vZHVsZU5hbWUgaW5zdGFuY2VvZiBBcnJheSApIHtcblx0XHRcdFxuXHRcdFx0bW9kdWxlTmFtZS5mb3JFYWNoKGZ1bmN0aW9uKG1vZHVsZURhdGEpIHtcblx0XHRcdFx0bGV0IGtleSA9IE9iamVjdC5rZXlzKG1vZHVsZURhdGEpWzBdO1xuXHRcdFx0XHR0aGlzLmFkZE1vZHVsZSgga2V5ICwgbW9kdWxlRGF0YVtrZXldICk7XG5cdFx0XHR9LCB0aGlzICk7XG5cblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblxuXHRcdGlmKCBfb3B0aW9ucy50cmFuc2l0aW9uc1sgbW9kdWxlTmFtZSBdICkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRfb3B0aW9ucy50cmFuc2l0aW9uc1sgbW9kdWxlTmFtZSBdID0gbW9kdWxlO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblxuXHQvKipcblx0ICogc3RhcnQgcHJvY2Vzc2luZyB0aGUgcmVxdWVzdGVkIHRyYW5zaXRpb25cblx0ICogQHBhcmFtICB7YXJyYXkvb2JqZWN0fSAtIHRyYW5zaXRpb24gb2JqZWN0cyBvciBhcnJheSBvZiB5dHJhbnNpdGlvbiBvYmplY3RzXG5cdCAqL1xuXHRUcmFuc2l0aW9uQ29udHJvbGxlci5wcm9jZXNzVHJhbnNpdGlvbiA9IGZ1bmN0aW9uKCB0cmFuc2l0aW9ucyApXG5cdHtcblx0XHRhbGxUcmFuc2l0aW9uc1N0YXJ0ZWQuZGlzcGF0Y2goIHRyYW5zaXRpb25zICk7XG5cblx0XHQvLyBwcmVwYXJlIGFuZCBzdGFydCB0aGUgdHJhbnNpdGlvbnNcblx0XHRUcmFuc2l0aW9uQ29udHJvbGxlci5sb2coJy0tIHN0YXJ0IHRyYW5zaXRpb25pbmcgdmlld3MgLS0nKTtcblx0XHRfcHJlcGFyZUFuZFN0YXJ0KCB0cmFuc2l0aW9ucyApO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIGluaXQgdGhlIHRyYW5zaXRpb24gY29udHJvbGxlclxuXHQgKiBAcGFyYW0gIHtvYmplY3R9IG9wdGlvbnMgLSBvcHRpb25zIHRvIG92ZXJyaWRlIGRlZmF1bHRzXG5cdCAqL1xuXHRUcmFuc2l0aW9uQ29udHJvbGxlci5pbml0ID0gZnVuY3Rpb24oIG9wdGlvbnMgKVxuXHR7XG5cdFx0Ly8gZ2V0IHRyYW5zaXRpb25zIGZyb20gaW5pdCBvcHRpb25zXG5cdFx0ZGVmYXVsdFByb3BzKCBfb3B0aW9ucywgb3B0aW9ucyApO1xuXG5cdFx0VHJhbnNpdGlvbkNvbnRyb2xsZXIuaW5pdExvZ2dlciggX29wdGlvbnMuZGVidWcgKTtcblx0XHRUcmFuc2l0aW9uQ29udHJvbGxlci5sb2coJ2luaXRpYXRlZCcpO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBsaW5rIGV4dGVybmFsIG1ldGhpZCB0byBjaGFuZ2UgdGhlIHRyYW5zaXRpb24gY29tcGxldGVkeCBzdGF0ZVxuXHQgKi9cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KFRyYW5zaXRpb25Db250cm9sbGVyLCAndHJhbnNpdGlvbkNvbXBsZXRlZCcsIHsgc2V0KCBtZXRob2QgKSB7IF90cmFuaXN0aW9uQ29tcGxldGUgPSBtZXRob2Q7IH0gIH0pO1xuXG5cblxufSkoKTtcblxuXG5cbmV4cG9ydCBkZWZhdWx0IFRyYW5zaXRpb25Db250cm9sbGVyOyIsIlxuaW1wb3J0IGxvZ2dlciAgXHRcdFx0ZnJvbSAnLi4vY29tbW9uL2xvZ2dlci5qcyc7XG5pbXBvcnQgZGVmYXVsdFByb3BzICBcdGZyb20gJy4uL3V0aWxzL2RlZmF1bHQnO1xuaW1wb3J0IG1peGluXHRcdCAgXHRmcm9tICcuLi91dGlscy9taXhpbic7XG5cbmltcG9ydCB7IFxuXHRhbGwsXG5cdERlZmVycmVkIFxufSBmcm9tICcuLi9jb21tb24vcHJvbWlzZUZhY2FkZSc7XG5cbi8qIGNyZWF0ZSBjbGFzcyBhbmQgZXh0ZW5kIGxvZ2dlciAqL1xuY29uc3QgVFZNID0gbWl4aW4oeyBuYW1lIDogJ1RyYW5zaXRpb25WaWV3TWFuYWdlcicgfSwgbG9nZ2VyICk7XG5cbihmdW5jdGlvbigpe1xuXG5cdGxldCBfdmlld3NSZWFkeU1ldGhvZCA9IG51bGwsXG5cdFx0dmlld0NhY2hlIFx0XHQgID0ge30sXG5cblx0Ly8gb3B0aW9ucyB3aXRoIGRlZmF1bHRzXG5cdF9vcHRpb25zIFx0XHRcdFx0PSB7XG5cdFx0Y29uZmlnICBcdFx0XHQ6IG51bGwsXG5cdFx0dmlld01hbmFnZXIgXHRcdDogbnVsbCxcblx0XHRkZWJ1ZyBcdFx0XHRcdDogZmFsc2UsXG5cdFx0dXNlQ2FjaGUgXHRcdFx0OiBmYWxzZVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBsb29wIHRocm91Z2ggYWxsIHRyYW5zaXRpb24gbW9kdWxlcyBhbmQgcHJlcGFyZSB0aGVcblx0ICogdmlld3MgcmVxdWVzdGVkIGJ5IHRoZSBjb25maWdcblx0ICogXG5cdCAqIEBwYXJhbSAge29iamVjdH0gYWN0aW9uRGF0YSBjb250YWluaW5nIGFsbCB0cmFuc2l0aW9uIHR5cGVzIGFuZCB2aWV3cyByZXF1aXJlZFxuXHQgKiBAcGFyYW0gIHtvYmplY3R9IHBhcmFtRGF0YSBzZW50IHdpdGggdGhlIGFjdGlvblxuXHQgKiBAcmV0dXJuIHtvYmplY3R9IHByb21pc2VzIGFycmF5IGFuZCBwZXBhcmVkIHZpZXdzIGFycmF5XG5cdCAqL1xuXHRmdW5jdGlvbiBfcHJlcGFyZVZpZXdzKCBhY3Rpb25EYXRhLCBwYXJhbURhdGEgKVxuXHR7XG5cdFx0bGV0IGxpbmtlZFRyYW5zc01vZHVsZXMgPSBhY3Rpb25EYXRhLmxpbmtlZFZUcmFuc01vZHVsZXMsIC8vIGxvb2sgaW50byBzbGljZSBzcGVlZCBvdmVyIGNyZWF0aW5nIG5ldyBhcnJheVxuXHRcdCBcdFZpZXdzTW9kdWxlTGVuZ3RoIFx0PSBsaW5rZWRUcmFuc3NNb2R1bGVzLmxlbmd0aCxcblx0XHQgXHRwcm9taXNlcyBcdFx0XHQ9IFtdLFxuXHRcdCBcdHByZXBhcmVkVmlld3MgXHRcdD0gW10sXG5cdFx0IFx0YWN0aW9uRGF0YUNsb25lIFx0PSBudWxsLFxuXHRcdCBcdHZpZXdDYWNoZSBcdFx0XHQ9IHt9LFxuXHRcdCBcdGkgXHRcdFx0XHRcdD0gMCxcblx0XHQgXHR2aWV3c01vZHVsZU9iamVjdDtcblxuXHQgXHRcdHdoaWxlKCBpIDwgVmlld3NNb2R1bGVMZW5ndGggKSB7XG4gXHRcdFx0XHR2aWV3c01vZHVsZU9iamVjdCBcdFx0XHRcdFx0ICA9IGxpbmtlZFRyYW5zc01vZHVsZXNbaV07XG5cdCBcdFx0XHRhY3Rpb25EYXRhQ2xvbmUgXHRcdFx0XHRcdCAgPSBfY2xvbmVWaWV3U3RhdGUoIGFjdGlvbkRhdGEsIHZpZXdzTW9kdWxlT2JqZWN0LCBwYXJhbURhdGEgKTsgXG5cdCBcdFx0XHRwcmVwYXJlZFZpZXdzWyBwcmVwYXJlZFZpZXdzLmxlbmd0aCBdID0gX2ZldGNoVmlld3MoIHZpZXdzTW9kdWxlT2JqZWN0LnZpZXdzLCBhY3Rpb25EYXRhQ2xvbmUsIHByb21pc2VzLCB2aWV3Q2FjaGUpO1xuXHQgXHRcdFx0XG5cdCBcdFx0XHQrK2k7XG5cdCBcdFx0fVxuXG5cdCBcdFx0dmlld0NhY2hlID0gbnVsbDtcblx0XHQgXHRyZXR1cm4geyBwcm9taXNlcyA6IHByb21pc2VzLCBwcmVwYXJlZFZpZXdzIDogcHJlcGFyZWRWaWV3cyB9O1xuXHR9XG5cblx0LyoqXG5cdCAqIGxvb3AgdGhyb3VnaCBhbmQgZmV0Y2ggYWxsIHRoZSByZXF1ZXN0ZWQgdmlld3MsIHVzZSB2aWV3UmVhZHlcblx0ICogYW5kIGNvbGxlY3QgYSBwcm9taXNlIGZvciBlYWNoIHRvIGFsbG93IHRoZSB2aWV3IHRvIGJ1aWxkIHVwIGFuZCBwZXJmb3JtIFxuXHQgKiBpdHMgcHJlcGVyYXRpb24gdGFza3MgaWYgcmVxdWlyZWRcblx0ICogXG5cdCAqIEBwYXJhbSAge2FycmF5fSB2aWV3cyAtIHN0cmluZyByZWZlcmVuY2VzXG5cdCAqIEBwYXJhbSAge29iamVjdH0gYWN0aW9uRGF0YUNsb25lIC0gY2xvbmVkIGRhdGEgYXMgdG8gbm90IG92ZXJyaWRlIGNvbmZpZ1xuXHQgKiBAcGFyYW0gIHthcnJheX0gcHJvbWlzZXMgLSBjb2xsZWN0IGFsbCB2aWV3IHByb21pc2VzXG5cdCAqIEBwYXJhbSAge29iamVjdH0gdmlld0NhY2hlIC0gcHJldmVudHMgdmlld3MgZnJvbSBiZWluZyBpbnN0YW50aWF0ZWQgYW5kIHJlcXVlc3RlZCBtb3JlIHRoYW4gb25jZVxuXHQgKiBAcmV0dXJuIHtvYmplY3R9IHBvcHVsYXRlZCBhY3Rpb25EYXRhQ2xvbmUgZGF0YSBvYmplY3Rcblx0ICovXG5cdGZ1bmN0aW9uIF9mZXRjaFZpZXdzKCB2aWV3c1RvUHJlcGFyZSwgYWN0aW9uRGF0YUNsb25lLCBwcm9taXNlcywgdmlld0NhY2hlIClcblx0e1xuXHRcdGNvbnN0IHZpZXdzIFx0XHQ9IHZpZXdzVG9QcmVwYXJlLFxuXHRcdFx0ICB2aWV3TWFuYWdlciBcdD0gX29wdGlvbnMudmlld01hbmFnZXIsXG5cdFx0XHQgIGxlbmd0aCBcdFx0PSB2aWV3cy5sZW5ndGgsXG5cdFx0XHQgIGN1cnJlbnRWaWV3SUQgPSBhY3Rpb25EYXRhQ2xvbmUuY3VycmVudFZpZXdJRCxcblx0XHRcdCAgbmV4dFZpZXdJRCBcdD0gYWN0aW9uRGF0YUNsb25lLm5leHRWaWV3SUQ7XG5cblx0XHRsZXQgaSA9IDAsXG5cdFx0XHRfZGVmZXJyZWQsXG5cdFx0XHR2aWV3LFxuXHRcdFx0Zm91bmRWaWV3LFxuXHRcdFx0cGFyc2VkUmVmLFxuXHRcdFx0dmlld1JlZjtcblxuXHRcdHdoaWxlKCBpIDwgbGVuZ3RoIClcblx0XHR7XG5cdFx0XHR2aWV3UmVmID0gdmlld3NbIGkgXTtcblxuXHRcdFx0aWYodmlld1JlZilcblx0XHRcdHtcblx0XHRcdFx0Zm91bmRWaWV3ID0gdmlld0NhY2hlWyB2aWV3UmVmIF07XG5cblx0XHRcdFx0aWYoIWZvdW5kVmlldykgeyAvLyBjYWNoZSB0aGUgdmlldyBpbnN0YW5jZSBmb3IgcmV1c2UgaWYgbmVlZGVkXG5cdFx0XHRcdFx0Zm91bmRWaWV3ID0gdmlld0NhY2hlWyB2aWV3UmVmIF0gPSB2aWV3TWFuYWdlci5mZXRjaFZpZXcoIHZpZXdSZWYgKTtcblx0XHRcdFx0XHRfZGVmZXJyZWQgPSBEZWZlcnJlZCgpO1xuXHRcdFx0XHRcdHByb21pc2VzWyBwcm9taXNlcy5sZW5ndGggXSA9IF9kZWZlcnJlZC5wcm9taXNlO1xuXG5cdFx0XHRcdFx0aWYoICFmb3VuZFZpZXcgKXsgcmV0dXJuIFRWTS5lcnJvciggdmlld1JlZisnIGlzIHVuZGVmaW5lZCcgKTsgfVxuXG5cdFx0XHRcdFx0aWYoIGZvdW5kVmlldy5wcmVwYXJlVmlldyApeyBmb3VuZFZpZXcucHJlcGFyZVZpZXcoIF9kZWZlcnJlZCApOyB9XG5cdFx0XHRcdFx0ZWxzZSB7IF9kZWZlcnJlZC5yZXNvbHZlKCk7IH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZpZXcgPSBmb3VuZFZpZXc7XG5cblx0XHRcdFx0LyogY2hhbmdlIHJlZiB0byBjdXJyZW50IHZpZXcgb3IgbmV4dCB2aWV3IHRvIGFsbG93IGdlbmVyYWwgdHJhbnNpdGlvbnMgKi9cblx0XHRcdFx0cGFyc2VkUmVmID0gX3ZpZXdSZWYodmlld1JlZiwgWyBjdXJyZW50Vmlld0lELCBuZXh0Vmlld0lEIF0pO1xuXHRcdFx0XHRpZiggcGFyc2VkUmVmICkge1xuXHRcdFx0XHRcdGFjdGlvbkRhdGFDbG9uZS52aWV3c1sgcGFyc2VkUmVmIF0gPSB2aWV3O1xuXHRcdFx0XHR9XG5cdFx0XHRcdGFjdGlvbkRhdGFDbG9uZS52aWV3c1sgdmlld1JlZiBdID0gdmlldztcblx0XHRcdH1cblxuXHRcdFx0KytpO1xuXHRcdH1cblx0XHRcblx0XHRyZXR1cm4gYWN0aW9uRGF0YUNsb25lO1xuXHR9XG5cblx0LyoqXG5cdCAqIGNvbnZlcnQgdmlldyBuYW1lZCByZWZlcmVuY2VzIHRvIGVpdGhlciBjdXJyZW50IHZpZXdcblx0ICogb3IgbmV4dCB2aWV3IGlmIHRoZSBJRCdzIG1hdGNoXG5cdCAqIE1ha2VzIGl0IGVhc2llciB0byBhY2Nlc3MgYW5kIGJ1aWxkIGdlbmVyaWMgdXNlIGNhc2VzXG5cdCAqIFxuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IHJlZiBjdXJyZW50IFZpZXcgSURcblx0ICogQHBhcmFtICB7YXJyYXl9IGNvbXBhcmlzb25WaWV3cyAtIGN1cnJlbnRWaWV3IGFuZCBuZXh0VmlldyBzdHJpbmcgSURTXG5cdCAqIEByZXR1cm4ge3N0cmluZ30gLSBuZXcgSURTIGlmIG1hdGNoZWRcblx0ICovXG5cdGZ1bmN0aW9uIF92aWV3UmVmKCByZWYsIGNvbXBhcmlzb25WaWV3cyApIHtcblx0IFx0dmFyIGluZGV4ID0gY29tcGFyaXNvblZpZXdzLmluZGV4T2YoIHJlZiApO1xuXHQgXHRcdHJldHVybiAoaW5kZXggPT09IC0xICk/IG51bGwgOiBbJ2N1cnJlbnRWaWV3JywgJ25leHRWaWV3J11bIGluZGV4IF07XG5cdH1cblxuXG5cdC8qKlxuXHQgKiByZXR1cm4gY2FjaGVkIHZpZXdzIGJhc2VkIG9uIGFjdGlvbiB0eXBlXG5cdCAqIEBwYXJhbSAge2FycmF5fSBjYWNoZWQgLSBwcmV2aW91c2x5IHByZXBhcmVkIHZpZXdzXG5cdCAqIEBwYXJhbSAge29iamVjdH0gZGF0YSAtIGFjdGlvbiBkYXRhIHBhc3NlZCB0aHJvdWdoIHdpdGggYWN0aW9uXG5cdCAqIEByZXR1cm4ge2FycmF5fSAtIGNhY2hlZCB2aWV3c1xuXHQgKi9cblx0ZnVuY3Rpb24gX2dldENhY2hlZCggY2FjaGVkLCBkYXRhIClcblx0e1xuXHRcdGlmKCAhZGF0YSApeyByZXR1cm4gY2FjaGVkOyB9XG5cblx0XHRsZXQgaSA9IC0xLCBsZW4gPSBjYWNoZWQubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoKytpIDwgbGVuKSB7XG4gICAgICAgICAgICBjYWNoZWRbaV0uZGF0YSA9IGRhdGE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNhY2hlZDtcblx0fVxuXG5cdC8qKlxuXHQgKiBjbG9uZSB0aGUgYWN0aW9uIGRhdGEgb2JqZWN0XG5cdCAqIGZhc3QgY2xvbmUgYW5kIHByZXZlbnRzIHRoZSBjb25maWcgcmVmZXJlbmNlcyB0byBiZVxuXHQgKiBvd2VyaWRlbiBieSBpbnN0YW5jZXMgb3Igb3RoZXIgc2V0dGluZ3Ncblx0ICogQHBhcmFtICB7b2JqZWN0fSBhY3Rpb25EYXRhIHBhc3NlZCBpbiBmcm9tIHRoZSBjb25maWdcblx0ICogQHBhcmFtICB7b2JqZWN0fSB0cmFuc2l0aW9uT2JqZWN0IC0gYWN0aW9uIGRhdGEgdHJhbnNpdGlvblxuXHQgKiBAcGFyYW0gIHtvYmplY3R9IHBhcmFtRGF0YSBzZW50IHdpdGggdGhlIGFjdGlvblxuXHQgKiBAcmV0dXJuIHtvYmplY3R9IG5ldyBvYmplY3Qgd2l0aCBhbiBpbnN0YW5jZSBvciByZWZlcmVuY2UgZnJvbSB0aGUgcGFyYW1zXG5cdCAqL1xuXHRmdW5jdGlvbiBfY2xvbmVWaWV3U3RhdGUoIGFjdGlvbkRhdGEsIHRyYW5zaXRpb25PYmplY3QsIHBhcmFtRGF0YSApIHtcblx0IFx0cmV0dXJuIHtcblx0XHRcdGRhdGEgXHRcdFx0OiBwYXJhbURhdGEsXG5cdFx0XHRjdXJyZW50Vmlld0lEIFx0OiBhY3Rpb25EYXRhLmN1cnJlbnRWaWV3LCAvLyBvcHRpb25hbFxuXHRcdCBcdG5leHRWaWV3SUQgXHRcdDogYWN0aW9uRGF0YS5uZXh0VmlldywgXHQgIC8vIG9wdGlvbmFsXG5cdFx0IFx0dmlld3MgXHRcdFx0OiB7fSxcblx0XHQgXHR0cmFuc2l0aW9uVHlwZSAgOiB0cmFuc2l0aW9uT2JqZWN0LnRyYW5zaXRpb25UeXBlXG5cdCBcdH07XG5cdH1cblxuXHQvKipcblx0ICogcHJvY2Vzc1ZpZXdzIC0gc3RhcnQgcHJlcGFyaW5nIHRoZSB2aWV3c1xuXHQgKiBGaW5kIHZpZXdzIGJ5IHRoZWlyIGFjdGlvbiBJRCBpbiB0aGUgY29uZmlnXG5cdCAqIFxuXHQgKiBAcGFyYW0gIHtvYmplY3R8c3RyaW5nfSBhY3Rpb25JRCBcblx0ICogQHBhcmFtICB7b2JqZWN0fSBkYXRhICBwYXNzZWQgYnkgdGhlIGFjdGlvblxuXHQgKi9cblx0VFZNLnByb2Nlc3NWaWV3cyA9IGZ1bmN0aW9uKCBhY3Rpb25JRCwgZGF0YSApXG5cdHtcblx0XHRpZiggIV9vcHRpb25zLmNvbmZpZyApICB7IHJldHVybiBUVk0uZXJyb3IoJ0EgRGF0YSBDb25maWcgb2JqZWN0IG11c3QgYmUgc2V0IHZpYTogVmlld01hbmFnZXIuY3JlYXRlJyApOyB9XG5cdFx0aWYoICFhY3Rpb25JRCApXHRcdFx0eyByZXR1cm4gVFZNLmVycm9yKCdwcm9jZXNzVmlld3MgKmFjdGlvbklEIGlzIHVuZGVmaW5lZCcgKTsgIH1cblxuXG5cdFx0aWYoX29wdGlvbnMudXNlQ2FjaGUgJiYgdmlld0NhY2hlWyBhY3Rpb25JRCBdICkge1xuXHRcdFx0X3ZpZXdzUmVhZHlNZXRob2QoIF9nZXRDYWNoZWQoIHZpZXdDYWNoZVsgYWN0aW9uSUQgXSwgZGF0YSApICk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Y29uc3QgYWN0aW9uRGF0YSAgPSBfb3B0aW9ucy5jb25maWdbIGFjdGlvbklEIF07XG5cdFx0aWYoIGFjdGlvbkRhdGEgKSB7XG5cblx0XHRcdGxldCBwcm9jZXNzZWRBY3Rpb24gXHQgID0gX3ByZXBhcmVWaWV3cyggYWN0aW9uRGF0YSwgZGF0YSApLFxuXHRcdFx0XHRwYXJzZWRBY3Rpb25EYXRhIFx0ICA9IHByb2Nlc3NlZEFjdGlvbi5wcmVwYXJlZFZpZXdzLFxuXHRcdFx0XHRwZW5kaW5nUHJvbWlzZXMgXHQgID0gcHJvY2Vzc2VkQWN0aW9uLnByb21pc2VzO1xuXG5cdFx0XHRcdHZpZXdDYWNoZVsgYWN0aW9uSUQgXSA9IHBhcnNlZEFjdGlvbkRhdGEuc2xpY2UoMCk7XG5cblx0XHRcdC8vIHBhcnNlIHRoZSB2aWV3cyBhbmQgd2FpdCBmb3IgdGhlbSB0byBmaW5pc2ggcHJlcGFyaW5nIHRoZW1zZWx2ZXNcblx0XHRcdGFsbCggcGVuZGluZ1Byb21pc2VzICkudGhlbiggKCkgPT4geyBcblx0XHRcdFx0VFZNLmxvZygnVmlld3MgbG9hZGVkIGFuZCByZWFkeSBmb3IgLS0tLS0gJythY3Rpb25JRCk7XG5cblx0XHRcdFx0Ly8qIHZpZXdzIGFyZSByZWFkeSwgZGlzcGF0Y2ggdGhlbSAqLy9cblx0XHRcdFx0X3ZpZXdzUmVhZHlNZXRob2QoIHBhcnNlZEFjdGlvbkRhdGEgKTtcblxuXHRcdFx0fSwgVFZNLmVycm9yICk7XG5cblx0XHR9IGVsc2Uge1xuXHRcdFx0VFZNLmVycm9yKCdwcm9jZXNzVmlld3MgKmFjdGlvbkRhdGEgaXMgdW5kZWZpbmVkJyk7XG5cdFx0fVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBDcmVhdGUgdGhlIFRyYW5zaXRpb25WaWV3TWFuYWdlclxuXHQgKiBwYXJzZSB0aGUgcGFzc2VkIGluIHNldHRpbmdzXG5cdCAqIEBwYXJhbSAge29iamVjdH0gb3B0aW9uc1xuXHQgKi9cblx0VFZNLmNyZWF0ZSA9IGZ1bmN0aW9uKCBvcHRpb25zIClcblx0e1x0XG5cdFx0ZGVmYXVsdFByb3BzKCBfb3B0aW9ucywgb3B0aW9ucyApO1xuXHRcdFRWTS5pbml0TG9nZ2VyKCBfb3B0aW9ucy5kZWJ1ZyApO1xuXHRcdFRWTS5sb2coJ2luaXRpYXRlZCcpO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIGRpc3Bvc2Ugb2YgdGhlIFRyYW5zaXRpb25WaWV3TWFuYWdlciBhbmQgXG5cdCAqIGFsbCBpdHMgY29tcG9uZW50c1xuXHQgKi9cblx0VFZNLmRpc3Bvc2UgPSBmdW5jdGlvbigpIHtcblx0XHRfb3B0aW9ucyAgPSBudWxsO1xuXHRcdHZpZXdDYWNoZSA9IG51bGw7XG5cdH07XG5cblx0LyoqXG5cdCAqIGxpbmsgZXh0ZXJuYWwgbWV0aGlkIHRvIGxvY2FsXG5cdCAqL1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoVFZNLCAndmlld3NSZWFkeScsIHsgc2V0KCBtZXRob2QgKSB7IF92aWV3c1JlYWR5TWV0aG9kID0gbWV0aG9kOyB9ICB9KTtcblxuXG59KSgpO1xuXG5cblxuZXhwb3J0IGRlZmF1bHQgVFZNO1xuXG4iLCJpbXBvcnQgZnNtIFx0XHRcdGZyb20gJy4vY29yZS9mc20nO1xuaW1wb3J0IHR2bSBcdFx0XHRmcm9tICcuL2NvcmUvdHJhbnNpdGlvblZpZXdNYW5hZ2VyJztcbmltcG9ydCB0YyBcdFx0XHRmcm9tICcuL2NvcmUvdHJhbnNpdGlvbkNvbnRyb2xsZXInO1xuaW1wb3J0IGRlZmF1bHRWbSBcdGZyb20gJy4vY29yZS9kZWZhdWx0Vmlld01hbmFnZXInO1xuaW1wb3J0IHBhcnNlciBcdFx0ZnJvbSAnLi9wYXJzZXJzL2RhdGFQYXJzZXInO1xuaW1wb3J0IExvZ2dlciBcdFx0ZnJvbSAnLi9jb21tb24vbG9nZ2VyJztcblxuaW1wb3J0IG1peGluIFx0XHRmcm9tICcuL3V0aWxzL21peGluJztcbmltcG9ydCBwaWNrXHRcdCAgXHRmcm9tICcuL3V0aWxzL3BpY2snO1xuXG4vKiBpbXBvcnQgc2lnbmFscyAqL1xuaW1wb3J0IHtcblx0c3RhdGVDaGFuZ2VkLFxuXHR0cmFuc2l0aW9uU3RhcnRlZCxcblx0dHJhbnNpdGlvbkNvbXBsZXRlLFxuXHRhbGxUcmFuc2l0aW9uc1N0YXJ0ZWQsXG5cdGFsbFRyYW5zaXRpb25Db21wbGV0ZWRcbn0gXHRmcm9tICcuL2NvbW1vbi9kaXNwYXRjaGVyJztcblxuXG4vKiBmc20gY29uZmlnIHBsdWNrIGtleXMgKi9cbmNvbnN0IGZzbUtleXMgPSBbXG5cdCdoaXN0b3J5Jyxcblx0J2xpbWl0cScsXG5cdCdxdHJhbnNpdGlvbnMnLFxuXHQnZGVidWcnXG5dO1xuLyogdHZtIGNvbmZpZyBwbHVjayBrZXlzICovXG5jb25zdCB0dm1LZXlzID0gW1xuXHQndmlld01hbmFnZXInLFxuXHQndmlld3MnLFxuXHQndXNlQ2FjaGUnLFxuXHQnZGVidWcnXG5dO1xuLyogdGMgY29uZmlnIHBsdWNrIGtleXMgKi9cbmNvbnN0IHRjS2V5cyA9IFtcblx0J3RyYW5zaXRpb25zJyxcblx0J2RlYnVnJ1xuXTtcbi8qIHRoaXMgY29uZmlnIHBsdWNrIGtleXMgKi9cbmNvbnN0IGluZGV4S2V5cyA9IFtcblx0J2RlYnVnJyxcblx0J3ZpZXdzJyxcblx0J3ZpZXdNYW5hZ2VyJ1xuXVxuXG5cbi8qKlxuICogcmFuc2l0aW9uIG1hbmFnZXIgLSBUcmFuc2l0aW9uIGNvbXBvbmVudCBmYWNhZCB3cmFwcGVyXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG52YXIgVHJhbnNpdGlvbk1hbmFnZXIgPSB7fTtcblxuKGZ1bmN0aW9uKClcbntcdFxuXHQvKiBwcml2YXRlIExvZ2dlciAqL1xuXHRjb25zdCBMb2cgPSBtaXhpbih7IG5hbWUgOiAnVHJhbnNpdGlvbk1hbmFnZXInIH0sIExvZ2dlciApO1xuXG5cdFRyYW5zaXRpb25NYW5hZ2VyLmluaXQgPSBmdW5jdGlvbiggY29uZmlnIClcblx0e1xuXHRcdGxldCBwYXJzZWREYXRhID0gcGFyc2VyLnBhcnNlRGF0YShjb25maWcuZGF0YSk7XG5cblx0XHQvKiBGU00gc2V0dXAgKi9cblx0XHRmc20uaW5pdCggbWl4aW4oIHBpY2soIGNvbmZpZywgZnNtS2V5cyApLCBjb25maWcuZnNtICkgKTtcblx0XHRmc20uY3JlYXRlKCBwYXJzZWREYXRhLmZzbUNvbmZpZyApO1xuXG5cdFx0LyogVHJhbnNpdGlvbiBWaWV3IE1hbmFnZXIgc2V0dXAgKi9cblx0XHRjb25maWcudmlld01hbmFnZXIgXHQ9IGNvbmZpZy52aWV3TWFuYWdlciB8fCBkZWZhdWx0Vm0uaW5pdCggcGljayggY29uZmlnLCBpbmRleEtleXMgKSApO1xuXHRcdGxldCB0dm1Db25maWcgXHRcdD0gIG1peGluKCB7IGNvbmZpZyA6IHBhcnNlZERhdGEuVFZNQ29uZmlnIH0sIHBpY2soIGNvbmZpZywgdHZtS2V5cyApLCBjb25maWcudHZtICk7XG5cdFx0dHZtLmNyZWF0ZSggdHZtQ29uZmlnICk7XG5cblx0XHQvKiBUcmFuc2l0aW9uIENvbnRyb2xsZXIgc2V0dXAgKi9cblx0XHR0Yy5pbml0KCBtaXhpbiggcGljayggY29uZmlnLCB0Y0tleXMgKSwgY29uZmlnLnRjICkgKTtcblxuXHRcdC8qKiogQ29ubmVjdCBlYWNoIG1vZHVsZSAqKiovXG5cdFx0ZnNtLnN0YXRlQ2hhbmdlZE1ldGhvZCAgPSB0dm0ucHJvY2Vzc1ZpZXdzO1xuXHRcdHR2bS52aWV3c1JlYWR5IFx0XHRcdD0gdGMucHJvY2Vzc1RyYW5zaXRpb247XG5cdFx0dGMudHJhbnNpdGlvbkNvbXBsZXRlZCAgPSBmc20udHJhbnNpdGlvbkNvbXBsZXRlO1xuXG5cdFx0TG9nLmluaXRMb2dnZXIoIGNvbmZpZy5kZWJ1ZyApO1xuXHRcdExvZy5sb2coICdpbml0aWF0ZWQnICk7XG5cblx0fVx0XG5cblx0LyoqXG5cdCAqIHN0YXJ0IHRoZSB0cmFuc2l0aW9uLW1hbmFnZXJcblx0ICogdHJhbnNpdGlvbnMgdG8gdGhlIGluaXRpYWwgc3RhdGVcblx0ICovXG5cdFRyYW5zaXRpb25NYW5hZ2VyLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG5cdFx0ZnNtLnN0YXJ0KCk7XG5cdH1cblxuXHQvKipcblx0ICogXHRHZXR0ZXJzIGZvciB0aGUgVHJhbnNpdGlvbiBNYW5hZ2VyIENvbXBvbmVudHNcblx0ICogIC0gYWN0aW9uIC0gZGVjbGFyZSBhY3Rpb24gdG8gc3RhcnQgXG5cdCAqICAtIGN1cnJlbnRTdGF0ZSAtIGdldCBjdXJyZW50IHN0YXRlXG5cdCAqICAtIGNhbmNlbCAtIGNhbmNlbCBmc20gdHJhbnNpdGlvblxuXHQgKiAgLSBhZGRUcmFuc2l0aW9uIC0gYWRkIGEgdHJhbnNpdGlvbiBjb21wb25lbnRcblx0ICogIC0gcmVtb3ZlVHJhbnNpdGlvbiAtIHJlbW92ZSB0cmFuc2l0aW9uXG5cdCAqICAtIGhpc3RvcnkgLSBhY3Rpb24gaGlzdG9yeVxuXHQgKi9cblxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoIFRyYW5zaXRpb25NYW5hZ2VyLCAnYWN0aW9uJywgeyBnZXQgOiBmdW5jdGlvbigpIHsgcmV0dXJuIGZzbS5hY3Rpb247IH0gfSk7XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggVHJhbnNpdGlvbk1hbmFnZXIsICdjdXJyZW50U3RhdGUnLCB7IGdldCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gZnNtLmdldEN1cnJlbnRTdGF0ZTsgfSB9KTtcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KCBUcmFuc2l0aW9uTWFuYWdlciwgJ2NhbmNlbCcsIHsgZ2V0IDogZnVuY3Rpb24oKSB7IHJldHVybiBmc20uY2FuY2VsOyB9IH0pO1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoIFRyYW5zaXRpb25NYW5hZ2VyLCAnYWRkVHJhbnNpdGlvbicsIHsgZ2V0IDogZnVuY3Rpb24oKSB7IHJldHVybiB0Yy5hZGRNb2R1bGU7IH0gfSk7XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggVHJhbnNpdGlvbk1hbmFnZXIsICdyZW1vdmVUcmFuc2l0aW9uJywgeyBnZXQgOiBmdW5jdGlvbigpIHsgcmV0dXJuIHRjLnJlbW92ZU1vZHVsZTsgfSB9KTtcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KCBUcmFuc2l0aW9uTWFuYWdlciwgJ2dldEhpc3RvcnknLCB7IGdldCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gZnNtLmdldEhpc3Rvcnk7IH0gfSk7XG5cdFxuXHQgXG5cdCAvKipcblx0ICAqIFNpZ25hbHNcblx0ICAqIC0gZnNtIHN0YXRlIGNoYW5nZWQgXG5cdCAgKiAtIHRjIHRyYW5zaXRpb24gc3RhcnRlZFxuXHQgICogLSB0YyBhbGxUcmFuc2l0aW9uU3RhcnRlZFxuXHQgICovXG5cdCBPYmplY3QuZGVmaW5lUHJvcGVydHkoIFRyYW5zaXRpb25NYW5hZ2VyLCAnb25TdGF0ZUNoYW5nZWQnLCB7IGdldCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gc3RhdGVDaGFuZ2VkOyB9IH0pO1xuXHQgT2JqZWN0LmRlZmluZVByb3BlcnR5KCBUcmFuc2l0aW9uTWFuYWdlciwgJ29uVHJhbnNpdGlvblN0YXJ0ZWQnLCB7IGdldCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdHJhbnNpdGlvblN0YXJ0ZWQ7IH0gfSk7XG5cdCBPYmplY3QuZGVmaW5lUHJvcGVydHkoIFRyYW5zaXRpb25NYW5hZ2VyLCAnb25BbGxUcmFuc2l0aW9uU3RhcnRlZCcsIHsgZ2V0IDogZnVuY3Rpb24oKSB7IHJldHVybiB0cmFuc2l0aW9uc1N0YXJ0ZWQ7IH0gfSk7XG5cdCBPYmplY3QuZGVmaW5lUHJvcGVydHkoIFRyYW5zaXRpb25NYW5hZ2VyLCAnb25BbGxUcmFuc2l0aW9uQ29tcGxldGVkJywgeyBnZXQgOiBmdW5jdGlvbigpIHsgcmV0dXJuIGFsbFRyYW5zaXRpb25Db21wbGV0ZWQ7IH0gfSk7XG5cdCBPYmplY3QuZGVmaW5lUHJvcGVydHkoIFRyYW5zaXRpb25NYW5hZ2VyLCAnb25UcmFuc2l0aW9uQ29tcGxldGUnLCB7IGdldCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdHJhbnNpdGlvbkNvbXBsZXRlOyB9IH0pO1xuXG59KSgpO1xuXG5leHBvcnQgZGVmYXVsdCBUcmFuc2l0aW9uTWFuYWdlcjtcbiIsImltcG9ydCBmb3JlaW4gZnJvbSAnLi4vdXRpbHMvZm9ySW4nO1xuaW1wb3J0IHVuaXF1ZSBmcm9tICcuLi91dGlscy91bmlxdWUnO1xuXG5cbmNvbnN0IEFwcERhdGFQYXJzZXIgPSB7fTtcblxuKGZ1bmN0aW9uKClcbntcdFxuXHQvKipcblx0ICogZXh0cmFjdCB0aGUgYWN0dWFsIHRyYW5zaXRpb24gZGF0YSBmb3IgdGhlIHN0YXRlXG5cdCAqIEBwYXJhbSAge29iamVjdH0gY29uZmlnU3RhdGUgLSBzdGF0ZSBkYXRhXG5cdCAqIEByZXR1cm4ge2FycmF5fSB0cmFuc2l0aW9uIGFycmF5IC0gRlNNXG5cdCAqL1xuXHRmdW5jdGlvbiBfZXh0cmFjdEFjdGlvbnMoIG9wdHMgKVxuXHR7XG5cdFx0Ly8gbWFpbiBwcm9wZXJ0aWVzXG5cdFx0Y29uc3QgXHRkYXRhIFx0XHQ9IG9wdHMuZGF0YSxcblx0XHRcdFx0Y29uZmlnU3RhdGUgPSBvcHRzLnN0YXRlRGF0YSxcblx0XHRcdFx0c3RhdGVWaWV3IFx0PSBvcHRzLnN0YXRlVmlldyxcblx0XHRcdFx0c3RhdGVOYW1lICBcdD0gb3B0cy5zdGF0ZU5hbWU7XG5cblx0XHQvLyBuZXcgZGVmaW5lZCBwcm9wZXJ0aWVzXG5cdFx0bGV0IHN0YXRlVHJhbnNpdGlvbnMgPSBbXSxcblx0XHRcdHZpZXdEYXRhIFx0XHQgPSBvcHRzLnZpZXdEYXRhLFxuXHRcdFx0YXBwRGF0YVZpZXcsXG5cdFx0XHRhY3Rpb24sXG5cdFx0XHRzdGF0ZVByZWZpeDtcblxuXHRcdGZvcmVpbiggY29uZmlnU3RhdGUuYWN0aW9ucywgKCBwcm9wLCBhY3Rpb25OYW1lICkgPT4ge1xuXG5cdFx0XHRzdGF0ZVByZWZpeCA9IChzdGF0ZU5hbWUrICctPicgK2FjdGlvbk5hbWUpO1xuXHRcdFx0YXBwRGF0YVZpZXcgPSBkYXRhWyBwcm9wLnRhcmdldCBdLnZpZXc7XG5cblx0XHRcdC8vIFJldHVybiBhY3Rpb24gZGF0YSBmb3IgRlNNXG5cdFx0XHRhY3Rpb24gPSB7XG5cdFx0XHRcdGFjdGlvbiBcdFx0OiBhY3Rpb25OYW1lLFxuXHRcdFx0XHR0YXJnZXQgXHRcdDogcHJvcC50YXJnZXQsXG5cdFx0XHRcdF9pZCBcdFx0OiBzdGF0ZVByZWZpeFxuXHRcdFx0fTtcblxuXHRcdFx0Ly8gcmV0dXJuIFZpZXdEYXRhIGZvciBWaWV3IG1hbmFnZXIgYW5kIGFwcGVuZCBhbGwgdmlld3Ncblx0XHRcdHZpZXdEYXRhWyBzdGF0ZVByZWZpeCBdID0ge1xuXHRcdFx0XHRjdXJyZW50VmlldyBcdFx0OiBzdGF0ZVZpZXcsXG5cdFx0XHRcdG5leHRWaWV3IFx0XHRcdDogYXBwRGF0YVZpZXcsXG5cdFx0XHRcdGxpbmtlZFZUcmFuc01vZHVsZXMgOiBfZXh0cmFjdFRyYW5zaXRpb25zKCBwcm9wLCBzdGF0ZVZpZXcsIGFwcERhdGFWaWV3ICksXG5cdFx0XHRcdG5hbWUgIFx0XHRcdFx0OiBhY3Rpb25OYW1lXG5cdFx0XHR9O1xuXG5cdFx0XHQvLyAvLyBhc3NpZ24gZnNtIGFjdGlvbiB0byBzdGF0ZVxuXHRcdFx0c3RhdGVUcmFuc2l0aW9uc1sgc3RhdGVUcmFuc2l0aW9ucy5sZW5ndGggXSA9IGFjdGlvbjtcblx0XHR9KTtcblxuXHRcdHJldHVybiB7IHN0YXRlVHJhbnNpdGlvbnMgOiBzdGF0ZVRyYW5zaXRpb25zLCB2aWV3RGF0YSA6IHZpZXdEYXRhIH07XG5cdH1cblxuXHQvKipcblx0ICogZXh0cmFjdCB0cmFuc2l0aW9uIGluZm9ybWF0aW9uXG5cdCAqIGFuZCBleHRyYWN0IGRhdGEgaWYgdHJhbnNpdGlvbiBpbmZvcm1hdGlvbiBpc1xuXHQgKiBhbiBhcnJheSBvZiB0cmFuc2l0aW9uc1xuXHQgKiBAcGFyYW0gIHtvbmJqZWN0fSBwcm9wICAgICBcblx0ICogQHBhcmFtICB7c3RyaW5nfSBzdGF0ZVZpZXcgLSBpZCBvZiBzdGF0ZSB2aWV3XG5cdCAqIEBwYXJhbSAge3N0cmluZ30gbmV4dFZpZXcgIC0gaWQgb2YgdmlldyB0aGlzIHRyYW5zaXRpb24gZ29lcyB0b1xuXHQgKiBAcmV0dXJuIHthcnJheX0gYXJyYXkgb2YgdHJhbnNpdGlvbnMgZm90IHRoaXMgYWN0aW9uXG5cdCAqL1xuXHRmdW5jdGlvbiBfZXh0cmFjdFRyYW5zaXRpb25zKCBwcm9wLCBzdGF0ZVZpZXcsIG5leHRWaWV3IClcblx0e1xuXHRcdHZhciBncm91cGVkVHJhbnNpdGlvbnMgPSBbXTtcblx0XHRpZiggcHJvcC50cmFuc2l0aW9ucyApIHsgLy8gaWYgbW9yZSB0cmFuc2l0aW9ucyBleGlzdCwgYWRkIHRoZW1cblx0XHQgXHRncm91cGVkVHJhbnNpdGlvbnMgPSBwcm9wLnRyYW5zaXRpb25zLm1hcCggKCB0cmFuc2l0aW9uT2JqZWN0ICkgPT4geyBcblx0XHQgXHRcdHJldHVybiB0cmFuc2l0aW9uT2JqZWN0OyBcblx0XHQgXHR9KTtcblx0XHR9XG5cdFx0cHJvcC52aWV3cyA9IHVuaXF1ZSggcHJvcC52aWV3cywgWyBzdGF0ZVZpZXcsIG5leHRWaWV3IF0gKTtcblx0XHRncm91cGVkVHJhbnNpdGlvbnMudW5zaGlmdCggeyB0cmFuc2l0aW9uVHlwZSA6IHByb3AudHJhbnNpdGlvblR5cGUsIHZpZXdzIDogcHJvcC52aWV3cyB9ICk7XG5cdFx0cmV0dXJuIGdyb3VwZWRUcmFuc2l0aW9ucztcblx0fVxuXG5cblx0LyoqXG5cdCAqIEV4dHJhY3Qgb25seSB0aGUgRlNNIGRhdGEgZnJvbSB0aGUgY29uZmlnIGZpbGVcblx0ICogY3JlYXRlIHN0YXRlc1xuXHQgKiBAcGFyYW0gIHtvYmplY3R9IGRhdGEgXG5cdCAqIEByZXR1cm4ge29iamVjdH0gZnNtIGZvcm1hdHRlZCBjb25maWdcblx0ICovXG5cdEFwcERhdGFQYXJzZXIucGFyc2VEYXRhID0gZnVuY3Rpb24oIGRhdGEgKVxuXHR7XG5cdFx0aWYoICFkYXRhICl7IHRocm93IG5ldyBFcnJvcignKkRhdGEgT2JqZWN0IGlzIHVuZGVmaW5lZCEnKTsgfVxuXG5cdFx0bGV0IGNvbmZpZyBcdFx0PSBbXSxcblx0XHRcdHZpZXdEYXRhXHQ9IHt9LFxuXHRcdFx0ZXh0cmFjdGVkLFxuXHRcdFx0c3RhdGU7XG5cblx0XHRmb3JlaW4oIGRhdGEsICggc3RhdGVEYXRhLCBzdGF0ZU5hbWUgKSA9PlxuXHRcdHtcblx0XHRcdGV4dHJhY3RlZCA9IF9leHRyYWN0QWN0aW9ucyh7XG5cdFx0XHRcdGRhdGEgXHRcdFx0OiBkYXRhLCBcblx0XHRcdFx0c3RhdGVEYXRhIFx0XHQ6IHN0YXRlRGF0YSwgXG5cdFx0XHRcdHZpZXdEYXRhIFx0XHQ6IHZpZXdEYXRhLCBcblx0XHRcdFx0c3RhdGVWaWV3IFx0XHQ6IHN0YXRlRGF0YS52aWV3LFxuXHRcdFx0XHRzdGF0ZU5hbWUgXHRcdDogc3RhdGVOYW1lXG5cdFx0XHR9KTtcblxuXHRcdFx0c3RhdGUgPSB7XG5cdFx0XHRcdG5hbWUgXHRcdFx0XHQ6IHN0YXRlTmFtZSxcblx0XHRcdFx0aW5pdGlhbCBcdFx0XHQ6IHN0YXRlRGF0YS5pbml0aWFsLFxuXHRcdFx0XHRzdGF0ZVRyYW5zaXRpb25zIFx0OiBleHRyYWN0ZWQuc3RhdGVUcmFuc2l0aW9uc1xuXHRcdFx0fTtcblxuXHRcdFx0Y29uZmlnWyBjb25maWcubGVuZ3RoIF0gPSBzdGF0ZTtcblx0XHR9KTtcblxuXHRcdHJldHVybiB7IGZzbUNvbmZpZyA6IGNvbmZpZywgVFZNQ29uZmlnIDogZXh0cmFjdGVkLnZpZXdEYXRhIH07XG5cdH07XG5cbn0pKCk7XG5cbmV4cG9ydCBkZWZhdWx0IEFwcERhdGFQYXJzZXI7XG5cbiIsIid1c2Ugc3RyaWN0JztcblxuXG4vKipcbiAqIHJlcGxhY2UgdGFyZ2V0IG9iamVjdCBwcm9wZXJ0aWVzIHdpdGggdGhlIG92ZXJ3cml0ZVxuICogb2JqZWN0IHByb3BlcnRpZXMgaWYgdGhleSBoYXZlIGJlZW4gc2V0XG4gKiBAcGFyYW0gIHtvYmplY3R9IHRhcmdldCAgICAtIG9iamVjdCB0byBvdmVyd3JpdGVcbiAqIEBwYXJhbSAge29iamVjdH0gb3ZlcndyaXRlIC0gb2JqZWN0IHdpdGggbmV3IHByb3BlcmllcyBhbmQgdmFsdWVzXG4gKiBAcmV0dXJuIHtvYmplY3R9IFxuICovXG5mdW5jdGlvbiBkZWZhdWx0UHJvcHMoIHRhcmdldCwgb3ZlcndyaXRlICkgXG57XG5cdG92ZXJ3cml0ZSA9IG92ZXJ3cml0ZSB8fCB7fTtcblx0Zm9yKCB2YXIgcHJvcCBpbiBvdmVyd3JpdGUgKSB7XG5cdFx0aWYoIHRhcmdldC5oYXNPd25Qcm9wZXJ0eShwcm9wKSAmJiBfaXNWYWxpZCggb3ZlcndyaXRlWyBwcm9wIF0gKSApIHtcblx0XHRcdHRhcmdldFsgcHJvcCBdID0gb3ZlcndyaXRlWyBwcm9wIF07XG5cdFx0fVxuXHR9XG5cdHJldHVybiB0YXJnZXQ7XG59XG5cbi8qKlxuICogY2hlY2sgdG8gc2VlIGlmIGEgcHJvcGVydHkgaXMgdmFsaWRcbiAqIG5vdCBudWxsIG9yIHVuZGVmaW5lZFxuICogQHBhcmFtICB7b2JqZWN0fSAgcHJvcCBcbiAqIEByZXR1cm4ge0Jvb2xlYW59IFxuICovXG5mdW5jdGlvbiBfaXNWYWxpZCggcHJvcCApIHtcblx0cmV0dXJuICggcHJvcCAhPT0gdW5kZWZpbmVkICYmIHByb3AgIT09IG51bGwgKTtcbn1cblxuXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmF1bHRQcm9wczsiLCIgLypqc2hpbnQgLVcwODQgKi9cbiAvKmpzaGludCB1bnVzZWQ6ZmFsc2UqL1xuXG4gdmFyIF9oYXNEb250RW51bUJ1ZyxcbiAgICAgICAgX2RvbnRFbnVtcztcblxuICAgIGZ1bmN0aW9uIGNoZWNrRG9udEVudW0oKSB7XG4gICAgICAgIF9kb250RW51bXMgPSBbXG4gICAgICAgICAgICAgICAgJ3RvU3RyaW5nJyxcbiAgICAgICAgICAgICAgICAndG9Mb2NhbGVTdHJpbmcnLFxuICAgICAgICAgICAgICAgICd2YWx1ZU9mJyxcbiAgICAgICAgICAgICAgICAnaGFzT3duUHJvcGVydHknLFxuICAgICAgICAgICAgICAgICdpc1Byb3RvdHlwZU9mJyxcbiAgICAgICAgICAgICAgICAncHJvcGVydHlJc0VudW1lcmFibGUnLFxuICAgICAgICAgICAgICAgICdjb25zdHJ1Y3RvcidcbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgX2hhc0RvbnRFbnVtQnVnID0gdHJ1ZTtcblxuICAgICAgICBmb3IgKHZhciBrZXkgaW4geyd0b1N0cmluZyc6IG51bGx9KSB7XG4gICAgICAgICAgICBfaGFzRG9udEVudW1CdWcgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNpbWlsYXIgdG8gQXJyYXkvZm9yRWFjaCBidXQgd29ya3Mgb3ZlciBvYmplY3QgcHJvcGVydGllcyBhbmQgZml4ZXMgRG9uJ3RcbiAgICAgKiBFbnVtIGJ1ZyBvbiBJRS5cbiAgICAgKiBiYXNlZCBvbjogaHR0cDovL3doYXR0aGVoZWFkc2FpZC5jb20vMjAxMC8xMC9hLXNhZmVyLW9iamVjdC1rZXlzLWNvbXBhdGliaWxpdHktaW1wbGVtZW50YXRpb25cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBmb3JJbihvYmosIGZuLCB0aGlzT2JqKXtcbiAgICAgICAgdmFyIGtleSwgaSA9IDA7XG4gICAgICAgIC8vIG5vIG5lZWQgdG8gY2hlY2sgaWYgYXJndW1lbnQgaXMgYSByZWFsIG9iamVjdCB0aGF0IHdheSB3ZSBjYW4gdXNlXG4gICAgICAgIC8vIGl0IGZvciBhcnJheXMsIGZ1bmN0aW9ucywgZGF0ZSwgZXRjLlxuXG4gICAgICAgIC8vcG9zdC1wb25lIGNoZWNrIHRpbGwgbmVlZGVkXG4gICAgICAgIGlmIChfaGFzRG9udEVudW1CdWcgPT0gbnVsbCkgeyBjaGVja0RvbnRFbnVtKCk7IH1cblxuICAgICAgICBmb3IgKGtleSBpbiBvYmopIHtcbiAgICAgICAgICAgIGlmIChleGVjKGZuLCBvYmosIGtleSwgdGhpc09iaikgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoX2hhc0RvbnRFbnVtQnVnKSB7XG4gICAgICAgICAgICB3aGlsZSAoa2V5ID0gX2RvbnRFbnVtc1tpKytdKSB7XG4gICAgICAgICAgICAgICAgLy8gc2luY2Ugd2UgYXJlbid0IHVzaW5nIGhhc093biBjaGVjayB3ZSBuZWVkIHRvIG1ha2Ugc3VyZSB0aGVcbiAgICAgICAgICAgICAgICAvLyBwcm9wZXJ0eSB3YXMgb3ZlcndyaXR0ZW5cbiAgICAgICAgICAgICAgICBpZiAob2JqW2tleV0gIT09IE9iamVjdC5wcm90b3R5cGVba2V5XSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXhlYyhmbiwgb2JqLCBrZXksIHRoaXNPYmopID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBleGVjKGZuLCBvYmosIGtleSwgdGhpc09iail7XG4gICAgICAgIHJldHVybiBmbi5jYWxsKHRoaXNPYmosIG9ialtrZXldLCBrZXksIG9iaik7XG4gICAgfVxuXG5leHBvcnQgZGVmYXVsdCBmb3JJbjtcblxuXG4iLCJpbXBvcnQgaGFzT3duIGZyb20gJy4vaGFzT3duJztcbmltcG9ydCBmb3JJbiBmcm9tICcuL2ZvckluJztcblxuICAgIC8qKlxuICAgICAqIFNpbWlsYXIgdG8gQXJyYXkvZm9yRWFjaCBidXQgd29ya3Mgb3ZlciBvYmplY3QgcHJvcGVydGllcyBhbmQgZml4ZXMgRG9uJ3RcbiAgICAgKiBFbnVtIGJ1ZyBvbiBJRS5cbiAgICAgKiBiYXNlZCBvbjogaHR0cDovL3doYXR0aGVoZWFkc2FpZC5jb20vMjAxMC8xMC9hLXNhZmVyLW9iamVjdC1rZXlzLWNvbXBhdGliaWxpdHktaW1wbGVtZW50YXRpb25cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBmb3JPd24ob2JqLCBmbiwgdGhpc09iail7XG4gICAgICAgIGZvckluKG9iaiwgZnVuY3Rpb24odmFsLCBrZXkpe1xuICAgICAgICAgICAgaWYgKGhhc093bihvYmosIGtleSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm4uY2FsbCh0aGlzT2JqLCBvYmpba2V5XSwga2V5LCBvYmopO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbmV4cG9ydCBkZWZhdWx0IGZvck93bjtcbiIsIlxuXG4gICAgLyoqXG4gICAgICogU2FmZXIgT2JqZWN0Lmhhc093blByb3BlcnR5XG4gICAgICovXG4gICAgIGZ1bmN0aW9uIGhhc093bihvYmosIHByb3Ape1xuICAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xuICAgICB9XG5cbiAgICBleHBvcnQgZGVmYXVsdCBoYXNPd247XG5cblxuIiwiIC8qanNoaW50IHVudXNlZDpmYWxzZSovXG5pbXBvcnQgZm9yT3duIGZyb20gJy4vZm9yT3duJztcblxuXG5mdW5jdGlvbiBtaXhpbiggdGFyZ2V0LCBvYmplY3RzICkge1xuXHR2YXIgaSA9IDAsXG4gICAgbiA9IGFyZ3VtZW50cy5sZW5ndGgsXG4gICAgb2JqO1xuICAgIHdoaWxlKCsraSA8IG4pe1xuICAgICAgICBvYmogPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGlmIChvYmogIT0gbnVsbCkge1xuICAgICAgICAgICAgZm9yT3duKG9iaiwgY29weVByb3AsIHRhcmdldCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRhcmdldDtcbn1cblxuZnVuY3Rpb24gY29weVByb3AodmFsLCBrZXkpe1xuICAgIHRoaXNba2V5XSA9IHZhbDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgbWl4aW47IiwiIC8qanNoaW50IC1XMDg0ICovXG4gIC8qanNoaW50IHVudXNlZDpmYWxzZSovXG4gIFxudmFyIHNsaWNlID0gcmVxdWlyZSgnLi9zbGljZScpO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIGEgY29weSBvZiB0aGUgb2JqZWN0LCBmaWx0ZXJlZCB0byBvbmx5IGhhdmUgdmFsdWVzIGZvciB0aGUgd2hpdGVsaXN0ZWQga2V5cy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBwaWNrKG9iaiwgdmFyX2tleXMpe1xuICAgICAgICB2YXIga2V5cyA9IHR5cGVvZiBhcmd1bWVudHNbMV0gIT09ICdzdHJpbmcnPyBhcmd1bWVudHNbMV0gOiBzbGljZShhcmd1bWVudHMsIDEpLFxuICAgICAgICAgICAgb3V0ID0ge30sXG4gICAgICAgICAgICBpID0gMCwga2V5O1xuICAgICAgICB3aGlsZSAoa2V5ID0ga2V5c1tpKytdKSB7XG4gICAgICAgICAgICBvdXRba2V5XSA9IG9ialtrZXldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfVxuXG5leHBvcnQgZGVmYXVsdCBwaWNrOyIsIiAgICAvKipcbiAgICAgKiBDcmVhdGUgc2xpY2Ugb2Ygc291cmNlIGFycmF5IG9yIGFycmF5LWxpa2Ugb2JqZWN0XG4gICAgICovXG4gICAgZnVuY3Rpb24gc2xpY2UoYXJyLCBzdGFydCwgZW5kKXtcbiAgICAgICAgdmFyIGxlbiA9IGFyci5sZW5ndGg7XG5cbiAgICAgICAgaWYgKHN0YXJ0ID09IG51bGwpIHtcbiAgICAgICAgICAgIHN0YXJ0ID0gMDtcbiAgICAgICAgfSBlbHNlIGlmIChzdGFydCA8IDApIHtcbiAgICAgICAgICAgIHN0YXJ0ID0gTWF0aC5tYXgobGVuICsgc3RhcnQsIDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RhcnQgPSBNYXRoLm1pbihzdGFydCwgbGVuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlbmQgPT0gbnVsbCkge1xuICAgICAgICAgICAgZW5kID0gbGVuO1xuICAgICAgICB9IGVsc2UgaWYgKGVuZCA8IDApIHtcbiAgICAgICAgICAgIGVuZCA9IE1hdGgubWF4KGxlbiArIGVuZCwgMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbmQgPSBNYXRoLm1pbihlbmQsIGxlbik7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgIHdoaWxlIChzdGFydCA8IGVuZCkge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goYXJyW3N0YXJ0KytdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG5leHBvcnQgZGVmYXVsdCBzbGljZTsiLCIndXNlIHN0cmljdCc7XG5cblxuLyoqXG4gKiBqb2luIHR3byBhcnJheXMgYW5kIHByZXZlbnQgZHVwbGljYXRpb25cbiAqIEBwYXJhbSAge2FycmF5fSB0YXJnZXQgXG4gKiBAcGFyYW0gIHthcnJheX0gYXJyYXlzIFxuICogQHJldHVybiB7YXJyYXl9IFxuICovXG5mdW5jdGlvbiB1bmlxdWUoIHRhcmdldCwgYXJyYXlzIClcbntcblx0dGFyZ2V0ID0gdGFyZ2V0IHx8IFtdO1xuXHR2YXIgY29tYmluZWQgPSB0YXJnZXQuY29uY2F0KCBhcnJheXMgKTtcblx0XHR0YXJnZXQgXHQgPSBbXTtcblxuXHR2YXIgbGVuID0gY29tYmluZWQubGVuZ3RoLFxuXHRcdGkgPSAtMSxcblx0XHRPYmpSZWY7XG5cblx0XHR3aGlsZSgrK2kgPCBsZW4pIHtcblx0XHRcdE9ialJlZiA9IGNvbWJpbmVkWyBpIF07XG5cdFx0XHRpZiggdGFyZ2V0LmluZGV4T2YoIE9ialJlZiApID09PSAtMSAmJiBPYmpSZWYgIT09ICcnICYgT2JqUmVmICE9PSAgKG51bGwgfHwgdW5kZWZpbmVkKSApIHtcblx0XHRcdFx0dGFyZ2V0WyB0YXJnZXQubGVuZ3RoIF0gPSBPYmpSZWY7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiB0YXJnZXQ7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHVuaXF1ZTsiXX0=
