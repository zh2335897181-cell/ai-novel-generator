import { ref, onMounted, onUnmounted } from 'vue'

// 小说数据处理 Web Worker Hook
export function useNovelWorker() {
  const worker = ref(null)
  const isProcessing = ref(false)
  const progress = ref(0)
  const result = ref(null)
  const error = ref(null)

  onMounted(() => {
    // 初始化 Web Worker
    worker.value = new Worker(new URL('../workers/novelWorker.js', import.meta.url), {
      type: 'module'
    })

    worker.value.onmessage = (e) => {
      const { type, result: data, progress: progressValue, message } = e.data

      switch (type) {
        case 'analysisComplete':
        case 'statsComplete':
        case 'batchComplete':
        case 'timelineComplete':
          result.value = data
          isProcessing.value = false
          break
        case 'progress':
          progress.value = progressValue
          break
        case 'error':
          error.value = message
          isProcessing.value = false
          break
      }
    }

    worker.value.onerror = (err) => {
      error.value = err.message
      isProcessing.value = false
    }
  })

  onUnmounted(() => {
    worker.value?.terminate()
  })

  const analyzeText = (text) => {
    if (!worker.value) return
    isProcessing.value = true
    progress.value = 0
    result.value = null
    error.value = null
    worker.value.postMessage({ type: 'analyzeText', data: { text } })
  }

  const calculateStats = (contents) => {
    if (!worker.value) return
    isProcessing.value = true
    progress.value = 0
    result.value = null
    error.value = null
    worker.value.postMessage({ type: 'calculateStats', data: { contents } })
  }

  const processBatch = (items, operation = 'format') => {
    if (!worker.value) return
    isProcessing.value = true
    progress.value = 0
    result.value = null
    error.value = null
    worker.value.postMessage({ type: 'processBatch', data: { items, operation } })
  }

  const generateTimeline = (contents, characters) => {
    if (!worker.value) return
    isProcessing.value = true
    progress.value = 0
    result.value = null
    error.value = null
    worker.value.postMessage({ type: 'generateTimeline', data: { contents, characters } })
  }

  return {
    isProcessing,
    progress,
    result,
    error,
    analyzeText,
    calculateStats,
    processBatch,
    generateTimeline
  }
}
