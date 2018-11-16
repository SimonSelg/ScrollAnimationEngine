import babelPlugin from 'rollup-plugin-babel'
import replacePlugin from 'rollup-plugin-replace'
import pkg from "./package.json";

const externalPackages = [
    ...Object.keys(pkg.peerDependencies || {}),
    ...Object.keys(pkg.dependencies || {}),
];

const makeExternalPredicate = externalArr => {
    if (externalArr.length === 0) {
        return () => false;
    }
    const pattern = new RegExp(`^(${externalArr.join("|")})($|/)`);
    return id => pattern.test(id);
}

const babel = babelPlugin({ runtimeHelpers: true })

// todo: dead code elimination is not quite working, devLog still in production bundle
const replace = replacePlugin({
    __PRODUCTION__: JSON.stringify(process.env.NODE_ENV === 'production')
})
const external = makeExternalPredicate(externalPackages)

export default [
    // CommonJS
    {
        input: 'src/index.js',
        output: { file: 'lib/scroll-animation-engine.js', format: 'cjs', indent: false },
        external,
        plugins: [replace, babel]
    },

    // ES
    {
        input: 'src/index.js',
        output: { file: 'es/scroll-animation-engine.js', format: 'es', indent: false },
        external,
        plugins: [replace, babel]
    }

    // todo: maybe include UMD build
]
