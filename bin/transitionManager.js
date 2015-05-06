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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2VzNi1wcm9taXNlL2Rpc3QvZXM2LXByb21pc2UuanMiLCJub2RlX21vZHVsZXMvc2lnbmFscy9kaXN0L3NpZ25hbHMuanMiLCIvVXNlcnMvdGFsd29vbGYvZGV2ZWxvcGVyL3dlYlJvb3QvdHJhbnNpdGlvbi1tYW5hZ2VyL3NyYy9jb21tb24vZGlzcGF0Y2hlci5qcyIsIi9Vc2Vycy90YWx3b29sZi9kZXZlbG9wZXIvd2ViUm9vdC90cmFuc2l0aW9uLW1hbmFnZXIvc3JjL2NvbW1vbi9sb2dnZXIuanMiLCIvVXNlcnMvdGFsd29vbGYvZGV2ZWxvcGVyL3dlYlJvb3QvdHJhbnNpdGlvbi1tYW5hZ2VyL3NyYy9jb21tb24vcHJvbWlzZUZhY2FkZS5qcyIsIi9Vc2Vycy90YWx3b29sZi9kZXZlbG9wZXIvd2ViUm9vdC90cmFuc2l0aW9uLW1hbmFnZXIvc3JjL2NvcmUvZGVmYXVsdFZpZXdNYW5hZ2VyLmpzIiwiL1VzZXJzL3RhbHdvb2xmL2RldmVsb3Blci93ZWJSb290L3RyYW5zaXRpb24tbWFuYWdlci9zcmMvY29yZS9mc20uanMiLCIvVXNlcnMvdGFsd29vbGYvZGV2ZWxvcGVyL3dlYlJvb3QvdHJhbnNpdGlvbi1tYW5hZ2VyL3NyYy9jb3JlL3RyYW5zaXRpb25Db250cm9sbGVyLmpzIiwiL1VzZXJzL3RhbHdvb2xmL2RldmVsb3Blci93ZWJSb290L3RyYW5zaXRpb24tbWFuYWdlci9zcmMvY29yZS90cmFuc2l0aW9uVmlld01hbmFnZXIuanMiLCIvVXNlcnMvdGFsd29vbGYvZGV2ZWxvcGVyL3dlYlJvb3QvdHJhbnNpdGlvbi1tYW5hZ2VyL3NyYy9pbmRleC5qcyIsIi9Vc2Vycy90YWx3b29sZi9kZXZlbG9wZXIvd2ViUm9vdC90cmFuc2l0aW9uLW1hbmFnZXIvc3JjL3BhcnNlcnMvZGF0YVBhcnNlci5qcyIsIi9Vc2Vycy90YWx3b29sZi9kZXZlbG9wZXIvd2ViUm9vdC90cmFuc2l0aW9uLW1hbmFnZXIvc3JjL3V0aWxzL2RlZmF1bHQuanMiLCIvVXNlcnMvdGFsd29vbGYvZGV2ZWxvcGVyL3dlYlJvb3QvdHJhbnNpdGlvbi1tYW5hZ2VyL3NyYy91dGlscy9mb3JJbi5qcyIsIi9Vc2Vycy90YWx3b29sZi9kZXZlbG9wZXIvd2ViUm9vdC90cmFuc2l0aW9uLW1hbmFnZXIvc3JjL3V0aWxzL2Zvck93bi5qcyIsIi9Vc2Vycy90YWx3b29sZi9kZXZlbG9wZXIvd2ViUm9vdC90cmFuc2l0aW9uLW1hbmFnZXIvc3JjL3V0aWxzL2hhc093bi5qcyIsIi9Vc2Vycy90YWx3b29sZi9kZXZlbG9wZXIvd2ViUm9vdC90cmFuc2l0aW9uLW1hbmFnZXIvc3JjL3V0aWxzL21peGluLmpzIiwiL1VzZXJzL3RhbHdvb2xmL2RldmVsb3Blci93ZWJSb290L3RyYW5zaXRpb24tbWFuYWdlci9zcmMvdXRpbHMvcGljay5qcyIsIi9Vc2Vycy90YWx3b29sZi9kZXZlbG9wZXIvd2ViUm9vdC90cmFuc2l0aW9uLW1hbmFnZXIvc3JjL3V0aWxzL3NsaWNlLmpzIiwiL1VzZXJzL3RhbHdvb2xmL2RldmVsb3Blci93ZWJSb290L3RyYW5zaXRpb24tbWFuYWdlci9zcmMvdXRpbHMvdW5pcXVlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzc3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztLQUM1Qjs7QUFFRCxRQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFDaEIsV0FBTyxLQUFLLEdBQUcsR0FBRyxFQUFFO0FBQ2hCLGNBQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztLQUM3Qjs7QUFFRCxXQUFPLE1BQU0sQ0FBQztDQUNqQjs7cUJBRVUsS0FBSzs7Ozs7Ozs7O0FDOUJwQixZQUFZLENBQUM7Ozs7Ozs7O0FBU2IsU0FBUyxNQUFNLENBQUUsTUFBTSxFQUFFLE1BQU0sRUFDL0I7QUFDQyxPQUFNLEdBQUcsTUFBTSxJQUFJLEVBQUUsQ0FBQztBQUN0QixLQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFFLE1BQU0sQ0FBRSxDQUFDO0FBQ3RDLE9BQU0sR0FBSyxFQUFFLENBQUM7O0FBRWYsS0FBSSxHQUFHLEdBQUcsUUFBUSxDQUFDLE1BQU07S0FDeEIsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNOLE1BQU0sQ0FBQzs7QUFFUCxRQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRTtBQUNoQixRQUFNLEdBQUcsUUFBUSxDQUFFLENBQUMsQ0FBRSxDQUFDO0FBQ3ZCLE1BQUksTUFBTSxDQUFDLE9BQU8sQ0FBRSxNQUFNLENBQUUsS0FBSyxDQUFDLENBQUMsSUFBSSxNQUFNLEtBQUssRUFBRSxHQUFHLE1BQU0sTUFBTyxJQUFJLElBQUksU0FBUyxDQUFBLEFBQUMsRUFBRztBQUN4RixTQUFNLENBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBRSxHQUFHLE1BQU0sQ0FBQztHQUNqQztFQUNEO0FBQ0QsUUFBTyxNQUFNLENBQUM7Q0FDZjs7cUJBRWMsTUFBTSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAoIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiLyohXG4gKiBAb3ZlcnZpZXcgZXM2LXByb21pc2UgLSBhIHRpbnkgaW1wbGVtZW50YXRpb24gb2YgUHJvbWlzZXMvQSsuXG4gKiBAY29weXJpZ2h0IENvcHlyaWdodCAoYykgMjAxNCBZZWh1ZGEgS2F0eiwgVG9tIERhbGUsIFN0ZWZhbiBQZW5uZXIgYW5kIGNvbnRyaWJ1dG9ycyAoQ29udmVyc2lvbiB0byBFUzYgQVBJIGJ5IEpha2UgQXJjaGliYWxkKVxuICogQGxpY2Vuc2UgICBMaWNlbnNlZCB1bmRlciBNSVQgbGljZW5zZVxuICogICAgICAgICAgICBTZWUgaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2pha2VhcmNoaWJhbGQvZXM2LXByb21pc2UvbWFzdGVyL0xJQ0VOU0VcbiAqIEB2ZXJzaW9uICAgMi4xLjFcbiAqL1xuXG4oZnVuY3Rpb24oKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHV0aWxzJCRvYmplY3RPckZ1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiB0eXBlb2YgeCA9PT0gJ2Z1bmN0aW9uJyB8fCAodHlwZW9mIHggPT09ICdvYmplY3QnICYmIHggIT09IG51bGwpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNGdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gdHlwZW9mIHggPT09ICdmdW5jdGlvbic7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc01heWJlVGhlbmFibGUoeCkge1xuICAgICAgcmV0dXJuIHR5cGVvZiB4ID09PSAnb2JqZWN0JyAmJiB4ICE9PSBudWxsO1xuICAgIH1cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkdXRpbHMkJF9pc0FycmF5O1xuICAgIGlmICghQXJyYXkuaXNBcnJheSkge1xuICAgICAgbGliJGVzNiRwcm9taXNlJHV0aWxzJCRfaXNBcnJheSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoeCkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkdXRpbHMkJF9pc0FycmF5ID0gQXJyYXkuaXNBcnJheTtcbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc0FycmF5ID0gbGliJGVzNiRwcm9taXNlJHV0aWxzJCRfaXNBcnJheTtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbiA9IDA7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR0b1N0cmluZyA9IHt9LnRvU3RyaW5nO1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkdmVydHhOZXh0O1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhc2FwKGNhbGxiYWNrLCBhcmcpIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRxdWV1ZVtsaWIkZXM2JHByb21pc2UkYXNhcCQkbGVuXSA9IGNhbGxiYWNrO1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHF1ZXVlW2xpYiRlczYkcHJvbWlzZSRhc2FwJCRsZW4gKyAxXSA9IGFyZztcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRsZW4gKz0gMjtcbiAgICAgIGlmIChsaWIkZXM2JHByb21pc2UkYXNhcCQkbGVuID09PSAyKSB7XG4gICAgICAgIC8vIElmIGxlbiBpcyAyLCB0aGF0IG1lYW5zIHRoYXQgd2UgbmVlZCB0byBzY2hlZHVsZSBhbiBhc3luYyBmbHVzaC5cbiAgICAgICAgLy8gSWYgYWRkaXRpb25hbCBjYWxsYmFja3MgYXJlIHF1ZXVlZCBiZWZvcmUgdGhlIHF1ZXVlIGlzIGZsdXNoZWQsIHRoZXlcbiAgICAgICAgLy8gd2lsbCBiZSBwcm9jZXNzZWQgYnkgdGhpcyBmbHVzaCB0aGF0IHdlIGFyZSBzY2hlZHVsaW5nLlxuICAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2NoZWR1bGVGbHVzaCgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkZGVmYXVsdCA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhc2FwO1xuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRicm93c2VyV2luZG93ID0gKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSA/IHdpbmRvdyA6IHVuZGVmaW5lZDtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJGJyb3dzZXJHbG9iYWwgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkYnJvd3NlcldpbmRvdyB8fCB7fTtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJGJyb3dzZXJHbG9iYWwuTXV0YXRpb25PYnNlcnZlciB8fCBsaWIkZXM2JHByb21pc2UkYXNhcCQkYnJvd3Nlckdsb2JhbC5XZWJLaXRNdXRhdGlvbk9ic2VydmVyO1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkaXNOb2RlID0gdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmIHt9LnRvU3RyaW5nLmNhbGwocHJvY2VzcykgPT09ICdbb2JqZWN0IHByb2Nlc3NdJztcblxuICAgIC8vIHRlc3QgZm9yIHdlYiB3b3JrZXIgYnV0IG5vdCBpbiBJRTEwXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRpc1dvcmtlciA9IHR5cGVvZiBVaW50OENsYW1wZWRBcnJheSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgIHR5cGVvZiBpbXBvcnRTY3JpcHRzICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgdHlwZW9mIE1lc3NhZ2VDaGFubmVsICE9PSAndW5kZWZpbmVkJztcblxuICAgIC8vIG5vZGVcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTmV4dFRpY2soKSB7XG4gICAgICB2YXIgbmV4dFRpY2sgPSBwcm9jZXNzLm5leHRUaWNrO1xuICAgICAgLy8gbm9kZSB2ZXJzaW9uIDAuMTAueCBkaXNwbGF5cyBhIGRlcHJlY2F0aW9uIHdhcm5pbmcgd2hlbiBuZXh0VGljayBpcyB1c2VkIHJlY3Vyc2l2ZWx5XG4gICAgICAvLyBzZXRJbW1lZGlhdGUgc2hvdWxkIGJlIHVzZWQgaW5zdGVhZCBpbnN0ZWFkXG4gICAgICB2YXIgdmVyc2lvbiA9IHByb2Nlc3MudmVyc2lvbnMubm9kZS5tYXRjaCgvXig/OihcXGQrKVxcLik/KD86KFxcZCspXFwuKT8oXFwqfFxcZCspJC8pO1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmVyc2lvbikgJiYgdmVyc2lvblsxXSA9PT0gJzAnICYmIHZlcnNpb25bMl0gPT09ICcxMCcpIHtcbiAgICAgICAgbmV4dFRpY2sgPSBzZXRJbW1lZGlhdGU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIG5leHRUaWNrKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRmbHVzaCk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIHZlcnR4XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVZlcnR4VGltZXIoKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR2ZXJ0eE5leHQobGliJGVzNiRwcm9taXNlJGFzYXAkJGZsdXNoKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZU11dGF0aW9uT2JzZXJ2ZXIoKSB7XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgbGliJGVzNiRwcm9taXNlJGFzYXAkJEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRmbHVzaCk7XG4gICAgICB2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgICAgIG9ic2VydmVyLm9ic2VydmUobm9kZSwgeyBjaGFyYWN0ZXJEYXRhOiB0cnVlIH0pO1xuXG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIG5vZGUuZGF0YSA9IChpdGVyYXRpb25zID0gKytpdGVyYXRpb25zICUgMik7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIHdlYiB3b3JrZXJcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTWVzc2FnZUNoYW5uZWwoKSB7XG4gICAgICB2YXIgY2hhbm5lbCA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xuICAgICAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkZmx1c2g7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICBjaGFubmVsLnBvcnQyLnBvc3RNZXNzYWdlKDApO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlU2V0VGltZW91dCgpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgc2V0VGltZW91dChsaWIkZXM2JHByb21pc2UkYXNhcCQkZmx1c2gsIDEpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJHF1ZXVlID0gbmV3IEFycmF5KDEwMDApO1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRmbHVzaCgpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbjsgaSs9Mikge1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWVbaV07XG4gICAgICAgIHZhciBhcmcgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWVbaSsxXTtcblxuICAgICAgICBjYWxsYmFjayhhcmcpO1xuXG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRxdWV1ZVtpXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHF1ZXVlW2krMV0gPSB1bmRlZmluZWQ7XG4gICAgICB9XG5cbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRsZW4gPSAwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhdHRlbXB0VmVydGV4KCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdmFyIHIgPSByZXF1aXJlO1xuICAgICAgICB2YXIgdmVydHggPSByKCd2ZXJ0eCcpO1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkdmVydHhOZXh0ID0gdmVydHgucnVuT25Mb29wIHx8IHZlcnR4LnJ1bk9uQ29udGV4dDtcbiAgICAgICAgcmV0dXJuIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VWZXJ0eFRpbWVyKCk7XG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgcmV0dXJuIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VTZXRUaW1lb3V0KCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRzY2hlZHVsZUZsdXNoO1xuICAgIC8vIERlY2lkZSB3aGF0IGFzeW5jIG1ldGhvZCB0byB1c2UgdG8gdHJpZ2dlcmluZyBwcm9jZXNzaW5nIG9mIHF1ZXVlZCBjYWxsYmFja3M6XG4gICAgaWYgKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRpc05vZGUpIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRzY2hlZHVsZUZsdXNoID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZU5leHRUaWNrKCk7XG4gICAgfSBlbHNlIGlmIChsaWIkZXM2JHByb21pc2UkYXNhcCQkQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIpIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRzY2hlZHVsZUZsdXNoID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZU11dGF0aW9uT2JzZXJ2ZXIoKTtcbiAgICB9IGVsc2UgaWYgKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRpc1dvcmtlcikge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2ggPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTWVzc2FnZUNoYW5uZWwoKTtcbiAgICB9IGVsc2UgaWYgKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRicm93c2VyV2luZG93ID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIHJlcXVpcmUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRzY2hlZHVsZUZsdXNoID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJGF0dGVtcHRWZXJ0ZXgoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2ggPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlU2V0VGltZW91dCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG5vb3AoKSB7fVxuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBFTkRJTkcgICA9IHZvaWQgMDtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRlVMRklMTEVEID0gMTtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQgID0gMjtcblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRHRVRfVEhFTl9FUlJPUiA9IG5ldyBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRFcnJvck9iamVjdCgpO1xuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkc2VsZkZ1bGxmaWxsbWVudCgpIHtcbiAgICAgIHJldHVybiBuZXcgVHlwZUVycm9yKFwiWW91IGNhbm5vdCByZXNvbHZlIGEgcHJvbWlzZSB3aXRoIGl0c2VsZlwiKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRjYW5ub3RSZXR1cm5Pd24oKSB7XG4gICAgICByZXR1cm4gbmV3IFR5cGVFcnJvcignQSBwcm9taXNlcyBjYWxsYmFjayBjYW5ub3QgcmV0dXJuIHRoYXQgc2FtZSBwcm9taXNlLicpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGdldFRoZW4ocHJvbWlzZSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHByb21pc2UudGhlbjtcbiAgICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkR0VUX1RIRU5fRVJST1IuZXJyb3IgPSBlcnJvcjtcbiAgICAgICAgcmV0dXJuIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEdFVF9USEVOX0VSUk9SO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHRyeVRoZW4odGhlbiwgdmFsdWUsIGZ1bGZpbGxtZW50SGFuZGxlciwgcmVqZWN0aW9uSGFuZGxlcikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhlbi5jYWxsKHZhbHVlLCBmdWxmaWxsbWVudEhhbmRsZXIsIHJlamVjdGlvbkhhbmRsZXIpO1xuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIHJldHVybiBlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGhhbmRsZUZvcmVpZ25UaGVuYWJsZShwcm9taXNlLCB0aGVuYWJsZSwgdGhlbikge1xuICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRkZWZhdWx0KGZ1bmN0aW9uKHByb21pc2UpIHtcbiAgICAgICAgdmFyIHNlYWxlZCA9IGZhbHNlO1xuICAgICAgICB2YXIgZXJyb3IgPSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCR0cnlUaGVuKHRoZW4sIHRoZW5hYmxlLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgIGlmIChzZWFsZWQpIHsgcmV0dXJuOyB9XG4gICAgICAgICAgc2VhbGVkID0gdHJ1ZTtcbiAgICAgICAgICBpZiAodGhlbmFibGUgIT09IHZhbHVlKSB7XG4gICAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCB2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbihyZWFzb24pIHtcbiAgICAgICAgICBpZiAoc2VhbGVkKSB7IHJldHVybjsgfVxuICAgICAgICAgIHNlYWxlZCA9IHRydWU7XG5cbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgICAgICAgfSwgJ1NldHRsZTogJyArIChwcm9taXNlLl9sYWJlbCB8fCAnIHVua25vd24gcHJvbWlzZScpKTtcblxuICAgICAgICBpZiAoIXNlYWxlZCAmJiBlcnJvcikge1xuICAgICAgICAgIHNlYWxlZCA9IHRydWU7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfSwgcHJvbWlzZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaGFuZGxlT3duVGhlbmFibGUocHJvbWlzZSwgdGhlbmFibGUpIHtcbiAgICAgIGlmICh0aGVuYWJsZS5fc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIHRoZW5hYmxlLl9yZXN1bHQpO1xuICAgICAgfSBlbHNlIGlmICh0aGVuYWJsZS5fc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVEKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCB0aGVuYWJsZS5fcmVzdWx0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHN1YnNjcmliZSh0aGVuYWJsZSwgdW5kZWZpbmVkLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgICB9LCBmdW5jdGlvbihyZWFzb24pIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaGFuZGxlTWF5YmVUaGVuYWJsZShwcm9taXNlLCBtYXliZVRoZW5hYmxlKSB7XG4gICAgICBpZiAobWF5YmVUaGVuYWJsZS5jb25zdHJ1Y3RvciA9PT0gcHJvbWlzZS5jb25zdHJ1Y3Rvcikge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRoYW5kbGVPd25UaGVuYWJsZShwcm9taXNlLCBtYXliZVRoZW5hYmxlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciB0aGVuID0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZ2V0VGhlbihtYXliZVRoZW5hYmxlKTtcblxuICAgICAgICBpZiAodGhlbiA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkR0VUX1RIRU5fRVJST1IpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkR0VUX1RIRU5fRVJST1IuZXJyb3IpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoZW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSk7XG4gICAgICAgIH0gZWxzZSBpZiAobGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc0Z1bmN0aW9uKHRoZW4pKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaGFuZGxlRm9yZWlnblRoZW5hYmxlKHByb21pc2UsIG1heWJlVGhlbmFibGUsIHRoZW4pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZXNvbHZlKHByb21pc2UsIHZhbHVlKSB7XG4gICAgICBpZiAocHJvbWlzZSA9PT0gdmFsdWUpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHNlbGZGdWxsZmlsbG1lbnQoKSk7XG4gICAgICB9IGVsc2UgaWYgKGxpYiRlczYkcHJvbWlzZSR1dGlscyQkb2JqZWN0T3JGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaGFuZGxlTWF5YmVUaGVuYWJsZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRwdWJsaXNoUmVqZWN0aW9uKHByb21pc2UpIHtcbiAgICAgIGlmIChwcm9taXNlLl9vbmVycm9yKSB7XG4gICAgICAgIHByb21pc2UuX29uZXJyb3IocHJvbWlzZS5fcmVzdWx0KTtcbiAgICAgIH1cblxuICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcHVibGlzaChwcm9taXNlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIHZhbHVlKSB7XG4gICAgICBpZiAocHJvbWlzZS5fc3RhdGUgIT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBFTkRJTkcpIHsgcmV0dXJuOyB9XG5cbiAgICAgIHByb21pc2UuX3Jlc3VsdCA9IHZhbHVlO1xuICAgICAgcHJvbWlzZS5fc3RhdGUgPSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRGVUxGSUxMRUQ7XG5cbiAgICAgIGlmIChwcm9taXNlLl9zdWJzY3JpYmVycy5sZW5ndGggIT09IDApIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJGRlZmF1bHQobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcHVibGlzaCwgcHJvbWlzZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHJlYXNvbikge1xuICAgICAgaWYgKHByb21pc2UuX3N0YXRlICE9PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HKSB7IHJldHVybjsgfVxuICAgICAgcHJvbWlzZS5fc3RhdGUgPSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRSRUpFQ1RFRDtcbiAgICAgIHByb21pc2UuX3Jlc3VsdCA9IHJlYXNvbjtcblxuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJGRlZmF1bHQobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcHVibGlzaFJlamVjdGlvbiwgcHJvbWlzZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkc3Vic2NyaWJlKHBhcmVudCwgY2hpbGQsIG9uRnVsZmlsbG1lbnQsIG9uUmVqZWN0aW9uKSB7XG4gICAgICB2YXIgc3Vic2NyaWJlcnMgPSBwYXJlbnQuX3N1YnNjcmliZXJzO1xuICAgICAgdmFyIGxlbmd0aCA9IHN1YnNjcmliZXJzLmxlbmd0aDtcblxuICAgICAgcGFyZW50Ll9vbmVycm9yID0gbnVsbDtcblxuICAgICAgc3Vic2NyaWJlcnNbbGVuZ3RoXSA9IGNoaWxkO1xuICAgICAgc3Vic2NyaWJlcnNbbGVuZ3RoICsgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRlVMRklMTEVEXSA9IG9uRnVsZmlsbG1lbnQ7XG4gICAgICBzdWJzY3JpYmVyc1tsZW5ndGggKyBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRSRUpFQ1RFRF0gID0gb25SZWplY3Rpb247XG5cbiAgICAgIGlmIChsZW5ndGggPT09IDAgJiYgcGFyZW50Ll9zdGF0ZSkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkZGVmYXVsdChsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRwdWJsaXNoLCBwYXJlbnQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHB1Ymxpc2gocHJvbWlzZSkge1xuICAgICAgdmFyIHN1YnNjcmliZXJzID0gcHJvbWlzZS5fc3Vic2NyaWJlcnM7XG4gICAgICB2YXIgc2V0dGxlZCA9IHByb21pc2UuX3N0YXRlO1xuXG4gICAgICBpZiAoc3Vic2NyaWJlcnMubGVuZ3RoID09PSAwKSB7IHJldHVybjsgfVxuXG4gICAgICB2YXIgY2hpbGQsIGNhbGxiYWNrLCBkZXRhaWwgPSBwcm9taXNlLl9yZXN1bHQ7XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3Vic2NyaWJlcnMubGVuZ3RoOyBpICs9IDMpIHtcbiAgICAgICAgY2hpbGQgPSBzdWJzY3JpYmVyc1tpXTtcbiAgICAgICAgY2FsbGJhY2sgPSBzdWJzY3JpYmVyc1tpICsgc2V0dGxlZF07XG5cbiAgICAgICAgaWYgKGNoaWxkKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaW52b2tlQ2FsbGJhY2soc2V0dGxlZCwgY2hpbGQsIGNhbGxiYWNrLCBkZXRhaWwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNhbGxiYWNrKGRldGFpbCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcHJvbWlzZS5fc3Vic2NyaWJlcnMubGVuZ3RoID0gMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRFcnJvck9iamVjdCgpIHtcbiAgICAgIHRoaXMuZXJyb3IgPSBudWxsO1xuICAgIH1cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRUUllfQ0FUQ0hfRVJST1IgPSBuZXcgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRXJyb3JPYmplY3QoKTtcblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHRyeUNhdGNoKGNhbGxiYWNrLCBkZXRhaWwpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayhkZXRhaWwpO1xuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFRSWV9DQVRDSF9FUlJPUi5lcnJvciA9IGU7XG4gICAgICAgIHJldHVybiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRUUllfQ0FUQ0hfRVJST1I7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaW52b2tlQ2FsbGJhY2soc2V0dGxlZCwgcHJvbWlzZSwgY2FsbGJhY2ssIGRldGFpbCkge1xuICAgICAgdmFyIGhhc0NhbGxiYWNrID0gbGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc0Z1bmN0aW9uKGNhbGxiYWNrKSxcbiAgICAgICAgICB2YWx1ZSwgZXJyb3IsIHN1Y2NlZWRlZCwgZmFpbGVkO1xuXG4gICAgICBpZiAoaGFzQ2FsbGJhY2spIHtcbiAgICAgICAgdmFsdWUgPSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCR0cnlDYXRjaChjYWxsYmFjaywgZGV0YWlsKTtcblxuICAgICAgICBpZiAodmFsdWUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFRSWV9DQVRDSF9FUlJPUikge1xuICAgICAgICAgIGZhaWxlZCA9IHRydWU7XG4gICAgICAgICAgZXJyb3IgPSB2YWx1ZS5lcnJvcjtcbiAgICAgICAgICB2YWx1ZSA9IG51bGw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3VjY2VlZGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcm9taXNlID09PSB2YWx1ZSkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRjYW5ub3RSZXR1cm5Pd24oKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhbHVlID0gZGV0YWlsO1xuICAgICAgICBzdWNjZWVkZWQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAocHJvbWlzZS5fc3RhdGUgIT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBFTkRJTkcpIHtcbiAgICAgICAgLy8gbm9vcFxuICAgICAgfSBlbHNlIGlmIChoYXNDYWxsYmFjayAmJiBzdWNjZWVkZWQpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgICB9IGVsc2UgaWYgKGZhaWxlZCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgZXJyb3IpO1xuICAgICAgfSBlbHNlIGlmIChzZXR0bGVkID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRGVUxGSUxMRUQpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCB2YWx1ZSk7XG4gICAgICB9IGVsc2UgaWYgKHNldHRsZWQgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVEKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaW5pdGlhbGl6ZVByb21pc2UocHJvbWlzZSwgcmVzb2x2ZXIpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJlc29sdmVyKGZ1bmN0aW9uIHJlc29sdmVQcm9taXNlKHZhbHVlKXtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gcmVqZWN0UHJvbWlzZShyZWFzb24pIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yKENvbnN0cnVjdG9yLCBpbnB1dCkge1xuICAgICAgdmFyIGVudW1lcmF0b3IgPSB0aGlzO1xuXG4gICAgICBlbnVtZXJhdG9yLl9pbnN0YW5jZUNvbnN0cnVjdG9yID0gQ29uc3RydWN0b3I7XG4gICAgICBlbnVtZXJhdG9yLnByb21pc2UgPSBuZXcgQ29uc3RydWN0b3IobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbm9vcCk7XG5cbiAgICAgIGlmIChlbnVtZXJhdG9yLl92YWxpZGF0ZUlucHV0KGlucHV0KSkge1xuICAgICAgICBlbnVtZXJhdG9yLl9pbnB1dCAgICAgPSBpbnB1dDtcbiAgICAgICAgZW51bWVyYXRvci5sZW5ndGggICAgID0gaW5wdXQubGVuZ3RoO1xuICAgICAgICBlbnVtZXJhdG9yLl9yZW1haW5pbmcgPSBpbnB1dC5sZW5ndGg7XG5cbiAgICAgICAgZW51bWVyYXRvci5faW5pdCgpO1xuXG4gICAgICAgIGlmIChlbnVtZXJhdG9yLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwoZW51bWVyYXRvci5wcm9taXNlLCBlbnVtZXJhdG9yLl9yZXN1bHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVudW1lcmF0b3IubGVuZ3RoID0gZW51bWVyYXRvci5sZW5ndGggfHwgMDtcbiAgICAgICAgICBlbnVtZXJhdG9yLl9lbnVtZXJhdGUoKTtcbiAgICAgICAgICBpZiAoZW51bWVyYXRvci5fcmVtYWluaW5nID09PSAwKSB7XG4gICAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKGVudW1lcmF0b3IucHJvbWlzZSwgZW51bWVyYXRvci5fcmVzdWx0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChlbnVtZXJhdG9yLnByb21pc2UsIGVudW1lcmF0b3IuX3ZhbGlkYXRpb25FcnJvcigpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvci5wcm90b3R5cGUuX3ZhbGlkYXRlSW5wdXQgPSBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgcmV0dXJuIGxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNBcnJheShpbnB1dCk7XG4gICAgfTtcblxuICAgIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yLnByb3RvdHlwZS5fdmFsaWRhdGlvbkVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IEVycm9yKCdBcnJheSBNZXRob2RzIG11c3QgYmUgcHJvdmlkZWQgYW4gQXJyYXknKTtcbiAgICB9O1xuXG4gICAgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJEVudW1lcmF0b3IucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9yZXN1bHQgPSBuZXcgQXJyYXkodGhpcy5sZW5ndGgpO1xuICAgIH07XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvcjtcblxuICAgIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yLnByb3RvdHlwZS5fZW51bWVyYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZW51bWVyYXRvciA9IHRoaXM7XG5cbiAgICAgIHZhciBsZW5ndGggID0gZW51bWVyYXRvci5sZW5ndGg7XG4gICAgICB2YXIgcHJvbWlzZSA9IGVudW1lcmF0b3IucHJvbWlzZTtcbiAgICAgIHZhciBpbnB1dCAgID0gZW51bWVyYXRvci5faW5wdXQ7XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBwcm9taXNlLl9zdGF0ZSA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUEVORElORyAmJiBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZW51bWVyYXRvci5fZWFjaEVudHJ5KGlucHV0W2ldLCBpKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJEVudW1lcmF0b3IucHJvdG90eXBlLl9lYWNoRW50cnkgPSBmdW5jdGlvbihlbnRyeSwgaSkge1xuICAgICAgdmFyIGVudW1lcmF0b3IgPSB0aGlzO1xuICAgICAgdmFyIGMgPSBlbnVtZXJhdG9yLl9pbnN0YW5jZUNvbnN0cnVjdG9yO1xuXG4gICAgICBpZiAobGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc01heWJlVGhlbmFibGUoZW50cnkpKSB7XG4gICAgICAgIGlmIChlbnRyeS5jb25zdHJ1Y3RvciA9PT0gYyAmJiBlbnRyeS5fc3RhdGUgIT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBFTkRJTkcpIHtcbiAgICAgICAgICBlbnRyeS5fb25lcnJvciA9IG51bGw7XG4gICAgICAgICAgZW51bWVyYXRvci5fc2V0dGxlZEF0KGVudHJ5Ll9zdGF0ZSwgaSwgZW50cnkuX3Jlc3VsdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZW51bWVyYXRvci5fd2lsbFNldHRsZUF0KGMucmVzb2x2ZShlbnRyeSksIGkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbnVtZXJhdG9yLl9yZW1haW5pbmctLTtcbiAgICAgICAgZW51bWVyYXRvci5fcmVzdWx0W2ldID0gZW50cnk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yLnByb3RvdHlwZS5fc2V0dGxlZEF0ID0gZnVuY3Rpb24oc3RhdGUsIGksIHZhbHVlKSB7XG4gICAgICB2YXIgZW51bWVyYXRvciA9IHRoaXM7XG4gICAgICB2YXIgcHJvbWlzZSA9IGVudW1lcmF0b3IucHJvbWlzZTtcblxuICAgICAgaWYgKHByb21pc2UuX3N0YXRlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HKSB7XG4gICAgICAgIGVudW1lcmF0b3IuX3JlbWFpbmluZy0tO1xuXG4gICAgICAgIGlmIChzdGF0ZSA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVudW1lcmF0b3IuX3Jlc3VsdFtpXSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChlbnVtZXJhdG9yLl9yZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCBlbnVtZXJhdG9yLl9yZXN1bHQpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvci5wcm90b3R5cGUuX3dpbGxTZXR0bGVBdCA9IGZ1bmN0aW9uKHByb21pc2UsIGkpIHtcbiAgICAgIHZhciBlbnVtZXJhdG9yID0gdGhpcztcblxuICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkc3Vic2NyaWJlKHByb21pc2UsIHVuZGVmaW5lZCwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgZW51bWVyYXRvci5fc2V0dGxlZEF0KGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRCwgaSwgdmFsdWUpO1xuICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgICAgIGVudW1lcmF0b3IuX3NldHRsZWRBdChsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRSRUpFQ1RFRCwgaSwgcmVhc29uKTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkYWxsJCRhbGwoZW50cmllcykge1xuICAgICAgcmV0dXJuIG5ldyBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkZGVmYXVsdCh0aGlzLCBlbnRyaWVzKS5wcm9taXNlO1xuICAgIH1cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHByb21pc2UkYWxsJCRkZWZhdWx0ID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkYWxsJCRhbGw7XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmFjZSQkcmFjZShlbnRyaWVzKSB7XG4gICAgICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICAgICAgdmFyIENvbnN0cnVjdG9yID0gdGhpcztcblxuICAgICAgdmFyIHByb21pc2UgPSBuZXcgQ29uc3RydWN0b3IobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbm9vcCk7XG5cbiAgICAgIGlmICghbGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc0FycmF5KGVudHJpZXMpKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCBuZXcgVHlwZUVycm9yKCdZb3UgbXVzdCBwYXNzIGFuIGFycmF5IHRvIHJhY2UuJykpO1xuICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgIH1cblxuICAgICAgdmFyIGxlbmd0aCA9IGVudHJpZXMubGVuZ3RoO1xuXG4gICAgICBmdW5jdGlvbiBvbkZ1bGZpbGxtZW50KHZhbHVlKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBvblJlamVjdGlvbihyZWFzb24pIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gICAgICB9XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBwcm9taXNlLl9zdGF0ZSA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUEVORElORyAmJiBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkc3Vic2NyaWJlKENvbnN0cnVjdG9yLnJlc29sdmUoZW50cmllc1tpXSksIHVuZGVmaW5lZCwgb25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJhY2UkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyYWNlJCRyYWNlO1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlc29sdmUkJHJlc29sdmUob2JqZWN0KSB7XG4gICAgICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICAgICAgdmFyIENvbnN0cnVjdG9yID0gdGhpcztcblxuICAgICAgaWYgKG9iamVjdCAmJiB0eXBlb2Ygb2JqZWN0ID09PSAnb2JqZWN0JyAmJiBvYmplY3QuY29uc3RydWN0b3IgPT09IENvbnN0cnVjdG9yKSB7XG4gICAgICAgIHJldHVybiBvYmplY3Q7XG4gICAgICB9XG5cbiAgICAgIHZhciBwcm9taXNlID0gbmV3IENvbnN0cnVjdG9yKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG5vb3ApO1xuICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVzb2x2ZShwcm9taXNlLCBvYmplY3QpO1xuICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZXNvbHZlJCRkZWZhdWx0ID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVzb2x2ZSQkcmVzb2x2ZTtcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZWplY3QkJHJlamVjdChyZWFzb24pIHtcbiAgICAgIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gICAgICB2YXIgQ29uc3RydWN0b3IgPSB0aGlzO1xuICAgICAgdmFyIHByb21pc2UgPSBuZXcgQ29uc3RydWN0b3IobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbm9vcCk7XG4gICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH1cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVqZWN0JCRkZWZhdWx0ID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVqZWN0JCRyZWplY3Q7XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJGNvdW50ZXIgPSAwO1xuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkJG5lZWRzUmVzb2x2ZXIoKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdZb3UgbXVzdCBwYXNzIGEgcmVzb2x2ZXIgZnVuY3Rpb24gYXMgdGhlIGZpcnN0IGFyZ3VtZW50IHRvIHRoZSBwcm9taXNlIGNvbnN0cnVjdG9yJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkJG5lZWRzTmV3KCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkZhaWxlZCB0byBjb25zdHJ1Y3QgJ1Byb21pc2UnOiBQbGVhc2UgdXNlIHRoZSAnbmV3JyBvcGVyYXRvciwgdGhpcyBvYmplY3QgY29uc3RydWN0b3IgY2Fubm90IGJlIGNhbGxlZCBhcyBhIGZ1bmN0aW9uLlwiKTtcbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZTtcbiAgICAvKipcbiAgICAgIFByb21pc2Ugb2JqZWN0cyByZXByZXNlbnQgdGhlIGV2ZW50dWFsIHJlc3VsdCBvZiBhbiBhc3luY2hyb25vdXMgb3BlcmF0aW9uLiBUaGVcbiAgICAgIHByaW1hcnkgd2F5IG9mIGludGVyYWN0aW5nIHdpdGggYSBwcm9taXNlIGlzIHRocm91Z2ggaXRzIGB0aGVuYCBtZXRob2QsIHdoaWNoXG4gICAgICByZWdpc3RlcnMgY2FsbGJhY2tzIHRvIHJlY2VpdmUgZWl0aGVyIGEgcHJvbWlzZeKAmXMgZXZlbnR1YWwgdmFsdWUgb3IgdGhlIHJlYXNvblxuICAgICAgd2h5IHRoZSBwcm9taXNlIGNhbm5vdCBiZSBmdWxmaWxsZWQuXG5cbiAgICAgIFRlcm1pbm9sb2d5XG4gICAgICAtLS0tLS0tLS0tLVxuXG4gICAgICAtIGBwcm9taXNlYCBpcyBhbiBvYmplY3Qgb3IgZnVuY3Rpb24gd2l0aCBhIGB0aGVuYCBtZXRob2Qgd2hvc2UgYmVoYXZpb3IgY29uZm9ybXMgdG8gdGhpcyBzcGVjaWZpY2F0aW9uLlxuICAgICAgLSBgdGhlbmFibGVgIGlzIGFuIG9iamVjdCBvciBmdW5jdGlvbiB0aGF0IGRlZmluZXMgYSBgdGhlbmAgbWV0aG9kLlxuICAgICAgLSBgdmFsdWVgIGlzIGFueSBsZWdhbCBKYXZhU2NyaXB0IHZhbHVlIChpbmNsdWRpbmcgdW5kZWZpbmVkLCBhIHRoZW5hYmxlLCBvciBhIHByb21pc2UpLlxuICAgICAgLSBgZXhjZXB0aW9uYCBpcyBhIHZhbHVlIHRoYXQgaXMgdGhyb3duIHVzaW5nIHRoZSB0aHJvdyBzdGF0ZW1lbnQuXG4gICAgICAtIGByZWFzb25gIGlzIGEgdmFsdWUgdGhhdCBpbmRpY2F0ZXMgd2h5IGEgcHJvbWlzZSB3YXMgcmVqZWN0ZWQuXG4gICAgICAtIGBzZXR0bGVkYCB0aGUgZmluYWwgcmVzdGluZyBzdGF0ZSBvZiBhIHByb21pc2UsIGZ1bGZpbGxlZCBvciByZWplY3RlZC5cblxuICAgICAgQSBwcm9taXNlIGNhbiBiZSBpbiBvbmUgb2YgdGhyZWUgc3RhdGVzOiBwZW5kaW5nLCBmdWxmaWxsZWQsIG9yIHJlamVjdGVkLlxuXG4gICAgICBQcm9taXNlcyB0aGF0IGFyZSBmdWxmaWxsZWQgaGF2ZSBhIGZ1bGZpbGxtZW50IHZhbHVlIGFuZCBhcmUgaW4gdGhlIGZ1bGZpbGxlZFxuICAgICAgc3RhdGUuICBQcm9taXNlcyB0aGF0IGFyZSByZWplY3RlZCBoYXZlIGEgcmVqZWN0aW9uIHJlYXNvbiBhbmQgYXJlIGluIHRoZVxuICAgICAgcmVqZWN0ZWQgc3RhdGUuICBBIGZ1bGZpbGxtZW50IHZhbHVlIGlzIG5ldmVyIGEgdGhlbmFibGUuXG5cbiAgICAgIFByb21pc2VzIGNhbiBhbHNvIGJlIHNhaWQgdG8gKnJlc29sdmUqIGEgdmFsdWUuICBJZiB0aGlzIHZhbHVlIGlzIGFsc28gYVxuICAgICAgcHJvbWlzZSwgdGhlbiB0aGUgb3JpZ2luYWwgcHJvbWlzZSdzIHNldHRsZWQgc3RhdGUgd2lsbCBtYXRjaCB0aGUgdmFsdWUnc1xuICAgICAgc2V0dGxlZCBzdGF0ZS4gIFNvIGEgcHJvbWlzZSB0aGF0ICpyZXNvbHZlcyogYSBwcm9taXNlIHRoYXQgcmVqZWN0cyB3aWxsXG4gICAgICBpdHNlbGYgcmVqZWN0LCBhbmQgYSBwcm9taXNlIHRoYXQgKnJlc29sdmVzKiBhIHByb21pc2UgdGhhdCBmdWxmaWxscyB3aWxsXG4gICAgICBpdHNlbGYgZnVsZmlsbC5cblxuXG4gICAgICBCYXNpYyBVc2FnZTpcbiAgICAgIC0tLS0tLS0tLS0tLVxuXG4gICAgICBgYGBqc1xuICAgICAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgLy8gb24gc3VjY2Vzc1xuICAgICAgICByZXNvbHZlKHZhbHVlKTtcblxuICAgICAgICAvLyBvbiBmYWlsdXJlXG4gICAgICAgIHJlamVjdChyZWFzb24pO1xuICAgICAgfSk7XG5cbiAgICAgIHByb21pc2UudGhlbihmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAvLyBvbiBmdWxmaWxsbWVudFxuICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgICAgIC8vIG9uIHJlamVjdGlvblxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQWR2YW5jZWQgVXNhZ2U6XG4gICAgICAtLS0tLS0tLS0tLS0tLS1cblxuICAgICAgUHJvbWlzZXMgc2hpbmUgd2hlbiBhYnN0cmFjdGluZyBhd2F5IGFzeW5jaHJvbm91cyBpbnRlcmFjdGlvbnMgc3VjaCBhc1xuICAgICAgYFhNTEh0dHBSZXF1ZXN0YHMuXG5cbiAgICAgIGBgYGpzXG4gICAgICBmdW5jdGlvbiBnZXRKU09OKHVybCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICAgICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAgICAgICB4aHIub3BlbignR0VUJywgdXJsKTtcbiAgICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gaGFuZGxlcjtcbiAgICAgICAgICB4aHIucmVzcG9uc2VUeXBlID0gJ2pzb24nO1xuICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdBY2NlcHQnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgIHhoci5zZW5kKCk7XG5cbiAgICAgICAgICBmdW5jdGlvbiBoYW5kbGVyKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMucmVhZHlTdGF0ZSA9PT0gdGhpcy5ET05FKSB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLnJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKCdnZXRKU09OOiBgJyArIHVybCArICdgIGZhaWxlZCB3aXRoIHN0YXR1czogWycgKyB0aGlzLnN0YXR1cyArICddJykpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGdldEpTT04oJy9wb3N0cy5qc29uJykudGhlbihmdW5jdGlvbihqc29uKSB7XG4gICAgICAgIC8vIG9uIGZ1bGZpbGxtZW50XG4gICAgICB9LCBmdW5jdGlvbihyZWFzb24pIHtcbiAgICAgICAgLy8gb24gcmVqZWN0aW9uXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBVbmxpa2UgY2FsbGJhY2tzLCBwcm9taXNlcyBhcmUgZ3JlYXQgY29tcG9zYWJsZSBwcmltaXRpdmVzLlxuXG4gICAgICBgYGBqc1xuICAgICAgUHJvbWlzZS5hbGwoW1xuICAgICAgICBnZXRKU09OKCcvcG9zdHMnKSxcbiAgICAgICAgZ2V0SlNPTignL2NvbW1lbnRzJylcbiAgICAgIF0pLnRoZW4oZnVuY3Rpb24odmFsdWVzKXtcbiAgICAgICAgdmFsdWVzWzBdIC8vID0+IHBvc3RzSlNPTlxuICAgICAgICB2YWx1ZXNbMV0gLy8gPT4gY29tbWVudHNKU09OXG5cbiAgICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIEBjbGFzcyBQcm9taXNlXG4gICAgICBAcGFyYW0ge2Z1bmN0aW9ufSByZXNvbHZlclxuICAgICAgVXNlZnVsIGZvciB0b29saW5nLlxuICAgICAgQGNvbnN0cnVjdG9yXG4gICAgKi9cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZShyZXNvbHZlcikge1xuICAgICAgdGhpcy5faWQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkY291bnRlcisrO1xuICAgICAgdGhpcy5fc3RhdGUgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLl9yZXN1bHQgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLl9zdWJzY3JpYmVycyA9IFtdO1xuXG4gICAgICBpZiAobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbm9vcCAhPT0gcmVzb2x2ZXIpIHtcbiAgICAgICAgaWYgKCFsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzRnVuY3Rpb24ocmVzb2x2ZXIpKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJG5lZWRzUmVzb2x2ZXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZSkpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkbmVlZHNOZXcoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGluaXRpYWxpemVQcm9taXNlKHRoaXMsIHJlc29sdmVyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZS5hbGwgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRhbGwkJGRlZmF1bHQ7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UucmFjZSA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJhY2UkJGRlZmF1bHQ7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UucmVzb2x2ZSA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlc29sdmUkJGRlZmF1bHQ7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UucmVqZWN0ID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVqZWN0JCRkZWZhdWx0O1xuXG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UucHJvdG90eXBlID0ge1xuICAgICAgY29uc3RydWN0b3I6IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLFxuXG4gICAgLyoqXG4gICAgICBUaGUgcHJpbWFyeSB3YXkgb2YgaW50ZXJhY3Rpbmcgd2l0aCBhIHByb21pc2UgaXMgdGhyb3VnaCBpdHMgYHRoZW5gIG1ldGhvZCxcbiAgICAgIHdoaWNoIHJlZ2lzdGVycyBjYWxsYmFja3MgdG8gcmVjZWl2ZSBlaXRoZXIgYSBwcm9taXNlJ3MgZXZlbnR1YWwgdmFsdWUgb3IgdGhlXG4gICAgICByZWFzb24gd2h5IHRoZSBwcm9taXNlIGNhbm5vdCBiZSBmdWxmaWxsZWQuXG5cbiAgICAgIGBgYGpzXG4gICAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24odXNlcil7XG4gICAgICAgIC8vIHVzZXIgaXMgYXZhaWxhYmxlXG4gICAgICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgICAgICAvLyB1c2VyIGlzIHVuYXZhaWxhYmxlLCBhbmQgeW91IGFyZSBnaXZlbiB0aGUgcmVhc29uIHdoeVxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQ2hhaW5pbmdcbiAgICAgIC0tLS0tLS0tXG5cbiAgICAgIFRoZSByZXR1cm4gdmFsdWUgb2YgYHRoZW5gIGlzIGl0c2VsZiBhIHByb21pc2UuICBUaGlzIHNlY29uZCwgJ2Rvd25zdHJlYW0nXG4gICAgICBwcm9taXNlIGlzIHJlc29sdmVkIHdpdGggdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgZmlyc3QgcHJvbWlzZSdzIGZ1bGZpbGxtZW50XG4gICAgICBvciByZWplY3Rpb24gaGFuZGxlciwgb3IgcmVqZWN0ZWQgaWYgdGhlIGhhbmRsZXIgdGhyb3dzIGFuIGV4Y2VwdGlvbi5cblxuICAgICAgYGBganNcbiAgICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICByZXR1cm4gdXNlci5uYW1lO1xuICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICByZXR1cm4gJ2RlZmF1bHQgbmFtZSc7XG4gICAgICB9KS50aGVuKGZ1bmN0aW9uICh1c2VyTmFtZSkge1xuICAgICAgICAvLyBJZiBgZmluZFVzZXJgIGZ1bGZpbGxlZCwgYHVzZXJOYW1lYCB3aWxsIGJlIHRoZSB1c2VyJ3MgbmFtZSwgb3RoZXJ3aXNlIGl0XG4gICAgICAgIC8vIHdpbGwgYmUgYCdkZWZhdWx0IG5hbWUnYFxuICAgICAgfSk7XG5cbiAgICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZvdW5kIHVzZXIsIGJ1dCBzdGlsbCB1bmhhcHB5Jyk7XG4gICAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignYGZpbmRVc2VyYCByZWplY3RlZCBhbmQgd2UncmUgdW5oYXBweScpO1xuICAgICAgfSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgLy8gbmV2ZXIgcmVhY2hlZFxuICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICAvLyBpZiBgZmluZFVzZXJgIGZ1bGZpbGxlZCwgYHJlYXNvbmAgd2lsbCBiZSAnRm91bmQgdXNlciwgYnV0IHN0aWxsIHVuaGFwcHknLlxuICAgICAgICAvLyBJZiBgZmluZFVzZXJgIHJlamVjdGVkLCBgcmVhc29uYCB3aWxsIGJlICdgZmluZFVzZXJgIHJlamVjdGVkIGFuZCB3ZSdyZSB1bmhhcHB5Jy5cbiAgICAgIH0pO1xuICAgICAgYGBgXG4gICAgICBJZiB0aGUgZG93bnN0cmVhbSBwcm9taXNlIGRvZXMgbm90IHNwZWNpZnkgYSByZWplY3Rpb24gaGFuZGxlciwgcmVqZWN0aW9uIHJlYXNvbnMgd2lsbCBiZSBwcm9wYWdhdGVkIGZ1cnRoZXIgZG93bnN0cmVhbS5cblxuICAgICAgYGBganNcbiAgICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICB0aHJvdyBuZXcgUGVkYWdvZ2ljYWxFeGNlcHRpb24oJ1Vwc3RyZWFtIGVycm9yJyk7XG4gICAgICB9KS50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAvLyBuZXZlciByZWFjaGVkXG4gICAgICB9KS50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAvLyBuZXZlciByZWFjaGVkXG4gICAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIC8vIFRoZSBgUGVkZ2Fnb2NpYWxFeGNlcHRpb25gIGlzIHByb3BhZ2F0ZWQgYWxsIHRoZSB3YXkgZG93biB0byBoZXJlXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBBc3NpbWlsYXRpb25cbiAgICAgIC0tLS0tLS0tLS0tLVxuXG4gICAgICBTb21ldGltZXMgdGhlIHZhbHVlIHlvdSB3YW50IHRvIHByb3BhZ2F0ZSB0byBhIGRvd25zdHJlYW0gcHJvbWlzZSBjYW4gb25seSBiZVxuICAgICAgcmV0cmlldmVkIGFzeW5jaHJvbm91c2x5LiBUaGlzIGNhbiBiZSBhY2hpZXZlZCBieSByZXR1cm5pbmcgYSBwcm9taXNlIGluIHRoZVxuICAgICAgZnVsZmlsbG1lbnQgb3IgcmVqZWN0aW9uIGhhbmRsZXIuIFRoZSBkb3duc3RyZWFtIHByb21pc2Ugd2lsbCB0aGVuIGJlIHBlbmRpbmdcbiAgICAgIHVudGlsIHRoZSByZXR1cm5lZCBwcm9taXNlIGlzIHNldHRsZWQuIFRoaXMgaXMgY2FsbGVkICphc3NpbWlsYXRpb24qLlxuXG4gICAgICBgYGBqc1xuICAgICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgIHJldHVybiBmaW5kQ29tbWVudHNCeUF1dGhvcih1c2VyKTtcbiAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKGNvbW1lbnRzKSB7XG4gICAgICAgIC8vIFRoZSB1c2VyJ3MgY29tbWVudHMgYXJlIG5vdyBhdmFpbGFibGVcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIElmIHRoZSBhc3NpbWxpYXRlZCBwcm9taXNlIHJlamVjdHMsIHRoZW4gdGhlIGRvd25zdHJlYW0gcHJvbWlzZSB3aWxsIGFsc28gcmVqZWN0LlxuXG4gICAgICBgYGBqc1xuICAgICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgIHJldHVybiBmaW5kQ29tbWVudHNCeUF1dGhvcih1c2VyKTtcbiAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKGNvbW1lbnRzKSB7XG4gICAgICAgIC8vIElmIGBmaW5kQ29tbWVudHNCeUF1dGhvcmAgZnVsZmlsbHMsIHdlJ2xsIGhhdmUgdGhlIHZhbHVlIGhlcmVcbiAgICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgLy8gSWYgYGZpbmRDb21tZW50c0J5QXV0aG9yYCByZWplY3RzLCB3ZSdsbCBoYXZlIHRoZSByZWFzb24gaGVyZVxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgU2ltcGxlIEV4YW1wbGVcbiAgICAgIC0tLS0tLS0tLS0tLS0tXG5cbiAgICAgIFN5bmNocm9ub3VzIEV4YW1wbGVcblxuICAgICAgYGBgamF2YXNjcmlwdFxuICAgICAgdmFyIHJlc3VsdDtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzdWx0ID0gZmluZFJlc3VsdCgpO1xuICAgICAgICAvLyBzdWNjZXNzXG4gICAgICB9IGNhdGNoKHJlYXNvbikge1xuICAgICAgICAvLyBmYWlsdXJlXG4gICAgICB9XG4gICAgICBgYGBcblxuICAgICAgRXJyYmFjayBFeGFtcGxlXG5cbiAgICAgIGBgYGpzXG4gICAgICBmaW5kUmVzdWx0KGZ1bmN0aW9uKHJlc3VsdCwgZXJyKXtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIC8vIGZhaWx1cmVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBzdWNjZXNzXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIFByb21pc2UgRXhhbXBsZTtcblxuICAgICAgYGBgamF2YXNjcmlwdFxuICAgICAgZmluZFJlc3VsdCgpLnRoZW4oZnVuY3Rpb24ocmVzdWx0KXtcbiAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKXtcbiAgICAgICAgLy8gZmFpbHVyZVxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQWR2YW5jZWQgRXhhbXBsZVxuICAgICAgLS0tLS0tLS0tLS0tLS1cblxuICAgICAgU3luY2hyb25vdXMgRXhhbXBsZVxuXG4gICAgICBgYGBqYXZhc2NyaXB0XG4gICAgICB2YXIgYXV0aG9yLCBib29rcztcblxuICAgICAgdHJ5IHtcbiAgICAgICAgYXV0aG9yID0gZmluZEF1dGhvcigpO1xuICAgICAgICBib29rcyAgPSBmaW5kQm9va3NCeUF1dGhvcihhdXRob3IpO1xuICAgICAgICAvLyBzdWNjZXNzXG4gICAgICB9IGNhdGNoKHJlYXNvbikge1xuICAgICAgICAvLyBmYWlsdXJlXG4gICAgICB9XG4gICAgICBgYGBcblxuICAgICAgRXJyYmFjayBFeGFtcGxlXG5cbiAgICAgIGBgYGpzXG5cbiAgICAgIGZ1bmN0aW9uIGZvdW5kQm9va3MoYm9va3MpIHtcblxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBmYWlsdXJlKHJlYXNvbikge1xuXG4gICAgICB9XG5cbiAgICAgIGZpbmRBdXRob3IoZnVuY3Rpb24oYXV0aG9yLCBlcnIpe1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgZmFpbHVyZShlcnIpO1xuICAgICAgICAgIC8vIGZhaWx1cmVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgZmluZEJvb29rc0J5QXV0aG9yKGF1dGhvciwgZnVuY3Rpb24oYm9va3MsIGVycikge1xuICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgZmFpbHVyZShlcnIpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICBmb3VuZEJvb2tzKGJvb2tzKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoKHJlYXNvbikge1xuICAgICAgICAgICAgICAgICAgZmFpbHVyZShyZWFzb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBjYXRjaChlcnJvcikge1xuICAgICAgICAgICAgZmFpbHVyZShlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBzdWNjZXNzXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIFByb21pc2UgRXhhbXBsZTtcblxuICAgICAgYGBgamF2YXNjcmlwdFxuICAgICAgZmluZEF1dGhvcigpLlxuICAgICAgICB0aGVuKGZpbmRCb29rc0J5QXV0aG9yKS5cbiAgICAgICAgdGhlbihmdW5jdGlvbihib29rcyl7XG4gICAgICAgICAgLy8gZm91bmQgYm9va3NcbiAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgICAgIC8vIHNvbWV0aGluZyB3ZW50IHdyb25nXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBAbWV0aG9kIHRoZW5cbiAgICAgIEBwYXJhbSB7RnVuY3Rpb259IG9uRnVsZmlsbGVkXG4gICAgICBAcGFyYW0ge0Z1bmN0aW9ufSBvblJlamVjdGVkXG4gICAgICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gICAgICBAcmV0dXJuIHtQcm9taXNlfVxuICAgICovXG4gICAgICB0aGVuOiBmdW5jdGlvbihvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbikge1xuICAgICAgICB2YXIgcGFyZW50ID0gdGhpcztcbiAgICAgICAgdmFyIHN0YXRlID0gcGFyZW50Ll9zdGF0ZTtcblxuICAgICAgICBpZiAoc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRCAmJiAhb25GdWxmaWxsbWVudCB8fCBzdGF0ZSA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQgJiYgIW9uUmVqZWN0aW9uKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2hpbGQgPSBuZXcgdGhpcy5jb25zdHJ1Y3RvcihsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKTtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHBhcmVudC5fcmVzdWx0O1xuXG4gICAgICAgIGlmIChzdGF0ZSkge1xuICAgICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3VtZW50c1tzdGF0ZSAtIDFdO1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRkZWZhdWx0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRpbnZva2VDYWxsYmFjayhzdGF0ZSwgY2hpbGQsIGNhbGxiYWNrLCByZXN1bHQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHN1YnNjcmliZShwYXJlbnQsIGNoaWxkLCBvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2hpbGQ7XG4gICAgICB9LFxuXG4gICAgLyoqXG4gICAgICBgY2F0Y2hgIGlzIHNpbXBseSBzdWdhciBmb3IgYHRoZW4odW5kZWZpbmVkLCBvblJlamVjdGlvbilgIHdoaWNoIG1ha2VzIGl0IHRoZSBzYW1lXG4gICAgICBhcyB0aGUgY2F0Y2ggYmxvY2sgb2YgYSB0cnkvY2F0Y2ggc3RhdGVtZW50LlxuXG4gICAgICBgYGBqc1xuICAgICAgZnVuY3Rpb24gZmluZEF1dGhvcigpe1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkbid0IGZpbmQgdGhhdCBhdXRob3InKTtcbiAgICAgIH1cblxuICAgICAgLy8gc3luY2hyb25vdXNcbiAgICAgIHRyeSB7XG4gICAgICAgIGZpbmRBdXRob3IoKTtcbiAgICAgIH0gY2F0Y2gocmVhc29uKSB7XG4gICAgICAgIC8vIHNvbWV0aGluZyB3ZW50IHdyb25nXG4gICAgICB9XG5cbiAgICAgIC8vIGFzeW5jIHdpdGggcHJvbWlzZXNcbiAgICAgIGZpbmRBdXRob3IoKS5jYXRjaChmdW5jdGlvbihyZWFzb24pe1xuICAgICAgICAvLyBzb21ldGhpbmcgd2VudCB3cm9uZ1xuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQG1ldGhvZCBjYXRjaFxuICAgICAgQHBhcmFtIHtGdW5jdGlvbn0gb25SZWplY3Rpb25cbiAgICAgIFVzZWZ1bCBmb3IgdG9vbGluZy5cbiAgICAgIEByZXR1cm4ge1Byb21pc2V9XG4gICAgKi9cbiAgICAgICdjYXRjaCc6IGZ1bmN0aW9uKG9uUmVqZWN0aW9uKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRoZW4obnVsbCwgb25SZWplY3Rpb24pO1xuICAgICAgfVxuICAgIH07XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHBvbHlmaWxsJCRwb2x5ZmlsbCgpIHtcbiAgICAgIHZhciBsb2NhbDtcblxuICAgICAgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgbG9jYWwgPSBnbG9iYWw7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIGxvY2FsID0gc2VsZjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgbG9jYWwgPSBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdwb2x5ZmlsbCBmYWlsZWQgYmVjYXVzZSBnbG9iYWwgb2JqZWN0IGlzIHVuYXZhaWxhYmxlIGluIHRoaXMgZW52aXJvbm1lbnQnKTtcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBQID0gbG9jYWwuUHJvbWlzZTtcblxuICAgICAgaWYgKFAgJiYgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKFAucmVzb2x2ZSgpKSA9PT0gJ1tvYmplY3QgUHJvbWlzZV0nICYmICFQLmNhc3QpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBsb2NhbC5Qcm9taXNlID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkJGRlZmF1bHQ7XG4gICAgfVxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkcG9seWZpbGwkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcG9seWZpbGwkJHBvbHlmaWxsO1xuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSR1bWQkJEVTNlByb21pc2UgPSB7XG4gICAgICAnUHJvbWlzZSc6IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRkZWZhdWx0LFxuICAgICAgJ3BvbHlmaWxsJzogbGliJGVzNiRwcm9taXNlJHBvbHlmaWxsJCRkZWZhdWx0XG4gICAgfTtcblxuICAgIC8qIGdsb2JhbCBkZWZpbmU6dHJ1ZSBtb2R1bGU6dHJ1ZSB3aW5kb3c6IHRydWUgKi9cbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmVbJ2FtZCddKSB7XG4gICAgICBkZWZpbmUoZnVuY3Rpb24oKSB7IHJldHVybiBsaWIkZXM2JHByb21pc2UkdW1kJCRFUzZQcm9taXNlOyB9KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZVsnZXhwb3J0cyddKSB7XG4gICAgICBtb2R1bGVbJ2V4cG9ydHMnXSA9IGxpYiRlczYkcHJvbWlzZSR1bWQkJEVTNlByb21pc2U7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgdGhpcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRoaXNbJ0VTNlByb21pc2UnXSA9IGxpYiRlczYkcHJvbWlzZSR1bWQkJEVTNlByb21pc2U7XG4gICAgfVxuXG4gICAgbGliJGVzNiRwcm9taXNlJHBvbHlmaWxsJCRkZWZhdWx0KCk7XG59KS5jYWxsKHRoaXMpO1xuXG4iLCIvKmpzbGludCBvbmV2YXI6dHJ1ZSwgdW5kZWY6dHJ1ZSwgbmV3Y2FwOnRydWUsIHJlZ2V4cDp0cnVlLCBiaXR3aXNlOnRydWUsIG1heGVycjo1MCwgaW5kZW50OjQsIHdoaXRlOmZhbHNlLCBub21lbjpmYWxzZSwgcGx1c3BsdXM6ZmFsc2UgKi9cbi8qZ2xvYmFsIGRlZmluZTpmYWxzZSwgcmVxdWlyZTpmYWxzZSwgZXhwb3J0czpmYWxzZSwgbW9kdWxlOmZhbHNlLCBzaWduYWxzOmZhbHNlICovXG5cbi8qKiBAbGljZW5zZVxuICogSlMgU2lnbmFscyA8aHR0cDovL21pbGxlcm1lZGVpcm9zLmdpdGh1Yi5jb20vanMtc2lnbmFscy8+XG4gKiBSZWxlYXNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcbiAqIEF1dGhvcjogTWlsbGVyIE1lZGVpcm9zXG4gKiBWZXJzaW9uOiAxLjAuMCAtIEJ1aWxkOiAyNjggKDIwMTIvMTEvMjkgMDU6NDggUE0pXG4gKi9cblxuKGZ1bmN0aW9uKGdsb2JhbCl7XG5cbiAgICAvLyBTaWduYWxCaW5kaW5nIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIC8qKlxuICAgICAqIE9iamVjdCB0aGF0IHJlcHJlc2VudHMgYSBiaW5kaW5nIGJldHdlZW4gYSBTaWduYWwgYW5kIGEgbGlzdGVuZXIgZnVuY3Rpb24uXG4gICAgICogPGJyIC8+LSA8c3Ryb25nPlRoaXMgaXMgYW4gaW50ZXJuYWwgY29uc3RydWN0b3IgYW5kIHNob3VsZG4ndCBiZSBjYWxsZWQgYnkgcmVndWxhciB1c2Vycy48L3N0cm9uZz5cbiAgICAgKiA8YnIgLz4tIGluc3BpcmVkIGJ5IEpvYSBFYmVydCBBUzMgU2lnbmFsQmluZGluZyBhbmQgUm9iZXJ0IFBlbm5lcidzIFNsb3QgY2xhc3Nlcy5cbiAgICAgKiBAYXV0aG9yIE1pbGxlciBNZWRlaXJvc1xuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqIEBuYW1lIFNpZ25hbEJpbmRpbmdcbiAgICAgKiBAcGFyYW0ge1NpZ25hbH0gc2lnbmFsIFJlZmVyZW5jZSB0byBTaWduYWwgb2JqZWN0IHRoYXQgbGlzdGVuZXIgaXMgY3VycmVudGx5IGJvdW5kIHRvLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIEhhbmRsZXIgZnVuY3Rpb24gYm91bmQgdG8gdGhlIHNpZ25hbC5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzT25jZSBJZiBiaW5kaW5nIHNob3VsZCBiZSBleGVjdXRlZCBqdXN0IG9uY2UuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtsaXN0ZW5lckNvbnRleHRdIENvbnRleHQgb24gd2hpY2ggbGlzdGVuZXIgd2lsbCBiZSBleGVjdXRlZCAob2JqZWN0IHRoYXQgc2hvdWxkIHJlcHJlc2VudCB0aGUgYHRoaXNgIHZhcmlhYmxlIGluc2lkZSBsaXN0ZW5lciBmdW5jdGlvbikuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IFtwcmlvcml0eV0gVGhlIHByaW9yaXR5IGxldmVsIG9mIHRoZSBldmVudCBsaXN0ZW5lci4gKGRlZmF1bHQgPSAwKS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBTaWduYWxCaW5kaW5nKHNpZ25hbCwgbGlzdGVuZXIsIGlzT25jZSwgbGlzdGVuZXJDb250ZXh0LCBwcmlvcml0eSkge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBIYW5kbGVyIGZ1bmN0aW9uIGJvdW5kIHRvIHRoZSBzaWduYWwuXG4gICAgICAgICAqIEB0eXBlIEZ1bmN0aW9uXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9saXN0ZW5lciA9IGxpc3RlbmVyO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJZiBiaW5kaW5nIHNob3VsZCBiZSBleGVjdXRlZCBqdXN0IG9uY2UuXG4gICAgICAgICAqIEB0eXBlIGJvb2xlYW5cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2lzT25jZSA9IGlzT25jZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ29udGV4dCBvbiB3aGljaCBsaXN0ZW5lciB3aWxsIGJlIGV4ZWN1dGVkIChvYmplY3QgdGhhdCBzaG91bGQgcmVwcmVzZW50IHRoZSBgdGhpc2AgdmFyaWFibGUgaW5zaWRlIGxpc3RlbmVyIGZ1bmN0aW9uKS5cbiAgICAgICAgICogQG1lbWJlck9mIFNpZ25hbEJpbmRpbmcucHJvdG90eXBlXG4gICAgICAgICAqIEBuYW1lIGNvbnRleHRcbiAgICAgICAgICogQHR5cGUgT2JqZWN0fHVuZGVmaW5lZHxudWxsXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBsaXN0ZW5lckNvbnRleHQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlZmVyZW5jZSB0byBTaWduYWwgb2JqZWN0IHRoYXQgbGlzdGVuZXIgaXMgY3VycmVudGx5IGJvdW5kIHRvLlxuICAgICAgICAgKiBAdHlwZSBTaWduYWxcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX3NpZ25hbCA9IHNpZ25hbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogTGlzdGVuZXIgcHJpb3JpdHlcbiAgICAgICAgICogQHR5cGUgTnVtYmVyXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9wcmlvcml0eSA9IHByaW9yaXR5IHx8IDA7XG4gICAgfVxuXG4gICAgU2lnbmFsQmluZGluZy5wcm90b3R5cGUgPSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElmIGJpbmRpbmcgaXMgYWN0aXZlIGFuZCBzaG91bGQgYmUgZXhlY3V0ZWQuXG4gICAgICAgICAqIEB0eXBlIGJvb2xlYW5cbiAgICAgICAgICovXG4gICAgICAgIGFjdGl2ZSA6IHRydWUsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERlZmF1bHQgcGFyYW1ldGVycyBwYXNzZWQgdG8gbGlzdGVuZXIgZHVyaW5nIGBTaWduYWwuZGlzcGF0Y2hgIGFuZCBgU2lnbmFsQmluZGluZy5leGVjdXRlYC4gKGN1cnJpZWQgcGFyYW1ldGVycylcbiAgICAgICAgICogQHR5cGUgQXJyYXl8bnVsbFxuICAgICAgICAgKi9cbiAgICAgICAgcGFyYW1zIDogbnVsbCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbCBsaXN0ZW5lciBwYXNzaW5nIGFyYml0cmFyeSBwYXJhbWV0ZXJzLlxuICAgICAgICAgKiA8cD5JZiBiaW5kaW5nIHdhcyBhZGRlZCB1c2luZyBgU2lnbmFsLmFkZE9uY2UoKWAgaXQgd2lsbCBiZSBhdXRvbWF0aWNhbGx5IHJlbW92ZWQgZnJvbSBzaWduYWwgZGlzcGF0Y2ggcXVldWUsIHRoaXMgbWV0aG9kIGlzIHVzZWQgaW50ZXJuYWxseSBmb3IgdGhlIHNpZ25hbCBkaXNwYXRjaC48L3A+XG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXl9IFtwYXJhbXNBcnJdIEFycmF5IG9mIHBhcmFtZXRlcnMgdGhhdCBzaG91bGQgYmUgcGFzc2VkIHRvIHRoZSBsaXN0ZW5lclxuICAgICAgICAgKiBAcmV0dXJuIHsqfSBWYWx1ZSByZXR1cm5lZCBieSB0aGUgbGlzdGVuZXIuXG4gICAgICAgICAqL1xuICAgICAgICBleGVjdXRlIDogZnVuY3Rpb24gKHBhcmFtc0Fycikge1xuICAgICAgICAgICAgdmFyIGhhbmRsZXJSZXR1cm4sIHBhcmFtcztcbiAgICAgICAgICAgIGlmICh0aGlzLmFjdGl2ZSAmJiAhIXRoaXMuX2xpc3RlbmVyKSB7XG4gICAgICAgICAgICAgICAgcGFyYW1zID0gdGhpcy5wYXJhbXM/IHRoaXMucGFyYW1zLmNvbmNhdChwYXJhbXNBcnIpIDogcGFyYW1zQXJyO1xuICAgICAgICAgICAgICAgIGhhbmRsZXJSZXR1cm4gPSB0aGlzLl9saXN0ZW5lci5hcHBseSh0aGlzLmNvbnRleHQsIHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2lzT25jZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRldGFjaCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBoYW5kbGVyUmV0dXJuO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZXRhY2ggYmluZGluZyBmcm9tIHNpZ25hbC5cbiAgICAgICAgICogLSBhbGlhcyB0bzogbXlTaWduYWwucmVtb3ZlKG15QmluZGluZy5nZXRMaXN0ZW5lcigpKTtcbiAgICAgICAgICogQHJldHVybiB7RnVuY3Rpb258bnVsbH0gSGFuZGxlciBmdW5jdGlvbiBib3VuZCB0byB0aGUgc2lnbmFsIG9yIGBudWxsYCBpZiBiaW5kaW5nIHdhcyBwcmV2aW91c2x5IGRldGFjaGVkLlxuICAgICAgICAgKi9cbiAgICAgICAgZGV0YWNoIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaXNCb3VuZCgpPyB0aGlzLl9zaWduYWwucmVtb3ZlKHRoaXMuX2xpc3RlbmVyLCB0aGlzLmNvbnRleHQpIDogbnVsbDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHJldHVybiB7Qm9vbGVhbn0gYHRydWVgIGlmIGJpbmRpbmcgaXMgc3RpbGwgYm91bmQgdG8gdGhlIHNpZ25hbCBhbmQgaGF2ZSBhIGxpc3RlbmVyLlxuICAgICAgICAgKi9cbiAgICAgICAgaXNCb3VuZCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAoISF0aGlzLl9zaWduYWwgJiYgISF0aGlzLl9saXN0ZW5lcik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IElmIFNpZ25hbEJpbmRpbmcgd2lsbCBvbmx5IGJlIGV4ZWN1dGVkIG9uY2UuXG4gICAgICAgICAqL1xuICAgICAgICBpc09uY2UgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faXNPbmNlO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gSGFuZGxlciBmdW5jdGlvbiBib3VuZCB0byB0aGUgc2lnbmFsLlxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0TGlzdGVuZXIgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbGlzdGVuZXI7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEByZXR1cm4ge1NpZ25hbH0gU2lnbmFsIHRoYXQgbGlzdGVuZXIgaXMgY3VycmVudGx5IGJvdW5kIHRvLlxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0U2lnbmFsIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NpZ25hbDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGVsZXRlIGluc3RhbmNlIHByb3BlcnRpZXNcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIF9kZXN0cm95IDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX3NpZ25hbDtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9saXN0ZW5lcjtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmNvbnRleHQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEByZXR1cm4ge3N0cmluZ30gU3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBvYmplY3QuXG4gICAgICAgICAqL1xuICAgICAgICB0b1N0cmluZyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAnW1NpZ25hbEJpbmRpbmcgaXNPbmNlOicgKyB0aGlzLl9pc09uY2UgKycsIGlzQm91bmQ6JysgdGhpcy5pc0JvdW5kKCkgKycsIGFjdGl2ZTonICsgdGhpcy5hY3RpdmUgKyAnXSc7XG4gICAgICAgIH1cblxuICAgIH07XG5cblxuLypnbG9iYWwgU2lnbmFsQmluZGluZzpmYWxzZSovXG5cbiAgICAvLyBTaWduYWwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIGZ1bmN0aW9uIHZhbGlkYXRlTGlzdGVuZXIobGlzdGVuZXIsIGZuTmFtZSkge1xuICAgICAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoICdsaXN0ZW5lciBpcyBhIHJlcXVpcmVkIHBhcmFtIG9mIHtmbn0oKSBhbmQgc2hvdWxkIGJlIGEgRnVuY3Rpb24uJy5yZXBsYWNlKCd7Zm59JywgZm5OYW1lKSApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3VzdG9tIGV2ZW50IGJyb2FkY2FzdGVyXG4gICAgICogPGJyIC8+LSBpbnNwaXJlZCBieSBSb2JlcnQgUGVubmVyJ3MgQVMzIFNpZ25hbHMuXG4gICAgICogQG5hbWUgU2lnbmFsXG4gICAgICogQGF1dGhvciBNaWxsZXIgTWVkZWlyb3NcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBTaWduYWwoKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSBBcnJheS48U2lnbmFsQmluZGluZz5cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2JpbmRpbmdzID0gW107XG4gICAgICAgIHRoaXMuX3ByZXZQYXJhbXMgPSBudWxsO1xuXG4gICAgICAgIC8vIGVuZm9yY2UgZGlzcGF0Y2ggdG8gYXdheXMgd29yayBvbiBzYW1lIGNvbnRleHQgKCM0NylcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB0aGlzLmRpc3BhdGNoID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFNpZ25hbC5wcm90b3R5cGUuZGlzcGF0Y2guYXBwbHkoc2VsZiwgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBTaWduYWwucHJvdG90eXBlID0ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTaWduYWxzIFZlcnNpb24gTnVtYmVyXG4gICAgICAgICAqIEB0eXBlIFN0cmluZ1xuICAgICAgICAgKiBAY29uc3RcbiAgICAgICAgICovXG4gICAgICAgIFZFUlNJT04gOiAnMS4wLjAnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJZiBTaWduYWwgc2hvdWxkIGtlZXAgcmVjb3JkIG9mIHByZXZpb3VzbHkgZGlzcGF0Y2hlZCBwYXJhbWV0ZXJzIGFuZFxuICAgICAgICAgKiBhdXRvbWF0aWNhbGx5IGV4ZWN1dGUgbGlzdGVuZXIgZHVyaW5nIGBhZGQoKWAvYGFkZE9uY2UoKWAgaWYgU2lnbmFsIHdhc1xuICAgICAgICAgKiBhbHJlYWR5IGRpc3BhdGNoZWQgYmVmb3JlLlxuICAgICAgICAgKiBAdHlwZSBib29sZWFuXG4gICAgICAgICAqL1xuICAgICAgICBtZW1vcml6ZSA6IGZhbHNlLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSBib29sZWFuXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICBfc2hvdWxkUHJvcGFnYXRlIDogdHJ1ZSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogSWYgU2lnbmFsIGlzIGFjdGl2ZSBhbmQgc2hvdWxkIGJyb2FkY2FzdCBldmVudHMuXG4gICAgICAgICAqIDxwPjxzdHJvbmc+SU1QT1JUQU5UOjwvc3Ryb25nPiBTZXR0aW5nIHRoaXMgcHJvcGVydHkgZHVyaW5nIGEgZGlzcGF0Y2ggd2lsbCBvbmx5IGFmZmVjdCB0aGUgbmV4dCBkaXNwYXRjaCwgaWYgeW91IHdhbnQgdG8gc3RvcCB0aGUgcHJvcGFnYXRpb24gb2YgYSBzaWduYWwgdXNlIGBoYWx0KClgIGluc3RlYWQuPC9wPlxuICAgICAgICAgKiBAdHlwZSBib29sZWFuXG4gICAgICAgICAqL1xuICAgICAgICBhY3RpdmUgOiB0cnVlLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lclxuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzT25jZVxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gW2xpc3RlbmVyQ29udGV4dF1cbiAgICAgICAgICogQHBhcmFtIHtOdW1iZXJ9IFtwcmlvcml0eV1cbiAgICAgICAgICogQHJldHVybiB7U2lnbmFsQmluZGluZ31cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIF9yZWdpc3Rlckxpc3RlbmVyIDogZnVuY3Rpb24gKGxpc3RlbmVyLCBpc09uY2UsIGxpc3RlbmVyQ29udGV4dCwgcHJpb3JpdHkpIHtcblxuICAgICAgICAgICAgdmFyIHByZXZJbmRleCA9IHRoaXMuX2luZGV4T2ZMaXN0ZW5lcihsaXN0ZW5lciwgbGlzdGVuZXJDb250ZXh0KSxcbiAgICAgICAgICAgICAgICBiaW5kaW5nO1xuXG4gICAgICAgICAgICBpZiAocHJldkluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGJpbmRpbmcgPSB0aGlzLl9iaW5kaW5nc1twcmV2SW5kZXhdO1xuICAgICAgICAgICAgICAgIGlmIChiaW5kaW5nLmlzT25jZSgpICE9PSBpc09uY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdZb3UgY2Fubm90IGFkZCcrIChpc09uY2U/ICcnIDogJ09uY2UnKSArJygpIHRoZW4gYWRkJysgKCFpc09uY2U/ICcnIDogJ09uY2UnKSArJygpIHRoZSBzYW1lIGxpc3RlbmVyIHdpdGhvdXQgcmVtb3ZpbmcgdGhlIHJlbGF0aW9uc2hpcCBmaXJzdC4nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGJpbmRpbmcgPSBuZXcgU2lnbmFsQmluZGluZyh0aGlzLCBsaXN0ZW5lciwgaXNPbmNlLCBsaXN0ZW5lckNvbnRleHQsIHByaW9yaXR5KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9hZGRCaW5kaW5nKGJpbmRpbmcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZih0aGlzLm1lbW9yaXplICYmIHRoaXMuX3ByZXZQYXJhbXMpe1xuICAgICAgICAgICAgICAgIGJpbmRpbmcuZXhlY3V0ZSh0aGlzLl9wcmV2UGFyYW1zKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGJpbmRpbmc7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwYXJhbSB7U2lnbmFsQmluZGluZ30gYmluZGluZ1xuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgX2FkZEJpbmRpbmcgOiBmdW5jdGlvbiAoYmluZGluZykge1xuICAgICAgICAgICAgLy9zaW1wbGlmaWVkIGluc2VydGlvbiBzb3J0XG4gICAgICAgICAgICB2YXIgbiA9IHRoaXMuX2JpbmRpbmdzLmxlbmd0aDtcbiAgICAgICAgICAgIGRvIHsgLS1uOyB9IHdoaWxlICh0aGlzLl9iaW5kaW5nc1tuXSAmJiBiaW5kaW5nLl9wcmlvcml0eSA8PSB0aGlzLl9iaW5kaW5nc1tuXS5fcHJpb3JpdHkpO1xuICAgICAgICAgICAgdGhpcy5fYmluZGluZ3Muc3BsaWNlKG4gKyAxLCAwLCBiaW5kaW5nKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXJcbiAgICAgICAgICogQHJldHVybiB7bnVtYmVyfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgX2luZGV4T2ZMaXN0ZW5lciA6IGZ1bmN0aW9uIChsaXN0ZW5lciwgY29udGV4dCkge1xuICAgICAgICAgICAgdmFyIG4gPSB0aGlzLl9iaW5kaW5ncy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgY3VyO1xuICAgICAgICAgICAgd2hpbGUgKG4tLSkge1xuICAgICAgICAgICAgICAgIGN1ciA9IHRoaXMuX2JpbmRpbmdzW25dO1xuICAgICAgICAgICAgICAgIGlmIChjdXIuX2xpc3RlbmVyID09PSBsaXN0ZW5lciAmJiBjdXIuY29udGV4dCA9PT0gY29udGV4dCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENoZWNrIGlmIGxpc3RlbmVyIHdhcyBhdHRhY2hlZCB0byBTaWduYWwuXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF1cbiAgICAgICAgICogQHJldHVybiB7Ym9vbGVhbn0gaWYgU2lnbmFsIGhhcyB0aGUgc3BlY2lmaWVkIGxpc3RlbmVyLlxuICAgICAgICAgKi9cbiAgICAgICAgaGFzIDogZnVuY3Rpb24gKGxpc3RlbmVyLCBjb250ZXh0KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVyLCBjb250ZXh0KSAhPT0gLTE7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFkZCBhIGxpc3RlbmVyIHRvIHRoZSBzaWduYWwuXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIFNpZ25hbCBoYW5kbGVyIGZ1bmN0aW9uLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gW2xpc3RlbmVyQ29udGV4dF0gQ29udGV4dCBvbiB3aGljaCBsaXN0ZW5lciB3aWxsIGJlIGV4ZWN1dGVkIChvYmplY3QgdGhhdCBzaG91bGQgcmVwcmVzZW50IHRoZSBgdGhpc2AgdmFyaWFibGUgaW5zaWRlIGxpc3RlbmVyIGZ1bmN0aW9uKS5cbiAgICAgICAgICogQHBhcmFtIHtOdW1iZXJ9IFtwcmlvcml0eV0gVGhlIHByaW9yaXR5IGxldmVsIG9mIHRoZSBldmVudCBsaXN0ZW5lci4gTGlzdGVuZXJzIHdpdGggaGlnaGVyIHByaW9yaXR5IHdpbGwgYmUgZXhlY3V0ZWQgYmVmb3JlIGxpc3RlbmVycyB3aXRoIGxvd2VyIHByaW9yaXR5LiBMaXN0ZW5lcnMgd2l0aCBzYW1lIHByaW9yaXR5IGxldmVsIHdpbGwgYmUgZXhlY3V0ZWQgYXQgdGhlIHNhbWUgb3JkZXIgYXMgdGhleSB3ZXJlIGFkZGVkLiAoZGVmYXVsdCA9IDApXG4gICAgICAgICAqIEByZXR1cm4ge1NpZ25hbEJpbmRpbmd9IEFuIE9iamVjdCByZXByZXNlbnRpbmcgdGhlIGJpbmRpbmcgYmV0d2VlbiB0aGUgU2lnbmFsIGFuZCBsaXN0ZW5lci5cbiAgICAgICAgICovXG4gICAgICAgIGFkZCA6IGZ1bmN0aW9uIChsaXN0ZW5lciwgbGlzdGVuZXJDb250ZXh0LCBwcmlvcml0eSkge1xuICAgICAgICAgICAgdmFsaWRhdGVMaXN0ZW5lcihsaXN0ZW5lciwgJ2FkZCcpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JlZ2lzdGVyTGlzdGVuZXIobGlzdGVuZXIsIGZhbHNlLCBsaXN0ZW5lckNvbnRleHQsIHByaW9yaXR5KTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQWRkIGxpc3RlbmVyIHRvIHRoZSBzaWduYWwgdGhhdCBzaG91bGQgYmUgcmVtb3ZlZCBhZnRlciBmaXJzdCBleGVjdXRpb24gKHdpbGwgYmUgZXhlY3V0ZWQgb25seSBvbmNlKS5cbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgU2lnbmFsIGhhbmRsZXIgZnVuY3Rpb24uXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbbGlzdGVuZXJDb250ZXh0XSBDb250ZXh0IG9uIHdoaWNoIGxpc3RlbmVyIHdpbGwgYmUgZXhlY3V0ZWQgKG9iamVjdCB0aGF0IHNob3VsZCByZXByZXNlbnQgdGhlIGB0aGlzYCB2YXJpYWJsZSBpbnNpZGUgbGlzdGVuZXIgZnVuY3Rpb24pLlxuICAgICAgICAgKiBAcGFyYW0ge051bWJlcn0gW3ByaW9yaXR5XSBUaGUgcHJpb3JpdHkgbGV2ZWwgb2YgdGhlIGV2ZW50IGxpc3RlbmVyLiBMaXN0ZW5lcnMgd2l0aCBoaWdoZXIgcHJpb3JpdHkgd2lsbCBiZSBleGVjdXRlZCBiZWZvcmUgbGlzdGVuZXJzIHdpdGggbG93ZXIgcHJpb3JpdHkuIExpc3RlbmVycyB3aXRoIHNhbWUgcHJpb3JpdHkgbGV2ZWwgd2lsbCBiZSBleGVjdXRlZCBhdCB0aGUgc2FtZSBvcmRlciBhcyB0aGV5IHdlcmUgYWRkZWQuIChkZWZhdWx0ID0gMClcbiAgICAgICAgICogQHJldHVybiB7U2lnbmFsQmluZGluZ30gQW4gT2JqZWN0IHJlcHJlc2VudGluZyB0aGUgYmluZGluZyBiZXR3ZWVuIHRoZSBTaWduYWwgYW5kIGxpc3RlbmVyLlxuICAgICAgICAgKi9cbiAgICAgICAgYWRkT25jZSA6IGZ1bmN0aW9uIChsaXN0ZW5lciwgbGlzdGVuZXJDb250ZXh0LCBwcmlvcml0eSkge1xuICAgICAgICAgICAgdmFsaWRhdGVMaXN0ZW5lcihsaXN0ZW5lciwgJ2FkZE9uY2UnKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZWdpc3Rlckxpc3RlbmVyKGxpc3RlbmVyLCB0cnVlLCBsaXN0ZW5lckNvbnRleHQsIHByaW9yaXR5KTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlIGEgc2luZ2xlIGxpc3RlbmVyIGZyb20gdGhlIGRpc3BhdGNoIHF1ZXVlLlxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBIYW5kbGVyIGZ1bmN0aW9uIHRoYXQgc2hvdWxkIGJlIHJlbW92ZWQuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF0gRXhlY3V0aW9uIGNvbnRleHQgKHNpbmNlIHlvdSBjYW4gYWRkIHRoZSBzYW1lIGhhbmRsZXIgbXVsdGlwbGUgdGltZXMgaWYgZXhlY3V0aW5nIGluIGEgZGlmZmVyZW50IGNvbnRleHQpLlxuICAgICAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gTGlzdGVuZXIgaGFuZGxlciBmdW5jdGlvbi5cbiAgICAgICAgICovXG4gICAgICAgIHJlbW92ZSA6IGZ1bmN0aW9uIChsaXN0ZW5lciwgY29udGV4dCkge1xuICAgICAgICAgICAgdmFsaWRhdGVMaXN0ZW5lcihsaXN0ZW5lciwgJ3JlbW92ZScpO1xuXG4gICAgICAgICAgICB2YXIgaSA9IHRoaXMuX2luZGV4T2ZMaXN0ZW5lcihsaXN0ZW5lciwgY29udGV4dCk7XG4gICAgICAgICAgICBpZiAoaSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9iaW5kaW5nc1tpXS5fZGVzdHJveSgpOyAvL25vIHJlYXNvbiB0byBhIFNpZ25hbEJpbmRpbmcgZXhpc3QgaWYgaXQgaXNuJ3QgYXR0YWNoZWQgdG8gYSBzaWduYWxcbiAgICAgICAgICAgICAgICB0aGlzLl9iaW5kaW5ncy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbGlzdGVuZXI7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZSBhbGwgbGlzdGVuZXJzIGZyb20gdGhlIFNpZ25hbC5cbiAgICAgICAgICovXG4gICAgICAgIHJlbW92ZUFsbCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBuID0gdGhpcy5fYmluZGluZ3MubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKG4tLSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2JpbmRpbmdzW25dLl9kZXN0cm95KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9iaW5kaW5ncy5sZW5ndGggPSAwO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IE51bWJlciBvZiBsaXN0ZW5lcnMgYXR0YWNoZWQgdG8gdGhlIFNpZ25hbC5cbiAgICAgICAgICovXG4gICAgICAgIGdldE51bUxpc3RlbmVycyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9iaW5kaW5ncy5sZW5ndGg7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFN0b3AgcHJvcGFnYXRpb24gb2YgdGhlIGV2ZW50LCBibG9ja2luZyB0aGUgZGlzcGF0Y2ggdG8gbmV4dCBsaXN0ZW5lcnMgb24gdGhlIHF1ZXVlLlxuICAgICAgICAgKiA8cD48c3Ryb25nPklNUE9SVEFOVDo8L3N0cm9uZz4gc2hvdWxkIGJlIGNhbGxlZCBvbmx5IGR1cmluZyBzaWduYWwgZGlzcGF0Y2gsIGNhbGxpbmcgaXQgYmVmb3JlL2FmdGVyIGRpc3BhdGNoIHdvbid0IGFmZmVjdCBzaWduYWwgYnJvYWRjYXN0LjwvcD5cbiAgICAgICAgICogQHNlZSBTaWduYWwucHJvdG90eXBlLmRpc2FibGVcbiAgICAgICAgICovXG4gICAgICAgIGhhbHQgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLl9zaG91bGRQcm9wYWdhdGUgPSBmYWxzZTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGlzcGF0Y2gvQnJvYWRjYXN0IFNpZ25hbCB0byBhbGwgbGlzdGVuZXJzIGFkZGVkIHRvIHRoZSBxdWV1ZS5cbiAgICAgICAgICogQHBhcmFtIHsuLi4qfSBbcGFyYW1zXSBQYXJhbWV0ZXJzIHRoYXQgc2hvdWxkIGJlIHBhc3NlZCB0byBlYWNoIGhhbmRsZXIuXG4gICAgICAgICAqL1xuICAgICAgICBkaXNwYXRjaCA6IGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgICAgICAgIGlmICghIHRoaXMuYWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcGFyYW1zQXJyID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSxcbiAgICAgICAgICAgICAgICBuID0gdGhpcy5fYmluZGluZ3MubGVuZ3RoLFxuICAgICAgICAgICAgICAgIGJpbmRpbmdzO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5tZW1vcml6ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3ByZXZQYXJhbXMgPSBwYXJhbXNBcnI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghIG4pIHtcbiAgICAgICAgICAgICAgICAvL3Nob3VsZCBjb21lIGFmdGVyIG1lbW9yaXplXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBiaW5kaW5ncyA9IHRoaXMuX2JpbmRpbmdzLnNsaWNlKCk7IC8vY2xvbmUgYXJyYXkgaW4gY2FzZSBhZGQvcmVtb3ZlIGl0ZW1zIGR1cmluZyBkaXNwYXRjaFxuICAgICAgICAgICAgdGhpcy5fc2hvdWxkUHJvcGFnYXRlID0gdHJ1ZTsgLy9pbiBjYXNlIGBoYWx0YCB3YXMgY2FsbGVkIGJlZm9yZSBkaXNwYXRjaCBvciBkdXJpbmcgdGhlIHByZXZpb3VzIGRpc3BhdGNoLlxuXG4gICAgICAgICAgICAvL2V4ZWN1dGUgYWxsIGNhbGxiYWNrcyB1bnRpbCBlbmQgb2YgdGhlIGxpc3Qgb3IgdW50aWwgYSBjYWxsYmFjayByZXR1cm5zIGBmYWxzZWAgb3Igc3RvcHMgcHJvcGFnYXRpb25cbiAgICAgICAgICAgIC8vcmV2ZXJzZSBsb29wIHNpbmNlIGxpc3RlbmVycyB3aXRoIGhpZ2hlciBwcmlvcml0eSB3aWxsIGJlIGFkZGVkIGF0IHRoZSBlbmQgb2YgdGhlIGxpc3RcbiAgICAgICAgICAgIGRvIHsgbi0tOyB9IHdoaWxlIChiaW5kaW5nc1tuXSAmJiB0aGlzLl9zaG91bGRQcm9wYWdhdGUgJiYgYmluZGluZ3Nbbl0uZXhlY3V0ZShwYXJhbXNBcnIpICE9PSBmYWxzZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZvcmdldCBtZW1vcml6ZWQgYXJndW1lbnRzLlxuICAgICAgICAgKiBAc2VlIFNpZ25hbC5tZW1vcml6ZVxuICAgICAgICAgKi9cbiAgICAgICAgZm9yZ2V0IDogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHRoaXMuX3ByZXZQYXJhbXMgPSBudWxsO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmUgYWxsIGJpbmRpbmdzIGZyb20gc2lnbmFsIGFuZCBkZXN0cm95IGFueSByZWZlcmVuY2UgdG8gZXh0ZXJuYWwgb2JqZWN0cyAoZGVzdHJveSBTaWduYWwgb2JqZWN0KS5cbiAgICAgICAgICogPHA+PHN0cm9uZz5JTVBPUlRBTlQ6PC9zdHJvbmc+IGNhbGxpbmcgYW55IG1ldGhvZCBvbiB0aGUgc2lnbmFsIGluc3RhbmNlIGFmdGVyIGNhbGxpbmcgZGlzcG9zZSB3aWxsIHRocm93IGVycm9ycy48L3A+XG4gICAgICAgICAqL1xuICAgICAgICBkaXNwb3NlIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVBbGwoKTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9iaW5kaW5ncztcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9wcmV2UGFyYW1zO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IFN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgb2JqZWN0LlxuICAgICAgICAgKi9cbiAgICAgICAgdG9TdHJpbmcgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1tTaWduYWwgYWN0aXZlOicrIHRoaXMuYWN0aXZlICsnIG51bUxpc3RlbmVyczonKyB0aGlzLmdldE51bUxpc3RlbmVycygpICsnXSc7XG4gICAgICAgIH1cblxuICAgIH07XG5cblxuICAgIC8vIE5hbWVzcGFjZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgLyoqXG4gICAgICogU2lnbmFscyBuYW1lc3BhY2VcbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICogQG5hbWUgc2lnbmFsc1xuICAgICAqL1xuICAgIHZhciBzaWduYWxzID0gU2lnbmFsO1xuXG4gICAgLyoqXG4gICAgICogQ3VzdG9tIGV2ZW50IGJyb2FkY2FzdGVyXG4gICAgICogQHNlZSBTaWduYWxcbiAgICAgKi9cbiAgICAvLyBhbGlhcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkgKHNlZSAjZ2gtNDQpXG4gICAgc2lnbmFscy5TaWduYWwgPSBTaWduYWw7XG5cblxuXG4gICAgLy9leHBvcnRzIHRvIG11bHRpcGxlIGVudmlyb25tZW50c1xuICAgIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCl7IC8vQU1EXG4gICAgICAgIGRlZmluZShmdW5jdGlvbiAoKSB7IHJldHVybiBzaWduYWxzOyB9KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKXsgLy9ub2RlXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gc2lnbmFscztcbiAgICB9IGVsc2UgeyAvL2Jyb3dzZXJcbiAgICAgICAgLy91c2Ugc3RyaW5nIGJlY2F1c2Ugb2YgR29vZ2xlIGNsb3N1cmUgY29tcGlsZXIgQURWQU5DRURfTU9ERVxuICAgICAgICAvKmpzbGludCBzdWI6dHJ1ZSAqL1xuICAgICAgICBnbG9iYWxbJ3NpZ25hbHMnXSA9IHNpZ25hbHM7XG4gICAgfVxuXG59KHRoaXMpKTtcbiIsImltcG9ydCBTaWduYWwgZnJvbSAnc2lnbmFscyc7XG5cbi8qKlxuICogZXhwb3J0IGFwcGxpY2F0aW9uIFxuICogc2lnbmFscyBlYWNoIG9uZSBmb3IgZGlmZmVyZW50IGFwcCBzdGF0ZXNcbiAqL1xuZXhwb3J0IGNvbnN0IHN0YXRlQ2hhbmdlZCBcdFx0IFx0PSBuZXcgU2lnbmFsKCk7XG5leHBvcnQgY29uc3QgdHJhbnNpdGlvblN0YXJ0ZWQgICBcdD0gbmV3IFNpZ25hbCgpO1xuZXhwb3J0IGNvbnN0IHRyYW5zaXRpb25Db21wbGV0ZSAgICAgPSBuZXcgU2lnbmFsKCk7XG5leHBvcnQgY29uc3QgYWxsVHJhbnNpdGlvbnNTdGFydGVkICA9IG5ldyBTaWduYWwoKTtcbmV4cG9ydCBjb25zdCBhbGxUcmFuc2l0aW9uQ29tcGxldGVkID0gbmV3IFNpZ25hbCgpO1xuXG4iLCJcbi8qKlxuICogTG9nZ2VyIENsYXNzXG4gKiBAcmV0dXJuIHtvYmplY3R9IExvZ2dlclxuICovXG5leHBvcnQgZGVmYXVsdCAoZnVuY3Rpb24oKSB7XG5cdFxuXHRyZXR1cm4ge1xuXG5cdFx0LyogdG9nZ2xlIGFjdGl2ZSBzdGF0ZSAqL1xuXHRcdGVuYWJsZWQgXHQ6IHRydWUsXG5cblx0XHRpbml0TG9nZ2VyKCBhY3RpdmUgKSB7XG5cdFx0XHR0aGlzLmVuYWJsZWQgPSAgYWN0aXZlO1xuXHRcdH0sXG5cblx0XHRzZXRTdGF0ZSggYWN0aXZlICkge1xuXHRcdFx0dGhpcy5lbmFibGVkID0gYWN0aXZlO1xuXHRcdH0sXG5cblx0XHRsb2coIG1zZyApIHtcblx0XHRcdGlmKCB0aGlzLmVuYWJsZWQgKXtcblx0XHRcdFx0Y29uc29sZS5sb2coICAnOjo6OiAnKyB0aGlzLm5hbWUgKycgOjo6OiBbICcgKyBtc2cgKyAnIF0gJyk7XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdGVycm9yICggbXNnICkge1xuXHRcdFx0aWYoIHRoaXMuZW5hYmxlZCApe1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKCc6Ojo6ICcrIHRoaXMubmFtZSArJyA6Ojo6ICoqKioqIEVSUk9SICoqKioqIC0gWyAnICsgbXNnICsgJyBdICcpO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxufSkoKTtcblxuIiwiXG5pbXBvcnQge1Byb21pc2V9IGZyb20gJ2VzNi1wcm9taXNlJztcblxuLyoqXG4gKiBQcm9taXNlIGZhY2FkIG9iamVjdFxuICogY3JlYXRlcyBhIGZhY2FkIGZvciBhcHBsaWNhdGlvbiBwcm9taXNlcywgXG4gKiBkZXRhdGNoZXMgZmVvbSB0aGUgbGlicmFyeSBiZWluZyB1c2VkIHRvIHNlcnZlIHByb21pc2VzIHRvIHRoZSBhcHBcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbmxldCBQcm9taXNlRmFjYWRlID0ge307XG5cblxuLyoqXG4gKiBEZWZmZXIgdGhlIHByb21pc2UgXG4gKiBAcmV0dXJuIHtvYmplY3R9IHsgcmVzb2x2ZSA6IGZ1bmN0aW9uLCByZWplY3QgOiBmdW5jdGlvbiB9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBEZWZlcnJlZCgpXG57XG5cdGxldCByZXN1bHQgPSB7fTtcblx0cmVzdWx0LnByb21pc2UgPSBuZXcgUHJvbWlzZSgoIHJlc29sdmUsIHJlamVjdCApID0+XG5cdHtcblx0XHRyZXN1bHQucmVzb2x2ZSA9IHJlc29sdmU7XG5cdFx0cmVzdWx0LnJlamVjdCAgPSByZWplY3Q7XG5cdH0pO1xuXHRyZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIGNyZWF0ZSBhIGZhY2FkIGZvciBlczYtcHJvbWlzZSBhbGxcbiAqIG92cnJpZGRlbiBmYWNhZCB0byBkaXNwbGF5IGVycm9yIGxvZ3MgZm9yIGRldmVsb3BtZW50IFxuICogZHVlIHRvIGVzNi1wcm9taXNlIGVycm9yIHN1cHByZXNzaW9uIGlzc3VlXG4gKiBAcGFyYW0gIHthcnJheX0gICBwcm9taXNlcyBcbiAqIEByZXR1cm4ge2Z1bmN0aW9ufSBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFsbCgpIHtcblxuXHRsZXQgZXh0ZXJuYWxFcnJvcixcblx0XHRlcnJvciA9IChlKSA9PiB7IFxuXHRcdFx0Y29uc29sZS5lcnJvciggJyAtLS0gUFJPTUlTRSBDQVVHSFQgRVJST1IgLS0tICcsIGFyZ3VtZW50c1swXS5zdGFjaywgZSApOyBcblx0XHRcdGlmKGV4dGVybmFsRXJyb3IpeyBleHRlcm5hbEVycm9yKCdlczYtcHJvbWlzZSBhbGwgZXJyb3IgJywgYXJndW1lbnRzWzBdLnN0YWNrLCBlKTsgfVxuXHRcdH07XG5cdFx0XG5cdHJldHVybiAoKSA9PiB7XG5cdFx0bGV0IGFsbCA9IFByb21pc2UuYWxsKCBhcmd1bWVudHNbMF0gKTtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dGhlbiAoKSB7XG5cdFx0XHRcdGV4dGVybmFsRXJyb3IgPSAgYXJndW1lbnRzWzFdO1xuXHRcdFx0XHRhbGwudGhlbihhcmd1bWVudHNbMF0pLmNhdGNoKCBlcnJvciApO1xuXHRcdFx0fVxuXHRcdH07XG5cdH0oYXJndW1lbnRzKTtcbn1cblxuXG4vKipcbiAqIHJldHVybiBvYmplY3QgZ2V0dGVyc1xuICogXG4gKiAtIGFsbCAtIGNoZWNrcyB0byBzZWUgaWYgYWxsIHByb21pc2VzIGhhcyBjb21wbGV0ZWQgYmVmb3JlIGNvbnRpbnVpbmdcbiAqIC0gUHJvbWlzZSAtIHJldHVybnMgYSBQcm9taXNlXG4gKiAtIERlZmVycmVkIC0gcmV0dXJucyBhbiB1biByZXNvbHZlZCBwcm9taXNlIGFuZCBhbiBvYmplY3Qgd2l0aCB0aGUgcmVzb2x2ZSBhbmQgcmVqZWN0IGZ1bmN0aW9uc1xuICogQHJldHVybiB7ZnVuY3Rpb259ICAgW2Rlc2NyaXB0aW9uXVxuICovXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoIFByb21pc2VGYWNhZGUsICdhbGwnLCB7IGdldCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gYWxsOyB9IH0pO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBQcm9taXNlRmFjYWRlLCAnUHJvbWlzZScsIHsgZ2V0IDogZnVuY3Rpb24oKSB7IHJldHVybiBQcm9taXNlOyB9IH0pO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBQcm9taXNlRmFjYWRlLCAnRGVmZXJyZWQnLCB7IGdldCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gRGVmZXJyZWQ7IH0gfSk7XG5cbi8qIGV4cG9ydCBkZWZhdWx0cyAqL1xuZXhwb3J0IGRlZmF1bHQgUHJvbWlzZUZhY2FkZTtcbiIsIlxuaW1wb3J0IG1peGluIFx0ZnJvbSAnLi4vdXRpbHMvbWl4aW4nO1xuaW1wb3J0IExvZ2dlciBcdGZyb20gJy4uL2NvbW1vbi9sb2dnZXInO1xuXG5cbmNvbnN0IGRlZmF1bHRWaWV3TWFuYWdlciA9IG1peGluKCB7IG5hbWUgOiAnRGVmYXVsdFZpZXdNYW5hZ2VyJyB9LCBMb2dnZXIgKTtcblxuXG4vKiB2aWV3cyAqL1xubGV0IHZpZXdzID0ge307XG5cbi8qKlxuICogaW5pdGlhbGl6ZSB0aGUgZGVmYXVsdCB2aWV3IG1hbmFnZXJcbiAqIFVzZWQgaWYgYSB2aWV3IG1hbmFnZXIgaGFzIG5vdCBiZWVuIHNldFxuICogQHBhcmFtICB7b2JqZWN0fSBvcHRpb25zXG4gKi9cbmRlZmF1bHRWaWV3TWFuYWdlci5pbml0ID0gZnVuY3Rpb24oIG9wdGlvbnMgKVxue1xuXHR2aWV3cyA9IG9wdGlvbnMudmlld3M7XG5cdGRlZmF1bHRWaWV3TWFuYWdlci5pbml0TG9nZ2VyKCBvcHRpb25zLmRlYnVnICk7XG5cblx0ZGVmYXVsdFZpZXdNYW5hZ2VyLmxvZygnaW5pdGlhdGVkJyk7XG5cdHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBmZXRjaCB2aWV3XG4gKiBAcGFyYW0gIHtzdHJpbmd9IHZpZXdSZWYgXG4gKiBAcmV0dXJuIHtvYmplY3R9IHJlcXVlc3RlZCB2aWV3XG4gKi9cbmRlZmF1bHRWaWV3TWFuYWdlci5mZXRjaFZpZXcgPSBmdW5jdGlvbiggdmlld1JlZiApXG57XG5cdGlmKCB2aWV3c1sgdmlld1JlZiBdICkge1xuXHRcdHJldHVybiB2aWV3c1sgdmlld1JlZiBdO1xuXHR9XG59O1xuXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmF1bHRWaWV3TWFuYWdlcjsiLCJcbmltcG9ydCBsb2dnZXIgXHRcdFx0ZnJvbSAnLi4vY29tbW9uL2xvZ2dlci5qcyc7XG5pbXBvcnQge3N0YXRlQ2hhbmdlZH0gXHRmcm9tICcuLi9jb21tb24vZGlzcGF0Y2hlcic7XG5pbXBvcnQgZGVmYXVsdFByb3BzICBcdGZyb20gJy4uL3V0aWxzL2RlZmF1bHQnO1xuaW1wb3J0IG1peGluXHRcdCAgXHRmcm9tICcuLi91dGlscy9taXhpbic7XG5cbi8qIGNyZWF0ZSBjbGFzcyBhbmQgZXh0ZW5kIGxvZ2dlciAqL1xuY29uc3QgRlNNID0gbWl4aW4oeyBuYW1lIDogJ1N0YXRlTWFjaGluZScgfSwgbG9nZ2VyICk7XG5cbihmdW5jdGlvbigpXG57XHRcblx0bGV0IFx0X3N0YXRlcyBcdFx0XHRcdD0ge30sXG5cdFx0XHRfY3VycmVudFN0YXRlIFx0XHRcdD0gbnVsbCxcblx0XHRcdF9pbml0aWFsIFx0XHRcdFx0PSBudWxsLFxuXHRcdFx0X2FjdGlvblF1ZXVlIFx0XHRcdD0gW10sXG5cdFx0XHRfaGlzdG9yeSBcdFx0XHRcdD0gW10sXG5cdFx0XHRfY2FuY2VsbGVkIFx0XHRcdFx0PSBmYWxzZSxcblx0XHRcdF90cmFuc2l0aW9uQ29tcGxldGVkIFx0PSB0cnVlLFxuXHRcdFx0X3N0YXRlQ2hhbmdlZEhhbmRsZXIgICAgPSBudWxsLFxuXG5cdFx0XHRfb3B0aW9ucyA9IHtcblx0XHRcdFx0aGlzdG9yeSBcdFx0OiBmYWxzZSxcblx0XHRcdFx0bGltaXRxIFx0IFx0XHQ6IHRydWUsXG5cdFx0XHRcdHF0cmFuc2l0aW9uc1x0OiB0cnVlLFxuXHRcdFx0XHRkZWJ1ZyBcdCBcdFx0OiBmYWxzZVxuXHRcdFx0fTtcblxuXG5cdC8qKlxuXHQgKiBjaGVjayB0byBzZSBpZiB0aCBhbmltYXRpb24gaGFzIGNhbmNlbGxlZCBpbiBcblx0ICogYmV0d2VlbiBzdGF0ZSB0cmFuc2l0aW9uc1xuXHQgKiBAcmV0dXJuIHtCb29sZWFufSBjYW5jZWxsZWRcblx0Ki9cblx0ZnVuY3Rpb24gaXNDYW5jZWxsZWQoKSB7XG5cdFx0aWYoX2NhbmNlbGxlZCkge1xuXHRcdFx0X3RyYW5zaXRpb25Db21wbGV0ZWQgPSB0cnVlO1xuXHRcdFx0X2NhbmNlbGxlZCBcdFx0XHQgPSBmYWxzZTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXG5cdC8qKlxuXHQgKiB0cmFuc2l0aW9uIHRvIHRoZSBuZXh0IHN0YXRlXG5cdCAqIEBwYXJhbSAge29iamVjdH0gbmV4dFN0YXRlICAgICAgICBuZXcgc3RhdGUgb2JqZWN0XG5cdCAqIEBwYXJhbSAge3N0cmluZ30gYWN0aW9uICAgICAgICAgICBhY3Rpb25JRCBcblx0ICogQHBhcmFtICB7b2JqZWN0fSBkYXRhICAgICAgICAgICAgIGRhdGEgc2VudCB3aXRoIHRoZSBhY3Rpb25cblx0ICogQHBhcmFtICB7c3RyaW5nfSBhY3Rpb25JZGVudGlmaWVyIHN0YXRlIGFuZCBhY3Rpb24gY29tYmluZWQgdG8gbWFrZSBhIHVuaXF1ZSBzdHJpbmdcblx0Ki9cblxuXHRmdW5jdGlvbiBfdHJhbnNpdGlvblRvKCBuZXh0U3RhdGUsIGFjdGlvbiwgZGF0YSApXG5cdHtcblx0XHRfY2FuY2VsbGVkIFx0XHRcdFx0PSBmYWxzZTtcblx0XHRfdHJhbnNpdGlvbkNvbXBsZXRlZCBcdD0gZmFsc2U7XG5cblx0XHRpZiggaXNDYW5jZWxsZWQoKSApIHsgcmV0dXJuIGZhbHNlOyB9XG5cblx0XHRpZiggX2N1cnJlbnRTdGF0ZSApIHtcblx0XHRcdGxldCBwcmV2aW91c1N0YXRlID0gX2N1cnJlbnRTdGF0ZTtcblx0XHRcdGlmKF9vcHRpb25zLmhpc3RvcnkpeyBfaGlzdG9yeS5wdXNoKHByZXZpb3VzU3RhdGUubmFtZSk7IH1cblx0XHR9XG5cdFx0XG5cdFx0X2N1cnJlbnRTdGF0ZSA9IG5leHRTdGF0ZTtcblxuXHRcdGlmKCBhY3Rpb24gKSB7XG5cdFx0XHRfc3RhdGVDaGFuZ2VkSGFuZGxlciggYWN0aW9uLCBkYXRhICk7IFxuXHRcdH0gZWxzZSB7XG5cdFx0XHRfdHJhbnNpdGlvbkNvbXBsZXRlZCA9IHRydWU7XG5cdFx0XHRGU00ubG9nKCdTdGF0ZSB0cmFuc2l0aW9uIENvbXBsZXRlZCEgQ3VycmVudCBTdGF0ZSA6OiAnICsgX2N1cnJlbnRTdGF0ZS5uYW1lICk7XG5cdFx0XHRzdGF0ZUNoYW5nZWQuZGlzcGF0Y2goX2N1cnJlbnRTdGF0ZSk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIElmIHN0YXRlcyBoYXZlIHF1ZXVlZCB1cFxuXHQgKiBsb29wIHRocm91Z2ggYW5kIGFjdGlvbiBhbGwgc3RhdGVzIGluIHRoZSBxdWV1ZSB1bnRpbFxuXHQgKiBub25lIHJlbWFpblxuXHQgKi9cblx0ZnVuY3Rpb24gX3Byb2Nlc3NBY3Rpb25RdWV1ZSgpXG5cdHtcdFxuXHRcdGlmKCBfYWN0aW9uUXVldWUubGVuZ3RoID4gMCApIHtcblx0XHRcdHZhciBzdGF0ZUV2ZW50ID0gX2FjdGlvblF1ZXVlLnNoaWZ0KCk7XG5cdFx0XHRcblx0XHRcdGlmKCFfY3VycmVudFN0YXRlLmdldFRhcmdldChzdGF0ZUV2ZW50LmFjdGlvbikpIHtcblx0XHRcdFx0X3Byb2Nlc3NBY3Rpb25RdWV1ZSgpO1xuXHRcdFx0fSBcblx0XHRcdGVsc2Uge1xuXHRcdFx0fVx0RlNNLmFjdGlvbiggc3RhdGVFdmVudC5hY3Rpb24sIHN0YXRlRXZlbnQuZGF0YSApO1xuXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0RlNNLmxvZygnU3RhdGUgdHJhbnNpdGlvbiBDb21wbGV0ZWQhIEN1cnJlbnQgU3RhdGUgOjogJyArIF9jdXJyZW50U3RhdGUubmFtZSApO1xuXHRcdHN0YXRlQ2hhbmdlZC5kaXNwYXRjaChfY3VycmVudFN0YXRlKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBzdGFydCBGU00gXG5cdCAqIHNldCB0aGUgaW5pdGlhbCBzdGF0ZVxuXHQgKi9cblx0RlNNLnN0YXJ0ID0gZnVuY3Rpb24oICApXG5cdHtcblx0XHRpZighX2luaXRpYWwpIHsgcmV0dXJuIEZTTS5sb2coJ0VSUk9SIC0gRlNNIG11c3QgaGF2ZSBhbiBpbml0aWFsIHN0YXRlIHNldCcpOyB9XG5cdFx0X3RyYW5zaXRpb25UbyggX2luaXRpYWwsIG51bGwgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogcmV0dXJuIHRoZSBhY3Rpb24gaGlzdG9yeVxuXHQgKiBAcmV0dXJuIHthcmF5fSBcblx0ICovXG5cdEZTTS5nZXRIaXN0b3J5ID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIF9oaXN0b3J5O1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBETyBBQ1RJT05cblx0ICogZG8gYWN0aW9uIGFuZCBjaGFuZ2UgdGhlIGN1cnJlbnQgc3RhdGUgaWZcblx0ICogdGhlIGFjdGlvbiBpcyBhdmFpbGFibGUgYW5kIGFsbG93ZWRcblx0ICogQHBhcmFtICB7c3RyaW5nfSBhY3Rpb24gdG8gY2Fycnkgb3V0XG5cdCAqIEBwYXJhbSAge29iamVjdH0gZGF0YSB0byBzZW5kIHdpdGggdGhlIHN0YXRlXG5cdCAqL1xuXHRGU00uYWN0aW9uID0gZnVuY3Rpb24oIGFjdGlvbiwgZGF0YSApXG5cdHtcblx0XHRpZiggIV9jdXJyZW50U3RhdGUgKXsgcmV0dXJuIEZTTS5sb2coICdFUlJPUiA6IFlvdSBtYXkgbmVlZCB0byBzdGFydCB0aGUgZnNtIGZpcnN0JyApOyB9XG5cdFx0XG5cdFx0LyogaWYgdHJhbnNpdGlvbmluZywgcXVldWUgdXAgbmV4dCBhY3Rpb24gKi9cblx0XHRpZighX3RyYW5zaXRpb25Db21wbGV0ZWQgJiYgX29wdGlvbnMucXRyYW5zaXRpb25zKSB7IFxuXHRcdFx0RlNNLmxvZygndHJhbnNpdGlvbiBpbiBwcm9ncmVzcywgYWRkaW5nIGFjdGlvbiAqJythY3Rpb24rJyB0byBxdWV1ZScpO1xuXG5cdFx0XHQvKiBzdG9yZSB0aGUgYWN0aW9uIGRhdGEgKi9cblx0XHRcdGxldCBhY3Rpb25TdG9yZSA9IHsgYWN0aW9uIDogYWN0aW9uLCBkYXRhIDogZGF0YSB9O1xuXG5cdFx0XHRpZiggX29wdGlvbnMubGltaXRxICkge1xuXHRcdFx0XHRfYWN0aW9uUXVldWVbMF0gPSBhY3Rpb25TdG9yZTtcblx0XHRcdH0gXG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0X2FjdGlvblF1ZXVlW19hY3Rpb25RdWV1ZS5sZW5ndGhdID0gYWN0aW9uU3RvcmU7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Y29uc3QgXHR0YXJnZXQgXHRcdD0gX2N1cnJlbnRTdGF0ZS5nZXRUYXJnZXQoIGFjdGlvbiApLFxuXHRcdFx0XHRuZXdTdGF0ZSBcdD0gX3N0YXRlc1sgdGFyZ2V0IF0sXG5cdFx0XHRcdF9hY3Rpb25JZCBcdD0gX2N1cnJlbnRTdGF0ZS5pZCggYWN0aW9uICk7XG5cblx0XHQvKiBpZiBhIG5ldyB0YXJnZXQgY2FuIGJlIGZvdW5kLCBjaGFuZ2UgdGhlIGN1cnJlbnQgc3RhdGUgKi9cblx0XHRpZiggbmV3U3RhdGUgKSB7XG5cdFx0XHRGU00ubG9nKCdDaGFuZ2luZyBzdGF0ZSA6OiAnICsgX2N1cnJlbnRTdGF0ZS5uYW1lICsgJyA+Pj4gJyArIG5ld1N0YXRlLm5hbWUgKTtcblx0XHRcdF90cmFuc2l0aW9uVG8oIG5ld1N0YXRlLCBfYWN0aW9uSWQsIGRhdGEgKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRGU00uZXJyb3IoICdTdGF0ZSBuYW1lIDo6OiAnICsgX2N1cnJlbnRTdGF0ZS5uYW1lICsgJyBPUiBBY3Rpb246ICcgKyBhY3Rpb24gKyAnIGlzIG5vdCBhdmFpbGFibGUnICk7XG5cdFx0fVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBjYW5jZWwgdGhlIGN1cnJlbnQgdHJhbnNpdGlvblxuXHQgKi9cblx0RlNNLmNhbmNlbCA9IGZ1bmN0aW9uKCkgeyBfY2FuY2VsbGVkID0gdHJ1ZTsgfTtcblxuXG5cdC8qKlxuXHQgKiB0cmFuc2l0aW9uIGNvbXBsZXRlZFxuXHQgKiBjYWxsZWQgZXh0ZXJuYWxseSBvbmNlIGFsbCBwcm9jZXNzZXMgaGF2ZSBjb21wbGV0ZWRcblx0ICovXG5cdEZTTS50cmFuc2l0aW9uQ29tcGxldGUgPSBmdW5jdGlvbigpIHtcblx0XHRfdHJhbnNpdGlvbkNvbXBsZXRlZCA9IHRydWU7XG5cdFx0X3Byb2Nlc3NBY3Rpb25RdWV1ZSgpO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBhZGQgYSBuZXcgc3RhdGUgdG8gdGhlIEZTTVxuXHQgKiBAcGFyYW0ge29iamVjdH0gIHN0YXRlIC0gRlNNIFNUQVRFXG5cdCAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNJbml0aWFsXG5cdCAqL1xuXHRGU00uYWRkU3RhdGUgPSBmdW5jdGlvbiggc3RhdGUsIGlzSW5pdGlhbCApIHtcblxuXHRcdGlmKCAhX3N0YXRlcyB8fCBfc3RhdGVzWyBzdGF0ZS5uYW1lIF0gKSB7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cdFx0XG5cdFx0X3N0YXRlc1sgc3RhdGUubmFtZSBdID0gc3RhdGU7XG5cdFx0aWYoIGlzSW5pdGlhbCApIHsgX2luaXRpYWwgPSBzdGF0ZTsgfVxuXHRcdHJldHVybiBzdGF0ZTtcblx0fTtcblxuXHQvKipcblx0ICogaW5pdGlhbGlzZSAtIHBhc3MgaW4gc2V0dXAgb3B0aW9uc1xuXHQgKiBAcGFyYW0gIHtvYmplY3R9IG9wdGlvbnMgXG5cdCAqL1xuXHRGU00uaW5pdCA9IGZ1bmN0aW9uKCBvcHRpb25zIClcblx0e1xuXHRcdGRlZmF1bHRQcm9wcyggX29wdGlvbnMsIG9wdGlvbnMgKTtcblx0XHRGU00uaW5pdExvZ2dlciggX29wdGlvbnMuZGVidWcgKTtcblx0XHRGU00ubG9nKCdpbml0aWF0ZWQnKTtcblx0fTtcblxuXHQvKipcblx0ICogY3JlYXRlIHN0YXRlcyBhbmQgdHJhbnNpdGlvbnMgYmFzZWQgb24gY29uZmlnIGRhdGEgcGFzc2VkIGluXG5cdCAqIGlmIHN0YXRlcyBhcmUgYW4gYXJyYXksIGxvb3AgYW5kIGFzc2lnbiBkYXRhXG5cdCAqIHRvIG5ldyBzdGF0ZSBvYmplY3RzXG5cdCAqIEBwYXJhbSAge2FycmF5L29iamVjdH0gY29uZmlnIC0gW3sgbmFtZSwgdHJhbnNpdGlvbnMsIGluaXRpYWwgfV1cblx0ICovXG5cdEZTTS5jcmVhdGUgPSBmdW5jdGlvbiggY29uZmlnIClcblx0e1xuXHRcdGlmKCBjb25maWcgaW5zdGFuY2VvZiBBcnJheSApIHtcblx0XHRcdGNvbmZpZy5mb3JFYWNoKCAoIGl0ZW0gKSA9PiB7IHRoaXMuY3JlYXRlKCBpdGVtICk7IH0sIHRoaXMgKTtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblx0XHRsZXQgaW5pdGlhbCBcdFx0XHQ9IChfc3RhdGVzLmxlbmd0aCA9PT0gMCB8fCBjb25maWcuaW5pdGlhbCksXG5cdFx0XHRzdGF0ZSAgXHRcdFx0XHQ9IG5ldyBGU00uU3RhdGUoIGNvbmZpZy5uYW1lLCBpbml0aWFsICksXG5cdFx0XHRzdGF0ZVRyYW5zaXRpb25zICAgID0gY29uZmlnLnN0YXRlVHJhbnNpdGlvbnMgfHwgW107XG5cblx0XHRzdGF0ZVRyYW5zaXRpb25zLmZvckVhY2goICh0cmFuc2l0aW9uKSA9PiB7XG5cdFx0XHRzdGF0ZS5hZGRUcmFuc2l0aW9uKCB0cmFuc2l0aW9uLmFjdGlvbiwgdHJhbnNpdGlvbi50YXJnZXQsIHRyYW5zaXRpb24uX2lkICk7XG5cdFx0fSk7XHRcblxuXHRcdEZTTS5hZGRTdGF0ZSggc3RhdGUsIGluaXRpYWwgKTtcblx0fTtcblx0XG5cdC8qKlxuXHQgKiByZXR1cm4gdGhlIGN1cnJlbnQgc3RhdGVcblx0ICogQHJldHVybiB7b2JqZWN0fSBGU00gc3RhdGVcblx0ICovXG5cdEZTTS5nZXRDdXJyZW50U3RhdGUgPSBmdW5jdGlvbigpIHsgcmV0dXJuIF9jdXJyZW50U3RhdGU7IH07XG5cblx0LyoqXG5cdCAqIGRpc3Bvc2UgdGhlIHN0YXRlIG1hY2hpbiBcblx0ICovXG5cdEZTTS5kaXNwb3NlID0gZnVuY3Rpb24oKSB7XG5cdFx0X3N0YXRlcyA9IG51bGw7XG5cdH07XG5cdFxuXHQvKiBzZXRzIGEgc3RhdGVzQ2hhbmdlZCBtZXRob2QgaW5zdGVhZCBvZiB1c2luZyBhIHNpZ25hbCAqL1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoIEZTTSwgJ3N0YXRlQ2hhbmdlZE1ldGhvZCcsIHsgc2V0OiBmdW5jdGlvbiggbWV0aG9kICkgeyBfc3RhdGVDaGFuZ2VkSGFuZGxlciA9IG1ldGhvZDsgfSB9KTtcblxuXG5cdC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogWyBDcmVhdGUgRlNNIFN0YXRlXSAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0LyoqXG5cdCAqIEZTTSBzdGF0ZSBjbGFzc1xuXHQgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBzdGF0ZSBuYW1lXG5cdCAqL1xuXHRGU00uU3RhdGUgPSBmdW5jdGlvbiggbmFtZSwgaW5pdGlhbCApXG5cdHtcblx0XHR0aGlzLl90cmFuc2l0aW9ucyBcdD0ge307IFx0Ly8gYXZhaWxhYmxlIHRyYW5zaXRpb25zXG5cdFx0dGhpcy5fbmFtZSBcdFx0XHQ9IG5hbWU7IC8vIG5hbWUgICAgICAgICAgICAgIFx0ICAgICAgXHRcblx0XHR0aGlzLl9kYXRhIFx0XHRcdD0ge307ICAgLy8gZGF0YSB0byBhc3Nvc2NpYXRlIHdpdGggdGhlIGFjdGlvblxuXHRcdHRoaXMuX2luaXRpYWwgIFx0XHQ9IGluaXRpYWw7XG5cdH07XG5cblx0RlNNLlN0YXRlLnByb3RvdHlwZSA9IHtcblxuXHRcdF9mZXRjaFRyYW5zaXRpb24gOiBmdW5jdGlvbiggYWN0aW9uLCBtZXRob2QgKSB7XG5cdFx0XHRpZiggdGhpcy5fdHJhbnNpdGlvbnNbIGFjdGlvbiBdICkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5fdHJhbnNpdGlvbnNbIGFjdGlvbiBdWyBtZXRob2QgXTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9LFxuXG5cdFx0LyoqXG5cdFx0ICogYWRkIHRoZSBhdmFpbGFibGUgdHJhc2l0aW9ucyBmb3IgZWFjaCBzdGF0ZVxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nfSBhY3Rpb24gZS5nLidHT1RPSE9NRSdcblx0XHQgKiBAcGFyYW0ge3N0cmluZ30gdGFyZ2V0IGUuZy4gJ0hPTUUnXG5cdFx0ICovXG5cdFx0YWRkVHJhbnNpdGlvbiA6IGZ1bmN0aW9uKCBhY3Rpb24sIHRhcmdldCwgYWN0aW9uSWRuZW50aWZpZXIgKSB7XG5cdFx0XHRpZiggdGhpcy5fdHJhbnNpdGlvbnNbIGFjdGlvbiBdICkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcdHRoaXMuX3RyYW5zaXRpb25zWyBhY3Rpb24gXSA9IHsgdGFyZ2V0IDogdGFyZ2V0LCBfaWQgOiBhY3Rpb25JZG5lbnRpZmllciB9O1xuXHRcdH0sXG5cblx0XHRnZXRBY3Rpb25JZCA6IGZ1bmN0aW9uKCBhY3Rpb24gKSB7IHJldHVybiB0aGlzLl9mZXRjaFRyYW5zaXRpb24oIGFjdGlvbiwgJ19pZCcgKTsgfSxcblx0XHRnZXRUYXJnZXQgICA6IGZ1bmN0aW9uKCBhY3Rpb24gKSB7IHJldHVybiB0aGlzLl9mZXRjaFRyYW5zaXRpb24oIGFjdGlvbiwgJ3RhcmdldCcgKTsgfVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBjcmVhdGUgZ2V0dGVycyBmb3IgdGhlIHN0YXRlIFxuXHQgKiAgLSBuYW1lXG5cdCAqICAtIHRyYW5zaXRpb25zXG5cdCAqICAtIGRhdGFcblx0ICovXG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShGU00uU3RhdGUucHJvdG90eXBlLCAnbmFtZScsIFx0XHRcdHsgZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMuX25hbWU7IH19ICk7XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShGU00uU3RhdGUucHJvdG90eXBlLCAndHJhbnNpdGlvbnMnLCBcdHsgZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMuX3RyYW5zaXRpb25zOyB9fSApO1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoRlNNLlN0YXRlLnByb3RvdHlwZSwgJ2RhdGEnLCBcdFx0XHR7IGdldDogZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLl9kYXRhOyB9fSApO1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoRlNNLlN0YXRlLnByb3RvdHlwZSwgJ2luaXRpYWwnLCBcdFx0eyBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5faW5pdGlhbDsgfSB9KTtcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KEZTTS5TdGF0ZS5wcm90b3R5cGUsICdpZCcsIFx0XHRcdHsgZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMuZ2V0QWN0aW9uSWQ7IH0gfSk7XG5cbn0pKCk7XG5cbmV4cG9ydCBkZWZhdWx0IEZTTTtcblxuXG4iLCJcbmltcG9ydCBsb2dnZXIgIFx0XHRcdGZyb20gJy4uL2NvbW1vbi9sb2dnZXIuanMnO1xuaW1wb3J0IGRlZmF1bHRQcm9wcyAgXHRmcm9tICcuLi91dGlscy9kZWZhdWx0JztcbmltcG9ydCBtaXhpblx0XHQgIFx0ZnJvbSAnLi4vdXRpbHMvbWl4aW4nO1xuXG4vKiBkaXNwYXRjaGVyIHNpZ25hbHMgKi9cbmltcG9ydCB7XG5cdHRyYW5zaXRpb25Db21wbGV0ZSxcblx0YWxsVHJhbnNpdGlvbkNvbXBsZXRlZCxcblx0dHJhbnNpdGlvblN0YXJ0ZWQsXG5cdGFsbFRyYW5zaXRpb25zU3RhcnRlZFxufSBmcm9tICcuLi9jb21tb24vZGlzcGF0Y2hlcic7XG5cbi8qIHByb21pc2VzICovXG5pbXBvcnQgeyBcblx0YWxsLFxuXHREZWZlcnJlZCxcbn0gZnJvbSAnLi4vY29tbW9uL3Byb21pc2VGYWNhZGUnO1xuXG5cbi8qIGNyZWF0ZSBjbGFzcyBhbmQgZXh0ZW5kIGxvZ2dlciAqL1xuY29uc3QgVHJhbnNpdGlvbkNvbnRyb2xsZXIgPSBtaXhpbih7IG5hbWUgOiAnVHJhbnNpdGlvbkNvbnRyb2xsZXInIH0gLCBsb2dnZXIpO1xuXG5cbihmdW5jdGlvbigpXG57XHRcblx0bGV0IF90cmFuaXN0aW9uQ29tcGxldGUgPSBudWxsLFxuXG5cdFx0X29wdGlvbnMgPSB7IC8vIGRlZmF1bHQgb3B0aW9uc1xuXHRcdFx0ZGVidWcgXHQgXHRcdFx0OiBmYWxzZSxcblx0XHRcdHRyYW5zaXRpb25zIFx0XHQ6IG51bGxcblx0XHR9O1xuXG5cdC8qKlxuXHQgKiB0cmFuc2l0aW9uIHRoZSB2aWV3cywgZmluZCB0aGUgdHJhbnNpdGlvbiBtb2R1bGUgaWYgaXQgXG5cdCAqIGV4aXN0cyB0aGVuIHBhc3MgaW4gdGhlIGxpbmtlZCB2aWV3cywgZGF0YSBhbmQgc2V0dGluZ3Ncblx0ICogXG5cdCAqIEBwYXJhbSAge29uamVjdH0gdHJhbnNpdGlvbk9iaiAgLSBjb250YWlucyB7dHJhbnNpdGlvblR5cGUsIHZpZXdzLCBjdXJyZW50Vmlld0lELCBuZXh0Vmlld0lEfVxuXHQgKiBAcGFyYW0gIHthcnJheX0gdmlld3NUb0Rpc3Bvc2UgIC0gYXJyYXkgdG8gc3RvcmUgdGhlIHZpZXdzIHBhc3NlZCB0byBlYWNoIG1vZHVsZSB0byBkaXNwYXRjaCBvbiB0cmFuc2l0aW9uIGNvbXBsZXRlZFxuXHQgKiBAcmV0dXJuIHthcnJheX0gcHJvbWlzZXMgZnJvbSBEZWZlcnJlZCBcblx0ICovXG5cdGZ1bmN0aW9uIF90cmFuc2l0aW9uVmlld3MoIHRyYW5zaXRpb25PYmogKVxuXHR7XG5cdFx0aWYoICF0cmFuc2l0aW9uT2JqICl7IHJldHVybiBUcmFuc2l0aW9uQ29udHJvbGxlci5lcnJvcigndHJhbnNpdGlvbiBpcyBub3QgZGVmaW5lZCcpOyB9XG5cdFx0Y29uc3QgdHJhbnNpdGlvbk1vZHVsZSA9IF9vcHRpb25zLnRyYW5zaXRpb25zWyB0cmFuc2l0aW9uT2JqLnRyYW5zaXRpb25UeXBlIF07XG5cdFx0XG5cdFx0aWYoIHRyYW5zaXRpb25Nb2R1bGUgKSAge1xuXG5cdFx0XHRjb25zdCBcdGRlZmVycmVkIFx0XHQ9IERlZmVycmVkKCksXG5cdFx0XHRcdFx0dmlld3MgXHRcdFx0PSB0cmFuc2l0aW9uT2JqLnZpZXdzLFxuXHRcdFx0XHRcdGN1cnJlbnRWaWV3UmVmIFx0PSB0cmFuc2l0aW9uT2JqLmN1cnJlbnRWaWV3SUQsXG5cdFx0XHRcdFx0bmV4dFZpZXdSZWYgXHQ9IHRyYW5zaXRpb25PYmoubmV4dFZpZXdJRDtcblxuXHRcdFx0LyogaW5kaXZpZHVhbCB0cmFuc2l0aW9uIGNvbXBsZXRlZCAqL1xuXHRcdFx0ZGVmZXJyZWQucHJvbWlzZS50aGVuKCAoKSA9PiB7XG5cdFx0XHRcdHRyYW5zaXRpb25Db21wbGV0ZS5kaXNwYXRjaCggdHJhbnNpdGlvbk9iaiApO1xuXHRcdFx0XHRUcmFuc2l0aW9uQ29udHJvbGxlci5sb2coIHRyYW5zaXRpb25PYmoudHJhbnNpdGlvblR5cGUgKycgLS0gY29tcGxldGVkJyk7XG5cdFx0XHR9KTtcblxuXHRcdFx0aWYoIHRyYW5zaXRpb25Nb2R1bGUuaW5pdGlhbGl6ZSApe1xuXHRcdFx0XHR0cmFuc2l0aW9uTW9kdWxlLmluaXRpYWxpemUoIHZpZXdzLCB0cmFuc2l0aW9uT2JqLmRhdGEsIGRlZmVycmVkLCBjdXJyZW50Vmlld1JlZiwgbmV4dFZpZXdSZWYgKTtcblx0XHRcdH1cblxuXHRcdFx0dHJhbnNpdGlvblN0YXJ0ZWQuZGlzcGF0Y2goIHRyYW5zaXRpb25PYmogKTtcblx0XHRcdFRyYW5zaXRpb25Db250cm9sbGVyLmxvZyggdHJhbnNpdGlvbk9iai50cmFuc2l0aW9uVHlwZSArJyAtLSBzdGFydGVkJyk7XG5cdFx0XHR0cmFuc2l0aW9uTW9kdWxlLmFuaW1hdGUoIHZpZXdzLCBkZWZlcnJlZCwgY3VycmVudFZpZXdSZWYsIG5leHRWaWV3UmVmICk7XG5cdFx0XHRcblx0XHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdFRyYW5zaXRpb25Db250cm9sbGVyLmVycm9yKHRyYW5zaXRpb25PYmoudHJhbnNpdGlvblR5cGUgKyAnIGRvZXMgTk9UIGV4aXN0JyApO1xuXHRcdH1cblx0fVxuXG5cblx0ZnVuY3Rpb24gX3ByZXBhcmVBbmRTdGFydCggdHJhbnNpdGlvbnMgKVxuXHR7XG5cdFx0Y29uc3QgXHRpbml0aWFsVHJhbnNpaW9uIFx0PSB0cmFuc2l0aW9ucy5zaGlmdCgwKSxcblx0XHRcdFx0dHJhbnNpdGlvbnNMZW5ndGggXHQ9IHRyYW5zaXRpb25zLmxlbmd0aDtcblx0XHRcblx0XHRsZXQgXHRkZWZlcnJlZFRyYW5zaXRpb25zID0gW10sXG5cdFx0XHRcdGkgXHRcdFx0XHRcdD0gMCxcblx0XHRcdFx0dHJhbnNpdGlvbk9iajtcblxuXHRcdC8vIGdldCB0aGUgZmlyc3QgdHJhbnNpdGlvbiB0byBwcmV2ZW50IGxvb3BpbmcgdW5uZWNlc3NhcmlseVxuXHRcdGRlZmVycmVkVHJhbnNpdGlvbnMucHVzaCggX3RyYW5zaXRpb25WaWV3cyggaW5pdGlhbFRyYW5zaWlvbiApICk7XG5cblx0XHR3aGlsZSggaSA8IHRyYW5zaXRpb25zTGVuZ3RoIClcblx0XHR7XG5cdFx0XHR0cmFuc2l0aW9uT2JqIFx0PSB0cmFuc2l0aW9uc1sgaSBdO1xuXHRcdFx0ZGVmZXJyZWRUcmFuc2l0aW9uc1sgZGVmZXJyZWRUcmFuc2l0aW9ucy5sZW5ndGggXSA9IF90cmFuc2l0aW9uVmlld3MoIHRyYW5zaXRpb25PYmogKTtcblxuXHRcdFx0KytpO1xuXHRcdH1cblxuXHRcdC8vIGxpc3RlbiBmb3IgY29tcGxldGVkIG1vZHVsZXNcblx0XHRhbGwoIGRlZmVycmVkVHJhbnNpdGlvbnMgKS50aGVuKCAoKSA9PiB7XG5cdFx0XHRUcmFuc2l0aW9uQ29udHJvbGxlci5sb2coJ3RyYW5zaXRpb24gcXVldWUgZW1wdHkgLS0tLSBhbGwgdHJhbnNpdGlvbnMgY29tcGxldGVkJyk7XG5cblx0XHRcdF90cmFuaXN0aW9uQ29tcGxldGUoKTtcblx0XHRcdGFsbFRyYW5zaXRpb25Db21wbGV0ZWQuZGlzcGF0Y2goKTtcblxuXHRcdH0sIFRyYW5zaXRpb25Db250cm9sbGVyLmVycm9yICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiByZW1vdmUgYSBtb2R1bGUgYnkgbmFtZSBmcm9tIHRoZSBkaWN0aW9uYXJ5IFxuXHQgKiBvZiBtb2R1bGVzIGlmIHRoZXkgZXhpc3Rcblx0ICogXG5cdCAqIEBwYXJhbSAge3N0cmluZ30gbW9kdWxlTmFtZSBbXG5cdCAqIEByZXR1cm4ge29iamVjdH0gVHJhbnNpdGlvbkNvbnRyb2xsZXJcblx0ICovXG5cdFRyYW5zaXRpb25Db250cm9sbGVyLnJlbW92ZU1vZHVsZSA9IGZ1bmN0aW9uKCBtb2R1bGVOYW1lIClcblx0e1xuXHRcdGlmKCAhbW9kdWxlTmFtZSApIHsgcmV0dXJuIGZhbHNlOyB9XG5cblx0XHRpZiggbW9kdWxlTmFtZSBpbnN0YW5jZW9mIEFycmF5ICkge1xuXHRcdFx0bW9kdWxlTmFtZS5mb3JFYWNoKGZ1bmN0aW9uKG1vZHVsZSkge1xuXHRcdFx0XHR0aGlzLnJlbW92ZU1vZHVsZSggbW9kdWxlICk7XG5cdFx0XHR9LCB0aGlzICk7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cdFx0XG5cdFx0aWYoICBfb3B0aW9ucy50cmFuc2l0aW9uc1sgbW9kdWxlTmFtZSBdICkge1xuXHRcdFx0ZGVsZXRlIF9vcHRpb25zLnRyYW5zaXRpb25zWyBtb2R1bGVOYW1lIF07XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBZGQgbW9kdWxlIGJ5IG5hbWUgXG5cdCAqIEBwYXJhbSB7c3RyaW5nL2FycmF5fSBtb2R1bGVOYW1lIFtkZXNjcmlwdGlvbl1cblx0ICogQHBhcmFtIHtvYmplY3R9IG1vZHVsZSAtIHRyYW5zaXRpb24gbW9kdWxlIGNsYXNzXG5cdCAqIEByZXR1cm4ge29iamVjdH0gVHJhbnNpdGlvbkNvbnRyb2xsZXJcblx0ICovXG5cdFRyYW5zaXRpb25Db250cm9sbGVyLmFkZE1vZHVsZSA9IGZ1bmN0aW9uKCBtb2R1bGVOYW1lLCBtb2R1bGUgKVxuXHR7XG5cdFx0aWYoICFtb2R1bGVOYW1lICkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRpZiggbW9kdWxlTmFtZSBpbnN0YW5jZW9mIEFycmF5ICkge1xuXHRcdFx0XG5cdFx0XHRtb2R1bGVOYW1lLmZvckVhY2goZnVuY3Rpb24obW9kdWxlRGF0YSkge1xuXHRcdFx0XHRsZXQga2V5ID0gT2JqZWN0LmtleXMobW9kdWxlRGF0YSlbMF07XG5cdFx0XHRcdHRoaXMuYWRkTW9kdWxlKCBrZXkgLCBtb2R1bGVEYXRhW2tleV0gKTtcblx0XHRcdH0sIHRoaXMgKTtcblxuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXG5cdFx0aWYoIF9vcHRpb25zLnRyYW5zaXRpb25zWyBtb2R1bGVOYW1lIF0gKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdF9vcHRpb25zLnRyYW5zaXRpb25zWyBtb2R1bGVOYW1lIF0gPSBtb2R1bGU7XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBzdGFydCBwcm9jZXNzaW5nIHRoZSByZXF1ZXN0ZWQgdHJhbnNpdGlvblxuXHQgKiBAcGFyYW0gIHthcnJheS9vYmplY3R9IC0gdHJhbnNpdGlvbiBvYmplY3RzIG9yIGFycmF5IG9mIHl0cmFuc2l0aW9uIG9iamVjdHNcblx0ICovXG5cdFRyYW5zaXRpb25Db250cm9sbGVyLnByb2Nlc3NUcmFuc2l0aW9uID0gZnVuY3Rpb24oIHRyYW5zaXRpb25zIClcblx0e1xuXHRcdGFsbFRyYW5zaXRpb25zU3RhcnRlZC5kaXNwYXRjaCggdHJhbnNpdGlvbnMgKTtcblxuXHRcdC8vIHByZXBhcmUgYW5kIHN0YXJ0IHRoZSB0cmFuc2l0aW9uc1xuXHRcdFRyYW5zaXRpb25Db250cm9sbGVyLmxvZygnLS0gc3RhcnQgdHJhbnNpdGlvbmluZyB2aWV3cyAtLScpO1xuXHRcdF9wcmVwYXJlQW5kU3RhcnQoIHRyYW5zaXRpb25zICk7XG5cdH07XG5cblxuXHQvKipcblx0ICogaW5pdCB0aGUgdHJhbnNpdGlvbiBjb250cm9sbGVyXG5cdCAqIEBwYXJhbSAge29iamVjdH0gb3B0aW9ucyAtIG9wdGlvbnMgdG8gb3ZlcnJpZGUgZGVmYXVsdHNcblx0ICovXG5cdFRyYW5zaXRpb25Db250cm9sbGVyLmluaXQgPSBmdW5jdGlvbiggb3B0aW9ucyApXG5cdHtcblx0XHQvLyBnZXQgdHJhbnNpdGlvbnMgZnJvbSBpbml0IG9wdGlvbnNcblx0XHRkZWZhdWx0UHJvcHMoIF9vcHRpb25zLCBvcHRpb25zICk7XG5cblx0XHRUcmFuc2l0aW9uQ29udHJvbGxlci5pbml0TG9nZ2VyKCBfb3B0aW9ucy5kZWJ1ZyApO1xuXHRcdFRyYW5zaXRpb25Db250cm9sbGVyLmxvZygnaW5pdGlhdGVkJyk7XG5cdH07XG5cblx0LyoqXG5cdCAqIGxpbmsgZXh0ZXJuYWwgbWV0aGlkIHRvIGNoYW5nZSB0aGUgdHJhbnNpdGlvbiBjb21wbGV0ZWR4IHN0YXRlXG5cdCAqL1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoVHJhbnNpdGlvbkNvbnRyb2xsZXIsICd0cmFuc2l0aW9uQ29tcGxldGVkJywgeyBzZXQoIG1ldGhvZCApIHsgX3RyYW5pc3Rpb25Db21wbGV0ZSA9IG1ldGhvZDsgfSAgfSk7XG5cblxuXG59KSgpO1xuXG5cblxuZXhwb3J0IGRlZmF1bHQgVHJhbnNpdGlvbkNvbnRyb2xsZXI7IiwiXG5pbXBvcnQgbG9nZ2VyICBcdFx0XHRmcm9tICcuLi9jb21tb24vbG9nZ2VyLmpzJztcbmltcG9ydCBkZWZhdWx0UHJvcHMgIFx0ZnJvbSAnLi4vdXRpbHMvZGVmYXVsdCc7XG5pbXBvcnQgbWl4aW5cdFx0ICBcdGZyb20gJy4uL3V0aWxzL21peGluJztcblxuaW1wb3J0IHsgXG5cdGFsbCxcblx0RGVmZXJyZWQgXG59IGZyb20gJy4uL2NvbW1vbi9wcm9taXNlRmFjYWRlJztcblxuLyogY3JlYXRlIGNsYXNzIGFuZCBleHRlbmQgbG9nZ2VyICovXG5jb25zdCBUVk0gPSBtaXhpbih7IG5hbWUgOiAnVHJhbnNpdGlvblZpZXdNYW5hZ2VyJyB9LCBsb2dnZXIgKTtcblxuKGZ1bmN0aW9uKCl7XG5cblx0bGV0IF92aWV3c1JlYWR5TWV0aG9kID0gbnVsbCxcblx0XHR2aWV3Q2FjaGUgXHRcdCAgPSB7fSxcblxuXHQvLyBvcHRpb25zIHdpdGggZGVmYXVsdHNcblx0X29wdGlvbnMgXHRcdFx0XHQ9IHtcblx0XHRjb25maWcgIFx0XHRcdDogbnVsbCxcblx0XHR2aWV3TWFuYWdlciBcdFx0OiBudWxsLFxuXHRcdGRlYnVnIFx0XHRcdFx0OiBmYWxzZSxcblx0XHR1c2VDYWNoZSBcdFx0XHQ6IGZhbHNlXG5cdH07XG5cblx0LyoqXG5cdCAqIGxvb3AgdGhyb3VnaCBhbGwgdHJhbnNpdGlvbiBtb2R1bGVzIGFuZCBwcmVwYXJlIHRoZVxuXHQgKiB2aWV3cyByZXF1ZXN0ZWQgYnkgdGhlIGNvbmZpZ1xuXHQgKiBcblx0ICogQHBhcmFtICB7b2JqZWN0fSBhY3Rpb25EYXRhIGNvbnRhaW5pbmcgYWxsIHRyYW5zaXRpb24gdHlwZXMgYW5kIHZpZXdzIHJlcXVpcmVkXG5cdCAqIEBwYXJhbSAge29iamVjdH0gcGFyYW1EYXRhIHNlbnQgd2l0aCB0aGUgYWN0aW9uXG5cdCAqIEByZXR1cm4ge29iamVjdH0gcHJvbWlzZXMgYXJyYXkgYW5kIHBlcGFyZWQgdmlld3MgYXJyYXlcblx0ICovXG5cdGZ1bmN0aW9uIF9wcmVwYXJlVmlld3MoIGFjdGlvbkRhdGEsIHBhcmFtRGF0YSApXG5cdHtcblx0XHRsZXQgbGlua2VkVHJhbnNzTW9kdWxlcyA9IGFjdGlvbkRhdGEubGlua2VkVlRyYW5zTW9kdWxlcywgLy8gbG9vayBpbnRvIHNsaWNlIHNwZWVkIG92ZXIgY3JlYXRpbmcgbmV3IGFycmF5XG5cdFx0IFx0Vmlld3NNb2R1bGVMZW5ndGggXHQ9IGxpbmtlZFRyYW5zc01vZHVsZXMubGVuZ3RoLFxuXHRcdCBcdHByb21pc2VzIFx0XHRcdD0gW10sXG5cdFx0IFx0cHJlcGFyZWRWaWV3cyBcdFx0PSBbXSxcblx0XHQgXHRhY3Rpb25EYXRhQ2xvbmUgXHQ9IG51bGwsXG5cdFx0IFx0dmlld0NhY2hlIFx0XHRcdD0ge30sXG5cdFx0IFx0aSBcdFx0XHRcdFx0PSAwLFxuXHRcdCBcdHZpZXdzTW9kdWxlT2JqZWN0O1xuXG5cdCBcdFx0d2hpbGUoIGkgPCBWaWV3c01vZHVsZUxlbmd0aCApIHtcbiBcdFx0XHRcdHZpZXdzTW9kdWxlT2JqZWN0IFx0XHRcdFx0XHQgID0gbGlua2VkVHJhbnNzTW9kdWxlc1tpXTtcblx0IFx0XHRcdGFjdGlvbkRhdGFDbG9uZSBcdFx0XHRcdFx0ICA9IF9jbG9uZVZpZXdTdGF0ZSggYWN0aW9uRGF0YSwgdmlld3NNb2R1bGVPYmplY3QsIHBhcmFtRGF0YSApOyBcblx0IFx0XHRcdHByZXBhcmVkVmlld3NbIHByZXBhcmVkVmlld3MubGVuZ3RoIF0gPSBfZmV0Y2hWaWV3cyggdmlld3NNb2R1bGVPYmplY3Qudmlld3MsIGFjdGlvbkRhdGFDbG9uZSwgcHJvbWlzZXMsIHZpZXdDYWNoZSk7XG5cdCBcdFx0XHRcblx0IFx0XHRcdCsraTtcblx0IFx0XHR9XG5cblx0IFx0XHR2aWV3Q2FjaGUgPSBudWxsO1xuXHRcdCBcdHJldHVybiB7IHByb21pc2VzIDogcHJvbWlzZXMsIHByZXBhcmVkVmlld3MgOiBwcmVwYXJlZFZpZXdzIH07XG5cdH1cblxuXHQvKipcblx0ICogbG9vcCB0aHJvdWdoIGFuZCBmZXRjaCBhbGwgdGhlIHJlcXVlc3RlZCB2aWV3cywgdXNlIHZpZXdSZWFkeVxuXHQgKiBhbmQgY29sbGVjdCBhIHByb21pc2UgZm9yIGVhY2ggdG8gYWxsb3cgdGhlIHZpZXcgdG8gYnVpbGQgdXAgYW5kIHBlcmZvcm0gXG5cdCAqIGl0cyBwcmVwZXJhdGlvbiB0YXNrcyBpZiByZXF1aXJlZFxuXHQgKiBcblx0ICogQHBhcmFtICB7YXJyYXl9IHZpZXdzIC0gc3RyaW5nIHJlZmVyZW5jZXNcblx0ICogQHBhcmFtICB7b2JqZWN0fSBhY3Rpb25EYXRhQ2xvbmUgLSBjbG9uZWQgZGF0YSBhcyB0byBub3Qgb3ZlcnJpZGUgY29uZmlnXG5cdCAqIEBwYXJhbSAge2FycmF5fSBwcm9taXNlcyAtIGNvbGxlY3QgYWxsIHZpZXcgcHJvbWlzZXNcblx0ICogQHBhcmFtICB7b2JqZWN0fSB2aWV3Q2FjaGUgLSBwcmV2ZW50cyB2aWV3cyBmcm9tIGJlaW5nIGluc3RhbnRpYXRlZCBhbmQgcmVxdWVzdGVkIG1vcmUgdGhhbiBvbmNlXG5cdCAqIEByZXR1cm4ge29iamVjdH0gcG9wdWxhdGVkIGFjdGlvbkRhdGFDbG9uZSBkYXRhIG9iamVjdFxuXHQgKi9cblx0ZnVuY3Rpb24gX2ZldGNoVmlld3MoIHZpZXdzVG9QcmVwYXJlLCBhY3Rpb25EYXRhQ2xvbmUsIHByb21pc2VzLCB2aWV3Q2FjaGUgKVxuXHR7XG5cdFx0Y29uc3Qgdmlld3MgXHRcdD0gdmlld3NUb1ByZXBhcmUsXG5cdFx0XHQgIHZpZXdNYW5hZ2VyIFx0PSBfb3B0aW9ucy52aWV3TWFuYWdlcixcblx0XHRcdCAgbGVuZ3RoIFx0XHQ9IHZpZXdzLmxlbmd0aCxcblx0XHRcdCAgY3VycmVudFZpZXdJRCA9IGFjdGlvbkRhdGFDbG9uZS5jdXJyZW50Vmlld0lELFxuXHRcdFx0ICBuZXh0Vmlld0lEIFx0PSBhY3Rpb25EYXRhQ2xvbmUubmV4dFZpZXdJRDtcblxuXHRcdGxldCBpID0gMCxcblx0XHRcdF9kZWZlcnJlZCxcblx0XHRcdHZpZXcsXG5cdFx0XHRmb3VuZFZpZXcsXG5cdFx0XHRwYXJzZWRSZWYsXG5cdFx0XHR2aWV3UmVmO1xuXG5cdFx0d2hpbGUoIGkgPCBsZW5ndGggKVxuXHRcdHtcblx0XHRcdHZpZXdSZWYgPSB2aWV3c1sgaSBdO1xuXG5cdFx0XHRpZih2aWV3UmVmKVxuXHRcdFx0e1xuXHRcdFx0XHRmb3VuZFZpZXcgPSB2aWV3Q2FjaGVbIHZpZXdSZWYgXTtcblxuXHRcdFx0XHRpZighZm91bmRWaWV3KSB7IC8vIGNhY2hlIHRoZSB2aWV3IGluc3RhbmNlIGZvciByZXVzZSBpZiBuZWVkZWRcblx0XHRcdFx0XHRmb3VuZFZpZXcgPSB2aWV3Q2FjaGVbIHZpZXdSZWYgXSA9IHZpZXdNYW5hZ2VyLmZldGNoVmlldyggdmlld1JlZiApO1xuXHRcdFx0XHRcdF9kZWZlcnJlZCA9IERlZmVycmVkKCk7XG5cdFx0XHRcdFx0cHJvbWlzZXNbIHByb21pc2VzLmxlbmd0aCBdID0gX2RlZmVycmVkLnByb21pc2U7XG5cblx0XHRcdFx0XHRpZiggIWZvdW5kVmlldyApeyByZXR1cm4gVFZNLmVycm9yKCB2aWV3UmVmKycgaXMgdW5kZWZpbmVkJyApOyB9XG5cblx0XHRcdFx0XHRpZiggZm91bmRWaWV3LnByZXBhcmVWaWV3ICl7IGZvdW5kVmlldy5wcmVwYXJlVmlldyggX2RlZmVycmVkICk7IH1cblx0XHRcdFx0XHRlbHNlIHsgX2RlZmVycmVkLnJlc29sdmUoKTsgfVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmlldyA9IGZvdW5kVmlldztcblxuXHRcdFx0XHQvKiBjaGFuZ2UgcmVmIHRvIGN1cnJlbnQgdmlldyBvciBuZXh0IHZpZXcgdG8gYWxsb3cgZ2VuZXJhbCB0cmFuc2l0aW9ucyAqL1xuXHRcdFx0XHRwYXJzZWRSZWYgPSBfdmlld1JlZih2aWV3UmVmLCBbIGN1cnJlbnRWaWV3SUQsIG5leHRWaWV3SUQgXSk7XG5cdFx0XHRcdGlmKCBwYXJzZWRSZWYgKSB7XG5cdFx0XHRcdFx0YWN0aW9uRGF0YUNsb25lLnZpZXdzWyBwYXJzZWRSZWYgXSA9IHZpZXc7XG5cdFx0XHRcdH1cblx0XHRcdFx0YWN0aW9uRGF0YUNsb25lLnZpZXdzWyB2aWV3UmVmIF0gPSB2aWV3O1xuXHRcdFx0fVxuXG5cdFx0XHQrK2k7XG5cdFx0fVxuXHRcdFxuXHRcdHJldHVybiBhY3Rpb25EYXRhQ2xvbmU7XG5cdH1cblxuXHQvKipcblx0ICogY29udmVydCB2aWV3IG5hbWVkIHJlZmVyZW5jZXMgdG8gZWl0aGVyIGN1cnJlbnQgdmlld1xuXHQgKiBvciBuZXh0IHZpZXcgaWYgdGhlIElEJ3MgbWF0Y2hcblx0ICogTWFrZXMgaXQgZWFzaWVyIHRvIGFjY2VzcyBhbmQgYnVpbGQgZ2VuZXJpYyB1c2UgY2FzZXNcblx0ICogXG5cdCAqIEBwYXJhbSAge3N0cmluZ30gcmVmIGN1cnJlbnQgVmlldyBJRFxuXHQgKiBAcGFyYW0gIHthcnJheX0gY29tcGFyaXNvblZpZXdzIC0gY3VycmVudFZpZXcgYW5kIG5leHRWaWV3IHN0cmluZyBJRFNcblx0ICogQHJldHVybiB7c3RyaW5nfSAtIG5ldyBJRFMgaWYgbWF0Y2hlZFxuXHQgKi9cblx0ZnVuY3Rpb24gX3ZpZXdSZWYoIHJlZiwgY29tcGFyaXNvblZpZXdzICkge1xuXHQgXHR2YXIgaW5kZXggPSBjb21wYXJpc29uVmlld3MuaW5kZXhPZiggcmVmICk7XG5cdCBcdFx0cmV0dXJuIChpbmRleCA9PT0gLTEgKT8gbnVsbCA6IFsnY3VycmVudFZpZXcnLCAnbmV4dFZpZXcnXVsgaW5kZXggXTtcblx0fVxuXG5cblx0LyoqXG5cdCAqIHJldHVybiBjYWNoZWQgdmlld3MgYmFzZWQgb24gYWN0aW9uIHR5cGVcblx0ICogQHBhcmFtICB7YXJyYXl9IGNhY2hlZCAtIHByZXZpb3VzbHkgcHJlcGFyZWQgdmlld3Ncblx0ICogQHBhcmFtICB7b2JqZWN0fSBkYXRhIC0gYWN0aW9uIGRhdGEgcGFzc2VkIHRocm91Z2ggd2l0aCBhY3Rpb25cblx0ICogQHJldHVybiB7YXJyYXl9IC0gY2FjaGVkIHZpZXdzXG5cdCAqL1xuXHRmdW5jdGlvbiBfZ2V0Q2FjaGVkKCBjYWNoZWQsIGRhdGEgKVxuXHR7XG5cdFx0aWYoICFkYXRhICl7IHJldHVybiBjYWNoZWQ7IH1cblxuXHRcdGxldCBpID0gLTEsIGxlbiA9IGNhY2hlZC5sZW5ndGg7XG4gICAgICAgIHdoaWxlICgrK2kgPCBsZW4pIHtcbiAgICAgICAgICAgIGNhY2hlZFtpXS5kYXRhID0gZGF0YTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2FjaGVkO1xuXHR9XG5cblx0LyoqXG5cdCAqIGNsb25lIHRoZSBhY3Rpb24gZGF0YSBvYmplY3Rcblx0ICogZmFzdCBjbG9uZSBhbmQgcHJldmVudHMgdGhlIGNvbmZpZyByZWZlcmVuY2VzIHRvIGJlXG5cdCAqIG93ZXJpZGVuIGJ5IGluc3RhbmNlcyBvciBvdGhlciBzZXR0aW5nc1xuXHQgKiBAcGFyYW0gIHtvYmplY3R9IGFjdGlvbkRhdGEgcGFzc2VkIGluIGZyb20gdGhlIGNvbmZpZ1xuXHQgKiBAcGFyYW0gIHtvYmplY3R9IHRyYW5zaXRpb25PYmplY3QgLSBhY3Rpb24gZGF0YSB0cmFuc2l0aW9uXG5cdCAqIEBwYXJhbSAge29iamVjdH0gcGFyYW1EYXRhIHNlbnQgd2l0aCB0aGUgYWN0aW9uXG5cdCAqIEByZXR1cm4ge29iamVjdH0gbmV3IG9iamVjdCB3aXRoIGFuIGluc3RhbmNlIG9yIHJlZmVyZW5jZSBmcm9tIHRoZSBwYXJhbXNcblx0ICovXG5cdGZ1bmN0aW9uIF9jbG9uZVZpZXdTdGF0ZSggYWN0aW9uRGF0YSwgdHJhbnNpdGlvbk9iamVjdCwgcGFyYW1EYXRhICkge1xuXHQgXHRyZXR1cm4ge1xuXHRcdFx0ZGF0YSBcdFx0XHQ6IHBhcmFtRGF0YSxcblx0XHRcdGN1cnJlbnRWaWV3SUQgXHQ6IGFjdGlvbkRhdGEuY3VycmVudFZpZXcsIC8vIG9wdGlvbmFsXG5cdFx0IFx0bmV4dFZpZXdJRCBcdFx0OiBhY3Rpb25EYXRhLm5leHRWaWV3LCBcdCAgLy8gb3B0aW9uYWxcblx0XHQgXHR2aWV3cyBcdFx0XHQ6IHt9LFxuXHRcdCBcdHRyYW5zaXRpb25UeXBlICA6IHRyYW5zaXRpb25PYmplY3QudHJhbnNpdGlvblR5cGVcblx0IFx0fTtcblx0fVxuXG5cdC8qKlxuXHQgKiBwcm9jZXNzVmlld3MgLSBzdGFydCBwcmVwYXJpbmcgdGhlIHZpZXdzXG5cdCAqIEZpbmQgdmlld3MgYnkgdGhlaXIgYWN0aW9uIElEIGluIHRoZSBjb25maWdcblx0ICogXG5cdCAqIEBwYXJhbSAge29iamVjdHxzdHJpbmd9IGFjdGlvbklEIFxuXHQgKiBAcGFyYW0gIHtvYmplY3R9IGRhdGEgIHBhc3NlZCBieSB0aGUgYWN0aW9uXG5cdCAqL1xuXHRUVk0ucHJvY2Vzc1ZpZXdzID0gZnVuY3Rpb24oIGFjdGlvbklELCBkYXRhIClcblx0e1xuXHRcdGlmKCAhX29wdGlvbnMuY29uZmlnICkgIHsgcmV0dXJuIFRWTS5lcnJvcignQSBEYXRhIENvbmZpZyBvYmplY3QgbXVzdCBiZSBzZXQgdmlhOiBWaWV3TWFuYWdlci5jcmVhdGUnICk7IH1cblx0XHRpZiggIWFjdGlvbklEIClcdFx0XHR7IHJldHVybiBUVk0uZXJyb3IoJ3Byb2Nlc3NWaWV3cyAqYWN0aW9uSUQgaXMgdW5kZWZpbmVkJyApOyAgfVxuXG5cblx0XHRpZihfb3B0aW9ucy51c2VDYWNoZSAmJiB2aWV3Q2FjaGVbIGFjdGlvbklEIF0gKSB7XG5cdFx0XHRfdmlld3NSZWFkeU1ldGhvZCggX2dldENhY2hlZCggdmlld0NhY2hlWyBhY3Rpb25JRCBdLCBkYXRhICkgKTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRjb25zdCBhY3Rpb25EYXRhICA9IF9vcHRpb25zLmNvbmZpZ1sgYWN0aW9uSUQgXTtcblx0XHRpZiggYWN0aW9uRGF0YSApIHtcblxuXHRcdFx0bGV0IHByb2Nlc3NlZEFjdGlvbiBcdCAgPSBfcHJlcGFyZVZpZXdzKCBhY3Rpb25EYXRhLCBkYXRhICksXG5cdFx0XHRcdHBhcnNlZEFjdGlvbkRhdGEgXHQgID0gcHJvY2Vzc2VkQWN0aW9uLnByZXBhcmVkVmlld3MsXG5cdFx0XHRcdHBlbmRpbmdQcm9taXNlcyBcdCAgPSBwcm9jZXNzZWRBY3Rpb24ucHJvbWlzZXM7XG5cblx0XHRcdFx0dmlld0NhY2hlWyBhY3Rpb25JRCBdID0gcGFyc2VkQWN0aW9uRGF0YS5zbGljZSgwKTtcblxuXHRcdFx0Ly8gcGFyc2UgdGhlIHZpZXdzIGFuZCB3YWl0IGZvciB0aGVtIHRvIGZpbmlzaCBwcmVwYXJpbmcgdGhlbXNlbHZlc1xuXHRcdFx0YWxsKCBwZW5kaW5nUHJvbWlzZXMgKS50aGVuKCAoKSA9PiB7IFxuXHRcdFx0XHRUVk0ubG9nKCdWaWV3cyBsb2FkZWQgYW5kIHJlYWR5IGZvciAtLS0tLSAnK2FjdGlvbklEKTtcblxuXHRcdFx0XHQvLyogdmlld3MgYXJlIHJlYWR5LCBkaXNwYXRjaCB0aGVtICovL1xuXHRcdFx0XHRfdmlld3NSZWFkeU1ldGhvZCggcGFyc2VkQWN0aW9uRGF0YSApO1xuXG5cdFx0XHR9LCBUVk0uZXJyb3IgKTtcblxuXHRcdH0gZWxzZSB7XG5cdFx0XHRUVk0uZXJyb3IoJ3Byb2Nlc3NWaWV3cyAqYWN0aW9uRGF0YSBpcyB1bmRlZmluZWQnKTtcblx0XHR9XG5cdH07XG5cblx0LyoqXG5cdCAqIENyZWF0ZSB0aGUgVHJhbnNpdGlvblZpZXdNYW5hZ2VyXG5cdCAqIHBhcnNlIHRoZSBwYXNzZWQgaW4gc2V0dGluZ3Ncblx0ICogQHBhcmFtICB7b2JqZWN0fSBvcHRpb25zXG5cdCAqL1xuXHRUVk0uY3JlYXRlID0gZnVuY3Rpb24oIG9wdGlvbnMgKVxuXHR7XHRcblx0XHRkZWZhdWx0UHJvcHMoIF9vcHRpb25zLCBvcHRpb25zICk7XG5cdFx0VFZNLmluaXRMb2dnZXIoIF9vcHRpb25zLmRlYnVnICk7XG5cdFx0VFZNLmxvZygnaW5pdGlhdGVkJyk7XG5cdH07XG5cblxuXHQvKipcblx0ICogZGlzcG9zZSBvZiB0aGUgVHJhbnNpdGlvblZpZXdNYW5hZ2VyIGFuZCBcblx0ICogYWxsIGl0cyBjb21wb25lbnRzXG5cdCAqL1xuXHRUVk0uZGlzcG9zZSA9IGZ1bmN0aW9uKCkge1xuXHRcdF9vcHRpb25zICA9IG51bGw7XG5cdFx0dmlld0NhY2hlID0gbnVsbDtcblx0fTtcblxuXHQvKipcblx0ICogbGluayBleHRlcm5hbCBtZXRoaWQgdG8gbG9jYWxcblx0ICovXG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShUVk0sICd2aWV3c1JlYWR5JywgeyBzZXQoIG1ldGhvZCApIHsgX3ZpZXdzUmVhZHlNZXRob2QgPSBtZXRob2Q7IH0gIH0pO1xuXG5cbn0pKCk7XG5cblxuXG5leHBvcnQgZGVmYXVsdCBUVk07XG5cbiIsImltcG9ydCBmc20gXHRcdFx0ZnJvbSAnLi9jb3JlL2ZzbSc7XG5pbXBvcnQgdHZtIFx0XHRcdGZyb20gJy4vY29yZS90cmFuc2l0aW9uVmlld01hbmFnZXInO1xuaW1wb3J0IHRjIFx0XHRcdGZyb20gJy4vY29yZS90cmFuc2l0aW9uQ29udHJvbGxlcic7XG5pbXBvcnQgZGVmYXVsdFZtIFx0ZnJvbSAnLi9jb3JlL2RlZmF1bHRWaWV3TWFuYWdlcic7XG5pbXBvcnQgcGFyc2VyIFx0XHRmcm9tICcuL3BhcnNlcnMvZGF0YVBhcnNlcic7XG5pbXBvcnQgTG9nZ2VyIFx0XHRmcm9tICcuL2NvbW1vbi9sb2dnZXInO1xuXG5pbXBvcnQgbWl4aW4gXHRcdGZyb20gJy4vdXRpbHMvbWl4aW4nO1xuaW1wb3J0IHBpY2tcdFx0ICBcdGZyb20gJy4vdXRpbHMvcGljayc7XG5pbXBvcnQgZGlzcGF0Y2hlciBcdGZyb20gJy4vY29tbW9uL2Rpc3BhdGNoZXInO1xuXG5cbi8qIGZzbSBjb25maWcgcGx1Y2sga2V5cyAqL1xuY29uc3QgZnNtS2V5cyA9IFtcblx0J2hpc3RvcnknLFxuXHQnbGltaXRxJyxcblx0J3F0cmFuc2l0aW9ucycsXG5cdCdkZWJ1Zydcbl07XG4vKiB0dm0gY29uZmlnIHBsdWNrIGtleXMgKi9cbmNvbnN0IHR2bUtleXMgPSBbXG5cdCd2aWV3TWFuYWdlcicsXG5cdCd2aWV3cycsXG5cdCd1c2VDYWNoZScsXG5cdCdkZWJ1Zydcbl07XG4vKiB0YyBjb25maWcgcGx1Y2sga2V5cyAqL1xuY29uc3QgdGNLZXlzID0gW1xuXHQndHJhbnNpdGlvbnMnLFxuXHQnZGVidWcnXG5dO1xuLyogdGhpcyBjb25maWcgcGx1Y2sga2V5cyAqL1xuY29uc3QgaW5kZXhLZXlzID0gW1xuXHQnZGVidWcnLFxuXHQndmlld3MnLFxuXHQndmlld01hbmFnZXInXG5dXG5cblxuLyoqXG4gKiByYW5zaXRpb24gbWFuYWdlciAtIFRyYW5zaXRpb24gY29tcG9uZW50IGZhY2FkIHdyYXBwZXJcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbnZhciBUcmFuc2l0aW9uTWFuYWdlciA9IHt9O1xuXG4oZnVuY3Rpb24oKVxue1x0XG5cdC8qIHByaXZhdGUgTG9nZ2VyICovXG5cdGNvbnN0IExvZyA9IG1peGluKHsgbmFtZSA6ICdUcmFuc2l0aW9uTWFuYWdlcicgfSwgTG9nZ2VyICk7XG5cblx0VHJhbnNpdGlvbk1hbmFnZXIuaW5pdCA9IGZ1bmN0aW9uKCBjb25maWcgKVxuXHR7XG5cdFx0bGV0IHBhcnNlZERhdGEgPSBwYXJzZXIucGFyc2VEYXRhKGNvbmZpZy5kYXRhKTtcblxuXHRcdC8qIEZTTSBzZXR1cCAqL1xuXHRcdGZzbS5pbml0KCBtaXhpbiggcGljayggY29uZmlnLCBmc21LZXlzICksIGNvbmZpZy5mc20gKSApO1xuXHRcdGZzbS5jcmVhdGUoIHBhcnNlZERhdGEuZnNtQ29uZmlnICk7XG5cblx0XHQvKiBUcmFuc2l0aW9uIFZpZXcgTWFuYWdlciBzZXR1cCAqL1xuXHRcdGNvbmZpZy52aWV3TWFuYWdlciBcdD0gY29uZmlnLnZpZXdNYW5hZ2VyIHx8IGRlZmF1bHRWbS5pbml0KCBwaWNrKCBjb25maWcsIGluZGV4S2V5cyApICk7XG5cdFx0bGV0IHR2bUNvbmZpZyBcdFx0PSAgbWl4aW4oIHsgY29uZmlnIDogcGFyc2VkRGF0YS5UVk1Db25maWcgfSwgcGljayggY29uZmlnLCB0dm1LZXlzICksIGNvbmZpZy50dm0gKTtcblx0XHR0dm0uY3JlYXRlKCB0dm1Db25maWcgKTtcblxuXHRcdC8qIFRyYW5zaXRpb24gQ29udHJvbGxlciBzZXR1cCAqL1xuXHRcdHRjLmluaXQoIG1peGluKCBwaWNrKCBjb25maWcsIHRjS2V5cyApLCBjb25maWcudGMgKSApO1xuXG5cdFx0LyoqKiBDb25uZWN0IGVhY2ggbW9kdWxlICoqKi9cblx0XHRmc20uc3RhdGVDaGFuZ2VkTWV0aG9kICA9IHR2bS5wcm9jZXNzVmlld3M7XG5cdFx0dHZtLnZpZXdzUmVhZHkgXHRcdFx0PSB0Yy5wcm9jZXNzVHJhbnNpdGlvbjtcblx0XHR0Yy50cmFuc2l0aW9uQ29tcGxldGVkICA9IGZzbS50cmFuc2l0aW9uQ29tcGxldGU7XG5cblx0XHRMb2cuaW5pdExvZ2dlciggY29uZmlnLmRlYnVnICk7XG5cdFx0TG9nLmxvZyggJ2luaXRpYXRlZCcgKTtcblx0XHRcblx0fVx0XG5cblx0LyoqXG5cdCAqIHN0YXJ0IHRoZSB0cmFuc2l0aW9uLW1hbmFnZXJcblx0ICogdHJhbnNpdGlvbnMgdG8gdGhlIGluaXRpYWwgc3RhdGVcblx0ICovXG5cdFRyYW5zaXRpb25NYW5hZ2VyLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG5cdFx0ZnNtLnN0YXJ0KCk7XG5cdH1cblxuXHQvKipcblx0ICogXHRHZXR0ZXJzIGZvciB0aGUgVHJhbnNpdGlvbiBNYW5hZ2VyIENvbXBvbmVudHNcblx0ICogIC0gYWN0aW9uIC0gZGVjbGFyZSBhY3Rpb24gdG8gc3RhcnQgXG5cdCAqICAtIGN1cnJlbnRTdGF0ZSAtIGdldCBjdXJyZW50IHN0YXRlXG5cdCAqICAtIGNhbmNlbCAtIGNhbmNlbCBmc20gdHJhbnNpdGlvblxuXHQgKiAgLSBhZGRUcmFuc2l0aW9uIC0gYWRkIGEgdHJhbnNpdGlvbiBjb21wb25lbnRcblx0ICogIC0gcmVtb3ZlVHJhbnNpdGlvbiAtIHJlbW92ZSB0cmFuc2l0aW9uXG5cdCAqICAtIGhpc3RvcnkgLSBhY3Rpb24gaGlzdG9yeVxuXHQgKi9cblxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoIFRyYW5zaXRpb25NYW5hZ2VyLCAnYWN0aW9uJywgeyBnZXQgOiBmdW5jdGlvbigpIHsgcmV0dXJuIGZzbS5hY3Rpb247IH0gfSk7XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggVHJhbnNpdGlvbk1hbmFnZXIsICdjdXJyZW50U3RhdGUnLCB7IGdldCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gZnNtLmdldEN1cnJlbnRTdGF0ZTsgfSB9KTtcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KCBUcmFuc2l0aW9uTWFuYWdlciwgJ2NhbmNlbCcsIHsgZ2V0IDogZnVuY3Rpb24oKSB7IHJldHVybiBmc20uY2FuY2VsOyB9IH0pO1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoIFRyYW5zaXRpb25NYW5hZ2VyLCAnYWRkVHJhbnNpdGlvbicsIHsgZ2V0IDogZnVuY3Rpb24oKSB7IHJldHVybiB0Yy5hZGRNb2R1bGU7IH0gfSk7XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggVHJhbnNpdGlvbk1hbmFnZXIsICdyZW1vdmVUcmFuc2l0aW9uJywgeyBnZXQgOiBmdW5jdGlvbigpIHsgcmV0dXJuIHRjLnJlbW92ZU1vZHVsZTsgfSB9KTtcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KCBUcmFuc2l0aW9uTWFuYWdlciwgJ2dldEhpc3RvcnknLCB7IGdldCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gZnNtLmdldEhpc3Rvcnk7IH0gfSk7XG5cdFxuXHQgXG5cdCAvKipcblx0ICAqIFNpZ25hbHNcblx0ICAqIC0gZnNtIHN0YXRlIGNoYW5nZWQgXG5cdCAgKiAtIHRjIHRyYW5zaXRpb24gc3RhcnRlZFxuXHQgICogLSB0YyBhbGxUcmFuc2l0aW9uU3RhcnRlZFxuXHQgICovXG5cdCBPYmplY3QuZGVmaW5lUHJvcGVydHkoIFRyYW5zaXRpb25NYW5hZ2VyLCAnb25TdGF0ZUNoYW5nZWQnLCB7IGdldCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gZGlzcGF0Y2hlci5zdGF0ZUNoYW5nZWQ7IH0gfSk7XG5cdCBPYmplY3QuZGVmaW5lUHJvcGVydHkoIFRyYW5zaXRpb25NYW5hZ2VyLCAnb25UcmFuc2l0aW9uU3RhcnRlZCcsIHsgZ2V0IDogZnVuY3Rpb24oKSB7IHJldHVybiBkaXNwYXRjaGVyLnRyYW5zaXRpb25TdGFydGVkOyB9IH0pO1xuXHQgT2JqZWN0LmRlZmluZVByb3BlcnR5KCBUcmFuc2l0aW9uTWFuYWdlciwgJ29uQWxsVHJhbnNpdGlvblN0YXJ0ZWQnLCB7IGdldCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gZGlzcGF0Y2hlci50cmFuc2l0aW9uc1N0YXJ0ZWQ7IH0gfSk7XG5cdCBPYmplY3QuZGVmaW5lUHJvcGVydHkoIFRyYW5zaXRpb25NYW5hZ2VyLCAnb25BbGxUcmFuc2l0aW9uQ29tcGxldGVkJywgeyBnZXQgOiBmdW5jdGlvbigpIHsgcmV0dXJuIGRpc3BhdGNoZXIuYWxsVHJhbnNpdGlvbkNvbXBsZXRlZDsgfSB9KTtcblx0IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggVHJhbnNpdGlvbk1hbmFnZXIsICd0cmFuc2l0aW9uQ29tcGxldGUnLCB7IGdldCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gZGlzcGF0Y2hlci50cmFuc2l0aW9uQ29tcGxldGU7IH0gfSk7XG5cbn0pKCk7XG5cbmV4cG9ydCBkZWZhdWx0IFRyYW5zaXRpb25NYW5hZ2VyO1xubW9kdWxlLmV4cG9ydHMgPSB7ICdib29tJyA6ICd0ZXN0JyB9O1xuIiwiaW1wb3J0IGZvcmVpbiBmcm9tICcuLi91dGlscy9mb3JJbic7XG5pbXBvcnQgdW5pcXVlIGZyb20gJy4uL3V0aWxzL3VuaXF1ZSc7XG5cblxuY29uc3QgQXBwRGF0YVBhcnNlciA9IHt9O1xuXG4oZnVuY3Rpb24oKVxue1x0XG5cdC8qKlxuXHQgKiBleHRyYWN0IHRoZSBhY3R1YWwgdHJhbnNpdGlvbiBkYXRhIGZvciB0aGUgc3RhdGVcblx0ICogQHBhcmFtICB7b2JqZWN0fSBjb25maWdTdGF0ZSAtIHN0YXRlIGRhdGFcblx0ICogQHJldHVybiB7YXJyYXl9IHRyYW5zaXRpb24gYXJyYXkgLSBGU01cblx0ICovXG5cdGZ1bmN0aW9uIF9leHRyYWN0QWN0aW9ucyggb3B0cyApXG5cdHtcblx0XHQvLyBtYWluIHByb3BlcnRpZXNcblx0XHRjb25zdCBcdGRhdGEgXHRcdD0gb3B0cy5kYXRhLFxuXHRcdFx0XHRjb25maWdTdGF0ZSA9IG9wdHMuc3RhdGVEYXRhLFxuXHRcdFx0XHRzdGF0ZVZpZXcgXHQ9IG9wdHMuc3RhdGVWaWV3LFxuXHRcdFx0XHRzdGF0ZU5hbWUgIFx0PSBvcHRzLnN0YXRlTmFtZTtcblxuXHRcdC8vIG5ldyBkZWZpbmVkIHByb3BlcnRpZXNcblx0XHRsZXQgc3RhdGVUcmFuc2l0aW9ucyA9IFtdLFxuXHRcdFx0dmlld0RhdGEgXHRcdCA9IG9wdHMudmlld0RhdGEsXG5cdFx0XHRhcHBEYXRhVmlldyxcblx0XHRcdGFjdGlvbixcblx0XHRcdHN0YXRlUHJlZml4O1xuXG5cdFx0Zm9yZWluKCBjb25maWdTdGF0ZS5hY3Rpb25zLCAoIHByb3AsIGFjdGlvbk5hbWUgKSA9PiB7XG5cblx0XHRcdHN0YXRlUHJlZml4ID0gKHN0YXRlTmFtZSsgJy0+JyArYWN0aW9uTmFtZSk7XG5cdFx0XHRhcHBEYXRhVmlldyA9IGRhdGFbIHByb3AudGFyZ2V0IF0udmlldztcblxuXHRcdFx0Ly8gUmV0dXJuIGFjdGlvbiBkYXRhIGZvciBGU01cblx0XHRcdGFjdGlvbiA9IHtcblx0XHRcdFx0YWN0aW9uIFx0XHQ6IGFjdGlvbk5hbWUsXG5cdFx0XHRcdHRhcmdldCBcdFx0OiBwcm9wLnRhcmdldCxcblx0XHRcdFx0X2lkIFx0XHQ6IHN0YXRlUHJlZml4XG5cdFx0XHR9O1xuXG5cdFx0XHQvLyByZXR1cm4gVmlld0RhdGEgZm9yIFZpZXcgbWFuYWdlciBhbmQgYXBwZW5kIGFsbCB2aWV3c1xuXHRcdFx0dmlld0RhdGFbIHN0YXRlUHJlZml4IF0gPSB7XG5cdFx0XHRcdGN1cnJlbnRWaWV3IFx0XHQ6IHN0YXRlVmlldyxcblx0XHRcdFx0bmV4dFZpZXcgXHRcdFx0OiBhcHBEYXRhVmlldyxcblx0XHRcdFx0bGlua2VkVlRyYW5zTW9kdWxlcyA6IF9leHRyYWN0VHJhbnNpdGlvbnMoIHByb3AsIHN0YXRlVmlldywgYXBwRGF0YVZpZXcgKSxcblx0XHRcdFx0bmFtZSAgXHRcdFx0XHQ6IGFjdGlvbk5hbWVcblx0XHRcdH07XG5cblx0XHRcdC8vIC8vIGFzc2lnbiBmc20gYWN0aW9uIHRvIHN0YXRlXG5cdFx0XHRzdGF0ZVRyYW5zaXRpb25zWyBzdGF0ZVRyYW5zaXRpb25zLmxlbmd0aCBdID0gYWN0aW9uO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHsgc3RhdGVUcmFuc2l0aW9ucyA6IHN0YXRlVHJhbnNpdGlvbnMsIHZpZXdEYXRhIDogdmlld0RhdGEgfTtcblx0fVxuXG5cdC8qKlxuXHQgKiBleHRyYWN0IHRyYW5zaXRpb24gaW5mb3JtYXRpb25cblx0ICogYW5kIGV4dHJhY3QgZGF0YSBpZiB0cmFuc2l0aW9uIGluZm9ybWF0aW9uIGlzXG5cdCAqIGFuIGFycmF5IG9mIHRyYW5zaXRpb25zXG5cdCAqIEBwYXJhbSAge29uYmplY3R9IHByb3AgICAgIFxuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IHN0YXRlVmlldyAtIGlkIG9mIHN0YXRlIHZpZXdcblx0ICogQHBhcmFtICB7c3RyaW5nfSBuZXh0VmlldyAgLSBpZCBvZiB2aWV3IHRoaXMgdHJhbnNpdGlvbiBnb2VzIHRvXG5cdCAqIEByZXR1cm4ge2FycmF5fSBhcnJheSBvZiB0cmFuc2l0aW9ucyBmb3QgdGhpcyBhY3Rpb25cblx0ICovXG5cdGZ1bmN0aW9uIF9leHRyYWN0VHJhbnNpdGlvbnMoIHByb3AsIHN0YXRlVmlldywgbmV4dFZpZXcgKVxuXHR7XG5cdFx0dmFyIGdyb3VwZWRUcmFuc2l0aW9ucyA9IFtdO1xuXHRcdGlmKCBwcm9wLnRyYW5zaXRpb25zICkgeyAvLyBpZiBtb3JlIHRyYW5zaXRpb25zIGV4aXN0LCBhZGQgdGhlbVxuXHRcdCBcdGdyb3VwZWRUcmFuc2l0aW9ucyA9IHByb3AudHJhbnNpdGlvbnMubWFwKCAoIHRyYW5zaXRpb25PYmplY3QgKSA9PiB7IFxuXHRcdCBcdFx0cmV0dXJuIHRyYW5zaXRpb25PYmplY3Q7IFxuXHRcdCBcdH0pO1xuXHRcdH1cblx0XHRwcm9wLnZpZXdzID0gdW5pcXVlKCBwcm9wLnZpZXdzLCBbIHN0YXRlVmlldywgbmV4dFZpZXcgXSApO1xuXHRcdGdyb3VwZWRUcmFuc2l0aW9ucy51bnNoaWZ0KCB7IHRyYW5zaXRpb25UeXBlIDogcHJvcC50cmFuc2l0aW9uVHlwZSwgdmlld3MgOiBwcm9wLnZpZXdzIH0gKTtcblx0XHRyZXR1cm4gZ3JvdXBlZFRyYW5zaXRpb25zO1xuXHR9XG5cblxuXHQvKipcblx0ICogRXh0cmFjdCBvbmx5IHRoZSBGU00gZGF0YSBmcm9tIHRoZSBjb25maWcgZmlsZVxuXHQgKiBjcmVhdGUgc3RhdGVzXG5cdCAqIEBwYXJhbSAge29iamVjdH0gZGF0YSBcblx0ICogQHJldHVybiB7b2JqZWN0fSBmc20gZm9ybWF0dGVkIGNvbmZpZ1xuXHQgKi9cblx0QXBwRGF0YVBhcnNlci5wYXJzZURhdGEgPSBmdW5jdGlvbiggZGF0YSApXG5cdHtcblx0XHRpZiggIWRhdGEgKXsgdGhyb3cgbmV3IEVycm9yKCcqRGF0YSBPYmplY3QgaXMgdW5kZWZpbmVkIScpOyB9XG5cblx0XHRsZXQgY29uZmlnIFx0XHQ9IFtdLFxuXHRcdFx0dmlld0RhdGFcdD0ge30sXG5cdFx0XHRleHRyYWN0ZWQsXG5cdFx0XHRzdGF0ZTtcblxuXHRcdGZvcmVpbiggZGF0YSwgKCBzdGF0ZURhdGEsIHN0YXRlTmFtZSApID0+XG5cdFx0e1xuXHRcdFx0ZXh0cmFjdGVkID0gX2V4dHJhY3RBY3Rpb25zKHtcblx0XHRcdFx0ZGF0YSBcdFx0XHQ6IGRhdGEsIFxuXHRcdFx0XHRzdGF0ZURhdGEgXHRcdDogc3RhdGVEYXRhLCBcblx0XHRcdFx0dmlld0RhdGEgXHRcdDogdmlld0RhdGEsIFxuXHRcdFx0XHRzdGF0ZVZpZXcgXHRcdDogc3RhdGVEYXRhLnZpZXcsXG5cdFx0XHRcdHN0YXRlTmFtZSBcdFx0OiBzdGF0ZU5hbWVcblx0XHRcdH0pO1xuXG5cdFx0XHRzdGF0ZSA9IHtcblx0XHRcdFx0bmFtZSBcdFx0XHRcdDogc3RhdGVOYW1lLFxuXHRcdFx0XHRpbml0aWFsIFx0XHRcdDogc3RhdGVEYXRhLmluaXRpYWwsXG5cdFx0XHRcdHN0YXRlVHJhbnNpdGlvbnMgXHQ6IGV4dHJhY3RlZC5zdGF0ZVRyYW5zaXRpb25zXG5cdFx0XHR9O1xuXG5cdFx0XHRjb25maWdbIGNvbmZpZy5sZW5ndGggXSA9IHN0YXRlO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHsgZnNtQ29uZmlnIDogY29uZmlnLCBUVk1Db25maWcgOiBleHRyYWN0ZWQudmlld0RhdGEgfTtcblx0fTtcblxufSkoKTtcblxuZXhwb3J0IGRlZmF1bHQgQXBwRGF0YVBhcnNlcjtcblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5cbi8qKlxuICogcmVwbGFjZSB0YXJnZXQgb2JqZWN0IHByb3BlcnRpZXMgd2l0aCB0aGUgb3ZlcndyaXRlXG4gKiBvYmplY3QgcHJvcGVydGllcyBpZiB0aGV5IGhhdmUgYmVlbiBzZXRcbiAqIEBwYXJhbSAge29iamVjdH0gdGFyZ2V0ICAgIC0gb2JqZWN0IHRvIG92ZXJ3cml0ZVxuICogQHBhcmFtICB7b2JqZWN0fSBvdmVyd3JpdGUgLSBvYmplY3Qgd2l0aCBuZXcgcHJvcGVyaWVzIGFuZCB2YWx1ZXNcbiAqIEByZXR1cm4ge29iamVjdH0gXG4gKi9cbmZ1bmN0aW9uIGRlZmF1bHRQcm9wcyggdGFyZ2V0LCBvdmVyd3JpdGUgKSBcbntcblx0b3ZlcndyaXRlID0gb3ZlcndyaXRlIHx8IHt9O1xuXHRmb3IoIHZhciBwcm9wIGluIG92ZXJ3cml0ZSApIHtcblx0XHRpZiggdGFyZ2V0Lmhhc093blByb3BlcnR5KHByb3ApICYmIF9pc1ZhbGlkKCBvdmVyd3JpdGVbIHByb3AgXSApICkge1xuXHRcdFx0dGFyZ2V0WyBwcm9wIF0gPSBvdmVyd3JpdGVbIHByb3AgXTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHRhcmdldDtcbn1cblxuLyoqXG4gKiBjaGVjayB0byBzZWUgaWYgYSBwcm9wZXJ0eSBpcyB2YWxpZFxuICogbm90IG51bGwgb3IgdW5kZWZpbmVkXG4gKiBAcGFyYW0gIHtvYmplY3R9ICBwcm9wIFxuICogQHJldHVybiB7Qm9vbGVhbn0gXG4gKi9cbmZ1bmN0aW9uIF9pc1ZhbGlkKCBwcm9wICkge1xuXHRyZXR1cm4gKCBwcm9wICE9PSB1bmRlZmluZWQgJiYgcHJvcCAhPT0gbnVsbCApO1xufVxuXG5cblxuZXhwb3J0IGRlZmF1bHQgZGVmYXVsdFByb3BzOyIsIiAvKmpzaGludCAtVzA4NCAqL1xuIC8qanNoaW50IHVudXNlZDpmYWxzZSovXG5cbiB2YXIgX2hhc0RvbnRFbnVtQnVnLFxuICAgICAgICBfZG9udEVudW1zO1xuXG4gICAgZnVuY3Rpb24gY2hlY2tEb250RW51bSgpIHtcbiAgICAgICAgX2RvbnRFbnVtcyA9IFtcbiAgICAgICAgICAgICAgICAndG9TdHJpbmcnLFxuICAgICAgICAgICAgICAgICd0b0xvY2FsZVN0cmluZycsXG4gICAgICAgICAgICAgICAgJ3ZhbHVlT2YnLFxuICAgICAgICAgICAgICAgICdoYXNPd25Qcm9wZXJ0eScsXG4gICAgICAgICAgICAgICAgJ2lzUHJvdG90eXBlT2YnLFxuICAgICAgICAgICAgICAgICdwcm9wZXJ0eUlzRW51bWVyYWJsZScsXG4gICAgICAgICAgICAgICAgJ2NvbnN0cnVjdG9yJ1xuICAgICAgICAgICAgXTtcblxuICAgICAgICBfaGFzRG9udEVudW1CdWcgPSB0cnVlO1xuXG4gICAgICAgIGZvciAodmFyIGtleSBpbiB7J3RvU3RyaW5nJzogbnVsbH0pIHtcbiAgICAgICAgICAgIF9oYXNEb250RW51bUJ1ZyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2ltaWxhciB0byBBcnJheS9mb3JFYWNoIGJ1dCB3b3JrcyBvdmVyIG9iamVjdCBwcm9wZXJ0aWVzIGFuZCBmaXhlcyBEb24ndFxuICAgICAqIEVudW0gYnVnIG9uIElFLlxuICAgICAqIGJhc2VkIG9uOiBodHRwOi8vd2hhdHRoZWhlYWRzYWlkLmNvbS8yMDEwLzEwL2Etc2FmZXItb2JqZWN0LWtleXMtY29tcGF0aWJpbGl0eS1pbXBsZW1lbnRhdGlvblxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGZvckluKG9iaiwgZm4sIHRoaXNPYmope1xuICAgICAgICB2YXIga2V5LCBpID0gMDtcbiAgICAgICAgLy8gbm8gbmVlZCB0byBjaGVjayBpZiBhcmd1bWVudCBpcyBhIHJlYWwgb2JqZWN0IHRoYXQgd2F5IHdlIGNhbiB1c2VcbiAgICAgICAgLy8gaXQgZm9yIGFycmF5cywgZnVuY3Rpb25zLCBkYXRlLCBldGMuXG5cbiAgICAgICAgLy9wb3N0LXBvbmUgY2hlY2sgdGlsbCBuZWVkZWRcbiAgICAgICAgaWYgKF9oYXNEb250RW51bUJ1ZyA9PSBudWxsKSB7IGNoZWNrRG9udEVudW0oKTsgfVxuXG4gICAgICAgIGZvciAoa2V5IGluIG9iaikge1xuICAgICAgICAgICAgaWYgKGV4ZWMoZm4sIG9iaiwga2V5LCB0aGlzT2JqKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChfaGFzRG9udEVudW1CdWcpIHtcbiAgICAgICAgICAgIHdoaWxlIChrZXkgPSBfZG9udEVudW1zW2krK10pIHtcbiAgICAgICAgICAgICAgICAvLyBzaW5jZSB3ZSBhcmVuJ3QgdXNpbmcgaGFzT3duIGNoZWNrIHdlIG5lZWQgdG8gbWFrZSBzdXJlIHRoZVxuICAgICAgICAgICAgICAgIC8vIHByb3BlcnR5IHdhcyBvdmVyd3JpdHRlblxuICAgICAgICAgICAgICAgIGlmIChvYmpba2V5XSAhPT0gT2JqZWN0LnByb3RvdHlwZVtrZXldKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChleGVjKGZuLCBvYmosIGtleSwgdGhpc09iaikgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGV4ZWMoZm4sIG9iaiwga2V5LCB0aGlzT2JqKXtcbiAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpc09iaiwgb2JqW2tleV0sIGtleSwgb2JqKTtcbiAgICB9XG5cbmV4cG9ydCBkZWZhdWx0IGZvckluO1xuXG5cbiIsImltcG9ydCBoYXNPd24gZnJvbSAnLi9oYXNPd24nO1xuaW1wb3J0IGZvckluIGZyb20gJy4vZm9ySW4nO1xuXG4gICAgLyoqXG4gICAgICogU2ltaWxhciB0byBBcnJheS9mb3JFYWNoIGJ1dCB3b3JrcyBvdmVyIG9iamVjdCBwcm9wZXJ0aWVzIGFuZCBmaXhlcyBEb24ndFxuICAgICAqIEVudW0gYnVnIG9uIElFLlxuICAgICAqIGJhc2VkIG9uOiBodHRwOi8vd2hhdHRoZWhlYWRzYWlkLmNvbS8yMDEwLzEwL2Etc2FmZXItb2JqZWN0LWtleXMtY29tcGF0aWJpbGl0eS1pbXBsZW1lbnRhdGlvblxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGZvck93bihvYmosIGZuLCB0aGlzT2JqKXtcbiAgICAgICAgZm9ySW4ob2JqLCBmdW5jdGlvbih2YWwsIGtleSl7XG4gICAgICAgICAgICBpZiAoaGFzT3duKG9iaiwga2V5KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbi5jYWxsKHRoaXNPYmosIG9ialtrZXldLCBrZXksIG9iaik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuZXhwb3J0IGRlZmF1bHQgZm9yT3duO1xuIiwiXG5cbiAgICAvKipcbiAgICAgKiBTYWZlciBPYmplY3QuaGFzT3duUHJvcGVydHlcbiAgICAgKi9cbiAgICAgZnVuY3Rpb24gaGFzT3duKG9iaiwgcHJvcCl7XG4gICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG4gICAgIH1cblxuICAgIGV4cG9ydCBkZWZhdWx0IGhhc093bjtcblxuXG4iLCIgLypqc2hpbnQgdW51c2VkOmZhbHNlKi9cbmltcG9ydCBmb3JPd24gZnJvbSAnLi9mb3JPd24nO1xuXG5cbmZ1bmN0aW9uIG1peGluKCB0YXJnZXQsIG9iamVjdHMgKSB7XG5cdHZhciBpID0gMCxcbiAgICBuID0gYXJndW1lbnRzLmxlbmd0aCxcbiAgICBvYmo7XG4gICAgd2hpbGUoKytpIDwgbil7XG4gICAgICAgIG9iaiA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgaWYgKG9iaiAhPSBudWxsKSB7XG4gICAgICAgICAgICBmb3JPd24ob2JqLCBjb3B5UHJvcCwgdGFyZ2V0KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGFyZ2V0O1xufVxuXG5mdW5jdGlvbiBjb3B5UHJvcCh2YWwsIGtleSl7XG4gICAgdGhpc1trZXldID0gdmFsO1xufVxuXG5leHBvcnQgZGVmYXVsdCBtaXhpbjsiLCIgLypqc2hpbnQgLVcwODQgKi9cbiAgLypqc2hpbnQgdW51c2VkOmZhbHNlKi9cbiAgXG52YXIgc2xpY2UgPSByZXF1aXJlKCcuL3NsaWNlJyk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gYSBjb3B5IG9mIHRoZSBvYmplY3QsIGZpbHRlcmVkIHRvIG9ubHkgaGF2ZSB2YWx1ZXMgZm9yIHRoZSB3aGl0ZWxpc3RlZCBrZXlzLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHBpY2sob2JqLCB2YXJfa2V5cyl7XG4gICAgICAgIHZhciBrZXlzID0gdHlwZW9mIGFyZ3VtZW50c1sxXSAhPT0gJ3N0cmluZyc/IGFyZ3VtZW50c1sxXSA6IHNsaWNlKGFyZ3VtZW50cywgMSksXG4gICAgICAgICAgICBvdXQgPSB7fSxcbiAgICAgICAgICAgIGkgPSAwLCBrZXk7XG4gICAgICAgIHdoaWxlIChrZXkgPSBrZXlzW2krK10pIHtcbiAgICAgICAgICAgIG91dFtrZXldID0gb2JqW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9XG5cbmV4cG9ydCBkZWZhdWx0IHBpY2s7IiwiICAgIC8qKlxuICAgICAqIENyZWF0ZSBzbGljZSBvZiBzb3VyY2UgYXJyYXkgb3IgYXJyYXktbGlrZSBvYmplY3RcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBzbGljZShhcnIsIHN0YXJ0LCBlbmQpe1xuICAgICAgICB2YXIgbGVuID0gYXJyLmxlbmd0aDtcblxuICAgICAgICBpZiAoc3RhcnQgPT0gbnVsbCkge1xuICAgICAgICAgICAgc3RhcnQgPSAwO1xuICAgICAgICB9IGVsc2UgaWYgKHN0YXJ0IDwgMCkge1xuICAgICAgICAgICAgc3RhcnQgPSBNYXRoLm1heChsZW4gKyBzdGFydCwgMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdGFydCA9IE1hdGgubWluKHN0YXJ0LCBsZW4pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVuZCA9PSBudWxsKSB7XG4gICAgICAgICAgICBlbmQgPSBsZW47XG4gICAgICAgIH0gZWxzZSBpZiAoZW5kIDwgMCkge1xuICAgICAgICAgICAgZW5kID0gTWF0aC5tYXgobGVuICsgZW5kLCAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVuZCA9IE1hdGgubWluKGVuZCwgbGVuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgd2hpbGUgKHN0YXJ0IDwgZW5kKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaChhcnJbc3RhcnQrK10pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbmV4cG9ydCBkZWZhdWx0IHNsaWNlOyIsIid1c2Ugc3RyaWN0JztcblxuXG4vKipcbiAqIGpvaW4gdHdvIGFycmF5cyBhbmQgcHJldmVudCBkdXBsaWNhdGlvblxuICogQHBhcmFtICB7YXJyYXl9IHRhcmdldCBcbiAqIEBwYXJhbSAge2FycmF5fSBhcnJheXMgXG4gKiBAcmV0dXJuIHthcnJheX0gXG4gKi9cbmZ1bmN0aW9uIHVuaXF1ZSggdGFyZ2V0LCBhcnJheXMgKVxue1xuXHR0YXJnZXQgPSB0YXJnZXQgfHwgW107XG5cdHZhciBjb21iaW5lZCA9IHRhcmdldC5jb25jYXQoIGFycmF5cyApO1xuXHRcdHRhcmdldCBcdCA9IFtdO1xuXG5cdHZhciBsZW4gPSBjb21iaW5lZC5sZW5ndGgsXG5cdFx0aSA9IC0xLFxuXHRcdE9ialJlZjtcblxuXHRcdHdoaWxlKCsraSA8IGxlbikge1xuXHRcdFx0T2JqUmVmID0gY29tYmluZWRbIGkgXTtcblx0XHRcdGlmKCB0YXJnZXQuaW5kZXhPZiggT2JqUmVmICkgPT09IC0xICYmIE9ialJlZiAhPT0gJycgJiBPYmpSZWYgIT09ICAobnVsbCB8fCB1bmRlZmluZWQpICkge1xuXHRcdFx0XHR0YXJnZXRbIHRhcmdldC5sZW5ndGggXSA9IE9ialJlZjtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIHRhcmdldDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgdW5pcXVlOyJdfQ==
