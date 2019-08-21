//
// Old Film.js
// Old Film
//
// Created by Mena Sachdev on 19 Mar 2019 11:30:31am
// Copyright © 2019 Mena Sachdev. All rights reserved.

const oldFilmRoll = new Kernel(File("oldFilmRoll.cikernel").loadFileAsString())
const overlay = new Kernel(File("overlay.cikernel").loadFileAsString())

function fps(time) {
    return Math.floor(time * 30) / 30
}

function auxRotationHandler(angle){
    /*
    // handles AUX input angles and adjusts scale, translation, and rotation
    // you may have to fine tune the translation values to get image to center based on input
    */
    let result = {}
        if(angle == 0){
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

function easeInCubic(t, d, b, c){
    return c*(t/=d)*t*t + b;
}

function easeInOutCubic(t, d, b, c){
    if ((t/=d/2) < 1) return c/2*t*t*t + b;
	return c/2*((t-=2)*t*t + 2) + b;
}

function easeOutCubic(t, d, b, c){
    return c*((t=t/d-1)*t*t + 1) + b;
}

let logo = Image.imageNamed("logo.png")

function sequence (inputs) {

    HYPNO.composition.frameDuration = 30
    HYPNO.composition.preferredTimescale = 60000
    HYPNO.composition.renderSize.width = 960
    HYPNO.composition.renderSize.height = 1280

    let tracks = [];

    let cameraInput = inputs ["camera"];
    let textureInput = inputs["texture.mp4"]
    let musicInput = inputs["music.mp3"]

    let d = musicInput.duration
    let m = d/4

    let clips = [
        {
            cue: 0.0,
            length: 2/30
        },
        {
            cue: 0.0,
            length: m/2 
        }, 
        {
            cue: m/2,
            length: m/2
        },        
        {
            cue: 3.0,
            length: m * 0.75
        },
        {
            cue: 0.0,
            length: m/2
        },
        {
            cue: 2.5,
            length: m * 0.75
        },
        {
            cue: 0.0,
            length: m/2
        },
        {
            cue: 0.0,
            length: m/2
        },
        {
            cue: 0.0,
            length: 2/30
        },
    ]

    let cameraTrack = Track ("camera");
    let duration = 0
    clips.forEach(c=>{
        let cameraClip = Clip(c.cue, fps(c.length), cameraInput.name, "video")
        cameraTrack.add(cameraClip)
        duration += fps(c.length)
    })
    
    let textureTrack = new Track("texture")
    let musicTrack = new Track("music")

    let textureClip = new Clip(0.0, duration, textureInput.name, "video")
    let musicClip = new Clip(0.0, duration, musicInput.name, "audio")

    textureTrack.add(textureClip)
    musicTrack.add(musicClip)

    tracks.push(textureTrack)
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
        let overlaySize = instruction.getImageSize("texture")

        if(inputSize.width != 960 && inputSize.height != 1280){

            if(inputSize.width > inputSize.height){
                /*  AUX CAM/LANDSCAPE CAPTURE HANDLING
                    modify ANGLE parameter to set capture angle
                */

                let angle = 180

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
            let scaler = 1280/inputSize.height
            let scale = AffineTransform.makeScale(scaler, scaler)
            instruction.setAffineTransform(scale, "camera")
        }
    }

    //COLOR
    {
        let max = 0.95
        let clamp = Filter("CIColorClamp")
        clamp.setValue([max, max, max, 1.0], "inputMaxComponents")
        instruction.addFilter(clamp, "camera")

        let colorControl = Filter("CIColorControls")
        colorControl.setValue("camera", "inputImage")
        colorControl.setValue(0.9, "inputSaturation")
        instruction.addFilter(colorControl, "camera")
    }

    //TEXTURE OVERLAY    

    let invert = Filter("CIColorInvert")
    instruction.addFilter(invert, "logo")

    let composite = Filter ("Composite");
    composite.setValue (instruction.getImage("camera"), "inputImage");
    composite.setValue ("SourceOver", "inputBlendMode");
    composite.setValue (logo, "inputOverlayImage"); 

    let texture = Filter("CISourceOverCompositing")
    texture.setValue(instruction.getImage("texture"), "inputImage")
    texture.setValue(instruction.getImage("camera"), "inputBackgroundImage")

    let blend = Filter("CIScreenBlendMode")
    blend.setValue(instruction.getImage("texture"), "inputBackgroundImage")
    blend.setValue(instruction.getImage("camera"), "inputImage")

    if(i== 0 || i == 9){
        instruction.addFilter(texture, "camera")
        instruction.addFilter(composite, "camera");
    }
    if(i == 1){
        if(t < 0.5){
            instruction.addFilter(texture, "camera")
            instruction.addFilter(composite, "camera");
        } else {
            instruction.setAlpha(0.20, "texture")
            instruction.addFilter(blend, "camera")
        }   
    }
    if(i == 8){
        if(t < 0.76){
            instruction.setAlpha(0.60, "texture")
            instruction.addFilter(blend, "camera")
        } else {
            instruction.addFilter(texture, "camera")
            instruction.addFilter(composite, "camera");
        } 
    } else {
        instruction.setAlpha(0.40, "texture")
        instruction.addFilter(blend, "camera")
    }

    //FILM ROLL EFFECT
    let blur = Filter("CIMotionBlur")
    blur.setValue(instruction.getImage("camera"), "inputImage")
    blur.setValue(73.8, "inputAngle")
    if(i == 1){
        let r = easeOutCubic(t, 1.0, 0.0, 5.0)
        oldFilmRoll.setValue(r, "time")
        instruction.addKernel(oldFilmRoll, "camera")

        blur.setValue(50.0 * (1.0 - t), "inputRadius")
        instruction.addFilter(blur, "camera")
    }
    if(i == 5 || i == 8){
        let r = easeInCubic(t, 1.0, 0.0, 10.0)
        oldFilmRoll.setValue(r, "time")
        instruction.addKernel(oldFilmRoll, "camera")
        if(t > 0.3){
            blur.setValue(50.0 * (1.3 - t), "inputRadius")  
            instruction.addFilter(blur, "camera")
        }
    }
    
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