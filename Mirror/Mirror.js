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
            cue: 3.0,
            length: m/2
        },        
        {
            cue: 1.5,
            length: m/2
        },        
        {
            cue: 3.0,
            length: m/2
        }
    ]

    let cameraTrack = Track ("camera")
    let duration = 0
    clips.forEach(c=>{
        let cameraClip = new Clip(c.cue, fps(c.length), cameraInput.name, "video")
        cameraTrack.add(cameraClip)
        duration += fps(c.length)
    })

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
    if(i == 0 || i == 2 || i == 4 || i == 6 || i == 7){
        mirrorStack.setValue(t, "time")
        instruction.addKernel(mirrorStack, "camera")
    }

    //MIRROR EFFECT
    if(i > 0 && i < 7){
        if(i == 2 || i == 3){
            mirror.setValue(1, "direction")
        }
        if(i == 1 || i == 4 || i == 5 || i == 6){
            mirror.setValue(0, "direction")
        }
        instruction.addKernel(mirror, "camera")
    }

    //Coloring
    let colorControls = Filter("CIColorControls")
    colorControls.setValue(1.5, "inputSaturation")
    
    instruction.addFilter(colorControls, "camera")

}