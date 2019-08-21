//
// RGB Glitch.js
// RGB Glitch
//
// Created by Mena Sachdev on 21 Mar 2019 4:26:38pm
// Copyright © 2019 Mena Sachdev. All rights reserved.

const rgbGlitch = Kernel(File("rgbGlitch.cikernel").loadFileAsString())
const interlace = Kernel(File("interlace.cikernel").loadFileAsString())
const rgbShift = Kernel(File("rgbShiftX.cikernel").loadFileAsString())

function fps(time) {
    return Math.floor(time * 30) / 30
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
    let musicInput = inputs["music.mp3"]
    let jewelInput = inputs["normalmap.mp4"]

    let d = musicInput.duration
    let m = d / 8

    let clips = [
        {
            cue: 2.0,
            length: m/2
        },
        {
            cue: 2.0,
            length: m
        },
        {
            cue: 2.0,
            length: m/2
        },
        {
            cue: 2.0,
            length: m
        },        
        {
            cue: 3.0,
            length: m/2
        },
        {
            cue: 1.0,
            length: m
        },        
        {
            cue: 2.0,
            length: m/2
        },
                
        {
            cue: 2.0,
            length: m
        },        
        {
            cue: 0.0,
            length: m/2
        },
               
         {
            cue: 1.0,
            length: m * 1.5 + 0.1
        },          
  
    ]

    let cameraTrack = Track ("camera");
    let duration = 0
    clips.forEach(c=>{
        let cameraClip = new Clip(c.cue, fps(c.length), cameraInput.name, "video")
        cameraTrack.add(cameraClip)
        duration += fps(c.length)
    })

    let musicClip = new Clip(0.0, duration, musicInput.name, "audio")

    let musicTrack = new Track("music")

    musicTrack.add(musicClip)
    tracks.push(musicTrack)
    tracks.push(cameraTrack);
    return tracks;
}

function render (context, instruction) {

    let i = instruction.index
    let t = instruction.time

    {
    //VARIABLE INPUT TRANSFORM

        let inputSize = instruction.getImageSize("camera")
       // let overlaySize = instruction.getImageSize("jewel")

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

    }

    if(i == 3 || i == 7 | i == 8 || i == 4){
        //INTERLACE
        interlace.setValue(t, "iTime")
        interlace.setValue(context.time, "cTime")
        instruction.addKernel(interlace, "camera")   
    } 

    { // RGB GLITCH & SHIFT
        let r, p;

        if(i == 0 || i == 2 || i == 4 || i == 5|| i == 8 || i == 6 | i == 7 || i ==9 || i == 10){
            r = 0
        } else if(i==3){
            r = 0
        } 
        else {
            r = 5.0
        }

        if(i == 0 || i == 8){
            p = 50 * Math.sin(1.0 * t* Math.PI);
        } else if(i == 5){
            if(t < 0.5){
                p = Math.pow(10 * t, 3.0);
            } else {
                p = 100 * Math.sin(16.0 * t* Math.PI);
            }
        }
        else {
            p = 0;
        }

        rgbGlitch.setValue(t, "iTime")
        rgbGlitch.setValue(r * context.time, "cTime")
        instruction.addKernel(rgbGlitch, "camera")

        rgbShift.setValue(p, "intensity")
        instruction.addKernel(rgbShift, "camera")
    }

    // CIColorControls
    const CIColorControls = Filter("CIColorControls")
    CIColorControls.setValue(1.1, "inputSaturation")
    instruction.addFilter(CIColorControls, "camera")

    var CIVibrance = Filter("CIVibrance")
    CIVibrance.setValue(0.5, "inputAmount")
    instruction.addFilter(CIVibrance, "camera")
}

function exportSettings() {
 
    let bitrate = (HYPNO.composition.renderSize.width) * (HYPNO.composition.renderSize.height) * (30.0)
 
    bitrate *= 0.4
 
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