# TestFlight 发布指南

将 Scroll Tracker Browser 发布到 TestFlight 进行内部测试的完整指南。

## 前置要求

### 1. Apple Developer 账户
- ✅ 已注册 [Apple Developer Program](https://developer.apple.com/programs/) ($99/年)
- ✅ 账户状态为 Active

### 2. 开发环境
- ✅ macOS 系统
- ✅ Xcode 已安装（从 App Store）
- ✅ Node.js 和 npm 已安装
- ✅ Expo CLI 已安装

### 3. EAS CLI
```bash
npm install -g eas-cli
```

---

## 第一步：注册 Expo 账户并登录

### 1.1 注册 Expo 账户
如果还没有 Expo 账户，访问 [https://expo.dev](https://expo.dev) 注册。

### 1.2 登录 EAS CLI
```bash
eas login
```

输入您的 Expo 用户名和密码。

---

## 第二步：配置项目信息

### 2.1 更新 app.json

确保 `app.json` 包含正确的配置：

```json
{
  "expo": {
    "name": "Scroll Tracker Browser",
    "slug": "scroll-tracker-browser",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.scrolltrackerbrowser",
      "buildNumber": "1"
    },
    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ]
    ]
  }
}
```

**重要配置项：**
- `bundleIdentifier`: 修改为您自己的唯一标识符（例如：`com.minghuizhu.scrolltrackerbrowser`）
- `version`: 应用版本号（如 1.0.0）
- `buildNumber`: 构建版本号（每次提交必须递增）

### 2.2 检查 package.json

确保包含必要的依赖：

```json
{
  "name": "scroll-tracker-browser",
  "version": "1.0.0",
  "main": "index.ts",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  }
}
```

---

## 第三步：初始化 EAS Build

### 3.1 配置 EAS
```bash
eas build:configure
```

这会创建 `eas.json` 文件。

### 3.2 编辑 eas.json

建议配置：

```json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "ios": {
        "simulator": false
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 第四步：在 App Store Connect 创建应用

### 4.1 登录 App Store Connect
访问 [https://appstoreconnect.apple.com](https://appstoreconnect.apple.com)

### 4.2 创建新应用
1. 点击 **My Apps** → **+** → **New App**
2. 填写信息：
   - **Platforms**: iOS
   - **Name**: Scroll Tracker Browser
   - **Primary Language**: Chinese (Simplified) 或 English
   - **Bundle ID**: 选择或创建与 `app.json` 中相同的 Bundle ID
   - **SKU**: 唯一标识符（如：scroll-tracker-browser-001）
   - **User Access**: Full Access

3. 点击 **Create**

### 4.3 配置应用信息
在 App Information 页面填写：
- **Subtitle**: 简短描述
- **Privacy Policy URL**: 您的隐私政策链接
- **Category**: Utilities 或 Productivity

---

## 第五步：构建 iOS 应用

### 5.1 首次构建
```bash
eas build --platform ios --profile production
```

### 5.2 构建过程
EAS 会提示您：

1. **Apple ID**: 输入您的 Apple Developer 账户邮箱
2. **Password**: 输入密码或 App-Specific Password
3. **Team ID**: 选择您的开发者团队
4. **Distribution Certificate**: 选择自动生成或使用现有证书
5. **Provisioning Profile**: 自动生成

### 5.3 等待构建完成
- 构建时间：约 10-20 分钟
- 可以在 [https://expo.dev](https://expo.dev) 查看构建进度
- 构建完成后会收到邮件通知

### 5.4 下载构建产物
构建完成后：
```bash
# 查看构建列表
eas build:list

# 或在网页查看
open https://expo.dev/accounts/YOUR_USERNAME/projects/scroll-tracker-browser/builds
```

---

## 第六步：提交到 TestFlight

### 6.1 自动提交（推荐）
```bash
eas submit --platform ios
```

EAS 会：
1. 自动上传 IPA 文件到 App Store Connect
2. 选择刚刚的构建版本
3. 等待 Apple 处理（约 5-15 分钟）

### 6.2 手动提交（备选）
如果自动提交失败：

1. 从 EAS 下载 `.ipa` 文件
2. 使用 Transporter 应用上传：
   ```bash
   # 打开 Transporter
   open -a Transporter
   ```
3. 拖拽 IPA 文件到 Transporter
4. 点击 **Deliver**

---

## 第七步：配置 TestFlight

### 7.1 等待处理完成
在 App Store Connect → TestFlight 页面：
- 等待 **Processing** 状态变为 **Ready to Submit** 或 **Ready to Test**
- 通常需要 5-15 分钟

### 7.2 添加测试信息
1. 点击构建版本号
2. 填写 **What to Test**（测试说明）：
   ```
   Scroll Tracker Browser v1.0.0
   
   测试重点：
   - 浏览器基本功能（加载网页、导航）
   - 滚动距离追踪（cm、米、屏幕高度）
   - 时间追踪（主动滚动时间 vs 被动浏览时间）
   - 多域名会话管理
   - 控制台日志输出
   
   已知问题：
   - 暂无数据持久化
   - 暂无统计界面
   ```

3. 选择 **Export Compliance**：
   - 如果不使用加密：选择 **No**
   - 否则根据实际情况填写

4. 点击 **Save**

### 7.3 提交审核（如需要）
如果状态是 **Ready to Submit**：
1. 点击 **Submit for Review**
2. 等待 Apple 内部审核（通常几小时）

---

## 第八步：邀请内部测试人员

### 8.1 添加内部测试人员
1. 在 TestFlight 页面，点击 **App Store Connect Users** 标签
2. 点击 **+** 添加测试人员
3. 选择团队成员（必须是 App Store Connect 中的用户）

### 8.2 添加外部测试人员（可选）
1. 点击 **External Testing** 标签
2. 点击 **+** 创建新的测试组
3. 添加测试人员邮箱（无需 App Store Connect 账户）
4. 最多可添加 10,000 名外部测试人员

---

## 第九步：测试人员安装应用

### 9.1 测试人员准备
测试人员需要：
1. 安装 **TestFlight** 应用（从 App Store）
2. 使用受邀的 Apple ID 登录

### 9.2 接受邀请
1. 测试人员会收到邮件邀请
2. 点击邮件中的 **View in TestFlight** 链接
3. 或打开 TestFlight 应用查看可用的测试版本

### 9.3 安装应用
1. 在 TestFlight 中找到 **Scroll Tracker Browser**
2. 点击 **Install**
3. 等待下载完成
4. 点击 **Open** 开始测试

---

## 第十步：发布更新版本

### 10.1 更新版本号
编辑 `app.json`：
```json
{
  "expo": {
    "version": "1.0.1",
    "ios": {
      "buildNumber": "2"
    }
  }
}
```

**版本规则：**
- `version`: 用户可见版本（1.0.0 → 1.0.1）
- `buildNumber`: 必须递增（1 → 2 → 3...）

### 10.2 重新构建
```bash
eas build --platform ios --profile production
```

### 10.3 重新提交
```bash
eas submit --platform ios
```

### 10.4 通知测试人员
测试人员会自动收到更新通知（如果开启了自动更新）。

---

## 常见问题

### Q1: "Bundle identifier is already in use"
**解决方案：**
- 在 App Store Connect 中创建新的 Bundle ID
- 或使用 App Store Connect 中已存在的 Bundle ID
- 确保 `app.json` 中的 `bundleIdentifier` 与 App Store Connect 一致

### Q2: "Invalid provisioning profile"
**解决方案：**
```bash
eas credentials
# 选择 iOS → Production → Provisioning Profile → Remove
# 重新构建会自动生成新的
```

### Q3: 构建失败
**解决方案：**
```bash
# 清理缓存重新构建
eas build --platform ios --profile production --clear-cache
```

### Q4: "Export compliance missing"
**解决方案：**
在 App Store Connect → TestFlight → 构建版本中填写 Export Compliance 信息。

### Q5: TestFlight 审核被拒
**解决方案：**
- 检查 App 是否符合 Apple 审核指南
- 提供清晰的测试说明
- 确保隐私政策 URL 可访问
- 添加 App 使用的必要权限说明

---

## 快速命令参考

```bash
# 登录 EAS
eas login

# 配置项目
eas build:configure

# 构建 iOS
eas build --platform ios --profile production

# 查看构建状态
eas build:list

# 提交到 TestFlight
eas submit --platform ios

# 查看项目信息
eas project:info

# 管理凭证
eas credentials
```

---

## 完整发布流程总结

```bash
# 1. 登录
eas login

# 2. 配置（首次）
eas build:configure

# 3. 构建
eas build --platform ios --profile production

# 4. 提交
eas submit --platform ios

# 5. 在 App Store Connect 配置 TestFlight
# 6. 邀请测试人员
# 7. 开始测试！
```

---

## 时间预估

| 步骤 | 预估时间 |
|------|----------|
| 配置项目 | 10-15 分钟 |
| 首次构建 | 15-20 分钟 |
| 上传到 App Store Connect | 5-10 分钟 |
| Apple 处理 | 5-15 分钟 |
| TestFlight 审核（外部测试） | 24-48 小时 |
| **总计（内部测试）** | **约 1 小时** |
| **总计（外部测试）** | **1-3 天** |

---

## 注意事项

⚠️ **版本号管理**
- 每次提交 `buildNumber` 必须递增
- `version` 遵循语义化版本（major.minor.patch）

⚠️ **Bundle ID**
- 创建后不可更改
- 必须全局唯一
- 建议格式：`com.yourname.appname`

⚠️ **测试人员限制**
- 内部测试：最多 100 名（需要 App Store Connect 账户）
- 外部测试：最多 10,000 名（仅需 Apple ID）

⚠️ **TestFlight 限制**
- 每个构建版本有效期 90 天
- 外部测试需要 Apple 审核
- 最多可同时测试 100 个构建版本

---

## 相关链接

- 📱 [App Store Connect](https://appstoreconnect.apple.com)
- 🏗️ [Expo EAS Build Dashboard](https://expo.dev)
- 📚 [EAS Build 文档](https://docs.expo.dev/build/introduction/)
- 📚 [EAS Submit 文档](https://docs.expo.dev/submit/introduction/)
- 📚 [TestFlight 帮助](https://developer.apple.com/testflight/)
- 📚 [App Store Connect API](https://developer.apple.com/documentation/appstoreconnectapi)

---

**祝您发布顺利！🚀**

需要帮助？查看 `README.md` 或 `TESTING_GUIDE.md` 获取更多信息。

