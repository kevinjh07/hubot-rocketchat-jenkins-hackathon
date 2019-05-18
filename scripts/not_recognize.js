module.exports = (bot) => {
  bot.catchAll((msg) => {
    msg.reply('Desculpe, não entendi. :(');
    msg.reply('Você pode procurar por *ajuda*.');
  });
};
