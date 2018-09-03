/* global browser, chrome, version, getText, sourceUrl, sourceUrl2 */
let activeSource

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
    'risebtc',
    'useSource',
    'source3'
  ], function (item) {
    let numberOfValidAddresses = ([ item.address1, item.address2, item.address3, item.address4, item.address5 ].filter(c => c.match(/^\d{15,30}R$/i))).length
    const watchmessages = item.watchmessages.toString()
    document.getElementById('numberofvalidaddresses').textContent = numberOfValidAddresses === 1 ? numberOfValidAddresses.toString() + ' RISE ' + getText('p_address') : numberOfValidAddresses.toString() + ' RISE ' + getText('p_addresses')
    // sourceUrl and sourceUrl2 are defined in functions.js; only the user defined source3 is retrieved from local storage
    if (item.useSource.toString() === '1') {
      activeSource = sourceUrl
    } else if (item.useSource.toString() === '2') {
      activeSource = sourceUrl2
    } else if (item.useSource.toString() === '3') {
      activeSource = item.source3
    }
    if (watchmessages === '3') {
      document.getElementById('watchingmessages').textContent = getText('watch_outgoing')
    } else if (watchmessages === '2') {
      document.getElementById('watchingmessages').textContent = getText('watch_incoming')
    } else {
      document.getElementById('watchingmessages').textContent = getText('watch_all')
    }
    if (!checkPrice()) {
      // if checkPrice fails then use the last recorded values from storage
      document.getElementById('riseusd').textContent = item.riseusd.toString()
      document.getElementById('risebtc').textContent = item.risebtc.toString()
    }
  })
}

function checkPrice () {
  if (activeSource !== undefined) {
    const sourcePrice = activeSource.endsWith('/') ? activeSource + 'prices/' : activeSource + '/prices/'
    let xhr = new window.XMLHttpRequest()
    xhr.open('GET', sourcePrice, true)
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText)
            if (Array.isArray(response)) {
              const resp = response[0]
              if (typeof resp === 'object' && resp.id.toString().toUpperCase() === 'RISE') {
                chrome.storage.local.set({ riseusd: resp.price_usd, risebtc: resp.price_btc }, () => {
                  document.getElementById('riseusd').textContent = resp.price_usd.toString()
                  document.getElementById('risebtc').textContent = resp.price_btc.toString()
                  return true
                })
              }
            }
          } catch (e) {
            console.warn(`Could not get price from ${sourcePrice}:\n`, e)
            return false
          }
        } else {
          console.warn(`Could not get price from ${sourcePrice}`)
          return false
        }
      }
    }
    xhr.send()
  } else {
    return false
  }
}

function viewLastMessages () {
  chrome.browserAction.setBadgeText({text: ''})
  window.close()
  browser.windows.create({ url: 'view_latest_changes.html' })
}

document.body.onload = start
document.getElementById('bottombutton').addEventListener('click', viewLastMessages)
