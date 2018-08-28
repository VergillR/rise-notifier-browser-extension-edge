/* global chrome, TweenMax */
const version = 'v.1.0.0'
const sourceUrl = 'https://www.novaprisma.pro/rise'
const sourceUrl2 = 'https://rise-latest-transactions.herokuapp.com/json/'
const sourcePriceUrl = 'https://api.coinmarketcap.com/v1/ticker/RISE/'
const explorerUrl = 'https://explorer.rise.vision/address/'
// for checking missed blocks: use sourceOfflineMessages appended with the type matching the messages that are watched ('/fetchall', '/fetchin' or '/fetchout') and then '?' + the starting blockheight (e.g. '?blockheight=1225674') and '&' + for each valid, non-empty address (up to 5; e.g. '&address1=15200025131276213840R&address2=14414875305937957714R')
// e.g. 'https://rise-latest-transactions.herokuapp.com/fetchall/?blockheight=1225674&address1=15200025131276213840R&address2=14414875305937957714R'
const sourceOfflineMessages = 'https://www.novaprisma.pro/'
const sourceOfflineMessages2 = 'https://rise-latest-transactions.herokuapp.com/'

const getText = (name) => chrome.i18n.getMessage(name)
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1)

const longToNormalAmount = (longAmount) => parseInt(longAmount, 10) / Math.pow(10, 8)

const riseEpoch = 1464109200

const capitalizeInputValue = (input) => String(document.getElementById(input).value).toUpperCase()
const getElement = (description, value) => {
  const txt = document.createElement('DIV')
  txt.innerHTML = `<span class='description'>${description}:</span> <span class='val'>${value}</span>`
  return txt
}

const enterAnimation = (top = 100) => TweenMax.from('.ui.segments', 0.8, { top, opacity: 0 })
const leaveAnimation = (top = -600) => TweenMax.to('.ui.segments', 0.8, { top, opacity: 0, ease: Power1.easeOut })
