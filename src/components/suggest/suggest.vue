<template>
  <scroll class="suggest"
  :data="result"
  :pullup="pullup"
  :pulldown="pulldown"
  :beforeScroll="beforeScroll"
  @scrollToEnd="searchMore"
  @pullToRefresh="pullToRefresh"
  @beforeScroll="listScroll"
  ref="suggest">
    <ul class="suggest-list">
      <li class="suggest-item" @click="selectItem(item)" v-for="(item, index) in result" :key="index">
        <div class="icon">
          <i :class="getIconCls(item)"></i>
        </div>
        <div class="name">
          <p class="text" v-html="getDisplayName(item)"></p>
        </div>
      </li>
      <loading v-show="hasMore" title=""></loading>
    </ul>
    <div class="no-result-wrapper" v-if="!hasMore && !result.length">
      <no-result title="抱歉，暂无搜索结果"></no-result>
    </div>
  </scroll>
</template>

<script>
  import {search} from '@/api/search'
  import {ERR_OK} from '@/api/config'
  import {createSong} from 'common/js/song'
  import Scroll from '@/base/scroll/scroll'
  import Loading from '@/base/loading/loading'
  import Singer from 'common/js/singer'
  import {mapMutations, mapActions} from 'vuex'
  import NoResult from '@/base/no-result/no-result'

  const TYPE_SINGER = 'singer'
  const PER_PAGE = 20

  export default {
    data () {
      return {
        page: 1,
        result: [],
        pullup: true,
        pulldown: true,
        beforeScroll: true,
        hasMore: true // 是否还有更多
      }
    },
    props: {
      query: {
        type: String,
        default: ''
      },
      showSinger: {
        type: Boolean,
        default: true
      }
    },
    methods: {
      search () {
        this.page = 1
        this.hasMore = true
        this.$refs.suggest.scrollTo(0, 0)
        search(this.query, this.page, this.showSinger, PER_PAGE).then((res) => {
          if (res.code === ERR_OK) {
            this.result = this._genResult(res.data)
            this._checkMore(res.data)
          }
        })
      },
      searchMore () {
        if (!this.hasMore) {
          return
        }
        this.page ++
        search(this.query, this.page, this.showSinger, PER_PAGE).then((res) => {
          if (res.code === ERR_OK) {
            this.result.push(...this._genResult(res.data))
            this._checkMore(res.data)
          }
        })
      },
      pullToRefresh () {
        // 刷新事件只有在pulldown为true时才会触发
        this.result = []
        setTimeout(() => {
          this.search()
        }, 300)
      },
      refresh () {
        this.$refs.suggest.refresh()
      },
      selectItem (item) {
        if (item.type === TYPE_SINGER) {
          const singer = new Singer({
            id: item.singermid,
            name: item.singername
          })
          this.$router.push({
            path: `/search/${singer.id}`
          })
          this.setSinger(singer)
        } else {
          this.insertSong(item)
        }
        this.$emit('select')
      },
      listScroll () {
        this.$emit('listScroll')
      },
      _checkMore (data) {
        const song = data.song
        if (!song.list.length || (song.curnum + song.curpage * PER_PAGE) >= song.totalnum) {
          this.hasMore = false
        }
      },
      getIconCls (item) {
        if (item.type === TYPE_SINGER) {
          return 'icon-mine'
        } else {
          return 'icon-music'
        }
      },
      getDisplayName (item) {
        if (item.type === TYPE_SINGER) {
          return item.singername
        } else {
          return `${item.name}-${(item.singer)}`
        }
      },
      _genResult (data) {
        let ret = []
        if (data.zhida && data.zhida.singerid) {
          ret.push({...data.zhida, ...{type: TYPE_SINGER}})
        }
        if (data.song) {
          ret.push(...this._normalizeSongs(data.song.list))
        }
        return ret
      },
      _normalizeSongs (list) {
        let ret = []
        list.forEach(musicData => {
          if (musicData.songid && musicData.albumid) {
            ret.push(createSong(musicData))
          }
        })
        return ret
      },
      ...mapMutations({
        setSinger: 'SET_SINGER'
      }),
      ...mapActions([
        'insertSong'
      ])
    },
    created () {
      this.listenScroll = true
    },
    watch: {
      query () {
        this.search()
      }
    },
    components: {
      Scroll,
      Loading,
      NoResult
    }
  }
</script>

<style scoped lang="stylus">
  @import "~common/stylus/variable"
  @import "~common/stylus/mixin"

  .suggest
    height 100%
    overflow hidden
    .top-wrapper
      position absolute
      top -40px
      left 0
      z-index 1
      width 100%
      height 40px
      line-height 40px
      text-align center
      // background $color-dialog-background

    .suggest-list
      padding 0 30px
      .suggest-item
        display flex
        align-items center
        padding-bottom 20px
      .icon
        flex 0 0 30px
        width 30px
        [class^="icon-"]
          font-size 14px
          color $color-text-d
      .name
        flex 1
        font-size $font-size-medium
        color $color-text-d
        overflow hidden
        .text
          no-wrap()
    .no-result-wrapper
      position absolute
      width 100%
      // top 50%
      // transform translateY(-50%)

</style>