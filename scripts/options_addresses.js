/* global chrome, browser, enterAnimation, leaveAnimation, version, getText, explorerUrl, capitalizeInputValue */

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
    'address3'
  ], function (item) {
    const addresses = [ item.address1, item.address2, item.address3 ]
    addresses.map((val, index) => {
      document.getElementById(`address${index + 1}`).value = val || ''
      if (val) {
        document.getElementById(`address${index + 1}url`).setAttribute('href', `${explorerUrl}${val}`)
        document.getElementById(`address${index + 1}url`).removeAttribute('hidden')
      }
    })
  })
}

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

function saveOptions () {
  const address1 = capitalizeInputValue('address1').trim()
  const address2 = capitalizeInputValue('address2').trim()
  const address3 = capitalizeInputValue('address3').trim()

  const allAddressesValid = ([ address1, address2, address3 ].map((c, index) => validateAddress(c, index))).filter(c => !c).length === 0
  if (allAddressesValid) {
    chrome.storage.local.set({
      address1,
      address2,
      address3
    }, function () {
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
