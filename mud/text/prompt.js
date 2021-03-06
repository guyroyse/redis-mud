let Builder = require('./builder')

class Prompt {
  fetchPrompt(context) {
    return new Builder()
      .yellow('You are in').space()
      .magenta(context.room.name).space().text(`[${context.room.id}]`)
      .reset()
      .build()
  }
}

module.exports = Prompt
