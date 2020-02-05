//
// Digital Glitch.js
// Digital Glitch
//
// Created by Mena Sachdev on 13 Aug 2019 3:05:35pm
// Copyright © 2019 Mena Sachdev. All rights reserved.

const mosaic = Kernel(File("mosaic.cikernel").loadFileAsString())
const glitch2 = Kernel(File("glitch2.cikernel").loadFileAsString())
const glitch = new Kernel(File("glitch.cikernel").loadFileAsString())
const rgbShift = new Kernel(File("rgbShiftX.cikernel").loadFileAsString())

function auxRotationHandler(angle){
    /*
    // handles AUX input angle and adjusts scale, translation, and rotation accordingly
    // you may have to fine tune the translation values to get image to center where you want it
    */
    let result = {}
        if(angle == 0){
            //scale height to 1280 
            result.scale = 1280/1080.
            result.translation = {x: 0, y: 0}
            result.rotation = 0;
        }
        if(angle == 90){
            result.scale = 960/1080
            result.translation = {x: 0, y: 1620}
            result.rotation = -0.5;
        }
        if(angle == 180){
            result.scale = 1280/1080
            result.translation = {x: 1350, y: 1080}
            result.rotation = -1.0;
        }
        if(angle == 270){
            result.scale = 960/1080
            result.translation = {x: 1080, y: -400}
            result.rotation = -1.5
        }
    return result
}

HYPNO.composition.timeFormat = "frames"
HYPNO.composition.preferredTimescale = 30
HYPNO.composition.renderSize.width = 960
HYPNO.composition.renderSize.height = 1280

function sequence (inputs) {


    let tracks = [];

    let cameraInput = inputs ["camera"]
    let musicInput = inputs["digitalglitch-music-3.mp3"]

    let clips = [
        {
            cue: 0,
            ticks: 50,
            speed: 1.0
        },
        {
            cue: 80,
            ticks: 55,
            speed: 1.0
        },        
        {
            cue: 40,
            ticks: 75,
            speed: 1.0
        },
        {
            cue: 55,
            ticks: 30,
            speed: 1.0
        },
        {
            cue: 0,
            ticks: 55,
            speed: 1.0
        },
        {
            cue: 20,
            ticks: 90,
            speed: 1.0
        },
        {
            cue: 60,
            ticks: 75,
            speed: 1.0
        }
    ]

    let cameraTrack = Track ("camera");
    let chaseTrack = Track("chase")
    let runtime = 0

    clips.forEach(c=>{
        let runlength = new Time(c.ticks, 30)
        let modifiedRunlength = new Time(Math.floor(c.ticks * c.speed), 30)

        let cameraClip = new Clip(new Time(c.cue + 4, 30), modifiedRunlength, cameraInput.name, "video")
        let chaseClip = new Clip(new Time(c.cue, 30), modifiedRunlength, cameraInput.name, "video")

        cameraClip.scaleToDuration(runlength)
        chaseClip.scaleToDuration(runlength)

        cameraTrack.add(cameraClip)
        chaseTrack.add(chaseClip)
        runtime += c.ticks
    })

    let musicTrack = new Track("music")
    let musicClip = new Clip(new Time(4, 30), new Time(runtime, 30), musicInput.name, "audio")
    musicTrack.add(musicClip)

    tracks.push(musicTrack)
    tracks.push(chaseTrack)
    tracks.push(cameraTrack)

    return tracks;
}

function render (context, instruction) {

    let i = instruction.index
    let t = instruction.time
    let c = context.time

    {
    //VARIABLE INPUT TRANSFORM

        let inputSize = instruction.getImageSize("camera")

        if(inputSize.width != 960 && inputSize.height != 1280){

            if(inputSize.width > inputSize.height){
                /*  
                    AUX CAM/LANDSCAPE INPUT HANDLING
                    modify ANGLE parameter to rotate + translate
                    *it's good to note that if though the air camera is rotated, the 
                    input will still be landscape, just sideways!*
                */

                //
                let angle = 90
                //

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
                // PORTRAIT RESIZE for eye, iphone, etc.
                
                let scale = 1280/inputSize.height
                let t1 = AffineTransform.makeScale(scale, scale)
                instruction.setAffineTransform(t1, "camera")
            }        
        }
    } 


    //PIXELLATE
    if(i == 1){
        let r = 0.0
        let r2 = 0.0
        let tiles = 12.0
        if(t < 0.5){
            r = Math.floor((t-0.25) * 84) * 0.1;
        }
        if(t > 0.4 && t < 0.5){
            r2 = Math.floor((t-0.4) * 108) * 0.1;
        }
        if(t > 0.7 && t < 0.8){
            r = 1.0
            r2 = 0.0
            tiles = 36.0
        }

        mosaic.setValue(r, "top")
        mosaic.setValue(r2, "bottom")
        mosaic.setValue(tiles, "tileNum")
        mosaic.setValue(0.0, "format")
        instruction.addKernel(mosaic, "camera")
    }
    if(i == 4){
        let r = 0.0
        let r2 = 0.0
        let tiles = 12.0
        if((t > 0.5 && t < 0.7)){
            r = 1.0
            r2 = 0.0
            tiles = 36.0
        }
        mosaic.setValue(r, "top")
        mosaic.setValue(r2, "bottom")
        mosaic.setValue(tiles, "tileNum")
        mosaic.setValue(0.0, "format")
        instruction.addKernel(mosaic, "camera")
    }

    //RGBGLITCH
    if(i == 2 || (i == 5 && t > 0.2 && t < 0.8)){

        rgbShift.setValue(3.0, "intensity")
        instruction.addKernel(rgbShift, "chase")

        glitch.setValue(t/2, "time")
        glitch.setValue(instruction.getImage("chase"), "chase")
        glitch.setValue(0.7, "shift")
        glitch.setValue(0.3, "factor")
        instruction.addKernel(glitch, "camera")

    }

    //GLITCH TRANSITION
    if(i == 0){
        if(t > 0.45 && t < 0.54){
            let r = 0.15 *  Math.sin(10.0 * (t- 0.45) * Math.PI)
            glitch2.setValue(r, "amount")
            glitch2.setValue(0, "direction")
            instruction.addKernel(glitch2, "camera")
        }
    }
    if(c > 0.475 && c < 0.5){
        let r = 0.05 *  Math.sin(40.0 * (c - 0.475) * Math.PI)
        glitch2.setValue(r, "amount")
        glitch2.setValue(1, "direction")
        instruction.addKernel(glitch2, "camera")
    }   
    if(c > 0.815 && c < 0.838){
        let r = 0.08 *  Math.sin(40.0 * (c - 0.815) * Math.PI)
        glitch2.setValue(r, "amount")
        glitch2.setValue(0, "direction")
        instruction.addKernel(glitch2, "camera")
    }      
}

function exportSettings() {
 
    let bitrate = (HYPNO.composition.renderSize.width) * (HYPNO.composition.renderSize.height) * (30.0)
 
    bitrate *= 0.23
 
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