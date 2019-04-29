//
// Scanner Warp.js
// Scanner Warp
//
// Created by Mena Sachdev on 1 Apr 2019 4:39:27pm
// Copyright © 2019 Mena Sachdev. All rights reserved.

const warp = Kernel(File("blobWarp.cikernel").loadFileAsString())

function fps(time) {
    return Math.floor(time * 30) / 30
}

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


function sequence (inputs) {

    HYPNO.composition.renderSize.width = 960
    HYPNO.composition.renderSize.height = 1280

    let tracks = [];

    let cameraInput = inputs ["camera"];
    let musicInput = inputs["music.mp3"]

    let d = musicInput.duration
    let m = d / 4

    let clips = [

        {
            cue: 2.0,
            length: m * 1.25
        },
        {
            cue: 0.0,
            length: m * 0.75
        },
  
        {
            cue: 1.4,
            length: m
        },
        {
            cue: 1.5,
            length: m/4
        },
        {
            cue: 0.3,
            length: m * 0.75
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
        
        if(i == 1){
            warp.setValue(t/2, "time")
            instruction.addKernel(warp, "camera")
        }
        if(i == 4){
            let r = 1.0 + Math.sin(t * Math.PI/2)
            warp.setValue(r, "time")
            instruction.addKernel(warp, "camera")
        }

        if(i==2){

            let bump = Filter("CIBumpDistortionLinear")
            let r = easeInOutBack(t, 0.5, 0.6, 0.9)
            bump.setValue([500.0, 100 + 734.0 * r], "inputCenter")
            bump.setValue(2.0, "inputScale")
            instruction.addFilter(bump, "camera")

        }
    }


    {
        //COLOR
        var CIVibrance = Filter("CIVibrance")
        CIVibrance.setValue(0.2, "inputAmount")
        instruction.addFilter(CIVibrance, "camera")
        instruction.addFilter(CIVibrance, "support")

        let colorControl = Filter("CIColorControls")
        colorControl.setValue("camera", "inputImage")
        colorControl.setValue(1.3, "inputSaturation")
        colorControl.setValue(1.1, "inputContrast")
        instruction.addFilter(colorControl, "camera")
        instruction.addFilter(colorControl, "support")
    }
    
}