/* Thanks to Ashwin Hariharan
https://medium.freecodecamp.com/webpack-for-the-fast-and-the-furious-bf8d3746adbd#.4ijclp4kt */

var webpack = require("webpack"),
    path = require("path"),
    config = require("src/config.js");

var lib_dir = __dirname + "/src/static/libs";

var config = {
    resolve: {
        alias: {
            bootstrap: "bootstrap/dist/js/bootstrap.min.js",
            jquery: "jquery/dist/jquery.min.js",
            jqueryCookie: "jquery.cookie/jquery.cookie.js",
            mediaElement: "mediaelement/build/mediaelement-and-player.min.js",
            mejsPlaybackRate: lib_dir + "/vendors/mejs_playbackrate_plugin.js",
            tether: "tether/dist/js/tether.min.js",
            truncate: "truncate.js/dist/truncate.min.js",
            typeahead: "typeahead.js/dist/typeahead.bundle.min.js"
        }
    },

    entry: {
        'about/index': [__dirname + '/src/static/libs/js/views/about/index.js'],
        'home/index': [__dirname + '/src/static/libs/js/views/home/index.js'],
        'login/redirect': [__dirname + '/src/static/libs/js/views/login/redirect.js'],
        // 'mobile-app/index': [__dirname + '/src/static/libs/js/views/mobile-app/index.js'],
        'my-playlists/index': [__dirname + '/src/static/libs/js/views/my-playlists/index.js'],
        'my-podcasts/index': [__dirname + '/src/static/libs/js/views/my-podcasts/index.js'],
        'player-page/index': [__dirname + '/src/static/libs/js/views/player-page/index.js'],
        'podcast/index': [__dirname + '/src/static/libs/js/views/podcast/index.js'],
        'settings/index': [__dirname + '/src/static/libs/js/views/settings/index.js'],
        vendors: ["babel-polyfill",
                  "bootstrap",
                  "jquery",
                  "jqueryCookie",
                  "mediaElement",
                  "mejsPlaybackRate",
                  "tether",
                  "truncate",
                  "typeahead"]
    },

    // Thanks:D Peter Tseng http://stackoverflow.com/a/39842495/2608858
    output: {
        path: __dirname + '/src/static/libs/build',
        filename: '[name].js'
    },

    plugins: [
        new webpack.DefinePlugin({
            // TODO: change these to podverse.fm AUTH0 account before deployment
            __AUTH0_CLIENTID__: JSON.stringify(config.auth0ClientId),
            __AUTH0_DOMAIN__: JSON.stringify(config.auth0Domain)
        }),
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            "window.$": "jquery",
            "window.jQuery": "jquery",
            "window.Tether": "tether",
            "Bloodhound": "typeahead"
        }),
        new webpack.optimize.CommonsChunkPlugin("vendors", "vendors.js", Infinity)
    ],

    // Thanks:D James K Nelson http://jamesknelson.com/using-es6-in-the-browser-with-babel-6-and-webpack/
    module: {
      loaders: [
        {
          loader: "babel-loader",
          include: [
            path.resolve(__dirname, "src")
          ],
          test: /\.js$/,
          query: {
            plugins: ['transform-runtime'],
            presets: ['es2015']
          }
        }
      ]
    }

};

module.exports = config;