<template>
  <div ref="wrapper" class="scroll-wrapper">
    <div class="scroll-content">
      <slot>
      </slot>
      <slot name="pullup"
            :pullUpLoad="pullUpLoad"
            :isPullUpLoad="isPullUpLoad"
      >
        <div class="pullup-wrapper" v-if="data && data.length && pullUpLoad">
          <div class="before-trigger" v-if="!isPullUpLoad">
            <span>{{pullUpTxt}}</span>
          </div>
          <div class="after-trigger" v-else>
            <loading title=""></loading>
          </div>
        </div>
      </slot>
    </div>
    <slot name="pulldown"
          :pullDownRefresh="pullDownRefresh"
          :pullDownStyle="pullDownStyle"
          :beforePullDown="beforePullDown"
          :pulling="pulling"
          :bubbleY="bubbleY"
    >
      <div ref="pulldown" class="pulldown-wrapper" :style="pullDownStyle" v-if="data && data.length && pullDownRefresh">
        <div class="before-trigger" v-if="beforePullDown">
          <bubble :y="bubbleY"></bubble>
        </div>
        <div class="after-trigger" v-else>
          <div v-if="pulling" class="loading">
            <loading title=""></loading>
          </div>
          <div v-else><span>{{refreshTxt}}</span></div>
        </div>
      </div>
    </slot>
  </div>
</template>

<script>
  import BScroll from 'better-scroll'
  import Loading from '@/base/loading/loading'
  import Bubble from '@/base/bubble/bubble'

  const COMPONENT_NAME = 'scroll-list'
  const DIRECTION_H = 'horizontal'
  const DIRECTION_V = 'vertical'
  const DEFAULT_LOAD_TXT_MORE = '加载更多'
  const DEFAULT_LOAD_TXT_NO_MORE = '没有更多数据了'
  const DEFAULT_REFRESH_TXT = '刷新成功'

  export default {
    name: COMPONENT_NAME,
    props: {
      probeType: {
        type: Number,
        default: 1
      },
      click: {
        type: Boolean,
        default: true
      },
      data: {
        type: Array,
        default: null
      },
      listenScroll: {
        type: Boolean,
        default: false
      },
      derection: {
        type: String,
        default: DIRECTION_V
      },
      scrollbar: {
        type: null,
        default: false
      },
      pullUpLoad: {
        type: null,
        default: false
      },
      pullDownRefresh: {
        type: null,
        default: false
      },
      beforeScroll: {
        type: Boolean,
        default: false
      },
      startY: {
        type: Number,
        default: 0
      },
      refreshDelay: {
        type: Number,
        default: 20
      }
    },
    data () {
      return {
        beforePullDown: true,
        isRebounding: false,
        isPullingDown: false,
        isPullUpLoad: false,
        pulling: false,
        pullUpDirty: true,
        pullDownStyle: '',
        bubbleY: 0
      }
    },
    computed: {
      pullUpTxt () {
        const moreTxt = this.pullUpLoad && this.pullUpLoad.txt && this.pullUpLoad.txt.more || DEFAULT_LOAD_TXT_MORE

        const noMoreTxt = this.pullUpLoad && this.pullUpLoad.txt && this.pullUpLoad.txt.noMore || DEFAULT_LOAD_TXT_NO_MORE

        return this.pullUpDirty ? moreTxt : noMoreTxt
      },
      refreshTxt () {
        return this.pullDownRefresh && this.pullDownRefresh.txt || DEFAULT_REFRESH_TXT
      }
    },
    created () {
      this.pullDownInitTop = -55
    },
    methods: {
      _initScroll () {
        if (!this.$refs.wrapper) {
          return
        }

        let options = {
          probeType: this.probeType,
          click: this.click,
          // scrollY: this.direction === DIRECTION_V,
          scrollX: this.direction === DIRECTION_H,
          scrollbar: this.scrollbar,
          pullDownRefresh: this.pullDownRefresh,
          pullUpLoad: this.pullUpLoad,
          startY: this.startY
        }

        this.scroll = new BScroll(this.$refs.wrapper, options)

        if (this.listenScroll) {
          let me = this
          this.scroll.on('scroll', (pos) => {
            me.$emit('scroll', pos)
          })
        }

        if (this.pullUpLoad) {
          this._initPullUpLoad()
        }

        if (this.pullDownRefresh) {
          this._initPullDownRefresh()
        }

        if (this.beforeScroll) {
          this.scroll.on('beforeScrollStart', () => {
            this.$emit('beforeScroll')
          })
        }
      },
      enable () {
        this.scroll && this.scroll.enable()
      },
      disable () {
        this.scroll && this.scroll.disable()
      },
      refresh () {
        this.scroll && this.scroll.refresh()
      },
      scrollTo () {
        this.scroll && this.scroll.scrollTo.apply(this.scroll, arguments)
      },
      scrollToElement () {
        this.scroll && this.scroll.scrollToElement.apply(this.scroll, arguments)
      },
      forceUpdate (dirty) {
        if (this.pullDownRefresh && this.isPullingDown) {
          this.pulling = false
          this._reboundPullDown().then(() => {
            this._afterPullDown()
          })
        } else if (this.pullUpLoad && this.isPullUpLoad) {
          this.isPullUpLoad = false
          this.scroll.finishPullUp()
          this.pullUpDirty = dirty
          this.refresh()
        } else {
          this.refresh()
        }
      },
      _initPullUpLoad () {
        this.scroll.on('pullingUp', () => {
          this.isPullUpLoad = true
          this.$emit('pullingUp')
        })
      },
      _initPullDownRefresh () {
        this.scroll.on('pullingDown', () => {
          this.beforePullDown = false
          this.isPullingDown = true
          this.pulling = true
          this.$emit('pullingDown')
        })

        this.scroll.on('scroll', (pos) => {
          if (this.beforePullDown) {
            this.bubbleY = Math.max(0, pos.y + this.pullDownInitTop)
            this.pullDownStyle = `top:${Math.min(pos.y + this.pullDownInitTop, 10)}px`
          } else {
            this.bubbleY = 0
          }

          if (this.isRebounding) {
            this.pullDownStyle = `top:${10 - (this.pullDownRefresh.stop - pos.y)}px`
          }
        })
      },
      _reboundPullDown () {
        const {stopTime = 600} = this.pullDownRefresh
        return new Promise((resolve) => {
          setTimeout(() => {
            this.isRebounding = true
            this.scroll.finishPullDown()
            this.isPullingDown = false
            resolve()
          }, stopTime)
        })
      },
      _afterPullDown () {
        setTimeout(() => {
          this.pullDownStyle = `top:${this.pullDownInitTop}px`
          this.beforePullDown = true
          this.isRebounding = false
          this.refresh()
        }, this.scroll.options.bounceTime)
      }
    },
    mounted () {
      setTimeout(() => {
        this._initScroll()
      }, 20)
    },
    watch: {
      data () {
        setTimeout(() => {
          this.forceUpdate(true)
        }, this.refreshDelay)
      }
    },
    components: {
      Loading,
      Bubble
    }
  }
</script>

<style lang="stylus">
  .scroll-wrapper
    position relative
    overflow hidden
  .pulldown-wrapper
    position absolute
    width 100%
    left 0
    display flex
    justify-content center
    align-items center
    pointer-events none // 设置点击穿透 防止挡住数据层
    transition all
    .after-trigger
      margin-top 10px

  .pullup-wrapper
    width 100%
    display flex
    justify-content center
    align-items center
    padding 12px 0
</style>
