---
title: 'Hand-Rolling an Image Viewer for HarmonyOS'
description: 'A blow-by-blow account of hand-rolling an image preview component for HarmonyOS: overlays, gesture wars, tuning mysticism, and the final code.'
pubDate: 2026-08-06 02:43:04
category: 'Tech'
heroImage: '../../../../zh-cn/2026/08/06/images/cover-arkui.png'
---

> **Translation notice**
>
> This English version was translated and proofread with the LLM **DeepSeek V4.1 Flash**. There may be ambiguities or inaccuracies — if something reads oddly, please leave a comment.

> Preface: I've been poking at HarmonyOS's ArkUI for the past few days. When I got to image preview, I found the current version ships no ready-made ImageViewer, so I had to hand-roll one. This post records the process, the wrecks, and the final code.

## The Requirements. That's It.

Tap a thumbnail, land on a full-screen page with a black background, swipe left and right through multiple images, pinch to zoom, double-tap to zoom in, and once zoomed in, drag around to inspect details. The image must not be draggable off-screen, and it must not leave black bars. That's it.

## Introductions: A Vue Veteran

This blog is written in Vue day to day, so when a requirement like this shows up, my brain auto-generates a plan:

- Encapsulate a component: visibility, index, and zoom state all live inside it, and the page just mounts `<ImagePreview :visible="..."/>` and calls it a day
- Mount the overlay onto the top of `body` with teleport, so parent `overflow` clipping can't touch it
- Bind gestures straight onto the image with `@touchstart`; the browser event model is mature, so they basically never fight each other
- Animate with CSS transform; keeping up with the finger is the browser rendering engine's problem

The approach is sound. The general order is: first figure out who responds to touch, then figure out where the state lives, and only then start writing the API.

But port that over to ArkUI as-is, and all three habits blow up in your face:

- The teleport thing → switch to a `bindSheet` overlay; the gesture environment is unreliable (version one below dies on exactly this)
- Binding gestures to an element → Pan blocks Swiper's swipe recognition outright (see the third section of "The Epiphany" below)
- State in the parent component → the entire page re-renders every frame, and it stutters (see the fourth section of "The Epiphany")

It's not that the thinking is wrong — its gesture system and rendering model just aren't the browser's: gestures compete with each other, and any state change diffs the whole component tree. Nearly every pit I fall into later is one of these three things made concrete.

## Version One: The Naïve bindSheet

Version one follows the Vue line of thinking: stuff all preview logic into the `PostImages` component, pop a `bindSheet` when a thumbnail is tapped, put the images in a Swiper inside it, and hang `PinchGesture` directly on the Image to change scale.

Three pieces of state: `showPreview`, `previewIndex`, `imgScale`. At the time I figured half a day would do it. And right — writing took half a day; fixing took three (sobbing).

In other app development, this kind of requirement is usually handled with a modal window + scrim + gesture listeners, so version one went straight for a `bindSheet` half-modal:

```ts
// Wrong implementation 1: bindSheet half-modal + gestures hung straight on Image
@ComponentV2
struct PostImages {
  @Local showPreview: boolean = false
  @Local previewIndex: number = 0
  @Local imgScale: number = 1

  build() {
    Column() {
      // Image grid (omitted)
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

The symptoms were baffling: after zooming in, pinch, pan, and double-tap each died in its own distinct way, no two alike. Edit after edit, the actual problem didn't budge an inch. Even when zooming occasionally worked, it only zoomed from the image center, panning was impossible afterwards, and a sideways swipe flipped the page.

I couldn't hold it together anymore. After ages of thrashing, I conceded: for an immersive interaction like full-screen image viewing, just don't use an overlay. Switch to a Navigation full-screen page (`hideTitleBar(true)`), and the problems vanish instantly.

## Copied the Homework, Got Half a Result

I searched around the web and found a post on HUAWEI Developers about [implementing image preview](https://developer.huawei.com/consumer/cn/forum/topic/0201176484979900866), plus the matching official docs on the [image previewer](https://developer.huawei.com/consumer/cn/doc/best-practices/bpta-picture-preview). Homework already done — copy it!

The core technique is hanging the gesture on the Image and coordinating the conflict with a dynamic `distance` + `disableSwipe`:

```ts
// Wrong implementation 2: PanGesture on Image + dynamic distance / disableSwipe (the officially recommended approach)
PanGesture({ fingers: 1, distance: this.isDisableSwipe ? 3 : 50 })
  .onActionUpdate((event: GestureEvent) => {
    this.isDisableSwipe = this.imageModel.panGestureUpdate(event)
  })
```

After copying it verbatim, horizontal swipe paging worked, pinch zoom worked, and zoom even pivoted around the finger. Only post-zoom panning was left: either there was a dead zone, or nothing happened at all.

Fine. Since there's at least a little bit of an effect now, I refuse to believe I can't beat this thing.

So the parameter tuning began: distance from 50 to 3, then from 3 to 100000, every combination of `disableSwipe` in rotation — the symptoms didn't budge. I even suspected the emulator was at fault.

![Demo of the broken implementation](../../../../zh-cn/2026/08/06/images/PixPin_2026-08-06_01-42-39.webp)

As for the real cause, let's leave it as a cliffhanger and get to it later.

## Reviewing What Went Wrong, and the Sudden Epiphany

Based on the experience from the first two versions, it boils down to the following problems

### Gesture Objects Can't Live in Fields

Trying to be elegant, I extracted the gesture into a component field and was rewarded with an app crash:

```
TypeError: Cannot read property onActionUpdate of undefined
```

When a `@ComponentV2` component's fields are initialized the UI environment isn't ready yet, and calling `PinchGesture()` at that point returns undefined.

So gesture objects can only be created inline in `build()`.

### Pan Can't Be Hung on a Swiper Child

Back to the cliffhanger: why did no parameter have any effect?

I tried everything I could: dynamic distance, conditional gestures, placeholder gestures, Swiper fake dragging (`fakeDragBy`). Conditional gestures killed zoom outright; fake dragging worked but produced code too complex to maintain.

Only at the end did it click that the problem wasn't the parameters but the structure: **the moment PanGesture is registered on a Swiper's Image child, no matter how large the distance is, Swiper's swipe recognition gets blocked**. The two gestures block each other structurally; no parameter can save you.

The correct answer is to separate the gestures:

- Only `PinchGesture` and `TapGesture` (double-tap) on the Image
- Hang the pan gesture on a transparent overlay and control hit testing with `hitTestBehavior`: at 1× it's `None`, so input passes straight through and Swiper owns swiping; when zoomed it's `Transparent`, so Pan handles panning without blocking pinch and double-tap on the layer below

Combine that with Swiper's dynamic `disableSwipe` switch: block paging while zoomed and not yet at an X boundary; allow it at the boundary or at default size.

After the split:

![Demo animation: swiping at 1× pages along with the finger](../../../../zh-cn/2026/08/06/images/PixPin_2026-08-06_02-16-30.webp)

![Demo animation: panning the image with one finger after zooming in](../../../../zh-cn/2026/08/06/images/PixPin_2026-08-06_02-17-10.webp)

Paging follows the finger, panning follows the finger. Those who know, know.

### Where State Lives Decides Whether It Stutters

Keep zoom and pan state in the parent, and every Pan frame rebuilds the whole page (all Swiper pages). Put it in the single-page child component (`PreviewItem`) as `@Local`, and only the current page redraws each frame.

Also, `disableSwipe` has to be reported up to the parent, but it must be deduplicated — only call back when the state actually changes, otherwise the parent rebuilds every frame during panning.

### Zoom Math Needs the Image's Real Displayed Size

`onComplete` gives the source image's aspect ratio; compute the actual displayed size by the Contain rule (a narrow image ends up smaller than the container). Zoom center, offset compensation, and boundary limiting all build on it. Approximate with the container size and the zoom center drifts and the image jumps.

Once that was sorted, pinch finally pivoted around the finger:

![Demo animation: two-finger pinch zooming around the finger center](../../../../zh-cn/2026/08/06/images/PixPin_2026-08-06_02-17-10.webp)

## The Formulas. There's Really No Way Around Them.

### Defining Variables

Let's get the notation straight first (all units are vp; the `center` family is a percentage relative to the image, range 0–1):

- `imageW` / `imageH`: the displayed size of the image after Contain fitting (width/height)
- `containerW` / `containerH`: the width/height of the container (screen)
- `lastScale`: the zoom factor when the gesture started; `scale`: the zoom delta of this gesture event, giving the final factor `curScale = lastScale * scale`
- `lastOffsetX` / `lastOffsetY`: the pan offset when the gesture started; `offX` / `offY`: the offset delta produced by this gesture event
- `centerX` / `centerY`: the zoom center as a percentage relative to the image (0–1), by convention `1 - c` (see "How to Compute centerX")
- `cX` / `cY`: the pinch center as a percentage relative to the image's displayed area (0–1)

Only three kinds of computation are involved:

- **clamp**: `clamp(x, lo, hi) = min(max(x, lo), hi)` — anything out of range is pulled back to the boundary
- **Percentaging**: divide a coordinate difference by the corresponding displayed size to get a percentage relative to the image
- **Factor chaining**: `curScale = lastScale * scale` — the gesture delta multiplies **the value at gesture start**, not the current value. That way each gesture is computed independently, no accumulated error, and letting go and pinching again doesn't keep magnifying

### Where the Formula Comes From

The requirement is simple: whatever spot on the image your finger is holding, after zooming that spot must still be under your finger. It must not run away.

Turn that into an equation. The point at percentage position c on the image has screen coordinate:

```
X = imgX + c * imageW * scale
```

`imgX` is the left edge of the image's displayed area (the image is centered in the container, plus the existing pan):

```
imgX = (containerW - imageW * scale) / 2 + offsetX
```

Before zooming, scale = lastScale and offsetX = lastOffsetX; after zooming, scale' = lastScale * scale and offsetX' is what we're solving for. "The point under the finger must not run" means X is equal before and after:

```
imgX' + c * imageW * scale' = imgX + c * imageW * lastScale
```

Expand the `imgX` on both sides, move terms around, and solve for `offsetX'`:

```
offsetX' = lastOffsetX + (0.5 - c) * imageW * (1 - scale) * lastScale
```

Which is the official formula:

```
scale'   = clamp(lastScale * scale, minScale, maxScale)
offsetX' = (lastOffsetX + offX) + (0.5 - centerX) * imageW * (1 - scale) * lastScale
offsetY' = (lastOffsetY + offY) + (0.5 - centerY) * imageH * (1 - scale) * lastScale
```

Break it apart: the first term `lastOffsetX + offX` is the direct displacement from panning; the second term `(0.5 - centerX) * imageW * (1 - scale) * lastScale` is the compensation owed for "the zoom center isn't the image center" — scaling itself pivots around the component center, so if the pinch point isn't at the center you have to translate a bit extra to nail the pinch point in place. When the pinch point is exactly at the center (centerX = 0.5) this term goes to zero and the formula degenerates into pure translation, which matches intuition.

### How to Compute centerX

The pinch center coordinate is relative to the component, so it has to be converted into a percentage "relative to the image": first subtract the left edge of the image's displayed area, then divide by the image's current displayed width:

```
imgX = (containerW - imageW * lastScale) / 2 + lastOffsetX   // left edge of the image's displayed area
cX   = clamp((pinchCenterX - imgX) / (imageW * lastScale), 0, 1)
centerX = 1 - cX
```

Two more details:

- **What's the deal with `1 - cX`**: when solving the equation the sign is off by exactly one; the official evaluateCenter is defined this way and the two sides cancel out, so don't agonize over it
- **Why clamp to [0,1]**: after Contain the image may be smaller than the screen, so when the pinch point lands in the black-bar area the percentage goes out of range. Without clamping, the compensation term produces an absurd offset and the image performs a teleport

### Why the Boundaries Look Like That

Once zoomed, the displayed width is `scaledW = imageW * curScale`; the part exceeding the screen is `scaledW - containerW`, split half to the left and half to the right — that's the upper limit for offset on the X axis:

```
scaledW = imageW * curScale
maxX    = scaledW > containerW ? (scaledW - containerW) / 2 : 0
// clamp offset per axis to [-maxX, +maxX]; force centering when the image doesn't fill the screen
```

When the image is narrower than the screen, `scaledW - containerW` is negative and there's no pannable room at all, so the limit is forced to 0 (stay centered). Same for Y.

### Pan and Double-Tap: Reusing the Formula

Bet you didn't expect that panning and double-tap — two operations that look about as related as chalk and cheese — actually use the same formula.

Pan following the finger: during Pan, scale is always 1, `(1 - scale) = 0` in the formula, the compensation term vanishes, and it degenerates into `offsetX' = lastOffsetX + offX` — the finger drags by how much, the image moves by how much. That's it.

Double-tap to zoom: run the tap position (`TapGestureEvent.tapLocation.x/y`) through the percentage math above, plug it into the same formula with `lastScale=1, offset=0, scale=2.5`, wrap it in `animateTo`, and you get "zoom wherever you tap" — one formula to rule them all:

![Demo animation: double-tap to zoom (centered on the tap)](../../../../zh-cn/2026/08/06/images/PixPin_2026-08-06_02-17-58.webp)

## The Final Code

```ts
// Navigation parameters for the preview page: image URL list + initial index
export interface ImagePreviewParam {
  urls: string[]
  index: number
}

// Source image size (pixels) carried by the Image.onComplete callback
interface ImageCompleteInfo {
  width: number
  height: number
}

// A single-page image item. Implemented per the official best practice (bpta-picture-preview):
//   - A unified onScale() entry point: shared by zoom/pan, including the offset
//     compensation formula around the pinch center
//   - Boundary limiting boundaryRestrict(): compute the offset range from the current
//     scale, and let Swiper page when the X boundary is reached
//     (the disableSwipe state is bubbled up to the parent via callback)
//   - Pinch/double-tap on the Image; pan on a transparent overlay
//     (so Pan doesn't block Swiper's swipe recognition)
@ComponentV2
struct PreviewItem {
  @Param url: string = ''
  @Param resetKey: number = 0
  @Param onDisableSwipeChange: (flag: boolean) => void = () => {}
  // Current zoom/offset (@Local drives the UI)
  @Local curScale: number = 1
  @Local curOffsetX: number = 0
  @Local curOffsetY: number = 0
  // Gesture start snapshot (plain fields, no re-render triggered)
  private lastScale: number = 1
  private lastOffsetX: number = 0
  private lastOffsetY: number = 0
  // Zoom center percentage (relative to the image, 0~1; official evaluateCenter)
  private centerX: number = 0.5
  private centerY: number = 0.5
  private minScale: number = 1
  private maxScale: number = 4
  // Container size (recorded by onAreaChange)
  private containerW: number = 0
  private containerH: number = 0
  // The image's actual displayed size (after Contain fitting, computed from the source
  // ratio in onComplete; 0 = not loaded, approximate with the container)
  private imageW: number = 0
  private imageH: number = 0
  // Last reported disableSwipe value: only call back the parent when the state changes,
  // so panning doesn't trigger a full-page parent rebuild every frame (the root of the stutter)
  private lastDisableFlag: boolean = false

  // Current displayed image size (official imageWidth/imageHeight): zoom center, offset,
  // and boundary math all build on it, which is what makes "following the finger"
  // (keeping the zoom center fixed) precise
  private imgW(): number {
    return this.imageW > 0 ? this.imageW : this.containerW
  }

  private imgH(): number {
    return this.imageH > 0 ? this.imageH : this.containerH
  }

  // Once the image loads, compute the Contain-fitted display size from the source aspect ratio
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
    // After a page change the old image's size is void: approximate with the container until
    // the new image loads (onComplete), so we don't reuse the previous image's displayed size
    // and break the zoom center/boundary math
    this.imageW = 0
    this.imageH = 0
    this.reportDisable(false)
  }

  // Report only on state change (dedupe)
  private reportDisable(flag: boolean): void {
    if (flag !== this.lastDisableFlag) {
      this.lastDisableFlag = flag
      this.onDisableSwipeChange(flag)
    }
  }

  // Unified zoom/pan computation (official onScale):
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

  // Boundary limiting (official pictureBoundaryRestriction + evaluateOffsetRange):
  // compute the offset range from the current scale and the image's actual displayed
  // size, clamping to the boundary when exceeded; let Swiper page when the X boundary is hit
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
    // Force centering when the image doesn't fill the screen
    if (scaledW <= this.containerW) {
      this.curOffsetX = 0
    }
    if (scaledH <= this.containerH) {
      this.curOffsetY = 0
    }
    this.reportDisable(disable)
  }

  // Compute the zoom center percentage (official evaluateCenter): the position of the pinch
  // center relative to the image's displayed area.
  // Note: the pinch center may land in the black-bar area outside the image (after Contain
  // the image can be smaller than the screen), so the percentage must be clamped on both
  // sides to [0,1]; otherwise the compensation formula produces an abnormal offset
  // (the image jumps).
  private evaluateCenter(pinchCenterX: number, pinchCenterY: number): void {
    const imgX = (this.containerW - this.imgW() * this.lastScale) / 2 + this.lastOffsetX
    const imgY = (this.containerH - this.imgH() * this.lastScale) / 2 + this.lastOffsetY
    const imgW = this.imgW() * this.lastScale
    const imgH = this.imgH() * this.lastScale
    const cX = Math.min(Math.max((pinchCenterX - imgX) / imgW, 0), 1)
    const cY = Math.min(Math.max((pinchCenterY - imgY) / imgH, 0), 1)
    // Official implementation: centerX = 1 - cX (the (0.5 - centerX) in the zoom compensation formula)
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
        // Only pinch + double-tap on the Image: no PanGesture registered, so Swiper's native
        // swipe recognition isn't blocked (paging follows the finger at 1×).
        // Create gestures inline in build (calling the gesture API during field
        // initialization returns undefined and crashes).
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
                    // Zoom wherever you tap: zoom to 2.5× with the double-tap position as the center.
                    // Official evaluateCenter: c = the tap point as a percentage of the image's
                    // displayed area, center = 1 - c;
                    // onScale formula: offset = (0.5 - center) * imageSize * (1 - scale) * lastScale
                    const clickX = event.tapLocation?.x ?? 0
                    const clickY = event.tapLocation?.y ?? 0
                    // A double-tap outside the image (in the black-bar area) is treated as the edge
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

      // Pan gesture overlay: only participates in hit testing when zoomed (Transparent means
      // it responds itself without blocking pinch/double-tap on the Image below; None means a
      // full pass-through, and Swiper exclusively owns swiping).
      // A transparent background makes sure the hit area is valid.
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

// Full-screen image preview page (a Navigation page-level container, not an overlay).
// Per the official best practice: Swiper handles paging (native finger-following swipe), with
// disableSwipe dynamically controlled (block paging while zoomed and not at the boundary;
// allow it at the boundary or at default size).
@ComponentV2
export default struct ImagePreviewView {
  @Consumer('navStack') navStack: NavPathStack = new NavPathStack()
  @Local urls: string[] = []
  @Local previewIndex: number = 0
  // true while zoomed and not yet at the X boundary: Swiper paging is disabled (dragging pans the image);
  // false at default size or at the boundary: Swiper's native swipe paging is restored
  @Local isDisableSwipe: boolean = false
  // Incremented on page change to tell every PreviewItem to reset zoom/offset
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
        // Disable adjacent-page preloading: decoding large network images in the background
        // competes for render resources and makes dragging lag
        .cachedCount(0)
        .disableSwipe(this.isDisableSwipe)
        .onChange((index: number) => {
          this.previewIndex = index
          this.resetKey += 1
          this.isDisableSwipe = false
        })
        .indicator(false)

        // Page indicator
        if (this.urls.length > 1) {
          Text(`${this.previewIndex + 1} / ${this.urls.length}`)
            .fontSize(14)
            .fontColor(Color.White)
            .position({ x: '50%', y: '92%' })
            .translate({ x: '-50%' })
        }

        // Close button
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

// System route table builder function (referenced by router_map.json buildFunction)
@Builder
export function ImagePreviewViewBuilder(name: string, param: Object) {
  ImagePreviewView()
}
```

## And That's a Wrap

Looking back, the hard part wasn't how to write the gestures; it was three decisions:

1. Use a full-screen page container, not an overlay
2. Split the gestures: pinch/double-tap on the Image, pan on an overlay, don't block Swiper
3. Keep state in the single-page child, dedupe the reports

Once those three are settled, the remaining formulas are just manual labor.

Done. I'm out of here (not really).
