// 定义你的加速域名，务必修改为你的实际域名
const PROXY_DOMAIN = 'ghd.xubo.live';

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const search = url.search;
  if (path === '/') {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GitHub 加速站 - ghd.xubo.live</title>
        <style>
            body { font-family: -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f6f8fa; }
            .container { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 90%; max-width: 500px; }
            h2 { color: #24292f; margin-bottom: 1.5rem; text-align: center; }
            input { width: 100%; padding: 12px; border: 1px solid #d0d7de; border-radius: 6px; box-sizing: border-box; font-size: 16px; }
            button { width: 100%; margin-top: 1rem; padding: 12px; background: #2da44e; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 600; }
            button:hover { background: #2c974b; }
            p { color: #57606a; font-size: 14px; margin-top: 1rem; text-align: center; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>🚀 GitHub 高速下载</h2>
            <input type="text" id="url" placeholder="贴入 GitHub 链接，如：https://github.com/...">
            <button onclick="download()">立即加速下载</button>
            <p>支持 Release, Raw, Zip 以及 git clone 加速</p>
        </div>
        <script>
            function download() {
                const val = document.getElementById('url').value.trim();
                if (!val) return alert('请输入链接');
                const newUrl = val.replace('github.com', '${PROXY_DOMAIN}')
                                 .replace('raw.githubusercontent.com', '${PROXY_DOMAIN}/raw');
                window.location.href = newUrl;
            }
        </script>
    </body>
    </html>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }

  // 构造目标 GitHub URL
  // 支持 github.com 的主站资源和 raw.githubusercontent.com 的原始文件
  let targetUrl = '';
  if (path.startsWith('/raw/')) {
    targetUrl = 'https://raw.githubusercontent.com' + path.replace('/raw/', '/') + search;
  } else {
    targetUrl = 'https://github.com' + path + search;
  }

  try {
    let response = await fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      redirect: 'manual' // 手动处理重定向，这是加速成功的核心
    });

    // 拦截重定向逻辑 (处理 Release 下载和文件跳转)
    if ([301, 302, 307, 308].includes(response.status)) {
      const location = response.headers.get('Location');
      if (location) {
        let newLocation = location
          .replace('https://github.com', `https://${PROXY_DOMAIN}`)
          .replace('https://raw.githubusercontent.com', `https://${PROXY_DOMAIN}/raw`)
          .replace('https://objects.githubusercontent.com', `https://${PROXY_DOMAIN}`);
        
        const resHeaders = new Headers(response.headers);
        resHeaders.set('Location', newLocation);
        return new Response(null, {
          status: response.status,
          headers: resHeaders
        });
      }
    }

    return response;
  } catch (e) {
    return new Response('Error: ' + e.message, { status: 500 });
  }
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
