import * as calc from "http://127.0.0.1:5500/scripts/modules/calc.js";

class astroElement {
    constructor(N, i, w, a, e, M, D, update) {
        this._N0 = calc.modulateCircle(calc.getRadians(N));                     // longitude of the ascending node
        this._i0 = calc.modulateCircle(calc.getRadians(i));                    // inclination to the ecliptic (plane of the Earth's orbit)
        this._w0 = calc.modulateCircle(calc.getRadians(w));                    // argument of perihelion
        this._a0 = a;                                // semi-major axis, or mean distance from Sun (set in AU, ideally)
        this._e0 = e;                                // eccentricity (0=circle, 0-1=ellipse, 1=parabola)
        this._M0 = calc.modulateCircle(calc.getRadians(M));                    // mean anomaly (0 at perihelion; increases uniformly with time)
        this._D = D;
        this._update = update;
        this.elementAt(0);
    }
    elementAt(d) {
        // update orbital elements
        this._N = calc.modulateCircle(calc.getRadians(this._N0 + this._update.N*d));
        this._i = calc.modulateCircle(calc.getRadians(this._i0 + this._update.i*d));
        this._w = calc.modulateCircle(calc.getRadians(this._w0 + this._update.w*d));
        this._a = this._a0 + this._update.a*d;
        this._e = this._e0 + this._update.e*d;
        this._M = calc.modulateCircle(calc.getRadians(this._M0 + this._update.M*d));
        // additional variables
        this._w1 = calc.modulateCircle(this._N + this._w);         // longitude of perihelion
        this._L = calc.modulateCircle(this._M + this._w1);         // mean longitude
        this._q = this._a*(1-Math.E);         // perihelion distance
        this._Q = this._a*(1+Math.E);         // aphelion distance
        this._P = Math.pow(this._a, 1.5);     // orbital period (years if a is in AU, astronomical units)
        this._T = d-this._M/(Math.PI*2)*calc.Y*this._P;                                                    // time of perihelion
        this._E = calc.modulateCircle(this._M + this._e*Math.sin(this._M) * (1 + this._e*Math.cos(this._M)));  // eccentric anomaly
    }
    get epoch() {
        return Math.round(this._T);
    }
}

class earthElement extends astroElement {
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
    get pos() {
        return {x: this._x, y: this._y};
    }
}

class planetElement extends astroElement {
    constructor(N, i, w, a, e, M, D, update) {
        super(N, i, w, a, e, M, D, update);
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
    get pos() {
        return {x: this._x, y: this._y};
    }
}

/* Objects to store update parameters */

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
    a: calc.getAU(60.2666*6378.14), // earth-radii (km), converted to AU
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

const solarSystem = {
    mercury: mercury_init, 
    venus: venus_init, 
    earth: earth_init, 
    moon: moon_init, 
    mars: mars_init,
    jupiter: jupiter_init,
    saturn: saturn_init,
    uranus: uranus_init,
    neptune: neptune_init
}

export {earthElement, planetElement, solarSystem}