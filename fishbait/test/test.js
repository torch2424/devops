const assert = require('assert');
const fetch = require('node-fetch');
const crypto = require('crypto');
const sinon = require('sinon');
const childProcess = require('child_process');

// Get our payload that we want to send to fishbait
// And set up as url params for the fetch request
// Must be wrapped in the payload key
const payload = require('./push-vaporboy-master.payload.json');
const { URLSearchParams } = require('url');
const params = new URLSearchParams();
params.append('payload', JSON.stringify(payload));

// Function to get a new fishbaitServer
const getFishbaitServer = (secret, event, reponame, ref) => {
  // Get our config
  const fishbaitConfig = require('../fishbait.example.json');
  fishbaitConfig.secret = secret;
  fishbaitConfig.hooks[0].event = event; 
  fishbaitConfig.hooks[0].reponame = reponame;
  fishbaitConfig.hooks[0].ref = ref; 

  // Get our server
  return require('../index.js')(fishbaitConfig);
};

const pingServerWithOptions = (secret, othersecret, event, reponame, ref) => {

  let secretSha = undefined;
  if (secret) {
    if (!othersecret) {
      othersecret = secret;
    }

    // Generate a sha1 of the secret
    // https://developer.github.com/webhooks/securing/
    // https://github.com/nlf/node-github-hook/blob/master/index.js#L105
    secretSha = crypto.createHmac('sha1', othersecret)
      .update(params.toString()).digest('hex');
  }

  // Get our server and start listening
  const fishbaitServer = getFishbaitServer(
    secret, 
    'push', 
    'vaporBoy', 
    'refs/heads/master'
  );
  fishbaitServer.listen();

  const headers = {
    'Content-type': 'application/x-www-form-urlencoded',
    'User-Agent': 'GitHub-Hookshot/ae20175',
    'X-GitHub-Delivery': 'a7f7e9d0-7adb-11e9-90aa-fbb573aa24a6',
    'X-GitHub-Event': 'push'
  };

  if (secretSha) {
    headers['X-Hub-Signature'] = `sha1=${secretSha}`;
  }

  return fetch('http://localhost:3420/fishbait', {
    method: 'POST',
    body: params,
    headers: headers
  }).then(res => {
    // Stop the server
    fishbaitServer.stop();
    return res;
  });
};

describe('fishbait', () => {

  // Create our exec stub
  const sandbox = sinon.createSandbox();
  const execStub = sandbox.stub(childProcess, 'exec').callsFake(value => {
    console.log('[Stub Exec] ', value);
  });

  afterEach(() => {
    execStub.resetHistory();
    sandbox.restore();
  });

  it('responds 200', () => {

    return pingServerWithOptions(
      undefined,
      undefined,
      'push',
      'vaporBoy',
      'refs/heads/master'
    ).then(res => {
      assert.ok(res.ok);
      assert.ok(execStub.called);
    });
  });

  it('200 on valid secrets', () => {

    return pingServerWithOptions(
      'mysecret',
      undefined,
      'push',
      'vaporBoy',
      'refs/heads/master'
    ).then(res => {
      assert.ok(res.ok);
      assert.ok(execStub.called);
    });
  });

  it('error on invalid secrets', () => {

    return pingServerWithOptions(
      'mysecret',
      'badsecret',
      'push',
      'vaporBoy',
      'refs/heads/master'
    ).then(res => {
      assert.ok(!res.ok);
      assert.ok(!execStub.called);
    });
  });
});
