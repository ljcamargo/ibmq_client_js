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
        'version': '/version',
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

  apost2(base, path, content) {
    content = content || {}
    content['access_token'] = this.session.id || 'None'
    return this.post(base, path, content)
  }

  login() {
    this.log(`logging in`);
    return rp(this.apost(this.auth.url, this.auth.endpoints.login))
      .then(parsed => {
          this.log(`login success!`, parsed);
          this.session = parsed;
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

  submit(kind, path, name, done) {
    this.log(`submit ${kind} "${name}"`);
    return rp(this.apost2(this.api.url, path))
      .then(parsed => {
        this.log(`get results of submission ${kind} "${name}" success!`, parsed);
        done(parsed);
        return parsed;
      })
      .catch(err => this.warn(`error while submitting ${kind} "${name}"! ${err}`));
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

  submitJob(job, done) {
    return this.submit("job", this.api.endpoints.jobs, job, done);
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
  .then(code => {
    console.log("got code");
    const q = `
      OPENQASM 2.0;\ninclude "qelib1.inc";\n\nqreg q[5];\ncreg c[5];\n\nh q[0];\nh q[1];\nh q[2];\nh q[3];\nh q[4];\nx q[0];\nx q[1];\nz q[2];\ny q[3];\ncx q[0],q[1];\ncx q[3],q[4];\ncx q[2],q[3];\nmeasure q[0] -> c[0];\nmeasure q[1] -> c[1];\nmeasure q[2] -> c[2];\nmeasure q[3] -> c[3];\nmeasure q[4] -> c[4];
    `;
    const backend = `ibmq_qasm_simulator`;
    const qObj = {
      'schema_version': '1.1.0',
      'config': {
        "n_qubits": 5,
        "shots": 1024,
        "memory": false,
        "parameter_binds": [],
        "memory_slots": 5
      },
      "experiments": [
        {
            "instructions": [
                {
                    "qubits": [
                        3
                    ],
                    "name": "h"
                },
                {
                    "qubits": [
                        3
                    ],
                    "name": "y"
                },
                {
                    "qubits": [
                        1
                    ],
                    "name": "h"
                },
                {
                    "qubits": [
                        1
                    ],
                    "name": "x"
                },
                {
                    "qubits": [
                        4
                    ],
                    "name": "h"
                },
                {
                    "qubits": [
                        3,
                        4
                    ],
                    "name": "cx"
                },
                {
                    "qubits": [
                        4
                    ],
                    "memory": [
                        4
                    ],
                    "name": "measure"
                },
                {
                    "qubits": [
                        0
                    ],
                    "name": "h"
                },
                {
                    "qubits": [
                        0
                    ],
                    "name": "x"
                },
                {
                    "qubits": [
                        0,
                        1
                    ],
                    "name": "cx"
                },
                {
                    "qubits": [
                        0
                    ],
                    "memory": [
                        0
                    ],
                    "name": "measure"
                },
                {
                    "qubits": [
                        1
                    ],
                    "memory": [
                        1
                    ],
                    "name": "measure"
                },
                {
                    "qubits": [
                        2
                    ],
                    "name": "h"
                },
                {
                    "qubits": [
                        2
                    ],
                    "name": "z"
                },
                {
                    "qubits": [
                        2,
                        3
                    ],
                    "name": "cx"
                },
                {
                    "qubits": [
                        3
                    ],
                    "memory": [
                        3
                    ],
                    "name": "measure"
                },
                {
                    "qubits": [
                        2
                    ],
                    "memory": [
                        2
                    ],
                    "name": "measure"
                }
            ],
            "config": {
                "n_qubits": 5,
                "memory_slots": 5
            },
            "header": {
                "clbit_labels": [
                    [
                        "c",
                        0
                    ],
                    [
                        "c",
                        1
                    ],
                    [
                        "c",
                        2
                    ],
                    [
                        "c",
                        3
                    ],
                    [
                        "c",
                        4
                    ]
                ],
                "memory_slots": 5,
                "qubit_labels": [
                    [
                        "q",
                        0
                    ],
                    [
                        "q",
                        1
                    ],
                    [
                        "q",
                        2
                    ],
                    [
                        "q",
                        3
                    ],
                    [
                        "q",
                        4
                    ]
                ],
                "name": "circuit1260",
                "n_qubits": 5,
                "qreg_sizes": [
                    [
                        "q",
                        5
                    ]
                ],
                "creg_sizes": [
                    [
                        "c",
                        5
                    ]
                ]
            }
        }
    ],
      'header': {},
      'type': 'QASM'
    };
    const newJob = {  
      'qObj': qObj,
      'backend': {'name': backend},
      'shots': 1024,
      'name': "xjob_" + new Date()
    }
    return api.submitJob(newJob, () => console.log("job submitted"));
  })
  .then(jobSubmission => console.log(jobSubmission));