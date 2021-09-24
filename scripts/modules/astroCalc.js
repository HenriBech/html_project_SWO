import calc from "./calc.js";
import * as colormap from "https://cdn.skypack.dev/d3@7";

class astroElement {
    constructor(N, i, w, a, e, M, D, update) {
        this._N0 = calc.modulateCircle(calc.getRadians(N));                    // longitude of the ascending node
        this._i0 = calc.modulateCircle(calc.getRadians(i));                    // inclination to the ecliptic (plane of the Earth's orbit)
        this._w0 = calc.modulateCircle(calc.getRadians(w));                    // argument of perihelion
        this._a0 = a;                                // semi-major axis, or mean distance from Sun (set in AU, ideally)
        this._e0 = e;                                // eccentricity (0=circle, 0-1=ellipse, 1=parabola)
        this._M0 = calc.modulateCircle(calc.getRadians(M));                    // mean anomaly (0 at perihelion; increases uniformly with time)
        this._D = D;                                                           // diameter
        this._update = update;                                                 // object with update-information
        this._orbitals = {};                                                   // named list (object) of orbitals
        this.hasOrbitals = false;                                              // indicator for orbitals
        this._f = {x: 0, y: 0};                                                // elliptical focus of orbit
    }
    elementAt(d) {
        // update orbital elements
        this._N = calc.modulateCircle(this._N0 + calc.getRadians(this._update.N*d));
        this._i = calc.modulateCircle(this._i0 + calc.getRadians(this._update.i*d));
        this._w = calc.modulateCircle(this._w0 + calc.getRadians(this._update.w*d));
        this._a = this._a0 + this._update.a*d;
        this._e = this._e0 + this._update.e*d;
        this._M = calc.modulateCircle(this._M0 + calc.getRadians(this._update.M*d));
        // additional variables
        this._w1 = calc.modulateCircle(this._N + this._w);         // longitude of perihelion
        this._L = calc.modulateCircle(this._M + this._w1);         // mean longitude
        this._q = this._a*(1-Math.E);         // perihelion distance
        this._Q = this._a*(1+Math.E);         // aphelion distance
        this._P = Math.pow(this._a, 1.5);     // orbital period (years if a is in AU, astronomical units)
        this._T = d-this._M/(Math.PI*2)*calc.Y*this._P;                                                    // time of perihelion
        this._E = calc.modulateCircle(this._M + this._e*Math.sin(this._M) * (1 + this._e*Math.cos(this._M)));  // eccentric anomaly
    }

    updateElement(d) {
        this.elementAt(d);
        if (this.hasOrbitals) {
            for (const [name, orbital] of Object.entries(this._orbitals)) {
                orbital._f = this.pos;
                orbital.updateElement(d);
            }
        };
    }

    addOrbital(orbitals) { // accepts object with variable amount of orbitals
        Object.assign(this._orbitals, orbitals);
        this.hasOrbitals = true;
    }

    orbital(name) {
        if (name in this._orbitals) {return this._orbitals[name];}
        else {console.log(name+" not among orbitals of "+this)}
    }

    getSuborbitals(n=Infinity, re={}) { // recursively finds all sub-orbit selectors of the current element up to n layers deep
        if (!this.hasOrbitals || n==0) {return re}
        else {
            for (const [name, el] of Object.entries(this._orbitals)) {
                re[name] = el;
                el.getSuborbitals(--n, re);
            }
            return re;
        }
    }

    get pos() {
        return {x: this._x+this._f.x, y: this._y+this._f.y};
    }

    get epoch() {
        return this._T;
    }
}
class planetElement extends astroElement {
    constructor(N, i, w, a, e, M, D, update) {
        super(N, i, w, a, e, M, D, update);
        this.elementAt(0);
        this.calcOrbit(1000);
        this._type = "planet"
    }
    elementAt(d) {
        super.elementAt(d);
        if (Math.abs(this._e) > 0.05) {this.approxE();}                             // if orbit is elliptical, approximate bessel-function
        this._x = this._a * (Math.cos(this._E) - this._e);                          // x-coordinate on elliptic plane
        this._y = this._a * (Math.sqrt(1 - this._e*this._e) * Math.sin(this._E));   // y-coordinate on elliptic plane
        this._r = Math.sqrt(this._y*this._y+this._x*this._x);                       // distance from sun
        this._v = calc.modulateCircle(Math.atan2(this._y, this._x));                     // true anomaly (angle between position and perihelion)
        // 3D coordinates
        this._xh = this._r * (Math.cos(this._N) * Math.cos(this._v+this._w) - Math.sin(this._N) * Math.sin(this._v+this._w) * Math.cos(this._i));
        this._yh = this._r * (Math.sin(this._N) * Math.cos(this._v+this._w) + Math.cos(this._N) * Math.sin(this._v+this._w) * Math.cos(this._i));
        this._zh = this._r * (Math.sin(this._v+this._w) * Math.sin(this._i));
    }
    approxE() {
        var E1 = this._E;                           // initial approximation from circular orbit
        var E0, delta;
        do {                                        // approcimation of bessel-function
            E0 = E1;
            delta = (E0 - this._e * Math.sin(E0) - this._M) / (1 - this._e * Math.cos(E0));
            E1 = E0 - delta;
        } while (calc.getDegree(Math.abs(delta)) > 0.001);   // calculate to accuracy of 0.001 degrees
        this._E = calc.modulateCircle(E1);                   // if orbit is too parabolical (e≈1), this will not converge!
    }
    calcOrbit(n) {
        const T = this._P*calc.Y;
        var ellipse = [];
        for (let i = 0; i <= n; i++) {
            this.elementAt(this.epoch+i*T/n);
            ellipse.push(this.pos);
        }
        this.orbit = ellipse;
    }
}

class earthElement extends planetElement {
    constructor(N, i, w, a, e, M, D, update) {
        super(N, i, w, a, e, M, D, update);
        this._type = "earth";
    }
    elementAt(d) {
        super.elementAt(d);
        this._x = Math.cos(this._E) - this._e;                      // x-coordinate on elliptic plane
        this._y = Math.sqrt(1-this._e*this._e) * Math.sin(this._E); // y-coordinate on elliptic plane
        this._r = Math.sqrt(this._y*this._y+this._x*this._x);       // distance from earth
        this._v = calc.modulateCircle(Math.atan2(this._y, this._x));     // true anomaly (angle between position and perihelion)
        this._lon = calc.modulateCircle(this._v + this._w);              // true longitude
        this._xs = this._r * Math.cos(this._lon);                   // ecliptic rectangular geocentric x-coordinate
        this._ys = this._r * Math.sin(this._lon);                   // ecliptic rectangular geocentric y-coordinate
        this._xe = this._xs;                                        // equitorial rectangular geocentric x-coordinate
        this._ye = this._ys * Math.cos(calc.ecl(d));                     // equitorial rectangular geocentric y-coordinate
        this._ze = this._ys * Math.sin(calc.ecl(d));                     // equitorial rectangular geocentric z-coordinate
        this._RA = calc.modulateCircle(Math.atan2(this._ye, this._xe));  // Right Ascension
        this._Dec = calc.modulateCircle(Math.atan2(this._ze, Math.sqrt(this._xe*this._xe+this._ye*this._ye))); // Declination
        this._Ls = calc.modulateCircle(this._M + this._w)                // Mean longitude
    }
}

/* Objects to store update parameters */

const system_init = {
    N: 0,
    i: 0,
    w: 0,
    a: 0,
    e: 0,
    M: 0,
    D: calc.getAU(696340),
    update: {
        N: 0,
        i: 0,
        w: 0,
        a: 0,
        e: 0,
        M: 0
    }
}

const mercury_init = {
    N: 48.3313,
    i: 7.0047,
    w: 29.1241,
    a: 0.387098,
    e: 0.205635,
    M: 168.6562,
    D: calc.getAU(4879),
    update: {
        N: 3.24587E-5,
        i: 5.00E-8,
        w: 1.01444E-5,
        a: 0.0,
        e: 5.59E-10,
        M: 4.0923344368
    }
}

const venus_init = {
    N: 76.6799,
    i: 3.3946,
    w: 54.8910,
    a: 0.723330,
    e: 0.006773,
    M: 48.0052,
    D: calc.getAU(12104),
    update: {
        N: 2.46590E-5,
        i: 2.75E-8,
        w: 1.38374E-5,
        a: 0.0,
        e: -1.302E-9,
        M: 1.6021302244
    }
}

const earth_init = {
    N: 0.0,
    i: 0.0,
    w: 282.9404,
    a: 1.000000,
    e: 0.016709,
    M: 356.0470,
    D: calc.getAU(12756),
    update: {
        N: 0.0,
        i: 0.0,
        w: 4.70935E-5,
        a: 0.0,
        e: -1.151E-9,
        M: 0.9856002585
    }
}

const moon_init = {
    N: 125.1228,
    i: 5.1454,
    w: 318.0634,
    a: calc.getAU(60.2666*6378.14),  // earth-radii (km), converted to AU
    e: 0.054900,
    M: 115.3654,
    D: calc.getAU(3475),
    update: {
        N: -0.0529538083,
        i: 0.0,
        w: 0.1643573223,
        a: 0.0,
        e: 0.0,
        M: 13.0649929509
    }
}

const mars_init = {
    N: 49.5574,
    i: 1.8497,
    w: 286.5016,
    a: 1.523688,
    e: 0.093405,
    M: 18.6021,
    D: calc.getAU(6792),
    update: {
        N: 2.11081E-5,
        i: 1.78E-8,
        w: 2.92961E-5,
        a: 0.0,
        e: 2.516E-9,
        M: 0.5240207766
    }
}

const jupiter_init = {
    N: 100.4542,
    i: 1.3030,
    w: 273.8777,
    a: 5.20256,
    e: 0.048498,
    M: 19.8950,
    D: calc.getAU(142984),
    update: {
        N: 2.76854E-5,
        i: -1.557E-7,
        w: 1.64505E-5,
        a: 0.0,
        e: 4.469E-9,
        M: 0.0830853001
    }
}

const saturn_init = {
    N: 113.6634,
    i: 2.4886,
    w: 339.3939,
    a: 9.55475,
    e: 0.055546,
    M: 316.9670,
    D: calc.getAU(120536),
    update: {
        N: 2.38980E-5,
        i: -1.081E-7,
        w: 2.97661E-5,
        a: 0.0,
        e: -9.499E-9,
        M: 0.0334442282
    }
}

const uranus_init = {
    N: 74.0005,
    i: 0.7733,
    w: 96.6612,
    a: 19.18171,
    e: 0.047318,
    M: 142.5905,
    D: calc.getAU(51118),
    update: {
        N: 1.3978E-5,
        i: 1.9E-8,
        w: 3.0565E-5,
        a: -1.55E-8,
        e: 7.45E-9,
        M: 0.011725806
    }
}

const neptune_init = {
    N: 131.7806,
    i: 1.7700,
    w: 272.8461,
    a: 30.05826,
    e: 0.008606,
    M: 260.2471,
    D: calc.getAU(49528),
    update: {
        N: 3.0173E-5,
        i: -2.55E-7,
        w: -6.027E-6,
        a: 3.313E-8,
        e: 2.15E-9,
        M: 0.005995147
    }
}

// Add planets to solar system
const planets = {
    "mercury": new planetElement(...Object.values(mercury_init)),
    "venus": new planetElement(...Object.values(venus_init)),
    "earth": new planetElement(...Object.values(earth_init)),
    "mars": new planetElement(...Object.values(mars_init)),
    "jupiter": new planetElement(...Object.values(jupiter_init)),
    "saturn": new planetElement(...Object.values(saturn_init)),
    "uranus": new planetElement(...Object.values(uranus_init)),
    "neptune": new planetElement(...Object.values(neptune_init))
}

const solarSystem = new astroElement(...Object.values(system_init));
solarSystem._x = 0; solarSystem._y = 0; // center solar-system
solarSystem.addOrbital(planets);

// Add moon to earth
var moon = {"moon": new planetElement(...Object.values(moon_init))};
solarSystem.orbital("earth").addOrbital(moon);

// Add colors
solarSystem.color = '#F2CD5D'; // Orange Yellow Crayola
solarSystem.orbital("mercury").color = '#cb4b16';  // Orange
solarSystem.orbital("venus").color = '#d33682';  // Pink
solarSystem.orbital("earth").color = '#268bd2';  // Blue
solarSystem.orbital("earth").orbital("moon").color = '#93a1a1'; // Grey
solarSystem.orbital("mars").color = '#dc322f';  // Red
solarSystem.orbital("jupiter").color = '#b58900';  // Green
solarSystem.orbital("saturn").color = '#859900';  // Yellow
solarSystem.orbital("uranus").color = '#2aa198';  // Cyan
solarSystem.orbital("neptune").color = '#6c71c4';  // Violet

function randInit (dist, dM) {
    return {
        N: Math.random()*360,
        i: Math.random()*10,
        w: Math.random()*360,
        a: dist,
        e: Math.random()*0.2,
        M: Math.random()*360,
        D: calc.getAU(Math.random()*200000+3000),
        update: {N: 0, i: 0, w: 0, a: 0, e: 0, M: dM}
    }
}

function randomSystem(nPlanet) {
    const system_init = {N: 0, i: 0, w: 0, a: 0, e: 0, M: 0, 
        D: calc.getAU(696340), 
        update: {N: 0, i: 0, w: 0, a: 0, e: 0, M: 0}
    }
    const randSystem = new astroElement(...Object.values(system_init));
    randSystem._x = 0; randSystem._y = 0;
    randSystem.color = '#'+Math.floor(Math.random()*16777215).toString(16);
    const system_size = Math.floor(Math.random() * nPlanet);    // up to nPlanet planets in system
    for (let i = 0; i < system_size; i++) {
        let k = 0;
        if (i>0) {k=2**(i-1)}
        let dist = (4+3*k)/10; // Titius-Bode law
        let dM = (1+Math.random())/(i+1);
        let newSystem = new planetElement(...Object.values(randInit(dist, dM)));
        newSystem.color = '#'+Math.floor(Math.random()*16777215).toString(16);
        randSystem.addOrbital({['planet_'+i]: newSystem})
    }
    console.log(randSystem)
    return randSystem;
}

export default {astroElement, earthElement, planetElement}
export {solarSystem, randomSystem};
