---
title: Dots vs Spark vs Muse：三家「个人 Agent」到底在争什么？
slug: dots-vs-spark-vs-muse
date: 2026-10-10 12:48:41
description: 对比 OpenAI Dots、Google Gemini Spark 与 Meta Muse：always-on、工具面与信任边界，而不是参数榜。
categories:
  - AI
tags:
  - Personal Agent
  - OpenAI Dots
  - Gemini Spark
  - Meta Muse
  - Agent
---

2026 年秋天，Personal Agent 几乎同时从概念变成了产品名。OpenAI 在 ChatGPT 里推出 Dots；Google 把 Gemini Spark 写成「24/7 personal AI agent」；Meta 则用 Muse 直接自称「个人 AI Agent」。同一季里，三家不再只比谁更会聊天，而是争抢同一句话：**替你把事做完**。

这篇文章不打算裁判谁更聪明，也不打算做参数榜。我想问的是更落地的问题：各自把「替你做事」放在哪里——后台能不能继续跑、能碰哪些工具与入口、以及在真正敏感的动作上，敢不敢替你点发送。争的，说到底是 **always-on、工具面，和信任边界**。把这三件事拆开看，比追「谁先发布」更有助于选题，也更接近工程师真正会踩到的产品形状。

还有一个容易被忽略的背景：过去一年，「Agent」这个词被用得太宽——从企业工作流、写代码助手，到浏览器自动点击，全都能叫 Agent。Personal Agent 之所以值得单独写，是因为它默认要触碰邮件、日历、支付与身份，失败成本更高，产品叙事也被迫更具体。

## 三家一句话画像

**Dots** 是 ChatGPT 里的 always-on 个人特工。它有自己的云电脑与浏览器，可通过插件连接大量第三方应用，也能在你授权后连本机；强调目标、偏好与反馈学习，并滚动向 Pro、Business Premium 等用户放出。官方叙事里，你给它一个名字、划定边界，它就在会话之间继续推进项目，必要时再回来征求你的判断。

**Gemini Spark** 是 Gemini Apps 里的个人 Agent。它深度绑定 Gmail、Calendar、Drive、Docs 等 Google 生态，用 Tasks、Skills、Schedules 把多步任务和定时（或条件）触发跑起来；面向 Google AI Pro / Ultra 等订阅用户，且有明确的账号类型、年龄与地区门槛。官方示意里，它更像「住在你 Google 生活里的后台执行者」，而不是另一个完全平行的生产力宇宙。

**Muse** 是 Meta 独立成篇的个人 Agent。对话像发消息一样发生在 Muse App 或 WhatsApp，背后跑在 Muse Secure VM 上；叙事重点是替你推进邮件、订票、填表和长期目标，并配上 Sentinel、审批与审计故事。它刻意降低学习曲线：先让人「会用」，再谈云端虚拟机与出站控制。

三句话各自站在不同的第一性：Dots 站在对话与云电脑，Spark 站在 Workspace 数据面，Muse 站在大众入口与安全隔离。读官方稿时很容易被功能列表淹没；抓住这三句，后面的对比轴才有锚点。

需要提前说明：本文不把 Workspace Agents、企业治理套件塞进「个人 Agent」主叙事。团队共享特工与个人替身可以共用技术底座，但产品承诺、权限模型与失败后果并不相同——混谈只会把地图画糊。

## 对比轴一：Always-on——关 App 之后还在不在干活

Personal Agent 和聊天机器人的第一道分水岭，是 **你走开之后，它是否还在推进**。

Dots、Spark、Muse 都在讲云端持续工作：任务可以在会话之间继续，设备关机也不必等于特工下班。这一点很关键——如果执行环境默认拴在你的笔记本上，那么「个人 Agent」很快会退化成「远程桌面遥控器」；如果执行环境默认在云端，产品才敢承诺 24/7。

Spark 的官方示意很直白：例如每周一早上扫一遍邮箱、整理优先级、再往日历里塞深度工作时段。这类 **Schedules** 把「记得提醒我」升级成「按节奏替你执行」。Tasks 负责单次或持续目标，Skills 负责把你反复使用的指令固化成可复用能力——三者叠在一起，才像一条可调度的个人流水线，而不只是更长的聊天线程。

Dots 则把后台能力收束得更谨慎：不活跃时的 **proactive research** 被设计成对已连接应用的只读探查，真正改内容、发消息、控浏览器，仍要落在你设的边界里。换句话说，OpenAI 愿意卖「它一直在想办法帮你」，但默认不愿把「它一直在随便改你的世界」当成卖点。Muse 同样强调关 App 后仍可推进，需要批准时再回来找你——持续工作与人工闸门被绑在同一叙事里。

对照一下 Anthropic 的 Claude **Dispatch + computer use** 就更清楚：那条路线是「手机派活，桌面执行」，本机往往需要保持唤醒。它很强，对开发者和本机工作流也很有吸引力，但 **不是同一类 always-on**——执行环境拴在你的电脑上，而不是默认拴在厂商的云电脑上。三家争的，首先是「替身能不能在云端替你值班」。

## 对比轴二：工具面与入口——你从哪儿喊它，它从哪儿动手

Always-on 决定特工是否还活着；**工具面**决定它活着时能碰什么。入口决定你愿不愿意每天喊它；数据源决定它懂不懂你；执行环境决定它动手时站在哪台「电脑」上。

| | Dots | Spark | Muse |
|---|---|---|---|
| **入口** | ChatGPT（桌面 / Web / 移动），并可出现在 Slack、Teams 等 | Gemini Apps（Web / 移动 / Mac 等），Chrome auto browse | Muse App、WhatsApp、muse.ai |
| **数据源 / 连接** | 插件生态连接大量应用；ChatGPT 记忆与偏好；可选连本机 | Gmail、Calendar、Drive、Docs 等 Google 应用；Personal Intelligence；登录站点上下文 | 用户授权连接的日常应用；对话与目标记忆 |
| **执行环境** | 自有云电脑 + 浏览器；可授权使用本机 | 云端任务编排；Chrome 侧自动浏览（含远程浏览器等路径） | Muse Secure VM（独立云端虚拟机 + 浏览器） |

Dots 的赌注是 **ChatGPT 工作流 + 广连接 + 云电脑**：你已经在对话里交代目标，它就在那套上下文里拆活、连工具、带回结果。插件数量与「可检视的云电脑」是它的工程自信——你能打开特工的电脑看它干了什么，这本身也是一种信任装置。

Spark 的赌注是 **Workspace 深度**：邮件、日历、文档本来就在 Google 账号里，Agent 不必先「成为另一个宇宙的公民」。Chrome auto browse 则把「会搜索」推进到「会在网页上完成多步动作」——购物、订票、订位这类场景，官方是明确举例的。代价也很清楚：深度依赖 Google 账号与浏览器路径，个人/工作账号边界、地区与订阅会直接切掉一批用户。

Muse 的赌注是 **大众入口**：把个人特工做成接近即时通讯的体验，降低「我要不要再学一个生产力套件」的心理成本，同时把执行隔离进 Secure VM。WhatsApp 不是锦上添花，而是在争「Agent 应该出现在哪里」——出现在你已经每天打开的聊天列表里，还是出现在又一个 AI 应用的侧边栏里。

三家都在做多步任务，但「第一落点」不同：Dots 落在对话与插件图上，Spark 落在 Google 数据面与浏览器自动化上，Muse 落在消息入口与安全虚拟机上。选产品之前，不妨先问自己：你最常打开的，是 ChatGPT、Gmail，还是 WhatsApp。

## 对比轴三：审批与安全——能代发邮件之后，产品差在「何时敢点发送」

这是我认为整场竞赛的高潮。

当 Agent 只会摘要邮件时，信任问题还软——错了可以重生成。一旦它能起草、能发送、能下单，产品差异就硬化成 **控制面设计**：默认权限有多宽、敏感动作如何拦截、出站流量谁审批、凭证对模型是否可见、出事之后有没有审计轨迹。

OpenAI 给 Dots 准备了 **Custom Rules** 与动作审查：哪些可自动做、哪些必须批准、哪些永远留给你；并强调敏感操作（例如改密码）不外包给特工。后台 proactive research 的只读限制，也可以读成同一种哲学：**主动，但先别乱动。** Meta 则把 Muse 放进 **Secure VM**，再用系统级隔离的 **Sentinel** 把关出站；密码与支付方式对模型不可见，发邮件、购物前要确认，并提供可审计轨迹。这是在用「独立电脑 + 独立哨兵」回答一个很难听的问题：个人特工出事时，爆炸半径有多大。

Google 对 Spark 则反复强调实验性、用户监督，以及对账号类型、年龄、订阅和地区的硬门槛——这既是合规与风险控制，也是在说：个人特工不是默认全员能力。Chrome 自动浏览场景下，官方也明确提醒：你要为 Agent 在任务中的动作负责，包括错误与意外结果。

我的观察很简单：**「能不能替你发邮件」很快会变成标配；「什么时候敢替你点发送」才会变成品牌。** 规则粒度、隔离边界、默认只读还是默认可写，比参数规模更像下一季的差异化文案。工程读者若只记一句，记住这句就够了。

也可以换个工程师视角：三家其实都在补齐同一张表——权限模型、审计日志、密钥隔离、人工确认点。差别不在有没有这张表，而在默认值偏向「先省事」还是「先别炸」。默认值会决定用户第一次试用时，是惊喜多一点，还是惊吓多一点。

## 对比轴四：商业与可用性——谁付钱，谁能用上

Dots 与 Spark 都明显绑在高端订阅上：前者进入 Pro / Business Premium 等档位叙事，后者需要 Google AI Pro 或 Ultra，且个人账号、年龄与地区都有限制。Muse 走的是另一条：美国滚动放出，官方称多数日常能力免费，需要「做得更多」再订阅——用普及入口换规模，再用加购换重度用量。

谁付钱，往往决定特工听谁的。订阅制下，你是明确的付费主体，产品更敢把「个人目标」写进主界面；免费普及则更依赖规模、留存与后续增值，安全叙事也必须足够响亮，否则大规模授权会变成大规模事故。再叠加地区可用性——Dots、Spark 都有明确的欧洲等市场例外——「个人 Agent」在 2026 年仍是 **有门槛的个人能力**，不是人人桌面上的默认开关。

写选题时，这一点也很实用：别把「官宣了」写成「你读者都能用上了」。可用性本身就是产品策略的一部分。对个人向博客来说，这一点甚至比功能对比更诚实：读者真正关心的，常常是「我现在能不能用、要花多少钱、坏了谁负责」。

## 收束：先选你的「Personal」定义，再谈赢家

我不会在这篇文章里点名赢家。更有用的是先选你对 Personal 的定义。

如果你要的是 **Workspace 深度**——邮件、日历、文档天然打通，定时任务像工作流一样长在账号里——Spark 的路径最顺。如果你要的是 **ChatGPT 里的云端个人电脑**——对话即委派，插件与云电脑一起把项目扛过多个会话——Dots 更像那个形状。如果你更在意 **大众入口与安全叙事**——像发消息一样用，同时把执行关进独立虚拟机——Muse 把这套故事讲得最完整。

下一篇我想把镜头转向另一条线：Apple 的 Siri AI 与 Windows 上的 Copilot / Agent Workspace。那一侧争的不是「再多一个云端替身」，而是 **操作系统里的个人上下文与本地动作**——和今天这三家，其实是两种「Personal」。Dots、Spark、Muse 回答的是「云端替身如何替你值班」；Apple 与 Windows 回答的是「系统如何在不交出整台人生的前提下，让助手懂你此刻的屏幕与文件」。两场仗相关，但不应混成一张榜。

如果你正在规划自己的博客选题，这篇对比更适合当「地图」而不是「评测结论」：先画清 always-on、工具面与信任边界，再决定下一篇要深挖哪一条轴。地图清楚了，后面的单点深挖才不会写成功能清单。

---

## 参考来源

- OpenAI, *Introducing dots*（2026-09-29）：https://openai.com/index/introducing-dots/
- OpenAI Help, *Getting started with your dot*：https://help.openai.com/en/articles/20001530-getting-started-with-your-dot
- Google, *Gemini Spark*：https://gemini.google/us/overview/agent/spark/
- Google Support, *Use Gemini Spark…*：https://support.google.com/gemini/answer/17094507
- Google Blog, *Automate repetitive tasks with Skills*：https://blog.google/products-and-platforms/products/gemini/automate-tasks-with-skills/
- Meta, *Introducing Muse*（2026-09）：https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/
- Anthropic, *Put Claude to work on your computer*（Dispatch / computer use 对照）：https://claude.com/resources/articles/dispatch-and-computer-use
