const path = require('path');
const pkgUp = require('pkg-up');
const {isNull} = require('lodash');

const isESModule = async (absPath) => {
    const ext = path.extname(absPath);
    if (ext == '.mjs') return true;
    if (ext != '' && ext != '.js') return false;
    
    const nearestPkgJson = await pkgUp({ cwd: absPath });
    if (isNull(nearestPkgJson)) return false;
    return require(nearestPkgJson).type === 'module';
}

const requireFile = async (absPath) => {
    if (await isESModule(absPath)) {
        return import(absPath);
    } else {
        return Promise.resolve(require(absPath));
    }
}

module.exports = {
    requireFile
};
