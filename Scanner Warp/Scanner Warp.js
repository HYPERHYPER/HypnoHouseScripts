//
// Scanner Warp.js
// Scanner Warp
//
// Created by Mena Sachdev on 1 Apr 2019 4:39:27pm
// Copyright © 2019 Mena Sachdev. All rights reserved.

const warp = Kernel(File("blobWarp.cikernel").loadFileAsString())
const sinwave = Kernel(File("sinwaveWarp.cikernel").loadFileAsString())

function easeInOutBack(t, b, c, d) {
return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
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

HYPNO.composition.timeFormat = "frames"
HYPNO.composition.preferredTimescale = 30
HYPNO.composition.renderSize.width = 960
HYPNO.composition.renderSize.height = 1280


function sequence (inputs) {

    let tracks = []

    let cameraInput = inputs["camera"]
    let musicInput = inputs["music.mp3"]

    let clips = [
        {
            cue: 0,
            ticks: 67,
            speed: 1.0
        },
        {
            cue: 30,
            ticks: 45,
            speed: 1.8
        },
        {
            cue: 60,
            ticks: 67,
            speed: 1.0
        },
  
        {
            cue: 50,
            ticks: 90,
            speed: 1.0
        },
        {
            cue: 42,
            ticks: 90,
            speed: 1.0
        },
    ]

    let cameraTrack = Track ("camera");
    let runtime = 0.0

    clips.forEach(c=>{
        let runlength = new Time(c.ticks, 30)
        let modifiedRunlength = new Time(Math.floor(c.ticks * c.speed), 30)
        let clip = new Clip(new Time(c.cue, 30), modifiedRunlength, cameraInput.name, "video")
        
        clip.scaleToDuration(runlength)
        
        cameraTrack.add(clip)
        runtime += c.ticks
    })

    let musicClip = new Clip(new Time(0, 30), new Time(runtime, 30), musicInput.name, "audio")
    let musicTrack = new Track("music")
    musicTrack.add(musicClip)

    tracks.push(cameraTrack)
    tracks.push(musicTrack)

    return tracks
}

function render (context, instruction) {

    let i = instruction.index
    let t = instruction.time 

    {
    //VARIABLE INPUT TRANSFORM 

        let inputSize = instruction.getImageSize("camera")

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

    {
    //WARPING

        if(i == 0){
            let displace = Filter("CIBumpDistortionLinear")
            displace.setValue([0.0, context.height * Math.sin(Math.PI * (t))], "inputCenter")
            displace.setValue(1000.0 * Math.sin(t * Math.PI /2), "inputRadius")
            instruction.addFilter(displace, "camera")
        }
        
        if(i == 2){
            warp.setValue(t/2, "time")
            instruction.addKernel(warp, "camera")
        }
        if(i == 4){
            sinwave.setValue(t, "time")
            instruction.addKernel(sinwave, "camera")
        }

        if(i==3 && t > 0.5){

            let bump = Filter("CIBumpDistortionLinear")
            let r = easeInOutBack(t-0.5, 0.5, 0.6, 0.5)
            bump.setValue([480.0, 100 + 734.0 * r], "inputCenter")
            bump.setValue(2.0, "inputScale")
            instruction.addFilter(bump, "camera")

        }
    }


    {
        //COLOR
        var CIVibrance = Filter("CIVibrance")
        CIVibrance.setValue(0.1, "inputAmount")
        instruction.addFilter(CIVibrance, "camera")

        let colorControl = Filter("CIColorControls")
        colorControl.setValue("camera", "inputImage")
        colorControl.setValue(1.2, "inputSaturation")
        colorControl.setValue(1.1, "inputContrast")
        
        instruction.addFilter(colorControl, "camera")

    }
    
}

function exportSettings() {
 
    let bitrate = (HYPNO.composition.renderSize.width) * (HYPNO.composition.renderSize.height) * (30.0)
 
    bitrate *= 0.25
 
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