/* global browser, getText, longToNormalAmount, sourceUrl, sourceUrl2, riseRegex */
/** RISE Notifications Web Extension v.1.0 created for RISE by Vergill Lemmert, August 2018 */
// Web Extensions are not allowed to poll faster than ~60 seconds, so source should not have a polltime below 60 seconds, but preferably 90 seconds or more
let source
let startup
let lastMatchIds = []
let checkPricesCooldown = false
const chrome = browser

/**
 * Load an outside script (holding the global variables and functions) into the current file
 * @param {string} scriptName The script (with global functions) that needs to be imported
 * @param {function} callback Function that is called after the script was imported
 */
function loadScript (scriptName, callback) {
  const script = document.createElement('script')
  script.src = chrome.extension.getURL(`./scripts/${scriptName}.js`)
  script.addEventListener('load', callback, false)
  document.head.appendChild(script)
}

/**
 * Initialize the extension; it imports the script with global functions and then starts the alarm
 * @param {string} scriptName The script (with global functions that need to be imported)
 */
function initLoadScript (scriptName = 'globals') {
  startup = true
  loadScript('globals', () => {
    chrome.storage.local.get([ 'transactions', 'useSource', 'source3', 'alertPriceChangeOnStartup', 'checkOfflineMessages', 'watchmessages', 'lastseenblockheight' ], (item) => {
      if (item.useSource) {
        source = (item.useSource.toString() === '3') ? item.source3 : (item.useSource.toString() === '2' ? sourceUrl2 : sourceUrl)
      } else {
        source = sourceUrl
      }
      if (!source.endsWith('/')) source += '/'
      let t = item.transactions
      if (t && Array.isArray(t) && t.reverse().length > 0) {
        lastMatchIds = (t[1] ? [ ...t[0], ...t[1] ] : t[0]).map((element, index) => element.id)
      }
      chrome.browserAction.setBadgeText({ text: '' })
      setTimeout(() => {
        checkPrice(item.alertPriceChangeOnStartup && item.alertPriceChangeOnStartup.toString() === '1')
        checkAccounts(true, true)
        if (item.checkOfflineMessages && item.checkOfflineMessages.toString() === '1' && item.lastseenblockheight > 1) {
          getOfflineMessages(item.watchmessages, getLastBlockheightAtStartup)
        } else {
          getLastBlockheightAtStartup(item.lastseenblockheight)
        }
      }, 5000)
      setInterval(() => {
        alarmListener()
      }, 60000)
      setTimeout(() => {
        startup = false
      }, 15000)
    })
  })
}

initLoadScript('globals')

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['transactions', 'messages', 'watchmessages', 'address1', 'address2', 'address3', 'address4', 'address5', 'address1amount', 'address2amount', 'address3amount', 'address4amount', 'address5amount', 'address1delegate', 'address2delegate', 'address3delegate', 'address4delegate', 'address5delegate', 'address1delegateProd', 'address2delegateProd', 'address3delegateProd', 'address4delegate', 'address5delegateProd', 'lastseenblockheight', 'riseUsd', 'riseBtc', 'source3', 'useSource', 'checkOfflineMessages', 'alertPriceChangeOnStartup'], (item) => {
    const initObject = {}
    if (!item.transactions) initObject.transactions = []
    if (!item.messages) initObject.messages = []
    if (!item.watchmessages) initObject.watchmessages = '1'
    if (!item.lastseenblockheight) initObject.lastseenblockheight = 1
    if (!item.checkOfflineMessages) initObject.checkOfflineMessages = '1'
    if (!item.alertPriceChangeOnStartup) initObject.alertPriceChangeOnStartup = '2'
    if (!item.address1amount) initObject.address1amount = -1
    if (!item.address2amount) initObject.address2amount = -1
    if (!item.address3amount) initObject.address3amount = -1
    if (!item.address4amount) initObject.address4amount = -1
    if (!item.address5amount) initObject.address5amount = -1
    if (!item.address1delegate) initObject.address1delegate = ''
    if (!item.address2delegate) initObject.address2delegate = ''
    if (!item.address3delegate) initObject.address3delegate = ''
    if (!item.address4delegate) initObject.address4delegate = ''
    if (!item.address5delegate) initObject.address5delegate = ''
    if (!item.address1delegateProd) initObject.address1delegateProd = ''
    if (!item.address2delegateProd) initObject.address2delegateProd = ''
    if (!item.address3delegateProd) initObject.address3delegateProd = ''
    if (!item.address4delegateProd) initObject.address4delegateProd = ''
    if (!item.address5delegateProd) initObject.address5delegateProd = ''
    if (!item.address1twosig) initObject.address1twosig = ''
    if (!item.address2twosig) initObject.address2twosig = ''
    if (!item.address3twosig) initObject.address3twosig = ''
    if (!item.address4twosig) initObject.address4twosig = ''
    if (!item.address5twosig) initObject.address5twosig = ''
    if (!item.address1name) initObject.address1name = ''
    if (!item.address2name) initObject.address2name = ''
    if (!item.address3name) initObject.address3name = ''
    if (!item.address4name) initObject.address4name = ''
    if (!item.address5name) initObject.address5name = ''
    if (!item.address1 && item.address1 !== '') initObject.address1 = ''
    if (!item.address2 && item.address2 !== '') initObject.address2 = ''
    if (!item.address3 && item.address3 !== '') initObject.address3 = ''
    if (!item.address4 && item.address4 !== '') initObject.address4 = ''
    if (!item.address5 && item.address5 !== '') initObject.address5 = ''
    if (!item.riseusd) initObject.riseusd = 0
    if (!item.risebtc) initObject.risebtc = 0
    if (!item.source3) initObject.source3 = ''
    if (!item.useSource) initObject.useSource = '1'

    chrome.storage.local.set(initObject, () => { if (!startup) initLoadScript('globals') })
  })
})

/**
 * Send a request for information to the target site
 * @param {string} url The url of the target site
 * @param {function} errorCallback Callback function to be called when an error has occurred
 * @param {function} successCallback Callback function to be called after a response was received
 */
function xhrCall (url, errorCallback = () => {}, callback = () => {}) {
  if (url !== undefined) {
    let xhr = new window.XMLHttpRequest()
    xhr.open('GET', url, true)
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText)
            callback(response)
          } catch (e) {
            errorCallback()
          }
        } else {
          errorCallback()
        }
      }
    }
    xhr.send()
  }
}

/**
 * Request the highest (most recent) block height from the source; then record the highest block height into localStorage
 * @param {number} [lastSeenBlockheight=1] The highest block height that was recorded by the program
 */
function getLastBlockheightAtStartup (lastSeenBlockheight = 1) {
  if (!source) return
  // the source page for last blockheight is source + 'rise_data/'
  const sourceLastBlockheight = source + 'rise_data/'
  xhrCall(sourceLastBlockheight,
    () => {
      notifyConnectionProblems(sourceLastBlockheight)
    },
    (response) => {
      if (typeof response === 'object') {
        const lastBlockheight = parseInt(response['last-blockheight-checked'], 10) || 1
        chrome.storage.local.set({ lastseenblockheight: Math.max(lastBlockheight, lastSeenBlockheight) })
      }
    })
}

/**
 * Request and process account info of all the RISE addresses stored in localStorage; optionally, request delegate info as well
 * @param {boolean} [includeDelegateInfo=false] Whether or not to also request delegate info
 * @param {boolean} [allowUnconfirmedBalance=true] Whether or not to request unconfirmed balance (if false, request confirmed balance)
 */
function checkAccounts (includeDelegateInfo = false, allowUnconfirmedBalance = true) {
  if (!source) return
  chrome.storage.local.get([ 'address1', 'address2', 'address3', 'address4', 'address5' ], (item) => {
    const addresses = [ item.address1, item.address2, item.address3, item.address4, item.address5 ]
    let amountObj = {}
    let twosigObj = {}
    let delegatesObj = {}
    let delegatesProdObj = {}
    let nameObj = {}
    if (addresses.length > 0) {
      let url = `${source}rise_accounts?delegate=${includeDelegateInfo ? 1 : 0}`
      for (let z = 0; z < addresses.length; z++) {
        url += `&address${z + 1}=${addresses[z] || 1}`
      }
      xhrCall(url,
        () => {
          notifyConnectionProblems(url)
        },
        (response) => {
          if (Array.isArray(response) && response.length > 0) {
            for (let i = 0; i < response.length; i++) {
              if (response[i] !== null) {
                try {
                  if (allowUnconfirmedBalance) {
                    amountObj[`address${i + 1}amount`] = response[i].account.unconfirmedBalance
                  } else {
                    amountObj[`address${i + 1}amount`] = response[i].account.balance
                  }
                  twosigObj[`address${i + 1}twosig`] = response[i].account.secondSignature.toString() === '1' ? '1' : ''
                } catch (e) { amountObj[`address${i + 1}amount`] = -1 }
                if (includeDelegateInfo) {
                  try { delegatesObj[`address${i + 1}delegate`] = response[i].delegates[0].username } catch (e) {}
                  try { delegatesProdObj[`address${i + 1}delegateProd`] = response[i].delegates[0].productivity } catch (e) {}
                  try { nameObj[`address${i + 1}name`] = response[i].delegate.username } catch (e) {}
                }
              }
            }
            chrome.storage.local.set(Object.assign({}, amountObj, twosigObj, delegatesObj, delegatesProdObj, nameObj))
          }
        })
    }
  })
}

/**
 * Request price info; optionally, also display a price notification
 * @param {boolean} [alertOnStartup=false] Whether or not to show a notification (only used at startup)
 * @param {function} [callbackOnComplete=()=>{}] Callback function after the response was written to localStorage
 */
function checkPrice (alertOnStartup = false, callbackOnComplete = () => {}) {
  if (!source || checkPricesCooldown) return
  // prevent spamming this function when the popup screen is opened repeatedly
  checkPricesCooldown = true
  setTimeout(() => {
    checkPricesCooldown = false
  }, 480000)
  const sourcePriceUrl = source + 'rise_prices/'
  xhrCall(sourcePriceUrl,
    () => {
      callbackOnComplete(false)
      notifyConnectionProblems(sourcePriceUrl)
    },
    (response) => {
      if (Array.isArray(response)) {
        const resp = response[0]
        if (typeof resp === 'object' && resp.id.toString().toUpperCase() === 'RISE') {
          chrome.storage.local.set({ riseusd: resp.price_usd, risebtc: resp.price_btc }, () => {
            callbackOnComplete(resp)
            if (startup && alertOnStartup) {
              let message
              if (resp.percent_change_1h !== 'undefined' && resp.percent_change_24h !== 'undefined') {
                const change1H = parseFloat(resp.percent_change_1h, 10) || 0.00
                const change24H = parseFloat(resp.percent_change_24h, 10) || 0.00
                message = `${change1H >= 0 ? `1h: +${change1H}%` : `1h: ${change1H}%`}\n${change24H >= 0 ? `24h: +${change24H}%` : `24h: ${change24H}%`}`
              }
              const iconUrl = './images/rise_notification_price.png'
              chrome.notifications.create({
                type: 'basic',
                iconUrl,
                title: `RISE/USD ${resp.price_usd}`,
                message,
                priority: 0
              })
            }
          })
        }
      }
    })
}

/**
 * Sort transaction objects from new to old based on their timestamp
 * @param {{ timestamp: number }} a Object containing all properties of a transaction, including the property timestamp
 * @param {{ timestamp: number }} b Object containing all properties of a transaction, including the property timestamp
 */
function compare (a, b) {
  return b.timestamp - a.timestamp
}

/**
 * Request transactions for the period (based on block height) that the extension was offline
 * @param {number} [type=1] Type of transactions to request: 1 = all, 2 = only incoming, 3 = only outgoing
 * @param {function} callbackOnComplete Callback function to be called after a response was received
 */
function getOfflineMessages (type = '1', callbackOnComplete = () => {}) {
  if (!source) return
  chrome.storage.local.get([ 'lastseenblockheight', 'address1', 'address2', 'address3', 'address4', 'address5', 'messages', 'transactions' ], (item) => {
    const addresses = [ item.address1, item.address2, item.address3, item.address4, item.address5 ].filter((e) => e && e.match(riseRegex))
    if (addresses.length > 0) {
      const typeUrl = type === '1' ? 'fetchall' : (type === '2' ? 'fetchin' : 'fetchout')
      let url = `${source}rise_${typeUrl}?blockheight=${item.lastseenblockheight}`
      for (let z = 0; z < addresses.length; z++) {
        url += `&address${z + 1}=${addresses[z]}`
      }
      xhrCall(url,
        () => {
          notifyConnectionProblems(url)
        },
        (response) => {
          if (Array.isArray(response) && response.length > 0) {
            let results = []
            let amount = 0
            let highestblockheight = response[0].height || item.lastseenblockheight
            for (let i = 0; i < response.length; i++) {
              let posAmount = 0
              let negAmount = 0
              // sending to oneself, voting, registering a delegate or second signature should only count as 1 transaction (instead of 2)
              const posResults = response[i].filter(c => addresses.indexOf(c.recipientId) !== -1 && addresses.indexOf(c.senderId) === -1)
              if (posResults.length > 0) {
                posAmount = posResults.reduce((acc, value) => { acc += value.amount; return acc }, 0)
              }
              const negResults = response[i].filter(c => addresses.indexOf(c.senderId) !== -1)
              if (negResults.length > 0) {
                negAmount = negResults.reduce((acc, value) => { acc += value.amount; return acc }, 0)
              }
              results = [ ...results, ...posResults, ...negResults ]
              amount = amount + posAmount - negAmount
            }
            results = results.filter((val, index) => lastMatchIds.indexOf(val.id) === -1)
            results.sort(compare)
            lastMatchIds = lastMatchIds.concat(results.map(c => c.id))
            amount = longToNormalAmount(amount)

            const positiveAmount = amount > 0
            const length = results.length
            if (length > 0) {
              amount = Math.abs(amount)
              const title = positiveAmount ? `${getText('received')}: ${amount} RISE` : `${getText('sent')}: ${amount} RISE`
              const message = length > 1 ? `${getText('n_therewere')} ${length.toString()} ${getText('n_transactions')}.` : `${getText('n_therewas')} 1 ${getText('n_transaction')}.`
              // store to latest results object; if transactions object has 10 entries, then also discard the oldest entry
              const logmessage = `${title} (${length.toString()} ${length === 1 ? getText('n_transaction') : getText('n_transactions')})`
              const allmessages = item.messages.length + 1 < 11 ? item.messages.concat([logmessage]) : item.messages.concat([logmessage]).slice(1)
              const transfers = item.transactions.length + 1 < 11 ? item.transactions.concat([results]) : item.transactions.concat([results]).slice(1)
              positiveAmount ? chrome.browserAction.setBadgeBackgroundColor({color: '#22AB23'}) : chrome.browserAction.setBadgeBackgroundColor({color: '#D94523'})
              chrome.storage.local.set({ transactions: transfers, messages: allmessages }, () => {
                // update the blockheight to the newest system data
                callbackOnComplete(highestblockheight)
                // notify the user
                chrome.browserAction.setBadgeText({ text: length.toString() })
                const iconUrl = positiveAmount ? 'images/rise_notification_posAmount.png' : 'images/rise_notification_negAmount.png'
                chrome.notifications.create({
                  type: 'basic',
                  iconUrl,
                  title,
                  message,
                  priority: 0
                })
              })
            } else {
              callbackOnComplete(item.lastseenblockheight)
            }
          } else {
            callbackOnComplete(item.lastseenblockheight)
          }
        })
    }
  })
}

/**
 * Display a notification in case an error occurred after calling xhrCall(), e.g. when the server did not respond or the url does not exist
 * @param {string} url Url of the target site
 */
function notifyConnectionProblems (url) {
  chrome.browserAction.getBadgeText({}, (result) => {
    if (result !== 'X') {
      chrome.browserAction.setBadgeBackgroundColor({color: '#DF1100'})
      chrome.browserAction.setBadgeText({ text: 'X' })
      chrome.notifications.create({
        type: 'basic',
        iconUrl: './images/rise_notification_problem.png',
        title: getText('connection_error'),
        message: `${url}`,
        priority: 0
      })
    }
  })
}

/**
 * After every time interval, send a request to the source to check recent transactions; if a transaction involved one of the RISE addresses stored in localStorage then display a notification
 */
function alarmListener () {
  if (!source || startup) return
  const url = source + 'rise_latest_transactions/'
  xhrCall(url,
    () => {
      notifyConnectionProblems(url)
    },
    (response) => {
      if (typeof response === 'object') {
        // there was at least 1 transaction so check if it matches any given RISE addresses
        if (response.transactions.length > 0) {
          chrome.storage.local.get(['address1', 'address2', 'address3', 'address4', 'address5', 'watchmessages', 'transactions', 'messages', 'lastseenblockheight'], (item) => {
            const resp = response.transactions
            chrome.storage.local.set({ lastseenblockheight: resp[0].height })
            const watchmessages = item.watchmessages.toString()
            let results = []
            const addresses = [ item.address1, item.address2, item.address3, item.address4, item.address5 ]
            let amount = 0
            if (watchmessages === '1') {
              let posAmount = 0
              let negAmount = 0
              // sending to oneself, voting, registering a delegate or second signature should only count as 1 transaction (instead of 2)
              const posResults = resp.filter(c => addresses.indexOf(c.recipientId) !== -1 && addresses.indexOf(c.senderId) === -1)
              if (posResults.length > 0) {
                posAmount = posResults.reduce((acc, value) => { acc += value.amount; return acc }, 0)
              }
              const negResults = resp.filter(c => addresses.indexOf(c.senderId) !== -1)
              if (negResults.length > 0) {
                negAmount = negResults.reduce((acc, value) => { acc += value.amount; return acc }, 0)
              }
              results = [ ...posResults, ...negResults ]
              amount = longToNormalAmount(posAmount - negAmount)
            } else if (watchmessages === '2') {
              results = resp.filter(c => addresses.indexOf(c.receiverId) !== -1 && addresses.indexOf(c.senderId) === -1)
              amount = results.reduce((acc, value) => { acc += value.amount; return acc }, 0)
              amount = longToNormalAmount(amount)
            } else if (watchmessages === '3') {
              results = resp.filter(c => addresses.indexOf(c.senderId) !== -1)
              amount = results.reduce((acc, value) => { acc -= value.amount; return acc }, 0)
              amount = longToNormalAmount(amount)
            }
            // remove any result that has the same transaction id already seen in a previous response block
            results = results.filter((val, index) => lastMatchIds.indexOf(val.id) === -1)
            results.sort(compare)
            const positiveAmount = amount > 0
            const length = results.length
            if (length > 0) {
              lastMatchIds = results.map(c => c.id)
              amount = Math.abs(amount)
              const title = positiveAmount ? `${getText('received')}: ${amount} RISE` : `${getText('sent')}: ${amount} RISE`
              const message = length > 1 ? `${getText('n_therewere')} ${length.toString()} ${getText('n_transactions')}.` : `${getText('n_therewas')} 1 ${getText('n_transaction')}.`
              // store to latest results object; if transactions object has 10 entries, then also discard the oldest entry
              const logmessage = `${title} (${length.toString()} ${length === 1 ? getText('n_transaction') : getText('n_transactions')})`
              const allmessages = item.messages.length + 1 < 11 ? item.messages.concat([logmessage]) : item.messages.concat([logmessage]).slice(1)
              const transfers = item.transactions.length + 1 < 11 ? item.transactions.concat([results]) : item.transactions.concat([results]).slice(1)
              positiveAmount ? chrome.browserAction.setBadgeBackgroundColor({color: '#22AB23'}) : chrome.browserAction.setBadgeBackgroundColor({color: '#D94523'})
              chrome.storage.local.set({ transactions: transfers, messages: allmessages }, () => {
                // get new account balances (including unconfirmed balances)
                checkAccounts(false, true)
                // notify the user
                chrome.browserAction.setBadgeText({ text: length.toString() })
                const iconUrl = positiveAmount ? 'images/rise_notification_posAmount.png' : 'images/rise_notification_negAmount.png'
                chrome.notifications.create({
                  type: 'basic',
                  iconUrl,
                  title,
                  message,
                  priority: 0
                })
              })
            }
          })
        } else {
          // the response object does not contain any transactions
        }
      } else {
        // the response was not an object
      }
    })
}

chrome.notifications.onClosed.addListener((notificationId, byUser) => {
  if (byUser) {
    chrome.browserAction.setBadgeText({text: ''})
  }
})
