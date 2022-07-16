import useNodeJs from "./use-node.js";
import buildConfig from "./build-config.js";
import polyfillExports from "./polyfill-exports";

export default function renderer() {
    return [useNodeJs(), buildConfig(), polyfillExports()];
}
