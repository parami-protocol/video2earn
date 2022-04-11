export default [
  {
    path: '/index',
    layout: false,
    routes: [
      {
        name: 'index',
        path: '/index',
        component: './Index',
        hideInMenu: false,
      },
    ],
  },
  {
    path: '/nft/buy',
    layout: false,
    routes: [
      {
        name: 'buy',
        path: '/nft/buy',
        component: './nft/Buy',
        hideInMenu: false,
      },
    ],
  },
  {
    path: '/nft/list',
    layout: false,
    routes: [
      {
        name: 'list',
        path: '/nft/list',
        component: './nft/List',
        hideInMenu: false,
      },
    ],
  },
  {
    path: '/user',
    layout: false,
    routes: [
      {
        path: '/chat-room',
        name: 'chatroom',
        component: './chat/',
      },
      {
        component: './404',
      },
    ],
  },
  {
    component: './404',
  },
];
