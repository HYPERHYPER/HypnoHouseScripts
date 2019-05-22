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

function sequence (inputs) {

    HYPNO.composition.renderSize.width = 960
    HYPNO.composition.renderSize.height = 1280

    let tracks = [];

    let cameraInput = inputs ["camera"];

    let clips = [
        {
            cue: 0.0,
            duration: 5.0
        }
    ]

    let cameraTrack = Track ("camera");

    clips.forEach(c=>{
        cameraClip = Clip(c.cue, c.duration, cameraInput.name, "video")
        cameraTrack.add(cameraClip)
    })

    tracks.push (cameraTrack);

    return tracks;
}

function render (context, instruction) {

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
                let angle = 0
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