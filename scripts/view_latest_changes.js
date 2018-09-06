/* global chrome, moment, getText, longToNormalAmount, riseEpoch, capitalize, getElement */
/**
 * Converts a RISE timestamp to a human readable date
 * @param {number} riseTimestamp The timestamp as recorded on the RISE network
 * @returns {string} Date
 */
const getMomentFromRiseTimestamp = (riseTimestamp) => moment(riseEpoch * 1000).add(riseTimestamp, 'seconds').format(getText('momentformat'))
let labels = {}

/**
 * Toggles the visibility of transaction details
 */
function showDetails () {
  let el = document.getElementById('showdetails')
  if (el.getAttribute('class') === 'show ui teal button') {
    document.querySelectorAll('.detail').forEach((elem) => {
      elem.setAttribute('hidden', 'hidden')
    })
    el.textContent = getText('button_showdetails')
    el.setAttribute('class', 'hide ui blue button')
  } else {
    document.querySelectorAll('.detail').forEach((elem) => {
      elem.removeAttribute('hidden')
    })
    el.textContent = getText('button_hidedetails')
    el.setAttribute('class', 'show ui teal button')
  }
}

/** The Labels object contains all label fields with their correct translation
 * @typedef {Object} Labels
 */

/**
 * Preloads and returns all text for the labels to increase performance
 * @returns {Labels} Labels object which contains translated text for all known label fields
 */
function preloadLabels () {
  // the field 'confirmations' is ignored as confirmations have no meaning in notifications
  const labels = {}
  const allKnownFields = [ 'senderId', 'recipientId', 'height', 'blockId', 'timestamp', 'amount', 'fee', 'id', 'signatures', 'asset', 'type', 'rowId', 'signSignature', 'recipientPublicKey', 'requesterPublicKey', 'senderPublicKey', 'signature', 'code', '0', '1', '2', '3', '4', '5', '6', '7' ]
  for (let i = 0; i < allKnownFields.length; i++) {
    switch (allKnownFields[i]) {
      case 'senderId':
        labels[allKnownFields[i]] = getText('m_sender')
        break
      case 'recipientId':
        labels[allKnownFields[i]] = getText('m_recipient')
        break
      case 'id':
        labels[allKnownFields[i]] = getText('m_transactionid')
        break
      case 'blockId':
        labels[allKnownFields[i]] = getText('m_blockid')
        break
      case 'height':
        labels[allKnownFields[i]] = getText('m_blockheight')
        break
      case 'recipientPublicKey':
        labels[allKnownFields[i]] = getText('m_requesterPublicKey')
        break
      case 'timestamp':
        labels[allKnownFields[i]] = getText('m_time')
        break
      case '0':
        labels[allKnownFields[i]] = getText('n_transaction')
        break
      case '1':
        labels[allKnownFields[i]] = getText('t_secondsig')
        break
      case '2':
        labels[allKnownFields[i]] = getText('t_delegate')
        break
      case '3':
        labels[allKnownFields[i]] = getText('t_vote')
        break
      case '4':
        labels[allKnownFields[i]] = getText('t_multisig')
        break
      case '5':
        labels[allKnownFields[i]] = getText('t_dapp')
        break
      case '6':
        labels[allKnownFields[i]] = getText('t_transfer_in')
        break
      case '7':
        labels[allKnownFields[i]] = getText('t_transfer_out')
        break
      default:
        labels[allKnownFields[i]] = getText(`m_${allKnownFields[i]}`)
    }
  }
  return labels
}

/**
 * Read all necessary info from localStorage and populate the web page with that information whenever the options page is opened
 */
function start () {
  moment.locale(getText('locale'))
  labels = Object.freeze(preloadLabels())
  document.title = getText('m_lastmessages')
  document.getElementById('showdetails').textContent = getText('button_showdetails')
  document.getElementById('lastmessages').textContent = getText('m_lastmessages')

  chrome.storage.local.get(['transactions', 'messages', 'address1', 'address2', 'address3', 'address4', 'address5'], (item) => {
    if (item.transactions) {
      // the entries in the array go from old to new, so array needs to be reversed first; senderId determines whether the transaction is considered incoming or outgoing
      const addresses = [ item.address1, item.address2, item.address3, item.address4, item.address5 ]
      const data = item.transactions.concat([]).reverse()
      const titlemessages = item.messages.concat([]).reverse()
      if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
          const name = `messages${i + 1}`
          const title = document.createElement('H3')
          title.setAttribute('id', name + 'title')
          title.setAttribute('class', 'title ui block header')
          title.textContent = titlemessages[i]
          document.getElementById(name).appendChild(title)
          for (let j = 0; j < data[i].length; j++) {
            let temp = data[i][j]
            const base = ' base'
            const detail = ' detail'
            let info = base
            for (let item in temp) {
              let node = document.createElement('DIV')
              let txt
              if (item === 'senderId') {
                if (item !== '') {
                  if (addresses.indexOf(temp[item]) !== -1) {
                    document.getElementById(name).setAttribute('class', 'ui orange segment outgoing')
                  }
                }
                txt = getElement(labels[item], temp[item])
                info = base
              } else if (item === 'recipientId') {
                if (item !== '') {
                  if (addresses.indexOf(temp[item]) !== -1) {
                    document.getElementById(name).setAttribute('class', 'ui green segment incoming')
                  }
                }
                txt = getElement(labels[item], temp[item])
                info = base
              } else if (item === 'height') {
                txt = getElement(labels[item], temp[item])
                info = detail
              } else if (item === 'blockId') {
                txt = getElement(labels[item], temp[item])
                info = detail
              } else if (item === 'timestamp') {
                txt = getElement(labels[item], getMomentFromRiseTimestamp(parseInt(temp[item], 10)))
                info = base
              } else if (item === 'amount' || item === 'fee') {
                txt = getElement(labels[item], longToNormalAmount(parseInt(temp[item], 10)))
                info = base
              } else if (item === 'confirmations') {
                continue
              } else if (item === 'id') {
                txt = getElement(labels[item], temp[item])
                info = detail
              } else if (item === 'signatures' || item === 'asset') {
                txt = getElement(labels[item], JSON.stringify(temp[item]))
                info = detail
              } else if (item === 'type') {
                let description = ''
                switch (parseInt(temp[item], 10)) {
                  case 1:
                    description = labels['1']
                    break
                  case 2:
                    description = labels['2']
                    break
                  case 3:
                    description = labels['3']
                    break
                  case 4:
                    description = labels['4']
                    break
                  case 5:
                    description = labels['5']
                    break
                  case 6:
                    description = labels['6']
                    break
                  case 7:
                    description = labels['7']
                    break
                  case 0:
                  default:
                    description = capitalize(labels['0'])
                }
                txt = getElement(labels[item], `${description} (${labels['code']} ${temp[item]})`)
                info = base
              } else {
                txt = getElement(labels[item] || capitalize(item), temp[item])
                info = detail
              }
              node.appendChild(txt)
              document.getElementById(name).appendChild(node)
              node.setAttribute('class', item + info)
              if (info !== base) {
                node.setAttribute('hidden', 'hidden')
              }
            }
            const hr = document.createElement('HR')
            document.getElementById(name).appendChild(hr)
          }
        }
      }
    }
  })
}

document.body.onload = start
document.getElementById('showdetails').addEventListener('click', showDetails)
