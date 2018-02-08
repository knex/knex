
// Oracle Client
// -------
import inherits from 'inherits';
import Client_Oracle from '../oracle';

function Client_StrongOracle() {
  Client_Oracle.apply(this, arguments);
}
inherits(Client_StrongOracle, Client_Oracle);

Client_StrongOracle.prototype._driver = () => require('strong-oracle')()

Client_StrongOracle.prototype.driverName = 'strong-oracle'

export default Client_StrongOracle;
