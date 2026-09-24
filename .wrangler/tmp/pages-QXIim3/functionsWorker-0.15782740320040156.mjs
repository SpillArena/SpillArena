var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
if (!("__unenv__" in performance)) {
  const proto = Performance.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && !(key in performance)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        Object.defineProperty(performance, key, desc);
      }
    }
  }
}
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// ../src/account/username-policy.ts
var SEVERE_TERMS = [
  "apekatt",
  "beastiality",
  "bestiality",
  "chink",
  "coon",
  "dyke",
  "faggitt",
  "faggot",
  "fagot",
  "gook",
  "heil",
  "hitler",
  "jodesvin",
  "kike",
  "kkk",
  "n1gger",
  "nazi",
  "neger",
  "negger",
  "nigg3r",
  "nigga",
  "niggah",
  "niggas",
  "niggaz",
  "nigger",
  "paki",
  "pedo",
  "pedophile",
  "rapist",
  "retard",
  "shemale",
  "spic",
  "tranny"
];
var PROFANITY_TERMS = [
  "4r5e",
  "5h1t",
  "5hit",
  "a55",
  "a_s_s",
  "anal",
  "anus",
  "ar5e",
  "arrse",
  "arse",
  "ass",
  "ass-fucker",
  "asses",
  "assfucker",
  "assfukka",
  "asshole",
  "assholes",
  "asswhole",
  "b!tch",
  "b00bs",
  "b17ch",
  "b1tch",
  "ballbag",
  "balls",
  "ballsack",
  "bastard",
  "beastial",
  "bellend",
  "bestial",
  "bi+ch",
  "biatch",
  "bitch",
  "bitcher",
  "bitchers",
  "bitches",
  "bitchin",
  "bitching",
  "bloody",
  "blow job",
  "blowjob",
  "blowjobs",
  "boiolas",
  "bollock",
  "bollok",
  "boner",
  "boob",
  "boobs",
  "booobs",
  "boooobs",
  "booooobs",
  "booooooobs",
  "breasts",
  "buceta",
  "bugger",
  "bum",
  "bunny fucker",
  "butt",
  "butthole",
  "buttmuch",
  "buttplug",
  "b\xF8tteknott",
  "c0ck",
  "c0cksucker",
  "carpet muncher",
  "cawk",
  "cipa",
  "cl1t",
  "clit",
  "clitoris",
  "clits",
  "cnut",
  "cock",
  "cock-sucker",
  "cockface",
  "cockhead",
  "cockmunch",
  "cockmuncher",
  "cocks",
  "cocksuck",
  "cocksucked",
  "cocksucker",
  "cocksucking",
  "cocksucks",
  "cocksuka",
  "cocksukka",
  "cok",
  "cokmuncher",
  "coksucka",
  "cottonp",
  "cox",
  "crap",
  "cum",
  "cummer",
  "cumming",
  "cums",
  "cumshot",
  "cunilingus",
  "cunillingus",
  "cunnilingus",
  "cunt",
  "cuntlick",
  "cuntlicker",
  "cuntlicking",
  "cunts",
  "cyalis",
  "cyberfuc",
  "cyberfuck",
  "cyberfucked",
  "cyberfucker",
  "cyberfuckers",
  "cyberfucking",
  "d1ck",
  "damn",
  "dick",
  "dickhead",
  "dildo",
  "dildos",
  "dink",
  "dinks",
  "dirsa",
  "dj\xE6vel",
  "dlck",
  "dog-fucker",
  "doggin",
  "dogging",
  "donkeyribber",
  "doosh",
  "duche",
  "ejaculate",
  "ejaculated",
  "ejaculates",
  "ejaculating",
  "ejaculatings",
  "ejaculation",
  "ejakulate",
  "f u c k",
  "f u c k e r",
  "f4nny",
  "f_u_c_k",
  "faen",
  "fag",
  "fagging",
  "faggs",
  "fagots",
  "fags",
  "fanden",
  "fanny",
  "fannyflaps",
  "fannyfucker",
  "fanyy",
  "fatass",
  "fcuk",
  "fcuker",
  "fcuking",
  "feck",
  "fecker",
  "felching",
  "fellate",
  "fellatio",
  "fingerfuck",
  "fingerfucked",
  "fingerfucker",
  "fingerfuckers",
  "fingerfucking",
  "fingerfucks",
  "fistfuck",
  "fistfucked",
  "fistfucker",
  "fistfuckers",
  "fistfucking",
  "fistfuckings",
  "fistfucks",
  "flange",
  "fook",
  "fooker",
  "forbanna",
  "forpulte",
  "fuck",
  "fucka",
  "fucked",
  "fucker",
  "fuckers",
  "fuckhead",
  "fuckheads",
  "fuckin",
  "fucking",
  "fuckings",
  "fuckingshitmotherfucker",
  "fuckme",
  "fucks",
  "fuckwhit",
  "fuckwit",
  "fudge packer",
  "fudgepacker",
  "fuk",
  "fuker",
  "fukker",
  "fukkin",
  "fuks",
  "fukwhit",
  "fukwit",
  "fux",
  "fux0r",
  "gangbang",
  "gangbanged",
  "gangbangs",
  "gaylord",
  "gaysex",
  "goatse",
  "god",
  "god-dam",
  "god-damned",
  "goddamn",
  "goddamned",
  "hardcoresex",
  "hell",
  "helvete",
  "heshe",
  "hoar",
  "hoare",
  "hoer",
  "homo",
  "hore",
  "horniest",
  "horny",
  "hotsex",
  "invalid",
  "jack-off",
  "jackoff",
  "jap",
  "jerk-off",
  "jism",
  "jiz",
  "jizm",
  "jizz",
  "j\xE6vel",
  "j\xE6vla",
  "kawk",
  "kjerring",
  "knob",
  "knobead",
  "knobed",
  "knobend",
  "knobhead",
  "knobjocky",
  "knobjokey",
  "kock",
  "kondum",
  "kondums",
  "kr\xF8pling",
  "kum",
  "kummer",
  "kumming",
  "kums",
  "kunilingus",
  "l3i+ch",
  "l3itch",
  "labia",
  "lesbe",
  "lmfao",
  "lust",
  "lusting",
  "m0f0",
  "m0fo",
  "m45terbate",
  "ma5terb8",
  "ma5terbate",
  "masochist",
  "master-bate",
  "masterb8",
  "masterbat*",
  "masterbat3",
  "masterbate",
  "masterbation",
  "masterbations",
  "masturbate",
  "mo-fo",
  "mof0",
  "mofo",
  "mongol",
  "mothafuck",
  "mothafucka",
  "mothafuckas",
  "mothafuckaz",
  "mothafucked",
  "mothafucker",
  "mothafuckers",
  "mothafuckin",
  "mothafucking",
  "mothafuckings",
  "mothafucks",
  "mother fucker",
  "motherfuck",
  "motherfucked",
  "motherfucker",
  "motherfuckers",
  "motherfuckin",
  "motherfucking",
  "motherfuckings",
  "motherfuckka",
  "motherfucks",
  "muff",
  "mutha",
  "muthafecker",
  "muthafuckker",
  "muther",
  "mutherfucker",
  "n1gga",
  "ni6",
  "nigg4h",
  "niggers",
  "nob",
  "nob jokey",
  "nobhead",
  "nobjocky",
  "nobjokey",
  "numbnuts",
  "nutsack",
  "orgasim",
  "orgasims",
  "orgasm",
  "orgasms",
  "p0rn",
  "pakkis",
  "pawn",
  "pecker",
  "penis",
  "penisfucker",
  "phonesex",
  "phuck",
  "phuk",
  "phuked",
  "phuking",
  "phukked",
  "phukking",
  "phuks",
  "phuq",
  "pigfucker",
  "pimpis",
  "piss",
  "pissed",
  "pisser",
  "pissers",
  "pisses",
  "pissflaps",
  "pissin",
  "pissing",
  "pissoff",
  "poop",
  "porn",
  "porno",
  "pornography",
  "pornos",
  "prick",
  "pricks",
  "pron",
  "pube",
  "pusse",
  "pussi",
  "pussies",
  "pussy",
  "pussys",
  "rectum",
  "rimjaw",
  "rimming",
  "s hit",
  "s.o.b.",
  "s_h_i_t",
  "sadist",
  "schlong",
  "screwing",
  "scroat",
  "scrote",
  "scrotum",
  "semen",
  "sex",
  "sh!+",
  "sh!t",
  "sh1t",
  "shag",
  "shagger",
  "shaggin",
  "shagging",
  "shi+",
  "shit",
  "shitdick",
  "shite",
  "shited",
  "shitey",
  "shitfuck",
  "shitfull",
  "shithead",
  "shiting",
  "shitings",
  "shits",
  "shitted",
  "shitter",
  "shitters",
  "shitting",
  "shittings",
  "shitty",
  "skank",
  "slut",
  "sluts",
  "smegma",
  "smut",
  "snatch",
  "son-of-a-bitch",
  "soper",
  "spac",
  "spunk",
  "t1tt1e5",
  "t1tties",
  "teets",
  "teez",
  "testical",
  "testicle",
  "tit",
  "titfuck",
  "tits",
  "titt",
  "tittie5",
  "tittiefucker",
  "titties",
  "tittyfuck",
  "tittywank",
  "titwank",
  "tosser",
  "turd",
  "tw4t",
  "twat",
  "twathead",
  "twatty",
  "twunt",
  "twunter",
  "v14gra",
  "v1gra",
  "vagina",
  "viagra",
  "vulva",
  "w00se",
  "wang",
  "wank",
  "wanker",
  "wanky",
  "whoar",
  "whore",
  "willies",
  "willy",
  "xrated",
  "xxx",
  "\xE5ndssvak"
];
var NORWEGIAN_TERMS = [
  "dritt",
  "drittfitte",
  "drittsekk",
  "drittunge",
  "faen",
  "faens",
  "fanden",
  "fitta",
  "fitte",
  "fitter",
  "fittetryne",
  "helvete",
  "helvetes",
  "homse",
  "hore",
  "horer",
  "horunge",
  "idiot",
  "idioter",
  "jaevel",
  "jaevla",
  "j\xE6vel",
  "j\xE6vla",
  "j\xE6vlig",
  "knulle",
  "knuller",
  "kodd",
  "kodde",
  "kuk",
  "kuken",
  "kukk",
  "kuksuger",
  "k\xF8dd",
  "k\xF8dde",
  "lespe",
  "ludder",
  "megge",
  "mongis",
  "mongo",
  "morrapuler",
  "pikk",
  "pikken",
  "pokker",
  "pule",
  "puler",
  "pupper",
  "rasshol",
  "rassh\xF8l",
  "reva",
  "ronke",
  "runke",
  "runker",
  "r\xE6va",
  "r\xE6vh\xF8l",
  "r\xF8nke",
  "satan",
  "satans",
  "soper",
  "sopere",
  "spasser",
  "tispe",
  "tulling"
];
var RESERVED_NAMES = [
  "admin",
  "administrator",
  "administrators",
  "admins",
  "all",
  "anonym",
  "anonymous",
  "arena",
  "atlasmaster",
  "billing",
  "bot",
  "channel",
  "deleted",
  "everyone",
  "fleetbot",
  "gjest",
  "guest",
  "hangbot",
  "helpdesk",
  "here",
  "host",
  "me",
  "mod",
  "moderator",
  "moderators",
  "mods",
  "nan",
  "nil",
  "no-reply",
  "none",
  "noreply",
  "null",
  "official",
  "owner",
  "payment",
  "pixel-panic",
  "pixelpanic",
  "proportion-panic",
  "proportionpanic",
  "root",
  "scribblebot",
  "security",
  "server",
  "spill-arena",
  "spillarena",
  "spillarena-no",
  "staff",
  "superuser",
  "support",
  "sysadmin",
  "system",
  "systemet",
  "test",
  "testuser",
  "undefined",
  "unknown",
  "void",
  "webmaster",
  "you"
];
var LEET = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "6": "g",
  "7": "t",
  "8": "b",
  "9": "g",
  "@": "a",
  "$": "s",
  "!": "i",
  "|": "i"
};
function fold(value) {
  return value.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").split("").map((char) => LEET[char] ?? char).join("").replace(/[^a-z0-9]/g, "");
}
__name(fold, "fold");
function words(value) {
  return value.replace(/([a-zæøå])([A-ZÆØÅ])/g, "$1 $2").split(/[^\p{L}\p{N}]+/u).map(fold).filter(Boolean);
}
__name(words, "words");
var PADDING = /^[xz]+|[xz]+$/g;
var SEVERE = new Set(SEVERE_TERMS.map(fold));
var BANNED_WORDS = new Set([...PROFANITY_TERMS, ...NORWEGIAN_TERMS].map(fold));
var RESERVED = new Set(RESERVED_NAMES.map(fold));
function checkName(username) {
  const folded = fold(username);
  if (!folded) return null;
  for (const term of SEVERE) {
    if (term.length > 2 && folded.includes(term)) return "severe";
  }
  for (const word of words(username)) {
    if (BANNED_WORDS.has(word)) return "profanity";
    const unpadded = word.replace(PADDING, "");
    if (unpadded.length > 2 && BANNED_WORDS.has(unpadded)) return "profanity";
  }
  if (RESERVED.has(folded)) return "reserved";
  return null;
}
__name(checkName, "checkName");

// ../shared/account-server.js
var TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1e3;
var PBKDF2_ROUNDS = 25e3;
var PIN_MIN = 4;
var PIN_MAX = 6;
var PIN_RE = new RegExp(`^\\d{${PIN_MIN},${PIN_MAX}}$`);
var USERNAME_MAX = 20;
function validateUsername(username) {
  if (typeof username !== "string") return "bad_username";
  const trimmed = username.trim();
  if (!trimmed) return "username_empty";
  if (trimmed.length > USERNAME_MAX) return "username_too_long";
  if (!/^[\p{L}\p{N} ._'-]+$/u.test(trimmed)) return "username_chars";
  const rejected = checkName(trimmed);
  if (rejected) return rejected === "reserved" ? "name_reserved" : "name_not_allowed";
  return null;
}
__name(validateUsername, "validateUsername");
var json = /* @__PURE__ */ __name((data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
}), "json");
var encoder = new TextEncoder();
var toBase64Url = /* @__PURE__ */ __name((bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""), "toBase64Url");
var fromBase64Url = /* @__PURE__ */ __name((text) => {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - padded.length % 4) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}, "fromBase64Url");
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
__name(timingSafeEqual, "timingSafeEqual");
async function hashPin(pin, saltB64) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(pin), "PBKDF2", false, [
    "deriveBits"
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: fromBase64Url(saltB64), iterations: PBKDF2_ROUNDS },
    key,
    256
  );
  return toBase64Url(bits);
}
__name(hashPin, "hashPin");
async function hmac(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return toBase64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}
__name(hmac, "hmac");
async function issueToken(secret, username, now = Date.now()) {
  const payload = toBase64Url(encoder.encode(JSON.stringify({ u: username, e: now + TOKEN_TTL_MS })));
  return `${payload}.${await hmac(secret, payload)}`;
}
__name(issueToken, "issueToken");
async function verifyToken(secret, token, now = Date.now()) {
  if (!secret || typeof token !== "string") return null;
  const dot = token.indexOf(".");
  if (dot < 1) return null;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!timingSafeEqual(signature, await hmac(secret, payload))) return null;
  try {
    const { u, e } = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    if (typeof u !== "string" || typeof e !== "number" || e < now) return null;
    return u;
  } catch {
    return null;
  }
}
__name(verifyToken, "verifyToken");
function bearer(request) {
  const header = request.headers.get("Authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}
__name(bearer, "bearer");
async function requireUser(env2, request) {
  if (!env2.AUTH_SECRET) return { response: json({ error: "not_configured" }, 503) };
  const username = await verifyToken(env2.AUTH_SECRET, bearer(request));
  if (!username) return { response: json({ error: "unauthorized" }, 401) };
  let row;
  try {
    row = await env2.DB.prepare(`SELECT * FROM players WHERE username = ?`).bind(username).first();
  } catch (error3) {
    return { response: json({ error: "service_failed", details: String(error3) }, 500) };
  }
  if (!row) return { response: json({ error: "unauthorized" }, 401) };
  if (row.banned_at) return { response: json({ error: "banned" }, 401) };
  return { username: row.username, admin: row.admin === 1 };
}
__name(requireUser, "requireUser");

// ../shared/admin-server.js
async function requireAdmin(env2, request) {
  const auth = await requireUser(env2, request);
  if (auth.response) return auth;
  if (!auth.admin) return { response: json({ error: "forbidden" }, 403) };
  return auth;
}
__name(requireAdmin, "requireAdmin");
function logStatement(env2, admin, action, target, details = null) {
  return env2.DB.prepare(
    `INSERT INTO admin_log (at, admin, action, target, details) VALUES (?, ?, ?, ?, ?)`
  ).bind((/* @__PURE__ */ new Date()).toISOString(), admin, action, target, details ? JSON.stringify(details) : null);
}
__name(logStatement, "logStatement");
function readLog(rows) {
  return (rows ?? []).map((row) => {
    let details = null;
    try {
      details = row.details ? JSON.parse(row.details) : null;
    } catch {
    }
    return { ...row, details };
  });
}
__name(readLog, "readLog");
function targetOf(request) {
  const value = new URL(request.url).searchParams.get("u");
  return value && value.trim() ? value.trim() : null;
}
__name(targetOf, "targetOf");
var BOARDS = [
  {
    game: "atlasmaster",
    table: "atlasmaster_leaderboard",
    match: "username = ?1 COLLATE NOCASE",
    score: "score",
    at: "timestamp"
  },
  {
    game: "scribblebot",
    table: "scribblebot_leaderboard",
    match: "username = ?1 COLLATE NOCASE",
    score: "score",
    at: "created_at"
  },
  {
    game: "hangbot",
    table: "hangbot_leaderboard",
    match: "username = ?1 COLLATE NOCASE",
    score: "score",
    at: "timestamp"
  },
  {
    game: "proportionpanic",
    table: "proportionpanic_daily_scores",
    match: `client_id = ('account:' || ?1) COLLATE NOCASE`,
    score: "total_score",
    at: "created_at"
  },
  {
    game: "pixelpanic",
    table: "pixelpanic_daily_scores",
    match: `client_id = ('account:' || ?1) COLLATE NOCASE`,
    score: "total_score",
    at: "created_at"
  }
];
async function existingBoards(env2) {
  const { results } = await env2.DB.prepare(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${BOARDS.map(() => "?").join(", ")})`
  ).bind(...BOARDS.map((board) => board.table)).all();
  const present = new Set((results ?? []).map((row) => row.name));
  return BOARDS.filter((board) => present.has(board.table));
}
__name(existingBoards, "existingBoards");
async function boardSummary(env2, username) {
  const boards = await existingBoards(env2);
  return Promise.all(
    boards.map(async (board) => {
      const row = await env2.DB.prepare(
        `SELECT COUNT(*) AS entries, MAX(${board.score}) AS best, MAX(${board.at}) AS lastAt
         FROM ${board.table} WHERE ${board.match}`
      ).bind(username).first();
      return {
        game: board.game,
        entries: row?.entries ?? 0,
        best: row?.best ?? null,
        lastAt: row?.lastAt ?? null
      };
    })
  );
}
__name(boardSummary, "boardSummary");
function clearBoardStatements(env2, boards, username) {
  return boards.map(
    (board) => env2.DB.prepare(`DELETE FROM ${board.table} WHERE ${board.match}`).bind(username)
  );
}
__name(clearBoardStatements, "clearBoardStatements");

// api/admin/player.js
var MAX_REASON = 200;
var LOG_LIMIT = 30;
var NOT_ON_SELF = /* @__PURE__ */ new Set(["ban", "rename", "reset-pin"]);
var NOT_ON_ADMIN = /* @__PURE__ */ new Set(["ban", "rename", "reset-pin"]);
async function loadTarget(env2, request) {
  const name = targetOf(request);
  if (!name) return { response: json({ error: "bad_target" }, 400) };
  const account = await env2.DB.prepare(
    `SELECT username, admin, created_at AS createdAt, last_seen AS lastSeen, failed,
            locked_until AS lockedUntil,
            COALESCE(locked_until > strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), 0) AS locked,
            banned_at AS bannedAt, ban_reason AS banReason, banned_by AS bannedBy
     FROM players WHERE username = ?`
  ).bind(name).first();
  if (!account) return { response: json({ error: "not_found" }, 404) };
  return { account: { ...account, admin: account.admin === 1, locked: Boolean(account.locked) } };
}
__name(loadTarget, "loadTarget");
var isSelf = /* @__PURE__ */ __name((auth, account) => auth.username.toLowerCase() === account.username.toLowerCase(), "isSelf");
async function onRequestGet(context2) {
  const { env: env2, request } = context2;
  const auth = await requireAdmin(env2, request);
  if (auth.response) return auth.response;
  try {
    const target = await loadTarget(env2, request);
    if (target.response) return target.response;
    const { account } = target;
    const [progress, boards, log3] = await Promise.all([
      env2.DB.prepare(
        `SELECT game, data, updated_at AS updatedAt FROM player_progress WHERE username = ?`
      ).bind(account.username).all(),
      boardSummary(env2, account.username),
      // loggen er nøklet på navn, og et navn kan ha tilhørt en slettet konto
      // før denne — det som skjedde før kontoen ble laget, handler ikke om den
      env2.DB.prepare(
        `SELECT id, at, admin, action, target, details FROM admin_log
         WHERE target = ? COLLATE NOCASE AND at >= ? ORDER BY id DESC LIMIT ?`
      ).bind(account.username, account.createdAt, LOG_LIMIT).all()
    ]);
    const games = {};
    for (const row of progress.results ?? []) {
      let parsed = null;
      try {
        parsed = JSON.parse(row.data);
      } catch {
      }
      games[row.game] = { progress: parsed, updatedAt: row.updatedAt };
    }
    return json({ account, games, boards, log: readLog(log3.results) });
  } catch (error3) {
    return json({ error: "service_failed", details: String(error3) }, 500);
  }
}
__name(onRequestGet, "onRequestGet");
async function onRequestPost(context2) {
  const { env: env2, request } = context2;
  const auth = await requireAdmin(env2, request);
  if (auth.response) return auth.response;
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad_body" }, 400);
  }
  if (typeof body !== "object" || body === null) return json({ error: "bad_body" }, 400);
  try {
    const target = await loadTarget(env2, request);
    if (target.response) return target.response;
    const { account } = target;
    const name = account.username;
    const log3 = /* @__PURE__ */ __name((action, details) => logStatement(env2, auth.username, action, name, details), "log");
    if (NOT_ON_SELF.has(body.action) && isSelf(auth, account)) {
      return json({ error: "self_action" }, 400);
    }
    if (NOT_ON_ADMIN.has(body.action) && account.admin) {
      return json({ error: "target_is_admin" }, 400);
    }
    switch (body.action) {
      case "ban": {
        const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, MAX_REASON) || null : null;
        await env2.DB.batch([
          env2.DB.prepare(
            `UPDATE players SET banned_at = ?, ban_reason = ?, banned_by = ? WHERE username = ?`
          ).bind((/* @__PURE__ */ new Date()).toISOString(), reason, auth.username, name),
          log3("ban", reason ? { reason } : null)
        ]);
        return json({ ok: true });
      }
      case "unban": {
        await env2.DB.batch([
          env2.DB.prepare(
            `UPDATE players SET banned_at = NULL, ban_reason = NULL, banned_by = NULL WHERE username = ?`
          ).bind(name),
          log3("unban")
        ]);
        return json({ ok: true });
      }
      case "unlock": {
        await env2.DB.batch([
          env2.DB.prepare(`UPDATE players SET failed = 0, locked_until = NULL WHERE username = ?`).bind(
            name
          ),
          log3("unlock")
        ]);
        return json({ ok: true });
      }
      case "reset-pin": {
        if (typeof body.pin !== "string" || !PIN_RE.test(body.pin)) {
          return json({ error: "bad_pin" }, 400);
        }
        const salt = toBase64Url(crypto.getRandomValues(new Uint8Array(16)));
        await env2.DB.batch([
          env2.DB.prepare(
            `UPDATE players SET pin_hash = ?, pin_salt = ?, failed = 0, locked_until = NULL
             WHERE username = ?`
          ).bind(await hashPin(body.pin, salt), salt, name),
          // PIN-en selv havner aldri i loggen
          log3("reset-pin")
        ]);
        return json({ ok: true });
      }
      case "rename": {
        const invalid = validateUsername(body.newUsername);
        if (invalid) return json({ error: invalid }, 400);
        const newName = body.newUsername.trim();
        if (newName === name) return json({ ok: true, username: name });
        const sameRow = newName.toLowerCase() === name.toLowerCase();
        if (!sameRow) {
          const taken = await env2.DB.prepare(`SELECT username FROM players WHERE username = ?`).bind(newName).first();
          if (taken) return json({ error: "name_taken" }, 409);
        }
        try {
          await env2.DB.batch([
            env2.DB.prepare(`UPDATE player_progress SET username = ? WHERE username = ?`).bind(
              newName,
              name
            ),
            env2.DB.prepare(`UPDATE players SET username = ? WHERE username = ?`).bind(newName, name),
            logStatement(env2, auth.username, "rename", newName, { from: name, to: newName })
          ]);
        } catch (error3) {
          if (String(error3).includes("UNIQUE") || String(error3).includes("PRIMARY KEY")) {
            return json({ error: "name_taken" }, 409);
          }
          throw error3;
        }
        return json({ ok: true, username: newName });
      }
      case "make-admin": {
        if (account.bannedAt) return json({ error: "target_banned" }, 400);
        if (account.admin) return json({ ok: true });
        await env2.DB.batch([
          env2.DB.prepare(`UPDATE players SET admin = 1 WHERE username = ?`).bind(name),
          log3("make-admin")
        ]);
        return json({ ok: true });
      }
      case "clear-scores": {
        const game = body.game;
        if (game !== "all" && !BOARDS.some((board) => board.game === game)) {
          return json({ error: "unknown_game" }, 400);
        }
        const boards = (await existingBoards(env2)).filter(
          (board) => game === "all" || board.game === game
        );
        if (boards.length === 0) return json({ ok: true, removed: 0 });
        const results = await env2.DB.batch([
          ...clearBoardStatements(env2, boards, name),
          log3("clear-scores", { game })
        ]);
        const removed = results.slice(0, boards.length).reduce((sum, result) => sum + (result.meta?.changes ?? 0), 0);
        return json({ ok: true, removed });
      }
      default:
        return json({ error: "bad_action" }, 400);
    }
  } catch (error3) {
    return json({ error: "service_failed", details: String(error3) }, 500);
  }
}
__name(onRequestPost, "onRequestPost");
async function onRequestDelete(context2) {
  const { env: env2, request } = context2;
  const auth = await requireAdmin(env2, request);
  if (auth.response) return auth.response;
  const body = await request.json().catch(() => ({}));
  const withScores = body?.scores === true;
  try {
    const target = await loadTarget(env2, request);
    if (target.response) return target.response;
    const { account } = target;
    if (isSelf(auth, account)) return json({ error: "self_action" }, 400);
    if (account.admin) return json({ error: "target_is_admin" }, 400);
    const name = account.username;
    const boards = withScores ? await existingBoards(env2) : [];
    await env2.DB.batch([
      ...clearBoardStatements(env2, boards, name),
      env2.DB.prepare(`DELETE FROM player_progress WHERE username = ?`).bind(name),
      env2.DB.prepare(`DELETE FROM players WHERE username = ?`).bind(name),
      logStatement(env2, auth.username, "delete", name, { scores: withScores })
    ]);
    return json({ deleted: true });
  } catch (error3) {
    return json({ error: "service_failed", details: String(error3) }, 500);
  }
}
__name(onRequestDelete, "onRequestDelete");

// api/admin/players.js
var PAGE = 50;
var MAX_QUERY = 40;
var NOW_SQL = `strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`;
var FILTERS = {
  all: "1 = 1",
  banned: "p.banned_at IS NOT NULL",
  admins: "p.admin = 1",
  locked: `p.locked_until > ${NOW_SQL}`
};
var SORTS = {
  seen: "p.last_seen DESC",
  created: "p.created_at DESC",
  name: "p.username COLLATE NOCASE ASC",
  xp: "xp DESC, p.last_seen DESC"
};
async function onRequestGet2(context2) {
  const { env: env2, request } = context2;
  const auth = await requireAdmin(env2, request);
  if (auth.response) return auth.response;
  const params = new URL(request.url).searchParams;
  const query = (params.get("q") ?? "").trim().slice(0, MAX_QUERY);
  const filter = FILTERS[params.get("filter")] ?? FILTERS.all;
  const sort = SORTS[params.get("sort")] ?? SORTS.seen;
  const offset = Math.max(0, Number.parseInt(params.get("offset") ?? "0", 10) || 0);
  const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
  try {
    const [page, count3] = await Promise.all([
      env2.DB.prepare(
        `SELECT p.username,
                p.admin,
                p.created_at   AS createdAt,
                p.last_seen    AS lastSeen,
                p.banned_at    AS bannedAt,
                p.locked_until > ${NOW_SQL} AS locked,
                COUNT(pp.game) AS games,
                COALESCE(SUM(CASE WHEN json_valid(pp.data) THEN json_extract(pp.data, '$.xp') END), 0) AS xp
         FROM players p
         LEFT JOIN player_progress pp ON pp.username = p.username
         WHERE p.username LIKE ?1 ESCAPE '\\' AND ${filter}
         GROUP BY p.username
         ORDER BY ${sort}
         LIMIT ?2 OFFSET ?3`
      ).bind(pattern, PAGE, offset).all(),
      env2.DB.prepare(
        `SELECT COUNT(*) AS total FROM players p WHERE p.username LIKE ?1 ESCAPE '\\' AND ${filter}`
      ).bind(pattern).first()
    ]);
    const players = (page.results ?? []).map((row) => ({
      ...row,
      admin: row.admin === 1,
      locked: Boolean(row.locked),
      xp: Math.max(0, Math.round(Number(row.xp) || 0))
    }));
    return json({ players, total: count3?.total ?? 0, offset, limit: PAGE });
  } catch (error3) {
    return json({ error: "service_failed", details: String(error3) }, 500);
  }
}
__name(onRequestGet2, "onRequestGet");

// ../shared/games-registry.js
var GAMES = ["atlasmaster", "scribblebot", "hangbot", "proportionpanic", "pixelpanic", "fleetbot"];
var isGame = /* @__PURE__ */ __name((id) => typeof id === "string" && GAMES.includes(id), "isGame");
var MAX_BODY_BYTES = 2e5;
var MAX_KEYS = 2e3;
var MAX_KEY_LEN = 64;
var MAX_ARRAY_LEN = 2e3;
var MAX_DEPTH = 8;
var MAX_STRING_LEN = 512;
function validateDocument(value, depth = 0) {
  if (depth > MAX_DEPTH) return "too_deep";
  if (value === null) return null;
  switch (typeof value) {
    case "boolean":
      return null;
    case "number":
      return Number.isFinite(value) ? null : "bad_number";
    case "string":
      return value.length <= MAX_STRING_LEN ? null : "string_too_long";
    case "object":
      break;
    default:
      return "bad_value";
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_LEN) return "array_too_long";
    for (const item of value) {
      const invalid = validateDocument(item, depth + 1);
      if (invalid) return invalid;
    }
    return null;
  }
  const keys = Object.keys(value);
  if (keys.length > MAX_KEYS) return "too_many_keys";
  for (const key of keys) {
    if (key.length > MAX_KEY_LEN) return "key_too_long";
    const invalid = validateDocument(value[key], depth + 1);
    if (invalid) return invalid;
  }
  return null;
}
__name(validateDocument, "validateDocument");

// api/profile/[game].js
function resolveGame(params) {
  const game = typeof params.game === "string" ? params.game.toLowerCase() : "";
  return isGame(game) ? { game } : { response: json({ error: "unknown_game" }, 404) };
}
__name(resolveGame, "resolveGame");
async function onRequestGet3(context2) {
  const { env: env2, request, params } = context2;
  const target = resolveGame(params);
  if (target.response) return target.response;
  const auth = await requireUser(env2, request);
  if (auth.response) return auth.response;
  try {
    const row = await env2.DB.prepare(
      `SELECT data, updated_at AS updatedAt FROM player_progress WHERE username = ? AND game = ?`
    ).bind(auth.username, target.game).first();
    if (!row) return json({ game: target.game, progress: null, updatedAt: null });
    return json({ game: target.game, progress: JSON.parse(row.data), updatedAt: row.updatedAt });
  } catch (error3) {
    return json({ error: "service_failed", details: String(error3) }, 500);
  }
}
__name(onRequestGet3, "onRequestGet");
async function onRequestPost2(context2) {
  const { env: env2, request, params } = context2;
  const target = resolveGame(params);
  if (target.response) return target.response;
  const auth = await requireUser(env2, request);
  if (auth.response) return auth.response;
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json({ error: "body_too_large" }, 413);
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "bad_body" }, 400);
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return json({ error: "bad_body" }, 400);
  }
  const invalid = validateDocument(body);
  if (invalid) return json({ error: invalid }, 400);
  const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  try {
    await env2.DB.prepare(
      `INSERT INTO player_progress (username, game, data, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(username, game)
       DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
    ).bind(auth.username, target.game, JSON.stringify(body), updatedAt).run();
    return json({ game: target.game, updatedAt });
  } catch (error3) {
    return json({ error: "service_failed", details: String(error3) }, 500);
  }
}
__name(onRequestPost2, "onRequestPost");
async function onRequestDelete2(context2) {
  const { env: env2, request, params } = context2;
  const target = resolveGame(params);
  if (target.response) return target.response;
  const auth = await requireUser(env2, request);
  if (auth.response) return auth.response;
  try {
    const result = await env2.DB.prepare(
      `DELETE FROM player_progress WHERE username = ? AND game = ?`
    ).bind(auth.username, target.game).run();
    return json({ game: target.game, deleted: (result.meta?.changes ?? 0) > 0 });
  } catch (error3) {
    return json({ error: "service_failed", details: String(error3) }, 500);
  }
}
__name(onRequestDelete2, "onRequestDelete");

// api/account/index.js
async function checkPin(env2, username, pin) {
  if (typeof pin !== "string" || !PIN_RE.test(pin)) return { error: json({ error: "bad_pin" }, 400) };
  const row = await env2.DB.prepare(`SELECT pin_hash, pin_salt FROM players WHERE username = ?`).bind(username).first();
  if (!row) return { error: json({ error: "unauthorized" }, 401) };
  const attempted = await hashPin(pin, row.pin_salt);
  if (!timingSafeEqual(attempted, row.pin_hash)) {
    return { error: json({ error: "bad_credentials" }, 401) };
  }
  return {};
}
__name(checkPin, "checkPin");
async function rename(env2, currentName, newName) {
  const invalid = validateUsername(newName);
  if (invalid) return json({ error: invalid }, 400);
  const trimmed = newName.trim();
  const sameRow = trimmed.toLowerCase() === currentName.toLowerCase();
  if (!sameRow) {
    const taken = await env2.DB.prepare(`SELECT username FROM players WHERE username = ?`).bind(trimmed).first();
    if (taken) return json({ error: "name_taken" }, 409);
  }
  const now = Date.now();
  try {
    await env2.DB.batch([
      env2.DB.prepare(`UPDATE player_progress SET username = ? WHERE username = ?`).bind(
        trimmed,
        currentName
      ),
      env2.DB.prepare(`UPDATE players SET username = ? WHERE username = ?`).bind(
        trimmed,
        currentName
      )
    ]);
  } catch (error3) {
    if (String(error3).includes("UNIQUE") || String(error3).includes("PRIMARY KEY")) {
      return json({ error: "name_taken" }, 409);
    }
    return json({ error: "service_failed", details: String(error3) }, 500);
  }
  return json({
    username: trimmed,
    token: await issueToken(env2.AUTH_SECRET, trimmed, now),
    expiresAt: now + TOKEN_TTL_MS
  });
}
__name(rename, "rename");
async function onRequestPost3(context2) {
  const { env: env2, request } = context2;
  const auth = await requireUser(env2, request);
  if (auth.response) return auth.response;
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad_body" }, 400);
  }
  if (body?.action !== "change-pin" && body?.action !== "rename") {
    return json({ error: "bad_action" }, 400);
  }
  if (body.action === "change-pin" && (typeof body.newPin !== "string" || !PIN_RE.test(body.newPin))) {
    return json({ error: "bad_pin" }, 400);
  }
  try {
    const check = await checkPin(env2, auth.username, body.pin);
    if (check.error) return check.error;
    if (body.action === "rename") return await rename(env2, auth.username, body.newUsername);
    const salt = toBase64Url(crypto.getRandomValues(new Uint8Array(16)));
    const now = Date.now();
    await env2.DB.prepare(
      `UPDATE players SET pin_hash = ?, pin_salt = ?, failed = 0, locked_until = NULL WHERE username = ?`
    ).bind(await hashPin(body.newPin, salt), salt, auth.username).run();
    return json({
      username: auth.username,
      token: await issueToken(env2.AUTH_SECRET, auth.username, now),
      expiresAt: now + TOKEN_TTL_MS
    });
  } catch (error3) {
    return json({ error: "service_failed", details: String(error3) }, 500);
  }
}
__name(onRequestPost3, "onRequestPost");
async function onRequestDelete3(context2) {
  const { env: env2, request } = context2;
  const auth = await requireUser(env2, request);
  if (auth.response) return auth.response;
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad_body" }, 400);
  }
  try {
    const check = await checkPin(env2, auth.username, body?.pin);
    if (check.error) return check.error;
    await env2.DB.batch([
      env2.DB.prepare(`DELETE FROM player_progress WHERE username = ?`).bind(auth.username),
      env2.DB.prepare(`DELETE FROM players WHERE username = ?`).bind(auth.username)
    ]);
    return json({ deleted: true });
  } catch (error3) {
    return json({ error: "service_failed", details: String(error3) }, 500);
  }
}
__name(onRequestDelete3, "onRequestDelete");

// api/admin/index.js
var DAY_MS = 24 * 60 * 60 * 1e3;
var LOG_LIMIT2 = 50;
async function onRequestGet4(context2) {
  const { env: env2, request } = context2;
  const auth = await requireAdmin(env2, request);
  if (auth.response) return auth.response;
  const now = Date.now();
  const dayAgo = new Date(now - DAY_MS).toISOString();
  const weekAgo = new Date(now - 7 * DAY_MS).toISOString();
  const nowIso = new Date(now).toISOString();
  try {
    const [totals, perGame, log3] = await Promise.all([
      env2.DB.prepare(
        `SELECT COUNT(*) AS players,
                COALESCE(SUM(last_seen >= ?1), 0)           AS activeDay,
                COALESCE(SUM(last_seen >= ?2), 0)           AS activeWeek,
                COALESCE(SUM(created_at >= ?2), 0)          AS newWeek,
                COALESCE(SUM(banned_at IS NOT NULL), 0)     AS banned,
                COALESCE(SUM(admin = 1), 0)                 AS admins,
                COALESCE(SUM(locked_until > ?3), 0)         AS locked
         FROM players`
      ).bind(dayAgo, weekAgo, nowIso).first(),
      env2.DB.prepare(
        `SELECT game, COUNT(*) AS players, MAX(updated_at) AS lastAt
         FROM player_progress GROUP BY game`
      ).all(),
      env2.DB.prepare(
        `SELECT id, at, admin, action, target, details FROM admin_log ORDER BY id DESC LIMIT ?`
      ).bind(LOG_LIMIT2).all()
    ]);
    const byGame = new Map((perGame.results ?? []).map((row) => [row.game, row]));
    const games = GAMES.map((game) => ({
      game,
      players: byGame.get(game)?.players ?? 0,
      lastAt: byGame.get(game)?.lastAt ?? null
    }));
    return json({ stats: totals, games, log: readLog(log3.results) });
  } catch (error3) {
    return json({ error: "service_failed", details: String(error3) }, 500);
  }
}
__name(onRequestGet4, "onRequestGet");

// api/auth/index.js
var MAX_FAILED = 5;
var LOCKOUT_MS = 15 * 60 * 1e3;
function validate(username, pin) {
  const invalidName = validateUsername(username);
  if (invalidName) return invalidName;
  if (typeof pin !== "string" || !PIN_RE.test(pin)) return "bad_pin";
  return null;
}
__name(validate, "validate");
async function onRequestGet5(context2) {
  const { env: env2, request } = context2;
  const auth = await requireUser(env2, request);
  if (auth.response) return auth.response;
  try {
    await env2.DB.prepare(`UPDATE players SET last_seen = ? WHERE username = ?`).bind((/* @__PURE__ */ new Date()).toISOString(), auth.username).run();
  } catch {
  }
  return json({ username: auth.username, admin: auth.admin });
}
__name(onRequestGet5, "onRequestGet");
async function onRequestPost4(context2) {
  const { env: env2, request } = context2;
  if (!env2.AUTH_SECRET) return json({ error: "not_configured" }, 503);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad_body" }, 400);
  }
  const { action } = body;
  if (action !== "register" && action !== "login") return json({ error: "bad_action" }, 400);
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const pin = body.pin;
  const invalid = validate(username, pin);
  if (invalid) return json({ error: invalid }, 400);
  const now = /* @__PURE__ */ new Date();
  const nowIso = now.toISOString();
  try {
    const existing = await env2.DB.prepare(`SELECT * FROM players WHERE username = ?`).bind(username).first();
    if (action === "register") {
      if (existing) return json({ error: "name_taken" }, 409);
      const salt = toBase64Url(crypto.getRandomValues(new Uint8Array(16)));
      await env2.DB.prepare(
        `INSERT INTO players (username, pin_hash, pin_salt, created_at, last_seen)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(username, await hashPin(pin, salt), salt, nowIso, nowIso).run();
      return json({
        username,
        token: await issueToken(env2.AUTH_SECRET, username, now.getTime()),
        expiresAt: now.getTime() + TOKEN_TTL_MS
      });
    }
    if (!existing) return json({ error: "bad_credentials" }, 401);
    if (existing.locked_until && existing.locked_until > nowIso) {
      const retryAfter = Math.max(
        1,
        Math.ceil((new Date(existing.locked_until).getTime() - now.getTime()) / 1e3)
      );
      return new Response(JSON.stringify({ error: "locked", retryAfter }), {
        status: 429,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
          "Retry-After": String(retryAfter)
        }
      });
    }
    const attempted = await hashPin(pin, existing.pin_salt);
    if (!timingSafeEqual(attempted, existing.pin_hash)) {
      const failed = (existing.failed ?? 0) + 1;
      const lockedUntil = failed >= MAX_FAILED ? new Date(now.getTime() + LOCKOUT_MS).toISOString() : null;
      await env2.DB.prepare(`UPDATE players SET failed = ?, locked_until = ? WHERE username = ?`).bind(failed >= MAX_FAILED ? 0 : failed, lockedUntil, username).run();
      return json({ error: "bad_credentials" }, 401);
    }
    if (existing.banned_at) return json({ error: "banned" }, 403);
    await env2.DB.prepare(
      `UPDATE players SET failed = 0, locked_until = NULL, last_seen = ? WHERE username = ?`
    ).bind(nowIso, username).run();
    return json({
      username: existing.username,
      token: await issueToken(env2.AUTH_SECRET, existing.username, now.getTime()),
      expiresAt: now.getTime() + TOKEN_TTL_MS
    });
  } catch (error3) {
    return json({ error: "service_failed", details: String(error3) }, 500);
  }
}
__name(onRequestPost4, "onRequestPost");

// api/profile/index.js
async function onRequestGet6(context2) {
  const { env: env2, request } = context2;
  const auth = await requireUser(env2, request);
  if (auth.response) return auth.response;
  try {
    const [account, progress] = await Promise.all([
      env2.DB.prepare(
        `SELECT username, created_at AS createdAt, last_seen AS lastSeen FROM players WHERE username = ?`
      ).bind(auth.username).first(),
      env2.DB.prepare(
        `SELECT game, data, updated_at AS updatedAt FROM player_progress WHERE username = ?`
      ).bind(auth.username).all()
    ]);
    if (!account) return json({ error: "unauthorized" }, 401);
    const games = {};
    for (const row of progress.results ?? []) {
      games[row.game] = { progress: JSON.parse(row.data), updatedAt: row.updatedAt };
    }
    return json({
      username: account.username,
      createdAt: account.createdAt,
      lastSeen: account.lastSeen,
      // forsiden viser adminpanelet ut fra dette; hvert admin-kall sjekker
      // flagget på nytt, så feltet åpner ingenting i seg selv
      admin: auth.admin,
      games
    });
  } catch (error3) {
    return json({ error: "service_failed", details: String(error3) }, 500);
  }
}
__name(onRequestGet6, "onRequestGet");

// ../.wrangler/tmp/pages-QXIim3/functionsRoutes-0.9478977911811539.mjs
var routes = [
  {
    routePath: "/api/admin/player",
    mountPath: "/api/admin",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete]
  },
  {
    routePath: "/api/admin/player",
    mountPath: "/api/admin",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/admin/player",
    mountPath: "/api/admin",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/admin/players",
    mountPath: "/api/admin",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/profile/:game",
    mountPath: "/api/profile",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete2]
  },
  {
    routePath: "/api/profile/:game",
    mountPath: "/api/profile",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/profile/:game",
    mountPath: "/api/profile",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/account",
    mountPath: "/api/account",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete3]
  },
  {
    routePath: "/api/account",
    mountPath: "/api/account",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/admin",
    mountPath: "/api/admin",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/auth",
    mountPath: "/api/auth",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/api/auth",
    mountPath: "/api/auth",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/profile",
    mountPath: "/api/profile",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet6]
  }
];

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count3 = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count3--;
          if (count3 === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count3++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count3)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env2, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context2 = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env: env2,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context2);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error3) {
      if (isFailOpen) {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error3;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error3 = reduceError(e);
    const body = JSON.stringify(error3);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-09DFqg/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-09DFqg/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.15782740320040156.mjs.map
