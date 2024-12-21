<script setup lang="ts">
import { reactive, watch } from 'vue'

const data = reactive({
  target: 'left',
  keypad: 'F8',
  interval: 0.3
})

window.electron.ipcRenderer
  .invoke('get-data')
  .then((res: { target: string; keypad: string; interval: number }) => {
    Object.assign(data, res)
    // 首次加载了数据后 每次改变数据 update 都会发送给主进程
    update = () => {
      window.electron.ipcRenderer.send('update-data', { ...data })
    }
  })

let update = () => {}
watch(data, () => {
  update()
})

const start = () => {
  window.electron.ipcRenderer.send('satrt')
}
const quit = () => {
  window.electron.ipcRenderer.send('quit')
}
</script>

<template>
  <a-row class="grid-demo">
    <a-col :span="12">
      <a-typography>控制按键</a-typography>
      <a-radio-group type="button" v-model="data.target">
        <a-radio value="left">左键</a-radio>
        <a-radio value="right">右键</a-radio>
      </a-radio-group>
    </a-col>
    <a-col :span="12">
      <a-typography>间隔/秒</a-typography>
      <a-input-number v-model="data.interval" mode="button" :min="0.01" :step="0.1" />
    </a-col>
  </a-row>
  <a-typography>快捷键</a-typography>
  <a-radio-group type="button" v-model="data.keypad">
    <a-radio :value="`F${item}`" v-for="item in 6">
      <div class="keypad">{{ `F${item}` }}</div>
    </a-radio>
  </a-radio-group>
  <a-radio-group type="button" v-model="data.keypad">
    <a-radio :value="`F${item + 6}`" v-for="item in 6">
      <div class="keypad">{{ `F${item + 6}` }}</div>
    </a-radio>
  </a-radio-group>
  <a-divider dashed />
  <div style="display: flex; flex-direction: row-reverse">
    <a-space>
      <template #split>
        <a-divider direction="vertical" />
      </template>
      <a-button type="primary" @click="start">{{ data.keypad }}开始</a-button>
      <a-button type="primary" @click="quit">退出</a-button>
    </a-space>
  </div>
</template>

<style>
body {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
}
#app {
  width: 100%;
  box-sizing: border-box;
  padding: 0 14px;
  margin: 0 auto;
}
.keypad {
  width: 20px;
}
</style>
