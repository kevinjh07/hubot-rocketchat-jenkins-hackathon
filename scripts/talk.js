// Description:
//    An example script, tells you the time. See below on how documentation works.
//    https://github.com/hubotio/hubot/blob/master/docs/scripting.md#documenting-scripts
// 
// Commands:
//    bot what time is it? - Tells you the time
//    bot what's the time? - Tells you the time
//
const Conversation = require('hubot-conversation');

module.exports = (robot) => {
  robot.respond(/(oi|ola|olá|ei|Boa tarde|boa noite|bom dia)/i, (res) => {
    res.reply(`Olá *${res.envelope.user.name}*, eu sou o JenkinsBot`);
    res.reply(`estou aqui para te auxiliar na execução e verificação de status das Jobs do Jenkins. :robot:`);
    res.reply(`Em que posso te ajudar?`);
  });
  
  robot.respond(/((.*) fome|(.*) almoço?|(.*) comer?)/i, (res) => {
    res.reply(`Tem a Marmita do Mauri na Geladeira! :grin:`);
  });
  
  robot.respond(/((.*) help | (.*) ajuda?|help|ajuda|o que voce|vc|você faz?)/i, (res) => {
    res.reply(`Em que posso te ajudar?`);
    res.reply(`- Executar Job`);
    res.reply(`- Jobs quebradas?`);
    res.reply(`- Buscar Jobs`);
  });
  
  robot.respond(/(como vc esta?|como você está?|tudo bem?|tudo bom?)/i, (res) => {
    const comoEstou = ['estou muito bem! :smile:', 'não estou em um dia bom hoje :sweat:', 'estou um pouco cansado :sleeping:'];
    const switchBoard = new Conversation(robot);
    const dialog = switchBoard.startDialog(res,  5000);
    const rnd = res.random(comoEstou);
    res.reply(`${rnd} como você está?`);
    dialog.addChoice(/((.*)bem|bem)/i,function(msg2){
      msg2.reply(`que bom ${msg2.envelope.user.name}`);
    });

    dialog.addChoice(/((.*) mal|mal)/i, (msg2) => {
      msg2.reply(`que ruim :sweat: ${msg2.envelope.user.name}`)
    });

    dialog.dialogTimeout = (msg3) => { 
      return;
    };
  });
}
