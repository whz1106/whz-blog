/*
 * Keep a freshly initialized blog useful before the first real post exists.
 * Hexo's built-in index, archive, and feed generators intentionally skip
 * empty collections, so these fallback routes disappear automatically once
 * the first post is added.
 */
hexo.extend.generator.register('empty-site-pages', function (locals) {
  if (locals.posts.length > 0) return [];

  const siteUrl = this.config.url.replace(/\/$/, '') + '/';
  const updated = new Date().toISOString();
  const page = (title, content, path) => ({
    path,
    layout: ['page', 'index'],
    data: {
      title,
      content,
      __page: true,
    },
  });

  const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>WHZ Blog</title>
  <id>${siteUrl}</id>
  <updated>${updated}</updated>
  <link href="${siteUrl}" />
  <link href="${siteUrl}feed.xml" rel="self" />
</feed>
`;

  return [
    page(
      'WHZ Blog',
      '<p>这里会记录 AI 基础设施、模型推理、视觉模型与软件工程实践。</p><p>首篇文章正在准备中，欢迎稍后再来。</p>',
      'index.html',
    ),
    page('归档', '<p>目前还没有已发布的文章。</p>', 'archives/index.html'),
    { path: 'feed.xml', data: feed },
  ];
});
