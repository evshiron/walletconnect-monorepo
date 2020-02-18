import MobileRegistry from '@walletconnect/mobile-registry'
import { IMobileRegistryEntry } from '@walletconnect/types'
import { appendToQueryString, isIOS, isMobile } from '@walletconnect/utils'
import * as qrImage from 'qr-image'

import logo from './logo.svg'
import * as constants from './constants'
import './style.css'

let document: Document
if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
  document = window.document
}

function formatQRCodeImage (data: string) {
  let result = ''
  const dataString = qrImage.imageSync(data, { type: 'svg' })
  if (typeof dataString === 'string') {
    result = dataString.replace(
      '<svg',
      `<svg class="walletconnect-qrcode__image"`
    )
  }
  return result
}

function formatQRCodeContent (uri: string) {
  const qrCodeImage = formatQRCodeImage(uri)
  const callToAction = 'Scan QR code with a WalletConnect-compatible wallet'
  return `
    <div>
      <p id="walletconnect-qrcode-text" class="walletconnect-qrcode__text">
        ${callToAction}
      </p>
      ${qrCodeImage}
    </div>
  `
}

function formatDeepLinkHref (uri: string, entry: IMobileRegistryEntry) {
  const encodedUri: string = encodeURIComponent(uri)
  const redirectUrlQueryString = appendToQueryString(window.location.search, {
    walletconnect: true
  })
  const redirectUrl: string = encodeURIComponent(
    `${window.location.origin}${window.location.pathname}${redirectUrlQueryString}`
  )

  return entry.universalLink
    ? `${entry.universalLink}/wc?uri=${encodedUri}&redirectUrl=${redirectUrl}`
    : entry.deepLink
      ? `{wallet.deepLink}${uri}`
      : ''
}

function formatSingleConnectButton (name: string, color: string, href: string) {
  return `
    <a href="${href}" target="_blank" rel="noopener noreferrer">
      <div
        id="walletconnect-connect-button-${name}"
        class="walletconnect-connect_button"
        style="background-color: ${color};"
      >
        {name}
      </div>
    </a>
  `
}
function formatMobileRegistry (uri: string) {
  const buttons = MobileRegistry.map((entry: IMobileRegistryEntry) => {
    const { name, color } = entry
    const href = formatDeepLinkHref(uri, entry)
    return formatSingleConnectButton(name, color, href)
  })
  return buttons.join('')
}

function formatSingleDeepLink (uri: string) {
  const name = 'Connect to Mobile Wallet'
  const color = constants.defaultColor
  return formatSingleConnectButton(name, color, uri)
}

function formateDeepLinkingContent (uri: string) {
  const content = isIOS()
    ? formatMobileRegistry(uri)
    : formatSingleDeepLink(uri)
  const callToAction = 'Click to connect to your preffered wallet'
  return `
    <div>
      <p id="walletconnect-qrcode-text" class="walletconnect-qrcode__text">
        ${callToAction}
      </p>
      ${content}
    </div>
  `
}

function formatModal (uri: string) {
  const content = isMobile()
    ? formateDeepLinkingContent(uri)
    : formatQRCodeContent(uri)
  return `
  <div
    id="walletconnect-qrcode-modal"
    class="walletconnect-qrcode__base animated fadeIn"
  >
    <div class="walletconnect-modal__base">
      <div class="walletconnect-modal__header">
        <img src="${logo}" class="walletconnect-modal__headerLogo" />
        <div class="walletconnect-modal__close__wrapper">
          <div
            id="walletconnect-qrcode-close"
            class="walletconnect-modal__close__icon"
          >
            <div class="walletconnect-modal__close__line1""></div>
            <div class="walletconnect-modal__close__line2"></div>
          </div>
        </div>
      </div>
      <div>
        ${content}
      </div>
    </div>
  </div>
`
}

function open (uri: string, cb: any) {
  const wrapper = document.createElement('div')
  wrapper.setAttribute('id', 'walletconnect-wrapper')

  wrapper.innerHTML = formatModal(uri)

  document.body.appendChild(wrapper)
  const closeButton = document.getElementById('walletconnect-qrcode-close')

  if (closeButton) {
    closeButton.addEventListener('click', () => {
      close()
      if (cb) {
        cb()
      }
    })
  }
}

/**
 *  @desc     Close WalletConnect QR Code Modal
 */
function close () {
  const elm = document.getElementById('walletconnect-qrcode-modal')
  if (elm) {
    elm.className = elm.className.replace('fadeIn', 'fadeOut')
    setTimeout(() => {
      const wrapper = document.getElementById('walletconnect-wrapper')
      if (wrapper) {
        document.body.removeChild(wrapper)
      }
    }, constants.animationDuration)
  }
}

export default { close, open }
