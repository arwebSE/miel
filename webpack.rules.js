module.exports = [
    // Add support for native node modules
    {
        test: /native_modules\/.+\.node$/,
        use: "node-loader",
    },
    {
        test: /\.(m?js|node)$/,
        parser: { amd: false },
        use: {
            loader: "@vercel/webpack-asset-relocator-loader",
            options: {
                outputAssetBase: "native_modules",
            },
        },
    },
    {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
    },
    {
        test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)$/,
        use: {
            loader: "file-loader",
            options: {
                name: "[path][name].[ext]",
            },
        },
    },
];
