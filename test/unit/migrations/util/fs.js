const fs = require('fs');
const path = require('path');

const { expect } = require('chai');
const {
  stat,
  readdir,
  readFile,
  writeFile,
  createTemp,
  ensureDirectoryExists,
  getFilepathsInFolder,
} = require('../../../../lib/migrations/util/fs');
const {
  normalizePath,
  normalizePathArray,
} = require('../../../util/assertHelper');
require('../../../util/chai-setup');

describe('FS functions', () => {
  describe('stat', () => {
    it('should return stats for a given path.', async () => {
      const directoryThatExists = await createTemp();

      const result = await stat(directoryThatExists);

      expect(result).to.be.an.instanceOf(fs.Stats);
    });

    it('should throw an error if the path does not exist.', async () => {
      const directoryThatExists = await createTemp();
      const unexistingPath = path.join(directoryThatExists, 'abc/xyz/123');

      await expect(stat(unexistingPath)).to.eventually.be.rejected;
    });
  });

  describe('readFile', async () => {
    it('should be able to read from the given file path.', async () => {
      const tmpPath = await createTemp();
      const filePath = path.join(tmpPath, `${Date.now()}1.txt`);

      fs.writeFileSync(filePath, 'Hello World!');

      const contents = await readFile(filePath);

      expect(contents.toString()).to.equal('Hello World!');
    });
  });

  describe('writeFile', async () => {
    it('should be able to write to the given file path.', async () => {
      const tmpPath = await createTemp();
      const filePath = path.join(tmpPath, `${Date.now()}2.txt`);

      await writeFile(filePath, 'Foo Bar');

      expect(fs.readFileSync(filePath).toString()).to.equal('Foo Bar');
    });
  });

  describe('readdir', async () => {
    it('should read a directory and return a list of files under it.', async () => {
      const directory = normalizePath(await createTemp());

      // Create files under the directory.
      fs.writeFileSync(path.join(directory, 'testfile1.txt'), 'testfile1');
      fs.writeFileSync(path.join(directory, 'testfile2.txt'), 'testfile2');
      fs.writeFileSync(path.join(directory, 'testfile3.txt'), 'testfile3');
      fs.writeFileSync(path.join(directory, 'testfile4.txt'), 'testfile4');

      const result = await readdir(directory);

      expect(normalizePathArray(result)).to.deep.equal([
        'testfile1.txt',
        'testfile2.txt',
        'testfile3.txt',
        'testfile4.txt',
      ]);
    });
  });

  describe('ensureDirectoryExists', () => {
    it('should resolve successfully if the directory already exists.', async () => {
      const directoryThatExists = await createTemp();

      const result = await ensureDirectoryExists(directoryThatExists);

      expect(result).to.be.an.instanceOf(fs.Stats);
    });

    it('should create a directory (recursively) if it does not exist.', async () => {
      const directoryThatExists = await createTemp();
      const newPath = path.join(directoryThatExists, 'abc/xyz/123');

      expect(fs.existsSync(newPath)).to.equal(false);

      await ensureDirectoryExists(newPath);

      expect(fs.existsSync(newPath)).to.equal(true);
    });
  });

  describe('getFilepathsInFolder', () => {
    it('should return sorted file list under the directory.', async () => {
      const directory = normalizePath(await createTemp());
      fs.writeFileSync(path.join(directory, 'testfile1.txt'), 'testfile1');
      fs.writeFileSync(path.join(directory, 'testfile2.txt'), 'testfile1');
      fs.writeFileSync(path.join(directory, 'testfile3.txt'), 'testfile1');
      fs.mkdirSync(path.join(directory, 'dir'));
      fs.writeFileSync(path.join(directory, 'dir/testfile1.txt'), 'testfile1');
      fs.writeFileSync(path.join(directory, 'dir/testfile2.txt'), 'testfile2');
      fs.writeFileSync(path.join(directory, 'dir/testfile3.txt'), 'testfile3');

      const result = await getFilepathsInFolder(directory);

      expect(normalizePathArray(result)).to.deep.equal([
        `${directory}/testfile1.txt`,
        `${directory}/testfile2.txt`,
        `${directory}/testfile3.txt`,
      ]);
    });

    it('should return sorted file list under the directory (recursively) with recursive option.', async () => {
      const directory = normalizePath(await createTemp());
      fs.writeFileSync(path.join(directory, 'testfile1.txt'), 'testfile1');
      fs.writeFileSync(path.join(directory, 'testfile2.txt'), 'testfile1');
      fs.writeFileSync(path.join(directory, 'testfile3.txt'), 'testfile1');
      fs.mkdirSync(path.join(directory, 'dir'));
      fs.writeFileSync(path.join(directory, 'dir/testfile1.txt'), 'testfile1');
      fs.writeFileSync(path.join(directory, 'dir/testfile2.txt'), 'testfile2');
      fs.writeFileSync(path.join(directory, 'dir/testfile3.txt'), 'testfile3');

      const result = await getFilepathsInFolder(directory, true);

      expect(normalizePathArray(result)).to.deep.equal([
        `${directory}/dir/testfile1.txt`,
        `${directory}/dir/testfile2.txt`,
        `${directory}/dir/testfile3.txt`,
        `${directory}/testfile1.txt`,
        `${directory}/testfile2.txt`,
        `${directory}/testfile3.txt`,
      ]);
    });
  });
});
