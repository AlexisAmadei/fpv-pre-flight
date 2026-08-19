# A custom Metro transformer keeps NativeWind v5 working on bare React Native

NativeWind v5's styling engine (`react-native-css`) ships a Metro transformer that compiles `.css` and delegates every other file to `@expo/metro-config`'s worker. On this project — bare React Native CLI, not Expo (ADR-0001) — that delegation breaks the build twice over: the Expo worker cannot even load without `expo` resolvable, and once it does load it emits full source maps for Metro's own polyfills, which the bare RN serializer rejects with `Unexpected module with full source map found`.

`metro.transformer.js` resolves this by compiling `.css` through `react-native-css` and handing everything else to React Native's standard `metro-transform-worker`. It also strips the source map off the compiled stylesheet, which is a generated module where the map carries no meaning and only trips the same serializer check. `expo` is installed as a devDependency purely so `@expo/metro-config` — pulled in transitively by `react-native-css` and still used for the CSS compile itself — can resolve; no Expo runtime code ships in the app.

`lightningcss` is pinned to exactly `1.30.1` through `pnpm-workspace.yaml`. A newer native binary (1.33.0 resolved by default) fails with `failed to deserialize; expected an object-like struct named Specifier`. The pin lives in `pnpm-workspace.yaml` rather than `package.json` because pnpm v11 no longer reads a `pnpm.overrides` block from `package.json`.

The dark palette is written as a `prefers-color-scheme` block because that is what NativeWind compiles for native; `:root.dark` alone produced no dark tokens in the bundle. This does **not** make dark mode follow the OS — the app calls `Appearance.setColorScheme` explicitly from its in-app toggle, preserving the night-vision requirement in ADR-0009.

## Consequences

- The transformer depends on `react-native-css`'s internal `dist/commonjs/metro/metro-transformer.js`, resolved relative to the package entry because the package's `exports` map does not expose it. A NativeWind upgrade may move this file, and the transformer should be re-checked when bumping.
- If `react-native-css` ever accepts an upstream transformer path option, this file can collapse into a config line.
- `expo` sits in devDependencies despite ADR-0001 choosing bare RN CLI. It is a build-time dependency of the CSS pipeline only; nothing imports it at runtime, and ADR-0004's F-Droid stance is unaffected since it is OSS and never reaches the shipped bundle.
- Jest maps `.css` imports to an empty stub: className props are inert under `react-test-renderer`, so tests assert behavior and testIDs rather than resolved styles.
