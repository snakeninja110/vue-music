<template>
  <div class="slider" ref="slider">
    <div class="slider-group" ref="sliderGroup">
      <slot></slot>
    </div>
    <div class="dots" v-if="showDot">
      <span class="dot" v-for="(item, index) in dots" :key="index" :class="{active: currentPageIndex === index}"></span>
    </div>
  </div>
</template>

<script>
import BScroll from 'better-scroll'
import {addClass} from 'common/js/dom'

export default {
  data () {
    return {
      dots: [],
      currentPageIndex: 0
    }
  },
  props: {
    loop: {
      type: Boolean,
      default: true
    },
    autoPlay: {
      type: Boolean,
      default: true
    },
    showDot: {
      type: Boolean,
      default: true
    },
    interval: {
      type: Number,
      default: 4000
    },
    click: {
      type: Boolean,
      default: true
    },
    allowVerticalScroll: {
      type: Boolean,
      default: true
    }
  },
  mounted () {
    setTimeout(() => {
      this._setSliderWidth()
      if (this.showDot) {
        this._initDots()
      }
      this._initSlider()

      if (this.autoPlay) {
        this._play()
      }
    }, 20)

    window.addEventListener('resize', () => {
      if (!this.slider || !this.slider.enabled) {
        return
      }
      clearTimeout(this.resizeTimer)
      this.resizeTimer = setTimeout(() => {
        if (this.slider.isInTransition) {
          this._onScrollEnd()
        } else {
          if (this.autoPlay) {
            this._play()
          }
        }
      }, 60)
      this.refresh()
    })
  },
  activated () {
    this.slider.enabled()
    let pageIndex = this.slider.getCurrentPage().pageX
    if (pageIndex > this.dots.length) {
      pageIndex = pageIndex % this.dots.length
    }
    this.slider.goToPage(pageIndex, 0, 0)
    if (this.loop) {
      pageIndex -= 1
    }
    this.currentPageIndex = pageIndex
    if (this.autoPlay) {
      this._play()
    }
  },
  deactivated () {
    this.slider.disable()
    clearTimeout(this.timer)
  },
  beforeDestroy () {
    // 生命周期结束后清空计时器资源,有利于内存释放
    this.slider.disable()
    clearTimeout(this.timer)
  },
  methods: {
    refresh () {
      this._setSliderWidth(true)
      this.slider.refresh()
    },
    next () {
      this.slider.next()
    },
    _setSliderWidth (isResize) {
      this.children = this.$refs.sliderGroup.children

      let width = 0
      let sliderWidth = this.$refs.slider.clientWidth
      for (let i = 0; i < this.children.length; i++) {
        let child = this.children[i]
        addClass(child, 'slider-item')
        child.style.width = sliderWidth + 'px'
        width += sliderWidth
      }

      if (this.loop && !isResize) {
        width += 2 * sliderWidth
      }
      this.$refs.sliderGroup.style.width = width + 'px'
    },
    _initDots () {
      this.dots = new Array(this.children.length)
    },
    _initSlider () {
      // 初始化better-scroll给slider
      this.slider = new BScroll(this.$refs.slider, {
        // https://github.com/ustbhuangyi/better-scroll
        scrollX: true,
        eventPassthrough: this.allowVerticalScroll ? 'vertical' : 'false',
        momentum: false,
        snap: {
          loop: this.loop,
          threshold: 0.3,
          speed: 400
        },
        click: this.click
      })

      // 滚动完成后设置当前滚动的图片下标
      this.slider.on('scrollEnd', this._onScrollEnd)

      this.slider.on('touchend', () => {
        if (this.autoPlay) {
          this._play()
        }
      })

      this.slider.on('beforeScrollStart', () => {
        if (this.autoPlay) {
          clearTimeout(this.timer)
        }
      })
    },
    _onScrollEnd () {
      let pageIndex = this.slider.getCurrentPage().pageX // 当前滚动到的页面下标
      if (this.loop) {
        pageIndex -= 1
      }
      this.currentPageIndex = pageIndex

      if (this.autoPlay) {
        clearTimeout(this.timer)
        this._play()
      }
    },
    _play () {
      let pageIndex = this.slider.getCurrentPage().pageX + 1
      clearTimeout(this.timer)

      this.timer = setTimeout(() => {
        this.slider.goToPage(pageIndex, 0, 400) // 0代表Y方向
      }, this.interval)
    }
  }
}
</script>

<style lang="stylus">
  @import "~common/stylus/variable"

  .slider
    min-height 1px
    .slider-group
      position relative
      overflow hidden
      white-space nowrap
      .slider-item
        float left
        box-sizing border-box
        overflow hidden
        text-align center
        a
          display block
          width 100%
          overflow hidden
          text-decoration none
        img
          display block
          width 100%
    .dots
      position absolute
      right 0
      left 0
      bottom 12px
      text-align center
      font-size 0
      .dot
        display inline-block
        margin 0 4px
        width 8px
        height 8px
        border-radius 50%
        background-color $color-text-l
        &.active
          width 20px
          border-radius 5px
          background-color $color-text-l
      
</style>
