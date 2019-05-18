const Conversation = require('hubot-conversation');

module.exports = (bot) => {
  const switchBoard = new Conversation(bot);

  bot.hear(/(.*) (buscar?|listar?)( as| os)? jobs? (.*)/i, (msg) => {
    const job = msg.match[4];
    findJobs(msg, job);
  });

  bot.hear(/(.*) (buscar?|listar?)( as| os)? jobs?$/i, (msg) => {
    const dialog = switchBoard.startDialog(msg,5000);
    msg.reply('Por favor informe um filtro para que eu possa encontrar as jobs desejadas');
    
    dialog.addChoice(/(.*)/i, (msg) => {
      const job = msg.match[1].replace(msg.robot.name + " ", "");
      findJobs(msg, job);
    });

    dialog.dialogTimeout = (msg3) => { 
      return;
    };
  });

  bot.hear(/(.*) (buildar?|rodar?)( o| os)? projeto? (.*)/i, (msg) => {
    const job = msg.match[4];
    findJobs(msg, job);
  });

  bot.hear(/(.*) (buscar?|listar?)( o| os)? projeto?$/i, (msg) => {
    const dialog = switchBoard.startDialog(msg,5000);
    msg.reply('Por favor informe um filtro para que eu possa encontrar o sistema desejado');
    dialog.addChoice(/(.*)/i, (msg) => {
      const project = msg.match[1].replace(msg.robot.name + ' ', '');
      findProjects(msg, project);
    });
    dialog.dialogTimeout = (msg3) => { 
      return
    };
  });

  bot.respond(/jobs quebradas?/i, (res) => {
    let resList = [];
    const quebradas = [];
    resList = findJobByName(res, resList, '');
    resList.forEach((job, index) => {
      if (job.color === 'red') {
        quebradas.push(job);
      }
    })
    let message = '';
    quebradas.forEach((job, index) => {
      message += (origemJobExecucao ? '['+ (index+1)+"] " :'')+ getStatus(job) + "\n";
    })
    res.reply('As seguntes Jobs estão com quebradas:\n' + message);
  });

  findJobQuandoNaoEncontradoExecucao = (msg, job) => {
    findJobs(msg, job, true);
  }

  const findJobs = (msg, job, origemJobExecucao) => {
    const jenkinsUser = process.env.ROCKETCHAT_JENKINS_USER;
    const jenkinsPassword = process.env.ROCKETCHAT_JENKINS_PASSWORD;
    const auth = new Buffer(`${jenkinsUser}:${jenkinsPassword}`).toString('base64');
    const url = process.env.ROCKETCHAT_JENKINS_URL + '/api/json?tree=jobs[displayName,url,color,lastBuild[building,timestamp],' +
      'jobs[displayName,url,color,lastBuild[building,timestamp],' +
      'jobs[displayName,url,color,lastBuild[building,timestamp],' +
      'jobs[displayName,url,color,lastBuild[building,timestamp]]]]]' +
      '&pretty=true';

    bot.http(url)
      .header('Authorization', `Basic ${auth}`)
      .get()((err, response, body) => {
        if (response.statusCode == 200) {
          if (!origemJobExecucao) {
            msg.reply('buscando job...');
          }
        }
        const result = JSON.parse(body);
        let resList = [];
        const dialog = switchBoard.startDialog(msg);
        resList = findJobByName(result, resList, job);
        let message = '';
        resList.forEach((job, index) => {
          message += (origemJobExecucao ? '['+ (index+1)+"] " : '') + getStatus(job) + '\n';
        })
        if (message === '') {
          if (!origemJobExecucao) {
            msg.reply('Não encontrei nenhuma job com o filtro informado, tente informar um filtro diferente');
            dialog.addChoice(/(.*)/i, (msg) => {
              const job = msg.match[1].replace(msg.robot.name + " ", "");
              findJobs(msg, job);
            });
          } else {
            msg.reply(`Não encontrei a job ${job}, verifique se o nome está correto`);
          }
        } else {
          if (!origemJobExecucao) {
            msg.reply(message);
          } else {
            msg.reply(`Não encontrei a job ${job}, mas encontrei algumas semelhantes, se a que você procura está entre as listadas abaixo informe o  número por favor, caso contrário digite 0:\n${message}`);
            perguntaNumeroJob(dialog,msg,resList)
          }
        }
        dialog.dialogTimeout = (msg3) => {
          return;
        };
      })
  }

  const perguntaNumeroJob = (dialog, msg, resList) => {
    dialog.addChoice(/(.*)/i, (msg) => {
      const numero = msg.match[1].replace(msg.robot.name + ' ', '');
      if (isNaN(numero) || numero > resList.length || numero < 0){
        msg.reply('Informe um número válido, por favor!');
        perguntaNumeroJob(dialog, msg, resList);
      } else if (numero != 0) {
        const job = resList[numero - 1];
        executarBuildPorUrl(msg, job.displayName, job.url);
      }
    });
  }

  const findProjects = (msg, project) => {
    const jenkinsUser = process.env.ROCKETCHAT_JENKINS_USER;
    const jenkinsPassword = process.env.ROCKETCHAT_JENKINS_PASSWORD;
    const auth = new Buffer(`${jenkinsUser}':'${jenkinsPassword}`).toString('base64');
    const url = process.env.ROCKETCHAT_JENKINS_URL + '/api/json?tree=jobs[displayName,url,color,lastBuild[building,timestamp],' +
      'jobs[displayName,url,color,lastBuild[building,timestamp],' +
      'jobs[displayName,url,color,lastBuild[building,timestamp],' +
      'jobs[displayName,url,color,lastBuild[building,timestamp]]]]]' +
      '&pretty=true';

    bot.http(url)
      .header('Authorization', `Basic ${auth}`)
      .get()((err, response, body) => {
        if (response.statusCode == 200) {
          msg.reply('buscando sistema...');
        } else if (response.statusCode == 404) {
          msg.reply('Não encontrei nenhum sistema');
        }

        const result = JSON.parse(body);
        let resList = [];
        resList = findProjectByName(result, project, resList);
        let message = '';
        resList.forEach(p => {
          message += p.displayName + "\n";
        });

        if (message == '') {
          const dialog = switchBoard.startDialog(msg,5000);
          msg.reply('Não encontrei nenhum sistema com o filtro informado, tente informar um filtro diferente');
          dialog.addChoice(/(.*)/i, (msg) => {
            const job = msg.match[1].replace(msg.robot.name + ' ', '');
            findProjects(msg, project);
          });
        } else {
          msg.reply(`Encontrei os seguintes sistemas: \n${message}`);
          msg.reply('Escolha um deles.');
        }

        dialog.dialogTimeout = (msg3) => {
          return;
        };
      })
  }

  const findJobByName = (content, resList, jobName) => {
    let job, _i, _len;
    const _ref1 = content.jobs;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      job = _ref1[_i];
      if (job._class === 'hudson.model.FreeStyleProject') {
        if (like(job.displayName, jobName)) {
          resList.push(job);
        }
      } else if (job._class === 'com.cloudbees.hudson.plugins.folder.Folder') {
        findJobByName(job, resList, jobName);
      }
    }
    return resList;
  };

  const findProjectByName = (content, projectName, resList) => {
    let projeto, _i, _len;
    const _ref1 = content.jobs;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      projeto = _ref1[_i];
      if (projeto._class === 'com.cloudbees.hudson.plugins.folder.Folder') {
        if (like(projeto.displayName, projectName)) {
          resList.push(projeto);
        }
        findProjectByName(projeto, projectName, resList);
      }
    }
    return resList;
  };

  const like = (compare, compared) => {
    const regex = new RegExp('^' + compared, 'i');
    return regex.test(compare);
  };

  const getStatus = (job) => {
    const state = job.color === 'red' 
      ? 'Failed :x:' : job.color === 'notbuilt' 
      ? 'Not Built :no_entry:' : job.color === 'yellow' 
      ? 'Unstable :warning:' : job.color === 'blue' 
      ? 'Success :white_check_mark:' : 'Not defined';

    return `${job.displayName}:${state}`;
  }
}

