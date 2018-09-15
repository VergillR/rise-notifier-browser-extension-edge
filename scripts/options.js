/* global chrome, version, getText, sourceUrl2, explorerUrl, capitalize, capitalizeInputValue, longToNormalAmount */
let currentaddresses = []

/**
 * Check if the given address is a valid RISE address; also, show an error on the web page if the address was not valid
 * @param {string} address
 * @param {number} addressnr
 * @returns {boolean} validity
 */
function validateAddress (address, addressnr) {
  // address is either empty string or matches the regex /^\d{15,30}R$/
  if (address === '' || address.match(/^\d{15,30}R$/)) {
    document.getElementById(`address${addressnr + 1}note`).textContent = ''
    document.getElementById(`address${addressnr + 1}note`).setAttribute('hidden', 'hidden')
    return true
  } else {
    document.getElementById(`address${addressnr + 1}note`).textContent = getText('validation_error')
    document.getElementById(`address${addressnr + 1}note`).removeAttribute('hidden')
    return false
  }
}

/**
 * Read all necessary info from localStorage and populate the web page with that information whenever the options page is opened
 */
function restoreAllOptions () {
  document.title = getText('options')
  document.getElementById('i_title').textContent = getText('extName') + ' ' + version
  document.getElementById('i_addresses').textContent = 'RISE ' + getText('addresses')
  const ids = [ 'i_address1', 'i_address2', 'i_address3', 'i_address4', 'i_address5' ]
  for (let i = 0; i < ids.length; i++) {
    document.getElementById(ids[i]).textContent = `${capitalize(getText('address'))} ${i + 1} :`
  }
  document.getElementById('saveaddresses').textContent = getText('button_save')
  document.getElementById('savemessages').textContent = getText('button_save')
  document.getElementById('savesources').textContent = getText('button_save')
  document.getElementById('sources').textContent = getText('sources')
  document.getElementById('atstartup').textContent = `${getText('startup')}:`
  document.getElementById('labelcheckstartup').textContent = getText('checkstartup')
  document.getElementById('labelcheckpricediff').textContent = getText('show_pricechange')
  document.getElementById('datasourcelabel1').textContent = `${getText('source')} 1 (${getText('data')}):`
  document.getElementById('datasourcelabel2').textContent = `${getText('source')} 2 (${getText('data')}):`
  document.getElementById('datasourcelabel3').textContent = `${getText('source')} 3 (${getText('data')}):`
  document.querySelectorAll('.canceloptions').forEach((elem) => { elem.textContent = getText('button_cancel') })
  document.querySelectorAll('.blockexplorer').forEach((elem) => { elem.textContent = getText('check_blockexplorer') })
  document.querySelectorAll('.userinput').forEach((elem) => { elem.setAttribute('placeholder', getText('opt_address_placeholder')) })
  document.querySelectorAll('.urlinput').forEach((elem) => { elem.setAttribute('placeholder', getText('opt_url_placeholder')) })
  document.getElementById('transactionsquestion').textContent = getText('watch_question')
  document.getElementById('i_all').textContent = getText('watch_all')
  document.getElementById('i_incoming').textContent = getText('watch_incoming')
  document.getElementById('i_outgoing').textContent = getText('watch_outgoing')

  chrome.storage.local.get([
    'address1',
    'address2',
    'address3',
    'address4',
    'address5',
    'address1name',
    'address2name',
    'address3name',
    'address4name',
    'address5name',
    'address1amount',
    'address2amount',
    'address3amount',
    'address4amount',
    'address5amount',
    'address1twosig',
    'address2twosig',
    'address3twosig',
    'address4twosig',
    'address5twosig',
    'address1delegate',
    'address2delegate',
    'address3delegate',
    'address4delegate',
    'address5delegate',
    'watchmessages',
    'useSource',
    'source3',
    'checkOfflineMessages',
    'alertPriceChangeOnStartup'
  ], function (item) {
    currentaddresses[0] = item.address1
    currentaddresses[1] = item.address2
    currentaddresses[2] = item.address3
    currentaddresses[3] = item.address4
    currentaddresses[4] = item.address5
    currentaddresses.map((val, index) => {
      document.getElementById(`address${index + 1}`).value = val || ''
      if (val) {
        if (item[`address${index + 1}amount`].toString() !== '-1') {
          if (item[`address${index + 1}name`]) {
            document.getElementById(`address${index + 1}name`).innerHTML = '<i class="icon teal user"></i>' + item[`address${index + 1}name`]
            document.getElementById(`address${index + 1}name`).setAttribute('class', `ui horizontal label`)
          }
          document.getElementById(`address${index + 1}amount`).textContent = (longToNormalAmount(parseInt(item[`address${index + 1}amount`], 10)) || 0) + ' RISE'
          document.getElementById(`address${index + 1}amount`).setAttribute('class', `ui horizontal label`)
          document.getElementById(`address${index + 1}url`).setAttribute('href', `${explorerUrl}${val}`)
          document.getElementById(`address${index + 1}url`).removeAttribute('hidden')
          if (item[`address${index + 1}twosig`]) {
            document.getElementById(`address${index + 1}twosig`).innerHTML = '<i class="icon yellow key"></i>2 ' + getText('m_signatures').toLowerCase()
            document.getElementById(`address${index + 1}twosig`).setAttribute('class', `ui horizontal label`)
          }
          if (item[`address${index + 1}delegate`]) {
            document.getElementById(`address${index + 1}delegate`).innerHTML = '<i class="icon blue pencil alternate"></i>' + item[`address${index + 1}delegate`]
            document.getElementById(`address${index + 1}delegate`).setAttribute('class', `ui icon horizontal label`)
          }
        } else {
          document.getElementById(`address${index + 1}amount`).innerHTML = `<i class="icon red exclamation triangle"></i>${getText('address_not_found')}`
          document.getElementById(`address${index + 1}amount`).setAttribute('class', `ui horizontal label`)
        }
      }
    })
    const watchmessages = item.watchmessages.toString()
    if (watchmessages === '3') {
      document.getElementById('watchOutgoing').checked = true
    } else if (watchmessages === '2') {
      document.getElementById('watchIncoming').checked = true
    } else {
      document.getElementById('watchAll').checked = true
    }
    if (item.checkOfflineMessages.toString() === '1') {
      document.getElementById('checkstartup').checked = true
    }
    if (item.alertPriceChangeOnStartup.toString() === '1') {
      document.getElementById('checkpricediff').checked = true
    }
    document.getElementById('source1').value = 'default' // or sourceUrl
    document.getElementById('source2').value = sourceUrl2
    document.getElementById('source3').value = item.source3
    if (item.useSource.toString() === '3') {
      document.getElementById('datasource3').checked = true
    } else if (item.useSource.toString() === '2') {
      document.getElementById('datasource2').checked = true
    } else {
      document.getElementById('datasource1').checked = true
    }
  })
}

/**
 * Validate the user input and if there were no errors, save all user input to localStorage and reload the app
 */
function saveAll () {
  const address1 = capitalizeInputValue('address1').trim()
  const address2 = capitalizeInputValue('address2').trim()
  const address3 = capitalizeInputValue('address3').trim()
  const address4 = capitalizeInputValue('address4').trim()
  const address5 = capitalizeInputValue('address5').trim()
  const addresses = [ address1, address2, address3, address4, address5 ]

  const allAddressesValid = (addresses.map((c, index) => validateAddress(c, index))).filter(c => !c).length === 0
  if (allAddressesValid) {
    let changeObj = {}
    for (let i = 0; i < addresses.length; i++) {
      if (addresses[i] !== currentaddresses[i]) {
        changeObj[`address${i + 1}`] = addresses[i]
        changeObj[`address${i + 1}name`] = ''
        changeObj[`address${i + 1}amount`] = -1
        changeObj[`address${i + 1}twosig`] = ''
        changeObj[`address${i + 1}delegate`] = ''
      }
    }
    changeObj.watchmessages = document.querySelector('input[name="watch"]:checked').value
    changeObj.checkOfflineMessages = document.querySelector('input[name="checkstartup"]').checked ? '1' : '2'
    changeObj.alertPriceChangeOnStartup = document.querySelector('input[name="checkpricediff"]').checked ? '1' : '2'
    changeObj.useSource = document.querySelector('input[name="datasource"]:checked').value
    changeObj.source3 = String(document.getElementById('source3').value).trim()

    chrome.storage.local.set(changeObj, function () {
      chrome.runtime.reload()
      window.close()
    })
  }
}

/**
 * Closes the current window
 */
function closeWindow () {
  window.close()
}

document.body.onload = restoreAllOptions
document.getElementById('savemessages').addEventListener('click', saveAll)
document.getElementById('saveaddresses').addEventListener('click', saveAll)
document.getElementById('savesources').addEventListener('click', saveAll)
document.querySelectorAll('.canceloptions').forEach((elem) => elem.addEventListener('click', closeWindow))
