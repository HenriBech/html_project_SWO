function div(a, b) {
    // Integer division
    return a/b>>0;
}

function getDay(y, m, D) {
    // valid between 1900 and 2100
    return 367*y - 7 * div(( y + div((m+9), 12) ), 4) + 275*div(m,9) + D - 730530;
}

/*  Class for the astrological elements and for updating them */

class astroElement {
    constructor(N, i, w, a, e, M, update) {
        this._N = N;                                // longitude of the ascending node
        this._i = i;                                // inclination to the ecliptic (plane of the Earth's orbit)
        this._w = w;                                // argument of perihelion
        this._a = a;                                // semi-major axis, or mean distance from Sun (set in AE, ideally)
        this._e = e;                                // eccentricity (0=circle, 0-1=ellipse, 1=parabola)
        this._M = M;                                // mean anomaly (0 at perihelion; increases uniformly with time)
        this._w1 = N + w;                           // longitude of perihelion
        this._L = M + this._w1;                     // mean longitude
        this._q = a*(1-Math.E);                     // perihelion distance
        this._Q = a*(1+Math.E);                     // aphelion distance
        this._P = Math.pow(a, 1.5);                 // orbital period (years if a is in AU, astronomical units)
        /* TODO:
        this._T = Epoch_of_M - (M(deg)/360_deg) / P // time of perihelion
        this._V                                     // true anomaly (angle between position and perihelion)
        this._E                                     // eccentric anomaly */
        this._update = update;
    }
    update(d) {
        this._N = N+this.update.N*d;
        this._i = i+this.update.i*d;
        this._w = w+this.update.w*d;
        this._a = a+this.update.a*d;
        this._e = e+this.update.e*d;
        this._M = M+this.update.M*d;
        this._w1 = N + w;
        this._L = M + this._w1;
        this._q = a*(1-Math.E);
        this._Q = a*(1+Math.E);
        this._P = Math.pow(a, 1.5);
        /* TODO:
        this._T = Epoch_of_M - (M(deg)/360_deg) / P
        this._V
        this._E*/
    }
}

/* Objects to store update parameters */

const sun_d = {
    N: 0.0,
    i: 0.0,
    w: 4.70935E-5,
    a: 0.0,
    e: 1.151E-9,
    M: 0.9856002585
}

const moon_d = {
    N: 0.0529538083,
    i: 0.0,
    w: 0.1643573223,
    a: 0.0,
    e: 0.0,
    M: 13.0649929509
}

const mercury_d = {
    N: 3.24587E-5,
    i: 5.00E-8,
    w: 1.01444E-5,
    a: 0.0,
    e: 5.59E-10,
    M: 4.0923344368
}

const venus_d = {
    N: 2.46590E-5,
    i: 2.75E-8,
    w: 1.38374E-5,
    a: 0.0,
    e: 1.302E-9,
    M: 1.6021302244
}

const mars_d = {
    N: 2.11081E-5,
    i: 1.78E-8,
    w: 2.92961E-5,
    a: 0.0,
    e: 2.516E-9,
    M: 0.5240207766
}

const jupiter_d = {
    N: 2.76854E-5,
    i: 1.557E-7,
    w: 1.64505E-5,
    a: 0.0,
    e: 4.469E-9,
    M: 0.0830853001
}

const saturn_d = {
    N: 2.38980E-5,
    i: 1.081E-7,
    w: 2.97661E-5,
    a: 0.0,
    e: 9.499E-9,
    M: 0.0334442282
}

const uranus_d = {
    N: 1.3978E-5,
    i: 1.9E-8,
    w: 3.0565E-5,
    a: 1.55E-8,
    e: 7.45E-9,
    M: 0.011725806
}

const neptune_d = {
    N: 3.0173E-5,
    i: 2.55E-7,
    w: 6.027E-6,
    a: 3.313E-8,
    e: 2.15E-9,
    M: 0.005995147
}

/* initializing astronomical elements */

const sun = new astroElement(0.0, 0.0, 282.9404, 1.000000, 0.016709, 356.0470, sun_d);
const moon = new astroElement(125.1228, 5.1454, 318.0634, 60.2666, 0.054900, 115.3654, moon_d);
const mercury = new astroElement(48.3313, 7.0047, 29.1241, 0.387098, 0.205635, 168.6562, mercury_d);
const venus = new astroElement(76.6799, 3.3946, 54.8910, 0.723330, 0.006773, 48.0052, venus_d);
const mars = new astroElement(49.5574, 1.8497, 286.5016, 1.523688, 0.093405, 18.6021, mars_d);
const jupiter = new astroElement(100.4542, 1.3030, 273.8777, 5.20256, 0.048498, 19.8950, jupiter_d);
const saturn = new astroElement(113.6634, 2.4886, 339.3939, 9.55475, 0.055546, 316.9670, saturn_d);
const uranus = new astroElement(74.0005, 0.7733,  96.6612, 19.18171, 0.047318, 142.5905, uranus_d);
const neptune = new astroElement(131.7806, 1.7700, 272.8461, 30.05826, 0.008606, 260.2471, neptune_d);

alert('Heute ist der Tag: '+getDay(2021, 9, 9));

