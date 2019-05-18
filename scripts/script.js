const Conversation = require('hubot-conversation');

module.exports = (bot) => {
  
  bot.hear(/(.*) (rodar?|executar?)( a| o)? job$/i, (msg) => {
    const switchBoard = new Conversation(bot);
    const dialog = switchBoard.startDialog(msg, 5000);
    msg.reply('qual job você deseja executar?');
    dialog.addChoice(/(.*)/i, (msg) => {
      getCrumbExecucaoJob(msg,msg.match[1].replace(msg.robot.name + ' ', ''));
    });
    dialog.dialogTimeout = (msg3) => {
      return;
    };
  });

  bot.hear(/(.*) (rodar?|executar?)( a| o)? job (.*)/i, (msg) => {
    getCrumbExecucaoJob(msg, msg.match[4]);
  });

  executarBuildPorUrl = (msg, job, url) => {
    getCrumbExecucaoJob(msg, job, url);
  }

  const getCrumbExecucaoJob = (msg, job, url) => {
    const jenkinsUser = process.env.ROCKETCHAT_JENKINS_USER;
    const jenkinsPassword = process.env.ROCKETCHAT_JENKINS_PASSWORD;
    const auth = new Buffer(`${jenkinsUser}:${jenkinsPassword}`).toString('base64');
    const url = process.env.ROCKETCHAT_JENKINS_URL;
    bot.http(`${url}/crumbIssuer/api/json`)
      .header('Authorization', `Basic ${auth}`)
      .get()((err, response, body) => {
        const result = JSON.parse(body);
        executarJob(result.crumb, bot, auth, msg, job, url)
      })
  }

  const executarJob = (crumb, bot, auth, msg, job, urlJob) => {
    const url = (urlJob) ? `${urlJob}/build` : `${process.env.ROCKETCHAT_JENKINS_URL}/job/${job}/build`;
    bot.http(url)
      .header('Authorization', `Basic ${auth}`)
      .header('Jenkins-Crumb', crumb)
      .post(JSON.stringify({}))((err, response, body) => {
        if (response.statusCode === 201) {
          msg.reply(`executando job: ${job}`);
        } else if (response.statusCode === 404) {
          findJobQuandoNaoEncontradoExecucao(msg, job)
        } else {
          msg.reply(`Não consegui executar a job ${job}`);
        }
      });
  }
}
