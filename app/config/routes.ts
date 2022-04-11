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
        path: '/user',
        routes: [
          {
            name: 'login',
            path: '/user/login',
            component: './user/Login',
            hideInMenu: false,
          },
        ],
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
