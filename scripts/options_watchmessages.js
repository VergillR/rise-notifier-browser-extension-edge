/* global chrome, enterAnimation, leaveAnimation, version, getText */

function start () {
  enterAnimation()
  document.title = getText('opt_title_transactions')
  document.getElementById('i_title').textContent = getText('extName') + ' ' + version
  document.getElementById('savemessages').textContent = getText('button_save')
  document.getElementById('cancelmessages').textContent = getText('button_cancel')
  document.getElementById('transactionsquestion').textContent = getText('watch_question')
  document.getElementById('i_all').textContent = getText('watch_all')
  document.getElementById('i_incoming').textContent = getText('watch_incoming')
  document.getElementById('i_outgoing').textContent = getText('watch_outgoing')

  chrome.storage.local.get([
    'watchmessages'
  ], function (item) {
    const watchmessages = item.watchmessages.toString()
    if (watchmessages === '3') {
      document.getElementById('watchOutgoing').checked = true
    } else if (watchmessages === '2') {
      document.getElementById('watchIncoming').checked = true
    } else {
      document.getElementById('watchAll').checked = true
    }
  })
}

function saveOptions () {
  let watchmessages = document.querySelector('input[name="watch"]:checked').value
  chrome.storage.local.set({
    watchmessages
  }, function () {
    chrome.runtime.reload()
    window.close()
  })
}

function closeOptions () {
  leaveAnimation(-400)
  setTimeout(() => {
    window.open('./popup.html', '_self')
  }, 300)
}

document.body.onload = start
document.getElementById('savemessages').addEventListener('click', saveOptions)
document.getElementById('cancelmessages').addEventListener('click', closeOptions)
