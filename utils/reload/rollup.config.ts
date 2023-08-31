export default [
  {
    input: "utils/reload/initReloadServer.ts",
    output: {
      file: "utils/reload/initReloadServer.js",
    },
    external: ["ws", "timers"],
  },
  {
    input: "utils/reload/injections/script.ts",
    output: {
      file: "utils/reload/injections/script.js",
    },
  },
  {
    input: "utils/reload/injections/view.ts",
    output: {
      file: "utils/reload/injections/view.js",
    },
  },
];
