//
// Prism.js
// Prism
//
// Created by Mena Sachdev on 21 Mar 2019 4:25:24pm
// Copyright © 2019 Mena Sachdev. All rights reserved.

const starglow = Shader(File("starglow.frag").loadFileAsString());
const jewel = Kernel(File("jewel.cikernel").loadFileAsString());

function auxRotationHandler(angle){
    /*
    // handles AUX input angles and adjusts scale, translation, and rotation
    // you may have to fine tune the translation values to get image to center where you want it
    */
    let result = {}
        if(angle == 0){
            //scale height to 1280 
            result.scale = 1280/1080
            result.translation = {x: -700, y: 0}
            result.rotation = 0;
        }
        if(angle == 90){
            result.scale = 960/1080
            result.translation = {x: 0, y: 1820}
            result.rotation = -0.5;
        }
        if(angle == 180){
            result.scale = 1280/1080
            result.translation = {x: 1350, y: 1080}
            result.rotation = -1.0;
        }
        if(angle == 270){
            result.scale = 960/1080
            result.translation = {x: 1080, y: 0}
            result.rotation = -1.5
        }
    return result
}

HYPNO.composition.timeFormat = "frames"
HYPNO.composition.preferredTimescale = 30
HYPNO.composition.renderSize.width = 960
HYPNO.composition.renderSize.height = 1280

function sequence (inputs) {

    HYPNO.composition.renderSize.width = 960
    HYPNO.composition.renderSize.height = 1280

    let tracks = [];

    let cameraInput = inputs ["camera"];
    let musicInput = inputs["music.mp3"]
    let jewelInput = inputs["normalmap.mp4"]

    let clips = [
        {
            cue: 36,
            ticks: 66
        },
        {
            cue: 36,
            ticks: 70
        },
  
        {
            cue: 42,
            ticks: 38
        },
        {
            cue: 30,
            ticks: 34
        },
        {
            cue: 45,
            ticks: 72
        },
    ]

    let cameraTrack = Track ("camera");
    let runtime = 0
    clips.forEach(c=>{
        let runlength = new Time(c.ticks, 30)
        let clip = new Clip(new Time(c.cue, 30), runlength, cameraInput.name, "video")     
        cameraTrack.add(clip)
        runtime += c.ticks
    })

    let jewelTrack = new Track("jewel")
    let jewelClip = new Clip(new Time(0, 30), new Time(208, 30), jewelInput.name, "video")
    let jewelClip2 = new Clip(new Time(0, 30), new Time(72, 30), jewelInput.name, "video")

    jewelTrack.add(jewelClip)
    jewelTrack.add(jewelClip2)

    let musicTrack = new Track("music")
    let musicClip = new Clip(new Time(0, 30), new Time(runtime, 30), musicInput.name, "audio")
    musicTrack.add(musicClip)

    tracks.push(jewelTrack)
    tracks.push(cameraTrack);
    tracks.push(musicTrack)
    return tracks;
}

function render (context, instruction) {

    let i = instruction.index
    let t = instruction.time

    {
    //VARIABLE INPUT TRANSFORM

        let inputSize = instruction.getImageSize("camera")
        let overlaySize = instruction.getImageSize("jewel")

        if(inputSize.width != 960 && inputSize.height != 1280){

            if(inputSize.width > inputSize.height){
                /*  AUX CAM/LANDSCAPE CAPTURE HANDLING
                    modify ANGLE parameter to set capture angle
                */

                let angle = 0

                let result = auxRotationHandler(angle)

                let t1 = AffineTransform.makeRotation(result.rotation * Math.PI)
                let t2 = AffineTransform.makeTranslation(result.translation.x, result.translation.y)
                let t3 = AffineTransform.makeScale(result.scale, result.scale)
                let x1 = AffineTransform.concat(t1, t2)
                let x2 = AffineTransform.concat(x1, t3)
                instruction.setAffineTransform(x2, "camera")

                let crop = new Filter("CICrop")
                crop.setValue(instruction.getImage("camera"), "inputImage")
                crop.setValue([0, 0, 960, 1280], "inputRectangle")
                instruction.addFilter(crop, "camera")

            } else {
                let scale = 1280/inputSize.height
                let t1 = AffineTransform.makeScale(scale, scale)
                instruction.setAffineTransform(t1, "camera")
            }        
        }

        if(overlaySize.width != 960 && overlaySize.height != 1280){
            let scaler = 1280/overlaySize.height
            let scale = AffineTransform.makeScale(scaler, scaler)
            instruction.setAffineTransform(scale, "camera")
        }
    }

    //JEWEL DISPLACEMENT
    if(i== 1 || i == 4){

        jewel.setValue(instruction.getImage("jewel"), "image")
        jewel.setValue(7.0, "sheen")
        jewel.setValue(2.5, "scatter") // 0.8 
        jewel.setValue(instruction.time, "time")
        instruction.addKernel(jewel, "camera")
    }

    //ZOOM BLUR TRANSITION
    if(i == 4){
        if(t < 0.2){
            const CIZoomBlur = Filter("CIZoomBlur")
            CIZoomBlur.setValue(20.0 - 100.0 * t, "inputAmount")
            CIZoomBlur.setValue([context.width/2, context.height/2], "inputCenter")
            instruction.addFilter(CIZoomBlur, "camera")
        }
    }
    if(i == 2){
        if(t < 0.1){
            const CIZoomBlur = Filter("CIZoomBlur")
            CIZoomBlur.setValue(20.0 - 200 * t, "inputAmount")
            CIZoomBlur.setValue([context.width/2, context.height/2], "inputCenter")
            instruction.addFilter(CIZoomBlur, "camera")
        }

    }

    //STARGLOW
    starglow.setUniformi(instruction.index, "INSTRUCTION")
    starglow.setUniformf(context.time, "TIME")
    starglow.setUniformf(instruction.time, "INSTRUCTION_TIME")
    instruction.addShader(starglow, "camera")

    // CIColorControls
    const CIColorControls = Filter("CIColorControls")
    CIColorControls.setValue(1.5, "inputSaturation")
    instruction.addFilter(CIColorControls, "camera")

    var CIVibrance = Filter("CIVibrance")
    CIVibrance.setValue(0.5, "inputAmount")
    instruction.addFilter(CIVibrance, "camera")
}

function exportSettings() {
 
    let bitrate = (HYPNO.composition.renderSize.width) * (HYPNO.composition.renderSize.height) * (30.0)
 
    bitrate *= 0.5
 
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