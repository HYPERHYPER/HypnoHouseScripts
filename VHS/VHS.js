//
// VHS.js
// VHS
//
// Created by Mena Sachdev on 18 Mar 2019 4:20:52pm
// Copyright © 2019 Mena Sachdev. All rights reserved.

const vhs = new Kernel(File("vhs.cikernel").loadFileAsString())
const rgb = new Kernel(File("rgbShift.cikernel").loadFileAsString())

function fps(time) {
    return Math.floor(time * 30) / 30
}

function easeOutQuad (t, b, c, d) {
		return -c *(t/=d)*(t-2) + b;
}

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

function sequence (inputs) {

    HYPNO.composition.renderSize.width = 960
    HYPNO.composition.renderSize.height = 1280

    let tracks = [];

    let cameraInput = inputs ["camera"];
    let overlayInput = inputs["overlay.mp4"];
    let musicInput = inputs["music.mp3"]

    let d = musicInput.duration
    let m = d / 4

    let clips = [
        {
            cue: 0.0,
            length: m * 0.75
        }, 
        {
            cue: 2.4,
            length: m/2
        },        
        {
            cue: 0.5,
            length: m * 0.75
        },             
        {
            cue: 1.0,
            length: m/2
        },        
        {
            cue: 0.2,
            length: m/2
        },
        {
            cue: 1.0,
            length: m
        },
    ]

    let cameraTrack = Track ("camera");
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

    let musicClip = new Clip(0.0, duration, musicInput.name, "audio")
    let overlayClip = new Clip(0.0, duration, overlayInput.name, "video")

    let musicTrack = new Track("music")
    let overlayTrack = new Track("overlay")

    overlayTrack.add(overlayClip)
    musicTrack.add(musicClip)

    tracks.push(musicTrack)
    tracks.push(overlayTrack)
    tracks.push(cameraTrack);

    return tracks;
}

function render (context, instruction) {

    let i = instruction.index

    {
    //VARIABLE INPUT TRANSFORM

        let inputSize = instruction.getImageSize("camera")
        let overlaySize = instruction.getImageSize("overlay")

        if(inputSize.width != 960 && inputSize.height != 1280){

            if(inputSize.width > inputSize.height){
                /*  AUX CAM/LANDSCAPE CAPTURE HANDLING
                    modify ANGLE parameter to set capture angle
                */

                let angle = 90

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

    {
        //KERNEL EFFECTS
        vhs.setValue(0.19, "noiseAmount")
        vhs.setValue(4.0 * context.time + 1.0, "time");
        instruction.addKernel(vhs, "camera");

        if(i < 3){
            let x = easeOutQuad(context.time, 0.0, 5.0, 3.0)
            rgb.setValue(x, "intensity")
            instruction.addKernel(rgb, "camera")
        } if(i == 4 || i ==5){
            let x = easeOutQuad(instruction.time, 0.0, 1.2, 1.0)
            rgb.setValue(x, "intensity")
            instruction.addKernel(rgb, "camera")
        } if((i==4 && instruction.time >0.5)){
            let x = 4.0 * Math.sin(2.6 * (instruction.time- 0.5) * Math.PI)
            rgb.setValue(x, "intensity")
            instruction.addKernel(rgb, "camera")
        } 
        if((i == 3 && instruction.time < 0.4 )){
            let x = 4.0 * Math.sin(2.7 * instruction.time * Math.PI)
            rgb.setValue(x, "intensity")
            instruction.addKernel(rgb, "camera")
        }
        
    }

    { 
        //OVERLAY
        let screen = Filter("CIScreenBlendMode")
        screen.setValue(instruction.getImage("overlay"), "inputImage")
        screen.setValue(instruction.getImage("camera"), "inputBackgroundImage")
        instruction.addFilter(screen, "camera")
    }

    {
        //COLOR
        var CIVibrance = Filter("CIVibrance")
        CIVibrance.setValue(0.2, "inputAmount")
        instruction.addFilter(CIVibrance, "camera")

        let colorControl = Filter("CIColorControls")
        colorControl.setValue("camera", "inputImage")
        colorControl.setValue(1.2, "inputSaturation")
        colorControl.setValue(0.05, "inputBrightness")
        instruction.addFilter(colorControl, "camera")
    }
    
}

function exportSettings() {
 
    let bitrate = (HYPNO.composition.renderSize.width) * (HYPNO.composition.renderSize.height) * (30.0)
 
    bitrate *= 0.27

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