module.exports = {
    presets: [
        [
            '@babel/env',
            {
                targets: {
                    browsers: ['last 2 versions', 'ie >= 11', '> 0.5%', 'iOS >= 8']
                },
                // todo: this exclude is form redux repo, really needed?
                exclude: ['transform-async-to-generator', 'transform-regenerator'],
                modules: false,
                loose: true
            }
        ]
    ],
    plugins: [
        // don't use `loose` mode here - need to copy symbols when spreading
        '@babel/proposal-object-rest-spread',
        '@babel/plugin-proposal-class-properties',
        ['@babel/plugin-transform-runtime', {
            "corejs": false,
            "helpers": true,
            "regenerator": false,
            "useESModules": true
        }]
    ]
}
