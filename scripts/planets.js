import * as calc from "http://127.0.0.1:5500/scripts/modules/calc.js";
import * as astro from "http://127.0.0.1:5500/scripts/modules/astroCalc.js";
import * as d3 from "https://cdn.skypack.dev/d3@7";
const div = d3.selectAll("div"); 

const solarSystem = {
    sun: new astro.earthElement(...Object.values(astro.solarSystem.earth)),
    moon: new astro.planetElement(...Object.values(astro.solarSystem.moon)),
    mercury: new astro.planetElement(...Object.values(astro.solarSystem.mercury)),
    venus: new astro.planetElement(...Object.values(astro.solarSystem.venus)),
    mars: new astro.planetElement(...Object.values(astro.solarSystem.mars)),
    jupiter: new astro.planetElement(...Object.values(astro.solarSystem.jupiter)),
    saturn: new astro.planetElement(...Object.values(astro.solarSystem.saturn)),
    uranus: new astro.planetElement(...Object.values(astro.solarSystem.uranus)),
    neptune: new astro.planetElement(...Object.values(astro.solarSystem.neptune))
}

/* functions for displaying the solar system */

function updateSolarSystem(d) {
    Object.keys(solarSystem).forEach(instance => {
        solarSystem[instance].elementAt(d);
    });
}

function position(scale) {
    let offset = {x: 0, y: 0};
    if (focus.focus) {
        offset.x = -solarSystem[focus.focus].pos.x;
        offset.y = -solarSystem[focus.focus].pos.y;
    }
    document.getElementById('sol').style.setProperty('top', 'calc(50% + '+offset.y*scale+'px)');
    document.getElementById('sol').style.setProperty('left', 'calc(50% + '+offset.x*scale+'px)');
    Object.keys(solarSystem).forEach(instance => {
        document.getElementById(instance).style.setProperty('top', 'calc(50% + '+(solarSystem[instance].pos.y+offset.y)*scale+'px)');
        document.getElementById(instance).style.setProperty('left', 'calc(50% + '+(solarSystem[instance].pos.x+offset.x)*scale+'px)');
    });
}

function frame() {
    if (0) {
      clearInterval(id);
    } else if (d>=35000) {
        d = -35000;
    } else {
      d+=step;
      document.getElementById("date-range").value = d;
      updateSolarSystem(d);
      position(scale);
      document.getElementById("d").innerHTML = (calc.getDate(d));
    }
}

setInterval(frame, 10); // update frame every 10ms

/* functions for html-interaction */

// variables to store runtime-info
var lastStep;
var savedStep = false;
var focus = {focused: false, focus: false};
var sizingMode;
var d = 0;
var scale = 20;
var step = 1;
// setting initial settings
position(scale);
updateScale();
updateStep();

function docRem() {
    return window.getComputedStyle(document.querySelector('html')).getPropertyValue('font-size').match(/\d/g).join("");
}

    /* scaling settings */

function updateScale() {
    document.getElementById("scale-form").value = scale;
    if (sizingMode == 'relative') {setPlanetSize('relative');};
    if (sizingMode == 'true') {setPlanetSize('true');};
}
function minusScale() {
    scale -= 10;
    updateScale();
}
function plusScale() {
    scale += 10;
    updateScale();
}

    /* speed settings */

function updateStep() {
    if (!(step===0)) {
        if (lastStep==0) {togglePlayIcon();} 
    } else {
        if (lastStep!=0) {togglePlayIcon();}
    }
    document.getElementById("step-form").value = step;
    lastStep = step;
}
function minusStep() {
    if (savedStep) {
        step = savedStep;
        savedStep = false;
    }
    step--;
    updateStep();
}
function plusStep() {
    if (savedStep) {
        step = savedStep;
        savedStep = false;
    }
    step++;
    updateStep();
}

    /* play/pause settings */

function togglePlay() {
    if (!(step===0)) {
        savedStep = step;
        step = 0;
        updateStep();
        document.getElementById("step-form").value = savedStep;

    } else {
        if (savedStep) {
            step = savedStep;
            savedStep = false;
            updateStep();
        } else {
            step = 1;
            updateStep();
        }
    }
}

    /* html-styling */

function hideElement(name) {
    if (document.getElementById(name).style.display == 'none'){
        document.getElementById(name).style.display = 'inline-flex';
    } else {
        document.getElementById(name).style.display = 'none';
    }
}

function hideElement_vis(name) {
    if (document.getElementById(name).style.visibility === 'hidden'){
        document.getElementById(name).style.visibility = 'visible';
    } else {
        document.getElementById(name).style.visibility = 'hidden';
    }
}

    /* Icon toggling */

function toggleVisIcon(name) {
    name.classList.toggle('fa-eye-slash');
}
function toggleHidIcon(name) {
    name.classList.toggle('fa-eye');
}
function togglePlayIcon() {
    document.getElementById('play-icon').classList.toggle('fa-play');
}

function toggleFocusIcon(name, element) {
    name.classList.toggle('fa-dot-circle');
    if (!focus.focused) {
        focus.focused = true;
        focus.focus = element;
    } else {
        if (focus.focus == element) {
            focus.focused = false;
            focus.focus = false;
        } else {
            document.getElementById('focus-'+focus.focus).classList.toggle('fa-dot-circle');
            focus.focus = element;
        }
    }
}

function showImpressum() {
    document.getElementById("impressum").style.display = 'flex';
    document.getElementById("planets").style.display = 'none';
}

    /* Planet scaling */

function setPlanetSize(mode) {
    let rem = docRem();
    sizingMode = mode;
    switch (mode) {
        case 'uniform':
            solarSystem.moon._a0 = 60.2666*4.26352e-5;
            document.getElementById('sol').style.width = '2rem';
            document.getElementById('sol').style.height = '2rem';
            document.getElementById('sol-img').style.width = '3.6rem';
            Object.keys(solarSystem).forEach(instance => {
                document.getElementById(instance).style.width = '2rem';
                document.getElementById(instance).style.height = '2rem';
                document.getElementById(instance.toString()+'-img').style.width = '2.4rem';
                document.querySelector('#'+instance+' p').style.setProperty('padding-bottom', '2.2rem');
                document.querySelector('#'+instance+' p').style.setProperty('padding-left', '2.2rem');
            });
            break;
        case 'true':
            solarSystem.moon._a0 = 60.2666*4.26352e-5;
            document.getElementById('sol').style.width = calc.getAU(1.3927e+6*scale/rem).toString()+'rem';
            document.getElementById('sol').style.height = calc.getAU(1.3927e+6*scale/rem).toString()+'rem';
            document.getElementById('sol-img').style.width = calc.getAU(1.3927e+6*1.8*scale/rem).toString()+'rem';
            Object.keys(solarSystem).forEach(instance => {
                document.getElementById(instance).style.width = (solarSystem[instance]._D*scale/rem).toString()+'rem';
                document.getElementById(instance).style.height = (solarSystem[instance]._D*scale/rem).toString()+'rem';
                document.getElementById(instance.toString()+'-img').style.width = (solarSystem[instance]._D*1.2*scale/rem).toString()+'rem';
                document.querySelector('#'+instance+' p').style.setProperty('padding-bottom', '2.2rem');
                document.querySelector('#'+instance+' p').style.setProperty('padding-left', (solarSystem[instance]._D*scale/rem).toString()+'rem');
            });
            break;
        case 'relative':
            let scaleFactor = 2000;
            solarSystem.moon._a0 = 0.001*scale;
            document.getElementById('sol').style.width = '2rem';
            document.getElementById('sol').style.height = '2rem';
            document.getElementById('sol-img').style.width = '3.6rem';
            Object.keys(solarSystem).forEach(instance => {
                document.getElementById(instance).style.width = (solarSystem[instance]._D*scale/rem*scaleFactor).toString()+'rem';
                document.getElementById(instance).style.height = (solarSystem[instance]._D*scale/rem*scaleFactor).toString()+'rem';
                document.getElementById(instance.toString()+'-img').style.width = (solarSystem[instance]._D*1.2*scale/rem*scaleFactor).toString()+'rem';
                document.querySelector('#'+instance+' p').style.setProperty('padding-bottom', solarSystem[instance]._D*scale/rem*scaleFactor);
                document.querySelector('#'+instance+' p').style.setProperty('padding-left', (solarSystem[instance]._D*scale/rem*scaleFactor).toString()+'rem');
            });
            break;
        default:
            return;
    }
}

function setTrueRes() {
    scale = 500;
    updateScale();
    step = 0.1;
    updateStep();
}

/* Function for displaying planetary orbits */
// doesn't fucking work

function calcOrbit(instance, epoch=0, n=10) {
    const T = instance._P*calc.Y;
    var ellipse = [];
    for (let i = 0; i < n; i++) {
        solarSystem[instance].elementAt(epoch+i*T/n);
        let pos = solarSystem[instance].pos;
        pos.x *= scale;
        pos.y *= scale;
        ellipse.push(pos);
    }
    return ellipse;
}

function plotEllipse(data) {
    const svg = d3.create("svg")
        .attr("viewBox", [0, 0, 400, 400]);

    // svg.append("g")
    //     .call(xAxis);

    // svg.append("g")
    //     .call(yAxis);

    // svg.append("g")
    //     .call(grid);

    svg.append("g")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("fill", "none")
    .selectAll("circle")
    .data(data)
    // .join("circle")
    //     .attr("cx", d => x(d.x))
    //     .attr("cy", d => y(d.y))
    //     .attr("r", 3);

    svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
    .selectAll("text")
    .data(data)

    return svg.node();
}

function drawOrbit(instance) {
    let data = calcOrbit(instance, d);
    let canvas = plotEllipse(data);
    console.log(canvas)
    d3.select("orbits").append(canvas);
}

/*  make functions available in html */

window.updateScale = updateScale;
window.plusScale = plusScale;
window.minusScale = minusScale;
window.updateStep = updateStep;
window.plusStep = plusStep;
window.minusStep = minusStep;
window.togglePlay = togglePlay;
window.hideElement = hideElement;
window.hideElement_vis = hideElement_vis;
window.toggleVisIcon = toggleVisIcon;
window.toggleHidIcon = toggleHidIcon;
window.togglePlayIcon = togglePlayIcon;
window.toggleFocusIcon = toggleFocusIcon;
window.setPlanetSize = setPlanetSize;
window.setTrueRes = setTrueRes;
window.showImpressum = showImpressum;
window.drawOrbit = drawOrbit;

/* event handling */ 

document.getElementById("scale-minus").addEventListener("click", minusScale);   // reduce scale button
document.getElementById("scale-plus").addEventListener("click", plusScale);     // increase scale button
document.getElementById("scale-form").addEventListener("keyup", event => {      // set scale form
    if(event.key == "Enter") {// Check for Enter-key
    scale = Number(document.getElementById("scale-form").value);
    updateScale();
    } else {return;}
    event.preventDefault();
});
document.getElementById("step-minus").addEventListener("click", minusStep);     // reduce step button
document.getElementById("step-plus").addEventListener("click", plusStep);       // increase step button
document.getElementById("step-form").addEventListener("keyup", event => {       // set step form
    if(event.key == "Enter") {// Check for Enter-key
    step = Number(document.getElementById("step-form").value);
    savedStep = false;
    updateStep();
    } else {return;}
    event.preventDefault();
});
document.getElementById("date-range").addEventListener("input", event => {      // timeline range
    d = Number(document.getElementById("date-range").value);
});
document.getElementById("date-input").addEventListener("input", event => {      // date selector
    let input = document.getElementById("date-input").value;
    d = calc.getEpoch(...input.split('-'));
    // if(event.key == "Enter") {
    //     console.log(document.getElementById("date-input").value)}
    //d = Number(document.getElementById("date-input").value);
});
document.getElementById("canvas").addEventListener('keydown', event =>{         // press space to pause
    console.log(event.code)                                                     // doesn't work
    if(event.code == "Space") {
        togglePlay();
        console.log(event.code)
    }
});