---
title: '为鸿蒙手搓一个图片预览器'
description: '为鸿蒙（HarmonyOS）手搓图片预览组件的翻车实录：弹层、手势大战、调参玄学，以及最终代码。'
pubDate: 2026-08-06 02:43:04
category: '技术'
heroImage: './images/build-a-photo-previewr-for-ohos-cover.png'
---

> 前言：这几天在碰 HarmonyOS 的 ArkUI，做到图片预览时发现当前版本没有现成的 ImageViewer，只能自己搓。本文记录搓的过程、翻的车和最终代码。

## 需求，就这

点缩略图进黑底全屏页，多图左右滑着看，双指缩放，双击放大，放大后能拖着看细节，图片不能被拖出屏幕、也不能留黑边。就这。

## 自报家门：Vue 老司机

本博日常写 Vue，遇到这种需求，脑子里自动生成一套方案：

- 封装组件：显隐、索引、缩放状态全收组件内部，页面挂个 `<ImagePreview :visible="..."/>` 就完事
- 弹层用 teleport 挂 body 顶层，不怕父容器 overflow 裁剪
- 手势直接 `@touchstart` 绑图片上，浏览器事件模型成熟，基本不打架
- 动画靠 CSS transform，跟手是浏览器渲染引擎的事

这套思路没毛病。通用顺序也就是：先想清楚谁响应触摸，再想清楚状态放哪，最后才动手写 API。

但原样搬到 ArkUI 上，三个习惯全踩坑：

- teleport 那套 → 换成 `bindSheet` 弹层，手势环境不靠谱（下文第一版就栽在这）
- 手势绑元素 → Pan 会把 Swiper 的滑动识别堵死（下文"悟了"第三节）
- 状态放父组件 → 每帧整页重渲染，卡（下文"悟了"第四节）

不是思路错了，是它的手势系统和渲染模型跟浏览器不一样：手势之间会互相抢，状态一改就是整棵组件树 diff。后面踩的坑，基本都是这三件事的具现。

## 第一版：天真の bindSheet

第一版按 Vue 的思路来：预览逻辑全塞进 `PostImages` 组件里，点击缩略图弹个 `bindSheet`，里面 Swiper 装图片，`PinchGesture` 直接挂 Image 上改 scale。

状态就三个：`showPreview`、`previewIndex`、`imgScale`。当时觉得半天能写完。确实，写只要半天，修花了三天（泪目）。

在其他应用开发里，这种需求一般用模态窗 + 遮罩 + 手势监听就搞定了，所以第一版直接上了 `bindSheet` 半模态窗：

```ts
// 错误实现 1：bindSheet 半模态窗 + 手势直接挂 Image
@ComponentV2
struct PostImages {
  @Local showPreview: boolean = false
  @Local previewIndex: number = 0
  @Local imgScale: number = 1

  build() {
    Column() {
      // 图片宫格（略）
    }
    .bindSheet(this.showPreview, this.previewSheet(), {
      detents: [SheetSize.LARGE],
      dragBar: false
    })
  }

  @Builder
  previewSheet() {
    Stack() {
      Column().width('100%').height('100%').backgroundColor(Color.Black)
      Swiper() {
        ForEach(this.imageUrls, (url: string) => {
          Image(`${SERVER_ROOT}${url}`)
            .width('100%')
            .height('100%')
            .objectFit(ImageFit.Contain)
            .scale({ x: this.imgScale, y: this.imgScale })
            .gesture(
              PinchGesture({ fingers: 2 })
                .onActionUpdate((e: GestureEvent) => {
                  this.imgScale = Math.max(1, Math.min(4, this.imgScale * e.scale))
                })
            )
        }, (url: string) => url)
      }
      .index(this.previewIndex)
      .disableSwipe(this.imgScale > 1)
      .onChange((index: number) => {
        this.previewIndex = index
        this.imgScale = 1
      })
    }
  }
}
```

现象很迷：放大之后，缩放、平移、双击各有各的死法，还不带重样的。改来改去，问题纹丝不动。就算偶尔放大成功，也只能从图片中心放大，放大完没法平移，左右一滑就切页。

蚌埠住了。折腾半天，最后认了：全屏看图这种沉浸式交互，就别用弹层了。换成 Navigation 全屏页（`hideTitleBar(true)`），问题秒没。

## 抄作业，抄了个半成品

网上搜了一圈，华为开发者联盟有一篇[图片预览的实现](https://developer.huawei.com/consumer/cn/forum/topic/0201176484979900866)帖子，配套的还有官方文档[图片预览器](https://developer.huawei.com/consumer/cn/doc/best-practices/bpta-picture-preview)。有现成作业，抄！

核心写法是手势挂 Image、动态 `distance` + `disableSwipe` 协调冲突：

```ts
// 错误实现 2：PanGesture 挂 Image + 动态 distance / disableSwipe（官方推荐写法）
PanGesture({ fingers: 1, distance: this.isDisableSwipe ? 3 : 50 })
  .onActionUpdate((event: GestureEvent) => {
    this.isDisableSwipe = this.imageModel.panGestureUpdate(event)
  })
```

照抄之后，左右滑动翻页好了，捏合缩放也好了，缩放还能围着手指中心转。就剩放大后的平移：要么有一段"死区"，要么干脆没反应。

好嘛，既然有一点点效果了，我就不信我治不了你了。

接下来开始调参：distance 从 50 调到 3，又从 3 调到 100000，`disableSwipe` 各种组合轮着来，现象纹丝不动。我甚至怀疑过是模拟器的毛病。

![错误的实现演示](./images/PixPin_2026-08-06_01-42-39.webp)

至于真相，先留个悬念，后面说。

## 复盘分析下遇到的情况，突然悟了

根据前两版的经验，总结下来就是下面几个问题

### 手势对象不能放字段里

想优雅一下，把手势抽成组件字段，喜提应用崩溃：

```
TypeError: Cannot read property onActionUpdate of undefined
```

`@ComponentV2` 组件字段初始化时 UI 环境还没就绪，这时候如果去调用 `PinchGesture()` 会直接返回 undefined。

所以手势对象只能在 `build()` 里内联创建。

### Pan 不能挂 Swiper 子组件

接前面的悬念：为什么参数怎么调都没用？

我把能试的都试了：动态 distance、条件手势、占位手势、Swiper 假拖拽（`fakeDragBy`）。条件手势直接把缩放搞废，假拖拽能跑但代码复杂到没法维护。

最后才想明白，问题不在参数，在结构：**PanGesture 只要注册在 Swiper 的 Image 子组件上，不管 distance 多大，Swiper 的滑动识别都会被堵死**。两个手势在结构上就互相堵死了，参数救不了。

正解是手势分家：

- Image 上只挂 `PinchGesture` 和 `TapGesture`（双击）
- 平移手势挂一个透明覆盖层，`hitTestBehavior` 控制命中：1 倍时 `None` 穿透，Swiper 独占滑动；放大时 `Transparent`，Pan 平移，还不挡下层的捏合和双击

再配合 Swiper 的 `disableSwipe` 动态开关：放大且没到 X 边界时禁翻页，到边界或默认尺寸时放行。

分家之后的效果：

![演示动画：1 倍左右滑动跟手翻页](./images/PixPin_2026-08-06_02-16-30.webp)

![演示动画：放大后单指平移图片](./images/PixPin_2026-08-06_02-17-10.webp)

翻页跟手了，平移也跟手了。懂的都懂。

### 状态放哪，决定卡不卡

缩放平移状态放在父组件，Pan 每帧一更新，整个页面（所有 Swiper 页）跟着重建。放到单页子组件（`PreviewItem`）的 `@Local` 里，每帧只重绘当前页。

另外 `disableSwipe` 要上报给父组件，但必须去重──只在状态真正变化时回调，不然平移过程里父组件每帧都在重建。

### 缩放计算要用图片真实显示尺寸

`onComplete` 拿源图宽高比，按 Contain 规则算实际显示尺寸（窄图时比容器小）。缩放中心、偏移补偿、边界限制全都基于它。用容器尺寸近似的话，缩放中心会漂，图片会跳。

搞定之后，捏合终于能围着手指转了：

![演示动画：双指捏合围绕手指中心缩放](./images/PixPin_2026-08-06_02-17-10.webp)

## 公式，这个真的绕不开

### 设变量

先把符号定义清楚（单位都是 vp；`center` 系是相对图片的百分比，范围 0~1）：

- `imageW` / `imageH`：图片 Contain 适配后的显示尺寸（宽/高）
- `containerW` / `containerH`：容器（屏幕）的宽/高
- `lastScale`：手势开始时的缩放倍率；`scale`：本次手势事件的缩放增量，最终倍率 `curScale = lastScale * scale`
- `lastOffsetX` / `lastOffsetY`：手势开始时的平移偏移；`offX` / `offY`：本次手势事件产生的偏移增量
- `centerX` / `centerY`：缩放中心相对图片的百分比（0~1），取值约定为 `1 - c`（见"centerX 怎么算"）
- `cX` / `cY`：捏合中心相对图片显示区域的百分比（0~1）

用到的计算方式就三种：

- **clamp 截断**：`clamp(x, lo, hi) = min(max(x, lo), hi)`，越界直接拉回边界
- **百分比化**：坐标差值 ÷ 对应显示尺寸，得到相对图片的百分比
- **倍率传递**：`curScale = lastScale * scale`——手势增量乘在**手势开始时的值**上，而不是当前值上。这样每次手势独立计算，不累计误差，松手再捏不会越放越大

### 公式是怎么来的

要求很简单：手指按着图片的哪个位置，缩放完那个位置还得在手指底下，不能跑。

把这句话写成式子。图片上百分比位置 c 的那个点，屏幕坐标是：

```
X = imgX + c * imageW * scale
```

`imgX` 是图片显示区的左边界（图片在容器里居中，再叠加上已有的平移）：

```
imgX = (containerW - imageW * scale) / 2 + offsetX
```

缩放前 scale = lastScale、offsetX = lastOffsetX，缩放后 scale' = lastScale * scale、offsetX' 是要求的东西。"手指底下的点不能跑"就是缩放前后 X 相等：

```
imgX' + c * imageW * scale' = imgX + c * imageW * lastScale
```

把两边的 `imgX` 展开，移项合并，解出 `offsetX'`：

```
offsetX' = lastOffsetX + (0.5 - c) * imageW * (1 - scale) * lastScale
```

即官方公式的：

```
scale'   = clamp(lastScale * scale, minScale, maxScale)
offsetX' = (lastOffsetX + offX) + (0.5 - centerX) * imageW * (1 - scale) * lastScale
offsetY' = (lastOffsetY + offY) + (0.5 - centerY) * imageH * (1 - scale) * lastScale
```

拆开看：第一项 `lastOffsetX + offX` 是平移带来的直接位移；第二项 `(0.5 - centerX) * imageW * (1 - scale) * lastScale` 是"缩放中心不在图片中心"欠下的补偿——缩放本身围绕组件中心转，捏合点不在中心，就要额外平移一段把捏合点钉在原地。捏合点正好在中心（centerX = 0.5）时这项归零，公式退化成纯平移，符合直觉。

### centerX 怎么算

捏合中心坐标是相对组件的，要换成"相对图片"的百分比：先减去图片显示区左边界，再除以图片当前显示宽：

```
imgX = (containerW - imageW * lastScale) / 2 + lastOffsetX   // 图片显示区左边界
cX   = clamp((pinchCenterX - imgX) / (imageW * lastScale), 0, 1)
centerX = 1 - cX
```

还有两个细节：

- **`1 - cX` 是咋回事**：解方程的时候正负号正好差一个，官方的 evaluateCenter 就是这么约定的，两边抵消，不用纠结
- **为啥要 clamp 到 [0,1]**：Contain 后图片可能比屏幕小，捏合点落在黑边区域时百分比会越界，不 clamp 的话补偿项算出离谱的偏移，图片直接表演瞬移

### 边界为什么长那样

图片放大后显示宽 `scaledW = imageW * curScale`，超出屏幕的部分是 `scaledW - containerW`，往左往右各分一半，就是 X 方向偏移的上限：

```
scaledW = imageW * curScale
maxX    = scaledW > containerW ? (scaledW - containerW) / 2 : 0
// offset 逐轴 clamp 到 [-maxX, +maxX]；图片没铺满屏幕时强制居中
```

图片比屏幕窄的时候 `scaledW - containerW` 是负数，压根没有可平移的空间，上限强制归 0（保持居中）。Y 方向同理。

### 平移和双击：公式复用

是不是没想到，平移和双击这俩看着八竿子打不着的操作，用的居然是同一套公式。

平移跟手：Pan 时 scale 恒为 1，公式里 `(1 - scale) = 0`，补偿项直接消失，退化成 `offsetX' = lastOffsetX + offX`——手指拖多少，图片移多少，就这。

双击放大：点击位置（`TapGestureEvent.tapLocation.x/y`）按上面那套算百分比，代入同一套公式，`lastScale=1、offset=0、scale=2.5`，外面套个 `animateTo` 就是"点哪放大哪"，一套公式走天下：

![演示动画：双击放大（以点击处为中心）](./images/PixPin_2026-08-06_02-17-58.webp)

## 最终代码

```ts
// 预览页跳转参数：图片 URL 列表 + 初始索引
export interface ImagePreviewParam {
  urls: string[]
  index: number
}

// Image.onComplete 回调携带的源图尺寸（像素）
interface ImageCompleteInfo {
  width: number
  height: number
}

// 单页图片项。按官方最佳实践（bpta-picture-preview）实现：
//   - 统一 onScale() 入口：缩放/平移共用，含围绕捏合中心的偏移补偿公式
//   - 边界限制 boundaryRestrict()：按当前 scale 计算 offset 范围，
//     到 X 边界时放行 Swiper 翻页（disableSwipe 状态经回调上抛给父组件）
//   - 捏合/双击挂 Image；平移挂透明覆盖层（避免 Pan 阻塞 Swiper 滑动识别）
@ComponentV2
struct PreviewItem {
  @Param url: string = ''
  @Param resetKey: number = 0
  @Param onDisableSwipeChange: (flag: boolean) => void = () => {}
  // 当前缩放/偏移（@Local 驱动 UI）
  @Local curScale: number = 1
  @Local curOffsetX: number = 0
  @Local curOffsetY: number = 0
  // 手势起始快照（普通字段，不触发重绘）
  private lastScale: number = 1
  private lastOffsetX: number = 0
  private lastOffsetY: number = 0
  // 缩放中心百分比（相对图片，0~1；官方 evaluateCenter）
  private centerX: number = 0.5
  private centerY: number = 0.5
  private minScale: number = 1
  private maxScale: number = 4
  // 容器尺寸（onAreaChange 记录）
  private containerW: number = 0
  private containerH: number = 0
  // 图片实际显示尺寸（Contain 适配后，onComplete 源图比例计算；0=未加载，用容器近似）
  private imageW: number = 0
  private imageH: number = 0
  // disableSwipe 上次上报值：仅在状态变化时回调父组件，
  // 避免平移过程中每帧触发父组件整页重建（卡顿根源）
  private lastDisableFlag: boolean = false

  // 当前图片显示尺寸（官方 imageWidth/imageHeight）：
  // 缩放中心/偏移/边界计算都基于它，"跟手"（缩放中心保持不动）才精确
  private imgW(): number {
    return this.imageW > 0 ? this.imageW : this.containerW
  }

  private imgH(): number {
    return this.imageH > 0 ? this.imageH : this.containerH
  }

  // 图片加载完成后按源图宽高比计算 Contain 适配后的显示尺寸
  private updateImageSize(srcWidth: number, srcHeight: number): void {
    if (srcWidth <= 0 || srcHeight <= 0) {
      return
    }
    const ratio = srcWidth / srcHeight
    let dw = this.containerW
    let dh = dw / ratio
    if (dh > this.containerH) {
      dh = this.containerH
      dw = dh * ratio
    }
    this.imageW = dw
    this.imageH = dh
  }

  @Monitor('resetKey')
  onResetKey(): void {
    this.resetTransform()
  }

  private resetTransform(): void {
    this.curScale = 1
    this.curOffsetX = 0
    this.curOffsetY = 0
    this.lastScale = 1
    this.lastOffsetX = 0
    this.lastOffsetY = 0
    this.centerX = 0.5
    this.centerY = 0.5
    // 切页后旧图尺寸作废：新图加载完成（onComplete）前按容器近似，
    // 避免沿用上一张图的显示尺寸导致缩放中心/边界计算错误
    this.imageW = 0
    this.imageH = 0
    this.reportDisable(false)
  }

  // 状态变化才上报（去重）
  private reportDisable(flag: boolean): void {
    if (flag !== this.lastDisableFlag) {
      this.lastDisableFlag = flag
      this.onDisableSwipeChange(flag)
    }
  }

  // 缩放/平移统一计算（官方 onScale）：
  //   scale' = lastScale * scale
  //   offset' = (lastOffset + off) + (0.5 - center) * imageSize * (1 - scale) * lastScale
  private onScale(scale: number, offX: number, offY: number): void {
    let s = this.lastScale * scale
    if (s > this.maxScale) {
      s = this.maxScale
    } else if (s < this.minScale) {
      s = this.minScale
    }
    this.curScale = s
    this.curOffsetX = (this.lastOffsetX + offX) + (0.5 - this.centerX) * this.imgW() * (1 - scale) * this.lastScale
    this.curOffsetY = (this.lastOffsetY + offY) + (0.5 - this.centerY) * this.imgH() * (1 - scale) * this.lastScale
    this.boundaryRestrict()
  }

  // 边界限制（官方 pictureBoundaryRestriction + evaluateOffsetRange）：
  // 按当前 scale 与图片实际显示尺寸计算 offset 范围，超界取边界；
  // X 方向触及边界时放行 Swiper 翻页
  private boundaryRestrict(): void {
    const scaledW = this.imgW() * this.curScale
    const scaledH = this.imgH() * this.curScale
    let maxX = 0
    if (scaledW > this.containerW) {
      maxX = (scaledW - this.containerW) / 2
    }
    let maxY = 0
    if (scaledH > this.containerH) {
      maxY = (scaledH - this.containerH) / 2
    }
    let disable = this.curScale > 1
    if (this.curOffsetX > maxX) {
      this.curOffsetX = maxX
      disable = false
    } else if (this.curOffsetX < -maxX) {
      this.curOffsetX = -maxX
      disable = false
    }
    if (this.curOffsetY > maxY) {
      this.curOffsetY = maxY
    } else if (this.curOffsetY < -maxY) {
      this.curOffsetY = -maxY
    }
    // 图片未铺满屏幕时强制居中
    if (scaledW <= this.containerW) {
      this.curOffsetX = 0
    }
    if (scaledH <= this.containerH) {
      this.curOffsetY = 0
    }
    this.reportDisable(disable)
  }

  // 计算缩放中心百分比（官方 evaluateCenter）：捏合中心相对图片显示区域的位置。
  // 注意：捏合中心可能落在图片外的黑边区域（Contain 后图片小于屏幕），
  // 百分比必须双向 clamp 到 [0,1]，否则补偿公式会算出异常偏移（图片跳动）。
  private evaluateCenter(pinchCenterX: number, pinchCenterY: number): void {
    const imgX = (this.containerW - this.imgW() * this.lastScale) / 2 + this.lastOffsetX
    const imgY = (this.containerH - this.imgH() * this.lastScale) / 2 + this.lastOffsetY
    const imgW = this.imgW() * this.lastScale
    const imgH = this.imgH() * this.lastScale
    const cX = Math.min(Math.max((pinchCenterX - imgX) / imgW, 0), 1)
    const cY = Math.min(Math.max((pinchCenterY - imgY) / imgH, 0), 1)
    // 官方实现：centerX = 1 - cX（缩放补偿公式中 (0.5 - centerX)）
    this.centerX = 1 - cX
    this.centerY = 1 - cY
  }

  build() {
    Stack() {
      Image(`${SERVER_ROOT}${this.url}`)
        .width('100%')
        .height('100%')
        .objectFit(ImageFit.Contain)
        .draggable(false)
        .interpolation(ImageInterpolation.Medium)
        .scale({ x: this.curScale, y: this.curScale, z: 1 })
        .translate({ x: this.curOffsetX, y: this.curOffsetY, z: 0 })
        .onComplete((event?: ImageCompleteInfo) => {
          if (event) {
            this.updateImageSize(event.width, event.height)
          }
        })
        // Image 上只挂捏合 + 双击：不注册 PanGesture，
        // 避免阻塞 Swiper 的原生滑动识别（1 倍时跟手翻页）。
        // 手势在 build 内联创建（字段初始化时手势 API 返回 undefined 会崩溃）。
        .gesture(
          GestureGroup(GestureMode.Parallel,
            PinchGesture({ fingers: 2, distance: 1 })
              .onActionStart((event: GestureEvent) => {
                this.evaluateCenter(event.pinchCenterX, event.pinchCenterY)
                this.lastScale = this.curScale
                this.lastOffsetX = this.curOffsetX
                this.lastOffsetY = this.curOffsetY
              })
              .onActionUpdate((event: GestureEvent) => {
                this.onScale(event.scale, event.offsetX, event.offsetY)
              })
              .onActionEnd(() => {
                this.lastScale = this.curScale
                this.lastOffsetX = this.curOffsetX
                this.lastOffsetY = this.curOffsetY
              }),
            TapGesture({ count: 2 })
              .onAction((event: TapGestureEvent) => {
                animateTo({ duration: 200 }, () => {
                  if (this.curScale > 1) {
                    this.resetTransform()
                  } else {
                    // 点哪放大哪：以双击位置为缩放中心放大到 2.5 倍。
                    // 官方 evaluateCenter：c = 点击点相对图片显示区域的百分比，center = 1 - c；
                    // onScale 公式：offset = (0.5 - center) * imageSize * (1 - scale) * lastScale
                    const clickX = event.tapLocation?.x ?? 0
                    const clickY = event.tapLocation?.y ?? 0
                    // 双击点在图片外（黑边区域）时按边缘处理
                    const cX = Math.min(Math.max(clickX / this.imgW(), 0), 1)
                    const cY = Math.min(Math.max(clickY / this.imgH(), 0), 1)
                    this.centerX = 1 - cX
                    this.centerY = 1 - cY
                    this.lastScale = 1
                    this.lastOffsetX = 0
                    this.lastOffsetY = 0
                    this.curScale = 2.5
                    this.curOffsetX = (0.5 - this.centerX) * this.imgW() * (1 - 2.5)
                    this.curOffsetY = (0.5 - this.centerY) * this.imgH() * (1 - 2.5)
                    this.boundaryRestrict()
                    this.reportDisable(true)
                  }
                })
              })
          )
        )

      // 平移手势覆盖层：仅在放大态参与命中（Transparent 自身响应且不挡下层
      // Image 的捏合/双击；None 时完全穿透，Swiper 独占滑动）。
      // 透明背景确保命中区域有效。
      Column()
        .width('100%')
        .height('100%')
        .backgroundColor(Color.Transparent)
        .hitTestBehavior(this.curScale > 1 ? HitTestMode.Transparent : HitTestMode.None)
        .gesture(
          PanGesture({ fingers: 1, distance: 3 })
            .onActionStart(() => {
              this.lastScale = this.curScale
              this.lastOffsetX = this.curOffsetX
              this.lastOffsetY = this.curOffsetY
            })
            .onActionUpdate((event: PanGestureEvent) => {
              this.onScale(1, event.offsetX, event.offsetY)
            })
            .onActionEnd(() => {
              this.lastOffsetX = this.curOffsetX
              this.lastOffsetY = this.curOffsetY
            })
        )
    }
    .width('100%')
    .height('100%')
    .onAreaChange((_oldValue: Area, newValue: Area) => {
      this.containerW = (newValue.width as number) ?? 0
      this.containerH = (newValue.height as number) ?? 0
    })
  }
}

// 全屏图片预览页（Navigation 页面级容器，非弹层）。
// 按官方最佳实践：Swiper 负责翻页（原生跟手滑动），
// disableSwipe 动态控制（放大未到边界时禁翻页，到边界/默认尺寸时放行）。
@ComponentV2
export default struct ImagePreviewView {
  @Consumer('navStack') navStack: NavPathStack = new NavPathStack()
  @Local urls: string[] = []
  @Local previewIndex: number = 0
  // 放大且未到 X 边界时为 true：Swiper 禁翻页（拖动平移图片）；
  // 默认尺寸/到边界时为 false：Swiper 恢复原生滑动翻页
  @Local isDisableSwipe: boolean = false
  // 切页时递增，通知所有 PreviewItem 重置缩放/偏移
  @Local resetKey: number = 0
  private swiperController: SwiperController = new SwiperController()

  build() {
    NavDestination() {
      Stack() {
        Column()
          .width('100%')
          .height('100%')
          .backgroundColor(Color.Black)
        Swiper(this.swiperController) {
          ForEach(this.urls, (url: string) => {
            PreviewItem({
              url: url,
              resetKey: this.resetKey,
              onDisableSwipeChange: (flag: boolean) => {
                this.isDisableSwipe = flag
              }
            })
          }, (url: string) => url)
        }
        .width('100%')
        .height('100%')
        .index(this.previewIndex)
        .duration(300)
        // 关闭相邻页预加载：网络大图后台解码会抢占渲染资源，导致拖动跟手卡顿
        .cachedCount(0)
        .disableSwipe(this.isDisableSwipe)
        .onChange((index: number) => {
          this.previewIndex = index
          this.resetKey += 1
          this.isDisableSwipe = false
        })
        .indicator(false)

        // 页码指示
        if (this.urls.length > 1) {
          Text(`${this.previewIndex + 1} / ${this.urls.length}`)
            .fontSize(14)
            .fontColor(Color.White)
            .position({ x: '50%', y: '92%' })
            .translate({ x: '-50%' })
        }

        // 关闭按钮
        SymbolGlyph($r('sys.symbol.xmark_circle_fill'))
          .fontSize(26)
          .fontColor([Color.White])
          .position({ x: '90%', y: 12 })
          .onClick(() => {
            this.navStack.pop()
          })
      }
      .width('100%')
      .height('100%')
    }
    .hideTitleBar(true)
    .backgroundColor(Color.Black)
    .onReady((context: NavDestinationContext) => {
      const param = context.pathInfo.param as Record<string, Object> | undefined
      if (param !== undefined) {
        this.urls = (param['urls'] as string[]) ?? []
        const idx = (param['index'] as number) ?? 0
        this.previewIndex = (idx >= 0 && idx < this.urls.length) ? idx : 0
      }
    })
  }
}

// 系统路由表构建函数（router_map.json buildFunction 引用）
@Builder
export function ImagePreviewViewBuilder(name: string, param: Object) {
  ImagePreviewView()
}
```

## 完结撒花

回头看，难点不是手势怎么写，而是三个决定：

1. 用全屏页面容器，别用弹层
2. 手势分家：捏合/双击挂 Image，平移挂覆盖层，别堵死 Swiper
3. 状态放单页子组件，上报去重

这三个定下来，剩下的公式只是体力活。

收工，跑路了（不是）。
