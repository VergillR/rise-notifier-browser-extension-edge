/* global chrome, browser, version, getText, sourcePriceUrl */
let sourcePrice

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
    'useSourcePrice',
    'sourcePrice2'
  ], function (item) {
    let numberOfValidAddresses = ([ item.address1, item.address2, item.address3, item.address4, item.address5 ].filter(c => c.match(/^\d{15,30}R$/i))).length
    const watchmessages = item.watchmessages.toString()
    document.getElementById('numberofvalidaddresses').textContent = numberOfValidAddresses === 1 ? numberOfValidAddresses.toString() + ' RISE ' + getText('p_address') : numberOfValidAddresses.toString() + ' RISE ' + getText('p_addresses')

    if (watchmessages === '3') {
      document.getElementById('watchingmessages').textContent = getText('watch_outgoing')
    } else if (watchmessages === '2') {
      document.getElementById('watchingmessages').textContent = getText('watch_incoming')
    } else {
      document.getElementById('watchingmessages').textContent = getText('watch_all')
    }
    sourcePrice = item.useSourcePrice.toString() === '2' ? item.sourcePrice2 : sourcePriceUrl
    if (!checkPrice()) {
      document.getElementById('riseusd').textContent = item.riseusd.toString()
      document.getElementById('risebtc').textContent = item.risebtc.toString()
    }
  })
}

function checkPrice () {
  if (sourcePrice !== undefined) {
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
