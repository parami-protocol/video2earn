export default [
  {
    path: '/',
    layout: false,
    routes: [
      {
        path: '/',
        redirect: '/index',
      },
      {
        name: 'index',
        path: '/index',
        component: './Index',
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
