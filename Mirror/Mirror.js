//
// Mirror.js
// Mirror
//
// Created by Mena Sachdev on 18 Mar 2019 10:28:25am
// Copyright © 2019 Mena Sachdev. All rights reserved.

const mirrorStack = new Kernel(File("mirrorStack.cikernel").loadFileAsString())
const mirror = new Kernel(File("mirror.cikernel").loadFileAsString())

function fps(time) {
    return Math.floor(time * 30) / 30
}

function sequence (inputs) {

    HYPNO.composition.renderSize.width = 960
    HYPNO.composition.renderSize.height = 1280

    let tracks = []

    let cameraInput = inputs ["camera"]
    let musicInput = inputs["music.mp3"]

    let d = musicInput.duration
    let m = d/4

    let clips = [ 
        {
            cue: 1.5,
            length: m/2
        }, 
        {
            cue: 2.0,
            length: m/2
        },        
        {
            cue: 0.0,
            length: m/2
        },        
        {
            cue: 2.0,
            length: m/2
        },        
        {
            cue: 1.5,
            length: m/2
        },        
        {
            cue: 1.0,
            length: m/2
        },        
        {
            cue: 1.5,
            length: m/2
        },        
        {
            cue: 2.8,
            length: m/2
        }
    ]

    let cameraTrack = Track ("camera")
    let duration = 0
    let captureLength = 0
    clips.forEach(c=>{

        let cameraClip = new Clip(c.cue, fps(c.length), cameraInput.name, "video")
        cameraTrack.add(cameraClip)
        duration += fps(c.length)

        if(c.cue + c.length > captureLength){
            captureLength = c.cue + c.length
        }
    })

    print(captureLength)

    let musicTrack = new Track("music")
    let musicClip = new Clip(0.0, duration, musicInput.name, "audio")
    musicTrack.add(musicClip)

    tracks.push(cameraTrack)
    tracks.push(musicTrack)
    return tracks
}

function render (context, instruction) {
    
    let i = instruction.index
    let t = instruction.time
        

    //MIRROR STACK EFFECT
    if(i == 0 || i == 2 || i == 4 || i == 7){
        mirrorStack.setValue(t, "time")
        instruction.addKernel(mirrorStack, "camera")
    }

    // i == 5 flip mirror for other half

    //MIRROR EFFECT
    if(i > 0 && i < 6 && i != 3){
        if(i == 2){
            mirror.setValue(1, "direction")
            mirror.setValue(0, "side")
        }
        if(i == 5){
            mirror.setValue(0, "direction")
            mirror.setValue(1, "side")
        }
        if(i == 1 || i == 4){
            mirror.setValue(0, "direction")
            mirror.setValue(0, "side")
        }

        instruction.addKernel(mirror, "camera")
    }

    //Coloring
    let colorControls = Filter("CIColorControls")
    colorControls.setValue(1.2, "inputSaturation")
    colorControls.setValue(0.05, "inputBrightness")
    colorControls.setValue(1.2, "inputContrast")
    instruction.addFilter(colorControls, "camera")

}

function exportSettings() {
 
    let bitrate = (HYPNO.composition.renderSize.width) * (HYPNO.composition.renderSize.height) * (30.0)
 
    bitrate *= 0.28

    return {
        video: {
            averageBitRate: bitrate,
            profileLevel: "H264Baseline41"
        },
        audio: {
            numberOfChannels: 2,
            sampleRate: 44100,
            bitRate: 64000
        }
    }
}