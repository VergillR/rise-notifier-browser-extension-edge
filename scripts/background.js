/* global browser, getText, longToNormalAmount, sourceUrl, sourceUrl2, sourcePriceUrl */
/** RISE Notifications Web Extension v.1.0 created for RISE by Vergill Lemmert, August 2018 */
// Web Extensions are not allowed to poll faster than ~60 seconds, so source should not have a polltime below 60 seconds, but preferably 90 seconds or more
let source
let sourcePrice
let startup = true
const chrome = browser

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['transactions', 'messages', 'watchmessages', 'address1', 'address2', 'address3', 'address4', 'address5', 'lastseenblockheight', 'lastseentransactionid', 'riseUsd', 'riseBtc', 'source3', 'sourcePrice2', 'useSource', 'useSourcePrice', 'checkOfflineMessages', 'alertPriceChangeOnStartup'], (item) => {
    let initObject = {}
    if (!item.transactions) {
      initObject.transactions = []
    }
    if (!item.messages) {
      initObject.messages = []
    }
    if (!item.watchmessages) {
      initObject.watchmessages = '1'
    }
    if (!item.lastseenblockheight) {
      initObject.lastseenblockheight = 1
    }
    if (!item.lastseentransactionid) {
      initObject.lastseentransactionid = 1
    }
    if (!item.checkOfflineMessages) {
      initObject.checkOfflineMessages = '1'
    }
    if (!item.alertPriceChangeOnStartup) {
      initObject.alertPriceChangeOnStartup = '1'
    }
    if (!item.address1 && item.address1 !== '') {
      initObject.address1 = ''
    }
    if (!item.address2 && item.address2 !== '') {
      initObject.address2 = ''
    }
    if (!item.address3 && item.address3 !== '') {
      initObject.address3 = ''
    }
    if (!item.address4 && item.address4 !== '') {
      initObject.address4 = ''
    }
    if (!item.address5 && item.address5 !== '') {
      initObject.address5 = ''
    }
    if (!item.riseusd) {
      initObject.riseusd = 0
    }
    if (!item.risebtc) {
      initObject.risebtc = 0
    }
    if (!item.source3) {
      initObject.source3 = ''
    }
    if (!item.sourcePrice2) {
      initObject.sourcePrice2 = ''
    }
    if (!item.useSource) {
      initObject.useSource = '1'
    }
    if (!item.useSourcePrice) {
      initObject.useSourcePrice = '1'
    }

    chrome.storage.local.set(initObject, () => {
      console.log('Initialization success')
    })
  })
})

function loadScript (scriptName, callback) {
  const script = document.createElement('script')
  script.src = chrome.extension.getURL(`./scripts/${scriptName}.js`)
  script.addEventListener('load', callback, false)
  document.head.appendChild(script)
}

document.body.onload = loadScript('functions', () => {
  chrome.storage.local.get([ 'useSource', 'useSourcePrice', 'source3', 'sourcePrice2', 'checkOfflineMessages', 'watchmessages', 'lastseenblockheight' ], (item) => {
    source = (item.useSource && item.useSource.toString() === '3') ? item.source3 : (item.useSource.toString() === '2' ? sourceUrl2 : sourceUrl)
    if (!source.endsWith('/')) {
      source += '/'
    }
    sourcePrice = (item.useSourcePrice && item.useSourcePrice.toString() === '2') ? item.sourcePrice2 : sourcePriceUrl
    chrome.browserAction.setBadgeText({ text: '' })
    setTimeout(() => {
      console.log('loadScript >> setTimeout has run')
      checkPrice(startup)
      if (item.checkOfflineMessages.toString() === '1' && item.lastseenblockheight > 1) {
        getOfflineMessages(item.watchmessages, getLastBlockheightAtStartup)
      } else {
        getLastBlockheightAtStartup(item.lastseenblockheight)
      }
    }, 15000)
    setInterval(() => {
      alarmListener()
    }, 60000)
  })
})

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
            if (!startup) {
              console.log(e)
              errorCallback()
            }
          }
        } else {
          errorCallback()
        }
      }
    }
    xhr.send()
  }
}

function getLastBlockheightAtStartup (lastSeenBlockheight = 1) {
  // the source page for last blockheight is sourceOffline + 'data/'
  const sourceLastBlockheight = source + 'data/'
  xhrCall(sourceLastBlockheight,
    () => {
      console.warn(`Could not get latest blockheight from:\n${sourceLastBlockheight}`)
      notifyConnectionProblems(sourceLastBlockheight)
    },
    (response) => {
      if (typeof response !== 'object') {
        console.warn(`Could not get latest blockheight because response was not an object: ${response}`)
      } else {
        const lastBlockheight = parseInt(response['last-blockheight-checked'], 10) || 1
        chrome.storage.local.set({ lastseenblockheight: Math.max(lastBlockheight, lastSeenBlockheight) })
      }
    })
}

function checkPrice (alertOnStartup = false) {
  xhrCall(sourcePrice,
    () => {
      console.warn(`Could not get price from:\n${sourcePrice}`)
      if (!startup) {
        notifyConnectionProblems(sourcePrice)
      }
    },
    (response) => {
      if (Array.isArray(response)) {
        const resp = response[0]
        if (typeof resp === 'object' && resp.id.toString().toUpperCase() === 'RISE') {
          chrome.storage.local.set({ riseusd: resp.price_usd, risebtc: resp.price_btc }, () => {
            if (alertOnStartup && startup) {
              chrome.storage.local.get(['alertPriceChangeOnStartup'], (item) => {
                if (item.alertPriceChangeOnStartup.toString() === '1') {
                  // alert the price change in RISE/USD
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
          })
        }
      }
    })
}

function compare (a, b) {
  // sort from new to old based on timestamp
  return b.timestamp - a.timestamp
}

function getOfflineMessages (type = '1', callbackOnComplete = () => {}) {
  chrome.storage.local.get([ 'lastseenblockheight', 'address1', 'address2', 'address3', 'address4', 'address5', 'messages', 'transactions' ], (item) => {
    const addresses = [ item.address1, item.address2, item.address3, item.address4, item.address5 ].filter((e) => e && e.match(/^\d{15,30}R$/))
    if (addresses.length > 0) {
      const typeUrl = type === '1' ? 'fetchall' : (type === '2' ? 'fetchin' : 'fetchout')
      let url = `${source}${typeUrl}?blockheight=${item.lastseenblockheight}`
      for (let z = 0; z < addresses.length; z++) {
        url += `&address${z + 1}=${addresses[z]}`
      }
      xhrCall(url,
        () => {
          console.warn(`Could not get offline messages:\n${url}`)
          notifyConnectionProblems(url)
        },
        (response) => {
          if (Array.isArray(response) && response.length > 0) {
            let results = []
            let amount = 0
            for (let i = 0; i < response.length; i++) {
              let posAmount = 0
              let negAmount = 0
              // sending to oneself, voting, registering a delegate or second signature should only count as 1 transaction (instead of 2)
              const posResults = response[i].filter(c => addresses.indexOf(c.recipientId) !== -1 && addresses.indexOf(c.senderId) === -1)
              if (posResults.length > 0) {
                posAmount = posResults.reduce((acc, value) => {
                  acc += value.amount
                  return acc
                }, 0)
              }
              const negResults = response[i].filter(c => addresses.indexOf(c.senderId) !== -1)
              if (negResults.length > 0) {
                negAmount = negResults.reduce((acc, value) => {
                  acc += value.amount
                  return acc
                }, 0)
              }
              results = [ ...results, ...posResults, ...negResults ]
              amount = amount + posAmount - negAmount
            }
            results.sort(compare)
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
                callbackOnComplete(item.lastseenblockheight)
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

function alarmListener () {
  const url = source + 'rise/'
  xhrCall(url,
    () => {
      console.warn(`Could not get transactions from:\n${url}`)
      notifyConnectionProblems(url)
      startup = false
    },
    (response) => {
      if (typeof response === 'object') {
        // there was at least 1 transaction so check if it matches any given RISE addresses
        if (response.transactions.length > 0) {
          chrome.storage.local.get(['address1', 'address2', 'address3', 'address4', 'address5', 'watchmessages', 'transactions', 'messages', 'lastseenblockheight', 'lastseentransactionid'], (item) => {
            const resp = response.transactions
            let lastblock = item.lastseenblockheight
            let lastid = item.lastseentransactionid
            if (startup) {
              // on startup, prevent double message for the same transaction/block
              startup = false
              const highestBlockheight = resp.reduce((acc, value) => { acc = Math.max(acc, value.height); return acc }, 0)
              if (highestBlockheight <= item.lastseenblockheight) {
                return
              }
            }
            const watchmessages = item.watchmessages.toString()
            if (resp[resp.length - 1].height === lastblock && resp[resp.length - 1].id === lastid) {
              // this response object has already been processed
              console.log(`Already seen this response object with lastblock ${lastblock} and lastid ${lastid}`)
            } else {
              lastblock = resp[resp.length - 1].height
              lastid = resp[resp.length - 1].id
              chrome.storage.local.set({ lastseenblockheight: lastblock, lastseentransactionid: lastid })
              let results = []
              const addresses = [ item.address1, item.address2, item.address3, item.address4, item.address5 ]
              let amount = 0
              if (watchmessages === '1') {
                let posAmount = 0
                let negAmount = 0
                // sending to oneself, voting, registering a delegate or second signature should only count as 1 transaction (instead of 2)
                const posResults = resp.filter(c => addresses.indexOf(c.recipientId) !== -1 && addresses.indexOf(c.senderId) === -1)
                if (posResults.length > 0) {
                  posAmount = posResults.reduce((acc, value) => {
                    acc += value.amount
                    return acc
                  }, 0)
                }
                const negResults = resp.filter(c => addresses.indexOf(c.senderId) !== -1)
                if (negResults.length > 0) {
                  negAmount = negResults.reduce((acc, value) => {
                    acc += value.amount
                    return acc
                  }, 0)
                }
                results = [ ...posResults, ...negResults ].sort(compare)
                amount = longToNormalAmount(posAmount - negAmount)
              } else if (watchmessages === '2') {
                results = resp.filter(c => addresses.indexOf(c.receiverId) !== -1 && addresses.indexOf(c.senderId) === -1).sort(compare)
                amount = results.reduce((acc, value) => {
                  acc += value.amount
                  return acc
                }, 0)
                amount = longToNormalAmount(amount)
              } else if (watchmessages === '3') {
                results = resp.filter(c => addresses.indexOf(c.senderId) !== -1).sort(compare)
                amount = results.reduce((acc, value) => {
                  acc -= value.amount
                  return acc
                }, 0)
                amount = longToNormalAmount(amount)
              }
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
            }
          })
        } else {
          if (startup) {
            startup = false
          }
          console.log('The response object does not contain any transactions')
        }
      } else {
        if (startup) {
          startup = false
        }
        console.warn('The response was not an object')
      }
    })
}

chrome.notifications.onClosed.addListener((notificationId, byUser) => {
  if (byUser) {
    chrome.browserAction.setBadgeText({text: ''})
  }
})
