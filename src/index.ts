import * as nodePath from 'path';
import * as nodeFs from 'fs';

/**
 * A single possible config file and the root directory it describes / configures.
 */
export interface ConfigCandidate {
    configFilename: string;
    describesDirectory: string;
}

export interface Options {
    /** Path manipulation library.  Defaults to node's "path" module */
    path?: Path;
    /** Filesystem host.  Defaults to node's "fs" module */
    fs?: Fs;
    /** Name of config file directory, defaults to `.config` */
    configDirectoryName?: string;
}

export const defaultConfigDirectoryName = '.config';

/**
 * Given the path of a config file, return the path of the directory it configures.
 * 
 * TODO handle relative paths without needing a cwd?
 */
export function getDescribedDirectory(configFilePath: string, options?: Options) {
    const {path = nodePath, configDirectoryName = defaultConfigDirectoryName} = options || {};
    const directory = path.dirname(configFilePath);
    const parentDirectory = path.dirname(directory);
    return path.basename(directory) === configDirectoryName ? parentDirectory : directory;
}

/** Return a generator that yields all possible config files to describe the given directory. */
export function* configPaths(directory: string, configFileNames: string[], options?: Options): Generator<ConfigCandidate> {
    // Read options, w/defaults
    const {path = nodePath, configDirectoryName = defaultConfigDirectoryName} = options ?? {};

    let root = directory;

    while(true) {

        // Try root/.config/.mytoolrc
        for(const configFileName of configFileNames) {
            yield {configFilename: path.join(root, configDirectoryName, configFileName), describesDirectory: root};
        }

        // If root is, itself, a 'config' directory, then any config files in it are actually describing the *parent* directory.
        const describesDirectoryIsConfigDirectory = path.basename(root) === configDirectoryName;
        if(!describesDirectoryIsConfigDirectory) {
            // Try root/.mytoolrc
            for(const configFileName of configFileNames) {
                yield {configFilename: path.join(root, configFileName), describesDirectory: root};
            }
        }
        const previousDescribesDirectory = root;
        root = path.dirname(root);
        if(root === previousDescribesDirectory) break;
    }
}

export function allConfigPaths(directory: string, configFileNames: string[], options?: Options): ConfigCandidate[] {
    return arrayFrom(configPaths(directory, configFileNames, options));
}

/** Similar to `Array.from`, in case we need to support older environments */
function arrayFrom<T>(generator: Generator<T>): T[] {
    const ret = [];
    for(const path of generator) {
        ret.push(path);
    }
    return ret;
}

/**
 * Filesystem host.  If a future version of this library supports discovering
 * the config file via fs calls, then we can accept a fs instances, defaulting
 * to node's fs module.
 * Otherwise this interface will be removed.
 */
export interface Fs {
    statSync(path: string): Stats;
    lstatSync(path: string): Stats;
    // TODO add async
}
export interface Stats {
    isDirectory(): boolean;
    isSymbolicLink(): boolean;
}
/**
 * Path manipulation library.
 */
export interface Path {
    dirname(path: string): string;
    basename(path: string): string;
    join(pathA: string, pathB: string, pathC?: string): string;
}