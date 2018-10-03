import Formatter from '../formatter';

const fakeClient = {
  formatter(builder) {
    return new Formatter(fakeClient, builder);
  },
};

export default fakeClient;
