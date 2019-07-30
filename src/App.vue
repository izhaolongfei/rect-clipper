<template>
  <div id="app">
    <div class="clip-container" ref="container">
      <div class="clip-box"
        :style="{
          top: clipbox.top + 'px',
          left: clipbox.left + 'px',
          width: clipbox.width + 'px',
          height: clipbox.height + 'px'
        }"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd">
      </div>
    </div>
  </div>
</template>

<script>
import boxclipper from './assets/boxclipper';

export default {
  name: 'app',
  data() {
    return {
      clipbox: {
        top: 10,
        left: 10,
        width: 60,
        height: 60
      }
    };
  },
  computed: {
  },
  methods: {
    onTouchStart(e) {
      this.boxcliper.onClipStart(e.touches[0].clientX, e.touches[0].clientY);
    },
    onTouchMove(e) {
      this.boxcliper.onClipMove(e.touches[0].clientX, e.touches[0].clientY, null, null, coords => {
        this.clipbox = {
          left: coords[0],
          top: coords[1],
          width: coords[2] - coords[0],
          height: coords[3] - coords[1]
        };
      });
    },
    onTouchEnd(e) {
      this.boxcliper.onClipEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    }
  },
  created() {
    
  },
  mounted() {
    const $container = this.$refs.container;

    this.boxcliper = new boxclipper({
      coords: [10, 10, 70, 70],
      limitCoords: [10, 10, $container.clientWidth - 10, $container.clientHeight - 10],
      minWidth: 60,
      minHeight: 60,
      dragRadius: 20
    });
  }
}
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}

#app {
  width: 100%;
  height: 100%;
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #f1f1f1;
}

.clip-container {
  position: relative;
  width: 100%;
  height: 400px;
  background: #fff;
}

.clip-box {
  position: absolute;
  background: rgba(0, 0, 0, 0.2);
  border: 2px solid yellowgreen;
  border-radius: 5px;
}

</style>
