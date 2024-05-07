// ==========================【埋点】=========================
const infos = [
  {
    token: '5suze39rrgi7ojdy',
    host: 'iceberg-labelu-llm-test.shlab.tech',
    api: 'https://analyze-dev.shlab.tech/api/v1/log/create',
  },
  {
    env: 'iceberg',
    token: 'e5ea1ddb69d6519b',
    host: 'iceberg-labelu-llm.shlab.tech',
    api: 'https://analyze.shlab.tech/api/v1/log/create',
  },
];

const correctInfo =
  infos.find((info) => {
    return window.location.host.includes(info.host);
  }) || infos[0];

const ssoUserInfo = localStorage.getItem('ssoUserInfo');

function main() {
  if (!window.AnalyzeWiz) {
    console.warn('未引入埋点脚本');
    return;
  }

  try {
    if (ssoUserInfo) {
      const { username, user_id } = JSON.parse(ssoUserInfo);
      window.AnalyzeWiz.setUser({
        id: user_id,
        name: username,
      });
    } else {
      // 从sso进来还未获取到用户信息，此时将用户信息设置为未登录
      window.AnalyzeWiz.setUser({
        id: 'unlogin',
        name: '未登录',
      });
    }
  } catch (error) {
    // 从sso进来还未获取到用户信息，此时将用户信息设置为未登录
    window.AnalyzeWiz.setUser({
      id: 'unlogin',
      name: '未登录',
    });
  }

  window.AnalyzeWiz.init({
    organize: 'iceberg',
    delay: 0,
    // 默认为test环境的token，prod 为 5ea1ddb69d6519b6
    token: correctInfo.token,
    api: correctInfo.api,
    actions: [
      // 浏览器url访问或刷新
      {
        name: 'DOMContentLoaded',
        selector: 'window',
        handler: () => {
          return {
            type: 'page_view',
            resourceType: 'page',
            resourceId: location.pathname + location.search + location.hash,
          };
        },
      },
      // 路由跳转访问
      {
        name: 'locationchange',
        selector: 'window',
        handler: () => {
          return {
            type: 'page_view',
            resourceType: 'page',
            resourceId: location.pathname + location.search + location.hash,
          };
        },
      },
      {
        name: 'click',
        selector: '[data-wiz="task-submit"]',
        data: {
          type: 'button_click',
          resourceType: 'button',
          resourceId: 'task-submit',
        },
      },
      {
        name: 'click',
        selector: '[data-wiz="go-to-supplier"]',
        data: {
          type: 'button_click',
          resourceType: 'button',
          resourceId: 'go-to-supplier',
        },
      },
      {
        name: 'click',
        selector: '[data-wiz="task-skip"]',
        data: {
          type: 'button_click',
          resourceType: 'button',
          resourceId: 'task-skip',
        },
      },
      {
        name: 'click',
        selector: '[data-wiz="task-exit"]',
        data: {
          type: 'button_click',
          resourceType: 'button',
          resourceId: 'task-exit',
        },
      },
    ],
  });
}

main();
