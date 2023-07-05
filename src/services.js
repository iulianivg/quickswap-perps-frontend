import qperpIcon from './assets/logos/QuickLogoMobile.png'

import { init } from '@web3-onboard/react'
import injectedModule from '@web3-onboard/injected-wallets'
import walletConnectModule from '@web3-onboard/walletconnect'
import coinbaseModule from '@web3-onboard/coinbase'
import trustModule from '@web3-onboard/trust'

// Replace with your DApp's Infura ID
const INFURA_ID = 'b5d669d7c820440a94488db392c3f19f'
export const infuraRPC = `https://mainnet.infura.io/v3/${INFURA_ID}`

const dappId = '2a56b719-c7ea-4a64-bbf1-98569383edd3'

const injected = injectedModule({
  custom: [
    // include custom (not natively supported) injected wallet modules here
  ]
  // display all wallets even if they are unavailable
  // displayUnavailable: true
  // but only show Binance and Bitski wallet if they are available
  // filter: {
  //   [ProviderLabel.Binance]: 'unavailable',
  //   [ProviderLabel.Bitski]: 'unavailable'
  // }
  // do a manual sort of injected wallets so that MetaMask and Coinbase are ordered first
  // sort: wallets => {
  //   const metaMask = wallets.find(
  //     ({ label }) => label === ProviderLabel.MetaMask
  //   )
  //   const coinbase = wallets.find(
  //     ({ label }) => label === ProviderLabel.Coinbase
  //   )

  //   return (
  //     [
  //       metaMask,
  //       coinbase,
  //       ...wallets.filter(
  //         ({ label }) =>
  //           label !== ProviderLabel.MetaMask &&
  //           label !== ProviderLabel.Coinbase
  //       )
  //     ]
  //       // remove undefined values
  //       .filter(wallet => wallet)
  //   )
  // }
  // walletUnavailableMessage: wallet => `Oops ${wallet.label} is unavailable!`
})

const coinbase = coinbaseModule()

const walletConnect = walletConnectModule({
  connectFirstChainId: true,
  version: 2,
  handleUri: uri => console.log(uri),
  projectId: 'fd151f76a4df984913706025cd64d404',
  requiredChains: [1101],
  qrcodeModalOptions: {
    mobileLinks: [
      'rainbow',
      'metamask',
      'argent',
      'trust',
      'imtoken',
      'pillar'
    ]
  }
})

const trust = trustModule()


export const initWeb3Onboard = init({
  connect: {
    autoConnectAllPreviousWallet: true
  },
  wallets: [
    injected,
    walletConnect,
    coinbase,
    trust
  ],
  chains: [
    {
      id: '0x44d',
      token: 'MATIC',
      label: 'Polygon zkEVM',
      rpcUrl: 'https://zkevm-rpc.com',
      icon: 'https://assets-global.website-files.com/6364e65656ab107e465325d2/642235057dbc06788f6c45c1_polygon-zkevm-logo.png'
    },
  ],
  appMetadata: {
    name: 'Quickswap Perps',
    icon: qperpIcon,
    description: 'Decentralized spot & perpetual exchange',
    recommendedInjectedWallets: [
      { name: 'Coinbase', url: 'https://wallet.coinbase.com/' },
      { name: 'MetaMask', url: 'https://metamask.io' }
    ],
    agreement: {
      version: '1.0.0',
      termsUrl: 'https://docs.google.com/document/d/1Gglh43oxUZHdgrS2L9lZfsI4f6HYNF6MbBDsDPJVFkM/edit?pli=1',
      privacyUrl: 'https://quickswap.exchange/'
    },
    gettingStartedGuide: 'https://perps-docs.quickswap.exchange/',
    explore: 'https://perps-docs.quickswap.exchange/contracts-and-addresses'
  },
  accountCenter: {
    desktop: {
      position: 'topRight',
      enabled: true,
      minimal: false
    }
  },
  apiKey: dappId,
  notify: {
    transactionHandler: transaction => {
      console.log({ transaction })
      if (transaction.eventCode === 'txPool') {
        return {
          // autoDismiss set to zero will persist the notification until the user excuses it
          autoDismiss: 0,
          // message: `Your transaction is pending, click <a href="https://goerli.etherscan.io/tx/${transaction.hash}" rel="noopener noreferrer" target="_blank">here</a> for more info.`,
          // or you could use onClick for when someone clicks on the notification itself
          onClick: () =>
            window.open(`https://goerli.etherscan.io/tx/${transaction.hash}`)
        }
      }
    }
  },
  theme: 'dark'
})