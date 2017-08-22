<template>
    <div class="wrapper" ref="wrapper">
      <div class="bs-wrapper" v-if="pulldown">
         <!--slot和其平级的div最外层一定还要要用另一个div包裹,（ps:因为bscroll的原理是给new window.BScroll传入的DOM对象的第一级子级加上transition动画等）-->
        <div class="pulldown" v-if="pulldown" ref="pullDownText">下拉刷新</div>
        <slot></slot>
      </div>
      <slot v-else></slot>
    </div>
</template>

<script>
  import BScroll from 'better-scroll'
  export default {
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
      pullup: {
        type: Boolean,
        default: false
      },
      pulldown: {
        type: Boolean,
        default: false
      },
      beforeScroll: {
        type: Boolean,
        default: false
      },
      refreshDelay: {
        type: Number,
        default: 20
      }
    },
    methods: {
      _initScroll () {
        if (!this.$refs.wrapper) {
          return
        }
        this.scroll = new BScroll(this.$refs.wrapper, {
          probeType: this.probeType,
          click: this.click
        })

        if (this.listenScroll) {
          let me = this
          this.scroll.on('scroll', (pos) => {
            me.$emit('scroll', pos)
          })
        }

        if (this.pullup) {
          // 上拉加载触发回调scrollToEnd事件
          this.scroll.on('scrollEnd', () => {
            if (this.scroll.y <= this.scroll.maxScrollY + 50) {
              this.$emit('scrollToEnd')
            }
          })
        }

        if (this.pulldown) {
          // 下拉刷新监听scroll事件，触发回调pullToRefresh事件
          const pullText = this.$refs.pullDownText
          this.scroll.on('scroll', (pos) => {
            if (pos.y > 0) {
              if (pos.y >= 40) {
                pullText.innerHTML = '释放立即刷新'
              } else {
                pullText.innerHTML = '下拉刷新'
              }
            }
          })

          this.scroll.on('touchend', () => {
            if (this.scroll.y >= 40) {
              this.$emit('pullToRefresh')
            }
          })
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
          this.refresh()
        }, this.refreshDelay)
      }
    }

  }
</script>

<style lang="stylus">
  .wrapper
    .bs-wrapper
      position relative
      // height 100%
      .pulldown
        position absolute
        top -40px
        left 0
        z-index 1
        width 100%
        height 40px
        line-height 40px
        text-align center
        // background $color-dialog-background
</style>
