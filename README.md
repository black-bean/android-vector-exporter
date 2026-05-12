# Android Vector Exporter

MasterGo 插件 · 将设计稿中的图标组件一键导出为标准 Android Vector Drawable XML。

---

## 功能概览

| 功能 | 说明 |
|------|------|
| 扫描选中区域 | 识别选中画板/Frame 内所有 `ic_` 开头的 COMPONENT |
| 颜色 Token 替换 | 引用了设计稿样式 token 的颜色自动转为 `@color/x_color_xxx` |
| 透明度合并 | 图层 opacity 折叠进 `android:fillAlpha`，不产生无意义的 `<group>` 包装 |
| SVG Transform 分解 | `matrix()`/`rotate()`/`scale()`/`translate()` 转为 Android group 属性 |
| 尺寸取整 | 直接读节点 width/height 并取整，避免 SVG 导出浮点误差（如 47.998047） |
| 命名检查 | 含中文、`-`、空格或重名的图标标记 ❌，禁止导出 |
| 硬编码色值检测 | 未绑定 token 的颜色显示色点提示，方便排查 |
| 批量下载 | 勾选后一键打包为 `android_vectors.zip` |

---

## 使用方式

### 1. 加载插件（无需安装 npm）

`dist/` 目录已包含构建产物，直接导入即可：

1. 下载 / 克隆本仓库
2. 打开 MasterGo → 插件 → 开发插件 → **选择文件夹**，选中 `android-vector-exporter` 目录（含 `manifest.json`）
3. 插件出现在「开发中插件」列表，点击启动

### 2. 导出流程

```
① 在画布中选中包含图标的画板或 Frame（可多选）
        ↓
② 打开插件，自动扫描选中范围内所有 ic_ 开头的 COMPONENT
        ↓
③ 查看列表，检查命名问题（❌）和硬编码色值（色点）
        ↓
④ 勾选要导出的图标（全选 / 搜索过滤 / 单选均可）
        ↓
⑤ 点击「⬇️ 导出选中」
        ↓
⑥ 导出完成后点「📦 下载全部」打包 zip，或单个复制/下载
```

> 切换画板后点 **🔄 刷新** 重新扫描。

---

## 转换规则详解

### 颜色 Token

插件通过 `node.fillStyleId → mg.getStyleById(id).name` 读取节点绑定的设计稿样式名，再查映射表转为 Android 资源引用：

```
设计稿样式名                    Android 颜色引用
─────────────────────────────────────────────────
Primary_index_1/Primary      → @color/x_color_primary
Label/Text_Positive_T1       → @color/x_color_text_positive_t1
Label/Text_Negative_T1       → @color/x_color_text_negative_t1
Fill/Fill_Positive_F1        → @color/x_color_fill_positive_f1
Funticon color/Red           → @color/x_color_red
... （共 48 个 token，详见 color_token_mapping.md）
```

**未绑定 token 的颜色**（硬编码色值）直接写出原始十六进制，并在列表中用色点标记提示。

### 透明度处理

**原则：透明度只来自图层 opacity，不来自 fill-opacity。**

`fill-opacity` 是颜色 token 自带的 rgba alpha（如 `Label/Text_Positive_T1` 对应 `rgba(14,15,18,0.98)`），由 `@color/` 引用承载，不应再单独提取。只有图层/path 的 `opacity` 属性才作为 `android:fillAlpha` 写出。

**alpha-only group 折叠规则：**

SVG 中常见 `<g style="opacity:0.3">` 包一组纯色 path。此场景 group 没有 transform，不需要保留，将 alpha 直接乘入每个子 path 的 fillAlpha：

```
❌ 旧（错误）                      ✅ 新（正确）
<group android:alpha="0.3">       <path
  <path                               android:fillColor="#FFFFFF"
    android:fillColor="#FFFFFF"        android:fillAlpha="0.3"
  />                                   android:pathData="..."/>
</group>
```

**有 transform 的 group 保留**，此时 alpha 留在 group 上（移到 path 上也正确，但语义更清晰）。

### SVG Transform 分解

| SVG matrix | Android 等价 |
|------------|-------------|
| `matrix(sx,0,0,sy,tx,ty)` | `scaleX/Y` + `pivotX/Y`（由 tx,ty 反推） |
| `matrix(-1,0,0,-1,112,52.465)` | `scaleX="-1" scaleY="-1" pivotX="56" pivotY="26.232"` |
| `matrix(0,1,-1,0,e,f)` | `rotation="-90" translateX="e" translateY="f"` |
| `matrix(0,-1,1,0,e,f)` | `rotation="90" translateX="e" translateY="f"` |
| `rotate(a,cx,cy)` | `rotation="a" pivotX="cx" pivotY="cy"` |
| `translate(x,y)` | `translateX="x" translateY="y"` |

### 尺寸取整

MasterGo `exportAsync({format:'SVG'})` 导出的 SVG 宽高有时带浮点误差（如 `47.998047`）。插件直接读取节点的 `width`/`height` 属性并 `Math.round()`，确保输出整数 dp。

### 命名检查规则

以下情况标记 ❌，**禁止选中导出**：

| 问题 | 示例 |
|------|------|
| 含中文 | `ic_摄像头` |
| 含连字符 `-` | `ic_camera-top` |
| 含空格 | `ic_camera top` |
| 与其他组件重名 | 同一画板内存在两个 `ic_camera_top_s` |

> 命名规范：`ic_` 前缀 + 小写字母、数字、下划线，如 `ic_camera_top_s`。

### 硬编码色值检测

扫描组件内所有子节点，对没有绑定 `fillStyleId` 的 SOLID fill 颜色，以色点形式显示在列表右侧（最多显示 4 个，超出显示 `+N`），鼠标悬停可查看具体色值。

此类颜色在导出 XML 中直接写出原始十六进制，**不会**映射为 `@color/` 引用，需设计师回设计稿补绑定 token。

---

## 项目结构

```
android-vector-exporter/
├── src/
│   ├── main.ts       # 插件沙箱逻辑：扫描、SVG解析、XML生成
│   └── ui.html       # 插件 UI：列表展示、选择、下载
├── dist/
│   ├── main.js       # esbuild 构建产物
│   └── ui.html       # 含内联 JSZip 的 UI 产物
├── build.mjs         # 构建脚本（esbuild + JSZip 内联）
├── manifest.json     # 插件清单
├── package.json
└── tsconfig.json
```

## 构建命令

```bash
npm run build    # 构建一次
npm run watch    # 监听文件变化自动构建
```

---

## 支持的颜色 Token 列表

完整映射见 [`../color_token_mapping.md`](../color_token_mapping.md)，共 48 个 token，涵盖：

- 品牌色：`x_color_primary` / `x_color_primary_low`
- 文字色 Positive/Negative T1–T4
- 填充色 Positive/Negative F1–F5
- 静态白/黑 S1–S4
- 背景色 BG系列
- 功能色：Red / Green / Blue / Orange / Yellow / Cyan 及对应 low
- 其他：Line / Tbt_no_blur / AI_widget_BG1 / AI_widget_BG2

---

## 注意事项

- **SVG filter（高斯模糊/投影）** 在 Android VectorDrawable 中不支持，导出时会被忽略
- **渐变色** 当前版本不处理，渐变 fill 的路径会被跳过（输出为空）
- 插件 ID 在 `manifest.json` 中为开发占位符，发布到 MasterGo 插件市场前需替换为平台分配的真实 ID
- 本地调试时，MasterGo 不显示自定义图标（icon 字段），发布后生效
