/* global browser, chrome, enterAnimation, leaveAnimation, version, getText, explorerUrl, capitalize, capitalizeInputValue, longToNormalAmount, riseRegex */
let currentaddresses = []

/**
 * Read all necessary info from localStorage and populate the web page with that information whenever the options page is opened
 */
function restoreOptions () {
  enterAnimation()
  document.title = capitalize(getText('addresses'))
  document.getElementById('i_title').textContent = getText('extName') + ' ' + version
  document.getElementById('moreaddresses').textContent = getText('more_addresses')
  document.getElementById('i_addresses').textContent = 'RISE ' + capitalize(getText('addresses'))
  document.getElementById('i_address1').textContent = capitalize(getText('address')) + ' 1:'
  document.getElementById('i_address2').textContent = capitalize(getText('address')) + ' 2:'
  document.getElementById('i_address3').textContent = capitalize(getText('address')) + ' 3:'
  document.getElementById('saveaddresses').textContent = getText('button_save')
  document.getElementById('canceladdresses').textContent = getText('button_cancel')
  document.querySelectorAll('.blockexplorer').forEach((elem) => {
    elem.textContent = getText('check_blockexplorer')
  })
  document.querySelectorAll('.userinput').forEach((elem) => {
    elem.setAttribute('placeholder', getText('opt_address_placeholder'))
  })
  chrome.storage.local.get([
    'address1',
    'address2',
    'address3',
    'address1name',
    'address2name',
    'address3name',
    'address1amount',
    'address2amount',
    'address3amount',
    'address1twosig',
    'address2twosig',
    'address3twosig',
    'address1delegate',
    'address2delegate',
    'address3delegate',
    'address1delegateProd',
    'address2delegateProd',
    'address3delegateProd'
  ], function (item) {
    currentaddresses[0] = item.address1
    currentaddresses[1] = item.address2
    currentaddresses[2] = item.address3
    currentaddresses.map((val, index) => {
      document.getElementById(`address${index + 1}`).value = val || ''
      if (val) {
        if (item[`address${index + 1}name`]) {
          document.getElementById(`address${index + 1}name`).innerHTML = '<i class="icon teal user"></i>' + item[`address${index + 1}name`]
          document.getElementById(`address${index + 1}name`).setAttribute('class', `ui horizontal label`)
        }
        if (item[`address${index + 1}amount`].toString() !== '-1') {
          document.getElementById(`address${index + 1}amount`).textContent = (longToNormalAmount(parseInt(item[`address${index + 1}amount`], 10)) || 0) + ' RISE'
          document.getElementById(`address${index + 1}amount`).setAttribute('class', `ui horizontal label`)
          document.getElementById(`address${index + 1}url`).setAttribute('href', `${explorerUrl}${val}`)
          document.getElementById(`address${index + 1}url`).removeAttribute('hidden')
          if (item[`address${index + 1}twosig`]) {
            document.getElementById(`address${index + 1}twosig`).innerHTML = '<i class="icon yellow key"></i>2 ' + getText('m_signatures').toLowerCase()
            document.getElementById(`address${index + 1}twosig`).setAttribute('class', `ui horizontal label`)
          }
          if (item[`address${index + 1}delegate`]) {
            const prod = item[`address${index + 1}delegateProd`] ? ` (${item[`address${index + 1}delegateProd`]} %)` : ''
            document.getElementById(`address${index + 1}delegate`).innerHTML = '<i class="icon blue pencil alternate"></i>' + item[`address${index + 1}delegate`] + prod
            document.getElementById(`address${index + 1}delegate`).setAttribute('class', `ui icon horizontal label`)
          }
        } else {
          document.getElementById(`address${index + 1}amount`).innerHTML = `<i class="icon red exclamation triangle"></i>${getText('address_not_found')}`
          document.getElementById(`address${index + 1}amount`).setAttribute('class', `ui horizontal label`)
        }
      }
    })
  })
}

/**
 * Check if the given address is a valid RISE address; also, show an error on the web page if the address was not valid
 * @param {string} address
 * @param {number} addressnr
 * @param {string[]} allAddresses
 * @returns {boolean} validity
 */
function validateAddress (address, addressnr, allAddresses) {
  if (address === '') {
    document.getElementById(`address${addressnr + 1}note`).textContent = ''
    document.getElementById(`address${addressnr + 1}note`).setAttribute('hidden', 'hidden')
    return true
  } else if (address.match(riseRegex)) {
    if (!isDuplicate(address, addressnr, allAddresses)) {
      document.getElementById(`address${addressnr + 1}note`).textContent = ''
      document.getElementById(`address${addressnr + 1}note`).setAttribute('hidden', 'hidden')
      return true
    } else {
      document.getElementById(`address${addressnr + 1}note`).textContent = getText('same_address')
      document.getElementById(`address${addressnr + 1}note`).removeAttribute('hidden')
      return false
    }
  } else {
    document.getElementById(`address${addressnr + 1}note`).textContent = getText('validation_error')
    document.getElementById(`address${addressnr + 1}note`).removeAttribute('hidden')
    return false
  }
}

/**
 * Checks if the address was already entered before
 * @param {string} address
 * @param {number} addressnr
 * @param {string[]} allAddresses
 * @returns {boolean} duplicate
 */
function isDuplicate (address, addressnr, allAddresses) {
  if (addressnr > 0) {
    let p = 0
    while (p < addressnr) {
      if (address === allAddresses[p]) {
        return true
      }
      p++
    }
  }
  return false
}

/**
 * Validate the user input and if there were no errors, save all user input to localStorage and reload the app
 */
function saveOptions () {
  const address1 = capitalizeInputValue('address1').trim()
  const address2 = capitalizeInputValue('address2').trim()
  const address3 = capitalizeInputValue('address3').trim()
  const addresses = [ address1, address2, address3 ]

  const allAddressesValid = (addresses.map((c, index) => validateAddress(c, index, addresses))).filter(c => !c).length === 0
  if (allAddressesValid) {
    let changeObj = {}
    for (let i = 0; i < addresses.length; i++) {
      if (addresses[i] !== currentaddresses[i]) {
        changeObj[`address${i + 1}`] = addresses[i]
        changeObj[`address${i + 1}name`] = ''
        changeObj[`address${i + 1}amount`] = -1
        changeObj[`address${i + 1}twosig`] = ''
        changeObj[`address${i + 1}delegate`] = ''
        changeObj[`address${i + 1}delegateProd`] = ''
      }
    }
    chrome.storage.local.set(changeObj, function () {
      chrome.runtime.reload()
      window.close()
    })
  }
}

/**
 * Open the options page and close the current window
 */
function gotoOptions () {
  window.close()
  browser.windows.create({
    url: './options.html'
  })
}

/**
 * Closes the current window and return to the popup screen
 */
function closeOptions () {
  leaveAnimation(document.body.scrollWidth * 1.8)
  setTimeout(() => {
    window.open('./popup.html', '_self')
  }, 300)
}

document.body.onload = restoreOptions
document.getElementById('moreaddresses').addEventListener('click', gotoOptions)
document.getElementById('saveaddresses').addEventListener('click', saveOptions)
document.getElementById('canceladdresses').addEventListener('click', closeOptions)
