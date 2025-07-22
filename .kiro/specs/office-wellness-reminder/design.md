# 设计文档

## 概述

办公族健康提醒系统是一个基于现代Web技术的纯前端单页应用（SPA）。应用采用模块化架构，使用原生JavaScript、HTML5和CSS3技术栈，确保轻量级和高性能。系统通过浏览器本地存储管理用户数据，使用Web Notifications API提供系统级提醒，并通过事件监听实现智能的用户活动检测。

**重要说明**: 本设计严格遵循Kiro Hackathon比赛规则，采用纯前端技术栈，无需后端服务器，完全符合GitHub Pages部署要求。所有实现将遵循Web开发最佳实践，包括可访问性、性能优化、安全性和用户体验设计原则。

## 架构

### 整体架构
```
┌─────────────────────────────────────────┐
│              用户界面层                    │
│  ┌─────────────┐ ┌─────────────────────┐ │
│  │  主控制面板  │ │    设置面板         │ │
│  └─────────────┘ └─────────────────────┘ │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│              业务逻辑层                    │
│  ┌─────────────┐ ┌─────────────────────┐ │
│  │ 提醒管理器   │ │   用户活动检测器     │ │
│  └─────────────┘ └─────────────────────┘ │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│              数据存储层                    │
│  ┌─────────────┐ ┌─────────────────────┐ │
│  │ 本地存储管理 │ │    状态管理器       │ │
│  └─────────────┘ └─────────────────────┘ │
└─────────────────────────────────────────┘
```

### 技术栈选择
- **前端框架**: 原生JavaScript (ES6+) - 确保轻量级和快速加载
- **样式**: CSS3 + CSS Grid/Flexbox - 实现响应式布局
- **构建工具**: 无需构建工具 - 直接部署静态文件到GitHub Pages
- **通知系统**: Web Notifications API + 自定义页面内通知
- **数据存储**: localStorage API
- **部署平台**: GitHub Pages

## 组件和接口

### 核心组件

#### 1. ReminderManager (提醒管理器)
```javascript
class ReminderManager {
  constructor(type, settings) // type: 'water' | 'posture'
  start()                     // 启动提醒
  pause()                     // 暂停提醒
  reset()                     // 重置计时器
  updateSettings(settings)    // 更新设置
  getCurrentStatus()          // 获取当前状态
}
```

**职责:**
- 管理喝水和久坐提醒的定时器
- 处理提醒触发逻辑
- 与通知系统集成

#### 2. ActivityDetector (活动检测器)
```javascript
class ActivityDetector {
  constructor(callback)       // 活动检测回调
  startMonitoring()          // 开始监控用户活动
  stopMonitoring()           // 停止监控
  getLastActivityTime()      // 获取最后活动时间
  isUserActive()             // 判断用户是否活跃
}
```

**职责:**
- 监听鼠标移动、点击、键盘输入事件
- 检测用户离开状态（页面失焦超过5分钟）
- 为久坐提醒提供智能暂停功能

#### 3. NotificationService (通知服务)
```javascript
class NotificationService {
  constructor()
  requestPermission()        // 请求通知权限
  showNotification(type, message) // 显示通知
  showInPageAlert(type, message)  // 显示页面内提醒
  isSupported()             // 检查浏览器支持
}
```

**职责:**
- 管理浏览器通知权限
- 发送系统级通知
- 提供页面内备用通知方案

#### 4. StorageManager (存储管理器)
```javascript
class StorageManager {
  saveSettings(key, data)    // 保存设置
  loadSettings(key)          // 加载设置
  clearAllData()            // 清除所有数据
  isAvailable()             // 检查存储可用性
}
```

**职责:**
- 管理localStorage读写操作
- 处理存储异常情况
- 提供数据备份和恢复功能

#### 5. UIController (界面控制器)
```javascript
class UIController {
  constructor()
  initializeUI()            // 初始化界面
  updateStatus(type, status) // 更新状态显示
  showSettings()            // 显示设置面板
  hideSettings()            // 隐藏设置面板
  bindEvents()              // 绑定事件监听
}
```

**职责:**
- 管理用户界面状态
- 处理用户交互事件
- 更新界面显示内容

### 接口设计

#### 设置数据结构
```javascript
const AppSettings = {
  water: {
    enabled: true,
    interval: 30,        // 分钟
    sound: true,
    lastReminder: null   // 时间戳
  },
  posture: {
    enabled: true,
    interval: 60,        // 分钟
    sound: true,
    lastReminder: null,
    activityThreshold: 5 // 分钟
  },
  notifications: {
    browserNotifications: true,
    soundEnabled: true
  },
  ui: {
    theme: 'light',      // 'light' | 'dark'
    language: 'zh-CN'    // 'zh-CN' | 'en-US'
  }
}
```

## 数据模型

### 应用状态模型
```javascript
const AppState = {
  isInitialized: false,
  waterReminder: {
    isActive: false,
    timeRemaining: 0,
    nextReminderAt: null
  },
  postureReminder: {
    isActive: false,
    timeRemaining: 0,
    nextReminderAt: null,
    lastActivity: null
  },
  userActivity: {
    isActive: true,
    lastActivityTime: Date.now(),
    awayStartTime: null
  }
}
```

### 事件模型
```javascript
const Events = {
  WATER_REMINDER_TRIGGERED: 'water:reminder',
  POSTURE_REMINDER_TRIGGERED: 'posture:reminder',
  USER_ACTIVITY_DETECTED: 'user:activity',
  USER_AWAY_DETECTED: 'user:away',
  SETTINGS_UPDATED: 'settings:updated',
  REMINDER_ACKNOWLEDGED: 'reminder:acknowledged'
}
```

## 错误处理

### 错误类型和处理策略

#### 1. 通知权限错误
- **场景**: 用户拒绝浏览器通知权限
- **处理**: 降级到页面内通知，显示权限请求提示

#### 2. 本地存储错误
- **场景**: localStorage不可用或存储空间不足
- **处理**: 使用内存存储，提示用户数据不会持久化

#### 3. 定时器错误
- **场景**: 页面长时间后台运行导致定时器不准确
- **处理**: 使用时间戳校验，页面重新激活时重新计算

#### 4. 浏览器兼容性错误
- **场景**: 旧版浏览器不支持某些API
- **处理**: 功能降级，提供基础提醒功能

### 错误处理实现
```javascript
class ErrorHandler {
  static handleNotificationError(error) {
    console.warn('通知功能不可用:', error);
    // 降级到页面内通知
  }
  
  static handleStorageError(error) {
    console.warn('存储功能不可用:', error);
    // 使用内存存储
  }
  
  static handleTimerError(error) {
    console.error('定时器错误:', error);
    // 重新初始化定时器
  }
}
```

## 测试策略

### 单元测试
- **ReminderManager**: 测试定时器逻辑、状态管理
- **ActivityDetector**: 测试事件监听、活动检测算法
- **StorageManager**: 测试数据存储和读取功能
- **NotificationService**: 测试通知发送和权限处理

### 集成测试
- **用户流程测试**: 完整的设置-启动-提醒-确认流程
- **跨浏览器测试**: 在主流浏览器中验证功能一致性
- **响应式测试**: 在不同屏幕尺寸下的界面适配

### 用户体验测试
- **可用性测试**: 界面直观性和操作便利性
- **性能测试**: 页面加载速度和内存使用
- **可访问性测试**: 键盘导航和屏幕阅读器支持

### 测试工具和方法
- **单元测试**: Jest或原生测试框架
- **端到端测试**: Playwright或Cypress
- **性能测试**: Chrome DevTools和Lighthouse
- **兼容性测试**: BrowserStack或本地多浏览器测试

### 测试数据和场景
```javascript
const TestScenarios = {
  normalUsage: {
    waterInterval: 30,
    postureInterval: 60,
    userActiveTime: 8 // 小时
  },
  edgeCases: {
    veryShortInterval: 1,    // 分钟
    veryLongInterval: 480,   // 8小时
    browserMinimized: true,
    tabInactive: true
  },
  errorConditions: {
    noNotificationPermission: true,
    noLocalStorage: true,
    oldBrowser: true
  }
}
```

## 部署和性能优化

### GitHub Pages部署配置
- **静态文件结构**: 所有资源放在根目录或docs文件夹
- **HTTPS支持**: GitHub Pages自动提供HTTPS
- **CDN加速**: 利用GitHub的全球CDN网络

### 性能优化策略
- **资源压缩**: CSS和JavaScript文件压缩
- **图片优化**: 使用WebP格式和适当尺寸
- **缓存策略**: 利用浏览器缓存和Service Worker
- **懒加载**: 非关键资源延迟加载

### 监控和分析
- **错误监控**: 使用try-catch和window.onerror
- **性能监控**: 使用Performance API
- **用户行为**: 基本的使用统计（本地存储）