# WHZ Blog

基于 Hexo + NexT 的个人技术博客。

## 本地开发

```bash
npm ci
npm run server
```

打开 <http://localhost:4000/>

## 写文章

```bash
npm run new -- "文章标题"
```

文章会生成到 `source/_posts/`。发布前可以运行：

```bash
npm run clean
npm run build
```

生成的静态文件位于 `public/`，该目录不提交到 GitHub。

## 部署

推送到 `main` 后，GitHub Actions 会自动构建并发布到 GitHub Pages：

<https://whz1106.github.io/whz-blog/>

GitHub Pages 的发布源需要设置为 **GitHub Actions**。
