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
    // valid between 1900 and 2100
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

const Y = 365.256; // length of an earth-year in days

export { y_earth as Y, div, modulateCircle, getEpoch, getDegree, getRadians, ecl };