export default [
  {
    name: 'buyNFT',
    path: '/nft/buy',
    component: './nft/Buy',
    hideInMenu: false,
  },
  {
    name: 'listNFT',
    path: '/nft/list',
    component: './nft/List',
    hideInMenu: false,
  },
  {
    path: '/chat-room',
    name: 'chatRoom',
    component: './chat/Chat',
    hideInMenu: false
  },
  {
    component: './404',
  },
];
