const rp = require('request-promise');

class IBMQJSApi {

  constructor() {
    this.profile = null;
    this.session = {
      'id' : "",
      'ttl' : 0,
      'created' : "",
      'userId' : "",
    };
    this.auth = {
      'timeout' : 20000,
      'url' : 'https://auth.quantum-computing.ibm.com/api',
      'endpoints' : {
        'login' : 'users/loginWithToken',
        'user' : 'users/me'
      },
    };
    this.api = {
      'timeout' : 20000,
      'url': 'https://api.quantum-computing.ibm.com/api',
      'endpoints' : {
        'backends': '/devices/v/1',
        'hubs': '/Network',
        'jobs': '/Jobs',
        'jobs_status': '/Jobs/status',
        'circuit': '/qcircuit',
        'version': '/version'
      },
    };
  }

  login(token, done) {
    rp({
      method: 'POST',
      uri: `${this.auth.url}/${this.auth.endpoints.login}`,
      body: { 'apiToken': token || '' },
      json: true
    })
      .then(parsed => {
          console.log(`login success!`);
          console.log(parsed);
          this.session = parsed;
          done();
      })
      .catch(err => {
          console.log(`login error! ${err}`);
      });
  };

  user(done) {
    rp({
      method: 'GET',
      uri: `${this.auth.url}/${this.auth.endpoints.user}`,
      form: { 'access_token': this.session.id },
      json: true
    })
      .then(parsed => {
          console.log(`got user success!`);
          console.log(parsed);
          this.profile = parsed;
          done(this.profile);
      })
      .catch(err => {
          console.log(`got user error! ${err}`);
      });
  };

  hubs(done) {
    rp({
      method: 'GET',
      uri: `${this.api.url}/${this.api.endpoints.hubs}`,
      form: { 'access_token': this.session.id },
      json: true
    })
      .then(parsed => {
          console.log(`got hubs success!`);
          console.log(parsed);
          done(parsed);
      })
      .catch(err => {
          console.log(`got hubs error! ${err}`);
      });
  };

};

//module.exports = IBMQJSApi;
const api = new IBMQJSApi();
const dotenv = require('dotenv');
dotenv.config();
const token = process.env.TOKEN;
api.login(token, () => {
  console.log("logged");
  api.user(profile => {
    console.log("got profile");
    console.log(profile);
    api.hubs(allHubs => {
      console.log("got hubs");
    });
  });
});
