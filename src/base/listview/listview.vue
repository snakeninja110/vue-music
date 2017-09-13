<template>
  <div class="listview">
    <scroll class="list-wrapper"
    :data="data"
    :listenScroll="listenScroll"
    :probeType = "probeType"
    ref="listview"
    @scroll="scroll">
      <ul>
        <li class="list-group" v-for="(group, index) in data" :key="index" ref="listGroup">
          <h2 class="list-group-title">{{group.title}}</h2>
          <ul>
            <li @click="selectItem(item)" class="list-group-item" v-for="(item, index) in group.items" :key="index">
              <img class="avatar" v-lazy="item.avatar">
              <span class="name">{{item.name}}</span>
            </li>
          </ul>
        </li>
      </ul>
      <div class="loading-container" v-show="!data.length">
        <loading></loading>
      </div>
    </scroll>
    <div class="list-shortcut" @touchstart="onShortcutTouchStart" @touchmove.stop.prevent="onShortcutTouchMove">
      <ul>
        <li class="item" :class="{'current': currentIndex===index}" v-for="(item, index) in shortcutList" :data-index="index" :key="index">
          {{item}}
        </li>
      </ul>
    </div>
    <div class="list-fixed" v-show="fixedTitle" ref="fixed">
      <h1 class="fixed-title">{{fixedTitle}}</h1>
    </div>
  </div>
</template>

<script>
  import Scroll from '@/base/scroll/scroll'
  import Loading from '@/base/loading/loading'
  import {getData} from 'common/js/dom'

  const ANCHOR_HEIGHT = 18
  const TITLE_HEIGHT = 30

  export default {
    created () {
      this.touch = {}
      this.listenScroll = true
      this.listHeight = []
      this.probeType = 3
      this.fixedTop = 0
    },
    data () {
      return {
        scrollY: -1,
        currentIndex: 0,
        diff: -1
      }
    },
    props: {
      data: {
        type: Array,
        default: []
      }
    },
    computed: {
      shortcutList () {
        return this.data.map((group) => {
          return group.title.substr(0, 1)
        })
      },
      fixedTitle () {
        if (this.scrollY > 0) {
          return ''
        }
        return this.data[this.currentIndex] ? this.data[this.currentIndex].title : ''
      }
    },
    methods: {
      selectItem (item) {
        this.$emit('select', item)
      },
      onShortcutTouchStart (e, key) {
        let anchorIndex = getData(e.target, 'index')
        let firstTouch = e.touches[0]
        this.touch.y1 = firstTouch.pageY
        this.touch.anchorIndex = anchorIndex
        this._scrollTo(anchorIndex)
      },
      onShortcutTouchMove (e) {
        let firstTouch = e.touches[0]
        this.touch.y2 = firstTouch.pageY
        let delta = (this.touch.y2 - this.touch.y1) / ANCHOR_HEIGHT | 0 // 手指在屏幕上移动的距离/字母的高度
        let anchorIndex = parseInt(this.touch.anchorIndex) + delta
        this._scrollTo(anchorIndex)
      },
      refresh () {
        this.$refs.listview.refresh()
      },
      scroll (pos) {
        this.scrollY = pos.y
      },
      _scrollTo (index) {
        if (!index && index !== 0) {
          return
        }
        if (index < 0) {
          index = 0
        } else if (index > this.listHeight.length - 2) {
          index = this.listHeight.length - 2
        }
        this.scrollY = -this.listHeight[index]
        this.$refs.listview.scrollToElement(this.$refs.listGroup[index], 0)
      },
      _calculateHeight () {
        this.listHeight = []
        const list = this.$refs.listGroup
        let height = 0
        this.listHeight.push(height)
        for (let i = 0; i < list.length; i++) {
          let item = list[i]
          height += item.clientHeight
          this.listHeight.push(height)
        }
      }
    },
    watch: {
      data () {
        // 监控data数据，有值时计算每一栏的高度
        setTimeout(() => {
          this._calculateHeight()
        }, 20)
      },
      scrollY (newY) {
        // bscroll派发滚动事件，监听滚动的值，计算当前滚动的高度 设置左右联动
        const listHeight = this.listHeight
        // 当滚动到顶部，newY > 0
        if (newY > 0) {
          this.currentIndex = 0
          return
        }
        // 在中间部分滚动, newY < 0
        for (let i = 0; i < listHeight.length - 1; i++) {
          /**
           * listHeight长度实际大于列表的个数,多一个
           * listHeight存放的是每个元素的上限和下限的高度
           * 而后一个元素的下限就是第二个元素的上限 以此类推，所以总共会比列表元素多一个
          */
          let height1 = listHeight[i]
          let height2 = listHeight[i + 1]
          if (-newY >= height1 && -newY < height2) {
            this.currentIndex = i
            this.diff = height2 + newY // 实际是 文档底部的高度 - 滚动的高度，因为newY是负值所以这种用加号
            return
          }
        }
        // 滚动到底部，且-newY大于最后一个元素的上限
        this.currentIndex = listHeight.length - 2
      },
      diff (newVal) {
        let fixedTop = (newVal > 0 && newVal < TITLE_HEIGHT) ? newVal - TITLE_HEIGHT : 0
        if (this.fixedTop === fixedTop) {
          return
        }
        this.fixedTop = fixedTop
        this.$refs.fixed.style.transform = `translate3D(0,${fixedTop}px,0)`
      }
    },
    components: {
      Scroll,
      Loading
    }
  }
</script>

<style scoped lang="stylus">
  @import "~common/stylus/variable"

  .listview
    position relative
    width 100%
    height 100%
    overflow hidden
    background $color-background
    .list-wrapper
      position absolute
      left 0
      right 0
      top 0
      bottom 0
      overflow hidden
    .list-group
      padding-bottom 30px
      .list-group-title
        height 30px
        line-height 30px
        padding-left 20px
        font-size $font-size-small
        color $color-text-l
        background $color-highlight-background
      .list-group-item
        display flex
        align-items center
        padding 20px 0 0 30px
        .avatar
          width 50px
          height 50px
          border-radius 50%
        .name
          margin-left 20px
          color $color-text-l
          font-size $font-size-medium
    .list-shortcut
      position absolute
      z-index 30
      right 0
      top 50%
      transform translateY(-50%)
      width 20px
      padding 20px 0
      border-radius 10px
      text-align center
      background $color-background-d
      font-family Helvetica
      .item
        padding 3px
        line-height 1
        color $color-text-l
        font-size $font-size-small
        &.current
          color $color-theme
    .list-fixed
      position absolute
      top 0
      left 0
      width 100%
      .fixed-title
        height 30px
        line-height 30px
        padding-left 20px
        font-size: $font-size-small
        color: $color-text-l
        background: $color-highlight-background
    .loading-container
      position absolute
      width 100%
      height 50%
      transform translateY(-50%)
</style>
