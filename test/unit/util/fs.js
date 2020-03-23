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
} = require('../../../lib/util/fs');

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

      expect(stat(unexistingPath)).to.eventually.be.rejected;
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
      const directory = await createTemp();

      // Create files under the directory.
      fs.writeFileSync(path.join(directory, 'testfile1.txt'), 'testfile1');
      fs.writeFileSync(path.join(directory, 'testfile2.txt'), 'testfile2');
      fs.writeFileSync(path.join(directory, 'testfile3.txt'), 'testfile3');
      fs.writeFileSync(path.join(directory, 'testfile4.txt'), 'testfile4');

      const result = await readdir(directory);

      expect(result).to.deep.equal([
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
});
