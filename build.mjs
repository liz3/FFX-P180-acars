import * as esbuild from 'esbuild'

const ctx = await esbuild.context({
entryPoints: ['src/app.mjs'],
bundle: true,
minify: false,
sourcemap: false,
target: ['es2020'],
format: 'iife',
  banner: {
    js: `
       function require(m) {
         const MODS = {
          "@microsoft/msfs-sdk": window.msfssdk,
          "@microsoft/msfs-wt21-fmc": window.wt21_fmc,
          "@microsoft/msfs-wt21-shared": window.msfswt21shared
         }
        if(MODS[m])
          return MODS[m];
         throw new Error(\`Unknown module \${m}\`);
       }
    `,
  },

jsx: 'transform',
jsxFactory: 'FSComponent.buildComponent', // MSFS SDK JSX factory
jsxFragment: 'FSComponent.Fragment',
  outfile: './ffx-p180-acars/PackageSources/Copys/ffx-p180-acars/files/liz3-ffx-p180-acars/p180-acars.js',
  external: ["@microsoft/msfs-sdk", "@microsoft/msfs-wt21-fmc", "@microsoft/msfs-wt21-shared"]
})
await ctx.watch();