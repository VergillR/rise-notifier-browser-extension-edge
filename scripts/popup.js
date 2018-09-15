/* global browser, chrome, version, getText, leaveAnimation */

/**
 * Read all necessary info from localStorage and populate the web page with that information whenever the options page is opened
 */
function start () {
  document.title = getText('extName')
  document.getElementById('view').textContent = getText('p_viewlastmessages')
  document.getElementById('i_title').textContent = getText('extName')
  document.getElementById('versionnumber').textContent = version
  chrome.storage.local.get([
    'address1',
    'address2',
    'address3',
    'address4',
    'address5',
    'watchmessages',
    'lastsystemblockheight',
    'riseusd',
    'risebtc'
  ], function (item) {
    let numberOfValidAddresses = ([ item.address1, item.address2, item.address3, item.address4, item.address5 ].filter(c => c.match(/^\d{15,30}R$/i))).length
    const watchmessages = item.watchmessages.toString()
    document.getElementById('numberofvalidaddresses').textContent = numberOfValidAddresses === 1 ? numberOfValidAddresses.toString() + ' RISE ' + getText('address') : numberOfValidAddresses.toString() + ' RISE ' + getText('addresses')
    if (watchmessages === '3') {
      document.getElementById('watchingmessages').textContent = getText('watch_outgoing')
    } else if (watchmessages === '2') {
      document.getElementById('watchingmessages').textContent = getText('watch_incoming')
    } else {
      document.getElementById('watchingmessages').textContent = getText('watch_all')
    }
    // runs the function checkPrice from background.js to get the latest price info from data source
    chrome.runtime.getBackgroundPage((background) => {
      background.checkPrice(false, (resp) => {
        document.getElementById('riseusd').textContent = item.riseusd.toString()
        document.getElementById('risebtc').textContent = item.risebtc.toString()
      })
    })
  })
}

/**
 * Open the page with the last messages
 */
function viewLastMessages () {
  chrome.browserAction.setBadgeText({text: ''})
  window.close()
  browser.windows.create({ url: 'view_latest_changes.html' })
}

/**
 * Open the options_addresses page
 */
function gotoOptionsAddresses () {
  leaveAnimation(0 - document.body.scrollWidth)
  setTimeout(() => {
    window.open('options_addresses.html', '_self')
  }, 500)
}

/**
 * Open the options_watchmessages page
 */
function gotoWatchMessages () {
  leaveAnimation(0 - document.body.scrollWidth)
  setTimeout(() => {
    window.open('options_watchmessages.html', '_self')
  }, 500)
}

document.body.onload = start
document.getElementById('bottombutton').addEventListener('click', viewLastMessages)
document.getElementById('gotoaddresses').addEventListener('click', gotoOptionsAddresses)
document.getElementById('gotowatchmessages').addEventListener('click', gotoWatchMessages)
