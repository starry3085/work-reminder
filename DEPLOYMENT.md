# 部署检查清单

本文档提供了将办公族健康提醒应用部署到GitHub Pages的完整步骤和验证流程。

## 部署前检查

- [ ] 所有功能测试通过
- [ ] 响应式设计在不同设备上测试通过
- [ ] 所有资源文件（图片、音频等）都已包含在项目中
- [ ] 所有JavaScript和CSS文件已压缩（可选）
- [ ] 确保favicon.ico和其他图标文件存在
- [ ] 确保manifest.json文件正确配置
- [ ] 确保Service Worker正确实现

## 部署步骤

1. **准备GitHub仓库**
   - [ ] 创建新的GitHub仓库或使用现有仓库
   - [ ] 确保仓库是公开的（对于GitHub免费账户）

2. **推送代码**
   - [ ] 将所有代码推送到GitHub仓库的主分支（通常是`main`或`master`）
   ```bash
   git add .
   git commit -m "准备部署到GitHub Pages"
   git push origin main
   ```

3. **配置GitHub Pages**
   - [ ] 进入仓库设置 -> Pages
   - [ ] 选择部署源（Source）为`gh-pages`分支
   - [ ] 点击保存

4. **触发自动部署**
   - [ ] 推送代码到主分支会自动触发GitHub Actions工作流
   - [ ] 等待部署完成（通常需要1-2分钟）
   - [ ] 在仓库的Actions标签页查看部署状态

## 部署后验证

1. **访问部署网站**
   - [ ] 访问`https://<username>.github.io/<repository-name>/`
   - [ ] 确保页面正常加载

2. **运行部署验证**
   - [ ] 在URL后添加`?verify=true`参数
   - [ ] 检查验证结果是否全部通过

3. **功能验证**
   - [ ] 测试喝水提醒功能
   - [ ] 测试久坐提醒功能
   - [ ] 测试设置保存功能
   - [ ] 测试通知功能
   - [ ] 测试响应式设计（在移动设备上查看）

4. **兼容性检查**
   - [ ] 在Chrome浏览器中测试
   - [ ] 在Firefox浏览器中测试
   - [ ] 在Safari浏览器中测试
   - [ ] 在Edge浏览器中测试
   - [ ] 在移动设备浏览器中测试

## 常见问题排查

### 页面无法访问
- 检查仓库设置中的GitHub Pages配置是否正确
- 确认部署是否成功完成
- 检查URL是否正确（注意大小写）

### 资源文件无法加载
- 检查资源文件路径是否正确
- 确保所有资源文件都已推送到仓库
- 检查浏览器控制台是否有404错误

### JavaScript错误
- 检查浏览器控制台是否有错误信息
- 确保所有依赖的JavaScript文件都已正确加载
- 验证Service Worker注册是否成功

### 本地存储问题
- 确保浏览器支持并启用了localStorage
- 检查是否有足够的存储空间
- 验证存储操作是否有错误

## 自定义域名设置（可选）

如果需要使用自定义域名，请按照以下步骤操作：

1. 在DNS提供商处添加CNAME记录，指向`<username>.github.io`
2. 在仓库根目录添加CNAME文件，内容为自定义域名
3. 在GitHub仓库设置中的Pages部分，填写自定义域名
4. 勾选"Enforce HTTPS"选项（如果可用）

## 联系与支持

如有部署问题，请通过以下方式获取支持：
- 提交GitHub Issue
- 发送邮件至支持邮箱
- 查阅GitHub Pages官方文档：https://docs.github.com/en/pages