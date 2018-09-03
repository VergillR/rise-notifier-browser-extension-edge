/* global browser, chrome, enterAnimation, leaveAnimation, version, getText, explorerUrl, capitalizeInputValue, longToNormalAmount */
let currentaddress1
let currentaddress2
let currentaddress3

function restoreOptions () {
  enterAnimation()
  document.title = getText('opt_title_addresses')
  document.getElementById('i_title').textContent = getText('extName') + ' ' + version
  document.getElementById('moreaddresses').textContent = getText('more_addresses')
  document.getElementById('i_addresses').textContent = getText('opt_riseaddresses')
  document.getElementById('i_address1').textContent = getText('opt_riseaddress') + ' 1:'
  document.getElementById('i_address2').textContent = getText('opt_riseaddress') + ' 2:'
  document.getElementById('i_address3').textContent = getText('opt_riseaddress') + ' 3:'
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
    'address1amount',
    'address2amount',
    'address3amount',
    'address1delegate',
    'address2delegate',
    'address3delegate'
  ], function (item) {
    currentaddress1 = item.address1
    currentaddress2 = item.address2
    currentaddress3 = item.address3
    const addresses = [ item.address1, item.address2, item.address3 ]
    addresses.map((val, index) => {
      document.getElementById(`address${index + 1}`).value = val || ''
      if (val) {
        document.getElementById(`address${index + 1}url`).setAttribute('href', `${explorerUrl}${val}`)
        document.getElementById(`address${index + 1}url`).removeAttribute('hidden')
        if (item[`address${index + 1}amount`]) {
          document.getElementById(`address${index + 1}amount`).textContent = (longToNormalAmount(parseInt(item[`address${index + 1}amount`], 10)) || 0) + ' RISE'
          document.getElementById(`address${index + 1}amount`).setAttribute('class', `ui label`)
        }
        if (item[`address${index + 1}delegate`]) {
          document.getElementById(`address${index + 1}delegate`).textContent = item[`address${index + 1}delegate`]
          document.getElementById(`address${index + 1}delegate`).setAttribute('class', `ui label`)
        }
      }
    })
  })
}

function validateAddress (address, addressnr) {
  // address is either empty string or matches the regex /^\d{15,30}R$/
  console.log(`${address} has match ${address.match(/^\d{15,30}R$/)}`)
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

function saveOptions () {
  const address1 = capitalizeInputValue('address1').trim()
  const address2 = capitalizeInputValue('address2').trim()
  const address3 = capitalizeInputValue('address3').trim()

  const allAddressesValid = ([ address1, address2, address3 ].map((c, index) => validateAddress(c, index))).filter(c => !c).length === 0
  if (allAddressesValid) {
    let changeObj = {}
    if (address1 !== currentaddress1) {
      changeObj.address1 = address1
      changeObj.address1amount = 0
      changeObj.address1delegate = ''
    }
    if (address2 !== currentaddress2) {
      changeObj.address2 = address2
      changeObj.address2amount = 0
      changeObj.address2delegate = ''
    }
    if (address3 !== currentaddress3) {
      changeObj.address3 = address3
      changeObj.address3amount = 0
      changeObj.address3delegate = ''
    }
    chrome.storage.local.set(changeObj, function () {
      chrome.runtime.reload()
      window.close()
    })
  }
}

function gotoOptions () {
  window.close()
  browser.windows.create({
    url: './options.html'
  })
}

function closeOptions () {
  leaveAnimation(-800)
  setTimeout(() => {
    window.open('./popup.html', '_self')
  }, 300)
}

document.body.onload = restoreOptions
document.getElementById('moreaddresses').addEventListener('click', gotoOptions)
document.getElementById('saveaddresses').addEventListener('click', saveOptions)
document.getElementById('canceladdresses').addEventListener('click', closeOptions)
