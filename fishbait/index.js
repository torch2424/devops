const githubhook = require('githubhook');
const exec = require('child_process').exec;

// Return a function that returns a function to start listening
module.exports = (fishbaitConfig, secret) => {

  // Configure our fishbait server
  const fishbaitServer = githubhook({
    host: fishbaitConfig.host,
    port: fishbaitConfig.port,
    path: fishbaitConfig.path,
    secret: secret
  });

  // Set up our server listeners
  fishbaitConfig.hooks.forEach(hook => {
    fishbaitServer.on(`${hook.event}:${hook.reponame}:${hook.ref}`, data => {
      console.log('Running Command: ', hook.command);
      exec(hook.command, (error, stdout, stderror) => {
        console.log(stdout);
      });
    });
  });

  return fishbaitServer;
};
