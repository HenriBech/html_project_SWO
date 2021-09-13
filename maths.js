function div(a, b) {
    // Integer division
    return a/b>>0;
}

function modulateCircle(rad) {
    // modulo for angles in degrees
    return (rad % (2*Math.PI)) + (rad < 0 ? (2*Math.PI) : 0);
}

function getDay(y, m, D) {
    // computes days since 1.1.2000
    //  valid between 1900 and 2100
    return 367*y - 7 * div(( y + div((m+9), 12) ), 4) + 275*div(m,9) + D - 730530;
}

function getRadians(deg) {
    // computes radians of an angle
    return (deg/180)*Math.PI;
}

function getDegree(rad) {
    // computes degrees of an angle
    return (rad/Math.PI)*180;
}

function ecl(d) {
    // "obliquity of the ecliptic", i.e. the tilt of the Earth's axis of rotation
    return getRadians(23.4393 - 3.563E-7 * d);
}

const y_earth = 365.256;

/*  Class for the astrological elements and for updating them */

class astroElement {
    constructor(N, i, w, a, e, M, update) {
        this._N0 = modulateCircle(getRadians(N));                     // longitude of the ascending node
        this._i0 = modulateCircle(getRadians(i));                    // inclination to the ecliptic (plane of the Earth's orbit)
        this._w0 = modulateCircle(getRadians(w));                    // argument of perihelion
        this._a0 = a;                                // semi-major axis, or mean distance from Sun (set in AE, ideally)
        this._e0 = e;                                // eccentricity (0=circle, 0-1=ellipse, 1=parabola)
        this._M0 = modulateCircle(getRadians(M));                    // mean anomaly (0 at perihelion; increases uniformly with time)
        this._update = update;
        this.elementAt(0);
    }
    elementAt(d) {
        // update orbital elements
        this._N = modulateCircle(getRadians(this._N0 + this._update.N*d));
        this._i = modulateCircle(getRadians(this._i0 + this._update.i*d));
        this._w = modulateCircle(getRadians(this._w0 + this._update.w*d));
        this._a = this._a0 + this._update.a*d;
        this._e = this._e0 + this._update.e*d;
        this._M = modulateCircle(getRadians(this._M0 + this._update.M*d));
        // additional variables
        this._w1 = modulateCircle(this._N + this._w);         // longitude of perihelion
        this._L = modulateCircle(this._M + this._w1);         // mean longitude
        this._q = this._a*(1-Math.E);         // perihelion distance
        this._Q = this._a*(1+Math.E);         // aphelion distance
        this._P = Math.pow(this._a, 1.5);     // orbital period (years if a is in AU, astronomical units)
        this._T = d-this._M/(Math.PI*2)*y_earth*this._P;                                                    // time of perihelion
        this._E = modulateCircle(this._M + this._e*Math.sin(this._M) * (1 + this._e*Math.cos(this._M)));  // eccentric anomaly
    }
}

class sunElement extends astroElement {
    constructor(N, i, w, a, e, M, update) {
        super(N, i, w, a, e, M, update);
        this._type = "sun";
    }
    elementAt(d) {
        super.elementAt(d);
        this._x = Math.cos(this._E) - this._e;                      // x-coordinate on elliptic plane
        this._y = Math.sqrt(1-this._e*this._e) * Math.sin(this._E); // y-coordinate on elliptic plane
        this._r = Math.sqrt(this._y*this._y+this._x*this._x);       // distance from earth
        this._v = modulateCircle(Math.atan2(this._y, this._x));     // true anomaly (angle between position and perihelion)
        this._lon = modulateCircle(this._v + this._w);              // true longitude
        this._xs = this._r * Math.cos(this._lon);                   // ecliptic rectangular geocentric x-coordinate
        this._ys = this._r * Math.sin(this._lon);                   // ecliptic rectangular geocentric y-coordinate
        this._xe = this._xs;                                        // equitorial rectangular geocentric x-coordinate
        this._ye = this._ys * Math.cos(ecl(d));                     // equitorial rectangular geocentric y-coordinate
        this._ze = this._ys * Math.sin(ecl(d));                     // equitorial rectangular geocentric z-coordinate
        this._RA = modulateCircle(Math.atan2(this._ye, this._xe));  // Right Ascension
        this._Dec = modulateCircle(Math.atan2(this._ze, Math.sqrt(this._xe*this._xe+this._ye*this._ye))); // Declination
        this._Ls = modulateCircle(this._M + this._w)                // Mean longitude
    }
    get pos() {
        return {x: this._x, y: this._y};
    }
}

class planetElement extends astroElement {
    constructor(N, i, w, a, e, M, update) {
        super(N, i, w, a, e, M, update);
        this._type = "planet"
    }
    elementAt(d) {
        super.elementAt(d);
        if (Math.abs(this._e) > 0.05) {this.approxE();}                             // if orbit is elliptical, approximate bessel-function
        this._x = this._a * (Math.cos(this._E) - this._e);                          // x-coordinate on elliptic plane
        this._y = this._a * (Math.sqrt(1 - this._e*this._e) * Math.sin(this._E));   // y-coordinate on elliptic plane
        this._r = Math.sqrt(this._y*this._y+this._x*this._x);                       // distance from sun
        this._v = modulateCircle(Math.atan2(this._y, this._x));                     // true anomaly (angle between position and perihelion)
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
        } while (getDegree(Math.abs(delta)) > 0.001);   // calculate to accuracy of 0.001 degrees
        this._E = modulateCircle(E1);                   // if orbit is too parabolical (e≈1), this will not converge!
    }
    get pos() {
        return {x: this._x, y: this._y};
    }
}

/* Objects to store update parameters */

const sun_d = {
    N: 0.0,
    i: 0.0,
    w: 4.70935E-5,
    a: 0.0,
    e: -1.151E-9,
    M: 0.9856002585
}

const moon_d = {
    N: -0.0529538083,
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
    e: -1.302E-9,
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
    i: -1.557E-7,
    w: 1.64505E-5,
    a: 0.0,
    e: 4.469E-9,
    M: 0.0830853001
}

const saturn_d = {
    N: 2.38980E-5,
    i: -1.081E-7,
    w: 2.97661E-5,
    a: 0.0,
    e: -9.499E-9,
    M: 0.0334442282
}

const uranus_d = {
    N: 1.3978E-5,
    i: 1.9E-8,
    w: 3.0565E-5,
    a: -1.55E-8,
    e: 7.45E-9,
    M: 0.011725806
}

const neptune_d = {
    N: 3.0173E-5,
    i: -2.55E-7,
    w: -6.027E-6,
    a: 3.313E-8,
    e: 2.15E-9,
    M: 0.005995147
}

/* initializing astronomical elements */

const solarSystem = {
    sun: new sunElement(0.0, 0.0, 282.9404, 1.000000, 0.016709, 356.0470, sun_d),
    moon: new planetElement(125.1228, 5.1454, 318.0634, 60.2666*4.26352e-5, 0.054900, 115.3654, moon_d),
    mercury: new planetElement(48.3313, 7.0047, 29.1241, 0.387098, 0.205635, 168.6562, mercury_d),
    venus: new planetElement(76.6799, 3.3946, 54.8910, 0.723330, 0.006773, 48.0052, venus_d),
    mars: new planetElement(49.5574, 1.8497, 286.5016, 1.523688, 0.093405, 18.6021, mars_d),
    jupiter: new planetElement(100.4542, 1.3030, 273.8777, 5.20256, 0.048498, 19.8950, jupiter_d),
    saturn: new planetElement(113.6634, 2.4886, 339.3939, 9.55475, 0.055546, 316.9670, saturn_d),
    uranus: new planetElement(74.0005, 0.7733,  96.6612, 19.18171, 0.047318, 142.5905, uranus_d),
    neptune: new planetElement(131.7806, 1.7700, 272.8461, 30.05826, 0.008606, 260.2471, neptune_d)
}

/* functions for displaying the solar system */

function updateSolarSystem(d) {
    Object.keys(solarSystem).forEach(instance => {
        solarSystem[instance].elementAt(d);
    });
}

function position(scale) {
    Object.keys(solarSystem).forEach(instance => {
        document.getElementById(instance).style.top = solarSystem[instance].pos.y*scale+"px";
        document.getElementById(instance).style.left = solarSystem[instance].pos.x*scale+"px";
    });
}

function frame() {
    if (0) {
      clearInterval(id);
    } else if (d>=35000) {
        d = -35000;
    } else {
      d+=step;
      updateSolarSystem(d);
      position(scale);
      document.getElementById("d").innerHTML = Math.round(solarSystem.mars._T);
    }
  }

var anim = setInterval(frame, 10);

function drawOrbit(instance, dom, epoch=0, n=1000) {
    const T = instance._P*y_earth;
    var ellipse = [];
    for (let i = 0; i < n; i++) {
        instance.elementAt(epoch+i*T/n);
        ellipse.push(instance.pos);
    }
    var ctx = dom;
    var mars_orbit = new Chart(ctx, {
        type: 'scatter',
        data: ellipse,
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    /*const canvas = dom;
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width * 0.5, canvas.height * 0.5);

    // Draw the ellipse
    ctx.beginPath();
    ctx.ellipse(0, 0, 50, 75, Math.PI / 4, 0, 2 * Math.PI);
    ctx.stroke();*/
}

/* functions for html-interaction */

function updateScale() {
    document.getElementById("scale-form").value = scale;
}
function minusScale() {
    scale -= 10;
    updateScale();
}
function plusScale() {
    scale += 10;
    updateScale();
}
function updateStep() {
    document.getElementById("step-form").value = step;
}
function minusStep() {
    step--;
    updateStep();
}
function plusStep() {
    step++;
    updateStep();
}
function stopStep() {
    step = 0;
    updateStep();
}

function togglePlanet(name) {
    if (document.getElementById(name).style.visibility == 'hidden'){
        document.getElementById(name).style.visibility = 'visible';
    } else {
        document.getElementById(name).style.visibility = 'hidden';
    }
}

/* settings */ 

var d = -35000;

var scale = 20;
position(scale);
updateScale();
document.getElementById("scale-minus").addEventListener("click", minusScale);
document.getElementById("scale-plus").addEventListener("click", plusScale);
document.getElementById("scale-form").addEventListener("keyup", event => {
    if(event.key == "Enter") {// Check for Enter-key
    scale = Number(document.getElementById("scale-form").value);
    updateScale();
    } else {return;}
    event.preventDefault();
});
document.getElementById("step-minus").addEventListener("click", minusStep);
document.getElementById("step-plus").addEventListener("click", plusStep);
document.getElementById("step-form").addEventListener("keyup", event => {
    if(event.key == "Enter") {// Check for Enter-key
    step = Number(document.getElementById("step-form").value);
    updateStep();
    } else {return;}
    event.preventDefault();
});
drawOrbit(solarSystem.mars, document.getElementById('mars-orbit'), solarSystem.mars._T);

var step = 1;
updateStep();