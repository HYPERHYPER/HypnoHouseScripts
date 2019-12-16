//
// AUX-Template.js
// AUX-Template
//
// Created by Mena Sachdev on 22 May 2019 4:07:32pm
// Copyright © 2019 Mena Sachdev. All rights reserved.

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

    let cameraInput = inputs ["camera"];

    let clips = [
        {
            cue: 0,
            ticks: 90,
            speed: 1.0
        }
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

    tracks.push(cameraTrack)

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
}

// function exportSettings() {
 
//     let bitrate = (HYPNO.composition.renderSize.width) * (HYPNO.composition.renderSize.height) * (30.0)
 
//     bitrate *= 0.35
 
//     return {
//         video: {
//             averageBitRate: bitrate,
//             profileLevel: "H264Baseline41"
//         },
//         audio: {
//             numberOfChannels: 2,
//             sampleRate: 44100,
//             bitRate: 64000
//         }
//     }
// }
