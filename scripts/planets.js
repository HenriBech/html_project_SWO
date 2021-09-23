import calc from "http://127.0.0.1:5500/scripts/modules/calc.js";
import astro from "http://127.0.0.1:5500/scripts/modules/astroCalc.js";
import { solarSystem, randomSystem } from "http://127.0.0.1:5500/scripts/modules/astroCalc.js";
import * as d3 from "https://cdn.skypack.dev/d3@7";

////////////////////////////// SIMULATION /////////////////////////////////

/* functions for displaying the solar system */

class SIM {
    constructor(system, scale, step) {
        // read in data
        this._system = system;
        this._data = [{"name": 'sun', "element": system}];
        for (const [name, el] of Object.entries(system.getSuborbitals())) {
            this._data.push({"name": name, "element": el});
        }
        // set simulation parameters
        this._day = 0;
        this._scale = scale;
        this._step = step;
        this._scalor = 1; // scaling factor for planet sizes
        this._sizing = "relative"
        this._focus = {focused: false, focus: false};
    }
    // parameter getters and setters
    get data() {return this._data;}
    get d() {return this._day;}
    get scale() {return 10**this._scale;}
    get step() {return this._step;}
    set d(day) {this._day = day;}
    set scale(scale) {this._scale = scale;}
    set step(step) {this._step = step;}
    set scaling(scalor) {this._scalor = scalor;}
    set sizingMode(mode) {this._sizing = mode}
    scaleAdd(x) {this._scale += x}
    sizeAdd(x) {this.scaling += x}
    stepAdd(x) {this.step += x}

    // Create empty svg for each element in data
    setCanvas(target) {
        this._target = target;
        let canvas = d3.select(target)
            .style("width", "100%")
            .style("height", "100%")
            .selectAll("svg")
            .data(this.data)
            .enter()
          .append("svg")
            .attr("class", "planet center")
            .attr("id", function(d){return d["name"]})
        //   .insert("svg")
        //     .attr("class", "orbit center")
        //     .attr("id", function(d){return d["name"]+'-orbit'})
        // get canvas parameters
        let parentDim = d3.select(target).node().getBoundingClientRect(),
        width = parentDim.width,
        height = parentDim.height;
        d3.selectAll(".planet")
            .style("width", "100%")
            .style("height", "100%")
            .attr("viewBox", [-width/2, -height/2, width, height].join(" "))
        return canvas;
    }

    addPlanets() {
        // Axes
        // var x = d3.scaleLinear()
        // .domain([-width/2, width/2])
        // .range([ 0, width ]);

        // var y = d3.scaleLinear()
        // .domain([-height/2, height/2])
        // .range([ height, 0]);
        
        this.data.forEach((datum, i) => {
            let planet = d3.select("#"+datum.name)
            planet.append('circle')             // draw underlying circle
                .attr('r', datum.element._D*this._scalor*this.scale)
                .attr('stroke', 'black')
                .attr('fill', datum.element.color)
            if (i>0) {
                planet.insert("path")               // draw orbit
                    .attr("fill", "none")
                    .attr("stroke", datum.element.color)
                    .attr("stroke-width", 1.5)
                    .style("display", "none");
            }
            // d3.xml("http://127.0.0.1:5500/resources/images/planets/"+datum.name+".svg")     // svg graphics
            //     .then(function(d) {
            //         d3.select("#"+datum.name)
            //             .node()
            //           .append(d.documentElement)
            //     });
        })
    }
    /* Function for displaying planetary orbits */

    setPlanetSize() {
        this.data.forEach(datum => {
            d3.select("#"+datum.name)
              .select('circle')
                .attr('r', datum.element._D*this._scalor*this.scale)
        });
    }

    planet(name) {return this._system.getSuborbitals()[name];} // for debugging purposes only!

    position(d) {
        this.d = d;
        this._system.updateElement(this.d); // update all elements, returns list of perihelion events
        let offset = {x: 0, y: 0};
        if (this._focus.focus) {
            let focus = this.data.find(el => el.name === this._focus.focus).element
            offset.x = -focus.pos.x;
            offset.y = -focus.pos.y;
        }
        d3.selectAll("svg")
          .select("circle")
            .attr("cx", datum => {return ((datum.element.pos.x+offset.x)*this.scale).toString();})
            .attr("cy", datum => {return ((datum.element.pos.y+offset.y)*this.scale).toString();})
        this.data.forEach(datum => {
            // if (datum.name === 'moon') {console.log(datum.element.orbit)}
            d3.select("#"+datum.name)
              .select('path')
                .datum(datum.element.orbit)
                .attr("d", d3.line()
                    .x(d => { return (d.x+offset.x+datum.element._f.x)*this.scale })
                    .y(d => { return (d.y+offset.y+datum.element._f.y)*this.scale })
                ); 
        })     
    }

    frame() {
        if (0) {
        clearInterval(id);
        } else if (this.d>=35000) {
            this.d = -35000;
        } else {
        this.d+=this.step;
        $("#date-range").val(this.d)
        $("#date-input").val(calc.YMD(this.d))
        this.setPlanetSize()
        this.position(this.d)
        }
    }
}

class EVENTS {
    constructor (SIM) {
        this.SIM = SIM;
    }
    interval (t) { // set interval t (in ms) for update of system
        setInterval(() => {this.SIM.frame()}, t); 
    }
    setEventHandler(dom, type, func) {
        dom.on(type, func);
    }
}

export default {SIM, EVENTS, solarSystem, randomSystem}

// /* functions for html-interaction */

// // variables to store runtime-info
// var lastStep;
// var savedStep = false;
// var focus = {focused: false, focus: false};
// var sizingMode;
// var d = 0;
// var scale = 20;
// var step = 1;
// // setting initial settings
// position(scale);
// updateScale();
// updateStep();

// function docRem() {
//     return window.getComputedStyle(document.querySelector('html')).getPropertyValue('font-size').match(/\d/g).join("");
// }

//     /* scaling settings */

// function updateScale() {
//     document.getElementById("scale-form").value = scale;
//     if (sizingMode == 'relative') {setPlanetSize('relative');};
//     if (sizingMode == 'true') {setPlanetSize('true');};
// }
// function minusScale() {
//     scale -= 10;
//     updateScale();
// }
// function plusScale() {
//     scale += 10;
//     updateScale();
// }

//     /* speed settings */

// function updateStep() {
//     if (!(step===0)) {
//         if (lastStep==0) {togglePlayIcon();} 
//     } else {
//         if (lastStep!=0) {togglePlayIcon();}
//     }
//     document.getElementById("step-form").value = step;
//     lastStep = step;
// }
// function minusStep() {
//     if (savedStep) {
//         step = savedStep;
//         savedStep = false;
//     }
//     step--;
//     updateStep();
// }
// function plusStep() {
//     if (savedStep) {
//         step = savedStep;
//         savedStep = false;
//     }
//     step++;
//     updateStep();
// }

//     /* play/pause settings */

// function togglePlay() {
//     if (!(step===0)) {
//         savedStep = step;
//         step = 0;
//         updateStep();
//         document.getElementById("step-form").value = savedStep;

//     } else {
//         if (savedStep) {
//             step = savedStep;
//             savedStep = false;
//             updateStep();
//         } else {
//             step = 1;
//             updateStep();
//         }
//     }
// }

//     /* html-styling */

// function hideElement(name) {
//     if (document.getElementById(name).style.display == 'none'){
//         document.getElementById(name).style.display = 'inline-flex';
//     } else {
//         document.getElementById(name).style.display = 'none';
//     }
// }

// function hideElement_vis(name) {
//     if (document.getElementById(name).style.visibility === 'hidden'){
//         document.getElementById(name).style.visibility = 'visible';
//     } else {
//         document.getElementById(name).style.visibility = 'hidden';
//     }
// }

//     /* Icon toggling */

// function toggleVisIcon(name) {
//     name.classList.toggle('fa-eye-slash');
// }
// function toggleHidIcon(name) {
//     name.classList.toggle('fa-eye');
// }
// function togglePlayIcon() {
//     document.getElementById('play-icon').classList.toggle('fa-play');
// }

// function toggleFocusIcon(name, element) {
    // name.classList.toggle('fa-dot-circle');
    // if (!focus.focused) {
    //     focus.focused = true;
    //     focus.focus = element;
    //     document.title = element;
    // } else {
    //     if (focus.focus == element) {
    //         focus.focused = false;
    //         focus.focus = false;
    //         document.title = "Planets"
    //     } else {
    //         document.getElementById('focus-'+focus.focus).classList.toggle('fa-dot-circle');
    //         focus.focus = element;
    //         document.title = element;
    //     }
    // }
// }

// function showImpressum() {
//     document.getElementById("impressum").style.display = 'flex';
//     document.getElementById("planets").style.display = 'none';
// }

//     /* Planet scaling */

// function setPlanetSize(mode) {
//     let rem = docRem();
//     sizingMode = mode;
//     switch (mode) {
//         case 'uniform':
//             solarSystem.moon._a0 = 60.2666*4.26352e-5;
//             document.getElementById('sol').style.width = '2rem';
//             document.getElementById('sol').style.height = '2rem';
//             document.getElementById('sol-img').style.width = '3.6rem';
//             Object.keys(solarSystem).forEach(instance => {
//                 document.getElementById(instance).style.width = '2rem';
//                 document.getElementById(instance).style.height = '2rem';
//                 document.getElementById(instance.toString()+'-img').style.width = '2.4rem';
//                 document.querySelector('#'+instance+' p').style.setProperty('padding-bottom', '2.2rem');
//                 document.querySelector('#'+instance+' p').style.setProperty('padding-left', '2.2rem');
//             });
//             break;
//         case 'true':
//             solarSystem.moon._a0 = 60.2666*4.26352e-5;
//             document.getElementById('sol').style.width = calc.getAU(1.3927e+6*scale/rem).toString()+'rem';
//             document.getElementById('sol').style.height = calc.getAU(1.3927e+6*scale/rem).toString()+'rem';
//             document.getElementById('sol-img').style.width = calc.getAU(1.3927e+6*1.8*scale/rem).toString()+'rem';
//             Object.keys(solarSystem).forEach(instance => {
//                 document.getElementById(instance).style.width = (solarSystem[instance]._D*scale/rem).toString()+'rem';
//                 document.getElementById(instance).style.height = (solarSystem[instance]._D*scale/rem).toString()+'rem';
//                 document.getElementById(instance.toString()+'-img').style.width = (solarSystem[instance]._D*1.2*scale/rem).toString()+'rem';
//                 document.querySelector('#'+instance+' p').style.setProperty('padding-bottom', '2.2rem');
//                 document.querySelector('#'+instance+' p').style.setProperty('padding-left', (solarSystem[instance]._D*scale/rem).toString()+'rem');
//             });
//             break;
//         case 'relative':
//             let scaleFactor = 2000;
//             solarSystem.moon._a0 = 0.001*scale;
//             document.getElementById('sol').style.width = '2rem';
//             document.getElementById('sol').style.height = '2rem';
//             document.getElementById('sol-img').style.width = '3.6rem';
//             Object.keys(solarSystem).forEach(instance => {
//                 document.getElementById(instance).style.width = (solarSystem[instance]._D*scale/rem*scaleFactor).toString()+'rem';
//                 document.getElementById(instance).style.height = (solarSystem[instance]._D*scale/rem*scaleFactor).toString()+'rem';
//                 document.getElementById(instance.toString()+'-img').style.width = (solarSystem[instance]._D*1.2*scale/rem*scaleFactor).toString()+'rem';
//                 document.querySelector('#'+instance+' p').style.setProperty('padding-bottom', solarSystem[instance]._D*scale/rem*scaleFactor);
//                 document.querySelector('#'+instance+' p').style.setProperty('padding-left', (solarSystem[instance]._D*scale/rem*scaleFactor).toString()+'rem');
//             });
//             break;
//         default:
//             return;
//     }
// }

// /* Function for displaying planetary orbits */
// // doesn't fucking work

// function calcOrbit(instance, epoch=0, n=100) {
//     const T = solarSystem[instance]._P*calc.Y;
//     var ellipse = [];
//     for (let i = 0; i < n+1; i++) {
//         solarSystem[instance].elementAt(epoch+i*T/n);
//         let pos = solarSystem[instance].pos;
//         pos.x *= scale;
//         pos.y *= scale;
//         ellipse.push(pos);
//     }
//     return ellipse;
// }

// function plotEllipse(data, color) {
//     // set the dimensions and margins of the graph
//     var margin = {top: 0, right: 0, bottom: 0, left: 0},
//     parentDim = d3.select("#canvas").node().getBoundingClientRect(),
//     width = parentDim.width - margin.left - margin.right,
//     height = parentDim.height - margin.top - margin.bottom;

//     // append the svg object to the body of the page
//     var svg = d3.select("#orbits")
//       .append("svg")
//         .attr("class", "orbit")
//         .attr("width", width + margin.left + margin.right)
//         .attr("height", height + margin.top + margin.bottom)
//       .append("g")
//         .attr("transform",
//               "translate(" + margin.left + "," + margin.top + ")");

//     // Add X axis
//     var x = d3.scaleLinear()
//     .domain([-width/2, width/2])
//     .range([ 0, width ]);
//     svg.append("g")
//     .attr("transform", "translate(0," + height + ")")
//     // .call(d3.axisBottom(x));

//     // Add Y axis
//     var y = d3.scaleLinear()
//     .domain([-height/2, height/2])
//     .range([ height, 0]);
//     svg.append("g")
//     // .call(d3.axisLeft(y));

//     // Draw Orbit
//     svg.append("path")
//     .datum(data)
//     .attr("fill", "none")
//     .attr("stroke", color)
//     .attr("stroke-width", 1.5)
//     .attr("d", d3.line()
//         .x(function(d) { return x(d.x) })
//         .y(function(d) { return y(d.y) })
//         )

//     return svg.nodes();
// }

// function drawOrbit(instance) {
//     let data = calcOrbit(instance, d);
//     plotEllipse(data, solarSystem[instance].color);
// }

// /*  make functions available in html */

// window.updateScale = updateScale;
// window.plusScale = plusScale;
// window.minusScale = minusScale;
// window.updateStep = updateStep;
// window.plusStep = plusStep;
// window.minusStep = minusStep;
// window.togglePlay = togglePlay;
// window.hideElement = hideElement;
// window.hideElement_vis = hideElement_vis;
// window.toggleVisIcon = toggleVisIcon;
// window.toggleHidIcon = toggleHidIcon;
// window.togglePlayIcon = togglePlayIcon;
// window.toggleFocusIcon = toggleFocusIcon;
// window.setPlanetSize = setPlanetSize;
// window.showImpressum = showImpressum;
// window.drawOrbit = drawOrbit;