const rp = require('request-promise');

class IBMQJSApi {

  constructor(authToken) {
    this.token = authToken;
    this.session = {
      'id' : "",
      'ttl' : 0,
      'created' : "",
      'userId' : "",
    };
    this.profile_ = null;
    this.hubs_ = [];
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
        'userData': (id) => `/Users/${id}`,
        'latestCodes': (id) => `/Users/${id}/codes/latest`,
        'backends': '/Backends',
        'backend': (name) => `/Backends/${name}`,
        'calibration': (name) => `/Backends/${name}/calibration`,
        'parameters': (name) => `/Backends/${name}/parameters`,
        'hubs': '/Network',
        'hub': (name) => `/Network/${name}`,
        'groups': (network) => `/Network/${network}/Groups`,
        'group': (network, group) => `/Network/${network}/Groups/${group}`,
        'projects': (network, group) => `/Network/${network}/Groups/${group}/Projects`,
        'project': (network, group, project) => `/Network/${network}/Groups/${group}/Projects/${project}`,
        'netJobs': (network, group, project) => `/Network/${network}/Groups/${group}/Projects/${project}/Jobs`,
        'netJob': (network, group, project, job) => `/Network/${network}/Groups/${group}/Projects/${project}/Jobs/${job}`,
        'jobs': '/Jobs',
        'job': (id) => `/Jobs/${id}`,
        'jobs': '/Jobs',
        'job': (id) => `/Jobs/${id}`,
        'execution': (id) => `/Executions/${id}`,
        'code': (id) => `/Codes/${id}`,
        'jobsStatus': '/Jobs/status',
        'circuit': '/qcircuit',
        'version': '/version'
      },
    };
    this.config = {
      'verbose' : true,
    }
  }

  log(message, object) {
    if (this.config.verbose) console.log(message);
    if (object != undefined && this.config.verbose) console.log(object);
  }

  warn(message, object) {
    console.log(message);
    if (object != undefined) console.log(object);
  }

  get(base, path, content) {
    return {
      method: 'GET',
      uri: `${base}/${path}`,
      form: content,
      json: true
    }
  }

  aget(base, path, content) {
    content = content || {}
    content['access_token'] = this.session.id || 'None'
    return this.get(base, path, content)
  }

  post(base, path, content) {
    return {
      method: 'POST',
      uri: `${base}/${path}`,
      body: content,
      json: true
    }
  }

  apost(base, path, content) {
    content = content || {}
    content['apiToken'] = this.token || ''
    return this.post(base, path, content)
  }

  login() {
    this.log(`logging in`);
    return rp(this.apost(this.auth.url, this.auth.endpoints.login))
      .then(parsed => {
          this.log(`login success!`, parsed);
          this.session = parsed;
          done(parsed);
          return parsed;
      })
      .catch(err => this.warn(`login error! ${err}`));
  };

  user(done) {
    this.log(`get userprofile`);
    return rp(this.aget(this.auth.url, this.auth.endpoints.user))
      .then(parsed => {
        this.log(`get user profile success!`, parsed);
        this.profile_ = parsed;
        done(parsed);
        return parsed;
      })
      .catch(err => this.warn(`got user profile error! ${err}`));
  };

  list(kind, path, done) {
    this.log(`get list ${kind}s`);
    return rp(this.aget(this.api.url, path))
      .then(parsed => {
        this.log(`get list ${kind}s success!`, parsed);
        done(parsed);
        return parsed;
      })
      .catch(err => this.warn(`get list ${kind}s error! ${err}`));
  }

  detail(kind, path, name, done) {
    this.log(`get detail of ${kind} "${name}"`);
    return rp(this.aget(this.api.url, path))
      .then(parsed => {
        this.log(`get detail of ${kind} "${name}" success!`, parsed);
        done(parsed);
        return parsed;
      })
      .catch(err => this.warn(`get detail of ${kind} "${name}" error! ${err}`));
  }

  userData(done) {
    const id = this.session.userId;
    return this.detail("user", this.api.endpoints.userData(id), id, done);
  }

  hubs(done) {
    return this.list("hub", this.api.endpoints.hubs, list => {
      this.hubs_ = list;
      this.log("hubs available:");
      list.forEach(hub => {
        this.log("groups available:");
        Object.values(hub.groups).forEach(group => {
          this.log(`group`, group);
          this.log("projects available:");
          Object.values(group.projects).forEach(project => {
            this.log(`project`, project);
            this.log("with devices");
            Object.values(project.devices).forEach(device => {
              this.log(`device`, device);
            });
          });
        });
      });
      done(list);
      return list;
    });
  };

  hub(name, done) {
    return this.detail("hub", this.api.endpoints.hub(name), name, done);
  };

  backends(done) {
    return this.list("backend", this.api.endpoints.backends, list => {
      this.log("backends available:");
      list.forEach(backend => {
        this.log("backend", backend);
      });
      done(list);
    });
  };

  backend(name, done) {
    return this.detail("backend", this.api.endpoints.backend(name), name, done);
  };

  calibration(name, done) {
    return this.detail("calibration", this.api.endpoints.calibration(name), name, done);
  };

  parameters(name, done) {
    return this.detail("parameters", this.api.endpoints.parameters(name), name, done);
  };

  jobs(done) {
    return this.list("job", this.api.endpoints.jobs, list => {
      this.log("jobs available:");
      list.forEach(job => {
        this.log("job", job);
      });
      done(list);
    });
  };

  job(id, done) {
    return this.detail("job", this.api.endpoints.job(id), id, done);
  };

  execution(id, done) {
    return this.detail("job", this.api.endpoints.execution(id), id, done);
  };

  code(id, done) {
    return this.detail("code", this.api.endpoints.code(id), id, done);
  };

  version(done) {
    return this.detail("version", this.api.endpoints.version, null, done);
  };

};

module.exports = IBMQJSApi;

const dotenv = require('dotenv');
dotenv.config();
const api = new IBMQJSApi(process.env.TOKEN);

api
  .login(session => console.log("got login"))
  .then(session => api.version(version => console.log("got version")))
  .then(version =>  api.user(user => console.log("got profile")))
  .then(users =>  api.hubs(hubs => console.log("got hub!")))
  .then(hubs => api.hub(hubs[0].name, hub => console.log("got hub!")))
  .then(hub => api.jobs(jobs => console.log("got jobs!")))
  .then(jobs => {
    console.log("got jobs");
    if (jobs.length > 0) {
      return api.job(jobs[0].id, ()=>{});
    } else {
      return new Promise();
    }
  })
  .then(job => {
    console.log("got job");
    return api.code(job.codeId, ()=>{});
  })
  .then(code => console.log(code));

/* api.login(session => {
  console.log("got login");
  api.user(user => {
    console.log("got profile");
    api.hubs(hubs => {
      api.hub(hubs[0].name, hub => {
        console.log("got hub!");
        api.backends(backends => {
          console.log("got backends");
          api.backend(backends[0].name, backend =>  {
            console.log("got backend");
            api.calibration('ibmq_essex', calibration =>  {
              console.log("got calibration");
              api.parameters('ibmq_essex', parameters =>  {
                console.log("got parameters");
                api.jobs(jobs =>  {
                  console.log("got jobs");
                });
              });
            });
          });
        });
      });
    }); 
  });
}); */
