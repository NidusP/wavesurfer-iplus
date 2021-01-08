import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.js';
import { getLocalRegions, saveLocalRegions } from "../utils/localStorage";
import dualTrack from "../../public/voice/03403.wav"
import ALALAMO from "../../public/voice/ALALAMO.mp3"

class MyWaveSurfer {
    constructor(){
        this.waveSurfer = null
        this.selectedRegion = null
        this.selectedRegionColor = 'rgba(255,120,81,0.8)'
        this.existRegionColor = 'rgba(252, 167, 26, .5)'
        this.addRegionColor = 'rgba(0, 0, 0, 0.2)'
        this.init()
    }
    init(){
        const { $waveForm, $waveButton, $wave, $wavePlayRadio } = this.createTemplate();
        this.waveSurfer = this.initWaveSurfer($waveForm)
        if (!this.waveSurfer) return false;
        const myWave = this.waveSurfer

        // DOM 事件处理
        $waveButton.addEventListener('click', function () {
            myWave && myWave.isPlaying() ?  myWave.pause() : myWave.play()
        })
        $waveForm.addEventListener("keydown", (event) => {
            // 空格键播放暂停
            if (event.keyCode === 32) {
                myWave && myWave.isPlaying() ? myWave.pause() : myWave.play()
                // delete键删除region记录
            } else if (event.keyCode === 46 && this.selectedRegion){
                if (window.confirm("Do you really want to delete?")) {
                    saveLocalRegions(getLocalRegions().filter(cv => this.selectedRegion.id !== cv.id))
                    if (this.selectedRegion.isCache) this.addRegions(true)
                    this.selectedRegion.remove()
                    this.selectedRegion = null
                } else { }
            }
        })
        // $waveForm.addEventListener("click", function (event) {
        //     console.log('click-$waveForm')
        // })
        $wavePlayRadio.addEventListener('click', (event) => {
            // 加载未完成弹出事件
            if(!this.bufferAudio) {
                event.stopPropagation()
                event.preventDefault()
                return false
            }
            const $target = event.target
            if ($target.nodeName.toUpperCase() !== 'INPUT') return false
            if ($target.value === 'both') {
                this.bufferAudio.copyToChannel(this.leftAudioArray,0,0)
                this.bufferAudio.copyToChannel(this.rightAudioArray,1,0)
            } else if ($target.value === 'left') {
                this.bufferAudio.copyToChannel(this.leftAudioArray,0,0)
                this.bufferAudio.copyToChannel(this.nullArray,1,0)
            } else if ($target.value === 'right') {
                this.bufferAudio.copyToChannel(this.nullArray,0,0)
                this.bufferAudio.copyToChannel(this.rightAudioArray,1,0)
            }
        })

        // wave 事件处理
        myWave.on('ready', () => {
            // console.log('ready', getLocalRegions())
            const localRegions = getLocalRegions() || []
            myWave.clearRegions()
            localRegions.forEach(cv => {
                const { id, start, end } = cv
                myWave.addRegion({
                    id, start, end,
                    color: 'rgba(252, 167, 26, .5)',
                    resize: false,
                    drag: false
                })
            })
            this.addRegions(true)

            //  在 ready 事件 缓存一下 AudioBuffer，拿到左右声道的数据
            // 加载完毕 缓存声道数据,用于左右声道切换
            this.bufferAudio = myWave && myWave.backend && myWave.backend.buffer
            if(this.bufferAudio.numberOfChannels === 2){
                this.nullArray = new Float32Array(this.bufferAudio.length)
                this.leftAudioArray = new Float32Array(this.bufferAudio.length)
                this.rightAudioArray = new Float32Array(this.bufferAudio.length)
                this.bufferAudio.copyFromChannel(this.leftAudioArray,0,0)
                this.bufferAudio.copyFromChannel(this.rightAudioArray,1,0)
            }
        })
        myWave.on('region-click', (region, event) => {
            // console.log('region-click')
            clearTimeout(this.clickTimeId);
            //执行延时
            this.clickTimeId = setTimeout(() => {
                if (this.selectedRegion) {
                    this.selectedRegion.color = this.selectedRegion.isCache ? this.addRegionColor : this.existRegionColor
                    this.selectedRegion.updateRender()
                }
                region.color = this.selectedRegionColor
                region.updateRender()
                this.selectedRegion = region
            }, 300);
        })
        myWave.on('region-dblclick', (region, event) => {
            // console.log('region-dblclick')
            clearTimeout(this.clickTimeId);
            // event.target === regions
            if (!region.isCache) return false;
            if (window.confirm("Do you really want to add?") && !!region.isCache) {
                const start = region.start.toFixed(2)
                const end = region.end.toFixed(2)
                const id = region.id
                region.isCache = false

                let localRegions = getLocalRegions() || []
                localRegions.push({
                    start, end, id
                })
                saveLocalRegions(localRegions)
                region.color = this.existRegionColor
                region.drag = false
                region.resize = false
                // region.handleLeftEl = null
                // region.handleRightEl = null
                region.updateRender()
                this.addRegions(true)
            } else { }
        })
        myWave.on('region-update-end', (region, event) => {
            // 新增后，未提交或删除则禁止继续新增
            region.isCache = true
            this.addRegions(false)
        })


        myWave.on('region-created', (region, event) => {
            console.log('region-created', region)
        })
        myWave.on('dblclick', (region, event) => {
            console.log(region, event)
        })
        myWave.on('error', error => {
            console.log('error', error)
        })
    }
    initWaveSurfer($waveForm){
        const regionsPlugin = RegionsPlugin.create()
        const waveSurfer = WaveSurfer.create({
            container: $waveForm,
            waveColor: '#0076ff',
            progressColor: '#55627c',
            // backend: 'MediaElement',
            backgroundColor: '#66bbff',
            forceDecode: true,
            loaderColor: '#000',
            responsive: true,
            skipLength: 2,
            cursorColor: '#2fd5ff',
            // height: 0, // the height of the wave
            barWidth: 2,
            barRadius: 2,
            normalize: true,
            hideScrollbar: true,
            barHeight: 10,
            barGap: null,
            barMinHeight: 6,
            // xhr:{ cache: 'default', mode: 'cors', method: 'GET', credentials: 'same-origin', redirect: 'follow', referrer: 'client'},
            // 双声道显示
            splitChannels: true,
            splitChannelsOptions: {
                overlay: false,
                relativeNormalization: true,
                filterChannels: [],
                // channelColors: {
                //     0: { progressColor: 'green', waveColor: 'pink' },
                //     1: { progressColor: 'orange', waveColor: 'purple' }
                // }
            },
            plugins: [ regionsPlugin ]
        })
        waveSurfer.load(dualTrack)
        // waveSurfer.load(ALALAMO)
        return waveSurfer
    }
    addRegions(boolean){
        if (!!boolean) {
            this.waveSurfer.enableDragSelection({
                slop: 5,
                color: this.addRegionColor
            })
        } else {
            this.waveSurfer.disableDragSelection()
        }
    }
    createTemplate(){
        const $wave = document.createElement('div'), $waveForm = document.createElement('div'),
            $waveButton = document.createElement('button'), $waveButtonNext = document.createElement('button'),
            $wavePlayRadio = document.createElement('div')

        $wave.className = 'wavesurfer-container'
        $waveForm.className = 'waveform'
        $waveForm.tabIndex = 0

        $waveButton.className = 'wave-button'
        $waveButton.innerHTML = 'Play / Pause'

        $waveButtonNext.innerHTML = 'next'
        $waveButtonNext.className = 'wave-button-next'

        $wavePlayRadio.className = 'wave-button-play'
        $wavePlayRadio.innerHTML = `
            <input type="radio" name="play" value="left">Left
            <input type="radio" name="play" value="right">Right
            <input type="radio" name="play" value="both" checked>Both
        `


        $wave.appendChild($waveForm)
        $wave.appendChild($waveButton)
        $wave.appendChild($wavePlayRadio)
        // $wave.appendChild($waveButtonNext)
        document.body.appendChild($wave)
        return {
            $wave,
            $waveButton,
            $waveForm,
            $waveButtonNext,
            $wavePlayRadio
        }
    }
}

export default function initWave() {
    return new MyWaveSurfer()
}


// wavesurfer = WaveSurfer.create({
//     container: document.querySelector('#waveform'),
//     waveColor: '#A8DBA8',
//     progressColor: '#3B8686',
//     backend: 'MediaElement',
//     plugins: [
//         WaveSurfer.regions.create({
//             regions: [
//                 {
//                     start: 1,
//                     end: 3,
//                     color: 'hsla(400, 100%, 30%, 0.5)'
//                 },
//                 {
//                     start: 5,
//                     end: 7,
//                     color: 'hsla(200, 50%, 70%, 0.4)'
//                 }
//             ],
//             dragSelection: {
//                 slop: 5
//             }
//         })
//     ]
// });
//
// // Load audio from URL
// wavesurfer.load('../example/media/demo.wav');
