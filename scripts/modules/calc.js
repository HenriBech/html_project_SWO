const Y = 365.256; // length of an earth-year in days

function div(a, b) {
    // Integer division
    return a/b>>0;
}

function modulateCircle(rad) {
    // modulo for angles in degrees
    return (rad % (2*Math.PI)) + (rad < 0 ? (2*Math.PI) : 0);
}

function getEpoch(y, m, D) {
    // computes days since 1.1.2000
    // doesn't work properly!
    y = Number(y), m = Number(m), D = Number(D);
    let date = new Date(y, m, D);
    let date0 = new Date(2000, 1, 1);
    let diff = Math.ceil((date - date0)/(1000 * 60 * 60 * 24));
    return diff;
}

function getDate(d) {
    let date = new Date('2000-01-01');
    date.setDate(date.getDate() + d);
    return [('0' + date.getDate()).slice(-2), ('0' + (date.getMonth()+1)).slice(-2), date.getFullYear()].join('.');
}

function getAU(D) {
    // returns the distance D (km) in AU
    return D/1.495978707e+8;
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

export default {Y, div, modulateCircle, getEpoch, getDate, getAU, getRadians, getDegree, ecl};