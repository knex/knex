const { expect } = require('chai');
const Oracle_Client = require('../../../lib/dialects/oracledb');
const {
  NameHelper,
  isConnectionError,
} = require('../../../lib/dialects/oracle/utils');

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

        expect(client.version).to.be.null;
      });

      it('should return the version provided in options if given from .checkVersion()', async () => {
        const client = new Oracle_Client({
          client: 'oracledb',
          version: '1.13',
        });
        const version = await client.checkVersion();

        expect(version).to.equal(client.version);
      });

      it('should strip off any character suffixes from versions', () => {
        const client = new Oracle_Client({
          client: 'oracledb',
          version: '12c',
        });
        expect(client.version).to.equal('12');
      });

      it('should error indicating the need to specify a version if it could not be auto-detected', async () => {
        const client = new Oracle_Client({ client: 'oracledb' });
        try {
          await client.checkVersion(fakeBadVersionQueryConnection);
          expect.fail('.checkVersion should have rejected.');
        } catch (err) {
          expect(err.message).to.match(
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
          expect.fail('.checkVersion should have rejected.');
        } catch (err) {
          expect(err.message).to.match(
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

      expect(ora122NameHelper.limit).to.equal(128);
      expect(oraNameHelper.limit).to.equal(128);
    });

    it('should use a 30 character name limit for Oracle 12.1 and below', () => {
      const ora121NameHelper = new NameHelper('12.1');
      const ora11NameHelper = new NameHelper('11.3');

      expect(ora121NameHelper.limit).to.equal(30);
      expect(ora11NameHelper.limit).to.equal(30);
    });
  });

  describe('isConnectionError', () => {
    it('should treat node-oracledb Thin mode connection errors as connection errors', () => {
      expect(
        isConnectionError(
          new Error(
            'NJS-500: connection to Oracle Database was closed or broken'
          )
        )
      ).to.equal(true);
      expect(
        isConnectionError(
          new Error(
            'NJS-521: connection to host db.example.com port 1521 received end-of-file on communication channel. (CONNECTION_ID=abc)'
          )
        )
      ).to.equal(true);
    });

    it('should not treat unrelated errors as connection errors', () => {
      expect(
        isConnectionError(new Error('ORA-00942: table or view does not exist'))
      ).to.equal(false);
      expect(
        isConnectionError(
          new Error('NJS-522: connection descriptor limit exceeded')
        )
      ).to.equal(false);
    });
  });
});
