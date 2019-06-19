function output(prefix, message) {
  let formattedMessage = message.toString().trim().split('\n')
    .reduce((acc, line) => `${acc}${ acc !== '' ? '\n' : '' }${prefix} ${line}`, '')

  console.log(formattedMessage)
}

export function formatOutputStream(name, {stdout, stderr}) {
  stdout.on('data', data => output(`[${name}] `.grey, data))
  stderr.on('data', data => output(`[${name}] `.grey, data))
}
