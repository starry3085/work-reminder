# 办公族健康提醒 - Office Wellness Reminder

一个专为办公族设计的健康提醒网页应用，帮助您养成良好的工作习惯。

## 功能特性

- 🥤 **喝水提醒** - 定时提醒补充水分，保持身体健康
- 🪑 **久坐提醒** - 智能检测用户活动，提醒起身活动
- 🔔 **多种通知方式** - 支持浏览器通知和页面内提醒
- ⚙️ **个性化设置** - 可自定义提醒间隔和通知方式
- 📱 **响应式设计** - 完美适配桌面和移动设备
- 💾 **本地存储** - 设置自动保存，无需注册账号

## 技术栈

- **前端**: 原生 JavaScript (ES6+)
- **样式**: CSS3 + Flexbox/Grid
- **存储**: localStorage API
- **通知**: Web Notifications API
- **部署**: GitHub Pages
- **开发工具**: Kiro AI Assistant with automated documentation updates

## 项目结构

```
office-wellness-reminder/
├── index.html              # 主页面
├── 404.html               # 错误页面
├── styles/
│   └── main.css           # 主样式文件
├── js/
│   ├── app.js             # 主应用文件
│   ├── storage-manager.js # 存储管理器
│   ├── app-settings.js    # 应用设置
│   ├── notification-service.js # 通知服务
│   ├── activity-detector.js    # 活动检测器
│   ├── reminder-manager.js     # 提醒管理器
│   ├── water-reminder.js       # 喝水提醒
│   ├── standup-reminder.js     # 久坐提醒
│   ├── ui-controller.js        # UI控制器
│   ├── error-handler.js        # 错误处理
│   └── mobile-adapter.js       # 移动适配
├── assets/                # 静态资源（图标、音频）
├── manifest.json          # PWA配置
├── package.json           # 项目配置
└── README.md              # 项目说明
```

## 开发说明

本项目为 Kiro Hackathon 参赛作品，严格遵循比赛规则：
- 纯前端实现，无需后端服务器
- 可直接部署到 GitHub Pages
- 使用现代 Web 技术栈
- 注重用户体验和可访问性

### 开发自动化

项目使用 Kiro AI Assistant 进行开发辅助，包含以下自动化功能：
- **文档同步**: 自动检测代码变更并更新相关文档
- **代码注释**: 自动维护内联文档和代码注释的一致性
- **开发工作流**: 智能提示和代码质量检查

## 浏览器支持

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 开发进度

- [x] 项目基础结构
- [x] 存储管理系统
- [x] 通知服务
- [x] 用户活动检测
- [x] 提醒管理核心功能
- [x] UI交互控制
- [x] 响应式设计
- [x] 测试和优化
- [x] GitHub Pages 部署

## 部署指南

### GitHub Pages 部署

1. Fork 或克隆此仓库
2. 启用 GitHub Pages:
   - 进入仓库设置 -> Pages
   - 选择 `gh-pages` 分支作为源
   - 点击保存
3. 自动部署将在每次推送到 `main` 分支后执行
4. 访问 `https://<your-username>.github.io/office-wellness-reminder/` 查看应用

### 本地开发

1. 克隆仓库: `git clone https://github.com/yourusername/office-wellness-reminder.git`
2. 进入项目目录: `cd office-wellness-reminder`
3. 使用本地服务器运行项目:
   - 使用 Python: `python -m http.server`
   - 或使用 Node.js: `npx serve`
4. 在浏览器中访问 `http://localhost:8000`

## 许可证

MIT License

---

为办公族的健康工作而设计 ❤️