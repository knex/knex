const Oracle_Client = require('../../../lib/dialects/oracledb');
const { NameHelper } = require('../../../lib/dialects/oracle/utils');

describe('OracleDB Unit Tests', () => {
  describe('Client', () => {
    describe('Version Parsing', () => {
      const fakeBadVersionQueryConnection = {
        execute: function () {
          const cb = arguments[arguments.length - 1];
          cb(null, {
            rows: [
              [
                'Oracle Database Bad Version String That Should Not Happen Unless Something Is Very Wrong',
              ],
            ],
          });
        },
      };

      it('should set its version to null if version in options is invalid', () => {
        const client = new Oracle_Client({
          client: 'oracledb',
          version: 'invalid',
        });

        expect(client.version).toBeNull();
      });

      it('should return the version provided in options if given from .checkVersion()', async () => {
        const client = new Oracle_Client({
          client: 'oracledb',
          version: '1.13',
        });
        const version = await client.checkVersion();

        expect(version).toBe(client.version);
      });

      it('should strip off any character suffixes from versions', () => {
        const client = new Oracle_Client({
          client: 'oracledb',
          version: '12c',
        });
        expect(client.version).toBe('12');
      });

      it('should error indicating the need to specify a version if it could not be auto-detected', async () => {
        const client = new Oracle_Client({ client: 'oracledb' });
        try {
          await client.checkVersion(fakeBadVersionQueryConnection);
          expect.unreachable('.checkVersion should have rejected.');
        } catch (err) {
          expect(err.message).toMatch(
            /^Unable to detect .* version .* specify the version/
          );
        }
      });

      it('should require a valid version if it could not be auto-detected and provided version is invalid', async () => {
        const client = new Oracle_Client({
          client: 'oracledb',
          version: 'bad version',
        });
        try {
          await client.checkVersion(fakeBadVersionQueryConnection);
          expect.unreachable('.checkVersion should have rejected.');
        } catch (err) {
          expect(err.message).toMatch(
            /^Invalid .* version number .* Unable to successfully auto-detect/
          );
        }
      });
    });
  });

  describe('Name Generation', () => {
    it('should use a 128 character name limit for Oracle 12.2 and above', () => {
      const ora122NameHelper = new NameHelper('12.2');
      const oraNameHelper = new NameHelper('18');

      expect(ora122NameHelper.limit).toBe(128);
      expect(oraNameHelper.limit).toBe(128);
    });

    it('should use a 30 character name limit for Oracle 12.1 and below', () => {
      const ora121NameHelper = new NameHelper('12.1');
      const ora11NameHelper = new NameHelper('11.3');

      expect(ora121NameHelper.limit).toBe(30);
      expect(ora11NameHelper.limit).toBe(30);
    });
  });
});
