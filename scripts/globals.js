/* global chrome, TweenMax */
/* This file contains all global functions and values for the extension */
const version = 'v.1.0.0'

// rise.js is retrieved from https://unpkg.com/risejs@1.4.1/dist/browser/index.js
const rise = window.rise

// these urls are default values that cannot be changed by the user; the user can add an extra data source url and price url in the Options screen
const sourceUrl = 'http://www.novaprisma.icu'

const explorerUrl = 'https://explorer.rise.vision/address/'

const sourcePrice = 'https://api.coinmarketcap.com/v1/ticker/RISE/'

// regex used to validate RISE addresses which means: start with 15 to 30 digits and end with the capital letter 'R'
const riseRegex = /^\d{15,30}R$/i

/**
 * Get text based on the browser's language with i18n
 * @param {string} name The label of the message as defined in "messages.json"
 * @returns {string} Translated text
 */
const getText = (name) => chrome.i18n.getMessage(name)

/**
 * Capitalizes the first letter of a given string
 * @param {string} text
 * @returns {string} Capitalized text
 */
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1)

/**
 * Converts the original RISE amount to a human readable value including decimals
 * @param {number} longAmount RISE amount as recorded on the network (i.e. a very long integer value)
 * @returns {number} Normal RISE amount
 */
const longToNormalAmount = (longAmount) => parseInt(longAmount, 10) / Math.pow(10, 8)

const riseEpoch = 1464109200

/**
 * Converts user input to uppercased text
 * @param {string} input User input
 * @returns {string} Uppercased text
 */
const capitalizeInputValue = (input) => String(document.getElementById(input).value).toUpperCase()
/**
 * Creates and returns a HTML element with 2 child nodes based on the given description and value
 * @param {string} description Label
 * @param {string} value Value
 * @returns {HTMLElement} New HTML element
 */
const getElement = (description, value) => {
  const el = document.createElement('DIV')
  el.innerHTML = `<span class='description'>${description}:</span> <span class='val'>${value}</span>`
  return el
}
/**
 * Simple animation where the content slides from right to left
 * @param {number} [left=100] Starting x-coordinate
 */
const enterAnimation = (left = 100) => TweenMax.from('.ui.segments', 0.8, { left, opacity: 0 })
/**
 * Simple animation where the content slides from left to right
 * @param {number} [width=-600] Width of the target HTML element
 */
const leaveAnimation = (width = 300) => TweenMax.to('.ui.segments', 0.8, { left: width, opacity: 0, ease: Power1.easeOut })
